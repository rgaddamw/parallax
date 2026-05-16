import type { SessionMemory } from "@/agents/types";
import type { InterviewerPersonality } from "@/types/interview";

const STORAGE_PREFIX = "parallax-memory-v1";

export function memoryStorageKey(sessionId: string) {
  return `${STORAGE_PREFIX}:${sessionId}`;
}

export function createInitialMemory(
  sessionId: string,
  seedPersonality: InterviewerPersonality,
): SessionMemory {
  return {
    sessionId,
    trustScore:
      seedPersonality === "friendly_recruiter"
        ? 74
        : seedPersonality === "skeptical_engineer"
          ? 62
          : seedPersonality === "startup_founder"
            ? 68
            : 58,
    contradictions: [],
    answerFingerprints: [],
    pressureLevel: seedPersonality === "pressure_mode" ? 42 : 22,
    effectivePersonality: null,
    lastStressSignal: null,
  };
}

export function loadMemory(sessionId: string): SessionMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(memoryStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionMemory;
  } catch {
    return null;
  }
}

export function persistMemory(memory: SessionMemory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      memoryStorageKey(memory.sessionId),
      JSON.stringify(memory),
    );
  } catch {
    /* quota / private mode */
  }
}
