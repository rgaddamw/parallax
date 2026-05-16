"use client";

import { JUDGE_DEMO_DURATION_MS } from "@/lib/judgeDemo/scenario";
import { useInterviewSession } from "@/context/InterviewSessionProvider";

export function JudgeDemoBanner() {
  const { state } = useInterviewSession();
  if (!state.isJudgeDemo && !state.isJudgeDemoRunning) return null;

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-fuchsia-200/90">
        Judge demo mode
      </p>
      <p className="mt-1 text-sm text-zinc-200">
        Scripted 3-minute robotics internship scenario — deterministic mock
        orchestration, no API keys or microphone required.
      </p>
      {state.isJudgeDemoRunning && (
        <p className="mt-2 font-mono text-[10px] text-zinc-500">
          ~{Math.round(JUDGE_DEMO_DURATION_MS / 60_000)} min timeline · phase:{" "}
          {state.judgeDemoLabel ?? "starting"}
        </p>
      )}
    </div>
  );
}
