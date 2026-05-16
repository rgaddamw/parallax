"use client";

import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/ui/NeonButton";
import { useInterviewSessionOptional } from "@/context/InterviewSessionProvider";
import { SECURE_AGENT_STORAGE_KEY } from "@/lib/secureAgentRun/scenario";

export function RunSecureAgentRunButton({
  className = "",
  variant = "primary" as const,
  label,
}: {
  className?: string;
  variant?: "primary" | "ghost";
  label?: string;
}) {
  const router = useRouter();
  const ctx = useInterviewSessionOptional();
  const running = ctx?.state.isSecureAgentRunRunning ?? false;

  const handleClick = () => {
    if (ctx) {
      void ctx.runSecureAgentRun();
      return;
    }
    try {
      sessionStorage.setItem(SECURE_AGENT_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    router.push("/app");
  };

  return (
    <NeonButton
      type="button"
      variant={variant}
      className={className}
      disabled={running}
      onClick={handleClick}
    >
      {running
        ? "Secure Agent Run…"
        : (label ?? "Run Secure Agent Run")}
    </NeonButton>
  );
}
