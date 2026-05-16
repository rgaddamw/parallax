import type { LiveMetrics } from "@/types/interview";

export type AnswerQualityFlag =
  | "empty"
  | "too_short"
  | "uncertain"
  | "evasive"
  | "long_pause_thin_content";

export type AnswerQualitySeverity = "ok" | "weak" | "poor";

export interface AnswerQuality {
  flags: AnswerQualityFlag[];
  severity: AnswerQualitySeverity;
  isWeak: boolean;
  isNonAnswer: boolean;
  wordCount: number;
  interviewerRead: string;
}

const UNCERTAIN_RE =
  /\b(i\s*(?:'m| am)\s*not\s+sure|not\s+sure|don't\s+know|dont\s+know|do\s+not\s+know|no\s+idea|not\s+really|can't\s+say|cannot\s+say|unsure|hard\s+to\s+say|pass\s+on\s+that|i\s+guess|haven't\s+done|have\s+not\s+done|no\s+experience|nothing\s+comes\s+to\s+mind)\b/i;

const EVASIVE_RE =
  /\b(it depends|generally speaking|in theory|broadly|various things|many things|sort of everything)\b/i;

export function assessAnswerQuality(
  answer: string,
  typingMs = 0,
): AnswerQuality {
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const flags: AnswerQualityFlag[] = [];

  if (!trimmed) {
    flags.push("empty");
  } else if (wordCount < 12) {
    flags.push("too_short");
  }

  if (UNCERTAIN_RE.test(trimmed)) {
    flags.push("uncertain");
  }

  if (
    EVASIVE_RE.test(trimmed) &&
    wordCount < 45 &&
    !/\b(for example|specifically|i built|i led|metric|percent)\b/i.test(trimmed)
  ) {
    flags.push("evasive");
  }

  if (typingMs > 18_000 && wordCount < 22 && trimmed) {
    flags.push("long_pause_thin_content");
  }

  const isNonAnswer =
    flags.includes("empty") ||
    flags.includes("uncertain") ||
    (flags.includes("too_short") && wordCount < 8);

  const isWeak =
    isNonAnswer ||
    flags.includes("evasive") ||
    flags.includes("long_pause_thin_content") ||
    (flags.includes("too_short") && wordCount < 18);

  let severity: AnswerQualitySeverity = "ok";
  if (isNonAnswer) severity = "poor";
  else if (isWeak) severity = "weak";

  let interviewerRead: string;
  if (flags.includes("empty")) {
    interviewerRead =
      "Dead air or silence — the interviewer assumes you have no prepared signal for this topic.";
  } else if (flags.includes("uncertain")) {
    interviewerRead =
      "Explicit uncertainty (“not sure” / “don’t know”) without a pivot reads as unprepared; trust drops sharply in real panels.";
  } else if (flags.includes("long_pause_thin_content")) {
    interviewerRead =
      "Long pause followed by a thin answer — reads as struggling to retrieve relevant experience.";
  } else if (flags.includes("evasive")) {
    interviewerRead =
      "Vague generalities without a concrete example — interviewer likely thinks you are dodging depth.";
  } else if (flags.includes("too_short")) {
    interviewerRead =
      "Answer too brief for the question — likely missing structure, proof, or ownership.";
  } else {
    interviewerRead =
      "Answer addressed the prompt with enough substance for the interviewer to score signal.";
  }

  return {
    flags,
    severity,
    isWeak,
    isNonAnswer,
    wordCount,
    interviewerRead,
  };
}

/** Pull metrics toward realistic scores when delivery is a non-answer. */
export function applyQualityToMetrics(
  metrics: LiveMetrics,
  quality: AnswerQuality,
): LiveMetrics {
  if (quality.severity === "ok") return metrics;

  if (quality.isNonAnswer) {
    return {
      ...metrics,
      confidence: Math.min(metrics.confidence, 28),
      clarity: Math.min(metrics.clarity, 32),
      hesitation: Math.max(metrics.hesitation, 78),
    };
  }

  return {
    ...metrics,
    confidence: Math.min(metrics.confidence, 48),
    clarity: Math.min(metrics.clarity, 52),
    hesitation: Math.max(metrics.hesitation, 65),
  };
}
