"use client";

import { useMemo, useState } from "react";
import { CareerIntelligenceHub } from "@/components/parallax/CareerIntelligenceHub";
import { ResumeIntelligenceView } from "@/components/parallax/ResumeIntelligenceView";
import { LiveInterview } from "@/components/parallax/LiveInterview";
import { ReplayView } from "@/components/parallax/ReplayView";
import { NemoClawPanel } from "@/components/parallax/NemoClawPanel";
import { CloudRuntimePanel } from "@/components/parallax/CloudRuntimePanel";
import { AgentActivityStream } from "@/components/parallax/AgentActivityStream";
import { SecurityAuditPanel } from "@/components/parallax/SecurityAuditPanel";
import { OpenShellAuditLog } from "@/components/parallax/OpenShellAuditLog";
import { YamlPolicyViewer } from "@/components/parallax/YamlPolicyViewer";
import { NemoclawJudgeSummaryCard } from "@/components/parallax/NemoclawJudgeSummaryCard";
import { RealNemoclawRuntimeStatusPanel } from "@/components/parallax/RealNemoclawRuntimeStatusPanel";
import { deriveAgentLoopPhase } from "@/lib/agentPlan";
import { useInterviewSession } from "@/context/InterviewSessionProvider";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import { SecureAgentRunBanner } from "@/components/parallax/SecureAgentRunBanner";
import Link from "next/link";
import { LiveSandboxBadge } from "@/components/parallax/LiveSandboxBadge";

function SidePanels({
  events,
  trust,
  isOrchestrating,
  securityAudit,
  openShellAudit,
  pendingTools,
  onApprove,
  orchestratorActive,
  loopPhase,
  showOpenShell,
  highlightedPolicyRuleKey,
  onHighlightRule,
  onShowYamlPolicy,
}: {
  events: ReturnType<typeof useInterviewSession>["state"]["activityEvents"];
  trust: number | null;
  isOrchestrating: boolean;
  securityAudit: ReturnType<typeof useInterviewSession>["state"]["securityAudit"];
  openShellAudit: ReturnType<typeof useInterviewSession>["state"]["openShellAudit"];
  pendingTools: string[];
  onApprove: (tool: string) => void;
  orchestratorActive: boolean;
  loopPhase: number;
  showOpenShell: boolean;
  highlightedPolicyRuleKey: string | null;
  onHighlightRule: (key: string | null) => void;
  onShowYamlPolicy: () => void;
}) {
  return (
    <div className="space-y-6">
      <CloudRuntimePanel
        orchestratorActive={orchestratorActive}
        loopPhase={loopPhase}
      />
      <AgentActivityStream
        events={events}
        trustScore={trust}
        isOrchestrating={isOrchestrating}
      />
      {showOpenShell ? (
        <OpenShellAuditLog
          entries={openShellAudit}
          highlightedRuleKey={highlightedPolicyRuleKey}
          onHighlightRule={onHighlightRule}
          onShowYamlPolicy={onShowYamlPolicy}
        />
      ) : (
        <SecurityAuditPanel
          entries={securityAudit}
          pendingTools={pendingTools}
          onApprove={onApprove}
        />
      )}
    </div>
  );
}

