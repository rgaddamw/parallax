import { GlassPanel } from "@/components/ui/GlassPanel";

export function DualRealityPanels({
  youSaid,
  theyHeard,
}: {
  youSaid: string;
  theyHeard: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassPanel className="p-6" glow="cyan">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/80">
          What you said
        </p>
        <p className="min-h-[120px] whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
          {youSaid.trim() || (
            <span className="text-zinc-600">
              Your words appear here in real time—unfiltered intent.
            </span>
          )}
        </p>
      </GlassPanel>
      <GlassPanel className="p-6" glow="violet">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-fuchsia-300/80">
          What they heard
        </p>
        <p className="min-h-[120px] whitespace-pre-wrap text-sm leading-relaxed text-zinc-200/95">
          {theyHeard.trim() || (
            <span className="text-zinc-600">
              Parallax models interviewer perception—bias, compression, and
              inference layered on your signal.
            </span>
          )}
        </p>
      </GlassPanel>
    </div>
  );
}
