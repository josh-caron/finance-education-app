# Finance Education App

A gamified web and mobile app that teaches personal finance (stocks, bonds, credit,
retirement) through short lessons and interactive exercises, in the style of Duolingo.

What sets it apart from generic finance content is **computed-answer exercises**: the
learner calculates a bond's yield or a compounding balance rather than picking from a
list. Content is structured as a skill tree of units → lessons → exercises so it stays
expandable.

CIS4914 Senior Design, Fall 2026 · Joshua Caron and Gustavo Gabaldon · Advisor: Arunava Banerjee

## Stack

| Layer    | Choice                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| Client   | Expo (React Native + Expo Router), for web, iOS and Android from one codebase |
| API      | Hono on Cloudflare Workers                                                    |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM                                        |
| Auth     | Better Auth (email + password)                                                |

All four have free tiers generous enough to run the project through the semester and beyond.

## Layout

```
apps/
  mobile/     Expo app: screens, navigation, exercise UI
  api/        Hono API on Workers: auth, content, progress
packages/
  core/       Shared domain logic: content types, grading, XP/streaks, finance math
  db/         Drizzle schema and generated D1 migrations
  content/    The authored course (units, lessons, exercises)
docs/
  architecture.md   How the pieces fit and why
  workflow.md       Branching, reviews, and the definition of done
```

`packages/core` is the spine: the client and the API import the same grading and XP rules,
so a score can never mean two different things on the two sides.

## Getting started

Requires **Node 22+** (Wrangler 4 will not run on older versions) and pnpm 10.

```bash
nvm use          # reads .nvmrc
pnpm install
```

Set up the local database and the API secret:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars   # then put a real secret in it
pnpm db:migrate:local
pnpm db:seed:local
```

Generate the secret with `openssl rand -base64 32`.

Run the two halves in separate terminals:

```bash
pnpm dev:api     # http://localhost:8787
```

```bash
pnpm dev:mobile  # press w for web, i for iOS, a for Android
```

The client reads its API URL from `EXPO_PUBLIC_API_URL`; copy `apps/mobile/.env.example`
to `apps/mobile/.env.local`. On a physical device, point it at your machine's LAN IP
rather than `localhost`.

## Everyday commands

```bash
pnpm test         # unit tests across the workspace
pnpm typecheck    # tsc across the workspace
pnpm format       # prettier
```

Changing the schema in `packages/db/src/schema` means regenerating and applying migrations:

```bash
pnpm db:generate
pnpm db:migrate:local
```

Changing the course in `packages/content` means reseeding:

```bash
pnpm db:seed:local
```

## Deploying

One-time, per Cloudflare account:

```bash
cd apps/api
npx wrangler d1 create fin-edu-db          # put the printed id in wrangler.jsonc
npx wrangler secret put BETTER_AUTH_SECRET
```

Then:

```bash
pnpm --filter @fin/api db:migrate:remote
pnpm --filter @fin/api db:seed:remote
pnpm --filter @fin/api deploy
```

Update `BETTER_AUTH_URL` and `TRUSTED_ORIGINS` in `wrangler.jsonc` to the deployed
origins before going live, or auth requests will be rejected as untrusted.
