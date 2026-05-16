"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLiveSandboxOptional } from "@/context/LiveSandboxProvider";
import {
  DUAL_RUNTIME_COPY,
  DUAL_RUNTIME_COPY_CONNECTED,
  INTEGRATION_NOTE,
} from "@/lib/nemoclaw/realRuntimeStatus";

export function NemoclawDualRuntimeExplainer({ compact = false }: { compact?: boolean }) {
  const live = useLiveSandboxOptional();
  const connected = live?.liveSandboxActive === true;

  return (
    <GlassPanel
      className={`border border-violet-500/20 ${compact ? "px-4 py-4" : "px-5 py-5"}`}
      glow="violet"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-200/90">
        {connected ? "Live sandbox architecture" : "Dual runtime architecture"}
      </p>
      <p
        className={`mt-3 leading-relaxed text-zinc-300 ${compact ? "text-sm" : "text-base"}`}
      >
        {connected
          ? live?.status?.dualRuntimeCopy ?? DUAL_RUNTIME_COPY_CONNECTED
          : DUAL_RUNTIME_COPY}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        {connected ? live?.status?.integrationNote ?? INTEGRATION_NOTE : INTEGRATION_NOTE}
      </p>
    </GlassPanel>
  );
}
