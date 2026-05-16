import { NextResponse } from "next/server";
import { probeRealNemoclawRuntime } from "@/lib/nemoclaw/probeRuntime.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live probe: nemoclaw --help, docker ps, nemoclaw status, nemoclaw list --json */
export async function GET() {
  try {
    const status = await probeRealNemoclawRuntime();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Runtime probe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
