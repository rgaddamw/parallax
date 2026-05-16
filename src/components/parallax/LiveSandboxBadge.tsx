"use client";

import { useLiveSandboxOptional } from "@/context/LiveSandboxProvider";

export function LiveSandboxBadge({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const ctx = useLiveSandboxOptional();
  if (!ctx?.liveSandboxActive) return null;

  const name = ctx.status?.liveRuntime?.sandboxName ?? ctx.status?.defaultSandbox;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200 ${className}`}
      title={
        name
          ? `Connected to live sandbox: ${name}`
          : "Live NemoClaw sandbox connected"
      }
    >
      <span className="live-sandbox-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {compact ? "Live" : "Live Sandbox"}
      {!compact && name ? (
        <span className="font-mono font-normal normal-case tracking-normal text-emerald-300/80">
          · {name}
        </span>
      ) : null}
    </span>
  );
}
