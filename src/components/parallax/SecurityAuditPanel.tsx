"use client";

import { useRef } from "react";
import { useScrollContainerBottom } from "@/hooks/useScrollContainerBottom";
import Link from "next/link";
import type { SecurityAuditEntry } from "@/lib/nemoclaw/types";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { UNSAFE_ACTION_INTERCEPTED } from "@/lib/nemoclaw/engine";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import { useLiveSandboxOptional } from "@/context/LiveSandboxProvider";

const KIND_STYLE: Record<
  SecurityAuditEntry["kind"],
  { bar: string; label: string }
> = {
  tool_call: { bar: "bg-sky-400", label: "text-sky-200/90" },
  policy_evaluation: { bar: "bg-violet-400", label: "text-violet-200/90" },
  approved: { bar: "bg-emerald-400", label: "text-emerald-200/90" },
  blocked: { bar: "bg-rose-500", label: "text-rose-200/90" },
  pending_approval: { bar: "bg-amber-400", label: "text-amber-200/90" },
  access_log: { bar: "bg-zinc-400", label: "text-zinc-300/90" },
};

const VERDICT_CHIP: Record<string, string> = {
  allow: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  require_approval: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  block: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

export function SecurityAuditPanel({
  entries,
  pendingTools,
  onApprove,
}: {
  entries: SecurityAuditEntry[];
  pendingTools: string[];
  onApprove: (tool: string) => void;
}) {
  const liveCtx = useLiveSandboxOptional();
  const liveConnected = liveCtx?.liveSandboxActive === true;
  const sandboxName =
    liveCtx?.status?.liveRuntime?.sandboxName ??
    liveCtx?.status?.defaultSandbox;

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollContainerBottom(scrollRef, entries.length);

  const blocked = entries.filter((e) => e.kind === "blocked");
  const approved = entries.filter(
    (e) => e.kind === "approved" || e.verdict === "allow",
  );
  const evaluations = entries.filter((e) => e.kind === "policy_evaluation");
  const toolCalls = entries.filter((e) => e.kind === "tool_call");
  const lastBlocked = [...entries].reverse().find((e) => e.kind === "blocked");

  return (
    <GlassPanel
      className={`flex max-h-[min(72vh,640px)] flex-col ${liveConnected ? "connected-sandbox-panel" : ""}`}
      glow="amber"
    >
      <div className="border-b border-white/10 px-4 py-3">
        {liveConnected && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2">
            <span className="live-sandbox-pulse h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                Connected Sandbox
              </p>
              <p className="text-[10px] text-emerald-200/70">
                {sandboxName
                  ? `Live policy enforcement · ${sandboxName}`
                  : "Live NemoClaw/OpenShell sandbox"}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-amber-200/80">
              NemoClaw security audit
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Live policy evaluations, tool calls, access logs, and enforcement
              outcomes.
            </p>
          </div>
          <Link
            href="/nemoclaw"
            className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400/80 hover:text-cyan-300"
          >
            NemoClaw docs →
          </Link>
        </div>
        <div className="mt-3">
          <RunSecureAgentRunButton
            variant="ghost"
            className="!px-2 !py-1 !text-[10px]"
            label="Secure Agent Run"
          />
        </div>
      </div>
      <AuditStats
        toolCalls={toolCalls.length}
        evaluations={evaluations.length}
        approved={approved.length}
        denied={blocked.length}
      />
      {pendingTools.length > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/90">
            Requires approval
          </p>
          <ul className="mt-2 space-y-2">
            {pendingTools.map((tool) => (
              <li
                key={tool}
                className="flex items-center justify-between gap-2 text-xs text-zinc-300"
              >
                <span className="font-mono">{tool}</span>
                <NeonButton
                  type="button"
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => onApprove(tool)}
                >
                  Approve once
                </NeonButton>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
      >
        {entries.length === 0 && (
          <p className="px-1 text-xs text-zinc-600">
            Security audit empty. Submit an answer to evaluate tool calls against
            NemoClaw policy.
          </p>
        )}
        {[...entries].reverse().map((e) => {
          const style = KIND_STYLE[e.kind];
          return (
            <div
              key={e.id}
              className={`rounded-lg border px-3 py-2.5 ${
                e.kind === "blocked"
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-white/5 bg-black/25"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-8 w-0.5 shrink-0 rounded-full ${style.bar}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase ${style.label}`}
                    >
                      {e.kind.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${VERDICT_CHIP[e.verdict] ?? ""}`}
                    >
                      {e.verdict.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] text-zinc-600">
                      {e.domain.replace(/_/g, " ")}
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-zinc-600">
                      {new Date(e.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-100">
                    {e.tool}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                    {e.message}
                  </p>
                  {e.detail && (
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      {e.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {lastBlocked && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-rose-200">
              {UNSAFE_ACTION_INTERCEPTED}
            </p>
            <p className="mt-1 text-[10px] text-rose-200/70">{lastBlocked.tool}</p>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

function AuditStats({
  toolCalls,
  evaluations,
  approved,
  denied,
}: {
  toolCalls: number;
  evaluations: number;
  approved: number;
  denied: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 border-b border-white/10 px-2 py-2">
      {[
        { n: toolCalls, label: "Tools" },
        { n: evaluations, label: "Evals" },
        { n: approved, label: "OK" },
        { n: denied, label: "Denied" },
      ].map((s) => (
        <div key={s.label} className="rounded-lg bg-black/30 py-2 text-center">
          <p className="font-mono text-sm text-zinc-100">{s.n}</p>
          <p className="text-[9px] uppercase tracking-wider text-zinc-600">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
