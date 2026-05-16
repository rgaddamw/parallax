"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { FlowBackButton } from "@/components/parallax/FlowBackButton";
import { useInterviewSession } from "@/context/InterviewSessionProvider";
import type { InterviewDifficulty, InterviewType } from "@/types/career";

const INTERVIEW_TYPES: { id: InterviewType; label: string; desc: string }[] = [
  { id: "behavioral", label: "Behavioral", desc: "Ownership, conflict, motivation" },
  { id: "technical", label: "Technical", desc: "Depth, systems, proof" },
  { id: "mixed", label: "Mixed", desc: "Cross-functional panel signal" },
];

const DIFFICULTIES: { id: InterviewDifficulty; label: string; desc: string }[] = [
  { id: "normal", label: "Normal", desc: "Adaptive follow-ups" },
  { id: "pressure", label: "Pressure mode", desc: "Interruptions & skepticism" },
];

export function CareerIntelligenceHub() {
  const {
    state,
    setResumeName,
    setResumeText,
    setCompanyName,
    setJobRole,
    setInterviewType,
    setInterviewDifficulty,
    setQuestionCount,
    goToBranch,
    goBack,
    startLiveInterview,
    runResumeIntelligence,
    approveTool,
  } = useInterviewSession();

  const [liveConfigOpen, setLiveConfigOpen] = useState(false);

  useEffect(() => {
    if (state.step !== "branch") setLiveConfigOpen(false);
  }, [state.step]);

  const resumeIsPdf = state.resumeName.toLowerCase().endsWith(".pdf");
  const canBranch =
    state.resumeName.trim().length > 0 &&
    state.companyName.trim().length > 1 &&
    state.jobRole.trim().length > 1;

  const pendingRead =
    state.securityAudit.some(
      (e) => e.tool === "read_resume_file" && e.verdict === "require_approval",
    ) && !state.approvedTools.includes("read_resume_file");

  if (state.step === "branch") {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <FlowBackButton onClick={goBack} />
        <header className="space-y-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
            Next step
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Choose autonomous workflow
          </h2>
          <p className="text-sm text-zinc-500">
            Targeting{" "}
            <span className="text-zinc-300">{state.jobRole}</span> at{" "}
            <span className="text-zinc-300">{state.companyName}</span>
            {state.resumeName ? ` · ${state.resumeName}` : ""}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <GlassPanel className="flex flex-col border border-cyan-500/30 p-6" glow="cyan">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/90">
              Flow 1
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Secure Live Interview Simulation
            </h3>
            <p className="mt-2 flex-1 text-sm text-zinc-400">
              Real-time autonomous interview powered by Nemotron reasoning and
              NemoClaw policies — voice, multi-agent panels, adaptive follow-ups.
            </p>
            {!liveConfigOpen ? (
              <NeonButton
                type="button"
                className="mt-6 w-full"
                onClick={() => setLiveConfigOpen(true)}
              >
                Configure & start
              </NeonButton>
            ) : (
              <div className="mt-5 space-y-4">
                <FlowBackButton
                  label="Back to workflows"
                  onClick={() => setLiveConfigOpen(false)}
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Interview type
                  </p>
                  <div className="mt-2 grid gap-2">
                    {INTERVIEW_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setInterviewType(t.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                          state.interviewType === t.id
                            ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                            : "border-white/10 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        <span className="font-medium">{t.label}</span>
                        <span className="mt-0.5 block text-xs opacity-80">
                          {t.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Difficulty
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setInterviewDifficulty(d.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                          state.interviewDifficulty === d.id
                            ? "border-violet-400/50 bg-violet-500/10 text-violet-100"
                            : "border-white/10 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        <span className="font-medium">{d.label}</span>
                        <span className="mt-0.5 block text-xs opacity-80">
                          {d.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="question-count"
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
                  >
                    Number of questions
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="question-count"
                      type="number"
                      min={1}
                      max={12}
                      value={state.questionCount}
                      onChange={(e) =>
                        setQuestionCount(Number(e.target.value) || 5)
                      }
                      className="w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-500">
                      For {state.jobRole || "your role"} at{" "}
                      {state.companyName || "your company"} · 1–12
                    </span>
                  </div>
                </div>
                <NeonButton
                  type="button"
                  className="w-full"
                  onClick={() => void startLiveInterview()}
                >
                  Start live simulation
                </NeonButton>
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="flex flex-col border border-violet-500/30 p-6" glow="violet">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/90">
              Flow 2
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Secure Resume Intelligence
            </h3>
            <p className="mt-2 flex-1 text-sm text-zinc-400">
              Autonomous agent analyzes your resume against the role — ATS gaps,
              bullet rewrites, courses, and an improvement roadmap.
            </p>
            {pendingRead && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                NemoClaw requires approval to read your resume PDF before analysis.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              {pendingRead && (
                <NeonButton
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => approveTool("read_resume_file")}
                >
                  Approve resume read
                </NeonButton>
              )}
              <NeonButton
                type="button"
                className="w-full"
                disabled={state.isAnalyzingResume}
                onClick={() => void runResumeIntelligence()}
              >
                {state.isAnalyzingResume
                  ? "Agents analyzing…"
                  : "Run resume intelligence"}
              </NeonButton>
            </div>
          </GlassPanel>
        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {state.step === "setup" && (
        <FlowBackButton
          label="Parallax home"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "/";
          }}
        />
      )}
      <header className="space-y-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">
          Career interview prep
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Set up your interview
        </h2>
        <p className="text-sm text-zinc-500">
          Upload a resume and enter the company and role you are targeting.
        </p>
      </header>

      <GlassPanel className="border border-violet-500/25 p-5 sm:p-6" glow="violet">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/90">
          Resume · PDF
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-500/[0.04] px-6 py-10 transition hover:border-violet-400/50 hover:bg-violet-500/[0.08]">
          <input
            type="file"
            accept=".pdf,application/pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setResumeName(f.name);
              const reader = new FileReader();
              reader.onload = () => {
                const text =
                  typeof reader.result === "string" ? reader.result : "";
                setResumeText(text.slice(0, 12000));
              };
              if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
                setResumeText("");
              } else {
                reader.readAsText(f);
              }
            }}
          />
          <span className="text-3xl" aria-hidden>
            📄
          </span>
          <span className="mt-3 text-base font-semibold text-zinc-100">
            {state.resumeName || "Upload PDF resume"}
          </span>
          <span className="mt-2 max-w-sm text-center text-xs text-zinc-500">
            {resumeIsPdf
              ? "PDF attached — read_resume_file requires NemoClaw approval."
              : "PDF recommended · TXT extracts locally for skill detection."}
          </span>
        </label>
        <textarea
          value={state.resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={3}
          placeholder="Optional: paste resume text for richer skill detection…"
          className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-violet-400/40 focus:outline-none"
        />
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Company
          </label>
          <input
            value={state.companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. NVIDIA"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Job role / title
          </label>
          <input
            value={state.jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Systems Software Engineer"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
      </div>

      <GlassPanel className="border border-cyan-500/20 px-5 py-5 text-center" glow="cyan">
        <NeonButton type="button" disabled={!canBranch} onClick={goToBranch}>
          Continue to workflows
        </NeonButton>
        {!canBranch && (
          <p className="mt-3 text-xs text-zinc-500">
            Upload a resume and enter company + role to branch.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
