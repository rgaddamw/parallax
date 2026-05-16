import { NextResponse } from "next/server";
import { enforceToolCall } from "@/lib/nemoclaw/engine";
import { loadNemoClawPolicyFromDisk } from "@/lib/nemoclaw/loadPolicy.server";
import {
  getNemotronBaseUrl,
  getNemotronModel,
  isNemotronConfigured,
} from "@/lib/nemotron/env";
import { NEMOTRON_CHAT_COMPLETIONS_URL } from "@/lib/nemotron/endpoints";

export const runtime = "nodejs";

/** Pre-demo check: Nemotron env + NemoClaw policy probes. */
export async function GET() {
  const policy = loadNemoClawPolicyFromDisk();
  const chatUrl = `${getNemotronBaseUrl()}/chat/completions`;
  const chatGate = enforceToolCall({
    tool: "nvidia_nim_chat_completions",
    targetUrl: chatUrl,
    intent: `POST ${chatUrl}`,
    agent: "orchestrator",
  });
  const exportBlock = enforceToolCall({
    tool: "export_behavioral_profile",
    intent: "Status probe — expect block",
    agent: "replay",
  });
  const untrustedBlock = enforceToolCall({
    tool: "outbound_untrusted_domain",
    targetUrl: "https://untrusted.example.com/data",
    intent: "Status probe — expect block",
    agent: "orchestrator",
  });

  return NextResponse.json({
    configured: isNemotronConfigured(),
    model: getNemotronModel(),
    chatRoute: "/api/nemotron/chat",
    turnRoute: "/api/agents/turn",
    nemoclaw: {
      policyName: policy.name,
      policyVersion: policy.version,
      policyRoute: "/api/nemoclaw/policy",
      denyMessage: policy.deny_message,
      trustedUrls: [
        NEMOTRON_CHAT_COMPLETIONS_URL,
        "https://integrate.api.nvidia.com",
        "https://api.nvidia.com",
      ],
      chatCompletionsAllowed: chatGate.mayExecute,
      exportBehavioralBlocked: !exportBlock.mayExecute,
      outboundUntrustedBlocked: !untrustedBlock.mayExecute,
    },
  });
}
