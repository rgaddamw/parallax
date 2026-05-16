import { GlassPanel } from "@/components/ui/GlassPanel";

const CRITERIA = [
  "Security by design — YAML blocks unsafe file, network, and profiling actions",
  "Autonomous action within bounds — agents still analyze, reason, and deliver feedback",
  "Clear policy configuration — view and highlight rules in nemoclaw.default.yaml",
  "Real-world use case — sensitive hiring data (resume, voice, behavioral signals)",
  "NemoClaw-specific value — OpenClaw alone cannot prove audit-ready guardrails",
] as const;

export function NemoclawTrackCriteria({ compact = false }: { compact?: boolean }) {
  return (
    <GlassPanel className={compact ? "p-5" : "p-6"} glow="violet">
      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-violet-200/90">
        What judges are looking for
      </p>
      <ul className={`mt-4 space-y-2.5 ${compact ? "text-sm" : ""}`}>
        {CRITERIA.map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
            <span className="mt-0.5 text-emerald-400" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
