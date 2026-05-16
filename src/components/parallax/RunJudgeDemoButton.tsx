"use client";

import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/ui/NeonButton";
import { useInterviewSessionOptional } from "@/context/InterviewSessionProvider";

import { JUDGE_DEMO_STORAGE_KEY } from "@/lib/judgeDemo/scenario";

export function RunJudgeDemoButton({
  className = "",
  variant = "primary" as const,
}: {
  className?: string;
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  const ctx = useInterviewSessionOptional();
  const running = ctx?.state.isJudgeDemoRunning ?? false;

  const handleClick = () => {
    if (ctx) {
      void ctx.runJudgeDemo();
      return;
    }
    try {
      sessionStorage.setItem(JUDGE_DEMO_STORAGE_KEY, "1");
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
      {running ? "Judge demo running…" : "Run judge demo"}
    </NeonButton>
  );
}

