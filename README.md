<div align="center">

# Tweet Pulse

**English** · [简体中文](./README.zh-CN.md)

A daily tweet-habit dashboard. Set a goal (30 a day, or 20, or 50), and see at a glance how many times you've posted today: originals, replies, retweets and quotes, counted on **Beijing time**. Add the accounts you follow to see how often they post too.

Powered by [twitterapi.io](https://twitterapi.io/?ref=l30gc41t): bring your own API key.

</div>

---

## Features

- **Daily goal** – any number from 1 to 500, with 20 / 30 / 50 presets. Progress ring, "N to go", and a highlight when you hit it.
- **Breakdown** – originals, replies, retweets and quotes are counted separately. Each one counts toward the goal.
- **Beijing time** – a day runs 00:00–24:00 UTC+8, wherever you are. The date rolls over on its own at midnight.
- **Watch list** – add handles (`@name`, `name`, or a profile link; paste several at once) to see each account's count for the day.
- **Look back** – step back up to 14 days with ‹ ›.
- **7-day strip** – totals are saved in your browser each time a day loads, so the week view costs no extra API calls.
- **Auto refresh** – every 10 minutes while the tab is visible, or tap ⟳.
- **At most one request a minute** – each account and day is fetched from twitterapi.io at most once every 60 seconds. Reloading the page, clicking refresh again, or opening a second tab within the minute reuses the last result. The refresh and retry buttons show a countdown until they unlock.
- **Private by design** – the API key, goal and handles live only in your browser's `localStorage`. There is no database and no account.
- **English / 中文** – switch the dashboard language from the header (English by default, remembered in your browser).
- Light and dark themes. Works on phones.

## How it works

```
Browser (localStorage: key, goal, handles)
   │  GET /api/tweets?userName=…&date=YYYY-MM-DD   (x-api-key header)
   ▼
Next.js route handler  ──►  twitterapi.io  GET /twitter/user/last_tweets?includeReplies=true
   pages back 20 tweets at a time until it passes 00:00 Beijing time,
   then counts the tweets in [start, end) of that day
```

The route handler exists only because browsers can't call [twitterapi.io](https://twitterapi.io/?ref=l30gc41t) directly (CORS). It keeps results in memory for 60 seconds (to throttle requests), writes nothing to disk, and logs neither the key nor the tweets.

## Quick start

> **You need a twitterapi.io API key.** [Sign up at twitterapi.io](https://twitterapi.io/?ref=l30gc41t) and copy the key from the dashboard.

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, paste your [twitterapi.io](https://twitterapi.io/?ref=l30gc41t) API key, and enter your X username. That's all.

### Deploy

There are no environment variables to set, so it deploys to Vercel (or anywhere that runs Next.js) as is:

```bash
npm run build && npm start
```

## Cost and limits

[twitterapi.io](https://twitterapi.io/?ref=l30gc41t) bills **per tweet returned** (about $0.15 per 1,000 tweets at the time of writing). Each request returns up to 20 tweets, and the app pages back only as far as the start of the chosen day. For example, an account that posts 30 times a day costs about 2 requests per refresh.

- Today refreshes every 10 minutes while the page is open and visible. A finished past day is fetched once and kept.
- One account and day is never requested twice within 60 seconds. This applies in the browser (results are saved in `localStorage`, so reloads are free) and on the server (a 60-second in-memory cache per key, account and day, errors included).
- Free-tier keys are heavily rate limited. The server retries `429` responses with backoff, but long watch lists may still need a moment.
- Paging stops after 30 pages (~600 tweets). If a day has more, the card says the count is partial.

## Notes

- **Retweets**: twitterapi.io's docs don't say whether `last_tweets` always includes retweets. If they show up in the timeline, they're counted as retweets.
- **Protected or suspended accounts** can't be read and show an error on their card.
- The 7-day strip only has data for days you've opened in this browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Beijing day boundaries, tweet classification, handle parsing) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

To test without a real key, set `TWITTERAPI_BASE_URL` to a mock server (see `.env.example`).

## Stack

Next.js 16 (App Router) · React 19 · TanStack Query · Tailwind CSS · Zod · Sonner · data from [twitterapi.io](https://twitterapi.io/?ref=l30gc41t)

<sub>twitterapi.io links in this README are referral links.</sub>

## License

[MIT](./LICENSE)
