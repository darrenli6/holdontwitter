# Project context

Tweet Pulse: a daily tweet-count dashboard. Next.js 16, React 19, App Router, TanStack Query, Tailwind, Zod.

- No database and no auth. Settings (twitterapi.io key, daily goal, handles) live in `localStorage` (`src/lib/settings-store.ts`).
- `src/app/api/tweets/route.ts` relays twitterapi.io `last_tweets` with the caller's key and counts one Beijing day (UTC+8, `src/lib/beijing-time.ts`). It keeps a 60-second in-memory cache per key/account/day and nothing else.
- Requests are throttled to one per account and day per minute: `src/lib/request-cache.ts` (browser, localStorage) and the route's cache (server). Keep both when changing fetching.
- UI copy is English (default) and Chinese: every string lives in `src/lib/i18n.ts`; add both. API errors return a code that the client translates. README is bilingual (`README.md` / `README.zh-CN.md`): keep both in sync.

Skills live in `.agents/skills/`. Invoke with `$skill-name`.

Process skills (`poteto-mode` and the rest of `pstack`) are not in the repo: they come from the `pstack` plugin, installed on each machine.

## UI, craft, and motion

The design and motion skills are Emil Kowalski's (`emilkowalski/skills`). Skills marked "by name only" have `disable-model-invocation: true`: they never trigger on their own, so ask for them by name.

| Intent | Skill |
|---|---|
| Design system, `DESIGN.md`, audit / critique / polish, the invisible details | `$emil-design-eng` |
| Fix accessibility: names, keyboard, focus, contrast | `$fixing-accessibility` |
| Stress-test a screen with worst-case data | `$break-ui` |
| Phone feel: hover on touch, `100vh`, input zoom, safe areas | `$mobile-native` |
| Drag, swipe, sheets, swipe to dismiss | `$gestures` |
| Interruptible springs, materials, Apple-style motion | `$apple-design` |
| Name a motion effect | `$animation-vocabulary` |
| Implement a purposeful animation | `$animate` |
| Several elements moving together: stagger, sequence, crossfade | `$choreograph` |
| Janky animation, frame budget, which property to animate | `$animation-performance` |
| Audit the motion of the whole app and plan fixes | `$improve-animations` |
| Find places that should animate (read-only) | `$find-animation-opportunities` |
| Remove motion the interface does not need | `$remove-animations` |
| Review animation code against the craft bar (by name only) | `$review-animations` |
| Sonner toasts: setup, styling, troubleshooting | `$ask-sonner` |
| Build several versions of a UI piece behind a picker (by name only) | `$prototype` |
| Pick a frontend library for a job (by name only) | `$pick-ui-library` |
| Turn this session's design corrections into rules (by name only) | `$learn-taste` |

`$animate-expo` (React Native) and `$write-swift` come with the set but do not apply to this web app.

## Stack

| Intent | Skill |
|---|---|
| React / Next performance | `$vercel-react-best-practices` |
| React Doctor audit (`npm run doctor`) | `$react-doctor` |
| Component composition APIs | `$vercel-composition-patterns` |
| Visual QA in a real browser | `$agent-browser` |
| Instant navigation under Cache Components | `$next-cache-components-optimizer` |
| Vercel deploys, env, logs, domains | `$vercel-cli` |
| Named local HTTPS URLs | `$portless` |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
