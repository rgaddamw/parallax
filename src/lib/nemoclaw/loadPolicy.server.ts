import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { DEFAULT_NEMOCLAW_POLICY } from "@/lib/nemoclaw/defaultPolicy";
import { bundleFromParsedYaml } from "@/lib/nemoclaw/normalizePolicy";
import type { NemoClawPolicyBundle } from "@/lib/nemoclaw/types";

let cached: NemoClawPolicyBundle | null = null;

/** Load policy from policies/nemoclaw.default.yaml on the server. */
export function loadNemoClawPolicyFromDisk(): NemoClawPolicyBundle {
  if (cached) return cached;
  try {
    const path = join(process.cwd(), "policies", "nemoclaw.default.yaml");
    const raw = parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    cached = bundleFromParsedYaml(raw);
    return cached;
  } catch {
    return DEFAULT_NEMOCLAW_POLICY;
  }
}
