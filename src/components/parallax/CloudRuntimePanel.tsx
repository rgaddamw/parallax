"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveSandboxBadge } from "@/components/parallax/LiveSandboxBadge";
import { NemoClawRuntimeBadges } from "@/components/parallax/NemoClawRuntimeBadges";
import { useLiveSandboxOptional } from "@/context/LiveSandboxProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";

type PolicyStatus = {
  policyName?: string;
  policyVersion?: string;
  exportBehavioralBlocked?: boolean;
  outboundUntrustedBlocked?: boolean;
  chatCompletionsAllowed?: boolean;
};

type NemotronStatus = {
  configured: boolean;
  model?: string;
  nemoclaw?: PolicyStatus;
};

const LOOP = ["Policy", "Plan", "Act", "Audit"] as const;

function StatusDot({ ok, pulse }: { ok: boolean; pulse?: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? "bg-emerald-400" : "bg-amber-400"
      } ${pulse && ok ? "animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : ""}`}
    />
  );
}

/** NemoClaw-first runtime status: OpenShell policy, orchestrator, sandboxed Nemotron. */
export function CloudRuntimePanel({
  orchestratorActive,
  loopPhase,
}: {
  orchestratorActive: boolean;
  /** 0–3 highlights Policy→Plan→Act→Audit during a turn */
  loopPhase?: number;
}) {
  const [status, setStatus] = useState<NemotronStatus | null>(null);

  useEffect(() => {
    void fetch("/api/nemotron/status")
      .then((r) => r.json())
      .then((d: NemotronStatus) => setStatus(d))
      .catch(() => setStatus({ configured: false }));
  }, []);

  const liveCtx = useLiveSandboxOptional();
  const liveSandbox = liveCtx?.liveSandboxActive === true;

  const [animPhase, setAnimPhase] = useState(0);
  useEffect(() => {
    if (!liveSandbox) return;
    const id = window.setInterval(
      () => setAnimPhase((p) => (p + 1) % LOOP.length),
      1100,
    );
    return () => window.clearInterval(id);
  }, [liveSandbox]);

  const nc = status?.nemoclaw;
  const policyOk = liveSandbox || Boolean(
    nc?.exportBehavioralBlocked && nc?.outboundUntrustedBlocked,
  );
  const nemotronOk =
    liveSandbox ||
    liveCtx?.status?.nemotronActive ||
    Boolean(status?.configured);
  const phase = liveSandbox
    ? animPhase
    : loopPhase ?? (orchestratorActive ? 2 : 0);

  return (
    <GlassPanel className="p-4" glow="violet">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-violet-200/90">
              NemoClaw · OpenShell runtime
            </p>
            <LiveSandboxBadge compact />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Policy before every tool — files, network, exports, behavioral storage.
          </p>
        </div>
        <Link
          href="/nemoclaw"
          className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-cyan-400/80 hover:text-cyan-300"
        >
          Docs →
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        <li className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
          <StatusDot ok={policyOk} pulse={policyOk} />
          <div>
            <p className="text-xs font-semibold text-zinc-100">
              OpenShell YAML policy
            </p>
            <p className="mt-0.5 text-[11px] text-violet-200/90">
              {nc?.policyName
                ? `${nc.policyName} · v${nc.policyVersion ?? "?"}`
                : "Loading policy bundle…"}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              policies/nemoclaw.default.yaml
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
          <StatusDot
            ok={liveSandbox || orchestratorActive}
            pulse={liveSandbox || orchestratorActive}
          />
          <div>
            <p className="text-xs font-semibold text-zinc-100">
              OpenClaw multi-agent DAG
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {liveSandbox
                ? "Live sandbox · agents operating inside NemoClaw"
                : orchestratorActive
                  ? "Agents acting within policy bounds"
                  : "Standby · run Secure Agent Run"}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              POST /api/agents/turn
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
          <StatusDot ok={nemotronOk} pulse={nemotronOk} />
          <div>
            <p className="text-xs font-semibold text-zinc-100">
              Nemotron (trusted domains only)
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {nemotronOk ? (
                <>
                  Sandboxed inference ·{" "}
                  <code className="text-cyan-300/90">integrate.api.nvidia.com</code>
                </>
              ) : (
                <span className="text-zinc-500">
                  Optional — policy demo works offline
                </span>
              )}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              {liveCtx?.status?.nemotronModel ?? status?.model ?? "—"}
            </p>
          </div>
        </li>
      </ul>

      <div
        className={`mt-4 rounded-xl border px-3 py-3 ${
          liveSandbox
            ? "secure-agent-loop-live border-emerald-500/25 bg-emerald-500/5"
            : "border-violet-500/20 bg-violet-500/5"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/80">
          Secure agent loop
          {liveSandbox && (
            <span className="ml-2 text-emerald-300/90">· live</span>
          )}
        </p>
        {liveSandbox && liveCtx?.status?.runtimeBadges && (
          <NemoClawRuntimeBadges
            badges={liveCtx.status.runtimeBadges}
            className="mt-2"
          />
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {LOOP.map((label, i) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                  i === phase
                    ? liveSandbox
                      ? "border border-emerald-400/50 bg-emerald-500/25 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
                      : "border border-violet-400/50 bg-violet-500/20 text-violet-100"
                    : i < phase
                      ? "text-emerald-400/80"
                      : "text-zinc-600"
                }`}
              >
                {label}
              </span>
              {i < LOOP.length - 1 && (
                <span className="text-zinc-700">→</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
