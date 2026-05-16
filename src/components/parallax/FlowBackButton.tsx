"use client";

import { useInterviewSession } from "@/context/InterviewSessionProvider";
import type { InterviewStep } from "@/types/interview";

const BACK_LABEL: Partial<Record<InterviewStep, string>> = {
  branch: "Edit resume & role",
  live: "Interview settings",
  resume_intel: "Choose workflow",
  replay: "Interview settings",
};

export function FlowBackButton({
  onClick,
  label,
  className = "",
}: {
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  const { state, goBack } = useInterviewSession();
  const text = label ?? BACK_LABEL[state.step] ?? "Back";

  return (
    <button
      type="button"
      onClick={onClick ?? goBack}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:text-cyan-300 ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {text}
    </button>
  );
}
