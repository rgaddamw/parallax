"use client";

import { LiveSandboxProvider } from "@/context/LiveSandboxProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LiveSandboxProvider>{children}</LiveSandboxProvider>;
}
