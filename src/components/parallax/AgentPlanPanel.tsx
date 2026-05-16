"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AGENT_PLAN_REASONING,
  AGENT_PLAN_STEPS,
  DISPLAY_LABEL,
  deriveAgentPlanStatuses,
  mergeDisplayStatus,
  orchestrationWaveStatus,
  type AgentPlanDisplayStatus,
  type AgentPlanStepId,
} from "@/lib/agentPlan";
import type { ActivityEvent } from "@/agents/types";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import { GlassPanel } from "@/components/ui/GlassPanel";

const STATUS_STYLE: Record<
  AgentPlanDisplayStatus,
  { ring: string; label: string; num: string; animate?: string }
> = {
  idle: {
    ring: "border-zinc-800 bg-zinc-900/40",
    label: "text-zinc-600",
    num: "text-zinc-700",
  },
  pending: {
    ring: "border-zinc-700/80 bg-zinc-900/60",
    label: "text-zinc-500",
    num: "text-zinc-500",
  },
  active: {
    ring: "border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_-8px_rgba(34,211,238,0.5)]",
    label: "text-cyan-200",
    num: "text-cyan-300",
    animate: "animate-pulse",
  },
  done: {
    ring: "border-emerald-500/30 bg-emerald-500/5",
    label: "text-emerald-200/90",
    num: "text-emerald-400",
  },
  skipped: {
    ring: "border-amber-500/25 bg-amber-500/5",
    label: "text-amber-200/80",
    num: "text-amber-400",
  },
  blocked: {
    ring: "border-rose-500/35 bg-rose-500/8",
    label: "text-rose-200",
    num: "text-rose-400",
  },
  queued: {
    ring: "border-zinc-700/60 bg-zinc-900/50",
    label: "text-zinc-500",
    num: "text-zinc-600",
  },
  running: {
    ring: "border-cyan-400/45 bg-cyan-500/10",
    label: "text-cyan-200",
    num: "text-cyan-300",
    animate: "animate-pulse",
  },
  reasoning: {
    ring: "border-violet-400/45 bg-violet-500/10 shadow-[0_0_18px_-8px_rgba(167,139,250,0.45)]",
    label: "text-violet-200",
    num: "text-violet-300",
    animate: "animate-pulse-glow",
  },
  complete: {
    ring: "border-emerald-500/35 bg-emerald-500/8",
    label: "text-emerald-200/90",
    num: "text-emerald-400",
  },
  awaiting_approval: {
    ring: "border-amber-400/40 bg-amber-500/10",
    label: "text-amber-100",
    num: "text-amber-300",
    animate: "animate-pulse",
  },
};

export function AgentPlanPanel({
  turnNumber,
  step,
  isOrchestrating,
  activityEvents,
  securityAudit,
  lastTurnUsedNemotron,
  nemotronConfigured,
  turnCount,
  pendingApprovalCount,
}: {
  turnNumber: number;
  step: import("@/types/interview").InterviewStep;
  isOrchestrating: boolean;
  activityEvents: ActivityEvent[];
  securityAudit: SecurityAuditEntry[];
  lastTurnUsedNemotron: boolean;
  nemotronConfigured: boolean | null;
  turnCount: number;
  pendingApprovalCount: number;
}) {
  const [waveTick, setWaveTick] = useState(0);
  const [expanded, setExpanded] = useState<AgentPlanStepId | null>(null);

  useEffect(() => {
    if (!isOrchestrating) {
      setWaveTick(0);
      return;
    }
    const id = window.setInterval(() => {
      setWaveTick((w) => (w + 1) % 28);
    }, 520);
    return () => window.clearInterval(id);
  }, [isOrchestrating]);

  const derived = useMemo(
    () =>
      deriveAgentPlanStatuses({
        step,
        isOrchestrating,
        activityEvents,
        securityAudit,
        lastTurnUsedNemotron,
        nemotronConfigured,
        turnCount,
        pendingApprovalCount,
      }),
    [
      step,
      isOrchestrating,
      activityEvents,
      securityAudit,
      lastTurnUsedNemotron,
      nemotronConfigured,
      turnCount,
      pendingApprovalCount,
    ],
  );

  const wave = useMemo(
    () =>
      isOrchestrating
        ? orchestrationWaveStatus(waveTick, pendingApprovalCount)
        : null,
    [isOrchestrating, waveTick, pendingApprovalCount],
  );

  const display = useMemo(
    () => mergeDisplayStatus(derived, wave, isOrchestrating),
    [derived, wave, isOrchestrating],
  );

  const activeCount = AGENT_PLAN_STEPS.filter((s) => {
    const d = display[s.id];
    return d === "running" || d === "reasoning" || d === "active";
  }).length;

  return (
    <GlassPanel className="p-5" glow="violet">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-violet-300/80">
            Agent plan · turn {Math.max(1, turnNumber)}
          </p>
          <h3 className="font-display mt-1 text-lg text-white">
            Autonomous multi-agent workflow
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Living DAG — policy gates unsafe egress while safe reasoning and trust
            scoring continue in real time.
          </p>
        </div>
        <span
          className={`mt-1 w-fit shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${
            isOrchestrating
              ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200 animate-pulse-glow"
              : "border-white/10 bg-white/5 text-zinc-500"
          }`}
        >
          {isOrchestrating ? "Executing plan" : "Awaiting submit"}
        </span>
      </div>

      <ol className="mt-5 space-y-2">
        {AGENT_PLAN_STEPS.map((planStep) => {
          const status = display[planStep.id];
          const style = STATUS_STYLE[status] ?? STATUS_STYLE.idle;
          const isOpen = expanded === planStep.id;
          const trace = AGENT_PLAN_REASONING[planStep.id];
          const nemotronLine =
            planStep.id === "nemotron" &&
            nemotronConfigured === true &&
            !isOrchestrating &&
            step === "live" &&
            turnCount > 0
              ? "Nemotron reasoning complete."
              : null;

          return (
            <li
              key={planStep.id}
              className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${style.ring} ${style.animate ?? ""}`}
            >
              <div className="flex gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 font-mono text-xs font-bold ${style.num}`}
                >
                  {planStep.index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium ${style.label}`}>
                      {planStep.title}
                    </p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        status === "running" || status === "reasoning" || status === "active"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : status === "blocked"
                            ? "bg-rose-500/20 text-rose-200"
                            : status === "awaiting_approval"
                              ? "bg-amber-500/20 text-amber-100"
                              : status === "complete" || status === "done"
                                ? "bg-emerald-500/15 text-emerald-200/90"
                                : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {DISPLAY_LABEL[status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                    {nemotronLine ?? planStep.subtitle}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-600">
                    {planStep.agents}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(isOpen ? null : planStep.id)
                    }
                    className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-violet-400/90 hover:text-violet-300"
                  >
                    {isOpen ? "Hide reasoning trace" : "Reasoning trace"}
                  </button>
                  {isOpen && (
                    <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {trace.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                        {trace.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {activeCount > 0 && (
        <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-cyan-400/70">
          {activeCount} step{activeCount > 1 ? "s" : ""} in flight · staged reasoning
        </p>
      )}
    </GlassPanel>
  );
}
