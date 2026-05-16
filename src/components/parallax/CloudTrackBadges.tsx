import { GlassPanel } from "@/components/ui/GlassPanel";

const BADGES = [
  {
    name: "NemoClaw",
    detail: "OpenClaw + OpenShell — policy-controlled agent deployment.",
    accent: "from-violet-400/80 to-fuchsia-500/80",
  },
  {
    name: "OpenShell",
    detail: "YAML enforcement over files, network, tools, and exports.",
    accent: "from-amber-300/80 to-orange-500/80",
  },
  {
    name: "OpenClaw",
    detail: "Multi-agent orchestration with visible plan and handoffs.",
    accent: "from-cyan-400/80 to-sky-500/80",
  },
  {
    name: "Nemotron",
    detail: "Reasoning inside trusted NVIDIA domains only.",
    accent: "from-indigo-400/80 to-violet-500/80",
  },
] as const;

export function CloudTrackBadges() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {BADGES.map((b) => (
        <GlassPanel key={b.name} className="p-4" glow="violet">
          <div
            className={`mb-3 inline-flex rounded-lg bg-gradient-to-r ${b.accent} px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-950`}
          >
            NemoClaw track
          </div>
          <p className="text-sm font-semibold text-white">{b.name}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{b.detail}</p>
        </GlassPanel>
      ))}
    </div>
  );
}
