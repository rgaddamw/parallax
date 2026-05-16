import { assessAnswerQuality } from "@/lib/answerQuality";
import type { InterviewDifficulty, InterviewType } from "@/types/career";
import type { LiveMetrics } from "@/types/interview";

export type ConfidenceZone = "red" | "yellow" | "green";

/** Suggested time budget for this answer style (seconds). */
export function targetAnswerSeconds(
  interviewType: InterviewType,
  difficulty: InterviewDifficulty,
): number {
  if (difficulty === "pressure") {
    return interviewType === "technical" ? 75 : 55;
  }
  switch (interviewType) {
    case "behavioral":
      return 105;
    case "technical":
      return 150;
    case "mixed":
    default:
      return 120;
  }
}

export function confidenceZone(input: {
  metrics: LiveMetrics;
  answer: string;
  typingMs?: number;
}): {
  zone: ConfidenceZone;
  score: number;
  label: string;
  tips: string[];
  articulationTips: string[];
} {
  const quality = assessAnswerQuality(input.answer, input.typingMs ?? 0);
  let score = input.metrics.confidence;

  if (quality.isNonAnswer) score = Math.min(score, 25);
  else if (quality.isWeak) score = Math.min(score, 48);

  if (input.metrics.fillerWords >= 4) score -= 8;
  if (input.metrics.hesitation > 70) score -= 6;
  if (/\b(i\s*(?:'m| am)\s*not\s+sure|don't know|dont know)\b/i.test(input.answer)) {
    score = Math.min(score, 30);
  }

  score = Math.max(8, Math.min(98, score));

  let zone: ConfidenceZone = "green";
  if (score < 45 || quality.isNonAnswer) zone = "red";
  else if (score < 68 || quality.isWeak) zone = "yellow";

  const tips: string[] = [];
  const articulationTips: string[] = [];

  if (zone === "red") {
    tips.push(
      "Lead with “I” and one concrete outcome — interviewers downgrade hedging and “I don’t know” without a pivot.",
    );
    tips.push(
      "Use a headline sentence first (“I owned X”), then one metric, then 20 seconds of context.",
    );
    if (quality.flags.includes("uncertain")) {
      tips.push(
        "Try: “I haven’t done that exact task, but here’s the closest example…” — partial credit beats stopping.",
      );
    }
  } else if (zone === "yellow") {
    tips.push(
      "You’re in range — add one number (latency, users, %) and name what you personally built.",
    );
    tips.push(
      "Replace fillers with a half-second pause; pauses read as thoughtfulness, “um” reads as doubt.",
    );
  } else {
    tips.push(
      "Strong delivery — keep the same structure for the next question: claim → proof → result.",
    );
    tips.push(
      "Maintain energy through the last sentence; trailing off is where confidence drops.",
    );
  }

  if (input.metrics.fillerWords >= 3) {
    articulationTips.push(
      `Cut filler words (${input.metrics.fillerWords} detected) — pause instead of “um/like”.`,
    );
  }
  if (input.metrics.pacing < 45) {
    articulationTips.push(
      "You’re rushing — slow down on the first clause so key words land clearly.",
    );
  }
  if (input.metrics.pacing > 85 && input.answer.length > 80) {
    articulationTips.push(
      "Pace is fast — add a comma-breath between “situation” and “my action”.",
    );
  }
  if (input.metrics.hesitation > 65) {
    articulationTips.push(
      "Long pauses vs thin content — outline aloud: “Three parts: context, my role, outcome.”",
    );
  }
  if (input.metrics.clarity < 55) {
    articulationTips.push(
      "Articulation: use signposts — “First…”, “The key decision…”, “The result was…”.",
    );
  }
  if (articulationTips.length === 0 && zone === "green") {
    articulationTips.push(
      "Voice sounds clear — keep volume steady and finish sentences down, not up (upspeak).",
    );
  }

  const label =
    zone === "red"
      ? "Sound more confident"
      : zone === "yellow"
        ? "Okay — push to strong"
        : "Confident delivery";

  return { zone, score, label, tips: tips.slice(0, 3), articulationTips: articulationTips.slice(0, 3) };
}

export type SmallTalkPhase = "opening" | "mid" | "closing";

export function smallTalkTips(input: {
  phase: SmallTalkPhase;
  company: string;
  role: string;
  interviewType: InterviewType;
}): { title: string; tips: string[] } {
  const { phase, company, role, interviewType } = input;
  const co = company.trim() || "the company";
  const rl = role.trim() || "this role";

  if (phase === "opening") {
    return {
      title: "Opening rapport (before deep questions)",
      tips: [
        `Warm opener: “Thanks for making time — I’ve been excited about ${rl} at ${co} because …” (one specific reason).`,
        "Mirror their energy: brief friendly tone, then let them steer into structure.",
        `Light compliment (specific): “I liked your post/talk on …” or “The team’s work on … stood out in my research.”`,
        "Small talk bridge: weather/travel → “Glad we could do virtual — I’m ready when you are.”",
        interviewType === "technical"
          ? "For eng loops: “Happy to dive into systems — where would you like to start?”"
          : "For behavioral: “I’ve prepared a few stories aligned to this role — happy to start wherever you prefer.”",
      ],
    };
  }

  if (phase === "closing") {
    return {
      title: "Closing strong (last impression)",
      tips: [
        `Ask 1 thoughtful question: “What does success look like in the first 90 days for ${rl}?”`,
        `Reiterate fit in one line: “I’m most energized by … which maps directly to ${co}’s …”`,
        "Thank them for rigor: “I appreciated the depth of today’s questions.”",
        "Confirm next steps: “What are the next stages and timeline?”",
        "Avoid overselling — confident gratitude beats flattery.",
      ],
    };
  }

  return {
    title: "Mid-interview rapport",
    tips: [
      "Acknowledge a good question: “That’s a great angle — let me structure my answer.”",
      "If you need time: “May I take a few seconds to organize my thoughts?”",
      "Bridge back to role: “That ties to why I’m interested in this team’s …”",
    ],
  };
}
