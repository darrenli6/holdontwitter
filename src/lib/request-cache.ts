"use client";

import { useSyncExternalStore } from "react";

import type { UserDayResult } from "@/lib/tweets";

/**
 * Every twitterapi.io call is billed, so one account-and-day is fetched at most
 * once a minute. The last answer (or error) for each is kept in localStorage,
 * which also means a page reload inside the minute costs nothing.
 */
export const COOLDOWN_MS = 60_000;

const STORAGE_KEY = "tweet-pulse:requests";
const MAX_ENTRIES = 150;
/** Entries older than this are dropped when the cache is written. */
const MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000;

export type StoredError = { status: number; code: string; message: string };

type Entry = {
  /** When the last network request for this key started. */
  at: number;
  data?: UserDayResult;
  error?: StoredError;
};

type Store = Record<string, Entry>;

let memory: Store | null = null;

function load(): Store {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    memory = parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    memory = {};
  }
  return memory;
}

function save(store: Store) {
  const cutoff = Date.now() - MAX_AGE_MS;
  const kept = Object.entries(store)
    .filter(([, entry]) => entry.at >= cutoff)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, MAX_ENTRIES);
  memory = Object.fromEntries(kept);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Full or blocked storage: the in-memory copy still throttles this tab.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) memory = null;
  });
}

/** FNV-1a: tells keys apart without writing the key itself into the cache. */
function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function requestKey(userName: string, date: string, apiKey: string): string {
  return `${userName.toLowerCase()}|${date}|${fingerprint(apiKey)}`;
}

export function readEntry(key: string): Entry | undefined {
  return load()[key];
}

export function markRequested(key: string, at = Date.now()) {
  const store = load();
  save({ ...store, [key]: { ...store[key], at } });
}

export function storeResult(key: string, result: { data: UserDayResult } | { error: StoredError }) {
  const store = load();
  const previous = store[key] ?? { at: Date.now() };
  // A failed refresh keeps the last good numbers on screen.
  const next: Entry =
    "data" in result
      ? { at: previous.at, data: result.data }
      : { at: previous.at, data: previous.data, error: result.error };
  save({ ...store, [key]: next });
}

/** When this key may hit the network again (ms epoch); 0 when it already may. */
export function availableAt(key: string): number {
  const entry = readEntry(key);
  return entry ? entry.at + COOLDOWN_MS : 0;
}

/** The first moment any of these keys may be requested again. */
export function earliestAvailableAt(keys: string[]): number {
  return keys.length ? Math.min(...keys.map(availableAt)) : 0;
}

// A one-second clock for countdowns. Components using it re-render each second.
const tickers = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | null = null;

function subscribeSeconds(listener: () => void) {
  tickers.add(listener);
  ticker ??= setInterval(() => tickers.forEach((l) => l()), 1000);
  return () => {
    tickers.delete(listener);
    if (tickers.size === 0 && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  };
}

const currentSecond = () => Math.floor(Date.now() / 1000);

/** Whole seconds left until `target` (ms epoch), ticking every second. */
export function useSecondsUntil(target: number): number {
  const second = useSyncExternalStore(subscribeSeconds, currentSecond, () => 0);
  if (!target || second === 0) return 0;
  return Math.max(0, Math.ceil(target / 1000 - second));
}
