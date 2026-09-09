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

Exercise rows keep the whole exercise as a JSON `payload` column rather than one table per
kind. Adding an exercise type is then a change to `@fin/core`'s union and the UI, with no
migration.

### Streaks use the learner's local day

The client sends `localDay` as `YYYY-MM-DD` on completion. Storing a UTC timestamp would
break a streak for anyone studying late at night in a western timezone. `advanceStreak`
treats same-day activity as a no-op, consecutive days as an extension, and any gap as a
reset.

### One Worker serves the client and the API

The Expo web export is uploaded as static assets on the same Worker that serves
the API, with `run_worker_first` claiming `/api/*` and `/health`. The client and
API therefore share an origin, which removes CORS from the web path entirely and
makes the session cookie first-party.

It also removes a circular dependency: the web build needs no API URL, because
`config.web.ts` defaults to an empty base and every request goes out relative.
Only a native build needs an absolute `EXPO_PUBLIC_API_URL`, since a binary has
no origin to fall back on.

### Auth is split by platform

React Native has no cookie jar, so `@better-auth/expo` stores the session token in
`expo-secure-store` and replays it per request. SecureStore does not exist on web, so
`src/lib/auth-client.web.ts` drops the plugin and lets the browser handle the cookie.
Metro picks the right file by extension. The two files must export the same names.

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
user ──  learner_profiles            XP, streak, timezone
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
| GET    | `/api/content/units/:unitId/lessons`       | optional | Lesson list for one unit               |
| GET    | `/api/content/lessons/:lessonId`           | optional | Lesson with answer keys stripped       |
| GET    | `/api/progress/me`                         | required | XP, level, streak, lesson statuses     |
| POST   | `/api/progress/lessons/:lessonId/attempts` | required | Grade one submission                   |
| POST   | `/api/progress/lessons/:lessonId/complete` | required | Award XP, advance streak               |
| GET    | `/api/leaderboard`                         | required | Not implemented (backlog 8)            |

## Not built yet

Tracked against the pitch backlog:

- **Leaderboard (8, Gustavo)**. API route and screen are stubbed. The data is already
  there; it is a query, not a schema change.
- **XP/streak UI (5, Josh)**. The rules and the API are done; the profile screen shows a
  plain progress bar where the real treatment goes.
- **Email verification and password reset**. Needs an email provider, so sign-up
  currently works without one.
- **Content beyond the starter unit (4, 7)**. `money-basics` exists to exercise all three
  exercise types end to end.
