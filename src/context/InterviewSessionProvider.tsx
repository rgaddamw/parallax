"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildJobDescription,
  generateInterviewQuestion,
  personalityForConfig,
} from "@/lib/career/interviewQuestions";
import { buildPostInterviewReport } from "@/lib/career/postInterview";
import { runCareerPolicyBatch } from "@/lib/career/policyAudit";
import {
  buildResumeProfile,
  mockResumeTextFromFile,
} from "@/lib/resume/extractProfile";
import { analyzeResumeIntelligence } from "@/lib/resumeIntelligence/analyze";
import type {
  InterviewDifficulty,
  InterviewType,
} from "@/types/career";
import type {
  InterviewerPersonality,
  ReplayInsight,
  TurnRecord,
} from "@/types/interview";
import type {
  ActivityEvent,
  PipelineTurnOutput,
  ReActTraceStep,
  SessionMemory,
} from "@/agents/types";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import { createInitialMemory, persistMemory } from "@/agents/persistence";
import { runAnswerPipeline, runSessionBootstrap } from "@/agents/orchestrator";
import { buildAgentReplay } from "@/agents/replayAgent";
import { applyJudgeDemoFrame, sleep } from "@/lib/judgeDemo/applyFrame";
import { buildJudgeDemoTimeline } from "@/lib/judgeDemo/timeline";
import { JUDGE_DEMO_JD, JUDGE_DEMO_QUESTION } from "@/lib/judgeDemo/scenario";
import { JUDGE_DEMO_STORAGE_KEY } from "@/lib/judgeDemo/scenario";
import {
  applySecureAgentFrame,
  sleep as secureSleep,
} from "@/lib/secureAgentRun/applyFrame";
import { buildSecureAgentRunTimeline } from "@/lib/secureAgentRun/timeline";
import { secureAgentRunMeta } from "@/lib/secureAgentRun/timeline";
import { SECURE_AGENT_STORAGE_KEY } from "@/lib/secureAgentRun/scenario";

export type { InterviewSessionState } from "@/types/sessionState";
import type { InterviewSessionState } from "@/types/sessionState";

const initial: InterviewSessionState = {
  step: "setup",
  sessionId: "",
  resumeName: "",
  resumeText: "",
  resumeProfile: null,
  companyName: "",
  jobRole: "",
  jobDescription: "",
  careerMode: null,
  interviewType: "mixed",
  interviewDifficulty: "normal",
  questionCount: 5,
  personality: null,
  questionIndex: 0,
  currentQuestion: "",
  answerDraft: "",
  turns: [],
  replay: null,
  postInterviewReport: null,
  resumeIntelligenceReport: null,
  isAnalyzingResume: false,
  isListening: false,
  answerClockStart: 0,
  memory: null,
  activityEvents: [],
  isOrchestrating: false,
  reactTrace: [],
  lastTurnUsedNemotron: false,
  securityAudit: [],
  approvedTools: [],
  isJudgeDemo: false,
  isJudgeDemoRunning: false,
  judgeDemoLabel: "",
  isSecureAgentRun: false,
  isSecureAgentRunRunning: false,
  secureAgentRunLabel: "",
  openShellAudit: [],
  highlightedPolicyRuleKey: null,
  showNemoclawJudgeSummary: false,
};

type Ctx = {
  state: InterviewSessionState;
  setResumeName: (v: string) => void;
  setResumeText: (v: string) => void;
  setCompanyName: (v: string) => void;
  setJobRole: (v: string) => void;
  setJobDescription: (v: string) => void;
  setInterviewType: (t: InterviewType) => void;
  setInterviewDifficulty: (d: InterviewDifficulty) => void;
  setQuestionCount: (n: number) => void;
  setPersonality: (p: InterviewerPersonality) => void;
  setAnswerDraft: (v: string) => void;
  goToBranch: () => void;
  goBack: () => void;
  startLiveInterview: () => void;
  runResumeIntelligence: () => Promise<void>;
  startInterview: () => void;
  submitAnswer: () => Promise<void>;
  skipToReplay: () => void;
  resetSession: () => void;
  toggleListen: () => void;
  appendTranscript: (text: string) => void;
  approveTool: (tool: string) => void;
  runJudgeDemo: () => Promise<void>;
  cancelJudgeDemo: () => void;
  runSecureAgentRun: () => Promise<void>;
  cancelSecureAgentRun: () => void;
  setHighlightedPolicyRuleKey: (key: string | null) => void;
  dismissNemoclawJudgeSummary: () => void;
};

