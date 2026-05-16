import type { InterviewerPersonality } from "@/types/interview";
import { PERSONALITIES } from "@/types/interview";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function PersonalityPicker({
  value,
  onChange,
}: {
  value: InterviewerPersonality | null;
  onChange: (p: InterviewerPersonality) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PERSONALITIES.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className="text-left"
          >
            <GlassPanel
              glow={active ? "cyan" : "violet"}
              className={`p-4 transition-all ${
                active
                  ? "border-cyan-400/40 bg-cyan-500/[0.07]"
                  : "opacity-90 hover:opacity-100"
              }`}
            >
              <p className="text-sm font-semibold text-zinc-50">{p.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {p.blurb}
              </p>
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}
