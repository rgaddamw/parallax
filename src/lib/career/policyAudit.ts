import { enforceAndLog } from "@/lib/nemoclaw/openshellAudit";
import type { OpenShellAuditEntry } from "@/lib/nemoclaw/openshellAudit";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";

export function runCareerPolicyBatch(
  actions: {
    tool: string;
    agent: string;
    intent?: string;
    approvedTools?: Set<string>;
  }[],
): { openShell: OpenShellAuditEntry[]; security: SecurityAuditEntry[] } {
  const openShell: OpenShellAuditEntry[] = [];
  const security: SecurityAuditEntry[] = [];

  for (const a of actions) {
    const { result, openShell: os } = enforceAndLog({
      tool: a.tool,
      agent: a.agent,
      intent: a.intent,
      approvedTools: a.approvedTools,
    });
    openShell.push(os);
    security.push(result.audit);
  }

  return { openShell, security };
}
