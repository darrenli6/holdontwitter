/** Shared between the API route and the browser: no server or DOM imports. */

export type TweetKind = "original" | "reply" | "retweet" | "quote";

export const TWEET_KINDS: readonly TweetKind[] = ["original", "reply", "retweet", "quote"];

export type TweetCounts = Record<TweetKind, number> & { total: number };

export type DayTweet = {
  id: string;
  url: string;
  text: string;
  createdAt: number;
  kind: TweetKind;
};

export type UserDayResult = {
  userName: string;
  name: string | null;
  avatar: string | null;
  date: string;
  counts: TweetCounts;
  tweets: DayTweet[];
  /** True when paging stopped at the safety cap before reaching the start of the day. */
  truncated: boolean;
  fetchedAt: number;
};

/** The fields this app reads from a twitterapi.io Tweet object. */
export type RawTweet = {
  id?: string;
  url?: string;
  text?: string;
  createdAt?: string;
  isReply?: boolean;
  isRetweet?: boolean;
  isQuote?: boolean;
  inReplyToId?: string | null;
  retweeted_tweet?: unknown;
  quoted_tweet?: unknown;
  author?: { userName?: string; name?: string; profilePicture?: string } | null;
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// "Tue Dec 10 07:00:30 +0000 2024"
const CLASSIC = /^\w{3} (\w{3}) (\d{1,2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2}) (\d{4})$/;

/** Parses X's classic timestamp (and ISO 8601 as a fallback). NaN when unreadable. */
export function parseTweetDate(value: string | undefined): number {
  if (!value) return Number.NaN;
  const match = CLASSIC.exec(value.trim());
  if (match) {
    const [, mon, day, hh, mm, ss, sign, oh, om, year] = match;
    const month = MONTHS[mon];
    if (month === undefined) return Number.NaN;
    const offset = (Number(oh) * 60 + Number(om)) * 60_000 * (sign === "-" ? -1 : 1);
    return Date.UTC(Number(year), month, Number(day), Number(hh), Number(mm), Number(ss)) - offset;
  }
  return Date.parse(value);
}

/** A retweet wins over everything; a reply that quotes still counts as a reply. */
export function classifyTweet(tweet: RawTweet): TweetKind {
  if (tweet.isRetweet || tweet.retweeted_tweet) return "retweet";
  if (tweet.isReply || tweet.inReplyToId) return "reply";
  if (tweet.isQuote || tweet.quoted_tweet) return "quote";
  return "original";
}

export function emptyCounts(): TweetCounts {
  return { total: 0, original: 0, reply: 0, retweet: 0, quote: 0 };
}

/** Keeps the tweets inside [start, end), once each, newest first. */
export function summarizeDay(
  raw: RawTweet[],
  range: { start: number; end: number },
): { counts: TweetCounts; tweets: DayTweet[] } {
  const seen = new Set<string>();
  const tweets: DayTweet[] = [];
  for (const tweet of raw) {
    if (!tweet.id || seen.has(tweet.id)) continue;
    const createdAt = parseTweetDate(tweet.createdAt);
    if (!(createdAt >= range.start && createdAt < range.end)) continue;
    seen.add(tweet.id);
    tweets.push({
      id: tweet.id,
      url: tweet.url || `https://x.com/i/status/${tweet.id}`,
      text: tweet.text ?? "",
      createdAt,
      kind: classifyTweet(tweet),
    });
  }
  tweets.sort((a, b) => b.createdAt - a.createdAt);
  const counts = emptyCounts();
  for (const tweet of tweets) {
    counts[tweet.kind] += 1;
    counts.total += 1;
  }
  return { counts, tweets };
}

const USERNAME = /^[A-Za-z0-9_]{1,15}$/;

/**
 * Accepts "@name", "name", or a profile link (x.com / twitter.com).
 * Returns the bare handle, or null when it cannot be a valid X username.
 */
export function normalizeUsername(input: string): string | null {
  let value = input.trim();
  const link = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i.exec(value);
  if (link) value = link[1];
  value = value.replace(/^@+/, "");
  return USERNAME.test(value) ? value : null;
}
