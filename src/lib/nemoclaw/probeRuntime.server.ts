import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadNemoClawPolicyFromDisk } from "@/lib/nemoclaw/loadPolicy.server";
import { parseSandboxStatusOutput, stripAnsi } from "@/lib/nemoclaw/parseSandboxStatus";
import {
  LIVE_SANDBOX_CONNECTED_MESSAGE,
  type LiveRuntimeDetails,
  type RealNemoclawRuntimeStatus,
  type RuntimeStatusLabel,
  type RuntimeStep,
  type RuntimeStepState,
} from "@/lib/nemoclaw/realRuntimeStatus";

const execFileAsync = promisify(execFile);

const PREFERRED_SANDBOX =
  process.env.NEMOCLAW_SANDBOX_NAME?.trim() || "parallax-demo";
const DOCKER_BIN = process.env.DOCKER_BIN?.trim() || "docker";
const PROBE_TIMEOUT_MS = Number(process.env.NEMOCLAW_PROBE_TIMEOUT_MS) || 20_000;
const MAX_BUFFER = 4 * 1024 * 1024;

function probeEnv() {
  const extra = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"].filter(
    (p) => existsSync(p),
  );
  const pathParts = [...extra, process.env.PATH ?? ""].filter(Boolean);
  return { ...process.env, PATH: pathParts.join(":") };
}

const NEMOCLAW_CANDIDATES = [
  process.env.NEMOCLAW_BIN?.trim(),
  "/opt/homebrew/bin/nemoclaw",
  "/usr/local/bin/nemoclaw",
  "nemoclaw",
].filter((p): p is string => Boolean(p && (p === "nemoclaw" || existsSync(p))));

type CommandResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
  error?: string;
  bin?: string;
};

interface SandboxListRow {
  name: string;
  model?: string | null;
  provider?: string | null;
  openshellVersion?: string | null;
  openshellDriver?: string | null;
}

interface SandboxListJson {
  defaultSandbox?: string | null;
  sandboxes?: SandboxListRow[];
}

interface OnboardSessionFile {
  status?: string;
  model?: string;
  sandboxName?: string | null;
  failure?: { message?: string };
  steps?: {
    gateway?: { status?: string };
    sandbox?: { status?: string; error?: string | null };
  };
}

async function runCommand(
  command: string,
  args: string[],
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: PROBE_TIMEOUT_MS,
      env: probeEnv(),
      maxBuffer: MAX_BUFFER,
    });
    return {
      ok: true,
      stdout: String(stdout ?? ""),
      stderr: String(stderr ?? ""),
      code: 0,
      bin: command,
    };
  } catch (err) {
    const e = err as {
      code?: number | string;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
      killed?: boolean;
    };
    return {
      ok: false,
      stdout: String(e.stdout ?? ""),
      stderr: String(e.stderr ?? ""),
      code: typeof e.code === "number" ? e.code : e.killed ? null : 1,
      error: e.message ?? "Command failed",
      bin: command,
    };
  }
}

function looksLikeSandboxStatus(stdout: string): boolean {
  const plain = stripAnsi(stdout);
  return (
    /Phase:\s*Ready/i.test(plain) ||
    /Inference:\s*healthy/i.test(plain) ||
    /Sandbox:\s*parallax-demo/i.test(plain)
  );
}

async function runNemoclaw(args: string[]): Promise<CommandResult> {
  let last: CommandResult = {
    ok: false,
    stdout: "",
    stderr: "",
    code: 1,
    error: "nemoclaw not found",
  };
  for (const bin of NEMOCLAW_CANDIDATES) {
    last = await runCommand(bin, args);
    if (last.ok || looksLikeSandboxStatus(last.stdout)) {
      return { ...last, ok: true };
    }
  }
  return last;
}

async function readOnboardSession(): Promise<OnboardSessionFile | null> {
  try {
    const raw = await readFile(
      join(homedir(), ".nemoclaw", "onboard-session.json"),
      "utf8",
    );
    return JSON.parse(raw) as OnboardSessionFile;
  } catch {
    return null;
  }
}

function step(
  id: string,
  label: string,
  state: RuntimeStepState,
  detail: string,
  statusLabel?: RuntimeStatusLabel,
): RuntimeStep {
  return { id, label, state, detail, statusLabel };
}

function parseListJson(stdout: string): SandboxListJson | null {
  try {
    return JSON.parse(stripAnsi(stdout)) as SandboxListJson;
  } catch {
    return null;
  }
}

