import { NextResponse } from "next/server";
import { runLiveCoachingAgent } from "@/server/liveCoachingAgent";
import type { InterviewDifficulty, InterviewType } from "@/types/career";
import type { LiveMetrics } from "@/types/interview";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      answer?: string;
      metrics?: LiveMetrics;
      typingMs?: number;
      question?: string;
      company?: string;
      role?: string;
      interviewType?: InterviewType;
      difficulty?: InterviewDifficulty;
    };

    if (!body.metrics) {
      return NextResponse.json({ error: "metrics required" }, { status: 400 });
    }

    const result = await runLiveCoachingAgent({
      answer: body.answer ?? "",
      metrics: body.metrics,
      typingMs: body.typingMs ?? 0,
      question: body.question ?? "",
      company: body.company ?? "",
      role: body.role ?? "",
      interviewType: body.interviewType ?? "mixed",
      difficulty: body.difficulty ?? "normal",
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "live coaching error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
