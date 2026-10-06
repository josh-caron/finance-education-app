# Unit 3 and retirement accounts

Unit 3, **Interest, Credit, and Inflation**, now has five lessons and 25 exercises.
Unit 4, **Retirement Foundations**, has five lessons and 25 exercises.
Unit 5, **Health Savings and Investment Choices**, has three lessons and 15 exercises.
The course currently contains five units, 24 lessons, and 122 exercises.

## Lesson and source map

| Unit | Lesson                              | Outcome                                                                       | Source                                                           |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 3    | Compounding                         | Separate earned interest from ending balance; apply annual growth.            | SEC Investor.gov compound interest                               |
| 3    | Credit Utilization                  | Calculate individual and combined ratios without predicting a score.          | CFPB credit-score guidance                                       |
| 3    | Understand Borrowing Costs          | Compare interest, fees, total repayment, and purchase grace periods.          | CFPB grace-period guidance; original stated-term math scenarios  |
| 3    | Inflation and Purchasing Power      | Compare price changes with savings growth and calculate today's-dollar value. | SEC Investor.gov asset-allocation guide: inflation risk          |
| 3    | Put Interest and Credit to Work     | Apply the unit's calculations and distinguish assumptions from forecasts.     | Synthesis of Unit 3 sources                                      |
| 4    | Why Start Planning Now?             | Relate affordable contributions and time to illustrative future balances.     | SEC Investor.gov compound interest and DOL retirement-plan guide |
| 4    | Workplace Contributions and Vesting | Calculate a capped employer match and the vested portion of a balance.        | DOL retirement-plan guide and IRS vesting guidance               |

The account lessons across Units 4 and 5 cover:

| Lesson                          | Outcome                                                                                         | Source                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 401(k): Traditional and Roth    | Distinguish payroll contribution tax treatment and shared deferral limits.                      | IRS 401(k) overview and Roth comparison chart               |
| Traditional IRA Basics          | Separate eligibility, contribution, deduction, and nondeductible basis.                         | IRS IRA FAQ and Topic 451                                   |
| Roth IRA Basics                 | Identify nondeductible contributions, qualified distributions, and combined IRA limits.         | IRS Topic 451, Roth comparison chart, and Publication 590-B |
| HSA: Health Costs Now and Later | Verify eligibility, document medical expenses, and distinguish nonmedical withdrawals after 65. | IRS Publication 969                                         |
| Accounts, Investments, and Fees | Separate account type from holdings; compare fees and concentration risk.                       | SEC Investor.gov investing and diversification resources    |
| Build an Account Plan           | Combine eligibility, plan terms, personal budget, tax treatment, and investments.               | Synthesis of these same primary sources                     |

Exact links and verification dates are in [research-sources.md](research-sources.md).
All stories and numerical scenarios are original. Rates are hypothetical, not
market forecasts. Fees, taxes, timing, and other activity are explicitly scoped.
No universal retirement targets or annual contribution-limit dollar amounts are
hardcoded. Personal savings targets are explicitly not legal limits. Account
lessons describe U.S. federal rules; state treatment may differ. Tax examples
state the assumed rate and eligibility. An HSA is taught as a health account
that can support later medical costs, not as an IRA.

## Scope and progression

The existing `money-basics` unit ID, its original two lesson IDs, and all five
original exercise IDs remain unchanged. The display title is clearer; existing
records stay attached to their IDs. Added exercises do not reset completed lesson
records. Learners who already completed the original two lessons must complete
the three new Unit 3 lessons to unlock retirement. They can revisit the earlier
lessons for the additional practice.

Unit 4 contains planning, workplace contributions, 401(k), traditional IRA, and
Roth IRA lessons. Unit 5 contains HSA, investments and fees, and the account review;
it unlocks after all five Unit 4 lessons are complete. All lesson and exercise IDs
are preserved, including the `retirement.*` IDs now assigned to Unit 5. Seeding
moves these lesson records without deleting their attempts or completion history.
Advanced topics such as
rollovers, conversions, required distributions, and detailed withdrawal exceptions
remain outside this beginner unit.

The Learn page initially expands the first unlocked unit with unfinished lessons.
Other units show compact summaries with completion counts and numbered unlock
requirements. Learners can expand or collapse any unit; expanding a locked unit
previews its lessons without enabling lesson navigation. When all units are
complete, all cards start collapsed. Explicit toggles persist while the Learn
screen remains mounted.

## Verification and local preview

Content tests cover each numeric key against an independently specified result
and misconception, every multiple-choice distractor, ordering keys, and unlocking
retirement only after all five Unit 3 lessons. The existing schema and integrity
tests validate the expanded course. Typecheck the content package and generate
the seed before loading it locally with `pnpm db:seed:local`.

Local seeding updates content by ID. It does not deploy to production. Full native
device verification remains a separate check; automated grading is not a claim of
completed device testing.

### Browser verification — original two-lesson release, October 5, 2026

Verified on the local web preview using a separate QA learner. Units 1 and 2
were marked complete as test setup; their lesson flows were not replayed in this
session. All 25 Unit 3 exercises and all ten retirement exercises were answered
through the UI, followed by a five-exercise retirement replay.

- Registration, sign-out, and sign-in succeeded.
- Wrong-answer feedback and retry worked; malformed numeric input was rejected.
- Numeric, multiple-choice, and tap-to-order submissions completed successfully.
- Retirement stayed locked until the final Unit 3 lesson; the celebration's
  continue action opened its first lesson.
- Completing the two currently available retirement lessons showed course completion.
- Progress survived a reload. Profile and weekly/all-time leaderboard totals
  agreed at 660 XP, level 4, and a one-day streak.
- The replay was labeled a practice run and kept total XP at 660.

Stale local server processes and a mismatched preview API port were resolved with
process-only settings. No application-code or saved environment changes were
needed. Native-device testing remains outstanding.

### Browser verification — account expansion, October 5, 2026

Using the same local QA account with the original two retirement lessons already
complete, all 30 added exercises were answered through the UI. The six new lessons
covered 401(k), traditional IRA, Roth IRA, HSA, investments and fees, and the review.
Existing completion records survived reseeding. No unit celebration appeared at
seven completed lessons; finishing the review showed eight of eight completed.
XP rose from 660 to 1,230, matching six first-pass lesson awards of 95 XP.

The expanded automated content and unlock suite passed 124 tests. Content
typechecking and Prettier checks passed. No production data was changed.

### Five-unit split and compact Learn page — October 5, 2026

Verified that the original QA learner retained all 24 completed lessons and
1,230 XP after the split, with all cards initially collapsed. Unit 5's moved
lessons retained their scores and links. Expanding and collapsing cards worked.
A new QA learner saw only Unit 1 expanded; expanded locked units had no navigable
lesson links. After preparing that learner one lesson short of Unit 4 completion,
finishing Roth IRA in the browser showed the five-lesson unit celebration and
announced Unit 5. Returning to Learn automatically collapsed Unit 4 and expanded
Unit 5. All 125 content/unlock tests, ten seed-preservation tests, and mobile and
content typechecks passed. Native-device checks remain outstanding.