export function InterviewSimulator() {
  const {
    state,
    approveTool,
    goBack,
    setHighlightedPolicyRuleKey,
    dismissNemoclawJudgeSummary,
  } = useInterviewSession();
  const [yamlOpen, setYamlOpen] = useState(false);

  const trust = state.memory?.trustScore ?? null;
  const loopPhase = useMemo(
    () =>
      deriveAgentLoopPhase(state.activityEvents, state.isOrchestrating),
    [state.activityEvents, state.isOrchestrating],
  );

  const orchestratorActive =
    state.step !== "setup" && state.step !== "branch";
  const showOpenShell =
    state.isSecureAgentRun ||
    state.isSecureAgentRunRunning ||
    state.openShellAudit.length > 0 ||
    state.careerMode !== null;

  const pendingTools = useMemo(() => {
    const pending = new Set<string>();
    for (const e of state.securityAudit) {
      if (
        e.verdict === "require_approval" &&
        !state.approvedTools.includes(e.tool)
      ) {
        pending.add(e.tool);
      }
    }
    return [...pending];
  }, [state.securityAudit, state.approvedTools]);

  const openYaml = () => {
    setYamlOpen(true);
  };

  /** “Start interview” path — resume setup and flows only, no policy manifest chrome. */
  const focusedInterview =
    !state.isSecureAgentRun &&
    !state.isSecureAgentRunRunning &&
    !state.isJudgeDemo &&
    !state.isJudgeDemoRunning;

  const contentMax = focusedInterview ? "max-w-3xl" : "max-w-7xl";

  const sidePanelsProps = {
    events: state.activityEvents,
    trust,
    securityAudit: state.securityAudit,
    openShellAudit: state.openShellAudit,
    pendingTools,
    onApprove: approveTool,
    orchestratorActive,
    loopPhase,
    showOpenShell,
    highlightedPolicyRuleKey: state.highlightedPolicyRuleKey,
    onHighlightRule: setHighlightedPolicyRuleKey,
    onShowYamlPolicy: openYaml,
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(217,70,239,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.55))]" />

      <div className={`relative z-10 mx-auto ${contentMax} space-y-10`}>
        <nav className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {focusedInterview && state.step !== "setup" ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 transition hover:text-cyan-300"
              >
                <span aria-hidden className="text-base leading-none">
                  ←
                </span>
                Back
              </button>
            ) : null}
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 transition hover:text-cyan-300"
            >
              Parallax home
            </Link>
          </div>
          {focusedInterview ? (
            <Link
              href="/nemoclaw"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 transition hover:text-zinc-400"
            >
              Policy & runtime
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <LiveSandboxBadge />
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
                Best Use of NemoClaw
              </span>
              <Link
                href="/nemoclaw"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80 transition hover:text-cyan-300"
              >
                NemoClaw docs →
              </Link>
              <RunSecureAgentRunButton
                variant="ghost"
                className="!px-3 !py-1 !text-[10px]"
              />
            </div>
          )}
        </nav>

        {!focusedInterview && <SecureAgentRunBanner />}

        {!focusedInterview && (
          <RealNemoclawRuntimeStatusPanel className="max-w-2xl" />
        )}

        {(state.step === "setup" || state.step === "branch") &&
          !state.isSecureAgentRunRunning && <CareerIntelligenceHub />}

        {state.step === "resume_intel" && (
          <div
            className={
              focusedInterview
                ? undefined
                : "grid items-start gap-8 xl:grid-cols-[1fr_minmax(340px,400px)]"
            }
          >
            <ResumeIntelligenceView />
            {!focusedInterview && (
              <SidePanels
                {...sidePanelsProps}
                isOrchestrating={state.isAnalyzingResume}
              />
            )}
          </div>
        )}

        {(state.step === "live" ||
          state.isSecureAgentRunRunning ||
          state.isJudgeDemoRunning) && (
          <div
            className={
              focusedInterview
                ? undefined
                : "grid items-start gap-8 xl:grid-cols-[1fr_minmax(340px,400px)]"
            }
          >
            <div className="space-y-6">
              <LiveInterview focused={focusedInterview} />
              {state.showNemoclawJudgeSummary && (
                <NemoclawJudgeSummaryCard
                  onDismiss={dismissNemoclawJudgeSummary}
                />
              )}
            </div>
            {!focusedInterview && (
              <SidePanels
                {...sidePanelsProps}
                isOrchestrating={state.isOrchestrating}
              />
            )}
          </div>
        )}

        {state.step === "replay" && (
          <div
            className={
              focusedInterview
                ? undefined
                : "grid items-start gap-8 xl:grid-cols-[1fr_minmax(340px,400px)]"
            }
          >
            <ReplayView focused={focusedInterview} />
            {!focusedInterview && (
              <SidePanels
                {...sidePanelsProps}
                isOrchestrating={false}
              />
            )}
          </div>
        )}

        {!focusedInterview && <NemoClawPanel />}
      </div>

      <YamlPolicyViewer
        open={yamlOpen}
        onClose={() => setYamlOpen(false)}
        highlightRuleKey={state.highlightedPolicyRuleKey}
      />
    </div>
  );
}
