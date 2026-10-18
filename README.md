# BorderMath

Never overstay: visa-day math for nomads.

BorderMath plans a year of border crossings, counts Schengen days with the real 90-in-any-180 rule, and flags stays that run past sourced limits for the UK, the United States, Canada, Japan, Thailand, Mexico, and the UAE.

## Features

- Rolling Schengen window. Entry day and exit day both count. Overlapping stays count once. A 2-day safety buffer warns above 88 days without treating 89 or 90 as an overstay.
- Trips saved per account with Clerk. Postgres via `DATABASE_URL` (Neon or Supabase). If that variable is missing, the app uses an in-memory store and labels it **Demo data**.
- Visa rules live in `data/visa-rules.json` with a source URL and a last-verified date. The file is the dataset, not a live embassy feed.
- Exchange rates from [Frankfurter](https://www.frankfurter.app/) (European Central Bank, no API key), cached for six hours.
- Overstay, full-stay, passport-validity, and visa-required alerts.
- `.ics` export for a trip, including a Schengen cap event when that trip itself breaks 90/180.
- Timeline of the year and charts of the rolling window.
- Server-side mobility brief. Model calls never run in the browser. With no `ANTHROPIC_API_KEY`, the brief is a labeled sample built from the same day counts.

## Stack

Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn-style UI, lucide, framer-motion, Clerk, Drizzle ORM, Postgres, Recharts, Zod.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

`npm run dev` uses Clerk keyless mode when the publishable and secret keys are unset. App routes are protected with `clerkMiddleware`. A production server without those keys still serves the marketing site, and `/demo` only when `DEMO_SCREENSHOT=1`. Set the Clerk keys before a production deploy that should accept sign-in.

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

### Database

```bash
# DATABASE_URL must be set
npm run db:migrate
SEED_USER_ID=user_xxx npm run db:seed
```

`npm run db:seed` inserts the demo nomad year only when that user has no trips. Without `DATABASE_URL`, memory mode already serves the same year and the seed script writes nothing.

### Screenshots

```bash
DEMO_SCREENSHOT=1 npm run start
# in another shell, against that server
SCREENSHOT_URL=http://127.0.0.1:3000 npm run screenshot
```

`DEMO_SCREENSHOT=1` opens `/demo` without auth so a portfolio shot can show the logged-in workspace. Leave it unset in production. The route is 404 otherwise.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No in dev | Clerk. Keyless mode when empty. |
| `CLERK_SECRET_KEY` | No in dev | Clerk secret. Server only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Defaults in `.env.example`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | |
| `DATABASE_URL` | No | Postgres. Memory demo store when empty. |
| `ANTHROPIC_API_KEY` | No | Server-side briefs. Sample brief when empty. |
| `AI_MODEL` | No | Defaults to `claude-sonnet-4-5`. |
| `UPSTASH_REDIS_REST_URL` | No | Shared rate limit for briefs. |
| `UPSTASH_REDIS_REST_TOKEN` | No | |
| `DEMO_SCREENSHOT` | No | Set to `1` only while shooting `/demo`. |
| `SEED_USER_ID` | No | Clerk user id for the seed script. |
| `APP_URL` | No | Absolute URL for metadata. |

Do not put model keys in `NEXT_PUBLIC_*` or a Vite `define` block. AI requests are signed-in, Zod-checked, rate-limited, and capped at 800 output tokens.

## What is real, and what is a sample

Real: the 90/180 engine, the JSON rule file, Frankfurter rates, alerts, calendar export, Clerk sessions, and Postgres when configured.

Sample: the mobility brief when `ANTHROPIC_API_KEY` is unset, and the whole workspace when `DATABASE_URL` is unset (labeled Demo data). The seeded year belongs to a fictional traveler, Maya Chen, so the product has something to click through.

Rules are summaries for planning. They are not an admission decision.
