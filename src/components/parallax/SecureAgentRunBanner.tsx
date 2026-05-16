"use client";

import { useInterviewSession } from "@/context/InterviewSessionProvider";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import { NeonButton } from "@/components/ui/NeonButton";

export function SecureAgentRunBanner() {
  const { state, cancelSecureAgentRun, resetSession } = useInterviewSession();

  if (!state.isSecureAgentRun && !state.isSecureAgentRunRunning) return null;

  const running = state.isSecureAgentRunRunning;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/90">
            Policy demo · Secure Agent Run
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {running
              ? `Step: ${state.secureAgentRunLabel || "…"} — OpenShell audit live`
              : "Policy demo finished. Start a full interview with PDF upload + microphone."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <button
              type="button"
              onClick={cancelSecureAgentRun}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          ) : (
            <>
              <NeonButton
                type="button"
                variant="primary"
                className="!px-3 !py-1.5 !text-xs"
                onClick={resetSession}
              >
                Upload resume & interview
              </NeonButton>
              <RunSecureAgentRunButton
                variant="ghost"
                className="!text-[10px]"
                label="Replay demo"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
