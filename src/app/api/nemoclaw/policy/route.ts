import { NextResponse } from "next/server";
import { getPolicySummary } from "@/lib/nemoclaw/loadPolicy";
import { loadNemoClawPolicyFromDisk } from "@/lib/nemoclaw/loadPolicy.server";
import { allRegisteredTools } from "@/lib/nemoclaw/registry";

export const runtime = "nodejs";

export async function GET() {
  const bundle = loadNemoClawPolicyFromDisk();
  return NextResponse.json({
    policy: getPolicySummary(bundle),
    registeredTools: allRegisteredTools().map((t) => ({
      tool: t.tool,
      action: t.action,
      domain: t.domain,
    })),
  });
}
