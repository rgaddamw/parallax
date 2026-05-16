"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DualRealityPanels } from "@/components/parallax/DualRealityPanels";
import { AnswerTimerBar } from "@/components/parallax/AnswerTimerBar";
import { LiveConfidenceMeter } from "@/components/parallax/LiveConfidenceMeter";
import { InterviewSmallTalkPanel } from "@/components/parallax/InterviewSmallTalkPanel";
import { ReActReasoningPanel } from "@/components/parallax/ReActReasoningPanel";
import { AgentPlanPanel } from "@/components/parallax/AgentPlanPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useInterviewSession } from "@/context/InterviewSessionProvider";
import { previewPerception } from "@/lib/mockInterviewEngine";
import { activePersonality } from "@/agents/memoryAgent";
import { buildAnswerCoaching } from "@/lib/answerCoaching";
import { assessAnswerQuality } from "@/lib/answerQuality";
import { PERSONALITIES } from "@/types/interview";
import { VoiceAnswerBar } from "@/components/parallax/VoiceAnswerBar";
import { FlowBackButton } from "@/components/parallax/FlowBackButton";

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: Event) => void) | null;
  onerror: (() => void) | null;
};

export function LiveInterview({ focused = false }: { focused?: boolean }) {
  const {
    state,
    setAnswerDraft,
    submitAnswer,
    skipToReplay,
    toggleListen,
    appendTranscript,
  } = useInterviewSession();

  const scriptedLocked =
    state.isJudgeDemo ||
    state.isJudgeDemoRunning ||
    state.isSecureAgentRunRunning;
  const secureRunComplete =
    state.isSecureAgentRun && !state.isSecureAgentRunRunning;
  const inputLocked = scriptedLocked || secureRunComplete;
  const fullInterview =
    !state.isSecureAgentRun && !state.isJudgeDemo;

  const [typingMs, setTypingMs] = useState(400);
  const [nemotronReady, setNemotronReady] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/nemotron/status")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setNemotronReady(Boolean(d.configured)))
      .catch(() => setNemotronReady(false));
  }, []);

  const previewPersona = useMemo(() => {
    if (!state.personality) return null;
    if (!state.memory) return state.personality;
    return activePersonality(state.personality, state.memory);
  }, [state.personality, state.memory]);

  useEffect(() => {
    if (state.step !== "live" || state.answerClockStart === 0) return;
    const start = state.answerClockStart;
    const id = window.setInterval(() => {
      setTypingMs(Math.max(400, Date.now() - start));
    }, 400);
    return () => window.clearInterval(id);
  }, [state.answerClockStart, state.step]);

  const preview =
    previewPersona &&
    previewPerception(
      previewPersona,
      state.answerDraft,
      typingMs,
    );

  const updateDraft = (value: string) => {
    setAnswerDraft(value);
    if (state.answerClockStart > 0) {
      setTypingMs(Math.max(400, Date.now() - state.answerClockStart));
    }
  };

  useEffect(() => {
    if (!state.isListening) return;
    const W = window as Window &
      typeof globalThis & {
        SpeechRecognition?: RecognitionCtor;
        webkitSpeechRecognition?: RecognitionCtor;
      };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    let buffer = "";
    rec.onresult = (ev: Event) => {
      const e = ev as unknown as {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      };
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) buffer += res[0]!.transcript;
      }
      if (buffer.trim()) {
        appendTranscript(buffer.trim());
        buffer = "";
      }
    };
    rec.onerror = () => {
      toggleListen();
    };
    try {
      rec.start();
    } catch {
      /* already started */
    }
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [state.isListening, appendTranscript, toggleListen]);

  const speechSupported = useCallback(() => {
    const W = window as Window &
      typeof globalThis & {
        SpeechRecognition?: RecognitionCtor;
        webkitSpeechRecognition?: RecognitionCtor;
      };
    return Boolean(W.SpeechRecognition ?? W.webkitSpeechRecognition);
  }, []);

  const pendingApprovalCount = useMemo(() => {
    const pending = new Set<string>();
    for (const e of state.securityAudit) {
      if (
        e.verdict === "require_approval" &&
        !state.approvedTools.includes(e.tool)
      ) {
        pending.add(e.tool);
      }
    }
    return pending.size;
  }, [state.securityAudit, state.approvedTools]);

  const lastTurn = state.turns[state.turns.length - 1];
  const lastAnswerQuality = useMemo(
    () => (lastTurn ? assessAnswerQuality(lastTurn.userSaid) : null),
    [lastTurn],
  );
  const coaching = useMemo(() => {
    if (!lastTurn || state.isOrchestrating || scriptedLocked) return null;
    return buildAnswerCoaching({
      answer: lastTurn.userSaid,
      metrics: lastTurn.metrics,
      theyHeard: lastTurn.theyHeard,
      question: lastTurn.question,
    });
  }, [lastTurn, state.isOrchestrating, scriptedLocked]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:mx-0 lg:max-w-none">
      <FlowBackButton />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/70">
            {state.careerMode === "live_interview"
              ? "Secure Live Interview Simulation"
              : focused
                ? "Live interview"
                : "NemoClaw-governed agents · not a chatbot"}
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-white">
            {state.careerMode === "live_interview" && state.companyName
              ? `${state.jobRole} @ ${state.companyName}`
              : `Question ${state.questionIndex + 1} / ${state.questionCount}`}
          </h2>
          {state.careerMode === "live_interview" && (
            <p className="mt-1 text-xs text-zinc-500">
              {state.interviewType} ·{" "}
              {state.interviewDifficulty === "pressure"
                ? "pressure mode"
                : "normal"}{" "}
              · Q{state.questionIndex + 1}/{state.questionCount}
            </p>
          )}
          {!focused && nemotronReady != null && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
              Policy sandbox · Nemotron{" "}
              <span
                className={
                  nemotronReady ? "text-emerald-400/90" : "text-zinc-500"
                }
              >
                {nemotronReady
                  ? "trusted domain OK"
                  : "offline (policy demo still runs)"}
              </span>
            </p>
          )}
          {state.resumeName && fullInterview && (
            <p className="mt-1 text-[11px] text-zinc-500">
              Resume:{" "}
              <span className="font-mono text-violet-300/90">{state.resumeName}</span>
            </p>
          )}
          {state.memory && previewPersona && (
            <p className="mt-1 text-[11px] text-zinc-500">
              Effective interviewer:{" "}
              <span className="text-zinc-300">
                {PERSONALITIES.find((p) => p.id === previewPersona)?.label ??
                  previewPersona}
              </span>
              {" · "}
              Modeled trust {Math.round(state.memory.trustScore)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <NeonButton
            type="button"
            variant="ghost"
            onClick={skipToReplay}
            disabled={state.isOrchestrating || scriptedLocked}
          >
            End & replay
          </NeonButton>
        </div>
      </div>

      {!focused && (
        <AgentPlanPanel
          turnNumber={state.questionIndex + 1}
          step={state.step}
          isOrchestrating={state.isOrchestrating}
          activityEvents={state.activityEvents}
          securityAudit={state.securityAudit}
          lastTurnUsedNemotron={state.lastTurnUsedNemotron}
          nemotronConfigured={nemotronReady}
          turnCount={state.turns.length}
          pendingApprovalCount={pendingApprovalCount}
        />
      )}

      {fullInterview && state.questionIndex === 0 && (
        <InterviewSmallTalkPanel
          phase="opening"
          company={state.companyName}
          role={state.jobRole}
          interviewType={state.interviewType}
        />
      )}

      {fullInterview &&
        state.questionCount > 1 &&
        state.questionIndex + 1 >= state.questionCount && (
          <InterviewSmallTalkPanel
            phase="closing"
            company={state.companyName}
            role={state.jobRole}
            interviewType={state.interviewType}
          />
        )}

      <GlassPanel className="p-6 sm:p-8" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-fuchsia-300/70">
          Interviewer
        </p>
        <p className="mt-3 text-lg leading-relaxed text-zinc-100">
          {state.currentQuestion}
        </p>
      </GlassPanel>

      {fullInterview && (
        <AnswerTimerBar
          interviewType={state.interviewType}
          difficulty={state.interviewDifficulty}
          questionKey={`${state.questionIndex}-${state.currentQuestion}`}
          disabled={inputLocked || state.isOrchestrating}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,300px)]">
        <div className="space-y-4">
          <DualRealityPanels
            youSaid={state.answerDraft}
            theyHeard={preview?.theyHeard ?? ""}
          />
          {fullInterview && (
            <VoiceAnswerBar
              isListening={state.isListening}
              disabled={inputLocked || state.isOrchestrating}
              speechSupported={speechSupported()}
              onToggle={toggleListen}
            />
          )}
          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Your answer
            </span>
            <textarea
              value={state.answerDraft}
              onChange={(e) => updateDraft(e.target.value)}
              rows={6}
              readOnly={inputLocked}
              placeholder="Type or dictate. Agents continuously model how your language compresses in the interviewer's head."
              className="w-full resize-y rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400/45 focus:outline-none disabled:opacity-80"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <NeonButton
              type="button"
              onClick={() => void submitAnswer()}
              disabled={state.isOrchestrating || inputLocked}
            >
              {state.isJudgeDemoRunning
                ? "Judge demo running…"
                : state.isOrchestrating
                  ? "Agents thinking..."
                  : state.questionIndex + 1 >= state.questionCount
                    ? "Submit & see summary"
                    : "Submit answer"}
            </NeonButton>
            {fullInterview &&
              state.questionIndex + 1 === state.questionCount && (
                <p className="text-xs text-cyan-400/80">
                  Last question — you&apos;ll get an overall summary next.
                </p>
              )}
            {!focused && (
              <p className="text-xs text-zinc-500">
                Each submit runs OpenClaw agents through NemoClaw policy via{" "}
                <code className="rounded bg-white/5 px-1 text-[10px] text-zinc-400">
                  /api/agents/turn
                </code>
                — audit log records every ALLOW / APPROVAL / BLOCK.
              </p>
            )}
          </div>
        </div>
        {preview && (
          <LiveConfidenceMeter
            metrics={preview.metrics}
            answer={state.answerDraft}
            typingMs={typingMs}
            question={state.currentQuestion}
            company={state.companyName}
            role={state.jobRole}
            interviewType={state.interviewType}
            difficulty={state.interviewDifficulty}
          />
        )}
      </div>

      {fullInterview &&
        state.questionIndex > 0 &&
        state.questionIndex + 1 < state.questionCount && (
          <InterviewSmallTalkPanel
            phase="mid"
            company={state.companyName}
            role={state.jobRole}
            interviewType={state.interviewType}
          />
        )}

      {!focused && (
        <ReActReasoningPanel
          steps={state.reactTrace}
          usedNemotron={state.lastTurnUsedNemotron}
          mockMode={state.isJudgeDemo && !state.lastTurnUsedNemotron}
        />
      )}

      {coaching && state.step === "live" && fullInterview && lastAnswerQuality && (
        <GlassPanel
          className={`p-5 ${
            lastAnswerQuality.isNonAnswer
              ? "border border-rose-500/30"
              : lastAnswerQuality.isWeak
                ? "border border-amber-500/25"
                : ""
          }`}
          glow={lastAnswerQuality.isWeak ? "amber" : "cyan"}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
              lastAnswerQuality.isWeak
                ? "text-amber-200/90"
                : "text-cyan-300/80"
            }`}
          >
            {focused ? "Interviewer feedback" : "Interviewer feedback · NemoClaw-governed agents"}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-100">{coaching.headline}</p>
          <ul className="mt-3 list-none space-y-2 text-sm text-zinc-400">
            {coaching.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span
                  className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                    lastAnswerQuality.isWeak
                      ? "bg-amber-400/80"
                      : "bg-cyan-400/80"
                  }`}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
