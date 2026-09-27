# Leaderboard and progression test results

Tested September 27, 2026, locally on Windows with Node 24.19.0.

## Result

Normal sequential progression passes. Two concurrency defects remain open and
can inflate leaderboard XP. This is not an all-clear result.

| Check | Result |
| --- | --- |
| Existing API integration suite, using real ephemeral D1 and real authentication | 79 passed |
| Core, content, and mobile helper suites | 168 passed, 1 failed |
| SQLite leaderboard and content seed tests | 18 passed |
| Added progression-to-leaderboard journey | 1 passed |
| Added concurrent submission/completion tests | 2 failed |
| API, API test, and mobile TypeScript checks | Passed after harness fix |

Existing coverage includes tied ranks, top ten and nearby rows, weekly calendar
boundaries, zero-XP exclusion, privacy opt-out/in, first-attempt XP bonuses,
practice replays, best scores, prerequisites, learner isolation, and streaks.
The new journey verifies 100 XP reaches level 2, both boards agree with the
profile, prerequisites unlock, practice adds no XP, and a new week resets weekly
rank eligibility while preserving all-time XP.

## Open defects

1. **Concurrent correct answers award XP twice.** Two simultaneous correct
   submissions for the same unsolved exercise both return 200. All-time XP is
   30 instead of 15. The route reads previous attempts before its write batch,
   allowing both requests to decide the exercise has never been solved.
2. **Concurrent completions award the completion bonus twice.** After earning
   45 exercise XP, two simultaneous completion requests produce 85 total XP
   instead of 65. Both requests can read the lesson as unfinished before either
   writes its completion. Atomic write batches do not make the preceding reads
   atomic. Both defects need database-level concurrency protection.
3. **The live local-server locked-lesson message test fails.** It expects a
   locked lesson response but receives the message for a missing resource.
   The lesson and exercise IDs exist in the source content. The local server's
   content/version has not been confirmed; stale seeding is a possibility,
   not an established cause.

Reproduction tests for the concurrency defects are in
`apps/api/test/progression-leaderboard.test.ts`. They intentionally remain failing
until the application defects are fixed. Application scoring code was not changed.

## Test infrastructure correction

The API harness originally converted a file URL using `.pathname`, yielding an
invalid `/C:/...` path on Windows and preventing all API tests from running.
It now uses Node's `fileURLToPath`, preserving support for spaces and Windows
drive letters. The existing 79 API tests passed after this correction.

## Execution and limits

The installed pnpm 11 attempted automatic dependency installation and aborted
without a terminal; the project specifies pnpm 10.20.0. Tests were instead run
with the installed Node/Vitest executables. Test workers required execution
outside the sandbox. No dependency reinstall or production deployment was done.

Commands from the repository root:

```text
node node_modules/vitest/vitest.mjs run packages/core/src packages/content/src apps/mobile/src/lib
node --experimental-strip-types --test apps/api/src/__tests__/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit -p apps/api/test/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json
```

Commands from `apps/api`:

```text
node ../../node_modules/vitest/vitest.mjs run
node ../../node_modules/vitest/vitest.mjs run test/progression-leaderboard.test.ts --maxWorkers=1
```

This pass exercised domain logic, SQL, API routes, and client error translation.
It did not perform interactive browser or native-device visual testing.
