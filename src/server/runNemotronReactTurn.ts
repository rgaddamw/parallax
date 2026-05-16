import type { BehavioralResult } from "@/agents/types";
import type { SessionMemory } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";
import type { TurnRecord } from "@/types/interview";
import type { NemotronTurnArtifacts, ReActPhase, ReActTraceStep } from "@/agents/types";
import type { DecisionAction } from "@/agents/types";
import {
  buildActToolContext,
  buildAnalyzeUserPayload,
  buildDecideUserPayload,
  buildObserveUserPayload,
} from "@/lib/nemotron/prompts";
import {
  nemotronChatCompletion,
  nemotronTextCompletion,
  safeParseJson,
} from "@/server/nemotronClient";
import { runDecisionAgent } from "@/agents/decisionAgent";
import { runPerceptionAgent } from "@/agents/perceptionAgent";
import { activePersonality } from "@/agents/memoryAgent";

function rid() {
  return `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function step(
  phase: ReActPhase,
  title: string,
  detail: string,
  raw?: string,
  toolName?: string,
): ReActTraceStep {
  return { id: rid(), phase, title, detail, raw, toolName };
}

const ACTIONS: DecisionAction[] = [
  "continue",
  "interrupt",
  "pressure",
  "deeper_technical",
  "challenge_contradiction",
  "escalate_skepticism",
];

function coerceAction(a: string | undefined, fallback: DecisionAction): DecisionAction {
  return ACTIONS.includes(a as DecisionAction) ? (a as DecisionAction) : fallback;
}

const COMMIT_TOOL = {
  type: "function" as const,
  function: {
    name: "commit_interviewer_act",
    description:
      "Commit the interviewer-visible artifacts: compressed 'what they heard', trust delta, routing label, and the exact next question string.",
    parameters: {
      type: "object",
      properties: {
        they_heard: { type: "string" },
        trust_delta: { type: "integer" },
        decision_action: { type: "string", enum: ACTIONS },
        decision_rationale: { type: "string" },
        next_question: { type: "string" },
        perception_reasoning: { type: "string" },
      },
      required: [
        "they_heard",
        "trust_delta",
        "decision_action",
        "decision_rationale",
        "next_question",
        "perception_reasoning",
      ],
    },
  },
};

export async function runNemotronReactTurn(input: {
  basePersonality: InterviewerPersonality;
  memory: SessionMemory;
  questionIndex: number;
  currentQuestion: string;
  answer: string;
  typingMs: number;
  priorTurns: TurnRecord[];
  jobDescription: string;
  behavioral: BehavioralResult;
  newContradiction: import("@/agents/types").Contradiction | null;
}): Promise<NemotronTurnArtifacts> {
  const trace: ReActTraceStep[] = [];

  const observePayload = buildObserveUserPayload({
    personality: input.basePersonality,
    questionIndex: input.questionIndex,
    currentQuestion: input.currentQuestion,
    answer: input.answer,
    typingMs: input.typingMs,
    metrics: input.behavioral.metrics,
    jobDescriptionExcerpt: input.jobDescription,
  });
  const observeRaw = await nemotronTextCompletion(
    `${observePayload}\nReturn ONLY valid JSON matching output_schema.`,
    { max_tokens: 700 },
  );
  const observeJson = observeRaw;
  trace.push(
    step(
      "observe",
      "Observe candidate signals",
      safeParseJson<{ observation?: string }>(observeJson).observation ??
        "Telemetry fused with lexical cues.",
      observeJson.slice(0, 1200),
    ),
  );

  const analyzeRaw = await nemotronTextCompletion(
    `${buildAnalyzeUserPayload(observeJson)}\nReturn ONLY valid JSON matching output_schema.`,
    { max_tokens: 700 },
  );
  const analyzeJson = analyzeRaw;
  const analyzeObj = safeParseJson<{ analysis?: string }>(analyzeJson);
  trace.push(
    step(
      "analyze",
      "Analyze interviewer interpretation",
      analyzeObj.analysis ?? "Modeled listener compression and risk.",
      analyzeJson.slice(0, 1200),
    ),
  );

  const decideRaw = await nemotronTextCompletion(
    `${buildDecideUserPayload(analyzeJson)}\nReturn ONLY valid JSON matching output_schema.`,
    { max_tokens: 600 },
  );
  const decideJson = decideRaw;
  const decideObj = safeParseJson<{
    decision_action?: string;
    rationale?: string;
  }>(decideJson);
  const persona = activePersonality(input.basePersonality, input.memory);
  const localDecision = runDecisionAgent({
    basePersonality: input.basePersonality,
    behavioral: input.behavioral,
    memory: input.memory,
    newContradiction: input.newContradiction,
    questionIndex: input.questionIndex,
  });
  const modelAction = coerceAction(
    decideObj.decision_action,
    localDecision.action,
  );
  trace.push(
    step(
      "decide",
      "Decide routing for next interviewer beat",
      decideObj.rationale ?? localDecision.narrative,
      decideJson.slice(0, 1200),
    ),
  );

  const actUser = buildActToolContext({
    observeJson,
    analyzeJson,
    decideJson,
    memory: input.memory,
    priorTurns: input.priorTurns,
    basePersonality: input.basePersonality,
    nextQuestionIndex: input.questionIndex + 1,
    contradictionHint: input.newContradiction?.description ?? null,
  });

  const completion = await nemotronChatCompletion({
    messages: [
      {
        role: "user",
        content: `${actUser}\nYou MUST call commit_interviewer_act once. Do not reply with plain text.`,
      },
    ],
    tools: [COMMIT_TOOL],
    tool_choice: "auto",
    max_tokens: 900,
  });

  const msg = completion.choices[0]?.message;
  let commit: {
    they_heard?: string;
    trust_delta?: number;
    decision_action?: string;
    decision_rationale?: string;
    next_question?: string;
    perception_reasoning?: string;
  } = {};

  const tc = msg?.tool_calls?.[0];
  if (tc?.function?.name === "commit_interviewer_act") {
    try {
      commit = safeParseJson(tc.function.arguments);
    } catch {
      commit = {};
    }
    trace.push(
      step(
        "act",
        "Act: commit interviewer move (tool)",
        "Nemotron invoked commit_interviewer_act to emit perception + next probe.",
        tc.function.arguments.slice(0, 1500),
        "commit_interviewer_act",
      ),
    );
  } else if (msg?.content) {
    try {
      commit = safeParseJson(msg.content);
    } catch {
      commit = {};
    }
    trace.push(
      step(
        "act",
        "Act: commit interviewer move (JSON fallback)",
        "Model returned JSON in content instead of tool_calls; parsed defensively.",
        msg.content.slice(0, 1500),
      ),
    );
  } else {
    trace.push(
      step(
        "act",
        "Act: Nemotron tool parse failed — local perception fallback",
        "Using Perception Agent heuristics to avoid a blank turn.",
      ),
    );
  }

  const finalAction = coerceAction(commit.decision_action, modelAction);
  const perceptionFallback = runPerceptionAgent({
    personality: persona,
    answer: input.answer,
    metrics: input.behavioral.metrics,
    trustBefore: input.memory.trustScore,
    newContradiction: input.newContradiction,
    hesitationSpike: input.behavioral.hesitationSpike,
  });

  const theyHeard =
    (commit.they_heard?.trim()?.length ?? 0) > 40
      ? commit.they_heard!.trim()
      : perceptionFallback.theyHeard;

  const trustDelta =
    typeof commit.trust_delta === "number"
      ? Math.max(-25, Math.min(25, Math.round(commit.trust_delta)))
      : perceptionFallback.trustDelta;

  const nextQuestion =
    (commit.next_question?.trim()?.length ?? 0) > 12
      ? commit.next_question!.trim()
      : `Given what you just shared, what is the single most important tradeoff you would revisit on that project?`;

  const decisionRationale =
    commit.decision_rationale?.trim() ||
    localDecision.narrative ||
    "Nemotron routing aligned with telemetry and memory context.";

  const perceptionReasoning =
    commit.perception_reasoning?.trim() || perceptionFallback.reasoning;

  return {
    theyHeard,
    trustDelta,
    nextQuestion,
    decisionAction: finalAction,
    decisionRationale,
    perceptionReasoning,
    reactTrace: trace,
  };
}
