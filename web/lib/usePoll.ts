"use client";

import { useEffect, useRef, useState } from "react";

/** Calls `fn` every `ms` while mounted; keeps the last good value. */
export function usePoll<T>(fn: () => Promise<T>, ms: number): T | undefined {
  const [value, setValue] = useState<T>();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const v = await fnRef.current();
        if (alive) setValue(v);
      } catch (e) {
        console.warn("[overcall] poll failed", e);
      }
      if (alive) timer = setTimeout(tick, ms);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ms]);
  return value;
}

/** Re-renders every `ms` so countdowns move between polls. */
export function useNow(ms = 250): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
