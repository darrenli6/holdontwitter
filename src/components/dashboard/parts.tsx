"use client";

import { useState } from "react";

import { beijingClock } from "@/lib/beijing-time";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TWEET_KINDS, type DayTweet, type TweetCounts } from "@/lib/tweets";

export function ProgressRing({ value, goal, size = 168 }: { value: number; goal: number; size?: number }) {
  const stroke = Math.max(8, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(1, goal > 0 ? value / goal : 0);
  const done = value >= goal;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? "var(--ok)" : "var(--fg)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        className="transition-[stroke-dashoffset] duration-450 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

export function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const ratio = Math.min(1, goal > 0 ? value / goal : 0);
  return (
    <div className="h-2 overflow-hidden rounded-pill bg-card" aria-hidden="true">
      <div
        className={cn(
          "h-full origin-left rounded-pill transition-transform duration-450 ease-out motion-reduce:transition-none",
          value >= goal ? "bg-ok" : "bg-fg",
        )}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}

export function KindBreakdown({ counts, compact = false }: { counts: TweetCounts; compact?: boolean }) {
  const t = useT();
  return (
    <dl className={cn("grid grid-cols-4", compact ? "gap-1.5" : "gap-2")}>
      {TWEET_KINDS.map((kind) => (
        <div key={kind} className={cn("rounded-field bg-card", compact ? "px-2 py-1.5" : "px-3 py-2.5")}>
          <dt className="truncate text-13 text-muted">{t.kinds[kind]}</dt>
          <dd className={cn("tabular font-semibold", compact ? "text-base" : "text-2xl")}>{counts[kind]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Avatar({ src, name, size = 44 }: { src: string | null | undefined; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-pill bg-card font-semibold uppercase"
      >
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    // Avatars come from pbs.twimg.com; no need to route them through the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-pill bg-card object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function TweetList({ tweets }: { tweets: DayTweet[] }) {
  const t = useT();
  if (tweets.length === 0) return <p className="text-13 text-muted">{t.noTweets}</p>;
  return (
    <ol className="grid gap-1">
      {tweets.map((tweet) => (
        <li key={tweet.id}>
          <a
            href={tweet.url}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[auto_auto_1fr] items-baseline gap-3 rounded-field px-3 py-2 transition-colors duration-120 hover:bg-card"
          >
            <time className="tabular text-13 text-muted" dateTime={new Date(tweet.createdAt).toISOString()}>
              {beijingClock(tweet.createdAt)}
            </time>
            <span className="rounded-pill bg-card px-2 text-13">{t.kinds[tweet.kind]}</span>
            <span className="truncate">{tweet.text || t.noText}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="press inline-flex cursor-pointer list-none items-center gap-1.5 rounded-pill px-3 py-1.5 text-13 font-medium hover:bg-card [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="transition-transform duration-220 ease-out group-open:rotate-90">
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {label}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-field bg-skel", className)} />;
}
