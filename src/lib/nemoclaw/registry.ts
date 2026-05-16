import type { ToolPolicyBinding } from "@/lib/nemoclaw/types";
import { NEMOTRON_CHAT_COMPLETIONS_URL } from "@/lib/nemotron/endpoints";
import { UNTRUSTED_DEMO_URL } from "@/lib/nemotron/endpoints";

/** Maps orchestrator / agent tools to policy actions and domains */
export const TOOL_REGISTRY: ToolPolicyBinding[] = [
  {
    tool: "analyze_paralinguistics",
    action: "analyze_transcript",
    domain: "file_access",
    intent: "Transcript-level delivery analysis (allowed)",
    agent: "behavioral",
  },
  {
    tool: "save_emotional_analysis",
    action: "save_emotional_analysis",
    domain: "behavioral_storage",
    intent: "Persist emotional signal summary beyond ephemeral session",
    agent: "behavioral",
  },
  {
    tool: "analyze_transcript",
    action: "analyze_transcript",
    domain: "file_access",
    intent: "Analyze candidate transcript in-session",
    agent: "behavioral",
  },
  {
    tool: "generate_feedback",
    action: "generate_feedback",
    domain: "file_access",
    intent: "Generate interview feedback for candidate",
    agent: "replay",
  },
  {
    tool: "read_resume_file",
    action: "read_resume_file",
    domain: "file_access",
    intent: "Read uploaded resume from local file picker",
    agent: "interviewer",
  },
  {
    tool: "analyze_resume_intelligence",
    action: "analyze_resume_intelligence",
    domain: "file_access",
    intent: "Autonomous resume gap analysis for target role",
    agent: "resume_intel",
  },
  {
    tool: "generate_resume_recommendations",
    action: "generate_resume_recommendations",
    domain: "file_access",
    intent: "Course, skill, and bullet rewrite recommendations",
    agent: "resume_intel",
  },
  {
    tool: "read_job_description_local",
    action: "read_job_description_local",
    domain: "file_access",
    intent: "Read job description from session form",
    agent: "memory",
  },
  {
    tool: "share_resume_externally",
    action: "share_resume_externally",
    domain: "file_access",
    intent: "Share private resume data to external endpoint",
    agent: "orchestrator",
  },
  {
    tool: "retrieve_session_memory",
    action: "ephemeral_session_memory",
    domain: "behavioral_storage",
    intent: "Fetch prior turn fingerprints from session graph",
    agent: "memory",
  },
  {
    tool: "persist_session_memory",
    action: "ephemeral_session_memory",
    domain: "behavioral_storage",
    intent: "Persist session memory to localStorage",
    agent: "memory",
  },
  {
    tool: "persist_behavioral_profile",
    action: "permanent_behavioral_profile",
    domain: "behavioral_storage",
    intent: "Store behavioral profile permanently",
    agent: "memory",
  },
  {
    tool: "export_behavioral_profile",
    action: "permanent_behavioral_profile",
    domain: "behavioral_storage",
    intent: "Export behavioral profile outside trust boundary",
    agent: "replay",
  },
  {
    tool: "store_behavioral_profile_permanent",
    action: "store_behavioral_profile_permanent",
    domain: "behavioral_storage",
    intent: "Permanent behavioral storage",
    agent: "memory",
  },
  {
    tool: "save_recording",
    action: "save_recording",
    domain: "recording_access",
    intent: "Save interview audio recording",
    agent: "orchestrator",
  },
  {
    tool: "persist_audio",
    action: "persist_audio",
    domain: "recording_access",
    intent: "Persist audio capture to disk",
    agent: "orchestrator",
  },
  {
    tool: "export_interview_profile",
    action: "export_interview_profile",
    domain: "export_permissions",
    intent: "Export interview profile bundle",
    agent: "replay",
  },
  {
    tool: "export_session_bundle",
    action: "export_session_bundle",
    domain: "export_permissions",
    intent: "Export full session artifact",
    agent: "replay",
  },
  {
    tool: "nemotron_inference_trusted",
    action: "nemotron_inference_trusted",
    domain: "network_api",
    intent: "Call NVIDIA Nemotron via trusted NIM endpoint",
    agent: "orchestrator",
  },
  {
    tool: "nemotron_react_loop",
    action: "nemotron_inference_trusted",
    domain: "network_api",
    intent: "Multi-step Nemotron ReAct reasoning loop",
    agent: "orchestrator",
  },
  {
    tool: "nvidia_nim_chat_completions",
    action: "nvidia_nim_chat_completions",
    domain: "network_api",
    intent: `POST ${NEMOTRON_CHAT_COMPLETIONS_URL}`,
    agent: "orchestrator",
  },
  {
    tool: "infer_interviewer_model",
    action: "trust_scoring",
    domain: "file_access",
    intent: "Trust scoring — project interviewer belief state from answer",
    agent: "perception",
  },
  {
    tool: "route_interviewer_action",
    action: "interviewer_reasoning",
    domain: "file_access",
    intent: "Interviewer reasoning — route decision graph",
    agent: "decision",
  },
  {
    tool: "build_cinematic_replay",
    action: "generate_feedback",
    domain: "file_access",
    intent: "Synthesize replay and hiring recommendation",
    agent: "replay",
  },
  {
    tool: "outbound_untrusted_domain",
    action: "outbound_untrusted_domain",
    domain: "network_api",
    intent: `Probe ${UNTRUSTED_DEMO_URL}`,
    agent: "orchestrator",
  },
];

export function resolveToolBinding(
  toolName: string,
  intent?: string,
): ToolPolicyBinding {
  const hit = TOOL_REGISTRY.find((t) => t.tool === toolName);
  if (hit) return hit;
  return {
    tool: toolName,
    action: toolName.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
    domain: "network_api",
    intent: intent ?? toolName,
    agent: "orchestrator",
  };
}

/** Tools probed each turn to demonstrate policy surface */
export function plannedToolBatch(): ToolPolicyBinding[] {
  return [
    resolveToolBinding("analyze_paralinguistics"),
    resolveToolBinding("analyze_transcript"),
    resolveToolBinding("generate_feedback"),
    resolveToolBinding("infer_interviewer_model"),
    resolveToolBinding("route_interviewer_action"),
    resolveToolBinding("retrieve_session_memory"),
    resolveToolBinding("persist_session_memory"),
    resolveToolBinding("save_emotional_analysis"),
    resolveToolBinding("read_resume_file"),
    resolveToolBinding("save_recording"),
    resolveToolBinding("export_interview_profile"),
    resolveToolBinding("persist_behavioral_profile"),
    resolveToolBinding("nvidia_nim_chat_completions"),
    resolveToolBinding("outbound_untrusted_domain"),
  ];
}

export function allRegisteredTools(): ToolPolicyBinding[] {
  return TOOL_REGISTRY;
}
