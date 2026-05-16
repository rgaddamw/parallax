import type { SessionMemory } from "@/agents/types";
import type { DecisionResult } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";
import { getQuestion } from "@/lib/mockInterviewEngine";
import { activePersonality } from "@/agents/memoryAgent";
import { generateInterviewQuestion } from "@/lib/career/interviewQuestions";
import type {
  InterviewDifficulty,
  InterviewType,
  ResumeProfile,
} from "@/types/career";

export function runInterviewerAgent(input: {
  basePersonality: InterviewerPersonality;
  memory: SessionMemory;
  nextQuestionIndex: number;
  decision: DecisionResult;
  career?: {
    company: string;
    role: string;
    interviewType: InterviewType;
    difficulty: InterviewDifficulty;
    profile: ResumeProfile | null;
    priorAnswers: string[];
  };
}): { question: string; reasoning: string } {
  const persona = activePersonality(input.basePersonality, input.memory);
  const core = input.career
    ? generateInterviewQuestion({
        company: input.career.company,
        role: input.career.role,
        interviewType: input.career.interviewType,
        difficulty: input.career.difficulty,
        personality: persona,
        profile: input.career.profile,
        questionIndex: input.nextQuestionIndex,
        priorAnswers: input.career.priorAnswers,
        trustScore: input.memory.trustScore,
      })
    : getQuestion(persona, input.nextQuestionIndex);
  const question =
    `${input.decision.questionPrefix}${core}${input.decision.questionSuffix}`.trim();

  const reasoning = `Interviewer Agent composed the next probe using personality=${persona}, turn index=${input.nextQuestionIndex + 1}, and Decision Agent routing (${input.decision.action}). Adaptive follow-ups are fused into the prompt string so the candidate experiences a single coherent interviewer.`;

  return { question, reasoning };
}
