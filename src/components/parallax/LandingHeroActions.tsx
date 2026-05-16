"use client";

import Link from "next/link";
import { NeonLink } from "@/components/ui/NeonLink";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";

export function LandingHeroActions() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
      <NeonLink href="/app">Start interview</NeonLink>
      <Link
        href="/nemoclaw"
        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-200 transition hover:border-violet-400/50 hover:text-violet-100"
      >
        NemoClaw instructions
      </Link>
      <RunSecureAgentRunButton
        variant="ghost"
        className="!rounded-full !border !border-white/15 !bg-white/5 !px-6 !py-3 !text-sm"
        label="Policy demo"
      />
    </div>
  );
}
