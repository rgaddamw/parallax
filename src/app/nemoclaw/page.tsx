import Link from "next/link";
import { NemoclawInstructions } from "@/components/parallax/NemoclawInstructions";

export const metadata = {
  title: "NemoClaw Integration Instructions · Parallax",
};

export default function NemoclawPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 parallax-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(167,139,250,0.16),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-10">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 transition hover:text-cyan-300"
          >
            ← Parallax home
          </Link>
          <Link
            href="/app"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/80 transition hover:text-cyan-300"
          >
            Start interview
          </Link>
        </nav>

        <NemoclawInstructions />
      </div>
    </div>
  );
}
