import type {
  InterviewerPersonality,
  LiveMetrics,
  ReplayInsight,
  TurnRecord,
} from "@/types/interview";

export type AgentId =
  | "orchestrator"
  | "interviewer"
  | "behavioral"
  | "perception"
  | "decision"
  | "replay"
  | "memory"
  | "nemo_claw";

export type ActivityKind =
  | "handoff"
  | "reasoning"
  | "tool_call"
  | "tool_result"
  | "memory"
  | "decision"
  | "policy"
  | "signal";

export interface ActivityEvent {
  id: string;
  ts: number;
  agent: AgentId;
  kind: ActivityKind;
  title: string;
  detail?: string;
  payload?: Record<string, unknown>;
}

export interface Contradiction {
  id: string;
  turnIndex: number;
  description: string;
  evidence: string[];
}

export interface SessionMemory {
  sessionId: string;
  trustScore: number;
  contradictions: Contradiction[];
  answerFingerprints: string[];
  pressureLevel: number;
  effectivePersonality: InterviewerPersonality | null;
  lastStressSignal: string | null;
}

export type DecisionAction =
  | "continue"
  | "interrupt"
  | "pressure"
  | "deeper_technical"
  | "challenge_contradiction"
  | "escalate_skepticism";

export type ReActPhase = "observe" | "analyze" | "decide" | "act";

export interface ReActTraceStep {
  id: string;
  phase: ReActPhase;
  title: string;
  detail: string;
  raw?: string;
  toolName?: string;
}

export interface NemotronTurnArtifacts {
  theyHeard: string;
  trustDelta: number;
  nextQuestion: string;
  decisionAction: DecisionAction;
  decisionRationale: string;
  perceptionReasoning: string;
  reactTrace: ReActTraceStep[];
}

export interface DecisionResult {
  action: DecisionAction;
  narrative: string;
  questionPrefix: string;
  questionSuffix: string;
  nextEffectivePersonality: InterviewerPersonality | null;
  pressureDelta: number;
}

export interface BehavioralResult {
  metrics: LiveMetrics;
  hesitationSpike: boolean;
  stressSignals: string[];
  reasoning: string;
}

export interface PerceptionResult {
  theyHeard: string;
  trustDelta: number;
  hiddenSignals: string[];
  reasoning: string;
}

export interface ReplayAgentResult extends ReplayInsight {
  reasoning: string;
}

export interface PipelineTurnOutput {
  turn: TurnRecord;
  nextQuestion: string;
  nextIndex: number;
  memory: SessionMemory;
  replay: ReplayInsight | null;
  step: "live" | "replay";
  /** Populated when Nemotron ReAct ran this turn */
  reactTrace?: ReActTraceStep[];
  /** True when Nemotron artifacts drove this turn (not heuristic fallback) */
  usedNemotron?: boolean;
  securityAudit?: import("@/lib/nemoclaw/types").SecurityAuditEntry[];
}
