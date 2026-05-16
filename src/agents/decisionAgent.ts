import type { DecisionResult, SessionMemory } from "@/agents/types";
import type { BehavioralResult } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";
import type { Contradiction } from "@/agents/types";

export function runDecisionAgent(input: {
  basePersonality: InterviewerPersonality;
  behavioral: BehavioralResult;
  memory: SessionMemory;
  newContradiction: Contradiction | null;
  questionIndex: number;
}): DecisionResult {
  const { behavioral, memory, newContradiction, basePersonality, questionIndex } =
    input;

  let action: DecisionResult["action"] = "continue";
  let narrative =
    "Decision Agent: maintain baseline cadence—no escalation triggers fired.";
  let questionPrefix = "";
  let questionSuffix = "";
  let nextEffectivePersonality: InterviewerPersonality | null = null;
  let pressureDelta = 0;

  if (newContradiction) {
    action = "challenge_contradiction";
    narrative = `Decision Agent locked a challenge path: Memory Agent retrieved a contradiction from Question ${newContradiction.turnIndex + 1}. Interviewer will surface it directly.`;
    questionPrefix = `Before we move on—I need you to reconcile something. Earlier you implied something different from what you just said. `;
  } else if (
    questionIndex >= 3 &&
    memory.pressureLevel > 50 &&
    behavioral.metrics.confidence < 58
  ) {
    action = "pressure";
    narrative =
      "Decision Agent: late-stage confidence dip with elevated pressure envelope—tighten framing.";
    questionSuffix = " Answer in one tight paragraph: claim, proof, tradeoff.";
    pressureDelta += 4;
  } else if (behavioral.hesitationSpike) {
    action = "interrupt";
    narrative =
      "Decision Agent detected a hesitation spike; authorizing a micro-interrupt to reset cognitive load.";
    questionPrefix = "(Interrupting—stay with me.) ";
  } else if (
    behavioral.metrics.pacing < 38 &&
    basePersonality === "pressure_mode"
  ) {
    action = "pressure";
    narrative =
      "Decision Agent escalated pressure mode: pacing suggests evasive compression under timebox.";
    questionSuffix = " I need a sharper headline first, then one proof.";
    pressureDelta += 8;
  } else if (
    basePersonality === "skeptical_engineer" &&
    behavioral.metrics.confidence > 86
  ) {
    action = "deeper_technical";
    narrative =
      "Decision Agent routes to a deeper technical probe: confidence is high enough to stress invariants.";
    questionSuffix =
      " Then go one level deeper: what invariant would break first in production?";
  } else if (memory.trustScore < 44 || behavioral.stressSignals.length >= 3) {
    action = "escalate_skepticism";
    narrative =
      "Decision Agent escalated skepticism: trust composite and stress bundle crossed a dual threshold.";
    nextEffectivePersonality = "skeptical_engineer";
    questionSuffix = " I'll be more direct from here—defend your assumptions.";
    pressureDelta += 5;
  }

  return {
    action,
    narrative,
    questionPrefix,
    questionSuffix,
    nextEffectivePersonality,
    pressureDelta,
  };
}
