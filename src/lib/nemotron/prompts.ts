import type { InterviewerPersonality } from "@/types/interview";
import type { LiveMetrics } from "@/types/interview";
import type { SessionMemory } from "@/agents/types";
import type { TurnRecord } from "@/types/interview";

export const INTERVIEWER_SYSTEM = `You are the Parallax interview reasoning engine backed by NVIDIA Nemotron.
You simulate an autonomous hiring panel: you must be precise, skeptical when warranted, and never invent resume facts not present in context.
Always follow the user's requested output shape exactly (JSON only when asked).`;

export function buildObserveUserPayload(input: {
  personality: InterviewerPersonality;
  questionIndex: number;
  currentQuestion: string;
  answer: string;
  typingMs: number;
  metrics: LiveMetrics;
  jobDescriptionExcerpt: string;
}): string {
  return JSON.stringify(
    {
      phase: "observe",
      instructions:
        "List only observable signals from the candidate's last answer and telemetry. No advice yet.",
      context: {
        personality: input.personality,
        turn: input.questionIndex + 1,
        question: input.currentQuestion,
        answer: input.answer,
        typing_ms: input.typingMs,
        metrics: input.metrics,
        job_description_excerpt: input.jobDescriptionExcerpt.slice(0, 800),
      },
      output_schema: {
        observation: "string — concrete signals (hesitation, fillers, structure, length, tone)",
        salient_quotes: "string[] — short verbatim fragments max 3",
      },
    },
    null,
    2,
  );
}

export function buildAnalyzeUserPayload(observeJson: string): string {
  return JSON.stringify(
    {
      phase: "analyze",
      prior_observe_json: observeJson,
      instructions:
        "Explain how an interviewer would interpret those signals. Reference confidence, trust, and risk of evasion. Still no policy actions.",
      output_schema: {
        analysis: "string",
        confidence_trend: '"up" | "down" | "flat"',
        trust_risk: '"low" | "medium" | "high"',
      },
    },
    null,
    2,
  );
}

export function buildDecideUserPayload(analyzeJson: string): string {
  return JSON.stringify(
    {
      phase: "decide",
      prior_analyze_json: analyzeJson,
      instructions:
        "Choose the interviewer routing action for the NEXT beat. Prefer surgical escalation over generic chat.",
      allowed_actions: [
        "continue",
        "interrupt",
        "pressure",
        "deeper_technical",
        "challenge_contradiction",
        "escalate_skepticism",
      ],
      output_schema: {
        decision_action: "one of allowed_actions",
        rationale: "string — crisp, one paragraph",
        interrupt_copy: "string — empty unless decision_action is interrupt",
        pressure_copy: "string — empty unless decision_action is pressure",
      },
    },
    null,
    2,
  );
}

export function buildActToolContext(input: {
  observeJson: string;
  analyzeJson: string;
  decideJson: string;
  memory: SessionMemory;
  priorTurns: TurnRecord[];
  basePersonality: InterviewerPersonality;
  nextQuestionIndex: number;
  contradictionHint: string | null;
}): string {
  return JSON.stringify(
    {
      phase: "act",
      observe: JSON.parse(input.observeJson) as unknown,
      analyze: JSON.parse(input.analyzeJson) as unknown,
      decide: JSON.parse(input.decideJson) as unknown,
      memory: {
        trust_score: input.memory.trustScore,
        contradictions: input.memory.contradictions,
        pressure_level: input.memory.pressureLevel,
      },
      prior_turns_count: input.priorTurns.length,
      base_personality: input.basePersonality,
      next_question_index: input.nextQuestionIndex,
      contradiction_hint: input.contradictionHint,
      instructions:
        "Call the tool commit_interviewer_act exactly once with the next spoken interviewer move and the 'what they heard' compression layer.",
    },
    null,
    2,
  );
}
