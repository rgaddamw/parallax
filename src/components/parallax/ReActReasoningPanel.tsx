"use client";

import type { ReActPhase, ReActTraceStep } from "@/agents/types";
import { GlassPanel } from "@/components/ui/GlassPanel";

const PHASE_ORDER: ReActPhase[] = ["observe", "analyze", "decide", "act"];

const PHASE_LABEL: Record<ReActPhase, string> = {
  observe: "Observe",
  analyze: "Analyze",
  decide: "Decide",
  act: "Act",
};

const PHASE_HINT: Record<ReActPhase, string> = {
  observe: "Ground in telemetry: hesitation, fillers, pacing, structure.",
  analyze: "Map signals to interviewer beliefs and trust trajectory.",
  decide: "Select routing: interrupt, pressure, deeper probe, or continue.",
  act: "Commit tool: perception compression + next adaptive question.",
};

export function ReActReasoningPanel({
  steps,
  usedNemotron,
  mockMode = false,
}: {
  steps: ReActTraceStep[];
  usedNemotron: boolean;
  mockMode?: boolean;
}) {
  const byPhase = (p: ReActPhase) => steps.filter((s) => s.phase === p);

  return (
    <GlassPanel className="p-5" glow="amber">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-amber-200/80">
            Internal reasoning (ReAct)
          </p>
          <h3 className="font-display mt-1 text-lg text-white">
            Observe → Analyze → Decide → Act
          </h3>
        </div>
        <span
          className={`mt-2 w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest sm:mt-0 ${
            usedNemotron
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
              : "border-zinc-600 bg-zinc-800/60 text-zinc-400"
          }`}
        >
          {mockMode
            ? "Deterministic mock"
            : usedNemotron
              ? "Nemotron loop"
              : "Heuristic fallback"}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Each submit runs a visible loop: e.g. observe hesitation, analyze confidence
        drop, decide to interrupt, act with a pressure follow-up (when Nemotron is
        configured).
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PHASE_ORDER.map((phase) => {
          const items = byPhase(phase);
          return (
            <div
              key={phase}
              className="rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/80">
                {PHASE_LABEL[phase]}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                {PHASE_HINT[phase]}
              </p>
              <div className="mt-3 space-y-2">
                {items.length === 0 && (
                  <p className="text-xs italic text-zinc-600">Awaiting cycle...</p>
                )}
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2"
                  >
                    <p className="text-xs font-medium text-zinc-200">{s.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      {s.detail}
                    </p>
                    {s.toolName && (
                      <p className="mt-1 font-mono text-[10px] text-amber-200/80">
                        tool: {s.toolName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
