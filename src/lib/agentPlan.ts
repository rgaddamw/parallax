import type { ActivityEvent } from "@/agents/types";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import type { InterviewStep } from "@/types/interview";

export type AgentPlanStepId =
  | "observe"
  | "behavioral"
  | "memory"
  | "decide"
  | "nemotron"
  | "policy"
  | "trust";

/** Base lifecycle from pipeline events */
export type AgentPlanStepStatus =
  | "idle"
  | "pending"
  | "active"
  | "done"
  | "skipped"
  | "blocked";

/** Richer UI states for demos */
export type AgentPlanDisplayStatus =
  | AgentPlanStepStatus
  | "queued"
  | "running"
  | "reasoning"
  | "complete"
  | "awaiting_approval";

export interface AgentPlanStepDef {
  id: AgentPlanStepId;
  index: number;
  title: string;
  subtitle: string;
  agents: string;
}

export const AGENT_PLAN_STEPS: AgentPlanStepDef[] = [
  {
    id: "observe",
    index: 0,
    title: "Observe user answer",
    subtitle: "Ingest transcript, pacing, and dwell telemetry from the live turn.",
    agents: "Orchestrator · Perception",
  },
  {
    id: "behavioral",
    index: 1,
    title: "Analyze behavioral signals",
    subtitle: "Fuse hesitation, fillers, and stress markers into delivery features.",
    agents: "Behavioral Agent",
  },
  {
    id: "memory",
    index: 2,
    title: "Retrieve memory from prior answers",
    subtitle: "Reconcile contradictions and session fingerprints across turns.",
    agents: "Memory Agent",
  },
  {
    id: "decide",
    index: 3,
    title: "Decide: challenge, interrupt, or continue",
    subtitle: "Route interviewer action — pressure, skepticism, or neutral probe.",
    agents: "Decision Agent",
  },
  {
    id: "nemotron",
    index: 4,
    title: "Call Nemotron for next interviewer response",
    subtitle: "Only if NemoClaw allows trusted NVIDIA domain (policy-gated).",
    agents: "Nemotron · Interviewer",
  },
  {
    id: "policy",
    index: 5,
    title: "Enforce NemoClaw on every planned tool",
    subtitle: "Allow safe paths, gate sensitive exports, block untrusted egress.",
    agents: "NemoClaw policy layer",
  },
  {
    id: "trust",
    index: 6,
    title: "Update trust score and replay log",
    subtitle: "Persist session memory and append turn to Parallax Replay.",
    agents: "Replay · Persistence",
  },
];

/** One-line reasoning traces for expandable UI */
export const AGENT_PLAN_REASONING: Record<
  AgentPlanStepId,
  { title: string; body: string }
> = {
  observe: {
    title: "Orchestrator",
    body: "Grounding turn in live clock, transcript length, and speech cadence for downstream agents.",
  },
  behavioral: {
    title: "Behavioral Agent",
    body: "Hesitation spike + reduced specificity detected — delivery features fused into stress vectors.",
  },
  memory: {
    title: "Memory Agent",
    body: "Retrieved contradiction from prior answer when narrative fingerprints diverge from new claims.",
  },
  decide: {
    title: "Decision Agent",
    body: "Escalating skepticism due to vague ownership signals — routing toward interrupt or deeper probe.",
  },
  nemotron: {
    title: "Nemotron",
    body: "Observe → Analyze → Decide → Act on NVIDIA NIM; commits next interviewer beat when online.",
  },
  policy: {
    title: "NemoClaw",
    body: "Evaluates each tool against YAML tiers: allow, require approval, or intercept unsafe egress.",
  },
  trust: {
    title: "Replay · Persistence",
    body: "Trust trajectory and turn ledger updated; Parallax Replay synthesized on terminal turn.",
  },
};

function recentEvents(events: ActivityEvent[], n = 48) {
  return events.slice(-n);
}

function activePipelineIndex(
  events: ActivityEvent[],
  isOrchestrating: boolean,
): number {
  if (!isOrchestrating) return -1;
  const r = recentEvents(events);
  const hasAgent = (agent: string) => r.some((e) => e.agent === agent);
  const titleHas = (s: string) =>
    r.some((e) => e.title.toLowerCase().includes(s.toLowerCase()));

  if (hasAgent("replay") || titleHas("replay agent")) return 6;
  if (
    hasAgent("nemo_claw") ||
    titleHas("nemoclaw") ||
    titleHas("policy") ||
    titleHas("intercepted")
  ) {
    return 5;
  }
  if (
    titleHas("nemotron") ||
    titleHas("react") ||
    (hasAgent("orchestrator") && titleHas("react"))
  ) {
    return 4;
  }
  if (hasAgent("decision") || titleHas("decision:")) return 3;
  if (hasAgent("memory")) return 2;
  if (hasAgent("behavioral")) return 1;
  if (hasAgent("orchestrator") && titleHas("pipeline started")) return 0;
  return 0;
}

