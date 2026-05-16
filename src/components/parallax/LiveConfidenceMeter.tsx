"use client";

import { useEffect, useMemo, useState } from "react";
import {
  confidenceZone,
  type ConfidenceZone,
} from "@/lib/interview/coachingLive";
import type { InterviewDifficulty, InterviewType } from "@/types/career";
import type { LiveMetrics } from "@/types/interview";
import { GlassPanel } from "@/components/ui/GlassPanel";

const ZONE_STYLE: Record<
  ConfidenceZone,
  { bar: string; text: string; glow: "cyan" | "amber" | "violet" }
> = {
  red: {
    bar: "bg-gradient-to-r from-rose-600 to-rose-400",
    text: "text-rose-200",
    glow: "amber",
  },
  yellow: {
    bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
    text: "text-amber-200",
    glow: "amber",
  },
  green: {
    bar: "bg-gradient-to-r from-emerald-500 to-cyan-400",
    text: "text-emerald-200",
    glow: "cyan",
  },
};

type CoachingPayload = {
  zone: ConfidenceZone;
  score: number;
  label: string;
  tips: string[];
  articulationTips: string[];
  source: "nemotron" | "heuristic";
};

export function LiveConfidenceMeter({
  metrics,
  answer,
  typingMs,
  question,
  company,
  role,
  interviewType,
  difficulty,
}: {
  metrics: LiveMetrics;
  answer: string;
  typingMs: number;
  question: string;
  company: string;
  role: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
}) {
  const instant = useMemo(
    () => confidenceZone({ metrics, answer, typingMs }),
    [metrics, answer, typingMs],
  );

  const [agentic, setAgentic] = useState<CoachingPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (answer.trim().length < 12) {
      setAgentic(null);
      return;
    }

    const id = window.setTimeout(() => {
      setLoading(true);
      void fetch("/api/career/live-coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer,
          metrics,
          typingMs,
          question,
          company,
          role,
          interviewType,
          difficulty,
        }),
      })
        .then((r) => r.json())
        .then((d: CoachingPayload) => {
          if (d.zone && d.tips) setAgentic(d);
        })
        .catch(() => setAgentic(null))
        .finally(() => setLoading(false));
    }, 900);

    return () => window.clearTimeout(id);
  }, [
    answer,
    metrics,
    typingMs,
    question,
    company,
    role,
    interviewType,
    difficulty,
  ]);

  const live = agentic ?? { ...instant, source: "heuristic" as const };
  const displayScore = agentic?.score ?? instant.score;
  const style = ZONE_STYLE[live.zone];
  const hasAnswer = answer.trim().length > 0;

  return (
    <GlassPanel className="p-5" glow={style.glow}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
          How confident you sound
        </p>
        <span className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
          {live.label}
        </span>
      </div>

      <p className="mt-1 text-[9px] text-zinc-600">
        {agentic?.source === "nemotron"
          ? "Agentic coach · Nemotron"
          : loading
            ? "Updating agentic coach…"
            : "Instant signals · agent refines when you pause typing"}
      </p>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800/90">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${style.bar}`}
          style={{
            width: `${hasAnswer ? Math.max(6, displayScore) : 4}%`,
          }}
        />
      </div>
      <p className="mt-1 font-mono text-[10px] text-zinc-600">
        Score {displayScore}/100 · updates as you type or speak
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            Confidence tips
          </p>
          <ul className="mt-2 list-none space-y-1.5 text-xs text-zinc-400">
            {live.tips.map((t) => (
              <li key={t} className="flex gap-2">
                <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${style.bar}`} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        {live.articulationTips.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Voice & articulation
            </p>
            <ul className="mt-2 list-none space-y-1.5 text-xs text-zinc-500">
              {live.articulationTips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
