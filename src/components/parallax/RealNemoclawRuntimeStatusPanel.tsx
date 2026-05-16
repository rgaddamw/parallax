"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { LiveRuntimeSection } from "@/components/parallax/LiveRuntimeSection";
import { NemoClawRuntimeBadges } from "@/components/parallax/NemoClawRuntimeBadges";
import { useLiveSandboxOptional } from "@/context/LiveSandboxProvider";
import {
  DEMO_POLICY_FALLBACK_MESSAGE,
  offlineRuntimeFallback,
  type RealNemoclawRuntimeStatus,
  type RuntimeStepState,
} from "@/lib/nemoclaw/realRuntimeStatus";

const RUNTIME_API = "/api/nemoclaw/runtime";

const STATE_STYLE: Record<
  RuntimeStepState,
  { dot: string; chip: string; label: string }
> = {
  ok: {
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    label: "OK",
  },
  partial: {
    dot: "bg-amber-400",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    label: "PARTIAL",
  },
  blocked: {
    dot: "bg-rose-500",
    chip: "border-rose-500/35 bg-rose-500/10 text-rose-200",
    label: "BLOCKED",
  },
  pending: {
    dot: "bg-zinc-500",
    chip: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    label: "PENDING",
  },
  inactive: {
    dot: "bg-zinc-600",
    chip: "border-zinc-600/30 bg-zinc-600/10 text-zinc-500",
    label: "INACTIVE",
  },
};

const HEADLINE_STYLE: Record<
  RealNemoclawRuntimeStatus["connectionState"],
  string
> = {
  connected: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
  partial: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  unavailable: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400",
};

export function RealNemoclawRuntimeStatusPanel({
  className = "",
}: {
  className?: string;
}) {
  const globalCtx = useLiveSandboxOptional();
  const [status, setStatus] = useState<RealNemoclawRuntimeStatus | null>(
    globalCtx?.status ?? null,
  );
  const [loading, setLoading] = useState(globalCtx?.loading ?? true);
  const [apiError, setApiError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (globalCtx) await globalCtx.refresh();
      const res = await fetch(`${RUNTIME_API}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as RealNemoclawRuntimeStatus;
      setStatus(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Probe failed";
      setApiError(msg);
      if (!globalCtx?.status?.liveSandboxActive) {
        setStatus(offlineRuntimeFallback());
      }
    } finally {
      setLoading(false);
    }
  }, [globalCtx]);

  useEffect(() => {
    if (globalCtx) {
      setStatus(globalCtx.status);
      setLoading(globalCtx.loading);
    }
  }, [globalCtx, globalCtx?.status, globalCtx?.loading]);

  useEffect(() => {
    if (!globalCtx) void refresh();
  }, [globalCtx, refresh]);

  const connected =
    status?.liveSandboxActive === true ||
    status?.connectionState === "connected";

  return (
    <GlassPanel
      className={`p-4 sm:p-5 ${connected ? "connected-sandbox-panel" : ""} ${className}`}
      glow="amber"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-amber-200/90">
            Real NemoClaw Runtime
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            nemoclaw parallax-demo status · live health probe
          </p>
        </div>
        <NeonButton
          type="button"
          variant="ghost"
          className="!px-3 !py-1.5 !text-[10px]"
          disabled={loading}
          onClick={() => void refresh()}
        >
          {loading ? "Refreshing…" : "Refresh Runtime Status"}
        </NeonButton>
      </div>

      {loading && !status && (
        <p className="mt-4 text-xs text-zinc-600">Probing parallax-demo…</p>
      )}

      {status && (
        <>
          <div
            className={`mt-4 rounded-xl border px-4 py-3 ${
              HEADLINE_STYLE[status.connectionState]
            }`}
          >
            <p className="text-sm font-semibold">{status.connectionHeadline}</p>
            {status.connectedMessage && connected && (
              <p className="mt-2 text-xs leading-relaxed opacity-95">
                {status.connectedMessage}
              </p>
            )}
            {status.deploymentVerifiedMessage && connected && (
              <p className="mt-2 flex items-center gap-2 text-xs text-emerald-200/90">
                <span className="live-sandbox-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {status.deploymentVerifiedMessage}
              </p>
            )}
            {status.probedAt && (
              <p className="mt-1 text-[10px] opacity-70">
                Probed {new Date(status.probedAt).toLocaleString()} ·{" "}
                {status.snapshotLabel}
              </p>
            )}
          </div>

          {connected && status.runtimeBadges && status.runtimeBadges.length > 0 && (
            <NemoClawRuntimeBadges badges={status.runtimeBadges} className="mt-3" />
          )}

          {status.statusLabels && connected && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
              <StatusChip label="Sandbox" value={status.statusLabels.sandbox} />
              <StatusChip label="Gateway" value={status.statusLabels.gateway} />
              <StatusChip label="Policy" value={status.statusLabels.policy} />
              <StatusChip
                label="Inference"
                value={status.statusLabels.inference}
                mono
              />
            </div>
          )}

          {status.demoPolicyFallbackActive && !connected && (
            <p className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/90">
              {status.demoPolicyFallbackMessage ?? DEMO_POLICY_FALLBACK_MESSAGE}
            </p>
          )}

          {apiError && (
            <p className="mt-2 text-xs text-rose-300/90">
              API error: {apiError}
            </p>
          )}

          {status.liveRuntime && connected && (
            <LiveRuntimeSection live={status.liveRuntime} />
          )}

          <ul className="mt-4 space-y-2.5">
            {status.steps.map((step) => {
              const style = STATE_STYLE[step.state];
              return (
                <li
                  key={step.id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    connected
                      ? "border-emerald-500/15 bg-emerald-950/10"
                      : step.state === "blocked"
                        ? "border-rose-500/25 bg-rose-950/20"
                        : "border-white/8 bg-black/25"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-zinc-100">
                          {step.label}
                        </p>
                        {step.statusLabel && (
                          <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-200">
                            {step.statusLabel}
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${style.chip}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {!connected && status.lastError && (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/25 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200/90">
                Probe detail
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
                {status.lastError}
              </p>
            </div>
          )}

          {connected && (
            <p className="mt-4 border-t border-emerald-500/15 pt-3 text-xs leading-relaxed text-emerald-100/80">
              {status.dualRuntimeCopy}
            </p>
          )}
        </>
      )}
    </GlassPanel>
  );
}

function StatusChip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2 py-1.5">
      <p className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p
        className={`mt-0.5 truncate text-[10px] font-bold text-emerald-200 ${mono ? "font-mono font-normal" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
