import Link from "next/link";
import { CloudRuntimePanel } from "@/components/parallax/CloudRuntimePanel";
import { LandingHeroActions } from "@/components/parallax/LandingHeroActions";
import { NemoclawTrackCriteria } from "@/components/parallax/NemoclawTrackCriteria";
import { CloudTrackBadges } from "@/components/parallax/CloudTrackBadges";
import { RealNemoclawRuntimeStatusPanel } from "@/components/parallax/RealNemoclawRuntimeStatusPanel";
import { NemoclawDualRuntimeExplainer } from "@/components/parallax/NemoclawDualRuntimeExplainer";
import { LiveSandboxBadge } from "@/components/parallax/LiveSandboxBadge";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 parallax-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.2),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(34,211,238,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 scanlines" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <LiveSandboxBadge />
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">
          Best Use of NVIDIA NemoClaw
        </span>
        <Link
          href="/nemoclaw"
          className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 transition hover:text-violet-300"
        >
          Integration guide →
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-20 pt-4 sm:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <LiveSandboxBadge />
            <div className="animate-floaty inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/90">
              Secure autonomous AI · policy + audit
            </div>
          </div>
          <h1 className="font-display mt-8 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Parallax
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            A secure autonomous career intelligence agent for highly sensitive
            personal data — live interview simulation and resume intelligence,
            orchestrated by Nemotron and governed by NemoClaw policy with
            enterprise-grade audit trails.
          </p>
          <LandingHeroActions />
        </div>

        <section className="relative z-10 mx-auto mt-12 w-full max-w-4xl">
          <CloudTrackBadges />
        </section>

        <section className="relative z-10 mx-auto mt-10 grid w-full max-w-2xl gap-6 lg:grid-cols-2">
          <RealNemoclawRuntimeStatusPanel />
          <CloudRuntimePanel orchestratorActive={false} />
        </section>

        <section className="relative z-10 mx-auto mt-6 w-full max-w-2xl">
          <NemoclawDualRuntimeExplainer compact />
        </section>

        <section className="relative z-10 mx-auto mt-10 w-full max-w-2xl">
          <NemoclawTrackCriteria />
        </section>

        <footer className="relative z-10 mx-auto mt-16 max-w-3xl text-center text-xs text-zinc-600">
          NemoClaw + OpenShell audit every tool · OpenClaw agents act within YAML
          boundaries · Nemotron optional inside trusted domains.
        </footer>
      </main>
    </div>
  );
}
