"use client";

import { NEMOCLAW_JUDGE_SUMMARY } from "@/lib/secureAgentRun/scenario";
import { GlassPanel } from "@/components/ui/GlassPanel";
import Link from "next/link";

export function NemoclawJudgeSummaryCard({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <GlassPanel className="border border-violet-500/25" glow="violet">
      <div className="px-5 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-200/90">
          Judge summary · NemoClaw value
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-200">
          {NEMOCLAW_JUDGE_SUMMARY}
        </p>
        <ul className="mt-5 space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            Security by design — YAML before every tool
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            Autonomous action within strict bounds
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            Audit-ready OpenShell log with rule attribution
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400">→</span>
            NemoClaw-specific value over plain OpenClaw
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/nemoclaw"
            className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90 hover:text-cyan-200"
          >
            NemoClaw instructions →
          </Link>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
