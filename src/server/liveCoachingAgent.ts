import {
  confidenceZone,
  smallTalkTips,
  type ConfidenceZone,
} from "@/lib/interview/coachingLive";
import { isNemotronConfigured } from "@/lib/nemotron/env";
import type { InterviewDifficulty, InterviewType } from "@/types/career";
import type { LiveMetrics } from "@/types/interview";
import { nemotronTextCompletion, safeParseJson } from "@/server/nemotronClient";

export type LiveCoachingResult = {
  zone: ConfidenceZone;
  score: number;
  label: string;
  tips: string[];
  articulationTips: string[];
  source: "nemotron" | "heuristic";
};

export async function runLiveCoachingAgent(input: {
  answer: string;
  metrics: LiveMetrics;
  typingMs: number;
  question: string;
  company: string;
  role: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
}): Promise<LiveCoachingResult> {
  const heuristic = confidenceZone({
    metrics: input.metrics,
    answer: input.answer,
    typingMs: input.typingMs,
  });

  if (!isNemotronConfigured() || input.answer.trim().length < 8) {
    return { ...heuristic, source: "heuristic" };
  }

  try {
    const raw = await nemotronTextCompletion(
      JSON.stringify({
        task: "live_interview_coach",
        role: input.role,
        company: input.company,
        interview_type: input.interviewType,
        difficulty: input.difficulty,
        question: input.question,
        candidate_answer: input.answer,
        delivery_metrics: input.metrics,
        rules: [
          "Be honest like a real interviewer — never praise clarity if they said I don't know or gave a non-answer.",
          "Return JSON only with keys: zone (red|yellow|green), score (0-100), label, tips (string[] max 3), articulationTips (string[] max 3).",
          "red = non-answer, explicit uncertainty, or very weak; green = substantive confident answer; yellow = in between.",
        ],
      }),
      { max_tokens: 512, temperature: 0.4 },
    );

    const parsed = safeParseJson<{
      zone?: ConfidenceZone;
      score?: number;
      label?: string;
      tips?: string[];
      articulationTips?: string[];
    }>(raw);

    if (parsed?.zone && parsed.tips?.length) {
      return {
        zone: ["red", "yellow", "green"].includes(parsed.zone)
          ? parsed.zone
          : heuristic.zone,
        score:
          typeof parsed.score === "number"
            ? Math.max(5, Math.min(98, parsed.score))
            : heuristic.score,
        label: parsed.label ?? heuristic.label,
        tips: parsed.tips.slice(0, 3),
        articulationTips: (parsed.articulationTips ?? heuristic.articulationTips).slice(
          0,
          3,
        ),
        source: "nemotron",
      };
    }
  } catch {
    /* fallback */
  }

  return { ...heuristic, source: "heuristic" };
}

export async function runSmallTalkAgent(input: {
  phase: "opening" | "mid" | "closing";
  company: string;
  role: string;
  interviewType: InterviewType;
}): Promise<{ title: string; tips: string[]; source: "nemotron" | "heuristic" }> {
  const fallback = smallTalkTips(input);

  if (!isNemotronConfigured()) {
    return { ...fallback, source: "heuristic" };
  }

  try {
    const raw = await nemotronTextCompletion(
      JSON.stringify({
        task: "interview_small_talk_coach",
        phase: input.phase,
        role: input.role,
        company: input.company,
        interview_type: input.interviewType,
        rules: [
          "Give professional rapport tips — not cringe flattery.",
          "Return JSON only: { title: string, tips: string[] } with 4-5 tips.",
        ],
      }),
      { max_tokens: 400, temperature: 0.6 },
    );

    const parsed = safeParseJson<{ title?: string; tips?: string[] }>(raw);
    if (parsed?.title && parsed.tips?.length) {
      return {
        title: parsed.title,
        tips: parsed.tips.slice(0, 5),
        source: "nemotron",
      };
    }
  } catch {
    /* fallback */
  }

  return { ...fallback, source: "heuristic" };
}
