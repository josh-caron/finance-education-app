# Money Basics: Budgeting and Saving

Unit 1: five lessons and 25 exercises, ordered before the existing starter
unit. The compounding and credit lessons and their IDs are preserved.

Learners practice comparing income with expenses, distinguishing needs and wants
in context, balancing a monthly plan, and calculating contributions to a savings
goal. Each lesson has teaching copy and five exercises. All exercises explain the
answer; numeric exercises also have hints. Dollar answers accept a one-cent
tolerance. Savings examples explicitly exclude interest, fees, and withdrawals.

The sequence covers income and expenses, needs and wants, building a budget,
savings goals, and an applied review. The review connects a balanced monthly plan
to bill deadlines, an existing savings balance, and adjustments when costs rise.
It uses the same CFPB income-tracking, bill-calendar, cash-flow, and savings-plan
tools as the preceding lessons.

## Editorial references

The examples are original. Background concepts follow these CFPB resources:

- [Budgeting for needs and wants](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/budgeting-needs-and-wants/)
- [Your Money, Your Goals toolkit](https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/): savings plans, income tracking, and cash-flow budgets.

## Local preview and review

Run `pnpm db:seed:local` to publish authored content to the local database, then
restart or refresh the app. After the banking module, the course should contain
five units, 24 lessons, and 122 exercises. Seeding upserts course rows by id.
Removed exercise ids still cascade-delete their attempts. Do not seed production
as part of this preview.

Review all five lessons in order on web and a native target. Check a wrong answer
and its explanation, a corrected retry, numeric dollar entry, ordering controls,
lesson completion, and XP/profile updates. Verify that the two starter lessons
remain accessible. CI should run `pnpm test` and `pnpm typecheck` before merge.
