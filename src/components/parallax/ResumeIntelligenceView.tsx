"use client";

import { FlowBackButton } from "@/components/parallax/FlowBackButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { useInterviewSession } from "@/context/InterviewSessionProvider";

const severityStyle = {
  high: "text-rose-300 border-rose-500/30 bg-rose-500/10",
  medium: "text-amber-200 border-amber-500/30 bg-amber-500/10",
  low: "text-zinc-300 border-white/10 bg-white/5",
};

export function ResumeIntelligenceView() {
  const { state, resetSession, runResumeIntelligence, approveTool } =
    useInterviewSession();
  const report = state.resumeIntelligenceReport;

  if (!report) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <FlowBackButton />
        <GlassPanel className="p-8 text-center" glow="violet">
          <p className="text-sm text-zinc-400">
            No intelligence report yet. Approve resume read if prompted, then run
            analysis from the branch screen.
          </p>
          <NeonButton
            type="button"
            className="mt-4"
            onClick={() => void runResumeIntelligence()}
          >
            Run analysis
          </NeonButton>
        </GlassPanel>
      </div>
    );
  }

  const pendingRead =
    state.securityAudit.some(
      (e) => e.tool === "read_resume_file" && e.verdict === "require_approval",
    ) && !state.approvedTools.includes("read_resume_file");

  return (
    <div className="mx-auto max-w-3xl space-y-8 lg:mx-0 lg:max-w-none">
      <FlowBackButton />
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">
          Secure Resume Intelligence
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Career optimization · {state.jobRole} @ {state.companyName}
        </h2>
        <p className="text-sm text-zinc-400">{report.summary}</p>
        <p className="text-xs text-zinc-500">
          Overall fit score:{" "}
          <span className="font-mono text-cyan-300">{report.overallScore}</span>
          /100 · NemoClaw-audited autonomous analysis
        </p>
      </header>

      {pendingRead && (
        <GlassPanel className="border border-amber-500/30 p-4" glow="amber">
          <p className="text-sm text-amber-100">
            Denied or pending: resume read requires approval.
          </p>
          <NeonButton
            type="button"
            variant="ghost"
            className="mt-3"
            onClick={() => approveTool("read_resume_file")}
          >
            Approve read_resume_file
          </NeonButton>
        </GlassPanel>
      )}

      <GlassPanel className="p-5" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/80">
          Issues detected
        </p>
        <ul className="mt-4 space-y-3">
          {report.issues.map((issue) => (
            <li
              key={issue.id}
              className={`rounded-xl border px-4 py-3 ${severityStyle[issue.severity]}`}
            >
              <p className="text-sm font-medium">{issue.title}</p>
              <p className="mt-1 text-xs opacity-90">{issue.detail}</p>
              {issue.example && (
                <p className="mt-2 text-xs italic opacity-75">
                  e.g. {issue.example}
                </p>
              )}
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel className="p-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
          Recommendations
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-300">
          {report.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel className="p-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
          Courses · skills · projects
        </p>
        <ul className="mt-4 space-y-3">
          {report.skillRecommendations.map((s) => (
            <li
              key={s.name}
              className="rounded-lg border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-100">{s.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {s.kind}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{s.rationale}</p>
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel className="p-5" glow="amber">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
          Rewritten bullets
        </p>
        <div className="mt-4 space-y-4">
          {report.rewrittenBullets.map((b, i) => (
            <div key={`${b.section}-${i}`} className="space-y-2 text-sm">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {b.section}
              </p>
              <p className="text-zinc-500 line-through">{b.before}</p>
              <p className="text-zinc-100">{b.after}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-5" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/80">
          Improvement roadmap
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {report.roadmap.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </GlassPanel>

      <div className="flex flex-wrap justify-center gap-3">
        <NeonButton type="button" variant="ghost" onClick={resetSession}>
          New session
        </NeonButton>
      </div>
    </div>
  );
}
