"use client";

import type { LiveRuntimeDetails } from "@/lib/nemoclaw/realRuntimeStatus";

export function LiveRuntimeSection({ live }: { live: LiveRuntimeDetails }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/90">
        Live runtime · OpenShell sandbox
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Metric label="Sandbox" value={live.sandboxName} status={live.sandboxStatus} />
        <Metric label="Gateway" value={live.gatewayHealth} status={live.openshellGateway} />
        <Metric label="Policy" value="YAML + sandbox policy" status={live.policyRuntime} />
        <Metric label="OpenClaw" value={live.openclawVersion ? `v${live.openclawVersion}` : "—"} />
        <Metric label="OpenShell" value={live.openshellVersion ? `v${live.openshellVersion}` : "—"} />
        <Metric
          label="Inference"
          value={live.inferenceModel}
          className="sm:col-span-2"
        />
      </div>

      <div className="space-y-2 border-t border-emerald-500/15 pt-3">
        <ListBlock title="Policy versions loaded">
          {live.policyVersions.map((p) => (
            <li key={`${p.name}-${p.version}`}>
              <span className="font-medium text-zinc-200">{p.name}</span>
              <span className="text-zinc-500"> · v{p.version}</span>
              {p.revision ? (
                <span className="text-zinc-600"> · rev {p.revision}</span>
              ) : null}
            </li>
          ))}
        </ListBlock>

        <ListBlock title="Active egress controls">
          {live.activeEgressControls.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ListBlock>

        <ListBlock title="Trusted domains">
          {live.trustedDomains.map((d) => (
            <li key={d} className="font-mono text-[10px]">
              {d}
            </li>
          ))}
        </ListBlock>

        <p className="text-[11px] leading-relaxed text-zinc-500">
          <span className="font-semibold text-zinc-400">Sandbox isolation: </span>
          {live.sandboxIsolation}
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  status,
  className = "",
}: {
  label: string;
  value: string;
  status?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-white/8 bg-black/30 px-3 py-2 ${className}`}
    >
      <p className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-zinc-100">{value}</p>
      {status && (
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400/90">
          {status}
        </p>
      )}
    </div>
  );
}

function ListBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <ul className="mt-1 space-y-0.5 text-[11px] text-zinc-400">{children}</ul>
    </div>
  );
}
