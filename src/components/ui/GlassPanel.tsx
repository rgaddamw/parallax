import type { ReactNode } from "react";

export function GlassPanel({
  children,
  className = "",
  glow = "cyan",
}: {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "amber";
}) {
  const ring =
    glow === "violet"
      ? "shadow-[0_0_40px_-12px_rgba(167,139,250,0.55)]"
      : glow === "amber"
        ? "shadow-[0_0_36px_-14px_rgba(251,191,36,0.45)]"
        : "shadow-[0_0_40px_-12px_rgba(34,211,238,0.45)]";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl ${ring} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_40%,rgba(255,255,255,0.02))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
