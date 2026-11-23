"use client";

import { shiftDateKey } from "@/lib/beijing-time";
import { useT } from "@/lib/i18n";
import { useHistory } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

import { Avatar, Disclosure, KindBreakdown, ProgressRing, Skeleton, TweetList } from "./parts";
import { useUserDay, type DayError } from "./useUserDay";
import { ErrorNote } from "./WatchCard";

export function MeCard({
  handle,
  date,
  apiKey,
  goal,
  isToday,
}: {
  handle: string;
  date: string;
  apiKey: string;
  goal: number;
  isToday: boolean;
}) {
  const t = useT();
  const { query, retryAt } = useUserDay(handle, date, apiKey, isToday);
  const data = query.data;
  const total = data?.counts.total ?? 0;
  const left = Math.max(0, goal - total);

  return (
    <section aria-labelledby="me-title" className="grid gap-6 rounded-section bg-panel p-5 sm:p-8">
      <header className="flex items-center gap-3">
        <Avatar src={data?.avatar} name={handle} size={48} />
        <div className="min-w-0">
          <h2 id="me-title" className="truncate font-semibold">
            {data?.name ?? t.myProgress}
          </h2>
          <a href={`https://x.com/${handle}`} target="_blank" rel="noreferrer" className="text-13 text-muted hover:underline">
            @{handle}
          </a>
        </div>
      </header>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <Skeleton className="size-[168px] rounded-pill" />
          <Skeleton className="h-24" />
        </div>
      ) : query.isError ? (
        <ErrorNote error={query.error as DayError} retryAt={retryAt} onRetry={() => query.refetch()} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
          <div className="relative grid place-items-center justify-self-center">
            <ProgressRing value={total} goal={goal} />
            <div className="absolute grid place-items-center text-center">
              <span className="font-display tabular text-6xl leading-none">{total}</span>
              <span className="text-13 text-muted">/ {goal}</span>
            </div>
          </div>
          <div className="grid gap-4">
            <p className={cn("text-2xl font-semibold", total >= goal && "text-ok")} aria-live="polite">
              {total >= goal
                ? total > goal
                  ? t.goalExceeded(total - goal)
                  : t.goalMet
                : isToday
                  ? t.leftToday(left)
                  : t.leftThatDay(left)}
            </p>
            <KindBreakdown counts={data!.counts} />
            {data!.truncated && (
              <p className="text-13 text-muted">{t.truncatedLong}</p>
            )}
          </div>
        </div>
      )}

      <WeekStrip handle={handle} date={date} goal={goal} />

      {data && data.tweets.length > 0 && (
        <Disclosure label={t.showDayTweets(data.tweets.length)}>
          <TweetList tweets={data.tweets} />
        </Disclosure>
      )}
    </section>
  );
}

/** The 7 days ending on `date`, from totals saved in this browser (no API calls). */
function WeekStrip({ handle, date, goal }: { handle: string; date: string; goal: number }) {
  const t = useT();
  const history = useHistory();
  const days = Array.from({ length: 7 }, (_, i) => shiftDateKey(date, i - 6));
  const own = history?.[handle.toLowerCase()] ?? {};
  const max = Math.max(goal, ...days.map((d) => own[d] ?? 0));

  return (
    <figure className="grid gap-2">
      <figcaption className="text-13 text-muted">{t.last7}</figcaption>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const value = own[day];
          const weekday = t.weekdaysShort[new Date(`${day}T00:00:00Z`).getUTCDay()];
          const met = value !== undefined && value >= goal;
          return (
            <li key={day} className="grid gap-1 text-center">
              <div className="relative h-16 overflow-hidden rounded-field bg-card" aria-hidden="true">
                {value !== undefined && (
                  <div
                    className={cn("absolute inset-x-0 bottom-0", met ? "bg-ok" : "bg-fg/70")}
                    style={{ height: `${(value / max) * 100}%` }}
                  />
                )}
              </div>
              <span className={cn("tabular text-13", day === date ? "font-semibold" : "text-muted")}>
                {value ?? "–"}
              </span>
              <span className="sr-only">
                {day}: {value === undefined ? t.noRecord : t.daySummary(value, met)}
              </span>
              <span aria-hidden="true" className="text-13 text-muted">
                {weekday}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
