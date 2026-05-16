"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import type { PostInterviewReport } from "@/types/career";

const verdictStyle: Record<
  PostInterviewReport["hiringOutcome"]["verdict"],
  { ring: string; text: string; label: string }
> = {
  LEAN_HIRE: {
    ring: "border-emerald-500/35 bg-emerald-500/10",
    text: "text-emerald-200",
    label: "Lean hire",
  },
  BORDERLINE: {
    ring: "border-amber-400/35 bg-amber-500/10",
    text: "text-amber-200",
    label: "Borderline",
  },
  NO_HIRE: {
    ring: "border-rose-500/35 bg-rose-500/10",
    text: "text-rose-200",
    label: "No hire",
  },
};

export function CareerPostInterviewPanel({
  report,
  company,
  role,
}: {
  report: PostInterviewReport;
  company: string;
  role: string;
}) {
  const vs = verdictStyle[report.hiringOutcome.verdict];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
          Interview complete
        </p>
        <h3 className="text-lg font-semibold text-white">
          {role} @ {company}
        </h3>
      </header>

      <GlassPanel className="p-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
          Overall summary
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-200">
          {report.overallSummary}
        </p>
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassPanel className="p-5" glow="cyan">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/80">
            What you did well
          </p>
          <ul className="mt-3 list-none space-y-2 text-sm text-zinc-300">
            {report.didWell.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-5" glow="amber">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
            What to work on
          </p>
          <ul className="mt-3 list-none space-y-2 text-sm text-zinc-300">
            {report.workOn.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/80">
          Resources to improve
        </p>
        <ul className="mt-4 space-y-4">
          {report.resources.map((r) => (
            <li key={r.title} className="text-sm">
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  {r.title}
                </a>
              ) : (
                <p className="font-medium text-zinc-100">{r.title}</p>
              )}
              <p className="mt-1 text-zinc-400">{r.description}</p>
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel className={`p-5 ${vs.ring}`} glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">
          Simulated hiring outcome
        </p>
        <p className={`mt-2 text-xl font-semibold ${vs.text}`}>
          {vs.label} — {report.hiringOutcome.headline}
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          {report.hiringOutcome.rationale}
        </p>
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassPanel className="p-5" glow="cyan">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/80">
            Strongest answers
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {report.strongestAnswers.map((a) => (
              <li key={a.question} className="text-zinc-300">
                <p className="font-medium text-zinc-100">{a.question}</p>
                <p className="mt-1 italic text-zinc-500">&ldquo;{a.quote}&rdquo;</p>
                <p className="mt-1 text-xs">{a.why}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-5" glow="amber">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-200/80">
            Weakest moments
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {report.weakestMoments.map((a) => (
              <li key={a.question} className="text-zinc-300">
                <p className="font-medium text-zinc-100">{a.question}</p>
                <p className="mt-1 italic text-zinc-500">&ldquo;{a.quote}&rdquo;</p>
                <p className="mt-1 text-xs">{a.why}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/80">
          Confidence analysis
        </p>
        <p className="mt-3 text-sm text-zinc-300">{report.confidenceAnalysis}</p>
      </GlassPanel>

      <GlassPanel className="p-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
          Interviewer perception
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          {report.interviewerPerception}
        </p>
      </GlassPanel>

      <GlassPanel className="p-5" glow="amber">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
          Rewritten stronger answers
        </p>
        <ul className="mt-4 space-y-4 text-sm">
          {report.rewrittenAnswers.map((r) => (
            <li key={r.question}>
              <p className="font-medium text-zinc-200">{r.question}</p>
              <p className="mt-2 text-zinc-300">{r.improved}</p>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
