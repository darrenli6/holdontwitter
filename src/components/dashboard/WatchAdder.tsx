"use client";

import { useId, useState } from "react";

import { useT } from "@/lib/i18n";
import { addWatched } from "@/lib/settings-store";

export function WatchAdder() {
  const t = useT();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    // Accept several at once: "a, b c" or pasted profile links.
    const inputs = value.split(/[\s,，]+/).filter(Boolean);
    const failed: string[] = [];
    let duplicate = false;
    for (const input of inputs) {
      const result = addWatched(input);
      if (!result.ok) {
        if (result.reason === "duplicate") duplicate = true;
        else failed.push(input);
      }
    }
    setValue(failed.join(" "));
    setError(
      failed.length
        ? t.unrecognized(failed)
        : duplicate && inputs.length === 1
          ? t.alreadyAdded
          : null,
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-1.5">
      <div className="flex gap-2">
        <label htmlFor={`${id}-handle`} className="sr-only">
          {t.addHandleLabel}
        </label>
        <div className="relative grow">
          <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-muted">@</span>
          <input
            id={`${id}-handle`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t.addHandlePlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-11 w-full rounded-pill border border-line bg-field pl-9 pr-4 text-base outline-none transition-colors duration-120 focus:border-fg"
          />
        </div>
        <button type="submit" className="press h-11 shrink-0 rounded-pill bg-fg px-5 font-semibold text-bg hover:bg-hover">
          {t.add}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="status" className="px-4 text-13 text-err-line">
          {error}
        </p>
      )}
    </form>
  );
}
