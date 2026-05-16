"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import type { NemoClawPolicyBundle, PolicyDomain } from "@/lib/nemoclaw/types";

const DOMAIN_LABEL: Record<PolicyDomain, string> = {
  file_access: "File access",
  recording_access: "Recording access",
  export_permissions: "Export permissions",
  network_api: "Network / API",
  behavioral_storage: "Behavioral storage",
};

const TIER_STYLE = {
  allow: {
    tone: "text-emerald-300/90",
    border: "border-emerald-500/25",
    title: "Allow",
  },
  require_approval: {
    tone: "text-amber-200/90",
    border: "border-amber-400/25",
    title: "Require approval",
  },
  block: {
    tone: "text-rose-300/90",
    border: "border-rose-500/25",
    title: "Block",
  },
} as const;

export function NemoClawPanel() {
  const [policy, setPolicy] = useState<NemoClawPolicyBundle | null>(null);

  useEffect(() => {
    void fetch("/api/nemoclaw/policy")
      .then((r) => r.json())
      .then((d: { policy: NemoClawPolicyBundle }) => setPolicy(d.policy))
      .catch(() => null);
  }, []);

  return (
    <GlassPanel className="p-6" glow="amber">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200/80">
            NemoClaw policy manifest
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">
            YAML-governed autonomous boundaries
          </h3>
          {policy && (
            <p className="mt-1 font-mono text-[10px] text-zinc-500">
              {policy.name} · v{policy.version} · policies/nemoclaw.default.yaml
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-100">
            Enforced at runtime
          </span>
          <Link
            href="/nemoclaw"
            className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80 hover:text-cyan-300"
          >
            Instructions →
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <RunSecureAgentRunButton
          variant="ghost"
          className="!text-[10px]"
          label="Run secure demo"
        />
      </div>

      {policy ? (
        <div className="mt-6 space-y-4">
          {(Object.keys(DOMAIN_LABEL) as PolicyDomain[]).map((domain) => {
            const rules = policy.domains[domain];
            return (
              <div
                key={domain}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-semibold text-zinc-200">
                  {DOMAIN_LABEL[domain]}
                </p>
                {rules.description && (
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {rules.description}
                  </p>
                )}
                <PolicyTierGrid rules={rules} />
              </div>
            );
          })}
          <p className="text-center text-[11px] text-zinc-500">
            Trusted domains: {policy.trusted_domains.join(", ")}
          </p>
          {policy.trusted_urls && policy.trusted_urls.length > 0 && (
            <p className="text-center text-[11px] text-zinc-600">
              Trusted URLs: {policy.trusted_urls.join(" · ")}
            </p>
          )}
          <p className="text-center text-xs font-medium text-rose-300/90">
            {policy.deny_message}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">Loading policy bundle...</p>
      )}
    </GlassPanel>
  );
}

function PolicyTierGrid({
  rules,
}: {
  rules: NemoClawPolicyBundle["domains"][PolicyDomain];
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {(
        [
          ["allow", rules.allow],
          ["require_approval", rules.require_approval],
          ["block", rules.block],
        ] as const
      ).map(([tier, items]) => {
        const s = TIER_STYLE[tier];
        return (
          <div key={tier} className={`rounded-lg border ${s.border} p-3`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${s.tone}`}>
              {s.title}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
              {items.length === 0 && <li className="italic text-zinc-600">—</li>}
              {items.map((item) => (
                <li key={item} className="font-mono">
                  {item.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
