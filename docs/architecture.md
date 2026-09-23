# Architecture

## Shape

```
Expo client (web / iOS / Android)
        |  fetch + session cookie or SecureStore token
        v
Hono API on Cloudflare Workers
        |  Drizzle
        v
D1 (SQLite)
```

Three packages sit between them:

- **`@fin/core`** holds content types, grading, XP/streak rules and finance math. No I/O, no
  framework. Imported by both the client and the API.
- **`@fin/db`** holds the Drizzle schema and generated migrations. Imported by the API.
- **`@fin/content`** holds the authored course, validated against `@fin/core`'s schema at
  import time.

## Decisions worth knowing

### Grading happens on the server

`@fin/core`'s `gradeExercise` is pure and shared, but the client never grades for score.
`/api/content/lessons/:id` runs every exercise through `toPublicExercise`, which strips
`correctChoiceId`, `correctOrder`, `answer`, `tolerance` and `explanation` before the
response leaves the Worker. A learner with devtools open cannot read the answer off the
wire. The explanation comes back with the grade instead, once they have answered.

`packages/core/src/__tests__/public.test.ts` asserts the stripping, so a new exercise
type cannot quietly start leaking its key.

### Lesson completion is derived, not reported

`POST /api/progress/lessons/:id/complete` does not accept a score from the client. It
reads back the `exercise_attempts` rows for that learner and lesson, finds each exercise's
first correct attempt, and computes XP from that. A client that claims a perfect run it
did not earn gets a 409.

### Content lives in TypeScript, not the database

`packages/content` is the source of truth. `apps/api/scripts/generate-seed.ts` renders it
to SQL, which Wrangler applies to D1. Two things follow: content changes are code-reviewed
like code, and computed answers are derived with the same `@fin/core` finance helpers the
lesson is teaching, so an exercise and its answer key cannot drift apart.

Seeding upserts content by id rather than replacing it. Attempts and lesson progress
reference lessons and exercises with `ON DELETE CASCADE`, so a delete-and-reinsert seed
wiped every learner's history on each content update while leaving their total XP, which
would have let everyone earn it again. The corollary is that ids are permanent: renaming
one looks like a removal plus an addition, and removed content does take its progress
with it. `apps/api/src/seed-sql.ts` explains the reordering detail.

Exercise rows keep the whole exercise as a JSON `payload` column rather than one table per
kind. Adding an exercise type is then a change to `@fin/core`'s union and the UI, with no
migration.

### Streaks use the learner's local day

The client sends `localDay` as `YYYY-MM-DD` on completion. Storing a UTC timestamp would
break a streak for anyone studying late at night in a western timezone. `advanceStreak`
treats same-day activity as a no-op, consecutive days as an extension, and any gap as a
reset.

Because the day comes from the client, the API only accepts a real calendar date within
one day of its own UTC date, which covers every timezone. Without that, a learner could
replay one lesson with consecutive future dates and build any streak they liked.

### One Worker serves the client and the API

The Expo web export is uploaded as static assets on the same Worker that serves
the API, with `run_worker_first` claiming `/api/*` and `/health`. The client and
API therefore share an origin, which removes CORS from the web path entirely and
makes the session cookie first-party.

It also removes a circular dependency: the web build needs no API URL, because
`config.web.ts` defaults to an empty base and every request goes out relative.
Only a native build needs an absolute `EXPO_PUBLIC_API_URL`, since a binary has
no origin to fall back on.

### Failures are explained, not just reported

`describeError` in the client turns a failure into something a learner can act on. A
locked lesson, an ended session, a rate limit and an unreachable server each need a
different response from the person reading it, and all four used to read "could not
submit, try again". `ApiError` carries the status and any `Retry-After`, and a thrown
`Error` is never shown as-is, because its message is written for us rather than for a
learner.

### Auth is split by platform

React Native has no cookie jar, so `@better-auth/expo` stores the session token in
`expo-secure-store` and replays it per request. SecureStore does not exist on web, so
`src/lib/auth-client.web.ts` drops the plugin and lets the browser handle the cookie.
Metro picks the right file by extension. The two files must export the same names.

### Locked units are enforced by the API

A unit opens once every lesson in each of its prerequisite units is completed. The rule is
`isUnitUnlocked` in `@fin/core`, and the API applies it in two places: the skill tree reports
it, and the answer and completion routes refuse a locked lesson with a 403. Hiding locked
units in the UI alone would let anyone calling the API directly earn XP and leaderboard rank
from them.

Reading a locked lesson is still allowed, so a learner can preview what comes next. Only
earning from it is blocked.

### Rate limiting is a single SQL statement

