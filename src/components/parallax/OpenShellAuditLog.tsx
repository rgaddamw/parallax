"use client";

import { LiveSandboxBadge } from "@/components/parallax/LiveSandboxBadge";

import { useRef } from "react";
import { useScrollContainerBottom } from "@/hooks/useScrollContainerBottom";
import type { OpenShellAuditEntry } from "@/lib/nemoclaw/openshellAudit";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";

const DECISION_STYLE: Record<
  OpenShellAuditEntry["decision"],
  { chip: string; bar: string }
> = {
  ALLOW: {
    chip: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
    bar: "bg-emerald-400",
  },
  REQUIRE_APPROVAL: {
    chip: "border-amber-400/35 bg-amber-500/10 text-amber-100",
    bar: "bg-amber-400",
  },
  BLOCK: {
    chip: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    bar: "bg-rose-500",
  },
};

function formatTs(ts: number) {
  const d = new Date(ts);
  const base = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = String(d.getMilliseconds()).padStart(3, "0").slice(0, 1);
  return `${base}.${ms}`;
}

export function OpenShellAuditLog({
  entries,
  highlightedRuleKey,
  onHighlightRule,
  onShowYamlPolicy,
}: {
  entries: OpenShellAuditEntry[];
  highlightedRuleKey: string | null;
  onHighlightRule: (ruleKey: string | null) => void;
  onShowYamlPolicy: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollContainerBottom(scrollRef, entries.length);

  const allowN = entries.filter((e) => e.decision === "ALLOW").length;
  const approvalN = entries.filter(
    (e) => e.decision === "REQUIRE_APPROVAL",
  ).length;
  const blockN = entries.filter((e) => e.decision === "BLOCK").length;
  const last = entries[entries.length - 1];

  return (
    <GlassPanel className="flex max-h-[min(72vh,680px)] flex-col" glow="cyan">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/90">
              OpenShell policy audit
            </p>
            <LiveSandboxBadge compact />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Timestamp · agent · action · resource · YAML rule · decision ·
            reason
          </p>
        </div>
        <NeonButton
          type="button"
          variant="ghost"
          className="!px-3 !py-1.5 text-[10px]"
          onClick={onShowYamlPolicy}
        >
          Show YAML policy
        </NeonButton>
      </div>

      <div className="grid grid-cols-3 gap-1 border-b border-white/10 px-2 py-2">
        {[
          { n: allowN, label: "ALLOW", color: "text-emerald-300" },
          { n: approvalN, label: "APPROVAL", color: "text-amber-200" },
          { n: blockN, label: "BLOCK", color: "text-rose-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-black/30 py-2 text-center">
            <p className={`font-mono text-sm ${s.color}`}>{s.n}</p>
            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2">
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-xs text-zinc-600">
            Run Secure Agent Run to populate the OpenShell-style audit log.
          </p>
        ) : (
          <table className="w-full border-collapse text-left text-[10px]">
            <thead className="sticky top-0 z-10 bg-zinc-950/95 text-[9px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Time</th>
                <th className="px-2 py-1.5 font-semibold">Agent</th>
                <th className="px-2 py-1.5 font-semibold">Action</th>
                <th className="hidden px-2 py-1.5 font-semibold sm:table-cell">
                  Resource
                </th>
                <th className="hidden px-2 py-1.5 font-semibold md:table-cell">
                  Rule
                </th>
                <th className="px-2 py-1.5 font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const style = DECISION_STYLE[e.decision];
                const active = highlightedRuleKey === e.policyRuleKey;
                return (
                  <tr
                    key={e.id}
                    className={`cursor-pointer border-b border-white/5 transition ${
                      active
                        ? "bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/40"
                        : "hover:bg-white/[0.03]"
                    }`}
                    onClick={() =>
                      onHighlightRule(active ? null : e.policyRuleKey)
                    }
                    title={e.reason}
                  >
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-zinc-500">
                      <span
                        className={`mr-1.5 inline-block h-4 w-0.5 rounded-full align-middle ${style.bar}`}
                      />
                      {formatTs(e.ts)}
                    </td>
                    <td className="px-2 py-2 text-zinc-300">{e.agentName}</td>
                    <td className="max-w-[120px] truncate px-2 py-2 font-mono text-zinc-200">
                      {e.requestedAction}
                    </td>
                    <td className="hidden max-w-[100px] truncate px-2 py-2 text-zinc-500 sm:table-cell">
                      {e.resourceDomain}
                    </td>
                    <td className="hidden max-w-[140px] truncate px-2 py-2 font-mono text-cyan-200/70 md:table-cell">
                      {e.policyRuleMatched}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${style.chip}`}
                      >
                        {e.decision}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {entries.length > 0 && (
          <p className="mt-2 px-2 text-[9px] text-zinc-600">
            Click a row to highlight the YAML rule · hover for full reason
          </p>
        )}

        {last && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 ${
              last.decision === "BLOCK"
                ? "border-rose-500/30 bg-rose-950/30"
                : last.decision === "REQUIRE_APPROVAL"
                  ? "border-amber-500/25 bg-amber-950/20"
                  : "border-emerald-500/20 bg-emerald-950/15"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Latest · {last.decision}
              {last.workflowContinues && last.decision === "BLOCK" && (
                <span className="ml-2 text-cyan-300/80">
                  · workflow continues
                </span>
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {last.reason}
            </p>
          </div>
        )}

      </div>
    </GlassPanel>
  );
}
