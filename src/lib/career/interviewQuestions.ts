import type { InterviewDifficulty, InterviewType, ResumeProfile } from "@/types/career";
import type { InterviewerPersonality } from "@/types/interview";

export function personalityForConfig(
  interviewType: InterviewType,
  difficulty: InterviewDifficulty,
): InterviewerPersonality {
  if (difficulty === "pressure") return "pressure_mode";
  if (interviewType === "technical") return "skeptical_engineer";
  if (interviewType === "behavioral") return "friendly_recruiter";
  return "startup_founder";
}

export function buildJobDescription(company: string, role: string) {
  return `${role} at ${company}. Autonomous interview session — evaluate ownership, technical depth, communication under policy, and role fit.`;
}

const BEHAVIORAL: string[] = [
  "Tell me about a time you drove {project} — what did YOU personally build?",
  "Describe a conflict on a team project and how you resolved it.",
  "Why {role} at {company} specifically — not a similar role elsewhere?",
  "Tell me about a failure. What did you learn that you would apply here?",
  "What questions do you have for us about the {role} team?",
  "Walk me through a time you had to influence without authority.",
  "Describe a situation where requirements changed mid-project. How did you adapt?",
  "Tell me about mentoring or uplifting someone on your team.",
  "When did you disagree with a technical decision? What was your approach?",
  "How do you prioritize when everything feels urgent?",
  "Describe your most impactful contribution in the last year.",
  "What would your manager say is your superpower — and your growth edge?",
];

const TECHNICAL: string[] = [
  "Walk through {project} with engineering depth: architecture, invariants, and what you would change.",
  "How does your experience with {skill} translate to {role} at {company}?",
  "Describe a production issue you owned. Root cause, mitigation, and guardrail after.",
  "If I challenged your seniority on {skill}, what proof would you show in 30 seconds?",
  "Design a system {company} might need for {role}. What are the bottlenecks?",
  "Explain a tradeoff you made between latency and correctness.",
  "How do you test and validate changes before production?",
  "Describe debugging your hardest incident — tools, timeline, outcome.",
  "What would you monitor on day one in this role?",
  "How do you reason about scalability for {skill} workloads?",
  "Walk through a code or design review you led.",
  "What technical debt would you pay down first on {project}?",
];

const MIXED: string[] = [
  "Pick your strongest project and separate what the team did vs. what you owned.",
  "Behavioral signal: tell me about pressure. Technical signal: how did you validate {skill} choices?",
  "You have 90 seconds: why you, why {company}, why now?",
  "What tradeoff did you make on {project} — speed vs. quality — and would you make it again?",
  "Close: what would your first 30 days look like in this role?",
  "How do you communicate technical risk to non-engineers?",
  "Describe cross-functional collaboration on {project}.",
  "What metric would you move in your first quarter?",
  "Tell me about learning {skill} quickly for a deliverable.",
  "How do you handle ambiguous scope?",
  "What would you do differently on {project} with more time?",
  "Where do you see {company} heading — and how does {role} fit?",
];

const PRESSURE: string[] = [
  "60 seconds: pitch your fit for {role} at {company}.",
  "Fast: three risks in {project} and how you mitigated them.",
  "I'm skeptical — your last answer sounded collaborative. What did YOU build?",
  "One sentence: cost of being wrong in {skill} at scale.",
  "Ship with a known bug or miss the date — decide now.",
  "30 seconds: your biggest technical bet on {project}.",
  "Defend your resume claim about {skill} — go.",
  "What would you cut from scope to hit a hard deadline?",
  "Name one thing you would not compromise on — and why.",
  "Quick: how do you respond when an interviewer pushes back?",
  "Two minutes: deepest technical win. No team credit — your part only.",
  "Final: one reason we should hire you over the next candidate.",
];

function fillTemplate(
  template: string,
  company: string,
  role: string,
  skill: string,
  project: string,
): string {
  return template
    .replace(/\{company\}/g, company)
    .replace(/\{role\}/g, role)
    .replace(/\{skill\}/g, skill)
    .replace(/\{project\}/g, project);
}

function questionBank(
  interviewType: InterviewType,
  difficulty: InterviewDifficulty,
): string[] {
  if (difficulty === "pressure") return PRESSURE;
  if (interviewType === "technical") return TECHNICAL;
  if (interviewType === "behavioral") return BEHAVIORAL;
  return MIXED;
}

export function generateInterviewQuestion(input: {
  company: string;
  role: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  personality: InterviewerPersonality;
  profile: ResumeProfile | null;
  questionIndex: number;
  priorAnswers: string[];
  trustScore: number;
}): string {
  const {
    company,
    role,
    interviewType,
    difficulty,
    profile,
    questionIndex,
    priorAnswers,
    trustScore,
  } = input;
  const skill = profile?.detectedSkills[0] ?? "your core stack";
  const project = profile?.projects[0] ?? "a recent project you listed";

  if (trustScore < 60 && questionIndex > 0) {
    return `You mentioned leadership earlier, but your last answer sounded collaborative. What specifically did YOU build on ${project}?`;
  }

  if (
    priorAnswers.some((a) => a.toLowerCase().includes("team")) &&
    questionIndex >= 1
  ) {
    return `Earlier you emphasized teamwork. For ${company}'s ${role}, I need ownership: what was your individual contribution to ${project}?`;
  }

  const bank = questionBank(interviewType, difficulty);
  const template = bank[questionIndex % bank.length] ?? bank[0]!;
  const base = fillTemplate(template, company, role, skill, project);

  if (questionIndex < bank.length) {
    return questionIndex === 0 && interviewType === "behavioral"
      ? `At ${company}, we value ownership. ${base}`
      : base;
  }

  return `Follow-up ${questionIndex + 1} for ${role} at ${company}: ${base}`;
}
