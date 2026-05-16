import type {
  ActivityEvent,
  AgentId,
  ReActTraceStep,
  SessionMemory,
} from "@/agents/types";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import { enforceToolCall } from "@/lib/nemoclaw/engine";
import {
  NEMOTRON_CHAT_COMPLETIONS_URL,
  UNTRUSTED_DEMO_URL,
} from "@/lib/nemotron/endpoints";
import type { TurnRecord } from "@/types/interview";
import { createInitialMemory } from "@/agents/persistence";
import {
  JUDGE_DEMO_CONTRADICTION,
  JUDGE_DEMO_INTERRUPT,
  JUDGE_DEMO_JD,
  JUDGE_DEMO_QUESTION,
  JUDGE_DEMO_VAGUE_ANSWER,
  JUDGE_DEMO_THEY_HEARD,
} from "@/lib/judgeDemo/scenario";
import { buildJudgeDemoReplay } from "@/lib/judgeDemo/replay";
import type { ReplayInsight } from "@/types/interview";

let seq = 0;
function eid() {
  seq += 1;
  return `judge-${seq}-${Date.now()}`;
}

function evt(
  agent: AgentId,
  kind: ActivityEvent["kind"],
  title: string,
  detail?: string,
  payload?: Record<string, unknown>,
): ActivityEvent {
  return {
    id: eid(),
    ts: Date.now(),
    agent,
    kind,
    title,
    detail,
    payload,
  };
}

export type JudgeDemoFrame = {
  delayMs: number;
  label: string;
  patch: {
    step?: "live" | "replay";
    answerDraft?: string;
    currentQuestion?: string;
    isOrchestrating?: boolean;
    memory?: SessionMemory;
    turns?: TurnRecord[];
    replay?: ReplayInsight | null;
    reactTrace?: ReActTraceStep[];
    lastTurnUsedNemotron?: boolean;
    appendEvents?: ActivityEvent[];
    appendAudit?: SecurityAuditEntry[];
  };
};

export function resetJudgeDemoSequence() {
  seq = 0;
}

const REACT_TRACE: ReActTraceStep[] = [
  {
    id: "jd-observe",
    phase: "observe",
    title: "Observe delivery telemetry",
    detail:
      "Hesitation spike + filler density high; no metric anchors in transcript.",
    toolName: "analyze_paralinguistics",
  },
  {
    id: "jd-analyze",
    phase: "analyze",
    title: "Analyze confidence trajectory",
    detail:
      "Interviewer belief: leadership claim without personal artifact → trust penalty.",
    toolName: "infer_interviewer_model",
  },
  {
    id: "jd-decide",
    phase: "decide",
    title: "Decide routing label",
    detail: "escalate_skepticism + interrupt authorized — specificity probe required.",
    toolName: "route_interviewer_action",
  },
  {
    id: "jd-act",
    phase: "act",
    title: "Act: commit interrupt follow-up",
    detail: JUDGE_DEMO_INTERRUPT,
    toolName: "commit_interviewer_act",
  },
];

