import { NextResponse } from "next/server";
import { runSmallTalkAgent } from "@/server/liveCoachingAgent";
import type { InterviewType } from "@/types/career";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      phase?: "opening" | "mid" | "closing";
      company?: string;
      role?: string;
      interviewType?: InterviewType;
    };

    const result = await runSmallTalkAgent({
      phase: body.phase ?? "opening",
      company: body.company ?? "",
      role: body.role ?? "",
      interviewType: body.interviewType ?? "mixed",
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "small talk error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
