# Achievements, levels, and unit celebrations

XP, streaks, and the quadratic `levelForXp` curve are unchanged. This layer
adds named ranks, persistent badges, and a single celebration payload on
lesson completion.

## XP titles

Existing thresholds: 0, 100, 300, 600, 1000 XP for levels 1–5. Titles are
Money Rookie, Budget Builder, Savings Starter, Money Manager, Finance Pro.
Those values match one clean lesson, about one unit, two units, and a first
pass through the authored course.

## Achievements

Definitions live in `@fin/core`. Rows in `user_achievements` never delete.
Hints are opt-in via **Show hint**; `hint_used` is stored on each attempt.
Perfect Lesson uses the existing first-try attempt log. Top 10 uses the
existing weekly leaderboard query.
