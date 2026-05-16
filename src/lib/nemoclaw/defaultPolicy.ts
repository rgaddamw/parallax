import type { NemoClawPolicyBundle } from "@/lib/nemoclaw/types";
import { NVIDIA_TRUSTED_URLS } from "@/lib/nemotron/endpoints";

/** Browser-safe policy bundle (mirrors policies/nemoclaw.default.yaml). */
export const DEFAULT_NEMOCLAW_POLICY: NemoClawPolicyBundle = {
  version: "1.0",
  name: "parallax-interview-default",
  description:
    "Default tenant policy for autonomous interview agents. Safe analysis and reasoning are allowed; sensitive exports require approval; untrusted network and permanent profiling are blocked.",
  domains: {
    file_access: {
      description: "Local resume and transcript artifacts",
      allow: [
        "analyze_transcript",
        "read_job_description_local",
        "generate_feedback",
        "interviewer_reasoning",
        "trust_scoring",
        "analyze_resume_intelligence",
        "generate_resume_recommendations",
      ],
      require_approval: ["read_resume_file"],
      block: [
        "share_resume_externally",
        "write_resume_to_untrusted_path",
      ],
    },
    recording_access: {
      description: "Audio capture and persistence",
      allow: ["analyze_transcript"],
      require_approval: ["save_recording", "persist_audio"],
      block: ["stream_recording_external"],
    },
    export_permissions: {
      description: "Interview artifacts leaving the trust boundary",
      allow: [],
      require_approval: ["export_interview_profile", "export_session_bundle"],
      block: ["bulk_export_pii"],
    },
    network_api: {
      description: "Outbound inference and integrations (NVIDIA NIM only)",
      allow: ["nemotron_inference_trusted", "nvidia_nim_chat_completions"],
      require_approval: ["unknown_api_call"],
      block: ["outbound_untrusted_domain", "share_resume_externally"],
    },
    behavioral_storage: {
      description: "Candidate behavioral models and profiling",
      allow: ["ephemeral_session_memory"],
      require_approval: ["save_emotional_analysis"],
      block: [
        "permanent_behavioral_profile",
        "store_behavioral_profile_permanent",
        "export_behavioral_profile",
      ],
    },
  },
  trusted_domains: ["integrate.api.nvidia.com", "api.nvidia.com"],
  trusted_urls: [...NVIDIA_TRUSTED_URLS],
  deny_message: "Denied by NemoClaw policy layer.",
};
