import { assessAnswerQuality } from "@/lib/answerQuality";
import type { LiveMetrics } from "@/types/interview";

export function buildAnswerCoaching(input: {
  answer: string;
  metrics: LiveMetrics;
  theyHeard: string;
  question?: string;
  typingMs?: number;
}): { headline: string; bullets: string[] } {
  const { answer, metrics, theyHeard, question, typingMs = 0 } = input;
  const quality = assessAnswerQuality(answer, typingMs);
  const bullets: string[] = [];
  const wordCount = quality.wordCount;

  if (quality.isNonAnswer) {
    const headline = quality.flags.includes("uncertain")
      ? "Real interviewers penalize stopping at “I don’t know” — partial credit is still available."
      : "This would not read as a strong answer in a live panel — you need substance or a pivot.";

    if (quality.flags.includes("uncertain")) {
      bullets.push(
        "Replace “I don’t know” with: “I haven’t done X directly, but on [project] I handled similar Y by …” then one metric.",
      );
      bullets.push(
        "Or outline how you would find out: “I’d clarify constraints, check docs/logs, spike a small repro, and sync with …”",
      );
    }
    if (quality.flags.includes("empty")) {
      bullets.push(
        "Long silence reads as freeze — say: “Let me think for a moment,” then give a structured partial answer.",
      );
    }
    if (quality.flags.includes("long_pause_thin_content")) {
      bullets.push(
        "After a pause, deliver at least: context (10s) → your action (40s) → outcome with a number.",
      );
    }
    bullets.push(
      question
        ? `This question asked about: “${question.slice(0, 80)}${question.length > 80 ? "…" : ""}” — anchor your next attempt to that scope.`
        : "Tie your next answer directly to the question asked before adding background.",
    );

    return { headline, bullets: bullets.slice(0, 4) };
  }

  if (quality.isWeak) {
    bullets.push(
      "Interviewers rarely praise clarity when the answer does not contain a concrete example or decision you owned.",
    );
    if (quality.flags.includes("too_short")) {
      bullets.push(
        "Expand with STAR: Situation (1 sentence) → your Task → Actions you took → Result with a metric.",
      );
    }
    if (quality.flags.includes("evasive")) {
      bullets.push(
        "Swap generalities (“it depends”) for one named project, tradeoff, and what you would do differently.",
      );
    }
    const headline =
      "Weak signal for this question — in a real loop this would trigger a skeptical follow-up, not praise.";
    if (bullets.length < 2) {
      bullets.push(
        "Lead with a one-line thesis, then two proof points the interviewer can verify.",
      );
    }
    return { headline, bullets: bullets.slice(0, 4) };
  }

  if (metrics.hesitation > 70) {
    bullets.push(
      "Pause and name one concrete artifact you owned (file, model, metric) before narrating team context.",
    );
  }
  if (metrics.clarity < 45 || wordCount < 25) {
    bullets.push(
      "Lead with a one-line thesis, then two proof points with numbers or constraints the interviewer can verify.",
    );
  }
  if (metrics.fillerWords > 5) {
    bullets.push(
      "Replace hedges (“kind of”, “pretty much”) with precise verbs and timelines so delivery reads as confident.",
    );
  }
  if (metrics.confidence < 50) {
    bullets.push(
      "End with what you would measure next week if you stayed on the project — that signals ownership.",
    );
  }

  if (bullets.length === 0) {
    bullets.push(
      "Tighten one sentence into a headline claim, then add one metric or tradeoff you personally defended.",
    );
  }

  const headline =
    metrics.confidence >= 70 &&
    metrics.clarity >= 65 &&
    wordCount >= 30 &&
    !theyHeard.toLowerCase().includes("non-answer")
      ? "Solid signal — polish delivery so the interviewer’s compression matches your intent."
      : "Mixed signal — tighten structure so “what they heard” matches a complete answer.";

  return { headline, bullets: bullets.slice(0, 4) };
}
