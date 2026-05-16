export type PolicyDomain =
  | "file_access"
  | "recording_access"
  | "export_permissions"
  | "network_api"
  | "behavioral_storage";

export type PolicyVerdict = "allow" | "require_approval" | "block";

export type SecurityAuditKind =
  | "tool_call"
  | "policy_evaluation"
  | "approved"
  | "blocked"
  | "pending_approval"
  | "access_log";

export interface PolicyDomainRules {
  description?: string;
  allow: string[];
  require_approval: string[];
  block: string[];
}

export interface NemoClawPolicyBundle {
  version: string;
  name: string;
  description?: string;
  domains: Record<PolicyDomain, PolicyDomainRules>;
  trusted_domains: string[];
  /** Full URLs or origin prefixes permitted for network_api allow tools */
  trusted_urls?: string[];
  deny_message: string;
}

export interface ToolPolicyBinding {
  tool: string;
  action: string;
  domain: PolicyDomain;
  intent: string;
  agent?: string;
}

export interface PolicyEvaluationResult {
  verdict: PolicyVerdict;
  tool: string;
  action: string;
  domain: PolicyDomain;
  reason: string;
  denied: boolean;
  denyMessage: string | null;
  requiresApproval: boolean;
}

export interface SecurityAuditEntry {
  id: string;
  ts: number;
  kind: SecurityAuditKind;
  tool: string;
  action: string;
  domain: PolicyDomain;
  verdict: PolicyVerdict;
  message: string;
  agent?: string;
  detail?: string;
}

export interface EnforceToolResult {
  evaluation: PolicyEvaluationResult;
  audit: SecurityAuditEntry;
  /** When false, orchestrator must not execute the tool */
  mayExecute: boolean;
}
