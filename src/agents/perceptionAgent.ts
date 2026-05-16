import type { PerceptionResult } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";
import type { LiveMetrics } from "@/types/interview";
import type { Contradiction } from "@/agents/types";
import { assessAnswerQuality } from "@/lib/answerQuality";
import { heardRewrite } from "@/lib/mockInterviewEngine";

export function runPerceptionAgent(input: {
  personality: InterviewerPersonality;
  answer: string;
  metrics: LiveMetrics;
  trustBefore: number;
  newContradiction: Contradiction | null;
  hesitationSpike: boolean;
}): PerceptionResult {
  const quality = assessAnswerQuality(input.answer);
  const base = heardRewrite(input.personality, input.answer, input.metrics);
  let trustDelta = 0;
  if (quality.isNonAnswer) trustDelta -= 18;
  else if (quality.isWeak) trustDelta -= 10;
  if (input.hesitationSpike) trustDelta -= 6;
  if (input.metrics.fillerWords >= 5) trustDelta -= 4;
  if (input.metrics.confidence >= 84 && !quality.isWeak) trustDelta += 5;
  if (input.newContradiction) trustDelta -= 12;
  if (input.metrics.clarity >= 85 && !quality.isWeak) trustDelta += 3;

  const hiddenSignals: string[] = [];
  if (quality.isNonAnswer) {
    hiddenSignals.push("panel logged non-answer; clarity not credited");
  }
  if (quality.isWeak) hiddenSignals.push("answer length/substance below bar");
  if (input.hesitationSpike) hiddenSignals.push("listener inferred deliberation vs evasion");
  if (input.metrics.confidence < 55) hiddenSignals.push("softened credibility on decisive language");
  if (input.newContradiction) hiddenSignals.push("trust cliff on narrative inconsistency");
  if (input.metrics.pacing < 40) hiddenSignals.push("perceived rushed thinking under timebox");

  let theyHeard = base;
  if (input.newContradiction) {
    theyHeard += ` They privately logged a tension: "${input.newContradiction.description.slice(0, 120)}..."`;
  }
  if (trustDelta <= -6) {
    theyHeard +=
      " Perception Agent lowered the modeled trust trajectory based on delivery and consistency cues.";
  } else if (trustDelta >= 4 && !quality.isWeak) {
    theyHeard +=
      " Perception Agent nudged trust upward: the story felt anchored and inspectable.";
  } else if (quality.isNonAnswer) {
    theyHeard +=
      " Perception Agent penalized trust: stopping at uncertainty without a pivot is a negative signal in real loops.";
  }

  const reasoning = `Perception Agent translated lexical evidence into an interviewer mental model (bias, compression, inference). Trust delta ${trustDelta >= 0 ? "+" : ""}${trustDelta} vs prior ${input.trustBefore}. Hidden signals: ${hiddenSignals.length ? hiddenSignals.join("; ") : "none above threshold"}.`;

  return {
    theyHeard,
    trustDelta,
    hiddenSignals,
    reasoning,
  };
}
