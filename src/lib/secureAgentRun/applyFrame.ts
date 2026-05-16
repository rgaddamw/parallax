import type { InterviewSessionState } from "@/types/sessionState";
import type { OpenShellAuditEntry } from "@/lib/nemoclaw/openshellAudit";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import type { ActivityEvent } from "@/agents/types";

export type SecureAgentFrame = {
  delayMs: number;
  label: string;
  patch: {
    step?: "live" | "replay";
    isOrchestrating?: boolean;
    answerDraft?: string;
    currentQuestion?: string;
    appendOpenShell?: OpenShellAuditEntry[];
    appendSecurity?: SecurityAuditEntry[];
    appendEvents?: ActivityEvent[];
    showJudgeSummary?: boolean;
    approvedTools?: string[];
    memoryTrust?: number;
  };
};

export function applySecureAgentFrame(
  prev: InterviewSessionState,
  frame: SecureAgentFrame,
): InterviewSessionState {
  const p = frame.patch;
  let next: InterviewSessionState = { ...prev };

  if (p.step !== undefined) next.step = p.step;
  if (p.isOrchestrating !== undefined) next.isOrchestrating = p.isOrchestrating;
  if (p.answerDraft !== undefined) next.answerDraft = p.answerDraft;
  if (p.currentQuestion !== undefined) next.currentQuestion = p.currentQuestion;
  if (p.showJudgeSummary !== undefined) {
    next.showNemoclawJudgeSummary = p.showJudgeSummary;
  }
  if (p.approvedTools !== undefined) {
    next.approvedTools = p.approvedTools;
  }
  if (p.memoryTrust !== undefined && next.memory) {
    next.memory = { ...next.memory, trustScore: p.memoryTrust };
  }
  if (p.appendOpenShell?.length) {
    next.openShellAudit = [...next.openShellAudit, ...p.appendOpenShell];
    next.securityAudit = [
      ...next.securityAudit,
      ...p.appendOpenShell.map(openShellToSecurity),
    ];
  }
  if (p.appendSecurity?.length) {
    next.securityAudit = [...next.securityAudit, ...p.appendSecurity];
  }
  if (p.appendEvents?.length) {
    next.activityEvents = [...next.activityEvents, ...p.appendEvents];
  }

  return next;
}

function openShellToSecurity(e: OpenShellAuditEntry): SecurityAuditEntry {
  const kind =
    e.decision === "BLOCK"
      ? "blocked"
      : e.decision === "REQUIRE_APPROVAL"
        ? "pending_approval"
        : "approved";

  return {
    id: e.id,
    ts: e.ts,
    kind,
    tool: e.tool,
    action: e.requestedAction,
    domain: e.domain,
    verdict:
      e.decision === "ALLOW"
        ? "allow"
        : e.decision === "REQUIRE_APPROVAL"
          ? "require_approval"
          : "block",
    message: e.reason,
    agent: e.agentName as SecurityAuditEntry["agent"],
    detail: `${e.policyRuleMatched} · ${e.policyRuleKey}`,
  };
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
