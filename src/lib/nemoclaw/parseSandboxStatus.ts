/** Strip ANSI/terminal color codes from nemoclaw CLI output. */
export function stripAnsi(text: string): string {
  return text
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\[[0-9;]*m/g, "")
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

export interface ParsedSandboxStatus {
  healthy: boolean;
  phase: string | null;
  inferenceHealthy: boolean;
  gatewayHealthy: boolean;
  policyLoaded: boolean;
  openclawVersion: string | null;
  openshellVersion: string | null;
  openshellDriver: string | null;
  policyRevision: string | null;
  policyVersion: string | null;
  gatewayDown: boolean;
  model: string | null;
  provider: string | null;
  deploymentVerified: boolean;
}

/** Parse `nemoclaw <sandbox> status` text output (ANSI-safe). */
export function parseSandboxStatusOutput(rawStdout: string): ParsedSandboxStatus {
  const stdout = stripAnsi(rawStdout);
  const lower = stdout.toLowerCase();

  const phase =
    stdout.match(/Phase:\s*([A-Za-z0-9_-]+)/i)?.[1] ??
    stdout.match(/phase[:\s]+ready/i)
      ? "Ready"
      : null;

  const inferenceHealthy = /Inference:\s*healthy/i.test(stdout);
  const phaseReady =
    phase?.toLowerCase() === "ready" || /\bphase[:\s]+ready\b/i.test(stdout);

  const openclawVersion =
    stdout.match(/OpenClaw\s+v([\d.]+)/i)?.[1] ??
    stdout.match(/Agent:\s*OpenClaw\s+v([\d.]+)/i)?.[1] ??
    null;

  const openshellVersion = stdout.match(/OpenShell:\s*([\d.]+)/i)?.[1] ?? null;
  const openshellDriver =
    stdout.match(/OpenShell:\s*[\d.]+\s*\((\w+)\)/i)?.[1] ?? null;

  const policyRevision = stdout.match(/Revision:\s*(\d+)/i)?.[1] ?? null;
  const policyVersion =
    stdout.match(/Policy:[\s\S]*?version:\s*(\d+)/i)?.[1] ?? policyRevision;

  const gatewayDown = /gateway:\s*down/i.test(lower);

  const model =
    stdout.match(/^\s*Model:\s+(\S+)/im)?.[1] ??
    stdout.match(/Model:\s+([^\n]+)/i)?.[1]?.trim() ??
    null;

  const provider = stdout.match(/Provider:\s*(\S+)/i)?.[1] ?? null;

  const policyLoaded = Boolean(
    policyRevision || policyVersion || /filesystem_policy:/i.test(stdout),
  );

  const gatewayHealthy =
    !gatewayDown &&
    phaseReady &&
    inferenceHealthy &&
    Boolean(openshellVersion);

  const deploymentVerified =
    phaseReady &&
    inferenceHealthy &&
    gatewayHealthy &&
    Boolean(model) &&
    Boolean(openclawVersion);

  const healthy = deploymentVerified && policyLoaded;

  return {
    healthy,
    phase,
    inferenceHealthy,
    gatewayHealthy,
    policyLoaded,
    openclawVersion,
    openshellVersion,
    openshellDriver,
    policyRevision,
    policyVersion,
    gatewayDown,
    model,
    provider,
    deploymentVerified,
  };
}
