import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { lt, sql } from 'drizzle-orm';
import { rateLimits, type Database } from '@fin/db';
import {
  decideRateLimit,
  GLOBAL_CLIENT,
  globalRateLimitRules,
  rateLimitKey,
  rateLimitRules,
  scopeForPath,
  type RateLimitDecision,
  type RateLimitRule,
} from '@fin/core';

import type { AppEnv } from './types';

/**
 * Consumes one request against `key` and reports whether it is allowed.
 *
 * The counter is advanced by a single INSERT .. ON CONFLICT DO UPDATE ..
 * RETURNING. Doing it in one statement is the point: a read followed by a write
 * would let two concurrent requests observe the same count and both pass.
 *
 * An expired window is reset in place by the CASE, so a key is reused rather
 * than accumulating a row per window.
 */
export async function consumeRateLimit(
  db: Database,
  key: string,
  rule: RateLimitRule,
  now = Math.floor(Date.now() / 1000),
): Promise<RateLimitDecision> {
  const windowEnd = now + rule.window;

  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, expiresAt: windowEnd })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.expiresAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
          expiresAt: sql`case when ${rateLimits.expiresAt} <= ${now} then ${windowEnd} else ${rateLimits.expiresAt} end`,
        },
      })
      .returning({ count: rateLimits.count, expiresAt: rateLimits.expiresAt });

    // Nothing returned should be impossible for an upsert, but treat it the
    // same as a storage failure rather than guessing at a count.
    if (!row) throw new Error('Rate limit upsert returned no row');

    return decideRateLimit(row.count, row.expiresAt, now, rule);
  } catch (error) {
    // Fail open. The limiter protects against abuse; it must not become the
    // thing that takes the API down. The most likely cause is the rate_limits
    // table being absent because a deploy landed before its migration, and
    // rejecting every request over that would be a worse outcome than serving
    // them unthrottled. Anything that breaks D1 outright breaks every route
    // anyway, so this gives an attacker nothing they did not already have.
    console.error('Rate limit storage unavailable, allowing request', { key, error });

    return { allowed: true, remaining: rule.max - 1, retryAfter: rule.window };
  }
}

/**
 * Identifies the caller.
 *
 * CF-Connecting-IP is set by Cloudflare on every request that reaches a Worker
 * and cannot be spoofed by the client, unlike X-Forwarded-For. `wrangler dev`
 * sets it too, to ::1, so local development shares one bucket per machine.
 *
 * The fallback only matters if the header ever goes missing, and it groups
 * those callers together rather than letting them past unlimited.
 */
export function clientKey(headers: Headers): string {
  return headers.get('cf-connecting-ip') ?? 'local';
}

/**
 * Applies the limit for whatever the request path resolves to. Runs before the
 * session middleware, so an unauthenticated flood is rejected without touching
 * auth or the session table.
 */
export const rateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const scope = scopeForPath(new URL(c.req.url).pathname);
  if (scope === null) return next();

  const rule = rateLimitRules[scope];
  const key = rateLimitKey(scope, clientKey(c.req.raw.headers), rule.window);

  const decision = await consumeRateLimit(c.get('db'), key, rule);

  c.header('RateLimit-Limit', String(rule.max));
  c.header('RateLimit-Remaining', String(decision.remaining));

  if (!decision.allowed) return tooManyRequests(c, decision.retryAfter);

  // Only requests the per-address rule let through count against the shared
  // cap, so one caller hammering their own limit cannot use up everyone's.
  const globalRule = globalRateLimitRules[scope];
  if (globalRule) {
    const globalDecision = await consumeRateLimit(
      c.get('db'),
      rateLimitKey(scope, GLOBAL_CLIENT, globalRule.window),
      globalRule,
    );
    if (!globalDecision.allowed) return tooManyRequests(c, globalDecision.retryAfter);
  }

  await next();
});

function tooManyRequests(c: Context<AppEnv>, retryAfter: number) {
  c.header('Retry-After', String(retryAfter));
  return c.json({ error: 'Too many requests', retryAfter }, 429);
}

/**
 * Drops windows that have already elapsed. Called from the scheduled handler;
 * rows for active keys are reused in place, so this only clears keys that were
 * seen once and never again.
 */
export async function pruneRateLimits(db: Database, now = Math.floor(Date.now() / 1000)) {
  try {
    await db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));
  } catch (error) {
    // A failed cleanup is not worth a failed cron run; the table only grows.
    console.error('Rate limit prune failed', error);
  }
}
