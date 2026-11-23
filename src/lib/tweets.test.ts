import assert from "node:assert/strict";
import { test } from "node:test";

import { beijingDayRange } from "./beijing-time.ts";
import { classifyTweet, normalizeUsername, parseTweetDate, summarizeDay } from "./tweets.ts";

test("parses X's classic timestamp", () => {
  assert.equal(
    new Date(parseTweetDate("Tue Dec 10 07:00:30 +0000 2024")).toISOString(),
    "2024-12-10T07:00:30.000Z",
  );
  assert.ok(Number.isNaN(parseTweetDate("nonsense")));
});

test("classifies each kind", () => {
  assert.equal(classifyTweet({ isRetweet: true, isReply: true }), "retweet");
  assert.equal(classifyTweet({ isReply: true, isQuote: true }), "reply");
  assert.equal(classifyTweet({ quoted_tweet: {} }), "quote");
  assert.equal(classifyTweet({}), "original");
});

test("counts only tweets inside the Beijing day, once each", () => {
  const range = beijingDayRange("2026-11-23");
  const { counts, tweets } = summarizeDay(
    [
      { id: "1", createdAt: "Sun Nov 22 16:00:00 +0000 2026" }, // 00:00 Beijing: in
      { id: "2", createdAt: "Sun Nov 22 15:59:59 +0000 2026" }, // previous day
      { id: "3", createdAt: "Mon Nov 23 15:59:59 +0000 2026", isReply: true },
      { id: "3", createdAt: "Mon Nov 23 15:59:59 +0000 2026", isReply: true }, // duplicate
      { id: "4", createdAt: "Mon Nov 23 16:00:00 +0000 2026" }, // next day
      { id: "5", createdAt: "Mon Nov 23 08:00:00 +0000 2026", isRetweet: true },
    ],
    range,
  );
  assert.deepEqual(counts, { total: 3, original: 1, reply: 1, retweet: 1, quote: 0 });
  assert.deepEqual(tweets.map((t) => t.id), ["3", "5", "1"]);
});

test("normalizes handles and profile links", () => {
  assert.equal(normalizeUsername("@elonmusk"), "elonmusk");
  assert.equal(normalizeUsername(" https://x.com/Jack?s=20 "), "Jack");
  assert.equal(normalizeUsername("twitter.com/naval/status/1"), "naval");
  assert.equal(normalizeUsername("bad name"), null);
  assert.equal(normalizeUsername("waytoolongusername123"), null);
});
