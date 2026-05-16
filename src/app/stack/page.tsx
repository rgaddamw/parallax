import Link from "next/link";
import { NvidiaStackSection } from "@/components/parallax/NvidiaStackSection";
import { CloudRuntimePanel } from "@/components/parallax/CloudRuntimePanel";
import { NemoClawPanel } from "@/components/parallax/NemoClawPanel";
import { StackPageActions } from "@/components/parallax/StackPageActions";
import { NemoclawTrackCriteria } from "@/components/parallax/NemoclawTrackCriteria";
import { RealNemoclawRuntimeStatusPanel } from "@/components/parallax/RealNemoclawRuntimeStatusPanel";
import { NemoclawDualRuntimeExplainer } from "@/components/parallax/NemoclawDualRuntimeExplainer";

export const metadata = {
  title: "NemoClaw architecture · Parallax",
};

export default function StackPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 parallax-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(34,211,238,0.1),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-12">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 transition hover:text-cyan-300"
          >
            ← Parallax home
          </Link>
          <div className="flex gap-4">
            <Link
              href="/nemoclaw"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400/80 transition hover:text-violet-300"
            >
              NemoClaw guide →
            </Link>
            <Link
              href="/app"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/80 transition hover:text-cyan-300"
            >
              Secure Agent Run →
            </Link>
          </div>
        </nav>

        <header className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-violet-300/80">
            NemoClaw bonus track
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
            Secure agent architecture
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            Policy-driven multi-agent interviews: OpenShell gates every sensitive
            action while OpenClaw agents still deliver real analysis and feedback.
          </p>
          <div className="mt-8">
            <StackPageActions />
          </div>
        </header>

        <NemoclawTrackCriteria compact />

        <RealNemoclawRuntimeStatusPanel />

        <NemoclawDualRuntimeExplainer compact />

        <div className="mx-auto max-w-md">
          <CloudRuntimePanel orchestratorActive />
        </div>

        <NvidiaStackSection showCta />

        <NemoClawPanel />
      </div>
    </div>
  );
}
