import type { NemoClawPolicyBundle, PolicyDomain } from "@/lib/nemoclaw/types";
import { DEFAULT_NEMOCLAW_POLICY } from "@/lib/nemoclaw/defaultPolicy";

export type PolicyTier = "allow" | "require_approval" | "block";

export interface MatchedPolicyRule {
  tier: PolicyTier;
  /** YAML path e.g. domains.file_access.allow */
  ruleKey: string;
  /** Human-readable rule for UI highlight */
  label: string;
  domain: PolicyDomain;
  action: string;
}

const DOMAIN_LABEL: Record<PolicyDomain, string> = {
  file_access: "file_access",
  recording_access: "recording_access",
  export_permissions: "export_permissions",
  network_api: "network_api",
  behavioral_storage: "behavioral_storage",
};

export function matchPolicyRule(
  domain: PolicyDomain,
  action: string,
  bundle: NemoClawPolicyBundle = DEFAULT_NEMOCLAW_POLICY,
): MatchedPolicyRule {
  const rules = bundle.domains[domain];
  if (rules.block.includes(action)) {
    return {
      tier: "block",
      ruleKey: `domains.${domain}.block`,
      label: `${DOMAIN_LABEL[domain]}.block → ${action}`,
      domain,
      action,
    };
  }
  if (rules.require_approval.includes(action)) {
    return {
      tier: "require_approval",
      ruleKey: `domains.${domain}.require_approval`,
      label: `${DOMAIN_LABEL[domain]}.require_approval → ${action}`,
      domain,
      action,
    };
  }
  if (rules.allow.includes(action)) {
    return {
      tier: "allow",
      ruleKey: `domains.${domain}.allow`,
      label: `${DOMAIN_LABEL[domain]}.allow → ${action}`,
      domain,
      action,
    };
  }
  return {
    tier: "block",
    ruleKey: `domains.${domain}.block`,
    label: `default deny (${domain})`,
    domain,
    action,
  };
}
