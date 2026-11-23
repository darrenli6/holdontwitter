"use client";

import { beijingClock } from "@/lib/beijing-time";
import { useT } from "@/lib/i18n";
import { useSecondsUntil } from "@/lib/request-cache";
import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";
import { Avatar, Disclosure, KindBreakdown, ProgressBar, Skeleton, TweetList } from "./parts";
import { useUserDay, type DayError } from "./useUserDay";

export function WatchCard({
  handle,
  date,
  apiKey,
  goal,
  isToday,
  onRemove,
}: {
  handle: string;
  date: string;
  apiKey: string;
  goal: number;
  isToday: boolean;
  onRemove: () => void;
}) {
  const t = useT();
  const { query, retryAt } = useUserDay(handle, date, apiKey, isToday);
  const data = query.data;
  const total = data?.counts.total ?? 0;
  const latest = data?.tweets[0];

  return (
    <article className="grid content-start gap-4 rounded-photo bg-panel p-5">
      <header className="flex items-center gap-3">
        <Avatar src={data?.avatar} name={handle} />
        <div className="min-w-0 grow">
          <h3 className="truncate font-semibold">{data?.name ?? handle}</h3>
          <a href={`https://x.com/${handle}`} target="_blank" rel="noreferrer" className="text-13 text-muted hover:underline">
            @{handle}
          </a>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.unwatch(handle)}
          className="press grid size-9 shrink-0 place-items-center rounded-pill text-muted hover:bg-card hover:text-fg"
        >
          <CloseIcon />
        </button>
      </header>

      {query.isPending ? (
        <>
          <Skeleton className="h-12" />
          <Skeleton className="h-14" />
        </>
      ) : query.isError ? (
        <ErrorNote error={query.error as DayError} retryAt={retryAt} onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="flex items-baseline gap-1.5">
                <span className={cn("font-display tabular text-5xl leading-none", total >= goal && "text-ok")}>{total}</span>
                <span className="text-13 text-muted">{t.ofGoal(goal)}</span>
              </p>
              <span className="text-13 text-muted">
                {latest ? t.latestAt(beijingClock(latest.createdAt)) : isToday ? t.noneToday : t.noneThatDay}
              </span>
            </div>
            <ProgressBar value={total} goal={goal} />
          </div>
          <KindBreakdown counts={data!.counts} compact />
          {data!.truncated && <p className="text-13 text-muted">{t.truncatedShort}</p>}
          {data!.tweets.length > 0 && (
            <Disclosure label={t.showTweets}>
              <TweetList tweets={data!.tweets} />
            </Disclosure>
          )}
        </>
      )}
    </article>
  );
}

export function ErrorNote({ error, retryAt, onRetry }: { error: DayError; retryAt: number; onRetry: () => void }) {
  const t = useT();
  const wait = useSecondsUntil(retryAt);
  // Known codes are translated; anything else is twitterapi.io's own message.
  const message = t.errors[error.code] ?? (error.message || t.requestFailed(error.status));
  const hint = t.errorHints[error.code];
  return (
    <div role="alert" className="grid gap-2 rounded-field border border-err-line bg-err-bg p-4 text-err-fg">
      <p className="font-medium">{message}</p>
      {hint && <p className="text-13">{hint}</p>}
      <button
        type="button"
        onClick={onRetry}
        disabled={wait > 0}
        className="press tabular justify-self-start rounded-pill border border-current px-3 py-1 text-13 font-semibold disabled:opacity-60"
      >
        {wait > 0 ? t.retryIn(wait) : t.retry}
      </button>
    </div>
  );
}
