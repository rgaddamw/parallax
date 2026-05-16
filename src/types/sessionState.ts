import type {
  ActivityEvent,
  ReActTraceStep,
  SessionMemory,
} from "@/agents/types";
import type { OpenShellAuditEntry } from "@/lib/nemoclaw/openshellAudit";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import type {
  CareerMode,
  InterviewDifficulty,
  InterviewType,
  PostInterviewReport,
  ResumeIntelligenceReport,
  ResumeProfile,
} from "@/types/career";
import type {
  InterviewStep,
  InterviewerPersonality,
  ReplayInsight,
  TurnRecord,
} from "@/types/interview";

export interface InterviewSessionState {
  step: InterviewStep;
  sessionId: string;
  resumeName: string;
  resumeText: string;
  resumeProfile: ResumeProfile | null;
  companyName: string;
  jobRole: string;
  jobDescription: string;
  careerMode: CareerMode;
  interviewType: InterviewType;
  interviewDifficulty: InterviewDifficulty;
  /** How many questions the user chose for this live interview (1–12). */
  questionCount: number;
  personality: InterviewerPersonality | null;
  questionIndex: number;
  currentQuestion: string;
  answerDraft: string;
  turns: TurnRecord[];
  replay: ReplayInsight | null;
  postInterviewReport: PostInterviewReport | null;
  resumeIntelligenceReport: ResumeIntelligenceReport | null;
  isAnalyzingResume: boolean;
  isListening: boolean;
  answerClockStart: number;
  memory: SessionMemory | null;
  activityEvents: ActivityEvent[];
  isOrchestrating: boolean;
  reactTrace: ReActTraceStep[];
  lastTurnUsedNemotron: boolean;
  securityAudit: SecurityAuditEntry[];
  approvedTools: string[];
  isJudgeDemo: boolean;
  isJudgeDemoRunning: boolean;
  judgeDemoLabel: string;
  isSecureAgentRun: boolean;
  isSecureAgentRunRunning: boolean;
  secureAgentRunLabel: string;
  openShellAudit: OpenShellAuditEntry[];
  highlightedPolicyRuleKey: string | null;
  showNemoclawJudgeSummary: boolean;
}
