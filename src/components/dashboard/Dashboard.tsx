"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { setLocale, useDocumentLang, useLocale, useT, type Messages } from "@/lib/i18n";
import { beijingClock, beijingDateKey, daysAgo, shiftDateKey } from "@/lib/beijing-time";
import { earliestAvailableAt, requestKey, useSecondsUntil } from "@/lib/request-cache";
import { removeWatched, useSettings } from "@/lib/settings-store";

import { ChevronIcon, GearIcon, RefreshIcon } from "./icons";
import { MeCard } from "./MeCard";
import { Skeleton } from "./parts";
import { SettingsPanel } from "./SettingsPanel";
import { useNow } from "./useBeijingNow";
import { dayQueryRoot } from "./useUserDay";
import { WatchAdder } from "./WatchAdder";
import { WatchCard } from "./WatchCard";

/** Matches MAX_DAYS_BACK in the API route. */
const MAX_DAYS_BACK = 14;
function dayLabel(t: Messages, date: string, back: number) {
  if (back === 0) return t.today;
  if (back === 1) return t.yesterday;
  const [, m, d] = date.split("-").map(Number);
  return t.formatDate(m, d);
}

export function Dashboard() {
  useDocumentLang();
  const t = useT();
  const settings = useSettings();
  const now = useNow();
  const [editing, setEditing] = useState(false);
  // Days back from today; 0 follows today across Beijing midnight.
  const [back, setBack] = useState(0);

  if (!settings || now === null) {
    return (
      <Shell>
        <Skeleton className="h-80 rounded-section" />
      </Shell>
    );
  }

  const today = beijingDateKey(now);
  const date = shiftDateKey(today, -back);
  const isToday = back === 0;
  const weekday = t.weekdaysLong[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const needsSetup = !settings.apiKey;

  const toolbar = (
    <div className="flex items-center gap-1">
      {!needsSetup && (
        <RefreshAllButton
          handles={settings.me ? [settings.me, ...settings.watch] : settings.watch}
          date={date}
          apiKey={settings.apiKey}
        />
      )}
      {!needsSetup && (
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label={t.settings}
          aria-expanded={editing}
          className="press grid size-11 place-items-center rounded-pill hover:bg-card aria-expanded:bg-card"
        >
          <GearIcon />
        </button>
      )}
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );

  return (
    <Shell toolbar={toolbar}>
      {needsSetup ? (
        <section className="grid gap-6">
          <div className="grid gap-3">
            <h2 className="font-display text-[min(96px,16vw)] leading-[0.85]">{t.heroTitle}</h2>
            <p className="max-w-xl text-muted">{t.heroBody}</p>
          </div>
          <SettingsPanel settings={settings} />
        </section>
      ) : (
        <>
          {editing && <SettingsPanel key={settings.apiKey + settings.me + settings.goal} settings={settings} onDone={() => setEditing(false)} />}

          <nav aria-label={t.chooseDate} className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBack((b) => Math.min(MAX_DAYS_BACK, b + 1))}
                disabled={back >= MAX_DAYS_BACK}
                aria-label={t.prevDay}
                className="press grid size-11 place-items-center rounded-pill hover:bg-card disabled:opacity-40"
              >
                <ChevronIcon dir="left" />
              </button>
              <h2 className="min-w-28 text-center" aria-live="polite">
                <span className="font-display text-4xl leading-none">{dayLabel(t, date, back)}</span>
                <span className="block text-13 text-muted">
                  {date} {weekday}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setBack((b) => Math.max(0, b - 1))}
                disabled={isToday}
                aria-label={t.nextDay}
                className="press grid size-11 place-items-center rounded-pill hover:bg-card disabled:opacity-40"
              >
                <ChevronIcon dir="right" />
              </button>
              {!isToday && (
                <button type="button" onClick={() => setBack(0)} className="press ml-1 rounded-pill px-3 py-2 text-13 font-semibold hover:bg-card">
                  {t.backToToday}
                </button>
              )}
            </div>
            <p className="tabular text-13 text-muted">{t.beijingNow(beijingClock(now))}</p>
          </nav>

          {settings.me ? (
            <MeCard handle={settings.me} date={date} apiKey={settings.apiKey} goal={settings.goal} isToday={isToday} />
          ) : (
            <section className="grid justify-items-start gap-3 rounded-section bg-panel p-5 sm:p-8">
              <p className="font-semibold">{t.noUsernameTitle}</p>
              <p className="text-muted">{t.noUsernameBody}</p>
              <button type="button" onClick={() => setEditing(true)} className="press rounded-pill bg-fg px-5 py-2.5 font-semibold text-bg">
                {t.goToSettings}
              </button>
            </section>
          )}

          <section aria-labelledby="watch-title" className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="watch-title" className="font-display text-4xl leading-none">
                {t.watching} <span className="text-muted">{settings.watch.length}</span>
              </h2>
            </div>
            <WatchAdder />
            {settings.watch.length === 0 ? (
              <p className="rounded-photo border border-dashed border-line p-6 text-center text-muted">
                {t.watchEmpty}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {settings.watch.map((handle) => (
                  <WatchCard
                    key={handle}
                    handle={handle}
                    date={date}
                    apiKey={settings.apiKey}
                    goal={settings.goal}
                    isToday={isToday}
                    onRemove={() => removeWatched(handle)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}

/**
 * Refetches every card on screen. Locked for a minute after the last request:
 * cards still cooling down would answer from the cache anyway.
 */
function RefreshAllButton({ handles, date, apiKey }: { handles: string[]; date: string; apiKey: string }) {
  const t = useT();
  const queryClient = useQueryClient();
  const fetching = useIsFetching({ queryKey: dayQueryRoot }) > 0;
  const wait = useSecondsUntil(earliestAvailableAt(handles.map((h) => requestKey(h, date, apiKey))));
  const locked = fetching || wait > 0;
  return (
    <button
      type="button"
      onClick={() => queryClient.invalidateQueries({ queryKey: dayQueryRoot })}
      disabled={locked}
      aria-label={wait > 0 && !fetching ? t.refreshIn(wait) : t.refreshAll}
      title={wait > 0 && !fetching ? t.refreshIn(wait) : t.refreshAll}
      className="press flex h-11 min-w-11 items-center justify-center gap-1 rounded-pill px-2.5 hover:bg-card disabled:opacity-60"
    >
      <RefreshIcon spinning={fetching} />
      {wait > 0 && !fetching && (
        <span aria-hidden="true" className="tabular text-13 font-semibold">
          {wait}s
        </span>
      )}
    </button>
  );
}

/** Shows the other language's name; switching is instant and remembered. */
function LanguageToggle() {
  const t = useT();
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}
      aria-label={t.switchLanguage}
      lang={locale === "en" ? "zh-CN" : "en"}
      className="press grid h-11 min-w-11 place-items-center rounded-pill px-2 text-13 font-semibold hover:bg-card"
    >
      {t.languageButton}
    </button>
  );
}

function Shell({ children, toolbar }: { children: React.ReactNode; toolbar?: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-24 pt-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl leading-none">Tweet Pulse</h1>
        {toolbar}
      </header>
      <main className="grid gap-8">{children}</main>
    </div>
  );
}
