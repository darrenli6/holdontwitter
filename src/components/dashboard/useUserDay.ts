"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  COOLDOWN_MS,
  availableAt,
  markRequested,
  readEntry,
  requestKey,
  storeResult,
} from "@/lib/request-cache";
import { beijingDayRange } from "@/lib/beijing-time";
import { recordDay } from "@/lib/settings-store";
import type { UserDayResult } from "@/lib/tweets";

export class DayError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Inside the one-minute cooldown this answers from the cache and never touches
 * the network, however often it is called (refresh clicks, reloads, other tabs).
 */
async function fetchUserDay(key: string, userName: string, date: string, apiKey: string, signal: AbortSignal) {
  const entry = readEntry(key);
  if (entry && Date.now() - entry.at < COOLDOWN_MS) {
    if (entry.error) throw new DayError(entry.error.status, entry.error.code, entry.error.message);
    if (entry.data) return entry.data;
    // A request started but never finished (tab closed, aborted): nothing to show, so ask again.
  }

  markRequested(key);
  const params = new URLSearchParams({ userName, date });
  let response: Response;
  try {
    response = await fetch(`/api/tweets?${params}`, { headers: { "x-api-key": apiKey }, signal });
  } catch (error) {
    if (signal.aborted) throw error;
    const failure = { status: 0, code: "network_error", message: "" };
    storeResult(key, { error: failure });
    throw new DayError(failure.status, failure.code, failure.message);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = { status: response.status, code: body?.error ?? "unknown", message: body?.message ?? "" };
    storeResult(key, { error: failure });
    throw new DayError(failure.status, failure.code, failure.message);
  }
  const data = body as UserDayResult;
  storeResult(key, { data });
  return data;
}

export const dayQueryRoot = ["day"] as const;

export function useUserDay(userName: string, date: string, apiKey: string, isToday: boolean) {
  const key = requestKey(userName, date, apiKey);
  const query = useQuery({
    queryKey: [...dayQueryRoot, key],
    queryFn: ({ signal }) => fetchUserDay(key, userName, date, apiKey, signal),
    enabled: Boolean(userName && apiKey),
    // Last answer from localStorage: a reload shows numbers at once, and only
    // asks again once they are older than staleTime.
    initialData: () => readEntry(key)?.data,
    initialDataUpdatedAt: () => readEntry(key)?.data?.fetchedAt,
    // Today is polled while the tab is visible. A past day no longer changes,
    // unless the copy we hold was fetched before that day was over.
    staleTime: (q) =>
      isToday ? 5 * 60 * 1000 : (q.state.data?.fetchedAt ?? 0) >= beijingDayRange(date).end ? Infinity : 0,
    refetchInterval: isToday ? TEN_MINUTES : false,
  });

  const total = query.data?.counts.total;
  useEffect(() => {
    if (total !== undefined && !query.data?.truncated) recordDay(userName, date, total);
  }, [userName, date, total, query.data?.truncated]);

  return { query, key, retryAt: availableAt(key) };
}
