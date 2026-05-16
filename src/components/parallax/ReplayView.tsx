"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { CareerPostInterviewPanel } from "@/components/parallax/CareerPostInterviewPanel";
import { FlowBackButton } from "@/components/parallax/FlowBackButton";
import { useInterviewSession } from "@/context/InterviewSessionProvider";

const verdictStyle: Record<
  string,
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

export function ReplayView({ focused = false }: { focused?: boolean }) {
  const { state, resetSession } = useInterviewSession();
  const r = state.replay;
  if (!r) {
    return (
      <p className="text-center text-sm text-zinc-500">
        No replay data yet. Complete at least one turn.
      </p>
    );
  }

  const hire = r.hiringRecommendation;
  const vs = verdictStyle[hire.verdict] ?? verdictStyle.BORDERLINE!;

  const careerSummary =
    focused &&
    state.careerMode === "live_interview" &&
    state.postInterviewReport &&
    state.companyName;

  return (
    <div className="mx-auto max-w-3xl space-y-8 lg:mx-0 lg:max-w-none">
      <FlowBackButton />
      {careerSummary && (
        <CareerPostInterviewPanel
          report={state.postInterviewReport!}
          company={state.companyName}
          role={state.jobRole}
        />
      )}

      {!careerSummary && state.postInterviewReport && state.companyName && (
        <CareerPostInterviewPanel
          report={state.postInterviewReport}
          company={state.companyName}
          role={state.jobRole}
        />
      )}

      {!careerSummary && r.judgeSections && (
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassPanel className="p-5" glow="cyan">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">
              What you said
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              {r.judgeSections.whatYouSaid}
            </p>
          </GlassPanel>
          <GlassPanel className="p-5" glow="violet">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/80">
              What they heard
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              {r.judgeSections.whatTheyHeard}
            </p>
          </GlassPanel>
          <GlassPanel className="p-5 sm:col-span-2" glow="amber">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
              Trust drop moment
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              {r.judgeSections.trustDropMoment}
            </p>
          </GlassPanel>
          <GlassPanel className="p-5 sm:col-span-2" glow="cyan">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
              Stronger rewritten answer
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-100">
              {r.judgeSections.improvedAnswer}
            </p>
          </GlassPanel>
        </div>
      )}

      {!careerSummary && (
        <header className="text-center lg:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-fuchsia-300/80">
            Parallax replay
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Two realities, one timeline
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Replay Agent fused behavioral traces, perception, and policy into a
            hiring-grade summary.
          </p>
        </header>
      )}

      {!careerSummary && (
      <>
      <div
        className={`rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 ${vs.ring}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          Replay Agent · hiring recommendation
        </p>
        <p className={`font-display mt-2 text-2xl font-semibold ${vs.text}`}>
          {vs.label}: {hire.headline}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {hire.rationale}
        </p>
        <ul className="mt-4 space-y-1.5 text-xs text-zinc-500">
          {hire.riskFlags.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-fuchsia-400/80">▸</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassPanel className="p-6" glow="cyan">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
            Strongest moment
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
            {r.strongestMoment.question}
          </p>
          <p className="mt-3 text-sm text-zinc-200">{r.strongestMoment.summary}</p>
          <blockquote className="mt-4 border-l-2 border-cyan-400/50 pl-4 text-sm italic text-zinc-400">
            {r.strongestMoment.quote}
          </blockquote>
        </GlassPanel>
        <GlassPanel className="p-6" glow="violet">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300/80">
            Weakest moment
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
            {r.weakestMoment.question}
          </p>
          <p className="mt-3 text-sm text-zinc-200">{r.weakestMoment.summary}</p>
          <blockquote className="mt-4 border-l-2 border-fuchsia-400/50 pl-4 text-sm italic text-zinc-400">
            {r.weakestMoment.quote}
          </blockquote>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6 sm:p-8" glow="amber">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/80">
          Interviewer interpretation
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-200">
          {r.interviewerInterpretation}
        </p>
      </GlassPanel>

      <GlassPanel className="p-6 sm:p-8" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">
          Improved answer blueprint
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-100">
          {r.improvedAnswer}
        </p>
      </GlassPanel>
      </>
      )}

      <div className="flex justify-center lg:justify-start">
        <NeonButton type="button" variant="ghost" onClick={resetSession}>
          New session
        </NeonButton>
      </div>
    </div>
  );
}
