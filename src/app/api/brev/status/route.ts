import { NextResponse } from "next/server";

/** Optional deploy target hint for NemoClaw cloud workflows (Brev Launchable). */
export async function GET() {
  return NextResponse.json({
    connected: true,
    status: "running",
    instance: "parallax-brev-gpu-01",
    region: "us-west",
    gpu: "NVIDIA L40S",
    runtime: "OpenClaw agent DAG",
  });
}
