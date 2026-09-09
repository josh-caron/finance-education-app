/**
 * Rate-limit policy: which rules apply to which request, and what a counter
 * reading means. Kept pure and here so it can be tested without a database;
 * the storage that makes it atomic lives in the API.
 */

export interface RateLimitRule {
  /** Requests allowed per window. */
  max: number;
  /** Window length in seconds. */
  window: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Requests still available in this window; 0 once blocked. */
  remaining: number;
  /** Seconds until the window resets. Always at least 1 so a client can back off. */
  retryAfter: number;
}

/**
 * Turns a counter reading into a decision.
 *
 * `count` includes the request being decided, so the first request in a window
 * arrives as 1 and a rule of max 1 permits it.
 */
export function decideRateLimit(
  count: number,
  expiresAt: number,
  now: number,
  rule: RateLimitRule,
): RateLimitDecision {
  const allowed = count <= rule.max;

  return {
    allowed,
    remaining: Math.max(0, rule.max - count),
    retryAfter: Math.max(1, expiresAt - now),
  };
}

/**
 * Limits for the endpoints worth protecting, keyed by the prefix of the path
 * after the API root.
 *
 * Account creation is the tightest: it is the only unauthenticated endpoint
 * that writes a permanent row, so it is what a script would reach for. Sign-in
 * is next, being the brute-force target. Everything else is generous enough
 * that a real learner will never see it.
 */
export const rateLimitRules = {
  'sign-up': { max: 5, window: 3600 },
  'sign-in': { max: 10, window: 300 },
  /** Any other auth endpoint: session reads, sign-out, and so on. */
  auth: { max: 60, window: 60 },
  /** Answer submissions. A lesson is a handful of these, not hundreds. */
  attempts: { max: 120, window: 60 },
  /** Everything else that is authenticated. */
  default: { max: 300, window: 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitScope = keyof typeof rateLimitRules;

/**
 * Picks the scope for a request path. Returns null when a path should not be
 * limited at all, which is only the health check.
 */
export function scopeForPath(pathname: string): RateLimitScope | null {
  if (pathname === '/health') return null;

  if (pathname.startsWith('/api/auth/')) {
    if (pathname.includes('/sign-up/')) return 'sign-up';
    if (pathname.includes('/sign-in/')) return 'sign-in';
    return 'auth';
  }

  if (pathname.startsWith('/api/progress/') && pathname.endsWith('/attempts')) {
    return 'attempts';
  }

  return 'default';
}

/**
 * Builds the storage key. Scope is included so a burst of sign-in attempts
 * cannot exhaust a learner's allowance for reading lessons, and the window is
 * included so changing a rule cannot inherit a count from the old one.
 */
export function rateLimitKey(scope: RateLimitScope, client: string, window: number): string {
  return `${scope}:${window}:${client}`;
}