Counters are kept in D1 and advanced by one
`INSERT .. ON CONFLICT DO UPDATE .. RETURNING`. Doing it in one statement is the
whole point: a read followed by a write lets two concurrent requests observe the
same count and both pass. Verified with 80 requests at 40-way concurrency
against a limit of 60, which lets exactly 60 through.

Better Auth ships a rate limiter, but its default storage is a module-level Map.
Workers recycle isolates and spread requests across them, so that counter resets
unpredictably and each isolate keeps its own. It would look like rate limiting
without being it.

The limiter runs before the session middleware, so a flood is rejected without a
session lookup or a password hash. That is also why building the database client
is its own middleware: the limiter needs storage before any auth work happens.

Windows are fixed rather than sliding, and the window length is part of the
storage key, so changing a limit cannot inherit a count from the old rule.

### One D1 batch instead of a transaction

D1 has no interactive transactions. Lesson completion writes the profile, the lesson row
and the daily rollup through `db.batch()`, so they cannot land partially.

## Data model

```
user ──< session, account            (Better Auth)
user ──  learner_profiles            XP, streak
user ──< lesson_progress             per-lesson status and best score
user ──< exercise_attempts           append-only submission log
user ──< daily_activity              per-day rollup for streaks and the weekly board

units ──< lessons ──< exercises      the course
units ──< unit_prerequisites         skill-tree edges
```

`daily_activity` exists so the weekly leaderboard and streak repair never have to scan the
attempt log.

## API surface

| Method | Path                                       | Auth     | Purpose                                |
| ------ | ------------------------------------------ | -------- | -------------------------------------- |
| GET    | `/health`                                  | none     | Liveness                               |
| \*     | `/api/auth/*`                              | none     | Better Auth (sign up/in/out)           |
| GET    | `/api/content/units`                       | optional | Skill tree, with progress if signed in |
| GET    | `/api/content/lessons/:lessonId`           | optional | Lesson with answer keys stripped       |
| GET    | `/api/progress/me`                         | required | XP, level, streak, lesson statuses     |
| PATCH  | `/api/progress/me`                         | required | Settings: `showOnLeaderboard`          |
| POST   | `/api/progress/lessons/:lessonId/attempts` | required | Grade one submission                   |
| POST   | `/api/progress/lessons/:lessonId/complete` | required | Award XP, advance streak               |
| GET    | `/api/leaderboard?period=all-time\|weekly` | required | Top 10 and ranks around the caller     |

## Leaderboard (backlog 8, Gustavo)

Signed-in learners can compare display names and XP globally. The response contains
no emails or account IDs. Only learners with positive XP in the selected period are
ranked; an unranked caller gets `currentUser: null`. Friends-only rankings are not
implemented.

Learners can hide themselves with the switch on Profile, which sets
`learner_profiles.hide_from_leaderboard` through `PATCH /api/progress/me`. Hidden
learners are removed before ranking, so they take no rank and nobody else's rank has a
gap; a hidden caller gets `currentUser: null` and `hidden: true`. The name shown is the
one entered at sign-up, capped at 40 characters by `checkDisplayName` in `@fin/core`,
which both sign-up and rename go through. Rows stored before the cap are shortened for
display.

All-time scores come from `learner_profiles.total_xp`. Weekly scores sum
`daily_activity.xp_earned` in a Monday-inclusive, next-Monday-exclusive date window.
The server selects the week using UTC; activity uses each learner's existing local
date labels. This is a calendar-date comparison, not a precise UTC timestamp window.
The UI states the convention. No data is deleted when the displayed week changes.

SQLite window functions rank the full population before selecting the first ten
rows and up to two rows on either side of the caller. Equal XP earns equal ranks
(1, 1, 3); user ID breaks ties only for stable display order, including ties at the
top-ten cutoff. The response contains at most 15 rows, without duplicates between
the top list and the nearby list. Requests default to `all-time`; other period
values receive 400 and unauthenticated requests receive 401. Responses are private
and not cacheable.

The client refreshes on tab focus, every minute, and on manual refresh. Its query
cache is scoped to the signed-in user and period. Loading, retry, empty and
unranked states are included. No migration or reseeding is required.

`pnpm --filter @fin/api test` runs SQLite-backed ranking tests with Node's built-in
test runner. They cover ties, zero XP, nearby ranks, absent callers, bound parameters,
weekly aggregation, week boundaries, and date rollover. Before merging, verify
both tabs and a completed lesson's XP update on web and a native device.

## Not built yet

- **Email in production.** Verification and password reset are built and tested, but
  nothing is sent until the project domain is verified in Resend and `RESEND_API_KEY` is
  set. Steps are in `docs/operations.md`.
- **Native sign-in on a device.** Untested, and likely needs the Expo Go origin trusted.
  See `docs/known-issues.md`.
- **More content (7).** Three units are authored: budgeting and saving, banking and
  emergency savings, and money basics.
