"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD_RATIO = 0.45;

/**
 * Keeps a loading indicator visible until its current animation cycle
 * finishes, instead of cutting it off mid-loop the instant the real data
 * arrives. Once the indicator has played past 45% of one cycle, it holds
 * until that cycle completes; below that it can disappear immediately.
 */
export function useHoldLoadingAnimation(isLoading: boolean, cycleMs: number): boolean {
  const [visible, setVisible] = useState(isLoading);
  const startedAtRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isLoading) {
      startedAtRef.current = Date.now();
      timeout = setTimeout(() => setVisible(true), 0);
    } else {
      const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      const progress = (elapsed % cycleMs) / cycleMs;
      const delay = progress >= THRESHOLD_RATIO ? cycleMs - (elapsed % cycleMs) : 0;
      timeout = setTimeout(() => setVisible(false), delay);
    }

    return () => clearTimeout(timeout);
  }, [isLoading, cycleMs]);

  return visible;
}
