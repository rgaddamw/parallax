"use client";

import { useEffect, useState } from "react";
import { targetAnswerSeconds } from "@/lib/interview/coachingLive";
import type { InterviewDifficulty, InterviewType } from "@/types/career";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export function AnswerTimerBar({
  interviewType,
  difficulty,
  questionKey,
  disabled,
}: {
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  /** Reset when question changes */
  questionKey: string;
  disabled?: boolean;
}) {
  const targetSec = targetAnswerSeconds(interviewType, difficulty);
  const targetMs = targetSec * 1000;

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    setRunning(false);
    setElapsedMs(0);
    setStartedAt(0);
  }, [questionKey]);

  useEffect(() => {
    if (!running || startedAt === 0) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 200);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  const pct = Math.min(100, (elapsedMs / targetMs) * 100);
  const over = elapsedMs > targetMs;

  const start = () => {
    if (disabled) return;
    setStartedAt(Date.now());
    setElapsedMs(0);
    setRunning(true);
  };

  const stop = () => {
    if (!running) return;
    setElapsedMs(Date.now() - startedAt);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setElapsedMs(0);
    setStartedAt(0);
  };

  return (
    <GlassPanel
      className={`border px-4 py-4 ${over ? "border-amber-500/35" : "border-white/10"}`}
      glow={running ? "cyan" : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
            Answer timer
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Target for this {interviewType} question: ~{targetSec}s
          </p>
        </div>
        <p className="font-mono text-lg text-cyan-200/90">
          {formatMs(elapsedMs)}
          <span className="text-sm text-zinc-600"> / {formatMs(targetMs)}</span>
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800/90">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            over
              ? "bg-gradient-to-r from-amber-500 to-rose-500"
              : pct > 75
                ? "bg-gradient-to-r from-cyan-400 to-amber-400"
                : "bg-gradient-to-r from-cyan-500 to-emerald-400"
          }`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>

      {over && !running && (
        <p className="mt-2 text-[11px] text-amber-200/90">
          Over target — practice trimming to a headline + two proof points.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!running ? (
          <NeonButton
            type="button"
            className="!px-4 !py-2 !text-xs"
            disabled={disabled}
            onClick={start}
          >
            Start timer
          </NeonButton>
        ) : (
          <NeonButton
            type="button"
            variant="ghost"
            className="!px-4 !py-2 !text-xs"
            onClick={stop}
          >
            Stop timer
          </NeonButton>
        )}
        <NeonButton
          type="button"
          variant="ghost"
          className="!px-4 !py-2 !text-xs"
          disabled={disabled || (elapsedMs === 0 && !running)}
          onClick={reset}
        >
          Reset
        </NeonButton>
      </div>
    </GlassPanel>
  );
}
