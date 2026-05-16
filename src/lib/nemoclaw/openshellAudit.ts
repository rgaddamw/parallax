import { enforceToolCall } from "@/lib/nemoclaw/engine";
import { matchPolicyRule } from "@/lib/nemoclaw/policyRules";
import type {
  EnforceToolResult,
  PolicyDomain,
  PolicyVerdict,
} from "@/lib/nemoclaw/types";

export type OpenShellDecision = "ALLOW" | "REQUIRE_APPROVAL" | "BLOCK";

export interface OpenShellAuditEntry {
  id: string;
  ts: number;
  agentName: string;
  requestedAction: string;
  resourceDomain: string;
  domain: PolicyDomain;
  policyRuleMatched: string;
  policyRuleKey: string;
  decision: OpenShellDecision;
  reason: string;
  tool: string;
  workflowContinues: boolean;
}

function uid() {
  return `os-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDecision(v: PolicyVerdict): OpenShellDecision {
  if (v === "allow") return "ALLOW";
  if (v === "require_approval") return "REQUIRE_APPROVAL";
  return "BLOCK";
}

export function enforceAndLog(input: {
  tool: string;
  intent?: string;
  agent?: string;
  targetUrl?: string;
  approvedTools?: Set<string>;
  workflowContinues?: boolean;
}): { result: EnforceToolResult; openShell: OpenShellAuditEntry } {
  const result = enforceToolCall(
    {
      tool: input.tool,
      intent: input.intent,
      agent: input.agent,
      targetUrl: input.targetUrl,
    },
    { approvedTools: input.approvedTools },
  );

  const matched = matchPolicyRule(
    result.evaluation.domain,
    result.evaluation.action,
  );

  const blocked = result.evaluation.denied;
  const workflowContinues = input.workflowContinues ?? !blocked;

  const reason = blocked
    ? `Unsafe action intercepted by NemoClaw policy. ${result.evaluation.reason}`
    : result.evaluation.requiresApproval
      ? `Awaiting human approval. ${result.evaluation.reason}`
      : result.evaluation.reason;

  const openShell: OpenShellAuditEntry = {
    id: uid(),
    ts: Date.now(),
    agentName: input.agent ?? result.evaluation.tool,
    requestedAction: result.evaluation.action,
    resourceDomain: result.evaluation.domain.replace(/_/g, " "),
    domain: result.evaluation.domain,
    policyRuleMatched: matched.label,
    policyRuleKey: matched.ruleKey,
    decision: toDecision(result.evaluation.verdict),
    reason,
    tool: result.evaluation.tool,
    workflowContinues,
  };

  return { result, openShell };
}
