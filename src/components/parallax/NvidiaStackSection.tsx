import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonLink } from "@/components/ui/NeonLink";

const STACK = [
  {
    id: "nemoclaw",
    name: "NemoClaw + OpenShell",
    role: "Policy sandbox",
    tagline: "Security by design",
    body: "YAML policies gate every file read, export, behavioral store, and outbound URL. ALLOW, REQUIRE_APPROVAL, and BLOCK decisions land in an OpenShell-style audit log judges can replay.",
    accent: "from-violet-400/90 to-fuchsia-500/90",
    glow: "violet" as const,
    endpoint: "GET /api/nemoclaw/policy",
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    role: "Autonomous orchestration",
    tagline: "Agents that act — within bounds",
    body: "Multi-agent interview DAG: perception, behavioral, memory, decision, interviewer, replay. The orchestrator plans tools; NemoClaw decides whether each tool may run.",
    accent: "from-cyan-400/90 to-sky-500/90",
    glow: "cyan" as const,
    endpoint: "POST /api/agents/turn",
  },
  {
    id: "nemotron",
    name: "Nemotron (in sandbox)",
    role: "Reasoning core",
    tagline: "Trusted NVIDIA domains only",
    body: "ReAct reasoning runs only when policy allows nvidia_nim_chat_completions to integrate.api.nvidia.com. Untrusted outbound calls are blocked — autonomy without open network.",
    accent: "from-sky-400/90 to-indigo-500/90",
    glow: "cyan" as const,
    endpoint: "POST /api/nemotron/chat",
  },
  {
    id: "deploy",
    name: "Brev · DGX Spark",
    role: "Optional deploy target",
    tagline: "Same bundle, cloud or local",
    body: "Parallax aligns with the NemoClaw reference stack: curl the installer locally, or use Brev Launchable with nvidia/nemotron-3-super-120b-a12b for cloud sandboxes.",
    accent: "from-emerald-400/90 to-teal-500/90",
    glow: "amber" as const,
    endpoint: "/nemoclaw",
  },
] as const;

export function NvidiaStackSection({
  compact = false,
  showCta = true,
}: {
  compact?: boolean;
  showCta?: boolean;
}) {
  return (
    <section
      id="nemoclaw-stack"
      className={`relative ${compact ? "space-y-6" : "space-y-10"}`}
    >
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-violet-300/80">
          Best Use of NVIDIA NemoClaw
        </p>
        <h2
          className={`font-display mt-2 font-semibold text-white ${
            compact ? "text-2xl" : "text-3xl sm:text-4xl"
          }`}
        >
          Secure multi-agent interviews
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          Parallax is a real-world use case: hiring data is sensitive. OpenClaw
          gives agents autonomy; NemoClaw + OpenShell prove every action is
          policy-checked and audit-ready.
        </p>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-32 hidden h-px w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent lg:block" />

      <div className="grid gap-4 sm:grid-cols-2">
        {STACK.map((layer, i) => (
          <GlassPanel
            key={layer.id}
            className={`group p-6 transition hover:border-white/20 ${
              compact ? "p-5" : ""
            }`}
            glow={layer.glow}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex rounded-lg bg-gradient-to-r ${layer.accent} px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-950`}
              >
                {layer.role}
              </span>
              <span className="font-mono text-[10px] text-zinc-600">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-display mt-4 text-xl font-semibold text-white">
              {layer.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-zinc-400">
              {layer.tagline}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              {layer.body}
            </p>
            <p className="mt-4 font-mono text-[10px] text-violet-400/70">
              {layer.endpoint}
            </p>
          </GlassPanel>
        ))}
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/5 px-6 py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          Why NemoClaw, not just OpenClaw?
        </p>
        <p className="font-display mt-3 text-lg text-zinc-200 sm:text-xl">
          Policy → plan tools → act → audit — blocks do not halt useful work
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-zinc-500">
          Resumes, recordings, behavioral profiles, and exports are exactly the
          actions enterprises fear. Parallax shows guardrails working in real time.
        </p>
        {showCta && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <NeonLink href="/app">Run Secure Agent Run</NeonLink>
            <Link
              href="/nemoclaw"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:text-violet-300"
            >
              Integration guide →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
