# Working agreement

Two developers, one repo, a semester to ship. The point of this file is that neither of us
has to guess.

## Branching

`main` is always deployable. Work happens on a branch named `<initials>/<what>`, e.g.
`jc/auth-flow` or `gg/leaderboard-query`.

Open a pull request into `main`. CI has to be green and the other person has to review it.
"It works" is not a review; the reviewer should be able to explain the change afterward.

## Definition of done

A backlog item is done when:

- it works on web and on at least one native target,
- `pnpm test` and `pnpm typecheck` pass,
- new domain rules in `@fin/core` have tests,
- schema changes ship with a generated migration,
- the README or `docs/architecture.md` is updated if the change alters how someone runs or
  reasons about the project.

## Where things go

Before adding code, check whether it belongs in a package rather than an app:

- A rule about **what a correct answer is, or what something is worth** → `@fin/core`.
  Both the client and the API need to agree, and disagreement here is a scoring bug.
- A **table or column** → `@fin/db`, then `pnpm db:generate`.
- A **lesson or exercise** → `@fin/content`, then `pnpm db:seed:local`.
- Everything else → the app that uses it.

## Migrations

Never hand-edit a generated file in `packages/db/drizzle`. Change the schema, run
`pnpm db:generate`, and commit the generated SQL with the schema change in the same commit.
Applying a migration to the deployed database is a deliberate step, not part of deploy.

Data backfills are the exception: drizzle-kit only generates structural changes, so a
backfill goes in its own hand-written file with the next number and a comment saying why.
Wrangler applies every file in the folder in order; drizzle-kit ignores files it did not
create, so `pnpm db:generate` leaves them alone.

## Meetings

Weekly as a team, biweekly with our advisor, per the pitch. Showcase is 11/19 and
deliverables are due 12/2; work backwards from those.