export function buildJudgeDemoTimeline(sessionId: string): JudgeDemoFrame[] {
  resetJudgeDemoSequence();
  const memory = createInitialMemory(sessionId, "skeptical_engineer");
  memory.trustScore = 68;

  const metrics = {
    confidence: 41,
    clarity: 38,
    fillerWords: 6,
    pacing: 52,
    hesitation: 88,
  };

  const turn: TurnRecord = {
    id: "judge-turn-0",
    question: JUDGE_DEMO_QUESTION,
    userSaid: JUDGE_DEMO_VAGUE_ANSWER,
    theyHeard: JUDGE_DEMO_THEY_HEARD,
    metrics,
    timestamp: Date.now(),
    decisionSummary:
      "Decision Agent escalated skepticism after behavioral + memory signals.",
    trustScoreAfter: 44,
    decisionAction: "interrupt",
  };

  const exportBlock = enforceToolCall({
    tool: "export_behavioral_profile",
    intent: "Export candidate behavioral profile to external analytics",
    agent: "replay",
  });

  const nvidiaAllow = enforceToolCall({
    tool: "nvidia_nim_chat_completions",
    targetUrl: NEMOTRON_CHAT_COMPLETIONS_URL,
    intent: `POST ${NEMOTRON_CHAT_COMPLETIONS_URL}`,
    agent: "orchestrator",
  });

  const outboundBlock = enforceToolCall({
    tool: "outbound_untrusted_domain",
    targetUrl: UNTRUSTED_DEMO_URL,
    intent: `Probe ${UNTRUSTED_DEMO_URL}`,
    agent: "orchestrator",
  });

  const frames: JudgeDemoFrame[] = [
    {
      delayMs: 0,
      label: "context",
      patch: {
        step: "live",
        isOrchestrating: false,
        memory,
        answerDraft: "",
        currentQuestion: JUDGE_DEMO_QUESTION,
        turns: [],
        replay: null,
        reactTrace: [],
        lastTurnUsedNemotron: false,
        appendEvents: [
          evt(
            "orchestrator",
            "handoff",
            "Judge Demo Mode · robotics/AI internship",
            JUDGE_DEMO_JD.slice(0, 120) + "...",
          ),
        ],
      },
    },
    {
      delayMs: 6_000,
      label: "question",
      patch: {
        appendEvents: [
          evt(
            "interviewer",
            "tool_call",
            "tool: load_interviewer_persona",
            "Skeptical Engineer persona · specificity-first probes enabled.",
          ),
          evt(
            "interviewer",
            "reasoning",
            "Interviewer Agent locked Q1",
            JUDGE_DEMO_QUESTION,
          ),
        ],
      },
    },
    {
      delayMs: 8_000,
      label: "typing",
      patch: { answerDraft: JUDGE_DEMO_VAGUE_ANSWER.slice(0, 42) },
    },
    {
      delayMs: 4_000,
      label: "typing-2",
      patch: { answerDraft: JUDGE_DEMO_VAGUE_ANSWER },
    },
    {
      delayMs: 5_000,
      label: "pipeline-start",
      patch: {
        isOrchestrating: true,
        appendEvents: [
          evt(
            "orchestrator",
            "handoff",
            "Turn 1 pipeline started",
            "Deterministic mock orchestration (no API keys). Nemotron routes available when NVIDIA_API_KEY is set.",
          ),
          evt(
            "nemo_claw",
            "policy",
            "NemoClaw: evaluating planned tool batch",
            "Probing NVIDIA NIM endpoints vs untrusted outbound domains.",
          ),
        ],
      },
    },
    {
      delayMs: 3_000,
      label: "policy-network",
      patch: {
        appendEvents: [
          evt(
            "nemo_claw",
            "tool_result",
            `ALLOW: ${nvidiaAllow.evaluation.tool}`,
            nvidiaAllow.audit.message,
            {
              tool: nvidiaAllow.evaluation.tool,
              verdict: "allow",
              domain: "network_api",
              targetUrl: NEMOTRON_CHAT_COMPLETIONS_URL,
            },
          ),
          evt(
            "nemo_claw",
            "policy",
            `BLOCKED: ${outboundBlock.evaluation.tool}`,
            outboundBlock.audit.message,
            {
              tool: outboundBlock.evaluation.tool,
              verdict: "block",
              domain: "network_api",
              targetUrl: UNTRUSTED_DEMO_URL,
            },
          ),
        ],
        appendAudit: [nvidiaAllow.audit, outboundBlock.audit],
      },
    },
    {
      delayMs: 7_000,
      label: "behavioral",
      patch: {
        appendEvents: [
          evt(
            "behavioral",
            "tool_call",
            "tool: analyze_paralinguistics",
            "Input: vague answer text + dwell telemetry (mock clock).",
          ),
          evt(
            "behavioral",
            "reasoning",
            "Behavioral Agent fused delivery features",
            "Hesitation spike detected; specificity score in bottom quartile for robotics bar.",
          ),
          evt(
            "behavioral",
            "signal",
            "Behavioral Agent detected hesitation spike",
            "Low specificity + fillers → downstream interrupt authorized.",
            { hesitation: metrics.hesitation },
          ),
        ],
      },
    },
    {
      delayMs: 8_000,
      label: "perception",
      patch: {
        memory: { ...memory, trustScore: 52 },
        appendEvents: [
          evt(
            "perception",
            "tool_call",
            "tool: infer_interviewer_model",
            "Projecting latent trust + compression onto interviewer belief state.",
          ),
          evt(
            "perception",
            "reasoning",
            "Perception Agent updated latent interviewer beliefs",
            JUDGE_DEMO_THEY_HEARD,
          ),
          evt(
            "perception",
            "signal",
            "Perception lowered trust score",
            "Delta -16. Leadership claim treated as unverified.",
            { trustScore: 52 },
          ),
        ],
      },
    },
    {
      delayMs: 8_000,
      label: "memory",
      patch: {
        memory: {
          ...memory,
          trustScore: 48,
          contradictions: [
            {
              id: "jd-contra-1",
              ...JUDGE_DEMO_CONTRADICTION,
            },
          ],
        },
        appendEvents: [
          evt(
            "memory",
            "tool_call",
            "tool: retrieve_session_memory",
            "Graph lookup: resume fingerprint vs live answer.",
          ),
          evt(
            "memory",
            "memory",
            "Memory Agent retrieved contradiction from Question 1",
            JUDGE_DEMO_CONTRADICTION.description,
            { contradictionId: "jd-contra-1" },
          ),
          evt(
            "memory",
            "reasoning",
            "Memory Agent reconciliation",
            "Prior claim of solo ownership conflicts with team-generic answer.",
          ),
        ],
      },
    },
    {
      delayMs: 8_000,
      label: "decision",
      patch: {
        appendEvents: [
          evt(
            "decision",
            "tool_call",
            "tool: route_interviewer_action",
            "Routing: escalate_skepticism + interrupt.",
          ),
          evt(
            "decision",
            "decision",
            "Decision: interrupt",
            "Specificity probe required — panel would not advance without personal artifact.",
            { action: "interrupt", source: "deterministic-mock" },
          ),
          evt(
            "decision",
            "signal",
            "Decision Agent escalated skepticism",
            "Effective personality shifts toward skeptical routing.",
          ),
        ],
      },
    },
    {
      delayMs: 10_000,
      label: "nemotron-mock",
      patch: {
        reactTrace: REACT_TRACE,
        lastTurnUsedNemotron: false,
        appendEvents: [
          evt(
            "orchestrator",
            "tool_call",
            "tool: nemotron_react_loop (mock)",
            "Observe → Analyze → Decide → Act — deterministic fallback; live path uses /api/nemotron/chat when configured.",
          ),
          ...REACT_TRACE.map((st) =>
            evt(
              "orchestrator",
              "reasoning",
              `ReAct · ${st.phase}`,
              `${st.title}\n${st.detail}`,
              { reactPhase: st.phase, toolName: st.toolName },
            ),
          ),
        ],
      },
    },
    {
      delayMs: 9_000,
      label: "policy-block",
      patch: {
        appendEvents: [
          evt(
            "nemo_claw",
            "policy",
            `BLOCKED: ${exportBlock.evaluation.tool}`,
            exportBlock.audit.message,
            {
              tool: exportBlock.evaluation.tool,
              verdict: "block",
              domain: exportBlock.evaluation.domain,
            },
          ),
        ],
        appendAudit: [exportBlock.audit],
      },
    },
    {
      delayMs: 8_000,
      label: "interrupt",
      patch: {
        currentQuestion: JUDGE_DEMO_INTERRUPT,
        memory: {
          ...memory,
          trustScore: 44,
          contradictions: [
            { id: "jd-contra-1", ...JUDGE_DEMO_CONTRADICTION },
          ],
          effectivePersonality: "skeptical_engineer",
          pressureLevel: 72,
        },
        appendEvents: [
          evt(
            "interviewer",
            "reasoning",
            "Interviewer Agent issued interrupt",
            JUDGE_DEMO_INTERRUPT,
          ),
        ],
      },
    },
    {
      delayMs: 10_000,
      label: "trust-finalize",
      patch: {
        turns: [turn],
        isOrchestrating: false,
        memory: {
          ...memory,
          trustScore: 44,
          contradictions: [
            { id: "jd-contra-1", ...JUDGE_DEMO_CONTRADICTION },
          ],
          effectivePersonality: "skeptical_engineer",
          pressureLevel: 72,
        },
        appendEvents: [
          evt(
            "orchestrator",
            "signal",
            "Trust signal updated",
            "Modeled trust 44/100 — borderline panel posture.",
            { trustScore: 44 },
          ),
        ],
      },
    },
    {
      delayMs: 12_000,
      label: "replay-build",
      patch: {
        isOrchestrating: true,
        appendEvents: [
          evt(
            "replay",
            "handoff",
            "Replay Agent: terminal synthesis",
            "Fusing behavioral traces, perception layer, and policy audit into Parallax Replay.",
          ),
          evt(
            "replay",
            "tool_call",
            "tool: build_cinematic_replay",
            "What You Said / What They Heard / Trust Drop / Improved Answer / Hiring Signal.",
          ),
        ],
      },
    },
    {
      delayMs: 14_000,
      label: "replay-done",
      patch: {
        step: "replay",
        isOrchestrating: false,
        replay: buildJudgeDemoReplay(turn),
        appendEvents: [
          evt(
            "replay",
            "reasoning",
            "Replay Agent published hiring recommendation",
            "Borderline → Hire if improved (simulated panel).",
            { verdict: "BORDERLINE" },
          ),
        ],
      },
    },
    {
      delayMs: 71_000,
      label: "hold",
      patch: {},
    },
  ];

  return frames;
}
