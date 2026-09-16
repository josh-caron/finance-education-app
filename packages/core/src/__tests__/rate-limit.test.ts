import { describe, expect, it } from 'vitest';

import {
  decideRateLimit,
  rateLimitKey,
  rateLimitRules,
  scopeForPath,
  type RateLimitRule,
} from '../rate-limit';

const rule: RateLimitRule = { max: 3, window: 60 };

describe('decideRateLimit', () => {
  it('allows the first request in a window', () => {
    expect(decideRateLimit(1, 1000, 940, rule)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfter: 60,
    });
  });

  it('allows exactly max requests', () => {
    expect(decideRateLimit(3, 1000, 940, rule).allowed).toBe(true);
    expect(decideRateLimit(3, 1000, 940, rule).remaining).toBe(0);
  });

  it('blocks the request after max', () => {
    const decision = decideRateLimit(4, 1000, 940, rule);
    expect(decision.allowed).toBe(false);
    expect(decision.remaining).toBe(0);
  });

  it('never reports a retryAfter below one second', () => {
    // A window that has just elapsed would otherwise round to 0 or negative,
    // which tells a client to retry immediately and hammer the endpoint.
    expect(decideRateLimit(4, 1000, 1000, rule).retryAfter).toBe(1);
    expect(decideRateLimit(4, 1000, 1200, rule).retryAfter).toBe(1);
  });
});

describe('scopeForPath', () => {
  it('never limits the health check', () => {
    expect(scopeForPath('/health')).toBeNull();
  });

  it('singles out account creation and sign-in', () => {
    expect(scopeForPath('/api/auth/sign-up/email')).toBe('sign-up');
    expect(scopeForPath('/api/auth/sign-in/email')).toBe('sign-in');
  });

  it('limits the endpoints that send email on request', () => {
    expect(scopeForPath('/api/auth/request-password-reset')).toBe('email');
    expect(scopeForPath('/api/auth/send-verification-email')).toBe('email');
    // Following the emailed links does not send anything.
    expect(scopeForPath('/api/auth/verify-email')).toBe('auth');
    expect(scopeForPath('/api/auth/reset-password')).toBe('auth');
  });

  it('treats other auth endpoints as one bucket', () => {
    expect(scopeForPath('/api/auth/get-session')).toBe('auth');
    expect(scopeForPath('/api/auth/sign-out')).toBe('auth');
  });

  it('scopes answer submissions separately from reads', () => {
    expect(scopeForPath('/api/progress/lessons/money-basics.compounding/attempts')).toBe(
      'attempts',
    );
    expect(scopeForPath('/api/progress/lessons/money-basics.compounding/complete')).toBe('default');
    expect(scopeForPath('/api/progress/me')).toBe('default');
    expect(scopeForPath('/api/content/units')).toBe('default');
  });
});

describe('rateLimitRules', () => {
  it('makes account creation the tightest rule, tied only with sending email', () => {
    const perSecond = (r: RateLimitRule) => r.max / r.window;
    for (const [name, other] of Object.entries(rateLimitRules)) {
      if (name === 'sign-up') continue;
      // Both create something with a real cost: a permanent row, or an email.
      if (name === 'email') {
        expect(perSecond(rateLimitRules['sign-up']), name).toBeLessThanOrEqual(perSecond(other));
        continue;
      }
      expect(perSecond(rateLimitRules['sign-up']), name).toBeLessThan(perSecond(other));
    }
  });

  it('gives every rule a positive budget and window', () => {
    for (const [name, r] of Object.entries(rateLimitRules)) {
      expect(r.max, name).toBeGreaterThan(0);
      expect(r.window, name).toBeGreaterThan(0);
    }
  });

  it('holds email-sending endpoints tighter than other auth endpoints', () => {
    const perSecond = (r: RateLimitRule) => r.max / r.window;
    expect(perSecond(rateLimitRules.email)).toBeLessThan(perSecond(rateLimitRules.auth));
    expect(perSecond(rateLimitRules.email)).toBeLessThan(perSecond(rateLimitRules['sign-in']));
  });

  it('lets a learner finish a lesson without being limited', () => {
    // Five exercises, a few retries each, plus the completion call.
    expect(rateLimitRules.attempts.max).toBeGreaterThan(5 * 3);
  });
});

describe('rateLimitKey', () => {
  it('separates scopes so one cannot exhaust another', () => {
    expect(rateLimitKey('sign-in', '1.2.3.4', 300)).not.toBe(
      rateLimitKey('attempts', '1.2.3.4', 300),
    );
  });

  it('separates callers', () => {
    expect(rateLimitKey('sign-in', '1.2.3.4', 300)).not.toBe(
      rateLimitKey('sign-in', '5.6.7.8', 300),
    );
  });

  it('changes when the window changes, so an old count is not inherited', () => {
    expect(rateLimitKey('sign-in', '1.2.3.4', 300)).not.toBe(
      rateLimitKey('sign-in', '1.2.3.4', 600),
    );
  });
});
