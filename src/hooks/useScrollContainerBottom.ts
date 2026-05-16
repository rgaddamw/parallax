import { useEffect, type RefObject } from "react";

/** Scroll only inside a panel — never the document (avoids page jump). */
export function useScrollContainerBottom(
  containerRef: RefObject<HTMLElement | null>,
  trigger: number,
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [containerRef, trigger]);
}
