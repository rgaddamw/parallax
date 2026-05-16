"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { RunSecureAgentRunButton } from "@/components/parallax/RunSecureAgentRunButton";
import { NemoclawJudgeSummaryCard } from "@/components/parallax/NemoclawJudgeSummaryCard";
import { YamlPolicyViewer } from "@/components/parallax/YamlPolicyViewer";
import { RealNemoclawRuntimeStatusPanel } from "@/components/parallax/RealNemoclawRuntimeStatusPanel";
import { NemoclawDualRuntimeExplainer } from "@/components/parallax/NemoclawDualRuntimeExplainer";

export function NemoclawInstructions() {
  const [yaml, setYaml] = useState("");
  const [yamlOpen, setYamlOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/nemoclaw/yaml")
      .then((r) => r.text())
      .then(setYaml)
      .catch(() => setYaml(""));
  }, []);

  const copyPolicy = useCallback(async () => {
    const text =
      yaml ||
      (await fetch("/api/nemoclaw/yaml").then((r) => r.text()).catch(() => ""));
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [yaml]);

  return (
    <>
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-violet-300/80">
          NemoClaw · OpenShell policy
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
          NemoClaw Integration Instructions
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Official track: Best Use of NVIDIA NemoClaw. Parallax demonstrates
          secure multi-agent automation on sensitive hiring data — policy,
          sandboxing, and audit logs first; Nemotron and Brev as optional deploy
          paths.
        </p>
      </header>

      <NemoclawJudgeSummaryCard />

      <RealNemoclawRuntimeStatusPanel />

      <NemoclawDualRuntimeExplainer />

      <InstructionSection title="1. What NemoClaw is">
        <p>
          NemoClaw is a secure reference stack for running OpenClaw agents with
          OpenShell policy enforcement. Every tool call is evaluated against YAML
          before execution; blocks do not silently fail — they appear in an
          audit-ready log.
        </p>
      </InstructionSection>

      <InstructionSection title="2. Why Parallax needs NemoClaw">
        <p>
          Parallax handles sensitive data like resumes, voice recordings,
          behavioral analysis, emotional signals, and hiring predictions. OpenClaw
          gives agents autonomy to act on that data; NemoClaw ensures they only
          do so inside strict policy boundaries.
        </p>
      </InstructionSection>

      <InstructionSection title="3. How to run locally">
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-cyan-100/90">
          curl -fsSL https://nvidia.com/nemoclaw.sh | bash
        </pre>
        <p className="mt-2 text-sm text-zinc-500">
          Installs the NemoClaw + OpenShell stack for local agent runs with your
          policy bundle. On this project machine, onboarding reached sandbox
          creation and configured Nemotron 3 Super 120B via the OpenShell gateway;
          the sandbox build did not complete because OpenClaw attempted to install
          a WeChat plugin from clawhub.ai and DNS resolution failed.
        </p>
      </InstructionSection>

      <InstructionSection title="4. How to run in cloud">
        <p>
          Use NVIDIA Brev Launchable with Nemotron model:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-emerald-100/90">
          nvidia/nemotron-3-super-120b-a12b
        </pre>
        <p className="mt-2 text-sm text-zinc-500">
          Point <code className="text-zinc-400">NVIDIA_API_KEY</code> in{" "}
          <code className="text-zinc-400">.env.local</code> for live Nemotron
          calls through trusted NVIDIA domains only.
        </p>
      </InstructionSection>

      <InstructionSection title="5. Policy file">
        <p className="mb-3 font-mono text-sm text-cyan-200/80">
          policies/nemoclaw.default.yaml
        </p>
        <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-zinc-400">
          {yaml ? yaml.slice(0, 1200) + (yaml.length > 1200 ? "\n…" : "") : "Loading…"}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <NeonButton
            type="button"
            variant="ghost"
            className="!text-xs"
            onClick={() => setYamlOpen(true)}
          >
            View full YAML
          </NeonButton>
          <NeonButton
            type="button"
            variant="ghost"
            className="!text-xs"
            onClick={() => void copyPolicy()}
          >
            {copied ? "Copied!" : "Copy policy YAML"}
          </NeonButton>
        </div>
      </InstructionSection>

      <InstructionSection title="6. Demo policy examples">
        <PolicyTierList
          tier="ALLOW"
          color="text-emerald-300"
          items={[
            "analyze transcript",
            "call NVIDIA Nemotron trusted endpoint",
            "generate feedback",
            "ephemeral session memory",
          ]}
        />
        <PolicyTierList
          tier="REQUIRE_APPROVAL"
          color="text-amber-200"
          items={[
            "read resume file",
            "save recording",
            "export interview profile",
            "save emotional analysis",
          ]}
        />
        <PolicyTierList
          tier="BLOCK"
          color="text-rose-300"
          items={[
            "permanent behavioral profile storage",
            "outbound untrusted domains",
            "sharing private resume data externally",
          ]}
        />
      </InstructionSection>

      <GlassPanel className="px-5 py-5" glow="cyan">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/90">
          Secure Agent Run demo
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Scripted flow proving: resume approval, transcript analysis, trusted
          Nemotron, feedback generation, blocked permanent profiling, export
          approval, blocked untrusted outbound — then the interview workflow
          continues.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton
            type="button"
            variant="ghost"
            className="!text-xs"
            onClick={() => void copyPolicy()}
          >
            {copied ? "Copied!" : "Copy policy YAML"}
          </NeonButton>
          <RunSecureAgentRunButton label="Run secure demo" />
        </div>
      </GlassPanel>

      <YamlPolicyViewer
        open={yamlOpen}
        onClose={() => setYamlOpen(false)}
        highlightRuleKey={null}
      />
    </>
  );
}

function InstructionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel className="px-5 py-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
        {children}
      </div>
    </GlassPanel>
  );
}

function PolicyTierList({
  tier,
  color,
  items,
}: {
  tier: string;
  color: string;
  items: string[];
}) {
  return (
    <div className="mt-4">
      <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>
        {tier}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

