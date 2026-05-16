"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";

function lineMatchesRule(line: string, ruleKey: string | null): boolean {
  if (!ruleKey) return false;
  const parts = ruleKey.split(".");
  const tier = parts[parts.length - 1];
  const domain = parts[1]?.replace(/_/g, " ");
  if (parts[0] === "domains" && line.includes(domain ?? "")) {
    if (line.includes(tier)) return true;
    if (line.trim().startsWith("- ")) {
      return tier === "allow" || tier === "block" || tier === "require_approval";
    }
  }
  if (ruleKey.includes("trusted") && line.includes("trusted_")) return true;
  return false;
}

export function YamlPolicyViewer({
  open,
  onClose,
  highlightRuleKey,
}: {
  open: boolean;
  onClose: () => void;
  highlightRuleKey: string | null;
}) {
  const [yaml, setYaml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/nemoclaw/yaml")
      .then((r) => r.text())
      .then(setYaml)
      .catch(() => setYaml("# Failed to load policy YAML"))
      .finally(() => setLoading(false));
  }, [open]);

  const lines = useMemo(() => yaml.split("\n"), [yaml]);

  const copyYaml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(yaml);
    } catch {
      /* ignore */
    }
  }, [yaml]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="NemoClaw policy YAML"
    >
      <GlassPanel className="flex max-h-[85vh] w-full max-w-3xl flex-col" glow="violet">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-violet-200/90">
              policies/nemoclaw.default.yaml
            </p>
            {highlightRuleKey && (
              <p className="mt-1 font-mono text-[10px] text-cyan-300/90">
                Highlight: {highlightRuleKey}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <NeonButton
              type="button"
              variant="ghost"
              className="!px-2 !py-1 text-[10px]"
              onClick={() => void copyYaml()}
            >
              Copy YAML
            </NeonButton>
            <NeonButton
              type="button"
              variant="ghost"
              className="!px-2 !py-1 text-[10px]"
              onClick={onClose}
            >
              Close
            </NeonButton>
          </div>
        </div>
        <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
          {loading ? (
            <span className="text-zinc-600">Loading policy…</span>
          ) : (
            lines.map((line, i) => {
              const hit = lineMatchesRule(line, highlightRuleKey);
              return (
                <div
                  key={`${i}-${line.slice(0, 8)}`}
                  className={
                    hit
                      ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/30"
                      : undefined
                  }
                >
                  <span className="mr-3 inline-block w-8 select-none text-right text-zinc-600">
                    {i + 1}
                  </span>
                  {line || " "}
                </div>
              );
            })
          )}
        </pre>
      </GlassPanel>
    </div>
  );
}
