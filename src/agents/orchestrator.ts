import type {
  ActivityEvent,
  BehavioralResult,
  Contradiction,
  DecisionAction,
  DecisionResult,
  NemotronTurnArtifacts,
  PipelineTurnOutput,
  SessionMemory,
} from "@/agents/types";
import { runBehavioralAgent } from "@/agents/behavioralAgent";
import { runDecisionAgent } from "@/agents/decisionAgent";
import { runInterviewerAgent } from "@/agents/interviewerAgent";
import { activePersonality, runMemoryAgent } from "@/agents/memoryAgent";
import { plannedToolBatch } from "@/lib/nemoclaw/registry";
import { ALLOWED_BY_NEMOCLAW, enforceToolCall, logToolCallAttempt } from "@/lib/nemoclaw/engine";
import { policyTargetUrlForTool } from "@/lib/nemoclaw/networkTargets";
import { NEMOTRON_CHAT_COMPLETIONS_URL } from "@/lib/nemotron/endpoints";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import { runPerceptionAgent } from "@/agents/perceptionAgent";
import { buildAgentReplay, replayAgentReasoning } from "@/agents/replayAgent";
import { persistMemory } from "@/agents/persistence";
import type {
  InterviewDifficulty,
  InterviewType,
  ResumeProfile,
} from "@/types/career";
import type { InterviewerPersonality } from "@/types/interview";
import type { TurnRecord } from "@/types/interview";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emit(
  push: (e: ActivityEvent) => void,
  partial: Omit<ActivityEvent, "id" | "ts">,
) {
  push({
    id: uid(),
    ts: Date.now(),
    ...partial,
  });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function inferPressureDelta(action: DecisionAction): number {
  if (action === "pressure" || action === "interrupt") return 6;
  if (action === "escalate_skepticism") return 5;
  if (action === "deeper_technical") return 3;
  return 0;
}

export type AnswerPipelineInput = {
  sessionId: string;
  basePersonality: InterviewerPersonality;
  memory: SessionMemory;
  questionIndex: number;
  currentQuestion: string;
  answer: string;
  typingMs: number;
  priorTurns: TurnRecord[];
  jobDescription: string;
  maxTurns?: number;
  /** Pre-computed Nemotron artifacts (optional) */
  nemotron?: NemotronTurnArtifacts | null;
  /** Skip pacing delays (API route) */
  serverFast?: boolean;
  /** Tool names human-approved this session (require_approval tier) */
  approvedTools?: string[];
  career?: {
    company: string;
    role: string;
    interviewType: InterviewType;
    difficulty: InterviewDifficulty;
    profile: ResumeProfile | null;
  };
};

export type NemotronFetcherContext = {
  input: AnswerPipelineInput;
  behavioral: BehavioralResult;
  memOut: {
    memory: SessionMemory;
    retrievedNotes: string[];
    reasoning: string;
    newContradiction: Contradiction | null;
  };
};

export type AnswerPipelineOptions = {
  nemotronFetcher?: (
    ctx: NemotronFetcherContext,
  ) => Promise<NemotronTurnArtifacts | null>;
};

export async function runSessionBootstrap(
  push: (e: ActivityEvent) => void,
  input: {
    sessionId: string;
    personality: InterviewerPersonality;
    resumeName: string;
  },
) {
  const delay = async (ms: number) => {
    await pause(ms);
  };
  await delay(220);
  emit(push, {
    agent: "orchestrator",
    kind: "handoff",
    title: "OpenClaw-style DAG scheduled",
    detail:
      "Multi-agent interview graph initialized: Interviewer, Behavioral, Memory, Perception, Decision, Replay. NemoClaw policy hooks armed.",
    payload: { sessionId: input.sessionId },
  });
  await delay(260);
  emit(push, {
    agent: "nemo_claw",
    kind: "policy",
    title: "Policy sweep: ephemeral analysis plane",
    detail:
      "Default posture: analyze answers + generate feedback allowed; exports gated; resume PII exfil blocked.",
  });
  if (input.resumeName) {
    const resumeGate = enforceToolCall({
      tool: "read_resume_file",
      intent: `Read resume artifact: ${input.resumeName}`,
      agent: "interviewer",
    });
    emit(push, {
      agent: "nemo_claw",
      kind: resumeGate.mayExecute ? "tool_result" : "policy",
      title: resumeGate.mayExecute
        ? "ALLOW: read_resume_file"
        : "PENDING: read_resume_file",
      detail: resumeGate.audit.message,
    });
  }
  await delay(300);
  emit(push, {
    agent: "interviewer",
    kind: "tool_call",
    title: "tool: load_interviewer_persona",
    detail: `Persona=${input.personality}; resume artifact="${input.resumeName || "none"}" (filename only, not exported).`,
  });
  await delay(240);
  emit(push, {
    agent: "interviewer",
    kind: "reasoning",
    title: "Interviewer Agent primed adaptive cadence",
    detail:
      "First question selected from Nemotron-ready template bank with tone constraints from persona.",
  });
}

export async function runAnswerPipeline(
  push: (e: ActivityEvent) => void,
  input: AnswerPipelineInput,
  options?: AnswerPipelineOptions,
): Promise<PipelineTurnOutput> {
  const maxTurns = input.maxTurns ?? 5;
  let memory = { ...input.memory };
  const serverFast = input.serverFast === true;
  const approvedTools = new Set(input.approvedTools ?? []);
  const securityAudit: SecurityAuditEntry[] = [];
  const delay = async (ms: number) => {
    if (!serverFast) await pause(ms);
  };

  const policyOpts = { approvedTools };

  const recordPolicy = (enforced: ReturnType<typeof enforceToolCall>) => {
    securityAudit.push(enforced.audit);
    if (enforced.mayExecute) {
      securityAudit.push(
        logToolCallAttempt({
          tool: enforced.evaluation.tool,
          action: enforced.evaluation.action,
          domain: enforced.evaluation.domain,
          intent: enforced.audit.detail ?? enforced.evaluation.reason,
          agent: enforced.audit.agent,
        }),
      );
      securityAudit.push({
        id: `${enforced.audit.id}-access`,
        ts: Date.now(),
        kind: "access_log",
        tool: enforced.evaluation.tool,
        action: enforced.evaluation.action,
        domain: enforced.evaluation.domain,
        verdict: "allow",
        message: `${ALLOWED_BY_NEMOCLAW} ${enforced.evaluation.tool}`,
        agent: enforced.audit.agent,
        detail: enforced.audit.detail,
      });
    }
    const v = enforced.evaluation.verdict;
    emit(push, {
      agent: "nemo_claw",
      kind:
        enforced.evaluation.denied
          ? "policy"
          : v === "require_approval"
            ? "policy"
            : "tool_result",
      title: enforced.evaluation.denied
        ? `INTERCEPTED: ${enforced.evaluation.tool}`
        : v === "require_approval"
          ? `PENDING: ${enforced.evaluation.tool}`
          : `ALLOW: ${enforced.evaluation.tool}`,
      detail: enforced.audit.message,
      payload: {
        tool: enforced.evaluation.tool,
        verdict: v,
        domain: enforced.evaluation.domain,
        action: enforced.evaluation.action,
      },
    });
    return enforced.mayExecute;
  };

  const willTryNemotron = Boolean(input.nemotron || options?.nemotronFetcher);

  await delay(200);
  emit(push, {
    agent: "orchestrator",
    kind: "handoff",
    title: `Turn ${input.questionIndex + 1} pipeline started`,
    detail: willTryNemotron
      ? "Nemotron ReAct loop (Observe, Analyze, Decide, Act) when configured; else heuristic perception."
      : "Heuristic agents — no Nemotron fetcher configured.",
  });

  await delay(280);
  emit(push, {
    agent: "nemo_claw",
    kind: "policy",
    title: "NemoClaw: evaluating planned tool batch",
    detail: "Probing export/PII/behavioral persistence classes before agents execute.",
  });
  for (const binding of plannedToolBatch()) {
    recordPolicy(
      enforceToolCall(
        {
          tool: binding.tool,
          intent: binding.intent,
          agent: binding.agent,
          targetUrl: policyTargetUrlForTool(binding.tool),
        },
        policyOpts,
      ),
    );
    await delay(serverFast ? 120 : 220);
  }

  const behavioralGate = enforceToolCall(
    {
      tool: "analyze_paralinguistics",
      intent: "analyze answer text for delivery cues",
      agent: "behavioral",
    },
    policyOpts,
  );
  recordPolicy(behavioralGate);

  await delay(260);
  emit(push, {
    agent: "behavioral",
    kind: "tool_call",
    title: "tool: analyze_paralinguistics",
    detail: "Input: answer text + dwell telemetry from client clock.",
  });
  await delay(320);
  const behavioral = runBehavioralAgent({
    answer: input.answer,
    typingMs: input.typingMs,
    questionIndex: input.questionIndex,
  });
  emit(push, {
    agent: "behavioral",
    kind: "reasoning",
    title: "Behavioral Agent fused delivery features",
    detail: behavioral.reasoning,
    payload: { metrics: behavioral.metrics },
  });
  if (behavioral.hesitationSpike) {
    await delay(200);
    emit(push, {
      agent: "behavioral",
      kind: "signal",
      title: "Behavioral Agent detected hesitation spike.",
      detail: "Downstream Decision Agent authorized to consider interrupt or reframing.",
    });
  }

  const emotionalGate = enforceToolCall(
    {
      tool: "save_emotional_analysis",
      intent: "Optional persist of emotional signal summary",
      agent: "behavioral",
    },
    policyOpts,
  );
  recordPolicy(emotionalGate);

  const memoryGate = enforceToolCall(
    {
      tool: "retrieve_session_memory",
      intent: "fetch prior turn fingerprints",
      agent: "memory",
    },
    policyOpts,
  );
  recordPolicy(memoryGate);

  await delay(300);
  emit(push, {
    agent: "memory",
    kind: "tool_call",
    title: "tool: retrieve_session_memory",
    detail: `Graph lookup for session ${input.sessionId} (${memory.answerFingerprints.length} fingerprints).`,
  });
  const memOut = runMemoryAgent({
    memory,
    priorTurns: input.priorTurns,
    newAnswer: input.answer,
    questionIndex: input.questionIndex,
    jobDescription: input.jobDescription,
  });
  memory = memOut.memory;
  emit(push, {
    agent: "memory",
    kind: "memory",
    title: "Memory retrieval complete",
    detail: memOut.retrievedNotes.join(" "),
  });
  emit(push, {
    agent: "memory",
    kind: "reasoning",
    title: "Memory Agent reconciliation",
    detail: memOut.reasoning,
  });
  if (memOut.newContradiction) {
    await delay(220);
    emit(push, {
      agent: "memory",
      kind: "memory",
      title: `Memory Agent retrieved contradiction from Question ${memOut.newContradiction.turnIndex + 1}.`,
      detail: memOut.newContradiction.description,
      payload: { contradictionId: memOut.newContradiction.id },
    });
  }

  let nemotron: NemotronTurnArtifacts | null = input.nemotron ?? null;
  if (!nemotron && options?.nemotronFetcher) {
    const nemotronGate = enforceToolCall(
      {
        tool: "nemotron_react_loop",
        intent: `Nemotron ReAct via ${NEMOTRON_CHAT_COMPLETIONS_URL}`,
        agent: "orchestrator",
        targetUrl: NEMOTRON_CHAT_COMPLETIONS_URL,
      },
      policyOpts,
    );
    if (recordPolicy(nemotronGate)) {
      try {
        nemotron = await options.nemotronFetcher({
          input,
          behavioral,
          memOut,
        });
      } catch {
        nemotron = null;
      }
    }
  }

  const personaForTurn = activePersonality(input.basePersonality, memory);

  let perception: {
    theyHeard: string;
    trustDelta: number;
    reasoning: string;
    hiddenSignals: string[];
  };

  let decision: DecisionResult;

  if (nemotron) {
    emit(push, {
      agent: "orchestrator",
      kind: "tool_call",
      title: "tool: nemotron_react_loop",
      detail:
        "Observe -> Analyze -> Decide -> Act (commit_interviewer_act). Structured multi-step reasoning.",
    });
    for (const st of nemotron.reactTrace) {
      await delay(80);
      emit(push, {
        agent: "orchestrator",
        kind: "reasoning",
        title: `ReAct · ${st.phase}`,
        detail: `${st.title}\n${st.detail}`,
        payload: { reactPhase: st.phase, toolName: st.toolName },
      });
    }

    await delay(120);
    emit(push, {
      agent: "perception",
      kind: "tool_call",
      title: "tool: infer_interviewer_model (Nemotron)",
      detail: "Latent belief update synthesized by Nemotron after ReAct phases.",
    });
    perception = {
      theyHeard: nemotron.theyHeard,
      trustDelta: nemotron.trustDelta,
      reasoning: nemotron.perceptionReasoning,
      hiddenSignals: [],
    };
    memory = {
      ...memory,
      trustScore: clamp(memory.trustScore + perception.trustDelta, 18, 94),
      lastStressSignal:
        behavioral.stressSignals[0] ?? memory.lastStressSignal ?? null,
    };
    emit(push, {
      agent: "perception",
      kind: "reasoning",
      title: "Perception (Nemotron) updated latent interviewer beliefs",
      detail: perception.reasoning,
    });
    if (perception.trustDelta <= -6) {
      emit(push, {
        agent: "perception",
        kind: "signal",
        title: "Perception lowered trust score.",
        detail: `Delta ${perception.trustDelta}.`,
        payload: { trustScore: memory.trustScore },
      });
    }

    await delay(120);
    emit(push, {
      agent: "decision",
      kind: "tool_call",
      title: "tool: route_interviewer_action (Nemotron)",
      detail: "Routing label committed from Decide phase; guardrails vs local rules applied server-side.",
    });
    decision = {
      action: nemotron.decisionAction,
      narrative: nemotron.decisionRationale,
      questionPrefix: "",
      questionSuffix: "",
      nextEffectivePersonality:
        nemotron.decisionAction === "escalate_skepticism"
          ? "skeptical_engineer"
          : null,
      pressureDelta: inferPressureDelta(nemotron.decisionAction),
    };
    emit(push, {
      agent: "decision",
      kind: "decision",
      title: `Decision: ${decision.action}`,
      detail: decision.narrative,
      payload: { action: decision.action, source: "nemotron" },
    });
    if (decision.action === "escalate_skepticism") {
      emit(push, {
        agent: "decision",
        kind: "signal",
        title: "Decision Agent escalated skepticism.",
        detail: "Effective interviewer personality shifts toward skeptical routing.",
      });
    }
  } else {
    await delay(340);
    emit(push, {
      agent: "perception",
      kind: "tool_call",
      title: "tool: infer_interviewer_model",
      detail: "Projecting latent trust + compression onto interviewer belief state.",
    });
    perception = runPerceptionAgent({
      personality: personaForTurn,
      answer: input.answer,
      metrics: behavioral.metrics,
      trustBefore: memory.trustScore,
      newContradiction: memOut.newContradiction,
      hesitationSpike: behavioral.hesitationSpike,
    });
    memory = {
      ...memory,
      trustScore: clamp(memory.trustScore + perception.trustDelta, 18, 94),
      lastStressSignal:
        behavioral.stressSignals[0] ?? memory.lastStressSignal ?? null,
    };
    emit(push, {
      agent: "perception",
      kind: "reasoning",
      title: "Perception Agent updated latent interviewer beliefs",
      detail: perception.reasoning,
    });
    if (perception.trustDelta <= -6) {
      emit(push, {
        agent: "perception",
        kind: "signal",
        title: "Perception Agent lowered trust score.",
        detail: `Delta ${perception.trustDelta}. Hidden signals: ${perception.hiddenSignals.join("; ") || "n/a"}.`,
        payload: { trustScore: memory.trustScore },
      });
    }

    await delay(360);
    emit(push, {
      agent: "decision",
      kind: "tool_call",
      title: "tool: route_interviewer_action",
      detail: "Policy-safe routing: interrupt, pressure, deeper probe, contradiction challenge, or continue.",
    });
    decision = runDecisionAgent({
      basePersonality: input.basePersonality,
      behavioral,
      memory,
      newContradiction: memOut.newContradiction,
      questionIndex: input.questionIndex,
    });
    emit(push, {
      agent: "decision",
      kind: "decision",
      title: `Decision: ${decision.action}`,
      detail: decision.narrative,
      payload: { action: decision.action, source: "heuristic" },
    });
    if (decision.action === "escalate_skepticism") {
      emit(push, {
        agent: "decision",
        kind: "signal",
        title: "Decision Agent escalated pressure mode.",
        detail: "Effective interviewer personality may shift toward skeptical routing.",
      });
    }
  }

  memory = {
    ...memory,
    effectivePersonality:
      decision.nextEffectivePersonality ?? memory.effectivePersonality,
    pressureLevel: clamp(memory.pressureLevel + decision.pressureDelta, 0, 100),
  };

  const nextIndex = input.questionIndex + 1;
  const isLast = nextIndex >= maxTurns;

  let nextQuestion = "";
  if (!isLast) {
    await delay(300);
    emit(push, {
      agent: "interviewer",
      kind: "reasoning",
      title: nemotron
        ? "Interviewer (Nemotron) drafted adaptive follow-up"
        : "Interviewer Agent composing next probe",
      detail: nemotron
        ? "Next question string emitted from Act tool commit."
        : "Merging decision overlays with adaptive question bank.",
    });
    if (nemotron) {
      nextQuestion = nemotron.nextQuestion;
    } else {
      const inv = runInterviewerAgent({
        basePersonality: input.basePersonality,
        memory,
        nextQuestionIndex: nextIndex,
        decision,
        career: input.career
          ? {
              company: input.career.company,
              role: input.career.role,
              interviewType: input.career.interviewType,
              difficulty: input.career.difficulty,
              profile: input.career.profile,
              priorAnswers: [
                ...input.priorTurns.map((t) => t.userSaid),
                input.answer,
              ],
            }
          : undefined,
      });
      nextQuestion = inv.question;
      emit(push, {
        agent: "interviewer",
        kind: "reasoning",
        title: "Interviewer Agent locked follow-up",
        detail: inv.reasoning,
      });
    }
  } else {
    await delay(280);
    emit(push, {
      agent: "replay",
      kind: "handoff",
      title: "Replay Agent: terminal synthesis",
      detail: replayAgentReasoning(input.priorTurns.length + 1),
    });
  }

  const turn: TurnRecord = {
    id: `${input.questionIndex}-${uid()}`,
    question: input.currentQuestion,
    userSaid: input.answer,
    theyHeard: perception.theyHeard,
    metrics: behavioral.metrics,
    timestamp: Date.now(),
    decisionSummary: decision.narrative,
    trustScoreAfter: memory.trustScore,
    decisionAction: decision.action,
  };

  const persistGate = enforceToolCall(
    {
      tool: "persist_session_memory",
      intent: "write session memory to local storage",
      agent: "memory",
    },
    policyOpts,
  );
  if (recordPolicy(persistGate)) {
    persistMemory(memory);
  }

  let replay = null;
  if (isLast) {
    const turns = [...input.priorTurns, turn];
    const exportGate = enforceToolCall(
      {
        tool: "export_interview_profile",
        intent: "export hiring profile bundle",
        agent: "replay",
      },
      policyOpts,
    );
    const replayGate = enforceToolCall(
      {
        tool: "build_cinematic_replay",
        intent: "synthesize replay",
        agent: "replay",
      },
      policyOpts,
    );
    recordPolicy(exportGate);
    await delay(400);
    recordPolicy(replayGate);
    await delay(220);
    emit(push, {
      agent: "replay",
      kind: "tool_call",
      title: "tool: build_cinematic_replay",
      detail:
        "Fusing behavioral traces, perception layer, and policy audit into Parallax Replay.",
    });
    const built = buildAgentReplay(turns, memory);
    replay = built;
    if (built) {
      await delay(280);
      emit(push, {
        agent: "replay",
        kind: "reasoning",
        title: "Replay Agent published hiring recommendation",
        detail: built.hiringRecommendation.rationale,
        payload: { verdict: built.hiringRecommendation.verdict },
      });
    }
  }

  return {
    turn,
    nextQuestion,
    nextIndex,
    memory,
    replay,
    step: isLast ? "replay" : "live",
    reactTrace: nemotron?.reactTrace ?? [],
    usedNemotron: Boolean(nemotron),
    securityAudit,
  };
}
