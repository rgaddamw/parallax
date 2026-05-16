import { NextResponse } from "next/server";
import { nemotronChatCompletion } from "@/server/nemotronClient";
import type { NemotronChatRequest } from "@/server/nemotronClient";
import { isNemotronConfigured, getNemotronBaseUrl } from "@/lib/nemotron/env";
import { enforceToolCall } from "@/lib/nemoclaw/engine";

/**
 * OpenAI-compatible proxy to NVIDIA Nemotron (NIM).
 * Body: { messages, tools?, tool_choice?, temperature?, top_p?, max_tokens? }
 * Requires NVIDIA_API_KEY or NEMOTRON_API_KEY in server environment.
 */
export async function POST(req: Request) {
  if (!isNemotronConfigured()) {
    return NextResponse.json(
      { error: "NVIDIA_API_KEY / NEMOTRON_API_KEY not configured" },
      { status: 503 },
    );
  }
  try {
    const body = (await req.json()) as NemotronChatRequest;
    if (!body.messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }
    const url = `${getNemotronBaseUrl()}/chat/completions`;
    const gate = enforceToolCall({
      tool: "nvidia_nim_chat_completions",
      targetUrl: url,
      intent: `POST ${url}`,
      agent: "orchestrator",
    });
    if (!gate.mayExecute) {
      return NextResponse.json(
        {
          error: gate.evaluation.denyMessage,
          policy: gate.evaluation,
          audit: gate.audit,
        },
        { status: 403 },
      );
    }
    const out = await nemotronChatCompletion(body);
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Nemotron proxy error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
