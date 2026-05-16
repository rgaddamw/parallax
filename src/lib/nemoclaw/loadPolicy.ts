import { DEFAULT_NEMOCLAW_POLICY } from "@/lib/nemoclaw/defaultPolicy";
import type { NemoClawPolicyBundle } from "@/lib/nemoclaw/types";

/** Client-safe policy loader (embedded bundle; no filesystem). */
export function loadNemoClawPolicy(): NemoClawPolicyBundle {
  return DEFAULT_NEMOCLAW_POLICY;
}

export function getPolicySummary(bundle: NemoClawPolicyBundle) {
  return {
    version: bundle.version,
    name: bundle.name,
    description: bundle.description,
    deny_message: bundle.deny_message,
    trusted_domains: bundle.trusted_domains,
    trusted_urls: bundle.trusted_urls ?? [],
    domains: bundle.domains,
  };
}
