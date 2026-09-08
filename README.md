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
  operations.md     Deploying, databases, logs, secrets: the runbook
  workflow.md       Branching, reviews, and the definition of done
```

`packages/core` is the spine: the client and the API import the same grading and XP rules,
so a score can never mean two different things on the two sides.

## Getting started

Requires **Node 22+** (Wrangler will not run on older versions) and pnpm 10.

```bash
nvm use
```

```bash
pnpm install
```

```bash
pnpm setup:local
```

`pnpm setup:local` writes the git-ignored env files, generating a signing secret on
your machine, then migrates and seeds the local database. It touches no cloud
services, so you do not need a Cloudflare account to run the project. It is safe
to re-run and will not overwrite env files you already have.

Then run the two halves in separate terminals:

```bash
pnpm dev:api
```

```bash
pnpm dev:mobile
```

The API serves on `http://localhost:8787`; press `w` in the Expo terminal for
web. On a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local`
to your machine's LAN IP rather than `localhost`.

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

## Deploying and everything else operational

See [docs/operations.md](docs/operations.md). It covers the first deploy, routine
deploys, querying either database, tailing production logs, rotating the secret,
and rolling back, with a note on why you would need each.

Architecture and the decisions behind it: [docs/architecture.md](docs/architecture.md).
How we work: [docs/workflow.md](docs/workflow.md).
