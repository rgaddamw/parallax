import type { Contradiction, SessionMemory } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";
import type { TurnRecord } from "@/types/interview";

let contradictionSeq = 0;

function fingerprint(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function detectContradiction(
  priorTurns: TurnRecord[],
  newAnswer: string,
): Contradiction | null {
  const na = newAnswer.toLowerCase();
  for (let i = 0; i < priorTurns.length; i++) {
    const pt = priorTurns[i]!.userSaid.toLowerCase();
    if (
      /\b(sole|solo|only me|i alone|i single[- ]handedly)\b/i.test(pt) &&
      /\b(we|the team|together|our group)\b/i.test(na) &&
      na.length > 40
    ) {
      return {
        id: `ctr-${++contradictionSeq}`,
        turnIndex: i,
        description: "Ownership narrative shifted between solo execution and shared credit.",
        evidence: [priorTurns[i]!.userSaid.slice(0, 120), newAnswer.slice(0, 120)],
      };
    }
    if (
      /\b(never|didn't|did not|no experience)\b/i.test(pt) &&
      /\b(led|owned|shipped|scaled|architected)\b/i.test(na)
    ) {
      return {
        id: `ctr-${++contradictionSeq}`,
        turnIndex: i,
        description: "Prior negative capability claim conflicts with a strong ownership claim now.",
        evidence: [priorTurns[i]!.userSaid.slice(0, 120), newAnswer.slice(0, 120)],
      };
    }
  }
  if (
    /\b(junior|intern|learning)\b/i.test(na) &&
    priorTurns.some((t) => /\b(staff|principal|architect|led the org)\b/i.test(t.userSaid))
  ) {
    const idx = priorTurns.findIndex((t) =>
      /\b(staff|principal|architect|led the org)\b/i.test(t.userSaid),
    );
    return {
      id: `ctr-${++contradictionSeq}`,
      turnIndex: idx >= 0 ? idx : priorTurns.length - 1,
      description: "Seniority framing diverges from earlier authority claims.",
      evidence: [priorTurns[priorTurns.length - 1]!.userSaid.slice(0, 120), newAnswer.slice(0, 120)],
    };
  }
  return null;
}

export function runMemoryAgent(input: {
  memory: SessionMemory;
  priorTurns: TurnRecord[];
  newAnswer: string;
  questionIndex: number;
  jobDescription: string;
}): {
  memory: SessionMemory;
  retrievedNotes: string[];
  reasoning: string;
  newContradiction: Contradiction | null;
} {
  const fp = fingerprint(input.newAnswer);
  const retrievedNotes: string[] = [];
  if (input.memory.answerFingerprints.length) {
    retrievedNotes.push(
      `Echo graph: comparing against ${input.memory.answerFingerprints.length} prior fingerprints.`,
    );
  }
  if (input.jobDescription.length > 80) {
    retrievedNotes.push(
      "Retrieved job-description anchors for role-fit alignment (keywords, scope).",
    );
  }

  const newContradiction = detectContradiction(
    input.priorTurns,
    input.newAnswer,
  );

  const contradictions = [...input.memory.contradictions];
  if (newContradiction) contradictions.push(newContradiction);

  const next: SessionMemory = {
    ...input.memory,
    contradictions,
    answerFingerprints: [...input.memory.answerFingerprints, fp].slice(-12),
  };

  const reasoning = newContradiction
    ? `Memory Agent materialized a contradiction candidate on turn ${input.questionIndex + 1} and pinned it for Decision + Interviewer agents.`
    : `Memory Agent found no hard contradiction against prior answers; soft inconsistencies may still be probed.`;

  return { memory: next, retrievedNotes, reasoning, newContradiction };
}

export function activePersonality(
  base: InterviewerPersonality,
  memory: SessionMemory,
): InterviewerPersonality {
  return memory.effectivePersonality ?? base;
}
