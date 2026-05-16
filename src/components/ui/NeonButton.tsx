import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

export function NeonButton({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-40";
  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-cyan-400/90 to-fuchsia-500/90 text-zinc-950 hover:brightness-110 active:scale-[0.99]",
    ghost:
      "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10",
    danger:
      "border border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
  };
  return (
    <button
      type={type}
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
