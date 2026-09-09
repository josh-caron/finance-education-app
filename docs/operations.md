# Operations

How to reach each piece of the stack by hand, and when you would want to.

Everything here assumes Node 22+ (`nvm use`) and, for anything marked remote, a
Cloudflare login (`npx wrangler login`). Run wrangler commands from `apps/api`.

## First deploy

Once per account. The Worker has to exist before a secret can be attached to it,
so the order matters.

One Worker serves both halves: the API on `/api/*` and `/health`, and the Expo
web export on everything else. That means one deploy, and the client and API
share an origin.

Deploy from the repo root, so the web bundle is rebuilt and checked first:

```bash
pnpm deploy:api
```

Note the URL it prints, then set the signing secret. Generate the value with
`openssl rand -base64 32` and paste it at the prompt. It is never stored in the
repo and cannot be read back afterwards.

```bash
npx wrangler secret put BETTER_AUTH_SECRET
```

Put the printed subdomain into `BETTER_AUTH_URL` in `wrangler.jsonc`, then
deploy again.

This step is not optional. Better Auth compares the request's `Origin` header
against `BETTER_AUTH_URL` plus `TRUSTED_ORIGINS`, and a mismatch fails with
`Invalid origin` on the sign-in form. It reads as broken auth rather than bad
config, so it is worth recognising: if sign-in fails immediately on a fresh
deploy, check this first.

`TRUSTED_ORIGINS` only needs cross-origin callers. The web client is same-origin,
so it is just the native app's `fineduapp://` scheme.

Finally, create the schema and content in the remote database:

```bash
pnpm --filter @fin/api db:migrate:remote
```

```bash
pnpm --filter @fin/api db:seed:remote
```

## Routine deploy

```bash
pnpm deploy:api
```

That rebuilds the web bundle with `--clear` and no dotenv, runs
`scripts/check-web-bundle.mjs`, then deploys. The check exists because a warm
Metro cache once produced a bundle that resolved `config.ts` and baked
`http://localhost:8787` into the shipped JavaScript. Deploying that gives every
visitor an app calling a machine they cannot reach, and it fails only at runtime.

To deploy the Worker without rebuilding the client:

```bash
cd apps/api && npx wrangler deploy
```

Migrations are deliberately not part of deploy. Apply them yourself when a
release contains one, before deploying the code that expects the new columns.

## D1

Local and remote are separate databases. `--local` is a SQLite file under
`apps/api/.wrangler`; `--remote` is the real thing. Every command defaults to
local, which is the safe default but also a common source of "why did nothing
change".

Query either one:

```bash
npx wrangler d1 execute fin-edu-db --local --command "SELECT email, created_at FROM user"
```

```bash
npx wrangler d1 execute fin-edu-db --remote --command "SELECT count(*) FROM learner_profiles"
```

_Why you would:_ checking whether a learner's XP actually moved, confirming a
migration landed, or seeing why the skill tree is empty (usually an unseeded
database).

For heavier local poking, open the SQLite file directly. This is read-write, so
prefer it for reads and use wrangler for writes:

```bash
sqlite3 "$(find apps/api/.wrangler/state/v3/d1 -name '*.sqlite' | head -1)" ".tables"
```

Reset local data and start clean:

```bash
rm -rf apps/api/.wrangler/state/v3/d1 && pnpm setup:local
```

## Migrations

Never hand-edit a generated file. Change `packages/db/src/schema`, then:

```bash
pnpm db:generate
```

Apply locally, then remotely when you release:

```bash
pnpm db:migrate:local
```

Data backfills are the exception to "never hand-write": drizzle-kit only
generates structural changes, so a backfill goes in its own numbered file. See
`0002_backfill_completions.sql`.

_Why you would:_ CI fails with "schema changed without a generated migration"
when you edit the schema and forget this.

## Workers

Live logs from the deployed Worker, including `console.error` from the API's
error handler:

```bash
npx wrangler tail
```

_Why you would:_ a request works locally and 500s in production. The tail shows
the actual thrown error, which the API deliberately does not return to clients.

Check what is deployed, and roll back if a release is bad:

```bash
npx wrangler deployments list
```

```bash
npx wrangler rollback
```

Build and validate config without deploying:

```bash
npx wrangler deploy --dry-run
```

_Why you would:_ confirm a config change is valid before it reaches production.

## Secrets

There is exactly one: `BETTER_AUTH_SECRET`. Nothing else in the project needs
credentials.

```bash
npx wrangler secret list
```

_Why you would:_ auth failing across the board after a deploy usually means the
secret was never set on this Worker. `list` shows names, never values.

Rotating it signs out every existing session, which is fine and occasionally
what you want:

```bash
npx wrangler secret put BETTER_AUTH_SECRET
```

Locally the same secret lives in `apps/api/.dev.vars`, written by `pnpm setup:local`.
Each developer generates their own; there is nothing to share.

## The API

The whole surface is curl-able. Sign in, keeping the session cookie:

```bash
curl -s -c /tmp/fin.txt -X POST http://localhost:8787/api/auth/sign-in/email -H 'Content-Type: application/json' -d '{"email":"you@example.com","password":"password123"}'
```

Then call anything as that learner:

```bash
curl -s -b /tmp/fin.txt "http://localhost:8787/api/progress/me?localDay=$(date +%F)"
```

_Why you would:_ separating a UI bug from an API bug in one step, and checking
that lesson payloads carry no answer keys.

## Expo

```bash
pnpm dev:mobile
```

Press `w` for web, `i` for iOS, `a` for Android. On a physical device set
`EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local` to your machine's LAN IP;
`localhost` there means the phone itself.

When Metro serves something stale, which it does after dependency changes:

```bash
npx expo start --clear
```

Build the static web bundle the way CI would:

```bash
pnpm --filter @fin/mobile build:web
```

## CI

```bash
gh run list --branch main --limit 5
```

```bash
gh run watch <run-id> --exit-status
```

_Why you would:_ CI is the only place the project is built on a clean machine,
so it catches missing files that work locally because they are already on disk.
