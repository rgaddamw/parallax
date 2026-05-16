export type CareerMode = "live_interview" | "resume_intelligence" | null;

export type InterviewType = "behavioral" | "technical" | "mixed";

export type InterviewDifficulty = "normal" | "pressure";

export interface ResumeProfile {
  rawText: string;
  detectedSkills: string[];
  projects: string[];
  themes: string[];
}

export interface ResumeIssue {
  id: string;
  category:
    | "technical_depth"
    | "bullet_quality"
    | "formatting"
    | "impact"
    | "vague_language"
    | "ats"
    | "role_fit";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  example?: string;
}

export interface SkillRecommendation {
  name: string;
  rationale: string;
  kind: "certification" | "course" | "technology" | "project" | "portfolio";
}

export interface RewrittenBullet {
  section: string;
  before: string;
  after: string;
}

export interface ResumeIntelligenceReport {
  generatedAt: number;
  company: string;
  role: string;
  overallScore: number;
  summary: string;
  issues: ResumeIssue[];
  recommendations: string[];
  skillRecommendations: SkillRecommendation[];
  rewrittenBullets: RewrittenBullet[];
  roadmap: string[];
}

export interface LearningResource {
  title: string;
  description: string;
  url?: string;
}

export interface PostInterviewReport {
  overallSummary: string;
  didWell: string[];
  workOn: string[];
  resources: LearningResource[];
  strongestAnswers: { question: string; quote: string; why: string }[];
  weakestMoments: { question: string; quote: string; why: string }[];
  confidenceAnalysis: string;
  interviewerPerception: string;
  rewrittenAnswers: { question: string; improved: string }[];
  hiringOutcome: {
    verdict: "LEAN_HIRE" | "BORDERLINE" | "NO_HIRE";
    headline: string;
    rationale: string;
  };
}
