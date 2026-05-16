import { assessAnswerQuality } from "@/lib/answerQuality";
import type {
  InterviewDifficulty,
  InterviewType,
  LearningResource,
  PostInterviewReport,
} from "@/types/career";
import type { TurnRecord } from "@/types/interview";
import type { ReplayInsight } from "@/types/interview";

function turnQuality(t: TurnRecord) {
  return assessAnswerQuality(t.userSaid);
}

function roleResources(
  company: string,
  role: string,
  interviewType: InterviewType,
): LearningResource[] {
  const lower = `${company} ${role}`.toLowerCase();
  const resources: LearningResource[] = [
    {
      title: "STAR method for behavioral answers",
      description:
        "Structure ownership stories: Situation, Task, Action, Result — with metrics in the Result.",
      url: "https://www.themuse.com/advice/star-interview-method",
    },
    {
      title: "Tech interview handbook — systems & coding",
      description:
        "Refresh fundamentals, tradeoffs, and how to narrate design decisions under time pressure.",
      url: "https://www.techinterviewhandbook.org/",
    },
  ];

  if (/nvidia|gpu|cuda|ml|ai|deep learning/i.test(lower)) {
    resources.unshift(
      {
        title: "NVIDIA Developer — CUDA & accelerated computing",
        description: `Align ${role} stories with GPU programming, performance, and production ML if relevant.`,
        url: "https://developer.nvidia.com/cuda-zone",
      },
      {
        title: "NVIDIA AI documentation",
        description: "Model deployment, inference, and enterprise AI patterns for technical depth.",
        url: "https://docs.nvidia.com/nim/",
      },
    );
  }

  if (/software|engineer|developer|swe|systems/i.test(lower)) {
    resources.push({
      title: "System design primer",
      description:
        "Practice articulating scalability, reliability, and ownership for backend/systems loops.",
      url: "https://github.com/donnemartin/system-design-primer",
    });
  }

  if (interviewType === "behavioral") {
    resources.push({
      title: "Amazon leadership principles (behavioral framing)",
      description:
        "Map your stories to clear principles — useful even outside Amazon-style loops.",
      url: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
    });
  }

  if (interviewType === "technical") {
    resources.push({
      title: "LeetCode patterns (focused practice)",
      description:
        "Pick 2–3 patterns per week; prioritize explaining approach aloud, not memorizing solutions.",
      url: "https://leetcode.com/explore/",
    });
  }

  return resources.slice(0, 6);
}

