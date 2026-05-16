import type { ActivityEvent, AgentId } from "@/agents/types";
import { enforceAndLog } from "@/lib/nemoclaw/openshellAudit";
import {
  NEMOTRON_CHAT_COMPLETIONS_URL,
  UNTRUSTED_DEMO_URL,
} from "@/lib/nemotron/endpoints";
import {
  SECURE_AGENT_ANSWER,
  SECURE_AGENT_JD,
  SECURE_AGENT_QUESTION,
} from "@/lib/secureAgentRun/scenario";
import type { SecureAgentFrame } from "@/lib/secureAgentRun/applyFrame";

let seq = 0;
function eid() {
  seq += 1;
  return `secure-${seq}-${Date.now()}`;
}

function evt(
  agent: AgentId,
  kind: ActivityEvent["kind"],
  title: string,
  detail?: string,
): ActivityEvent {
  return {
    id: eid(),
    ts: Date.now(),
    agent,
    kind,
    title,
    detail,
  };
}

export function buildSecureAgentRunTimeline(): SecureAgentFrame[] {
  const step1 = enforceAndLog({
    tool: "read_resume_file",
    agent: "perception",
    workflowContinues: true,
  });

  const step1Approved = enforceAndLog({
    tool: "read_resume_file",
    agent: "perception",
    approvedTools: new Set(["read_resume_file"]),
    workflowContinues: true,
  });

  const step2 = enforceAndLog({
    tool: "analyze_transcript",
    agent: "perception",
    workflowContinues: true,
  });

  const step3 = enforceAndLog({
    tool: "nvidia_nim_chat_completions",
    agent: "interviewer",
    targetUrl: NEMOTRON_CHAT_COMPLETIONS_URL,
    workflowContinues: true,
  });

  const step4 = enforceAndLog({
    tool: "generate_feedback",
    agent: "interviewer",
    workflowContinues: true,
  });

  const step5 = enforceAndLog({
    tool: "save_emotional_analysis",
    agent: "behavioral",
    workflowContinues: true,
  });

  const step6 = enforceAndLog({
    tool: "persist_behavioral_profile",
    agent: "behavioral",
    workflowContinues: true,
  });

  const step7 = enforceAndLog({
    tool: "export_interview_profile",
    agent: "memory",
    workflowContinues: true,
  });

  const step8 = enforceAndLog({
    tool: "outbound_untrusted_domain",
    agent: "interviewer",
    targetUrl: UNTRUSTED_DEMO_URL,
    workflowContinues: true,
  });

  const step9 = enforceAndLog({
    tool: "infer_interviewer_model",
    agent: "decision",
    workflowContinues: true,
  });

  return [
    {
      delayMs: 400,
      label: "Secure Agent Run · boot",
      patch: {
        isOrchestrating: true,
        appendEvents: [
          evt(
            "orchestrator",
            "handoff",
            "Secure Agent Run",
            "NemoClaw-first policy demo — autonomous agents within strict YAML bounds.",
          ),
        ],
      },
    },
  {
      delayMs: 900,
      label: "1 · resume (pending approval)",
      patch: {
        appendOpenShell: [step1.openShell],
        appendEvents: [
          evt(
            "perception",
            "policy",
            "Read resume file",
            "REQUIRE_APPROVAL — resume not yet approved by human.",
          ),
        ],
      },
    },
    {
      delayMs: 1100,
      label: "1b · resume approved",
      patch: {
        approvedTools: ["read_resume_file"],
        appendOpenShell: [step1Approved.openShell],
        appendEvents: [
          evt(
            "perception",
            "tool_call",
            "Resume ingested",
            "Human approved read_resume_file — proceeding with analysis.",
          ),
        ],
      },
    },
    {
      delayMs: 800,
      label: "2 · transcript analysis",
      patch: {
        appendOpenShell: [step2.openShell],
        appendEvents: [
          evt(
            "perception",
            "tool_call",
            "Analyze interview transcript",
            "ALLOW — transcript analysis within policy.",
          ),
        ],
      },
    },
    {
      delayMs: 900,
      label: "3 · Nemotron (trusted NVIDIA)",
      patch: {
        appendOpenShell: [step3.openShell],
        appendEvents: [
          evt(
            "interviewer",
            "reasoning",
            "Nemotron inference",
            `Trusted endpoint: ${NEMOTRON_CHAT_COMPLETIONS_URL}`,
          ),
        ],
      },
    },
    {
      delayMs: 700,
      label: "4 · interviewer feedback",
      patch: {
        appendOpenShell: [step4.openShell],
        appendEvents: [
          evt(
            "interviewer",
            "reasoning",
            "Generate interviewer feedback",
            "ALLOW — feedback generation permitted.",
          ),
        ],
      },
    },
    {
      delayMs: 800,
      label: "5 · emotional profile (approval)",
      patch: {
        appendOpenShell: [step5.openShell],
        appendEvents: [
          evt(
            "behavioral",
            "policy",
            "Save emotional / behavioral profile",
            "REQUIRE_APPROVAL — sensitive behavioral storage.",
          ),
        ],
      },
    },
    {
      delayMs: 900,
      label: "6 · permanent storage blocked",
      patch: {
        appendOpenShell: [step6.openShell],
        appendEvents: [
          evt(
            "behavioral",
            "policy",
            "Permanent behavioral profile",
            "BLOCK — NemoClaw denies permanent profiling.",
          ),
        ],
      },
    },
    {
      delayMs: 800,
      label: "7 · export profile (approval)",
      patch: {
        appendOpenShell: [step7.openShell],
        appendEvents: [
          evt(
            "memory",
            "policy",
            "Export interview profile",
            "REQUIRE_APPROVAL — export crosses trust boundary.",
          ),
        ],
      },
    },
    {
      delayMs: 900,
      label: "8 · untrusted domain blocked",
      patch: {
        appendOpenShell: [step8.openShell],
        appendEvents: [
          evt(
            "interviewer",
            "policy",
            "Outbound call to untrusted domain",
            `BLOCK — ${UNTRUSTED_DEMO_URL} not in trusted_urls.`,
          ),
        ],
      },
    },
    {
      delayMs: 700,
      label: "9 · workflow continues",
      patch: {
        answerDraft: SECURE_AGENT_ANSWER,
        appendOpenShell: [step9.openShell],
        memoryTrust: 72,
        appendEvents: [
          evt(
            "decision",
            "decision",
            "Interview workflow continues",
            "Policy blocks did not halt useful analysis — trust scoring and coaching proceed.",
          ),
          evt(
            "orchestrator",
            "decision",
            "Secure Agent Run complete",
            "Audit log ready · YAML policy proven · autonomy within bounds.",
          ),
        ],
      },
    },
    {
      delayMs: 500,
      label: "summary",
      patch: {
        isOrchestrating: false,
        showJudgeSummary: true,
      },
    },
  ];
}

export function secureAgentRunMeta() {
  return {
    jobDescription: SECURE_AGENT_JD,
    question: SECURE_AGENT_QUESTION,
    answer: SECURE_AGENT_ANSWER,
  };
}
