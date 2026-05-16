import {
  NEMOTRON_CHAT_COMPLETIONS_URL,
  UNTRUSTED_DEMO_URL,
} from "@/lib/nemotron/endpoints";

/** Map tool names to URLs evaluated by NemoClaw network policy. */
export function policyTargetUrlForTool(tool: string): string | undefined {
  switch (tool) {
    case "nvidia_nim_chat_completions":
    case "nemotron_react_loop":
    case "nemotron_inference_trusted":
      return NEMOTRON_CHAT_COMPLETIONS_URL;
    case "outbound_untrusted_domain":
      return UNTRUSTED_DEMO_URL;
    default:
      return undefined;
  }
}
