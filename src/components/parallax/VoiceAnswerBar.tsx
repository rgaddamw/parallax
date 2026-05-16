"use client";

import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function VoiceAnswerBar({
  isListening,
  disabled,
  speechSupported,
  onToggle,
}: {
  isListening: boolean;
  disabled: boolean;
  speechSupported: boolean;
  onToggle: () => void;
}) {
  return (
    <GlassPanel
      className={`flex flex-col gap-3 border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
        isListening
          ? "border-cyan-400/40 bg-cyan-500/10"
          : "border-white/10 bg-black/30"
      }`}
      glow={isListening ? "cyan" : undefined}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg ${
            isListening
              ? "border-cyan-400/50 bg-cyan-500/20 animate-pulse"
              : "border-white/15 bg-white/5"
          }`}
          aria-hidden
        >
          MIC
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Voice answer
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {speechSupported
              ? isListening
                ? "Listening… speak clearly — confidence meter updates from your words"
                : "Use your microphone — transcript fills the answer box"
              : "Microphone not supported in this browser — type instead"}
          </p>
        </div>
      </div>
      <NeonButton
        type="button"
        variant={isListening ? "primary" : "ghost"}
        disabled={disabled || !speechSupported}
        onClick={onToggle}
        className="shrink-0"
      >
        {isListening ? "Stop recording" : "Start microphone"}
      </NeonButton>
    </GlassPanel>
  );
}