const InterviewSessionContext = createContext<Ctx | null>(null);

export function InterviewSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<InterviewSessionState>(initial);
  const stateRef = useRef(state);
  const bootstrapForSession = useRef<string>("");
  const judgeDemoAbort = useRef(false);
  const secureAgentAbort = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setResumeName = useCallback((resumeName: string) => {
    setState((s) => ({ ...s, resumeName }));
  }, []);

  const setResumeText = useCallback((resumeText: string) => {
    setState((s) => ({ ...s, resumeText }));
  }, []);

  const setCompanyName = useCallback((companyName: string) => {
    setState((s) => ({ ...s, companyName }));
  }, []);

  const setJobRole = useCallback((jobRole: string) => {
    setState((s) => ({ ...s, jobRole }));
  }, []);

  const setJobDescription = useCallback((jobDescription: string) => {
    setState((s) => ({ ...s, jobDescription }));
  }, []);

  const setInterviewType = useCallback((interviewType: InterviewType) => {
    setState((s) => ({ ...s, interviewType }));
  }, []);

  const setInterviewDifficulty = useCallback(
    (interviewDifficulty: InterviewDifficulty) => {
      setState((s) => ({ ...s, interviewDifficulty }));
    },
    [],
  );

  const setQuestionCount = useCallback((questionCount: number) => {
    const n = Math.min(12, Math.max(1, Math.round(questionCount)));
    setState((s) => ({ ...s, questionCount: n }));
  }, []);

  const ensureResumeProfile = useCallback((s: InterviewSessionState) => {
    const raw =
      s.resumeText.trim() ||
      mockResumeTextFromFile(s.resumeName, s.jobRole, s.companyName);
    const profile = buildResumeProfile(raw, s.resumeName, s.jobRole);
    return { raw, profile };
  }, []);

  const goToBranch = useCallback(() => {
    setState((s) => {
      if (
        !s.resumeName.trim() ||
        !s.companyName.trim() ||
        !s.jobRole.trim()
      ) {
        return s;
      }
      const { raw, profile } = ensureResumeProfile(s);
      return {
        ...s,
        step: "branch" as const,
        resumeText: raw,
        resumeProfile: profile,
        jobDescription: buildJobDescription(s.companyName, s.jobRole),
      };
    });
  }, [ensureResumeProfile]);

  const goBack = useCallback(() => {
    setState((s) => {
      switch (s.step) {
        case "branch":
          return { ...s, step: "setup" as const };
        case "live":
          bootstrapForSession.current = "";
          return {
            ...s,
            step: "branch" as const,
            careerMode: null,
            sessionId: "",
            personality: null,
            questionIndex: 0,
            currentQuestion: "",
            answerDraft: "",
            turns: [],
            replay: null,
            postInterviewReport: null,
            answerClockStart: 0,
            memory: null,
            activityEvents: [],
            isOrchestrating: false,
            reactTrace: [],
            lastTurnUsedNemotron: false,
            isListening: false,
          };
        case "resume_intel":
          return {
            ...s,
            step: "branch" as const,
            careerMode: null,
            resumeIntelligenceReport: null,
            isAnalyzingResume: false,
          };
        case "replay":
          bootstrapForSession.current = "";
          return {
            ...s,
            step: "branch" as const,
            careerMode: null,
            sessionId: "",
            personality: null,
            questionIndex: 0,
            currentQuestion: "",
            answerDraft: "",
            turns: [],
            replay: null,
            postInterviewReport: null,
            answerClockStart: 0,
            memory: null,
            activityEvents: [],
            isOrchestrating: false,
            reactTrace: [],
            lastTurnUsedNemotron: false,
            isListening: false,
          };
        default:
          return s;
      }
    });
  }, []);

  const startLiveInterview = useCallback(() => {
    setState((s) => {
      const { raw, profile } = ensureResumeProfile(s);
      const personality = personalityForConfig(
        s.interviewType,
        s.interviewDifficulty,
      );
      const sessionId = crypto.randomUUID();
      const memory = createInitialMemory(sessionId, personality);
      persistMemory(memory);
      const now = Date.now();
      const currentQuestion = generateInterviewQuestion({
        company: s.companyName,
        role: s.jobRole,
        interviewType: s.interviewType,
        difficulty: s.interviewDifficulty,
        personality,
        profile,
        questionIndex: 0,
        priorAnswers: [],
        trustScore: memory.trustScore,
      });
      const approved = new Set(s.approvedTools);
      const { openShell, security } = runCareerPolicyBatch([
        {
          tool: "read_resume_file",
          agent: "interviewer",
          intent: `Read ${s.resumeName} for ${s.jobRole} at ${s.companyName}`,
          approvedTools: approved,
        },
        {
          tool: "read_job_description_local",
          agent: "memory",
          approvedTools: approved,
        },
      ]);
      return {
        ...s,
        step: "live" as const,
        careerMode: "live_interview" as const,
        sessionId,
        resumeText: raw,
        resumeProfile: profile,
        personality,
        jobDescription: buildJobDescription(s.companyName, s.jobRole),
        questionIndex: 0,
        currentQuestion,
        answerDraft: "",
        turns: [],
        replay: null,
        postInterviewReport: null,
        answerClockStart: now,
        memory,
        activityEvents: [],
        isOrchestrating: false,
        reactTrace: [],
        lastTurnUsedNemotron: false,
        securityAudit: [...s.securityAudit, ...security],
        openShellAudit: [...s.openShellAudit, ...openShell],
      };
    });
  }, [ensureResumeProfile]);

  const runResumeIntelligence = useCallback(async () => {
    const snap = stateRef.current;
    if (!snap.companyName.trim() || !snap.jobRole.trim()) return;

    const { raw, profile } = ensureResumeProfile(snap);
    const approved = new Set(snap.approvedTools);

    const { openShell, security } = runCareerPolicyBatch([
      {
        tool: "read_resume_file",
        agent: "resume_intel",
        intent: `Analyze resume for ${snap.jobRole}`,
        approvedTools: approved,
      },
      { tool: "analyze_resume_intelligence", agent: "resume_intel" },
      { tool: "generate_resume_recommendations", agent: "resume_intel" },
    ]);

    const blocked = openShell.some((e) => e.decision === "BLOCK");
    const readPending = openShell.find(
      (e) => e.tool === "read_resume_file" && e.decision === "REQUIRE_APPROVAL",
    );
    const readOk =
      !readPending || approved.has("read_resume_file");

    setState((s) => ({
      ...s,
      resumeText: raw,
      resumeProfile: profile,
      careerMode: "resume_intelligence",
      securityAudit: [...s.securityAudit, ...security],
      openShellAudit: [...s.openShellAudit, ...openShell],
    }));

    if (blocked) return;
    if (!readOk) return;

    setState((s) => ({ ...s, isAnalyzingResume: true }));
    await new Promise((r) => setTimeout(r, 900));

    const report = analyzeResumeIntelligence({
      profile,
      company: snap.companyName,
      role: snap.jobRole,
    });

    setState((s) => ({
      ...s,
      step: "resume_intel" as const,
      isAnalyzingResume: false,
      resumeIntelligenceReport: report,
    }));
  }, [ensureResumeProfile]);

  const setPersonality = useCallback((personality: InterviewerPersonality) => {
    setState((s) => ({ ...s, personality }));
  }, []);

  const setAnswerDraft = useCallback((answerDraft: string) => {
    setState((s) => ({ ...s, answerDraft }));
  }, []);

  const startInterview = useCallback(() => {
    if (stateRef.current.companyName && stateRef.current.jobRole) {
      startLiveInterview();
      return;
    }
    setState((s) => {
      if (!s.personality) return s;
      const sessionId = crypto.randomUUID();
      const memory = createInitialMemory(sessionId, s.personality);
      persistMemory(memory);
      const now = Date.now();
      const currentQuestion = generateInterviewQuestion({
        company: s.companyName || "Target Co",
        role: s.jobRole || "Software Engineer",
        interviewType: s.interviewType,
        difficulty: s.interviewDifficulty,
        personality: s.personality,
        profile: s.resumeProfile,
        questionIndex: 0,
        priorAnswers: [],
        trustScore: memory.trustScore,
      });
      return {
        ...s,
        step: "live" as const,
        sessionId,
        questionIndex: 0,
        currentQuestion,
        answerDraft: "",
        turns: [],
        replay: null,
        postInterviewReport: null,
        answerClockStart: now,
        memory,
        activityEvents: [],
        isOrchestrating: false,
        reactTrace: [],
        lastTurnUsedNemotron: false,
        securityAudit: [],
        approvedTools: [],
      };
    });
  }, [startLiveInterview]);

  const approveTool = useCallback((tool: string) => {
    setState((s) => ({
      ...s,
      approvedTools: s.approvedTools.includes(tool)
        ? s.approvedTools
        : [...s.approvedTools, tool],
    }));
  }, []);

  useEffect(() => {
    if (state.step !== "live" || !state.sessionId || !state.personality) return;
    if (state.isJudgeDemo || state.isSecureAgentRun) return;
    if (bootstrapForSession.current === state.sessionId) return;
    bootstrapForSession.current = state.sessionId;
    const sid = state.sessionId;
    const pers = state.personality;
    const resume = state.resumeName;
    const push = (e: ActivityEvent) => {
      setState((x) => ({ ...x, activityEvents: [...x.activityEvents, e] }));
    };
    void runSessionBootstrap(push, {
      sessionId: sid,
      personality: pers,
      resumeName: resume,
    });
  }, [
    state.step,
    state.sessionId,
    state.personality,
    state.resumeName,
    state.isJudgeDemo,
    state.isSecureAgentRun,
  ]);

  const cancelJudgeDemo = useCallback(() => {
    judgeDemoAbort.current = true;
    setState((s) => ({
      ...s,
      isJudgeDemoRunning: false,
      isOrchestrating: false,
    }));
  }, []);

  const runJudgeDemo = useCallback(async () => {
    judgeDemoAbort.current = false;
    const sessionId = `judge-demo-${Date.now()}`;
    bootstrapForSession.current = sessionId;
    const memory = createInitialMemory(sessionId, "skeptical_engineer");
    memory.trustScore = 68;

    setState({
      ...initial,
      step: "live",
      sessionId,
      resumeName: "judge-demo-resume.pdf",
      jobDescription: JUDGE_DEMO_JD,
      personality: "skeptical_engineer",
      questionIndex: 0,
      currentQuestion: JUDGE_DEMO_QUESTION,
      answerDraft: "",
      turns: [],
      replay: null,
      answerClockStart: 0,
      memory,
      activityEvents: [],
      isOrchestrating: false,
      reactTrace: [],
      lastTurnUsedNemotron: false,
      securityAudit: [],
      approvedTools: [],
      isJudgeDemo: true,
      isJudgeDemoRunning: true,
      judgeDemoLabel: "starting",
    });

    const frames = buildJudgeDemoTimeline(sessionId);

    for (const frame of frames) {
      if (judgeDemoAbort.current) break;
      if (frame.delayMs > 0) await sleep(frame.delayMs);
      if (judgeDemoAbort.current) break;
      setState((prev) => ({
        ...applyJudgeDemoFrame(prev, frame),
        judgeDemoLabel: frame.label,
        isJudgeDemo: true,
        isJudgeDemoRunning: true,
      }));
    }

    setState((s) => ({
      ...s,
      isJudgeDemoRunning: false,
      isOrchestrating: false,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(JUDGE_DEMO_STORAGE_KEY) !== "1") return;
      sessionStorage.removeItem(JUDGE_DEMO_STORAGE_KEY);
    } catch {
      return;
    }
    void runJudgeDemo();
  }, [runJudgeDemo]);

  const cancelSecureAgentRun = useCallback(() => {
    secureAgentAbort.current = true;
    setState((s) => ({
      ...s,
      isSecureAgentRunRunning: false,
      isOrchestrating: false,
    }));
  }, []);

  const runSecureAgentRun = useCallback(async () => {
    secureAgentAbort.current = false;
    judgeDemoAbort.current = true;
    const sessionId = `secure-agent-${Date.now()}`;
    bootstrapForSession.current = sessionId;
    const meta = secureAgentRunMeta();
    const memory = createInitialMemory(sessionId, "friendly_recruiter");
    memory.trustScore = 65;

    setState({
      ...initial,
      step: "live",
      sessionId,
      resumeName: "candidate-resume.pdf",
      jobDescription: meta.jobDescription,
      personality: "friendly_recruiter",
      questionIndex: 0,
      currentQuestion: meta.question,
      answerDraft: "",
      turns: [],
      replay: null,
      answerClockStart: 0,
      memory,
      activityEvents: [],
      isOrchestrating: false,
      reactTrace: [],
      lastTurnUsedNemotron: false,
      securityAudit: [],
      approvedTools: [],
      isJudgeDemo: false,
      isJudgeDemoRunning: false,
      judgeDemoLabel: "",
      isSecureAgentRun: true,
      isSecureAgentRunRunning: true,
      secureAgentRunLabel: "starting",
      openShellAudit: [],
      highlightedPolicyRuleKey: null,
      showNemoclawJudgeSummary: false,
    });

    const frames = buildSecureAgentRunTimeline();

    for (const frame of frames) {
      if (secureAgentAbort.current) break;
      if (frame.delayMs > 0) await secureSleep(frame.delayMs);
      if (secureAgentAbort.current) break;
      setState((prev) => ({
        ...applySecureAgentFrame(prev, frame),
        secureAgentRunLabel: frame.label,
        isSecureAgentRun: true,
        isSecureAgentRunRunning: true,
      }));
    }

    setState((s) => ({
      ...s,
      isSecureAgentRunRunning: false,
      isOrchestrating: false,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SECURE_AGENT_STORAGE_KEY) !== "1") return;
      sessionStorage.removeItem(SECURE_AGENT_STORAGE_KEY);
    } catch {
      return;
    }
    void runSecureAgentRun();
  }, [runSecureAgentRun]);

  const setHighlightedPolicyRuleKey = useCallback((key: string | null) => {
    setState((s) => ({ ...s, highlightedPolicyRuleKey: key }));
  }, []);

  const dismissNemoclawJudgeSummary = useCallback(() => {
    setState((s) => ({ ...s, showNemoclawJudgeSummary: false }));
  }, []);

  const submitAnswer = useCallback(async () => {
    const snap = stateRef.current;
    if (
      snap.isJudgeDemo ||
      snap.isJudgeDemoRunning ||
      snap.isSecureAgentRun ||
      snap.isSecureAgentRunRunning ||
      !snap.personality ||
      !snap.memory ||
      snap.isOrchestrating ||
      snap.step !== "live"
    ) {
      return;
    }

    setState((s) => ({ ...s, isOrchestrating: true }));

    const typingMs = Math.max(
      200,
      Date.now() -
        (snap.answerClockStart > 0 ? snap.answerClockStart : Date.now()),
    );

    const basePipeline = {
      sessionId: snap.sessionId,
      basePersonality: snap.personality,
      memory: snap.memory,
      questionIndex: snap.questionIndex,
      currentQuestion: snap.currentQuestion,
      answer: snap.answerDraft,
      typingMs,
      priorTurns: snap.turns,
      jobDescription: snap.jobDescription,
      maxTurns: snap.questionCount,
      approvedTools: snap.approvedTools,
      career:
        snap.careerMode === "live_interview" && snap.companyName
          ? {
              company: snap.companyName,
              role: snap.jobRole,
              interviewType: snap.interviewType,
              difficulty: snap.interviewDifficulty,
              profile: snap.resumeProfile,
            }
          : undefined,
    };

    try {
      const res = await fetch("/api/agents/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePipeline, serverFast: true }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as {
        activityEvents: ActivityEvent[];
        output: PipelineTurnOutput;
        usedNemotron: boolean;
      };

      setState((x) => {
        const turns = [...x.turns, data.output.turn];
        const replay = data.output.replay;
        return {
          ...x,
          activityEvents: [...x.activityEvents, ...data.activityEvents],
          turns,
          questionIndex: data.output.nextIndex,
          currentQuestion: data.output.nextQuestion,
          answerDraft: "",
          answerClockStart: data.output.step === "live" ? Date.now() : 0,
          memory: data.output.memory,
          replay,
          postInterviewReport:
            data.output.step === "replay" && x.companyName
              ? buildPostInterviewReport(
                  turns,
                  replay,
                  x.companyName,
                  x.jobRole,
                  {
                    interviewType: x.interviewType,
                    difficulty: x.interviewDifficulty,
                    questionCount: x.questionCount,
                  },
                )
              : x.postInterviewReport,
          step: data.output.step,
          reactTrace: data.output.reactTrace ?? [],
          lastTurnUsedNemotron: data.usedNemotron,
          securityAudit: [
            ...x.securityAudit,
            ...(data.output.securityAudit ?? []),
          ],
          isOrchestrating: false,
        };
      });
    } catch {
      try {
        const push = (e: ActivityEvent) => {
          setState((x) => ({ ...x, activityEvents: [...x.activityEvents, e] }));
        };
        const out = await runAnswerPipeline(push, {
          ...basePipeline,
          serverFast: false,
        });
        setState((x) => {
          const turns = [...x.turns, out.turn];
          const replay = out.replay;
          return {
            ...x,
            turns,
            questionIndex: out.nextIndex,
            currentQuestion: out.nextQuestion,
            answerDraft: "",
            answerClockStart: out.step === "live" ? Date.now() : 0,
            memory: out.memory,
            replay,
            postInterviewReport:
              out.step === "replay" && x.companyName
                ? buildPostInterviewReport(
                    turns,
                    replay,
                    x.companyName,
                    x.jobRole,
                    {
                      interviewType: x.interviewType,
                      difficulty: x.interviewDifficulty,
                      questionCount: x.questionCount,
                    },
                  )
                : x.postInterviewReport,
            step: out.step,
            reactTrace: out.reactTrace ?? [],
            lastTurnUsedNemotron: false,
            securityAudit: [...x.securityAudit, ...(out.securityAudit ?? [])],
            isOrchestrating: false,
          };
        });
      } catch {
        setState((x) => ({ ...x, isOrchestrating: false }));
      }
    }
  }, []);

  const skipToReplay = useCallback(() => {
    setState((s) => {
      if (!s.turns.length) return { ...s, step: "setup" as const };
      const mem =
        s.memory ??
        createInitialMemory(
          s.sessionId || crypto.randomUUID(),
          s.personality ?? "friendly_recruiter",
        );
      const replay = buildAgentReplay(s.turns, mem);
      return {
        ...s,
        step: "replay" as const,
        replay,
        postInterviewReport:
          s.companyName && s.careerMode === "live_interview"
            ? buildPostInterviewReport(
                s.turns,
                replay,
                s.companyName,
                s.jobRole,
                {
                  interviewType: s.interviewType,
                  difficulty: s.interviewDifficulty,
                  questionCount: s.questionCount,
                },
              )
            : s.postInterviewReport,
        answerClockStart: 0,
        isOrchestrating: false,
      };
    });
  }, []);

  const resetSession = useCallback(() => {
    judgeDemoAbort.current = true;
    secureAgentAbort.current = true;
    bootstrapForSession.current = "";
    setState(initial);
  }, []);

  const toggleListen = useCallback(() => {
    setState((s) => ({ ...s, isListening: !s.isListening }));
  }, []);

  const appendTranscript = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      answerDraft: s.answerDraft ? `${s.answerDraft} ${text}` : text,
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setResumeName,
      setResumeText,
      setCompanyName,
      setJobRole,
      setJobDescription,
      setInterviewType,
      setInterviewDifficulty,
      setQuestionCount,
      setPersonality,
      setAnswerDraft,
      goToBranch,
      goBack,
      startLiveInterview,
      runResumeIntelligence,
      startInterview,
      submitAnswer,
      skipToReplay,
      resetSession,
      toggleListen,
      appendTranscript,
      approveTool,
      runJudgeDemo,
      cancelJudgeDemo,
      runSecureAgentRun,
      cancelSecureAgentRun,
      setHighlightedPolicyRuleKey,
      dismissNemoclawJudgeSummary,
    }),
    [
      state,
      setResumeName,
      setResumeText,
      setCompanyName,
      setJobRole,
      setJobDescription,
      setInterviewType,
      setInterviewDifficulty,
      setQuestionCount,
      setPersonality,
      setAnswerDraft,
      goToBranch,
      goBack,
      startLiveInterview,
      runResumeIntelligence,
      startInterview,
      submitAnswer,
      skipToReplay,
      resetSession,
      toggleListen,
      appendTranscript,
      approveTool,
      runJudgeDemo,
      cancelJudgeDemo,
      runSecureAgentRun,
      cancelSecureAgentRun,
      setHighlightedPolicyRuleKey,
      dismissNemoclawJudgeSummary,
    ],
  );

  return (
    <InterviewSessionContext.Provider value={value}>
      {children}
    </InterviewSessionContext.Provider>
  );
}

export function useInterviewSession() {
  const ctx = useContext(InterviewSessionContext);
  if (!ctx) {
    throw new Error("useInterviewSession must be used within provider");
  }
  return ctx;
}

export function useInterviewSessionOptional() {
  return useContext(InterviewSessionContext);
}
