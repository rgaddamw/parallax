import Link from "next/link";
import type { ComponentProps } from "react";

const primaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 bg-gradient-to-r from-cyan-400/90 to-fuchsia-500/90 text-zinc-950 hover:brightness-110 active:scale-[0.99] min-w-[220px]";

export function NeonLink({
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={`${primaryClass} ${className}`} {...props} />;
}
