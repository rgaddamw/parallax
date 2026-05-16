"use client";

const BADGE_STYLE: Record<string, string> = {
  "LIVE SANDBOX":
    "border-emerald-500/45 bg-emerald-500/15 text-emerald-100",
  "HEALTHY GATEWAY":
    "border-cyan-500/40 bg-cyan-500/12 text-cyan-100",
  "NEMOTRON ACTIVE":
    "border-violet-500/40 bg-violet-500/12 text-violet-100",
};

export function NemoClawRuntimeBadges({
  badges,
  className = "",
}: {
  badges: string[];
  className?: string;
}) {
  if (!badges.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
            BADGE_STYLE[badge] ??
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          <span className="live-sandbox-pulse h-1.5 w-1.5 rounded-full bg-current opacity-90" />
          {badge}
        </span>
      ))}
    </div>
  );
}
