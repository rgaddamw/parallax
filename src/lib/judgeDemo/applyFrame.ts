import type { InterviewSessionState } from "@/types/sessionState";
import type { JudgeDemoFrame } from "@/lib/judgeDemo/timeline";

export function applyJudgeDemoFrame(
  prev: InterviewSessionState,
  frame: JudgeDemoFrame,
): InterviewSessionState {
  const p = frame.patch;
  let next: InterviewSessionState = { ...prev };

  if (p.step !== undefined) next.step = p.step;
  if (p.answerDraft !== undefined) next.answerDraft = p.answerDraft;
  if (p.currentQuestion !== undefined) next.currentQuestion = p.currentQuestion;
  if (p.isOrchestrating !== undefined) next.isOrchestrating = p.isOrchestrating;
  if (p.memory !== undefined) next.memory = p.memory;
  if (p.turns !== undefined) next.turns = p.turns;
  if (p.replay !== undefined) next.replay = p.replay;
  if (p.reactTrace !== undefined) next.reactTrace = p.reactTrace;
  if (p.lastTurnUsedNemotron !== undefined) {
    next.lastTurnUsedNemotron = p.lastTurnUsedNemotron;
  }

  if (p.appendEvents?.length) {
    next.activityEvents = [...next.activityEvents, ...p.appendEvents];
  }
  if (p.appendAudit?.length) {
    next.securityAudit = [...next.securityAudit, ...p.appendAudit];
  }

  return next;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
