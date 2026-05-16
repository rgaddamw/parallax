import { DEFAULT_NEMOCLAW_POLICY } from "@/lib/nemoclaw/defaultPolicy";
import { resolveToolBinding } from "@/lib/nemoclaw/registry";
import type {
  EnforceToolResult,
  NemoClawPolicyBundle,
  PolicyDomain,
  PolicyEvaluationResult,
  PolicyVerdict,
  SecurityAuditEntry,
  ToolPolicyBinding,
} from "@/lib/nemoclaw/types";

function uid() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const UNSAFE_ACTION_INTERCEPTED =
  "Unsafe action intercepted by NemoClaw policy.";

export const ALLOWED_BY_NEMOCLAW = "Allowed by NemoClaw policy layer.";

function normalizePolicyUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function hostFromUrl(url: string): string | null {
  try {
    const withScheme = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function isTrustedNetworkHost(
  host: string,
  bundle?: NemoClawPolicyBundle,
): boolean {
  const policy = bundle ?? DEFAULT_NEMOCLAW_POLICY;
  return policy.trusted_domains.some(
    (d) => host === d || host.endsWith(`.${d}`),
  );
}

export function isTrustedNetworkUrl(
  url: string,
  bundle?: NemoClawPolicyBundle,
): boolean {
  const policy = bundle ?? DEFAULT_NEMOCLAW_POLICY;
  const normalized = normalizePolicyUrl(url);

  for (const trusted of policy.trusted_urls ?? []) {
    const t = normalizePolicyUrl(trusted);
    if (normalized === t || normalized.startsWith(`${t}/`)) {
      return true;
    }
  }

  const host = hostFromUrl(url);
  return host ? isTrustedNetworkHost(host, policy) : false;
}

function applyNetworkUrlPolicy(
  evaluation: PolicyEvaluationResult,
  binding: ToolPolicyBinding,
  targetUrl: string | undefined,
  bundle: NemoClawPolicyBundle,
): PolicyEvaluationResult {
  if (binding.domain !== "network_api") return evaluation;

  if (binding.action === "outbound_untrusted_domain") {
    return {
      ...evaluation,
      verdict: "block",
      denied: true,
      denyMessage: bundle.deny_message,
      requiresApproval: false,
      reason: targetUrl
        ? `Outbound request to untrusted domain blocked: ${targetUrl}`
        : `Action "${binding.action}" is explicitly blocked in domain network_api.`,
    };
  }

  if (evaluation.verdict !== "allow") return evaluation;
  if (!targetUrl) return evaluation;

  if (isTrustedNetworkUrl(targetUrl, bundle)) {
    return {
      ...evaluation,
      reason: `Permitted NVIDIA endpoint ${targetUrl} for "${binding.action}".`,
    };
  }

  return {
    ...evaluation,
    verdict: "block",
    denied: true,
    denyMessage: bundle.deny_message,
    requiresApproval: false,
    reason: `URL not in trusted_urls / trusted_domains: ${targetUrl}`,
  };
}

function verdictForAction(
  bundle: NemoClawPolicyBundle,
  domain: PolicyDomain,
  action: string,
): { verdict: PolicyVerdict; reason: string } {
  const rules = bundle.domains[domain];
  if (rules.block.includes(action)) {
    return {
      verdict: "block",
      reason: `Action "${action}" is explicitly blocked in domain ${domain}.`,
    };
  }
  if (rules.require_approval.includes(action)) {
    return {
      verdict: "require_approval",
      reason: `Action "${action}" requires human approval in domain ${domain}.`,
    };
  }
  if (rules.allow.includes(action)) {
    return {
      verdict: "allow",
      reason: `Action "${action}" is allow-listed in domain ${domain}.`,
    };
  }
  return {
    verdict: "block",
    reason: `Action "${action}" is not allow-listed in domain ${domain} (default deny).`,
  };
}

export function evaluatePolicy(
  binding: ToolPolicyBinding,
  bundle?: NemoClawPolicyBundle,
): PolicyEvaluationResult {
  const policy = bundle ?? DEFAULT_NEMOCLAW_POLICY;
  const { verdict, reason } = verdictForAction(
    policy,
    binding.domain,
    binding.action,
  );

  const denied = verdict === "block";
  let result: PolicyEvaluationResult = {
    verdict,
    tool: binding.tool,
    action: binding.action,
    domain: binding.domain,
    reason,
    denied,
    denyMessage: denied ? policy.deny_message : null,
    requiresApproval: verdict === "require_approval",
  };

  return result;
}

export function evaluatePolicyWithUrl(
  binding: ToolPolicyBinding,
  targetUrl?: string,
  bundle?: NemoClawPolicyBundle,
): PolicyEvaluationResult {
  const policy = bundle ?? DEFAULT_NEMOCLAW_POLICY;
  let result = evaluatePolicy(binding, policy);
  result = applyNetworkUrlPolicy(result, binding, targetUrl, policy);
  if (result.verdict === "block") {
    result.denied = true;
    result.denyMessage = policy.deny_message;
    result.requiresApproval = false;
  }
  return result;
}

function auditKindForVerdict(
  verdict: PolicyVerdict,
  phase: "evaluation" | "execution",
): SecurityAuditEntry["kind"] {
  if (phase === "evaluation") return "policy_evaluation";
  if (verdict === "allow") return "approved";
  if (verdict === "block") return "blocked";
  return "pending_approval";
}

export function createAuditEntry(
  evaluation: PolicyEvaluationResult,
  opts: {
    kind?: SecurityAuditEntry["kind"];
    agent?: string;
    detail?: string;
    intent?: string;
  } = {},
): SecurityAuditEntry {
  const kind =
    opts.kind ??
    auditKindForVerdict(evaluation.verdict, evaluation.denied ? "evaluation" : "execution");

  let message = evaluation.reason;
  if (evaluation.denied && evaluation.denyMessage) {
    message = `${UNSAFE_ACTION_INTERCEPTED} ${evaluation.reason}`;
  } else if (evaluation.requiresApproval) {
    message = `Pending approval: ${evaluation.reason}`;
  } else if (kind === "approved" || evaluation.verdict === "allow") {
    message = `${ALLOWED_BY_NEMOCLAW} ${evaluation.reason}`;
  }

  return {
    id: uid(),
    ts: Date.now(),
    kind,
    tool: evaluation.tool,
    action: evaluation.action,
    domain: evaluation.domain,
    verdict: evaluation.verdict,
    message,
    agent: opts.agent,
    detail: opts.detail ?? opts.intent,
  };
}

export function enforceToolCall(
  input: {
    tool: string;
    intent?: string;
    agent?: string;
    /** When set, network_api tools must target a trusted_urls / trusted_domains endpoint */
    targetUrl?: string;
  },
  opts?: {
    bundle?: NemoClawPolicyBundle;
    /** Session has human-approved this tool for demo */
    approvedTools?: Set<string>;
  },
): EnforceToolResult {
  const binding = resolveToolBinding(input.tool, input.intent);
  if (input.agent) binding.agent = input.agent;

  const evaluation = evaluatePolicyWithUrl(
    binding,
    input.targetUrl,
    opts?.bundle,
  );

  if (
    evaluation.requiresApproval &&
    opts?.approvedTools?.has(binding.tool)
  ) {
    evaluation.verdict = "allow";
    evaluation.requiresApproval = false;
    evaluation.denied = false;
    evaluation.denyMessage = null;
    evaluation.reason = `Human approval granted for ${binding.tool}.`;
  }

  const mayExecute =
    evaluation.verdict === "allow" ||
    (evaluation.verdict === "require_approval" && false);

  const audit = createAuditEntry(evaluation, {
    kind: evaluation.denied
      ? "blocked"
      : evaluation.requiresApproval
        ? "pending_approval"
        : evaluation.verdict === "allow"
          ? "approved"
          : "policy_evaluation",
    agent: binding.agent,
    intent: binding.intent,
    detail: input.targetUrl ?? binding.intent,
  });

  if (evaluation.denied) {
    audit.kind = "blocked";
    audit.message = `${UNSAFE_ACTION_INTERCEPTED} ${evaluation.reason}`;
  } else if (evaluation.verdict === "allow") {
    audit.kind = "approved";
    audit.message = `${ALLOWED_BY_NEMOCLAW} ${evaluation.reason}`;
  }

  return { evaluation, audit, mayExecute };
}

export function logToolCallAttempt(
  binding: ToolPolicyBinding,
): SecurityAuditEntry {
  return {
    id: uid(),
    ts: Date.now(),
    kind: "tool_call",
    tool: binding.tool,
    action: binding.action,
    domain: binding.domain,
    verdict: "allow",
    message: `Tool invoked: ${binding.tool}`,
    agent: binding.agent,
    detail: binding.intent,
  };
}

/** Back-compat for legacy imports */
export function evaluateToolPolicy(
  toolName: string,
  intent: string,
): { verdict: "allowed" | "requires_approval" | "blocked"; tool: string; reason: string } {
  const r = enforceToolCall({ tool: toolName, intent });
  const map = {
    allow: "allowed" as const,
    require_approval: "requires_approval" as const,
    block: "blocked" as const,
  };
  return {
    verdict: map[r.evaluation.verdict],
    tool: toolName,
    reason: r.evaluation.denied
      ? `${UNSAFE_ACTION_INTERCEPTED} ${r.evaluation.reason}`
      : r.evaluation.reason,
  };
}

export const DENIED_BY_NEMOCLAW = "Denied by NemoClaw policy layer.";
