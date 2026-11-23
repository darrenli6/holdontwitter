"use client";

import { useSyncExternalStore } from "react";

import { normalizeUsername } from "@/lib/tweets";

/**
 * Everything the dashboard remembers lives in this browser's localStorage:
 * the twitterapi.io key, the daily goal, your handle and the handles you watch.
 * Nothing is sent anywhere except the key, on each request, to /api/tweets.
 */

export type Settings = {
  apiKey: string;
  goal: number;
  me: string;
  watch: string[];
};

export const DEFAULT_GOAL = 30;
export const GOAL_MIN = 1;
export const GOAL_MAX = 500;

const SETTINGS_KEY = "tweet-pulse:settings";
const HISTORY_KEY = "tweet-pulse:history";
/** Days of totals kept per handle. */
const HISTORY_DAYS = 60;

const DEFAULTS: Settings = { apiKey: "", goal: DEFAULT_GOAL, me: "", watch: [] };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the settings.
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === HISTORY_KEY) {
      settingsCache = null;
      historyCache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the session still works, it just won't persist.
  }
}

export function clampGoal(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GOAL;
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(value)));
}

function sanitize(input: unknown): Settings {
  if (!input || typeof input !== "object") return DEFAULTS;
  const value = input as Partial<Record<keyof Settings, unknown>>;
  const watch = Array.isArray(value.watch)
    ? [...new Set(value.watch.map((v) => (typeof v === "string" ? normalizeUsername(v) : null)).filter((v): v is string => !!v))]
    : [];
  return {
    apiKey: typeof value.apiKey === "string" ? value.apiKey.trim() : "",
    goal: typeof value.goal === "number" ? clampGoal(value.goal) : DEFAULT_GOAL,
    me: typeof value.me === "string" ? (normalizeUsername(value.me) ?? "") : "",
    watch,
  };
}

// useSyncExternalStore needs a stable snapshot between changes.
let settingsCache: Settings | null = null;

function getSettings(): Settings {
  if (!settingsCache) settingsCache = sanitize(readJson(SETTINGS_KEY));
  return settingsCache;
}

export function updateSettings(patch: Partial<Settings> | ((current: Settings) => Partial<Settings>)) {
  const current = getSettings();
  const next = sanitize({ ...current, ...(typeof patch === "function" ? patch(current) : patch) });
  settingsCache = next;
  writeJson(SETTINGS_KEY, next);
  emit();
}

const sameHandle = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Adds a handle to the watch list. Returns the normalized handle, or an error code. */
export function addWatched(input: string): { ok: true; handle: string } | { ok: false; reason: "invalid" | "duplicate" } {
  const handle = normalizeUsername(input);
  if (!handle) return { ok: false, reason: "invalid" };
  const { watch, me } = getSettings();
  if (watch.some((h) => sameHandle(h, handle)) || (me && sameHandle(me, handle))) {
    return { ok: false, reason: "duplicate" };
  }
  updateSettings({ watch: [...watch, handle] });
  return { ok: true, handle };
}

export function removeWatched(handle: string) {
  updateSettings((current) => ({ watch: current.watch.filter((h) => !sameHandle(h, handle)) }));
}

/** null during server render and hydration, so the page never flashes the wrong state. */
export function useSettings(): Settings | null {
  return useSyncExternalStore(subscribe, getSettings, () => null);
}

// ---------------------------------------------------------------------------
// Daily totals, recorded whenever a day is fetched, so the week strip costs no
// extra API calls. { [handleLowercase]: { [YYYY-MM-DD]: total } }

export type History = Record<string, Record<string, number>>;

let historyCache: History | null = null;
const EMPTY_HISTORY: History = {};

function getHistory(): History {
  if (!historyCache) {
    const raw = readJson(HISTORY_KEY);
    historyCache = raw && typeof raw === "object" ? (raw as History) : EMPTY_HISTORY;
  }
  return historyCache;
}

export function recordDay(handle: string, date: string, total: number) {
  const history = getHistory();
  const key = handle.toLowerCase();
  if (history[key]?.[date] === total) return;
  const days = Object.entries({ ...history[key], [date]: total })
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, HISTORY_DAYS);
  historyCache = { ...history, [key]: Object.fromEntries(days) };
  writeJson(HISTORY_KEY, historyCache);
  emit();
}

export function useHistory(): History | null {
  return useSyncExternalStore(subscribe, getHistory, () => null);
}
