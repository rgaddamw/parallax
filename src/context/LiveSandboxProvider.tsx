"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  offlineRuntimeFallback,
  type RealNemoclawRuntimeStatus,
} from "@/lib/nemoclaw/realRuntimeStatus";

type LiveSandboxContextValue = {
  status: RealNemoclawRuntimeStatus | null;
  loading: boolean;
  liveSandboxActive: boolean;
  refresh: () => Promise<void>;
};

const LiveSandboxContext = createContext<LiveSandboxContextValue | null>(null);

export function LiveSandboxProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RealNemoclawRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/nemoclaw/runtime", { cache: "no-store" });
      if (res.ok) {
        setStatus((await res.json()) as RealNemoclawRuntimeStatus);
      } else {
        setStatus(offlineRuntimeFallback());
      }
    } catch {
      setStatus(offlineRuntimeFallback());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const value = useMemo(
    () => ({
      status,
      loading,
      liveSandboxActive:
        status?.liveSandboxActive === true ||
        status?.connectionState === "connected",
      refresh,
    }),
    [status, loading, refresh],
  );

  return (
    <LiveSandboxContext.Provider value={value}>
      {children}
    </LiveSandboxContext.Provider>
  );
}

export function useLiveSandbox() {
  const ctx = useContext(LiveSandboxContext);
  if (!ctx) {
    throw new Error("useLiveSandbox must be used within LiveSandboxProvider");
  }
  return ctx;
}

export function useLiveSandboxOptional() {
  return useContext(LiveSandboxContext);
}
