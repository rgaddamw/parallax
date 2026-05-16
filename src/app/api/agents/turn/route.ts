import { NextResponse } from "next/server";
import { runAnswerPipeline } from "@/agents/orchestrator";
import type { AnswerPipelineInput } from "@/agents/orchestrator";
import { runNemotronReactTurn } from "@/server/runNemotronReactTurn";
import { isNemotronConfigured } from "@/lib/nemotron/env";
import type { ActivityEvent } from "@/agents/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnswerPipelineInput;
    if (
      !body.sessionId ||
      !body.memory ||
      !body.basePersonality ||
      body.questionIndex == null
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const events: ActivityEvent[] = [];
    const push = (e: ActivityEvent) => {
      events.push(e);
    };

    const output = await runAnswerPipeline(
      push,
      { ...body, serverFast: true },
      {
        nemotronFetcher: isNemotronConfigured()
        ? (ctx) =>
            runNemotronReactTurn({
              basePersonality: ctx.input.basePersonality,
              memory: ctx.memOut.memory,
              questionIndex: ctx.input.questionIndex,
              currentQuestion: ctx.input.currentQuestion,
              answer: ctx.input.answer,
              typingMs: ctx.input.typingMs,
              priorTurns: ctx.input.priorTurns,
              jobDescription: ctx.input.jobDescription,
              behavioral: ctx.behavioral,
              newContradiction: ctx.memOut.newContradiction,
            })
          : undefined,
      },
    );

    return NextResponse.json({
      activityEvents: events,
      output,
      usedNemotron: output.usedNemotron === true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Turn pipeline error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
