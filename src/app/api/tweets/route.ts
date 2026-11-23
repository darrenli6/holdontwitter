import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { beijingDateKey, beijingDayRange, daysAgo, isDateKey } from "@/lib/beijing-time";
import {
  normalizeUsername,
  parseTweetDate,
  summarizeDay,
  type RawTweet,
  type UserDayResult,
} from "@/lib/tweets";

/**
 * Relays one user's timeline from twitterapi.io and counts one Beijing day.
 *
 * The API key comes from the browser in the `x-api-key` header on every call.
 * This route keeps nothing: no key, no tweets, no logs of either. It exists
 * because the browser cannot call twitterapi.io directly (CORS) and so the
 * paging and counting happen in one place.
 */

// Overridable for local testing against a mock; defaults to the real API.
const API_BASE = process.env.TWITTERAPI_BASE_URL || "https://api.twitterapi.io";
/** 20 tweets a page. 30 pages covers ~600 tweets: a heavy week for most accounts. */
const MAX_PAGES = 30;
/** How far back the dashboard lets you look. */
const MAX_DAYS_BACK = 14;

/**
 * The same key, account and day are fetched from twitterapi.io at most once a
 * minute per server instance, whatever the browsers do (several tabs, scripts).
 * In-flight requests are shared too. Errors are kept as well: a failed call
 * still costs a request, so "user not found" is not asked again within the minute.
 */
const COOLDOWN_MS = 60_000;
const MAX_CACHED = 500;
const recent = new Map<string, { at: number; result: Promise<UserDayResult> }>();

function cacheKey(apiKey: string, userName: string, date: string) {
  const keyHash = createHash("sha256").update(apiKey).digest("base64url").slice(0, 16);
  return `${keyHash}|${userName.toLowerCase()}|${date}`;
}

function remember(key: string, result: Promise<UserDayResult>) {
  const now = Date.now();
  for (const [k, entry] of recent) {
    if (now - entry.at >= COOLDOWN_MS || recent.size >= MAX_CACHED) recent.delete(k);
    else break; // Map keeps insertion order, so the rest are newer.
  }
  recent.set(key, { at: now, result });
  // Awaited by the request that started it; this only stops an unhandled-rejection warning.
  result.catch(() => {});
}

const querySchema = z.object({
  userName: z.string().transform((value, ctx) => {
    const handle = normalizeUsername(value);
    if (!handle) {
      ctx.addIssue({ code: "custom", message: "invalid_username" });
      return z.NEVER;
    }
    return handle;
  }),
  date: z
    .string()
    .optional()
    .refine((value) => value === undefined || isDateKey(value), "invalid_date"),
});

type Page = {
  tweets: RawTweet[];
  hasNextPage: boolean;
  nextCursor: string;
};

class UpstreamError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(apiKey: string, userName: string, cursor: string): Promise<Page> {
  const url = new URL("/twitter/user/last_tweets", API_BASE);
  url.searchParams.set("userName", userName);
  url.searchParams.set("includeReplies", "true");
  url.searchParams.set("cursor", cursor);

  // Free-tier keys are rate limited hard; back off a few times before giving up.
  const backoff = [1500, 4000, 8000];
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if ((response.status === 429 || response.status >= 500) && attempt < backoff.length) {
      await sleep(backoff[attempt]);
      continue;
    }

    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (response.status === 401 || response.status === 403) {
      throw new UpstreamError(401, "invalid_api_key", "Invalid or expired API key");
    }
    if (response.status === 429) {
      throw new UpstreamError(429, "rate_limited", "Rate limited, try again shortly");
    }
    if (!response.ok || !body) {
      const message =
        (body && (typeof body.message === "string" ? body.message : typeof body.msg === "string" ? body.msg : null)) ||
        `twitterapi.io returned ${response.status}`;
      throw new UpstreamError(502, "upstream_error", message);
    }
    if (body.status === "error") {
      const message = typeof body.msg === "string" && body.msg ? body.msg : "twitterapi.io returned an error";
      const notFound = /not\s*found|does not exist|suspend/i.test(message);
      if (notFound) throw new UpstreamError(404, "user_not_found", `User @${userName} not found`);
      throw new UpstreamError(502, "upstream_error", message);
    }

    // The docs put tweets under `data`; accept the top level too.
    const data = (body.data ?? body) as Record<string, unknown>;
    const tweets = Array.isArray(data.tweets) ? (data.tweets as RawTweet[]) : [];
    return {
      tweets,
      hasNextPage: body.has_next_page === true || data.has_next_page === true,
      nextCursor: String(body.next_cursor ?? data.next_cursor ?? ""),
    };
  }
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "missing_api_key", message: "Missing API key" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    userName: request.nextUrl.searchParams.get("userName") ?? "",
    date: request.nextUrl.searchParams.get("date") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      // The issue message is the error code: invalid_username or invalid_date.
      { error: parsed.error.issues[0]?.message ?? "bad_request", message: "Bad request" },
      { status: 400 },
    );
  }

  const { userName } = parsed.data;
  const date = parsed.data.date ?? beijingDateKey();
  const back = daysAgo(date);
  if (back < 0 || back > MAX_DAYS_BACK) {
    return NextResponse.json(
      { error: "date_out_of_range", message: `Only the last ${MAX_DAYS_BACK} days are available` },
      { status: 400 },
    );
  }

  const key = cacheKey(apiKey, userName, date);
  const cached = recent.get(key);
  const fresh = cached && Date.now() - cached.at < COOLDOWN_MS;
  const pending = fresh ? cached.result : loadDay(apiKey, userName, date);
  if (!fresh) remember(key, pending);

  try {
    const result = await pending;
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store", "x-cache": fresh ? "hit" : "miss" },
    });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      timedOut
        ? { error: "timeout", message: "twitterapi.io timed out" }
        : { error: "network_error", message: "Could not reach twitterapi.io" },
      { status: 502 },
    );
  }
}

/** Pages back through the timeline until it passes the start of the Beijing day. */
async function loadDay(apiKey: string, userName: string, date: string): Promise<UserDayResult> {
  const range = beijingDayRange(date);
  const collected: RawTweet[] = [];
  let cursor = "";
  let truncated = false;

  for (let page = 0; ; page++) {
    if (page >= MAX_PAGES) {
      truncated = true;
      break;
    }
    const result = await fetchPage(apiKey, userName, cursor);
    collected.push(...result.tweets);

    // Newest first: once a page reaches back past the start of the day, stop.
    const times = result.tweets.map((t) => parseTweetDate(t.createdAt)).filter(Number.isFinite);
    const oldest = times.length ? Math.min(...times) : Number.NaN;
    if (!result.hasNextPage || !result.nextCursor || result.tweets.length === 0) break;
    if (oldest < range.start) break;
    cursor = result.nextCursor;
  }

  const { counts, tweets } = summarizeDay(collected, range);
  const author =
    collected.find((t) => t.author?.userName?.toLowerCase() === userName.toLowerCase())?.author ?? null;

  return {
    userName: author?.userName ?? userName,
    name: author?.name ?? null,
    avatar: author?.profilePicture ?? null,
    date,
    counts,
    tweets,
    truncated,
    fetchedAt: Date.now(),
  };
}
