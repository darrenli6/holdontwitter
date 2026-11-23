"use client";

import { useSyncExternalStore } from "react";

// One shared 30s tick: enough to roll the date over at Beijing midnight.
const listeners = new Set<() => void>();
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time in ms, refreshed every 30 seconds; null on the server. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, () => now, () => null);
}
