"use client";

import { useId, useState } from "react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n";
import { clampGoal, GOAL_MAX, GOAL_MIN, updateSettings, type Settings } from "@/lib/settings-store";
import { normalizeUsername } from "@/lib/tweets";
import { cn } from "@/lib/utils";

import { EyeIcon } from "./icons";

const GOAL_PRESETS = [20, 30, 50];

const field =
  "h-12 w-full rounded-field border border-line bg-field px-4 text-base outline-none transition-colors duration-120 focus:border-fg";

export function SettingsPanel({ settings, onDone }: { settings: Settings; onDone?: () => void }) {
  const t = useT();
  const id = useId();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [me, setMe] = useState(settings.me);
  const [goal, setGoal] = useState(String(settings.goal));
  const [showKey, setShowKey] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);

  function save(event: React.FormEvent) {
    event.preventDefault();
    const handle = me.trim() ? normalizeUsername(me) : "";
    if (handle === null) {
      setMeError(t.usernameInvalid);
      return;
    }
    setMeError(null);
    const nextGoal = clampGoal(Number(goal));
    setGoal(String(nextGoal));
    setMe(handle);
    updateSettings({ apiKey: apiKey.trim(), me: handle, goal: nextGoal });
    toast.success(t.saved);
    onDone?.();
  }

  return (
    <form onSubmit={save} className="grid gap-5 rounded-section bg-panel p-5 sm:p-8">
      <div className="grid gap-2">
        <label htmlFor={`${id}-key`} className="font-semibold">
          {t.apiKeyLabel}
        </label>
        <div className="relative">
          <input
            id={`${id}-key`}
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={t.apiKeyPlaceholder}
            className={cn(field, "pr-12 font-mono")}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? t.hideKey : t.showKey}
            aria-pressed={showKey}
            className="press absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-pill text-muted hover:text-fg"
          >
            <EyeIcon off={showKey} />
          </button>
        </div>
        <p className="text-13 text-muted">
          {t.apiKeyHelpBefore}{" "}
          <a href="https://twitterapi.io/" target="_blank" rel="noreferrer" className="underline">
            twitterapi.io
          </a>
          {t.apiKeyHelpAfter}
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${id}-me`} className="font-semibold">
          {t.myUsername}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-muted">@</span>
          <input
            id={`${id}-me`}
            value={me}
            onChange={(e) => setMe(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourname"
            aria-invalid={meError ? true : undefined}
            aria-describedby={meError ? `${id}-me-error` : undefined}
            className={cn(field, "pl-9")}
          />
        </div>
        {meError && (
          <p id={`${id}-me-error`} className="text-13 text-err-line">
            {meError}
          </p>
        )}
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-semibold">{t.dailyGoal}</legend>
        <div className="flex flex-wrap items-center gap-2">
          {GOAL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setGoal(String(preset))}
              aria-pressed={Number(goal) === preset}
              className="press h-11 min-w-14 rounded-pill border border-line px-4 font-semibold aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg"
            >
              {preset}
            </button>
          ))}
          <label className="sr-only" htmlFor={`${id}-goal`}>
            {t.customGoal}
          </label>
          <input
            id={`${id}-goal`}
            type="number"
            inputMode="numeric"
            min={GOAL_MIN}
            max={GOAL_MAX}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={cn(field, "tabular h-11 w-24 text-center")}
          />
        </div>
        <p className="text-13 text-muted">{t.goalHelp}</p>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="press h-12 rounded-pill bg-fg px-6 font-semibold text-bg hover:bg-hover">
          {t.save}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="press h-12 rounded-pill px-5 font-medium hover:bg-card">
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
