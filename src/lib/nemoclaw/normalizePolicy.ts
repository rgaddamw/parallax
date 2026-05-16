import type { NemoClawPolicyBundle, PolicyDomain } from "@/lib/nemoclaw/types";

const DOMAIN_KEYS: PolicyDomain[] = [
  "file_access",
  "recording_access",
  "export_permissions",
  "network_api",
  "behavioral_storage",
];

export function normalizePolicyDomains(
  raw: Record<string, unknown>,
): NemoClawPolicyBundle["domains"] {
  const out = {} as NemoClawPolicyBundle["domains"];
  for (const key of DOMAIN_KEYS) {
    const d = (raw[key] ?? {}) as Record<string, unknown>;
    out[key] = {
      description: typeof d.description === "string" ? d.description : undefined,
      allow: Array.isArray(d.allow) ? (d.allow as string[]) : [],
      require_approval: Array.isArray(d.require_approval)
        ? (d.require_approval as string[])
        : [],
      block: Array.isArray(d.block) ? (d.block as string[]) : [],
    };
  }
  return out;
}

export function bundleFromParsedYaml(
  raw: Record<string, unknown>,
): NemoClawPolicyBundle {
  return {
    version: String(raw.version ?? "1.0"),
    name: String(raw.name ?? "parallax-default"),
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    domains: normalizePolicyDomains((raw.domains ?? {}) as Record<string, unknown>),
    trusted_domains: Array.isArray(raw.trusted_domains)
      ? (raw.trusted_domains as string[])
      : [],
    trusted_urls: Array.isArray(raw.trusted_urls)
      ? (raw.trusted_urls as string[])
      : undefined,
    deny_message:
      typeof raw.deny_message === "string"
        ? raw.deny_message
        : "Denied by NemoClaw policy layer.",
  };
}
