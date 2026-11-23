import assert from "node:assert/strict";
import { test } from "node:test";

import { beijingDateKey, beijingDayRange, daysAgo, isDateKey, shiftDateKey } from "./beijing-time.ts";

test("a Beijing day starts at 16:00 UTC the day before", () => {
  const { start, end } = beijingDayRange("2026-11-23");
  assert.equal(new Date(start).toISOString(), "2026-11-22T16:00:00.000Z");
  assert.equal(new Date(end).toISOString(), "2026-11-23T16:00:00.000Z");
});

test("the date key follows Beijing, not UTC", () => {
  assert.equal(beijingDateKey(Date.parse("2026-11-22T15:59:59Z")), "2026-11-22");
  assert.equal(beijingDateKey(Date.parse("2026-11-22T16:00:00Z")), "2026-11-23");
});

test("shifting crosses month and year boundaries", () => {
  assert.equal(shiftDateKey("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDateKey("2026-02-28", 1), "2026-03-01");
});

test("daysAgo counts Beijing calendar days", () => {
  const now = Date.parse("2026-11-23T02:00:00Z"); // 10:00 in Beijing
  assert.equal(daysAgo("2026-11-23", now), 0);
  assert.equal(daysAgo("2026-11-20", now), 3);
});

test("isDateKey rejects impossible dates", () => {
  assert.equal(isDateKey("2026-02-30"), false);
  assert.equal(isDateKey("2026-2-3"), false);
  assert.equal(isDateKey("2026-02-03"), true);
});
