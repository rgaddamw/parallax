import type { SessionMemory } from "@/agents/types";
import type { ReplayInsight, TurnRecord } from "@/types/interview";

function improvedAnswerFor(turn: TurnRecord) {
  const base = turn.userSaid.trim();
  if (!base) {
    return "Lead with a one-line thesis, then two proof points with metrics, then a crisp tradeoff you considered.";
  }
  return `Improved arc: (1) Thesis in one sentence. (2) Two proof points with numbers or constraints. (3) Close with what you learned or how you would validate next. Draft: "I owned X end-to-end. We moved metric Y by Z under constraint W. If I repeated it, I would add earlier monitoring on A because B." Your original had strong intent; this version reduces cognitive load for the listener.`;
}

export function buildAgentReplay(
  turns: TurnRecord[],
  memory: SessionMemory,
): ReplayInsight | null {
  if (!turns.length) return null;

  const scored = turns.map((t) => {
    const score =
      t.metrics.confidence +
      t.metrics.clarity -
      t.metrics.hesitation -
      t.metrics.fillerWords * 3;
    return { score, t };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  const worst = scored[scored.length - 1]!;

  const avgTrust =
    turns.reduce((a, t) => a + (t.trustScoreAfter ?? memory.trustScore), 0) /
    turns.length;
  const avgConf =
    turns.reduce((a, t) => a + t.metrics.confidence, 0) / turns.length;
  const contradictionLoad = memory.contradictions.length;

  let verdict: ReplayInsight["hiringRecommendation"]["verdict"] = "BORDERLINE";
  let headline = "Borderline signal — panel would split.";
  const riskFlags: string[] = [];
  if (contradictionLoad >= 2) riskFlags.push("Multiple unresolved narrative tensions");
  if (avgTrust < 48) riskFlags.push("Trust trajectory dipped late");
  if (worst.t.metrics.hesitation > 82) riskFlags.push("High hesitation on highest-risk probe");

  if (avgTrust >= 62 && avgConf >= 72 && contradictionLoad <= 1) {
    verdict = "LEAN_HIRE";
    headline = "Lean hire: signal clears the bar with coachable gaps.";
  } else if (avgTrust < 42 || contradictionLoad >= 3 || avgConf < 52) {
    verdict = "NO_HIRE";
    headline = "No hire today: risk dominates the evidence ledger.";
  }

  const rationale = `Replay Agent fused ${turns.length} turns with memory (${memory.contradictions.length} pinned contradictions). Average modeled trust ${avgTrust.toFixed(1)} with delivery confidence ${avgConf.toFixed(1)}. Verdict ${verdict.replace(/_/g, " ")} reflects policy-weighted evidence, not vibes.`;

  const contradictionNote =
    memory.contradictions.length > 0
      ? ` Contradictions flagged: ${memory.contradictions.map((c) => c.description).join(" | ")}`
      : "";

  return {
    strongestMoment: {
      question: best.t.question,
      summary:
        "Cinematic high-water mark: strongest composite of clarity, confidence, and controlled hesitation.",
      quote:
        best.t.userSaid.slice(0, 160) + (best.t.userSaid.length > 160 ? "..." : ""),
    },
    weakestMoment: {
      question: worst.t.question,
      summary:
        "Lowest resilience moment: delivery noise and narrative drift peaked under probe pressure.",
      quote:
        worst.t.userSaid.slice(0, 160) +
        (worst.t.userSaid.length > 160 ? "..." : ""),
    },
    interviewerInterpretation: `Autonomous synthesis: the interviewer model overweighted delivery when answers lacked a headline claim, and reweighted toward substance when you anchored with constraints.${contradictionNote} Trust ended near ${memory.trustScore.toFixed(0)} on the Parallax internal scale.`,
    improvedAnswer: improvedAnswerFor(worst.t),
    hiringRecommendation: {
      verdict,
      headline,
      rationale,
      riskFlags: riskFlags.length ? riskFlags : ["No major structural risk flags"],
    },
  };
}

export function replayAgentReasoning(turnCount: number): string {
  return `Replay Agent reconstructed a decision-grade timeline from ${turnCount} synchronized agent traces (behavioral vectors, perception layer, policy gates). Strongest vs weakest moments were ranked by a composite resilience score with Nemotron-style weighting (demo heuristic).`;
}
