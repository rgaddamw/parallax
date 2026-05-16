import {
  applyQualityToMetrics,
  assessAnswerQuality,
} from "@/lib/answerQuality";
import type { InterviewerPersonality, LiveMetrics } from "@/types/interview";

const FILLER_RE =
  /\b(um|uh|like|you know|basically|sort of|kind of|actually|literally)\b/gi;

const QUESTIONS: Record<InterviewerPersonality, string[]> = {
  friendly_recruiter: [
    "Walk me through a project you are proud of and your specific role.",
    "What kind of environment helps you do your best work?",
    "Tell me about a time you disagreed with a teammate. How did you resolve it?",
    "Where do you want to grow in the next 12 months?",
    "What questions do you have for us about the team or the role?",
  ],
  skeptical_engineer: [
    "Pick a system you built. What were the invariants, and how did you enforce them?",
    "Describe a production incident you owned. What was the root cause and the guardrail after?",
    "How do you decide between optimizing for latency vs throughput?",
    "Give an example where your first design was wrong. What changed your mind?",
    "How do you test something that is inherently non-deterministic?",
  ],
  startup_founder: [
    "What is the smallest slice you shipped that created measurable impact?",
    "How do you prioritize when everything is on fire?",
    "Tell me about a bet you made with incomplete data.",
    "What would you cut from your last roadmap if you had half the team?",
    "Why this company, and why now?",
  ],
  pressure_mode: [
    "You have 60 seconds: pitch your strongest technical win.",
    "Fast: name three risks in your last launch and how you mitigated them.",
    "If I challenged your seniority claim, what proof would you show in 30 seconds?",
    "Give me a crisp answer: ship with a known bug, or miss the date?",
    "One sentence: what is the cost of being wrong in your domain?",
  ],
};

function countFillers(text: string): number {
  const m = text.match(FILLER_RE);
  return m ? m.length : 0;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Exported for live preview while the candidate types. */
export function computeMetrics(
  answer: string,
  typingMs: number,
): LiveMetrics {
  const words = answer.trim().split(/\s+/).filter(Boolean).length || 0;
  const fillers = countFillers(answer);
  const fillerDensity = words > 0 ? fillers / words : 0;

  const clarity = clamp(
    Math.round(100 - fillerDensity * 180 - (answer.length > 400 ? 8 : 0)),
    12,
    99,
  );

  const hasStructure =
    /(first|second|finally|because|therefore|for example|step)/i.test(answer);
  const confidence = clamp(
    Math.round(
      52 +
        (words > 25 ? 18 : words * 0.4) +
        (hasStructure ? 14 : 0) -
        fillers * 5 -
        (answer === answer.toLowerCase() ? 6 : 0),
    ),
    18,
    98,
  );

  const wpm =
    words > 0 && typingMs > 400
      ? (words / typingMs) * 60_000
      : words * 2.4;
  const pacing = clamp(Math.round(55 + Math.min(wpm, 220) * 0.22), 22, 96);

  let hesitation = clamp(
    Math.round(18 + fillerDensity * 120 + (typingMs > 25_000 ? 12 : 0)),
    8,
    94,
  );

  const quality = assessAnswerQuality(answer, typingMs);
  if (quality.flags.includes("long_pause_thin_content")) {
    hesitation = Math.max(hesitation, 72);
  }

  const raw = {
    confidence,
    clarity,
    fillerWords: fillers,
    pacing,
    hesitation,
  };

  return applyQualityToMetrics(raw, quality);
}

export function heardRewrite(
  personality: InterviewerPersonality,
  answer: string,
  metrics: LiveMetrics,
): string {
  const t = answer.trim();
  const quality = assessAnswerQuality(answer);

  if (!t || quality.isNonAnswer) {
    if (quality.flags.includes("uncertain")) {
      return `They heard hesitation and a non-answer. ${quality.interviewerRead} They are unlikely to credit “clarity” when you did not advance the question.`;
    }
    return `They heard a gap, not a strong signal. ${quality.interviewerRead}`;
  }

  if (quality.isWeak) {
    return `${quality.interviewerRead} Delivery metrics may look acceptable on paper, but the content did not satisfy the question.`;
  }

  const soft =
    metrics.clarity > 78
      ? "The signal landed cleanly."
      : "Some details blurred together under time pressure.";
  const edge =
    personality === "skeptical_engineer"
      ? "They mentally stress-tested your claims and looked for falsifiable specifics."
      : personality === "startup_founder"
        ? "They filtered for ownership, speed, and whether you think in bets."
        : personality === "pressure_mode"
          ? "They noted composure, brevity, and whether you could decide under heat."
          : "They listened for coachability, collaboration, and narrative coherence.";

  const bias =
    metrics.confidence < 55
      ? "Overall read: capable, but hedging reduced perceived seniority."
      : metrics.confidence > 82
        ? "Overall read: strong agency and crisp intent."
        : "Overall read: mixed—good substance, uneven delivery.";

  return `${soft} ${edge} ${bias} Key phrases that stuck: "${t.slice(0, 72)}${t.length > 72 ? "..." : ""}".`;
}

export function previewPerception(
  personality: InterviewerPersonality,
  answer: string,
  typingMs: number,
): { metrics: LiveMetrics; theyHeard: string } {
  const metrics = computeMetrics(answer, typingMs);
  return { metrics, theyHeard: heardRewrite(personality, answer, metrics) };
}

export function getQuestion(
  personality: InterviewerPersonality,
  index: number,
): string {
  const list = QUESTIONS[personality];
  return list[index % list.length] ?? list[0]!;
}

export function mockProcessTurn(input: {
  personality: InterviewerPersonality;
  questionIndex: number;
  answer: string;
  typingMs: number;
}): { question: string; theyHeard: string; metrics: LiveMetrics } {
  const question = getQuestion(input.personality, input.questionIndex);
  const metrics = computeMetrics(input.answer, input.typingMs);
  const theyHeard = heardRewrite(input.personality, input.answer, metrics);
  return { question, theyHeard, metrics };
}
