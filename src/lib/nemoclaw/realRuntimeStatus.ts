/** Status for each step of local NemoClaw CLI / OpenShell onboarding. */
export type RuntimeStepState = "ok" | "partial" | "blocked" | "pending" | "inactive";

export type RuntimeStatusLabel = "ACTIVE" | "HEALTHY" | "INACTIVE" | "PARTIAL";

export interface RuntimeStep {
  id: string;
  label: string;
  state: RuntimeStepState;
  detail: string;
  statusLabel?: RuntimeStatusLabel;
}

export type NemoclawConnectionState = "connected" | "partial" | "unavailable";

export interface ProbeSummary {
  ok: boolean;
  code: number | null;
  stdoutPreview: string;
  stderrPreview: string;
  error: string | null;
}

export interface LiveRuntimeDetails {
  sandboxName: string;
  sandboxStatus: RuntimeStatusLabel;
  openshellGateway: RuntimeStatusLabel;
  policyRuntime: RuntimeStatusLabel;
  inferenceModel: string;
  openclawVersion: string | null;
  openshellVersion: string | null;
  policyVersions: { name: string; version: string; revision?: string }[];
  activeEgressControls: string[];
  trustedDomains: string[];
  trustedUrls: string[];
  sandboxIsolation: string;
  gatewayHealth: string;
}

export interface RealNemoclawRuntimeStatus {
  snapshotLabel: string;
  updatedAt: string;
  probedAt?: string;
  cliInstalled: boolean;
  dockerActive: boolean;
  openshellGatewayStarted: boolean;
  nemotronProviderConfigured: boolean;
  nemotronModel: string;
  sandboxBuildAttempted: boolean;
  sandboxRunning: boolean;
  liveSandboxActive: boolean;
  sandboxBlockedReason: string | null;
  lastError: string | null;
  connectionState: NemoclawConnectionState;
  connectionHeadline: string;
  connectedMessage: string | null;
  demoPolicyFallbackActive: boolean;
  demoPolicyFallbackMessage: string | null;
  deploymentVerifiedMessage?: string | null;
  runtimeBadges?: string[];
  nemotronActive?: boolean;
  registeredSandboxCount?: number;
  defaultSandbox?: string | null;
  statusLabels?: {
    sandbox: RuntimeStatusLabel;
    gateway: RuntimeStatusLabel;
    policy: RuntimeStatusLabel;
    inference: string;
  };
  liveRuntime?: LiveRuntimeDetails | null;
  steps: RuntimeStep[];
  integrationNote: string;
  dualRuntimeCopy: string;
  probes?: {
    cliHelp: ProbeSummary;
    dockerPs: ProbeSummary;
    nemoclawStatus: ProbeSummary | null;
    nemoclawList: ProbeSummary | null;
    sandboxStatus: ProbeSummary | null;
  };
}

export const LIVE_SANDBOX_CONNECTED_MESSAGE =
  "Parallax is connected to a live NemoClaw/OpenShell sandbox.";

export const DUAL_RUNTIME_COPY_CONNECTED =
  "Parallax is operating against a live NemoClaw/OpenShell sandbox — policy, egress, and agent tools execute inside isolated OpenClaw runtime boundaries.";

export const DUAL_RUNTIME_COPY =
  "Parallax mirrors NemoClaw policy enforcement in-app for demo reliability, while remaining designed to run inside the real NemoClaw/OpenShell sandbox once onboarding completes.";

export const DEMO_POLICY_FALLBACK_MESSAGE =
  "Demo policy layer active while real NemoClaw sandbox is unavailable.";

export const INTEGRATION_NOTE =
  "Runtime status is probed live from the host running the Next.js server via GET /api/nemoclaw/runtime.";

/** Client-only fallback when the runtime API is unreachable (does not claim CLI success). */
export function offlineRuntimeFallback(): RealNemoclawRuntimeStatus {
  return {
    snapshotLabel: "API unreachable",
    updatedAt: new Date().toISOString(),
    cliInstalled: false,
    dockerActive: false,
    openshellGatewayStarted: false,
    nemotronProviderConfigured: false,
    nemotronModel: "unknown",
    sandboxBuildAttempted: false,
    sandboxRunning: false,
    liveSandboxActive: false,
    sandboxBlockedReason: null,
    lastError: "Could not reach /api/nemoclaw/runtime — start the dev server and refresh.",
    connectionState: "unavailable",
    connectionHeadline: "Runtime status unknown",
    connectedMessage: null,
    demoPolicyFallbackActive: true,
    demoPolicyFallbackMessage: DEMO_POLICY_FALLBACK_MESSAGE,
    integrationNote:
      "Embedded offline placeholder — click Refresh Runtime Status after the dev server is running.",
    dualRuntimeCopy: DUAL_RUNTIME_COPY,
    registeredSandboxCount: 0,
    liveRuntime: null,
    steps: [
      {
        id: "cli",
        label: "CLI installed",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
      {
        id: "docker",
        label: "Docker running",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
      {
        id: "openshell",
        label: "OpenShell gateway",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
      {
        id: "sandbox",
        label: "Sandbox status",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
      {
        id: "policy",
        label: "Policy runtime",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
      {
        id: "nemotron",
        label: "Inference",
        state: "inactive",
        detail: "Not probed — API unreachable.",
      },
    ],
  };
}

/** @deprecated Use probeRealNemoclawRuntime via /api/nemoclaw/runtime */
export function defaultRealRuntimeStatus(): RealNemoclawRuntimeStatus {
  return offlineRuntimeFallback();
}

/** @deprecated Use probeRealNemoclawRuntime */
export function loadRealRuntimeStatus(): RealNemoclawRuntimeStatus {
  return offlineRuntimeFallback();
}
