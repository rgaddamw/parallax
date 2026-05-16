"use client";

import Link from "next/link";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";

export function StackPageActions() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <RunSecureAgentRunButton />
        <Link
          href="/nemoclaw"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-violet-400/40 hover:text-violet-200"
        >
          NemoClaw instructions
        </Link>
      </div>
      <p className="max-w-md text-center text-[11px] text-zinc-500">
        Secure Agent Run · OpenShell audit log · YAML policy highlights · no API
        keys required
      </p>
    </div>
  );
}
