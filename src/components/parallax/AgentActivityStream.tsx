"use client";

import { useRef } from "react";
import { useScrollContainerBottom } from "@/hooks/useScrollContainerBottom";
import type { ActivityEvent, AgentId } from "@/agents/types";
import { GlassPanel } from "@/components/ui/GlassPanel";

const AGENT_LABEL: Record<AgentId, string> = {
  orchestrator: "Orchestrator",
  interviewer: "Interviewer",
  behavioral: "Behavioral",
  perception: "Perception",
  decision: "Decision",
  replay: "Replay",
  memory: "Memory",
  nemo_claw: "NemoClaw",
};

const KIND_ACCENT: Record<
  ActivityEvent["kind"],
  { bar: string; chip: string }
> = {
  handoff: { bar: "bg-cyan-400", chip: "text-cyan-200/90" },
  reasoning: { bar: "bg-violet-400", chip: "text-violet-200/90" },
  tool_call: { bar: "bg-amber-400", chip: "text-amber-200/90" },
  tool_result: { bar: "bg-emerald-400", chip: "text-emerald-200/90" },
  memory: { bar: "bg-sky-400", chip: "text-sky-200/90" },
  decision: { bar: "bg-fuchsia-500", chip: "text-fuchsia-200/90" },
  policy: { bar: "bg-orange-400", chip: "text-orange-100/90" },
  signal: { bar: "bg-rose-500", chip: "text-rose-200/90" },
};

export function AgentActivityStream({
  events,
  trustScore,
  isOrchestrating,
}: {
  events: ActivityEvent[];
  trustScore: number | null;
  isOrchestrating: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollContainerBottom(scrollRef, events.length);

  return (
    <GlassPanel className="flex max-h-[min(72vh,640px)] flex-col" glow="violet">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-fuchsia-200/80">
          Agent activity stream
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            OpenClaw-style orchestration: reasoning, tools, memory, policy.
          </p>
          {trustScore != null && (
            <span className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-cyan-200/90">
              trust {Math.round(trustScore)}
            </span>
          )}
        </div>
        {isOrchestrating && (
          <p className="mt-2 animate-pulse text-[11px] font-medium text-amber-200/80">
            Agents running multi-step workflow...
          </p>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {events.length === 0 && (
          <p className="px-1 text-xs text-zinc-600">
            Awaiting signals. Start the interview to boot the DAG.
          </p>
        )}
        {events.map((ev) => {
          const acc = KIND_ACCENT[ev.kind];
          return (
            <div
              key={ev.id}
              className="rounded-lg border border-white/5 bg-black/25 px-3 py-2.5"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-8 w-0.5 shrink-0 rounded-full ${acc.bar}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className={`text-[10px] font-bold ${acc.chip}`}>
                      {AGENT_LABEL[ev.agent]}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-600">
                      {ev.kind.replace(/_/g, " ")}
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-zinc-600">
                      {new Date(ev.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug text-zinc-100">
                    {ev.title}
                  </p>
                  {ev.detail && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {ev.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
