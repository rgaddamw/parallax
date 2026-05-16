export type InterviewerPersonality =
  | "friendly_recruiter"
  | "skeptical_engineer"
  | "startup_founder"
  | "pressure_mode";

export type InterviewStep =
  | "setup"
  | "branch"
  | "live"
  | "resume_intel"
  | "replay";

export interface LiveMetrics {
  confidence: number;
  clarity: number;
  fillerWords: number;
  pacing: number;
  hesitation: number;
}

export interface TurnRecord {
  id: string;
  question: string;
  userSaid: string;
  theyHeard: string;
  metrics: LiveMetrics;
  timestamp: number;
  decisionSummary?: string;
  trustScoreAfter?: number;
  decisionAction?: string;
}

export interface HiringRecommendation {
  verdict: "LEAN_HIRE" | "BORDERLINE" | "NO_HIRE";
  headline: string;
  rationale: string;
  riskFlags: string[];
}

export interface ReplayInsight {
  strongestMoment: { question: string; summary: string; quote: string };
  weakestMoment: { question: string; summary: string; quote: string };
  interviewerInterpretation: string;
  improvedAnswer: string;
  hiringRecommendation: HiringRecommendation;
  /** Populated by judge demo replay for labeled cinematic sections */
  judgeSections?: {
    whatYouSaid: string;
    whatTheyHeard: string;
    trustDropMoment: string;
    improvedAnswer: string;
    hiringSignal: string;
  };
}

export const PERSONALITIES: {
  id: InterviewerPersonality;
  label: string;
  blurb: string;
}[] = [
  {
    id: "friendly_recruiter",
    label: "Friendly Recruiter",
    blurb: "Warm tone, big-picture prompts, forgiving follow-ups.",
  },
  {
    id: "skeptical_engineer",
    label: "Skeptical Engineer",
    blurb: "Deep dives, edge cases, and precision on tradeoffs.",
  },
  {
    id: "startup_founder",
    label: "Startup Founder",
    blurb: "Bias to velocity, ownership, and scrappy execution.",
  },
  {
    id: "pressure_mode",
    label: "Pressure Mode",
    blurb: "Rapid cadence, interruptions, and timeboxed thinking.",
  },
];
