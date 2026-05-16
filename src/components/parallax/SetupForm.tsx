"use client";

import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PersonalityPicker } from "@/components/parallax/PersonalityPicker";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import Link from "next/link";
import { useInterviewSession } from "@/context/InterviewSessionProvider";

const SAMPLE_JD = `Software Engineer Intern — build features with a small team, ship to production, and explain trade-offs clearly in interviews.`;

export function SetupForm() {
  const {
    state,
    setResumeName,
    setJobDescription,
    setPersonality,
    startInterview,
  } = useInterviewSession();

  const canStart =
    Boolean(state.personality) &&
    state.resumeName.trim().length > 0 &&
    state.jobDescription.trim().length > 20;

  const resumeIsPdf = state.resumeName.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">
          NemoClaw interview pathway
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Upload resume · answer by voice · get agent feedback
        </h2>
        <p className="text-sm text-zinc-500">
          Full flow: PDF resume (policy-gated read), live questions, microphone
          answers, and NemoClaw-audited interviewer feedback after each submit.
        </p>
      </header>

      <GlassPanel className="border border-violet-500/25 p-5 sm:p-6" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/90">
          Step 1 · Resume (PDF)
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-500/[0.04] px-6 py-12 transition hover:border-violet-400/50 hover:bg-violet-500/[0.08]">
          <input
            type="file"
            accept=".pdf,application/pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setResumeName(f?.name ?? "");
            }}
          />
          <span className="text-3xl" aria-hidden>
            📄
          </span>
          <span className="mt-3 text-base font-semibold text-zinc-100">
            {state.resumeName
              ? state.resumeName
              : "Click to upload PDF resume"}
          </span>
          <span className="mt-2 max-w-sm text-center text-xs text-zinc-500">
            {resumeIsPdf
              ? "PDF attached — NemoClaw will REQUIRE_APPROVAL before agents read this file."
              : "PDF recommended · also accepts TXT / DOCX · stays on your device (filename only in demo)."}
          </span>
        </label>
      </GlassPanel>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Step 2 · Job description
          </label>
          <button
            type="button"
            className="text-[10px] text-cyan-400/80 hover:text-cyan-300"
            onClick={() => setJobDescription(SAMPLE_JD)}
          >
            Use sample
          </button>
        </div>
        <textarea
          value={state.jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={4}
          placeholder="Paste the role you're interviewing for…"
          className="w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Step 3 · Interviewer personality
        </label>
        <PersonalityPicker
          value={state.personality}
          onChange={setPersonality}
        />
      </div>

      <GlassPanel className="border border-cyan-500/20 px-5 py-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/90">
          Step 4 · Live interview
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-zinc-400">
          <li>Microphone — speak answers (browser speech-to-text)</li>
          <li>NemoClaw audit — every agent tool logged</li>
          <li>Feedback — coaching after each submitted answer</li>
        </ul>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <NeonButton type="button" disabled={!canStart} onClick={startInterview}>
            Start interview
          </NeonButton>
          {!canStart && (
            <p className="text-center text-xs text-zinc-500">
              Upload a resume, add a job description, and pick a personality.
            </p>
          )}
        </div>
      </GlassPanel>

      <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-4">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
          Optional · policy-only demo
        </p>
        <p className="mt-2 text-center text-xs text-zinc-600">
          No upload — scripted Secure Agent Run for OpenShell audit recording.
        </p>
        <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <RunSecureAgentRunButton variant="ghost" label="Run policy demo" />
          <Link
            href="/nemoclaw"
            className="text-xs text-zinc-500 hover:text-violet-300"
          >
            NemoClaw setup notes →
          </Link>
        </div>
      </div>
    </div>
  );
}