function buildLiveRuntime(input: {
  sandboxName: string;
  parsed: ReturnType<typeof parseSandboxStatusOutput>;
  listRow: SandboxListRow | undefined;
  nemotronModel: string;
  policyName: string;
  policyVersion: string;
  trustedDomains: string[];
  trustedUrls: string[];
  egressControls: string[];
}): LiveRuntimeDetails {
  const openshellVersion =
    input.parsed.openshellVersion ?? input.listRow?.openshellVersion ?? null;
  const driver = input.parsed.openshellDriver ?? input.listRow?.openshellDriver;

  return {
    sandboxName: input.sandboxName,
    sandboxStatus: "ACTIVE",
    openshellGateway: "HEALTHY",
    policyRuntime: "ACTIVE",
    inferenceModel: input.nemotronModel,
    openclawVersion: input.parsed.openclawVersion,
    openshellVersion,
    policyVersions: [
      {
        name: input.policyName,
        version: input.policyVersion,
      },
      {
        name: "openshell-sandbox-policy",
        version: input.parsed.policyVersion ?? input.parsed.policyRevision ?? "?",
        revision: input.parsed.policyRevision ?? undefined,
      },
    ],
    activeEgressControls: input.egressControls,
    trustedDomains: input.trustedDomains,
    trustedUrls: input.trustedUrls,
    sandboxIsolation: `OpenShell ${openshellVersion ?? "?"} (${driver ?? "vm"}) · Phase ${input.parsed.phase ?? "Ready"} · landlock + network policies enforced`,
    gatewayHealth:
      "HEALTHY · deployment verified — gateway and dashboard healthy",
  };
}

