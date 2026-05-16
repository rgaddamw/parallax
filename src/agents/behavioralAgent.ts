import type { BehavioralResult } from "@/agents/types";
import { assessAnswerQuality } from "@/lib/answerQuality";
import { computeMetrics } from "@/lib/mockInterviewEngine";

export function runBehavioralAgent(input: {
  answer: string;
  typingMs: number;
  questionIndex: number;
}): BehavioralResult {
  const metrics = computeMetrics(input.answer, input.typingMs);
  const quality = assessAnswerQuality(input.answer, input.typingMs);
  const hesitationSpike =
    metrics.hesitation >= 78 || quality.flags.includes("long_pause_thin_content");
  const stressSignals: string[] = [];
  if (quality.isNonAnswer) stressSignals.push("non-answer / explicit uncertainty");
  if (quality.isWeak && !quality.isNonAnswer) {
    stressSignals.push("underdeveloped answer for prompt");
  }
  if (metrics.fillerWords >= 4) stressSignals.push("elevated filler density");
  if (metrics.confidence < 52) stressSignals.push("underassertive delivery");
  if (input.typingMs > 28_000 && input.answer.trim().length < 80) {
    stressSignals.push("long dwell time vs thin content");
  }
  if (hesitationSpike) stressSignals.push("hesitation spike vs baseline");

  const reasoning = `Behavioral Agent fused lexical, temporal, and rhythm features for turn ${
    input.questionIndex + 1
  }. Composite view: confidence ${metrics.confidence}, clarity ${
    metrics.clarity
  }, pacing ${metrics.pacing}. Content quality: ${quality.severity} (${
    quality.flags.join(", ") || "none"
  }). ${
    quality.isNonAnswer
      ? "Treated as a failed answer—do not reward clarity metrics alone."
      : hesitationSpike
        ? "Hesitation crossed an adaptive threshold—downstream agents should treat delivery as noisy."
        : "Hesitation remained within an acceptable band for this interviewer mode."
  }`;

  return { metrics, hesitationSpike, stressSignals, reasoning };
}
