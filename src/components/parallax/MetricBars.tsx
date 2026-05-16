import type { LiveMetrics } from "@/types/interview";
import { GlassPanel } from "@/components/ui/GlassPanel";

function Bar({
  label,
  value,
  suffix = "",
  invert,
}: {
  label: string;
  value: number;
  suffix?: string;
  invert?: boolean;
}) {
  const pct = invert ? 100 - value : value;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-cyan-200/90">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
        />
      </div>
    </div>
  );
}

function FillerBar({ count }: { count: number }) {
  const stress = Math.min(100, count * 22);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Filler words</span>
        <span className="font-mono text-amber-200/90">{count} hits</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(6, stress)}%` }}
        />
      </div>
    </div>
  );
}

export function MetricBars({ metrics }: { metrics: LiveMetrics }) {
  return (
    <GlassPanel className="p-5" glow="violet">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        Live signal
      </p>
      <div className="grid gap-4">
        <Bar label="Confidence" value={metrics.confidence} />
        <Bar label="Clarity" value={metrics.clarity} />
        <FillerBar count={metrics.fillerWords} />
        <Bar label="Pacing" value={metrics.pacing} />
        <Bar label="Hesitation" value={metrics.hesitation} invert />
      </div>
    </GlassPanel>
  );
}