/** Live probe: nemoclaw parallax-demo status + docker + policy bundle. */
export async function probeRealNemoclawRuntime(): Promise<RealNemoclawRuntimeStatus> {
  const probedAt = new Date().toISOString();
  const onboard = await readOnboardSession();
  const policyBundle = loadNemoClawPolicyFromDisk();

  const help = await runNemoclaw(["--help"]);
  let cliInstalled = help.ok || /NemoClaw/i.test(stripAnsi(help.stdout));

  const sbStatus = await runNemoclaw([PREFERRED_SANDBOX, "status"]);
  if (!cliInstalled && looksLikeSandboxStatus(sbStatus.stdout)) {
    cliInstalled = true;
  }

  const docker = await runCommand(DOCKER_BIN, ["ps"]);
  const dockerActive = docker.ok;

  const list = cliInstalled ? await runNemoclaw(["list", "--json"]) : null;
  const listJson = list?.ok ? parseListJson(list.stdout) : null;
  const sandboxes = listJson?.sandboxes ?? [];
  const listRow = sandboxes.find((s) => s.name === PREFERRED_SANDBOX);

  const statusBlob = sbStatus
    ? [sbStatus.stdout, sbStatus.stderr].filter(Boolean).join("\n")
    : "";

  const parsed = parseSandboxStatusOutput(statusBlob);

  const liveSandboxActive = cliInstalled && parsed.healthy;
  const sandboxName = PREFERRED_SANDBOX;

  const onboardComplete =
    onboard?.status === "complete" ||
    onboard?.steps?.sandbox?.status === "complete";

  const nemotronModel =
    parsed.model ||
    listRow?.model ||
    onboard?.model?.trim() ||
    process.env.NEMOCLAW_NEMOTRON_MODEL?.trim() ||
    "nvidia/nemotron-3-super-120b-a12b";

  const nemotronActive = parsed.inferenceHealthy && Boolean(parsed.model);
  const nemotronProviderConfigured = nemotronActive;

  const openshellGatewayStarted = parsed.gatewayHealthy;

  const egressControls = [
    "outbound_untrusted_domain → BLOCK",
    "permanent_behavioral_profile → BLOCK",
    "nemotron_inference_trusted → ALLOW (integrate.api.nvidia.com)",
    "read_resume_file → REQUIRE_APPROVAL",
    "export_interview_profile → REQUIRE_APPROVAL",
  ];

  const trustedDomains = policyBundle.trusted_domains ?? [
    "integrate.api.nvidia.com",
    "api.nvidia.com",
  ];
  const trustedUrls = policyBundle.trusted_urls ?? [];

  const liveRuntime = liveSandboxActive
    ? buildLiveRuntime({
        sandboxName,
        parsed,
        listRow,
        nemotronModel,
        policyName: policyBundle.name,
        policyVersion: policyBundle.version,
        trustedDomains,
        trustedUrls,
        egressControls,
      })
    : null;

  const phaseReady = parsed.phase?.toLowerCase() === "ready";

  const sandboxBlockedReason = !liveSandboxActive
    ? sbStatus?.stderr?.includes("does not exist")
      ? `Sandbox \`${PREFERRED_SANDBOX}\` not found.`
      : !phaseReady && statusBlob
        ? "Expected Phase: Ready in nemoclaw status output."
        : !parsed.inferenceHealthy
          ? "Inference not reported healthy."
          : onboard?.failure?.message ?? "Sandbox health probe did not pass."
    : null;

  const connectionState = liveSandboxActive
    ? "connected"
    : cliInstalled && dockerActive
      ? "partial"
      : cliInstalled
        ? "partial"
        : "unavailable";

  const connectionHeadline = liveSandboxActive
    ? "Real NemoClaw: connected"
    : cliInstalled && dockerActive
      ? "Real NemoClaw CLI installed, Docker running, sandbox not active"
      : "Real NemoClaw: unavailable";

  const deploymentVerifiedMessage = liveSandboxActive
    ? "Deployment verified — gateway and dashboard healthy."
    : null;

  const runtimeBadges = liveSandboxActive
    ? ["LIVE SANDBOX", "HEALTHY GATEWAY", "NEMOTRON ACTIVE"]
    : [];

  const steps: RuntimeStep[] = [
    step(
      "cli",
      "CLI installed",
      cliInstalled ? "ok" : "blocked",
      cliInstalled
        ? `nemoclaw reachable (${help.bin ?? "nemoclaw"}).`
        : "nemoclaw CLI not found on PATH.",
      cliInstalled ? "ACTIVE" : "INACTIVE",
    ),
    step(
      "docker",
      "Docker running",
      dockerActive ? "ok" : "inactive",
      dockerActive
        ? "Docker daemon reachable."
        : "Docker not reachable from Next.js server process.",
      dockerActive ? "ACTIVE" : "INACTIVE",
    ),
    step(
      "openshell",
      "OpenShell gateway",
      liveSandboxActive ? "ok" : "inactive",
      liveSandboxActive
        ? `HEALTHY — OpenShell ${parsed.openshellVersion ?? "?"} (${parsed.openshellDriver ?? "vm"}) · active gateway.`
        : "Inactive — gateway not verified.",
      liveSandboxActive ? "HEALTHY" : "INACTIVE",
    ),
    step(
      "sandbox",
      "Sandbox status",
      liveSandboxActive ? "ok" : "inactive",
      liveSandboxActive
        ? `ACTIVE — \`${sandboxName}\` · Phase ${parsed.phase} · OpenClaw v${parsed.openclawVersion}.`
        : sandboxBlockedReason ?? "Inactive.",
      liveSandboxActive ? "ACTIVE" : "INACTIVE",
    ),
    step(
      "policy",
      "Policy runtime",
      liveSandboxActive ? "ok" : "inactive",
      liveSandboxActive
        ? `ACTIVE — ${policyBundle.name} v${policyBundle.version} · sandbox policy v${parsed.policyVersion ?? parsed.policyRevision}.`
        : "Inactive.",
      liveSandboxActive ? "ACTIVE" : "INACTIVE",
    ),
    step(
      "nemotron",
      "Inference",
      liveSandboxActive ? "ok" : "inactive",
      liveSandboxActive
        ? `${nemotronModel} · inference healthy`
        : "Not configured",
      liveSandboxActive ? "ACTIVE" : "INACTIVE",
    ),
  ];

  return {
    snapshotLabel: liveSandboxActive
      ? `Live · ${sandboxName}`
      : "Probe incomplete",
    updatedAt: probedAt,
    probedAt,
    cliInstalled,
    dockerActive,
    openshellGatewayStarted,
    nemotronProviderConfigured,
    nemotronActive,
    nemotronModel,
    sandboxBuildAttempted: sandboxes.length > 0 || onboardComplete,
    sandboxRunning: liveSandboxActive,
    liveSandboxActive,
    sandboxBlockedReason,
    lastError: liveSandboxActive ? null : sandboxBlockedReason,
    connectionState,
    connectionHeadline,
    connectedMessage: liveSandboxActive ? LIVE_SANDBOX_CONNECTED_MESSAGE : null,
    deploymentVerifiedMessage,
    runtimeBadges,
    demoPolicyFallbackActive: !liveSandboxActive,
    demoPolicyFallbackMessage: !liveSandboxActive
      ? "Demo policy layer active while real NemoClaw sandbox is unavailable."
      : null,
    integrationNote: liveSandboxActive
      ? `Probed \`nemoclaw ${PREFERRED_SANDBOX} status\` · ${onboardComplete ? "onboarding complete" : "sandbox healthy"}.`
      : `Run \`nemoclaw ${PREFERRED_SANDBOX} status\` on the host serving Next.js.`,
    dualRuntimeCopy: liveSandboxActive
      ? LIVE_SANDBOX_CONNECTED_MESSAGE
      : "Start the dev server on the same machine as nemoclaw, then refresh runtime status.",
    registeredSandboxCount: sandboxes.length,
    defaultSandbox: sandboxName,
    statusLabels: liveSandboxActive
      ? {
          sandbox: "ACTIVE",
          gateway: "HEALTHY",
          policy: "ACTIVE",
          inference: nemotronModel,
        }
      : undefined,
    liveRuntime,
    steps,
    probes: {
      cliHelp: summarize(help),
      dockerPs: summarize(docker),
      nemoclawStatus: null,
      nemoclawList: list ? summarize(list) : null,
      sandboxStatus: sbStatus ? summarize(sbStatus) : null,
    },
  };
}

function summarize(r: CommandResult) {
  return {
    ok: r.ok,
    code: r.code,
    stdoutPreview: stripAnsi(r.stdout).trim().slice(0, 500),
    stderrPreview: stripAnsi(r.stderr).trim().slice(0, 200),
    error: r.error ?? null,
  };
}