function buildDidWell(
  turns: TurnRecord[],
  role: string,
): string[] {
  const items: string[] = [];
  const substantive = turns.filter((t) => !turnQuality(t).isWeak);
  const highConf = substantive.filter((t) => t.metrics.confidence >= 72);
  const clear = substantive.filter((t) => t.metrics.clarity >= 70);

  if (highConf.length > 0) {
    items.push(
      `Confident delivery on ${highConf.length} answer${highConf.length > 1 ? "s" : ""} — you sounded credible for ${role}.`,
    );
  }
  if (clear.length > 0) {
    items.push(
      `Clear structure when explaining technical or project work (${clear.length} answers with real substance).`,
    );
  }
  const lowHesitation = turns.filter((t) => t.metrics.hesitation < 35);
  if (lowHesitation.length >= Math.ceil(turns.length / 2)) {
    items.push("Composed pacing — low hesitation across most of the loop.");
  }
  const ownership = turns.filter((t) =>
    /\b(i |my |i've|i led|i built|i designed)\b/i.test(t.userSaid),
  );
  if (ownership.length >= Math.ceil(turns.length / 2)) {
    items.push("Used first-person ownership language — interviewers weight individual contribution heavily.");
  }

  if (items.length === 0) {
    items.push(
      "You completed the full loop — finishing under pressure is a baseline signal interviewers track.",
    );
  }
  return items.slice(0, 5);
}

function buildWorkOn(
  turns: TurnRecord[],
  role: string,
  difficulty: InterviewDifficulty,
): string[] {
  const items: string[] = [];
  const nonAnswers = turns.filter((t) => turnQuality(t).isNonAnswer);
  const weakAnswers = turns.filter((t) => turnQuality(t).isWeak);

  if (nonAnswers.length > 0) {
    items.push(
      `${nonAnswers.length} answer${nonAnswers.length > 1 ? "s" : ""} included “I don’t know” / non-answers — real interviewers rarely give credit for clarity when you don’t advance the question.`,
    );
  }
  if (weakAnswers.length > 0) {
    items.push(
      `${weakAnswers.length} answer${weakAnswers.length > 1 ? "s" : ""} were too short or vague — expect skeptical follow-ups, not praise.`,
    );
  }
  const weakConf = turns.filter(
    (t) => t.metrics.confidence < 55 && !turnQuality(t).isNonAnswer,
  );
  const fillers = turns.filter((t) => t.metrics.fillerWords > 8);
  const teamHeavy = turns.filter((t) =>
    /\b(we |our team|together)\b/i.test(t.userSaid) &&
    !/\b(i |my )\b/i.test(t.userSaid),
  );

  if (weakConf.length > 0) {
    items.push(
      `Strengthen assertiveness on ${weakConf.length} answer${weakConf.length > 1 ? "s" : ""} — lead with "I" and one metric before context.`,
    );
  }
  if (fillers.length > 0) {
    items.push(
      "Reduce filler words (um, like, kind of) — pause instead; silence reads as thoughtfulness.",
    );
  }
  if (teamHeavy.length > 0) {
    items.push(
      `Reframe ${teamHeavy.length} team-heavy answer${teamHeavy.length > 1 ? "s" : ""}: split "team context" (10s) from "my contribution" (60s).`,
    );
  }
  items.push(
    `Prepare 3 STAR stories tailored to ${role}: conflict, failure, and technical depth.`,
  );
  if (difficulty === "pressure") {
    items.push(
      "Practice 60-second pitches — pressure mode rewards crisp headlines before detail.",
    );
  }

  return items.slice(0, 5);
}

export function buildPostInterviewReport(
  turns: TurnRecord[],
  replay: ReplayInsight | null,
  company: string,
  role: string,
  options?: {
    interviewType?: InterviewType;
    difficulty?: InterviewDifficulty;
    questionCount?: number;
  },
): PostInterviewReport {
  const interviewType = options?.interviewType ?? "mixed";
  const difficulty = options?.difficulty ?? "normal";
  const questionCount = options?.questionCount ?? turns.length;

  const scored = (t: TurnRecord) => {
    const q = turnQuality(t);
    if (q.isNonAnswer) return -100;
    if (q.isWeak) return -40;
    return (
      t.metrics.confidence * 0.5 +
      t.metrics.clarity * 0.35 -
      t.metrics.hesitation * 0.15
    );
  };

  const sorted = [...turns].sort((a, b) => scored(b) - scored(a));
  const weakest = [...turns].sort((a, b) => scored(a) - scored(b));

  const strongest = sorted
    .filter((t) => !turnQuality(t).isWeak)
    .slice(0, 2)
    .map((t) => ({
      question: t.question,
      quote: t.userSaid.slice(0, 120),
      why: `Substantive answer with confidence ${t.metrics.confidence} and clarity ${t.metrics.clarity} for ${role}.`,
    }));

  const weak = weakest.slice(0, 2).map((t) => {
    const q = turnQuality(t);
    const why = q.isNonAnswer
      ? "Non-answer or explicit uncertainty — interviewers treat this as a miss, not strong clarity."
      : q.isWeak
        ? "Too thin or evasive for the question — panel would push for specifics."
        : `Hesitation (${t.metrics.hesitation}) or fillers (${t.metrics.fillerWords}) reduced perceived ownership.`;
    return {
      question: t.question,
      quote: t.userSaid.slice(0, 120),
      why,
    };
  });

  const substantiveTurns = turns.filter((t) => !turnQuality(t).isNonAnswer);
  const avgConf =
    substantiveTurns.length > 0
      ? substantiveTurns.reduce((s, t) => s + t.metrics.confidence, 0) /
        substantiveTurns.length
      : turns.length > 0
        ? turns.reduce((s, t) => s + t.metrics.confidence, 0) / turns.length
        : 50;

  const nonAnswerCount = turns.filter((t) => turnQuality(t).isNonAnswer).length;

  let confidenceAnalysis =
    avgConf >= 75
      ? "Delivery stayed assertive on substantive answers; the interviewer likely read you as credible with minor polish gaps."
      : avgConf >= 55
        ? "Mixed confidence — strong ideas occasionally buried under hedging and collaborative framing."
        : "Confidence read as tentative; ownership and specificity need strengthening for this loop.";

  if (nonAnswerCount > 0) {
    confidenceAnalysis += ` ${nonAnswerCount} response${nonAnswerCount > 1 ? "s" : ""} were non-answers (“not sure” / too thin) — those override positive clarity scores in a real loop.`;
  }

  const interviewerPerception =
    replay?.interviewerInterpretation ??
    `For ${role} at ${company}, the panel weighted ownership, technical depth, and composure. Trust trajectory reflected how crisply you separated personal contribution from team outcomes.`;

  const rewrittenAnswers = turns.slice(0, 3).map((t) => ({
    question: t.question,
    improved: replay?.improvedAnswer
      ? replay.improvedAnswer
      : `Lead with "I designed…" and one metric. Anchor to ${company}'s ${role} scope. Replace fillers; name stack and tradeoff in under 90 seconds.`,
  }));

  const hire = replay?.hiringRecommendation ?? {
    verdict: avgConf >= 70 ? "LEAN_HIRE" : avgConf >= 50 ? "BORDERLINE" : "NO_HIRE",
    headline: "Simulated panel outcome",
    rationale: "Heuristic synthesis from autonomous agent loop.",
  };

  const didWell = buildDidWell(turns, role);
  const workOn = buildWorkOn(turns, role, difficulty);
  const resources = roleResources(company, role, interviewType);

  const overallSummary = `You completed ${turns.length} of ${questionCount} questions for ${role} at ${company}. ${
    avgConf >= 70
      ? "Overall you projected solid hire signal with room to sharpen specificity."
      : avgConf >= 50
        ? "Overall you showed relevant experience but need clearer ownership and tighter delivery."
        : "Overall the loop suggests more preparation on structured stories and confident framing."
  } ${hire.headline}`;

  return {
    overallSummary,
    didWell,
    workOn,
    resources,
    strongestAnswers: strongest,
    weakestMoments: weak,
    confidenceAnalysis,
    interviewerPerception,
    rewrittenAnswers,
    hiringOutcome: {
      verdict: hire.verdict,
      headline: hire.headline,
      rationale: hire.rationale,
    },
  };
}