export function deriveAgentPlanStatuses(input: {
  step: InterviewStep;
  isOrchestrating: boolean;
  activityEvents: ActivityEvent[];
  securityAudit: SecurityAuditEntry[];
  lastTurnUsedNemotron: boolean;
  nemotronConfigured: boolean | null;
  turnCount: number;
  pendingApprovalCount: number;
}): Record<AgentPlanStepId, AgentPlanStepStatus> {
  const base = Object.fromEntries(
    AGENT_PLAN_STEPS.map((s) => [s.id, "idle" as AgentPlanStepStatus]),
  ) as Record<AgentPlanStepId, AgentPlanStepStatus>;

  if (input.step === "setup" || input.step === "branch") {
    AGENT_PLAN_STEPS.forEach((s) => {
      base[s.id] = "idle";
    });
    return base;
  }

  if (input.step === "resume_intel") {
    base.observe = "done";
    base.behavioral = "done";
    base.memory = "active";
    base.decide = "pending";
    base.nemotron = "skipped";
    base.policy = input.pendingApprovalCount > 0 ? "pending" : "done";
    base.trust = "idle";
    return base;
  }

  const activeIdx = activePipelineIndex(
    input.activityEvents,
    input.isOrchestrating,
  );

  const recentBlocked = input.securityAudit
    .slice(-20)
    .some((e) => e.kind === "blocked");

  if (input.isOrchestrating) {
    AGENT_PLAN_STEPS.forEach((s) => {
      if (s.index < activeIdx) base[s.id] = "done";
      else if (s.index === activeIdx) {
        if (s.id === "policy" && recentBlocked) base[s.id] = "blocked";
        else if (
          s.id === "policy" &&
          input.pendingApprovalCount > 0 &&
          activeIdx >= 5
        ) {
          base[s.id] = "pending";
        } else base[s.id] = "active";
      } else base[s.id] = "pending";
    });
    if (activeIdx >= 0 && activeIdx < 4) {
      base.policy = "pending";
    }
    if (activeIdx <= 4) {
      base.trust = "pending";
    }
    return base;
  }

  if (input.turnCount === 0 && input.step === "live") {
    AGENT_PLAN_STEPS.forEach((s) => {
      base[s.id] = s.id === "observe" ? "pending" : "idle";
    });
    return base;
  }

  AGENT_PLAN_STEPS.forEach((s) => {
    base[s.id] = "done";
  });

  if (input.nemotronConfigured === true) {
    base.nemotron = "done";
  } else if (input.nemotronConfigured === false && !input.lastTurnUsedNemotron) {
    base.nemotron = "skipped";
  }

  if (recentBlocked) {
    base.policy = "done";
  }

  if (input.pendingApprovalCount > 0) {
    base.policy = "pending";
  }

  return base;
}

/** Staged “live reasoning” wave while orchestrating (server may return events in one batch). */
export function orchestrationWaveStatus(
  waveTick: number,
  pendingApprovalCount: number,
): Record<AgentPlanStepId, AgentPlanDisplayStatus> {
  const out = {} as Record<AgentPlanStepId, AgentPlanDisplayStatus>;
  const stage = Math.min(6, Math.floor(waveTick / 2));
  const reasoningPulse = waveTick % 2 === 1;

  AGENT_PLAN_STEPS.forEach((s) => {
    if (s.index < stage) {
      out[s.id] = "complete";
    } else if (s.index === stage) {
      out[s.id] = reasoningPulse ? "reasoning" : "running";
    } else if (s.index === stage + 1 && s.id === "policy" && pendingApprovalCount > 0) {
      out[s.id] = "awaiting_approval";
    } else {
      out[s.id] = "queued";
    }
  });
  return out;
}

export function mergeDisplayStatus(
  derived: Record<AgentPlanStepId, AgentPlanStepStatus>,
  wave: Record<AgentPlanStepId, AgentPlanDisplayStatus> | null,
  isOrchestrating: boolean,
): Record<AgentPlanStepId, AgentPlanDisplayStatus> {
  if (!isOrchestrating || !wave) return derived as Record<AgentPlanStepId, AgentPlanDisplayStatus>;
  const merged = { ...derived } as Record<AgentPlanStepId, AgentPlanDisplayStatus>;
  AGENT_PLAN_STEPS.forEach((s) => {
    const w = wave[s.id];
    const d = derived[s.id];
    if (d === "blocked") merged[s.id] = "blocked";
    else if (d === "skipped") merged[s.id] = "skipped";
    else if (d === "pending" && s.id === "policy") merged[s.id] = "awaiting_approval";
    else if (w === "complete" || d === "done") merged[s.id] = "complete";
    else merged[s.id] = w;
  });
  return merged;
}

export const DISPLAY_LABEL: Record<AgentPlanDisplayStatus, string> = {
  idle: "Idle",
  pending: "Queued",
  active: "Running",
  done: "Complete",
  skipped: "Skipped",
  blocked: "Blocked",
  queued: "Queued",
  running: "Running",
  reasoning: "Reasoning",
  complete: "Complete",
  awaiting_approval: "Awaiting approval",
};

export function deriveAgentLoopPhase(
  activityEvents: ActivityEvent[],
  isOrchestrating: boolean,
): number {
  if (!isOrchestrating) return 0;
  const idx = activePipelineIndex(activityEvents, true);
  if (idx <= 0) return 0;
  if (idx <= 3) return 1;
  if (idx === 4) return 2;
  return 3;
}
