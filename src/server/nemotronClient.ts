import {
  getNemotronApiKey,
  getNemotronBaseUrl,
  getNemotronModel,
} from "@/lib/nemotron/env";
import { enforceToolCall } from "@/lib/nemoclaw/engine";
import { INTERVIEWER_SYSTEM } from "@/lib/nemotron/prompts";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface NemotronChatRequest {
  messages: ChatMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface NemotronChatResponse {
  choices: Array<{
    message: ChatMessage;
    finish_reason?: string;
  }>;
  error?: { message?: string };
}

function stripJsonFence(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence) return fence[1]!.trim();
  return t;
}

export async function nemotronChatCompletion(
  body: NemotronChatRequest,
): Promise<NemotronChatResponse> {
  const key = getNemotronApiKey();
  if (!key) {
    throw new Error("NVIDIA_API_KEY is not configured on the server");
  }
  const url = `${getNemotronBaseUrl()}/chat/completions`;
  const gate = enforceToolCall({
    tool: "nvidia_nim_chat_completions",
    targetUrl: url,
    intent: `POST ${url}`,
    agent: "orchestrator",
  });
  if (!gate.mayExecute) {
    throw new Error(gate.audit.message);
  }
  const msgs =
    body.messages[0]?.role === "system"
      ? body.messages
      : [{ role: "system" as const, content: INTERVIEWER_SYSTEM }, ...body.messages];
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getNemotronModel(),
      temperature: body.temperature ?? 1,
      top_p: body.top_p ?? 0.95,
      max_tokens: body.max_tokens ?? 2048,
      messages: msgs,
      tools: body.tools,
      tool_choice: body.tool_choice,
    }),
  });

  const json = (await res.json()) as NemotronChatResponse & {
    message?: string;
  };
  if (!res.ok) {
    const msg =
      json.error?.message ?? json.message ?? res.statusText ?? "Nemotron error";
    throw new Error(`Nemotron HTTP ${res.status}: ${msg}`);
  }
  return json;
}

export async function nemotronTextCompletion(
  userPayload: string,
  extras?: Partial<NemotronChatRequest>,
): Promise<string> {
  const out = await nemotronChatCompletion({
    messages: [{ role: "user", content: userPayload }],
    temperature: extras?.temperature,
    top_p: extras?.top_p,
    max_tokens: extras?.max_tokens,
  });
  const content = out.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Nemotron returned empty content");
  }
  return stripJsonFence(content);
}

export function safeParseJson<T>(raw: string): T {
  return JSON.parse(stripJsonFence(raw)) as T;
}
