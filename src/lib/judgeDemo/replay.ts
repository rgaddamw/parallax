import type { ReplayInsight } from "@/types/interview";
import type { TurnRecord } from "@/types/interview";
import {
  JUDGE_DEMO_HIRING_SIGNAL,
  JUDGE_DEMO_IMPROVED_ANSWER,
  JUDGE_DEMO_QUESTION,
  JUDGE_DEMO_THEY_HEARD,
  JUDGE_DEMO_TRUST_DROP,
  JUDGE_DEMO_VAGUE_ANSWER,
} from "@/lib/judgeDemo/scenario";

export function buildJudgeDemoReplay(turn: TurnRecord): ReplayInsight {
  return {
    strongestMoment: {
      question: JUDGE_DEMO_QUESTION,
      summary: "Opening intent was coherent; delivery started stable before specificity collapsed.",
      quote: turn.userSaid.slice(0, 120) + "...",
    },
    weakestMoment: {
      question: JUDGE_DEMO_QUESTION,
      summary: JUDGE_DEMO_TRUST_DROP,
      quote: '"I helped a lot" — no artifact, metric, or personal subsystem named.',
    },
    interviewerInterpretation: JUDGE_DEMO_THEY_HEARD,
    improvedAnswer: JUDGE_DEMO_IMPROVED_ANSWER,
    hiringRecommendation: {
      verdict: "BORDERLINE",
      headline: JUDGE_DEMO_HIRING_SIGNAL,
      rationale:
        "Replay Agent synthesized one high-stakes turn: behavioral hesitation + low specificity triggered skepticism routing. NemoClaw blocked unsafe behavioral export. With the rewritten answer, simulated panel moves to lean hire.",
      riskFlags: [
        "Unverified leadership claim vs team-generic answer",
        "Hesitation spike under specificity probe",
        "Blocked: export_behavioral_profile (policy)",
      ],
    },
    judgeSections: {
      whatYouSaid: turn.userSaid,
      whatTheyHeard: turn.theyHeard,
      trustDropMoment: JUDGE_DEMO_TRUST_DROP,
      improvedAnswer: JUDGE_DEMO_IMPROVED_ANSWER,
      hiringSignal: JUDGE_DEMO_HIRING_SIGNAL,
    },
  };
}
