"use client";

import { useEffect, useState } from "react";
import { smallTalkTips } from "@/lib/interview/coachingLive";
import type { InterviewType } from "@/types/career";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function InterviewSmallTalkPanel({
  phase,
  company,
  role,
  interviewType,
}: {
  phase: "opening" | "mid" | "closing";
  company: string;
  role: string;
  interviewType: InterviewType;
}) {
  const fallback = smallTalkTips({ phase, company, role, interviewType });
  const [title, setTitle] = useState(fallback.title);
  const [tips, setTips] = useState(fallback.tips);
  const [source, setSource] = useState<"nemotron" | "heuristic">("heuristic");

  useEffect(() => {
    void fetch("/api/career/small-talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, company, role, interviewType }),
    })
      .then((r) => r.json())
      .then(
        (d: {
          title?: string;
          tips?: string[];
          source?: "nemotron" | "heuristic";
        }) => {
          if (d.title) setTitle(d.title);
          if (d.tips?.length) setTips(d.tips);
          if (d.source) setSource(d.source);
        },
      )
      .catch(() => {
        setTitle(fallback.title);
        setTips(fallback.tips);
        setSource("heuristic");
      });
  }, [phase, company, role, interviewType]);

  return (
    <GlassPanel className="border border-violet-500/20 p-4 sm:p-5" glow="violet">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/90">
          Rapport & small talk
        </p>
        <span className="text-[9px] uppercase tracking-wider text-zinc-600">
          {source === "nemotron" ? "Agentic · Nemotron" : "Heuristic fallback"}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-zinc-200">{title}</p>
      <ul className="mt-3 list-none space-y-2 text-xs leading-relaxed text-zinc-400">
        {tips.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400/70" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
