import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { GLOBAL_CLIENT, globalRateLimitRules, rateLimitKey } from '@fin/core';

import { createHarness, type Harness } from './harness';

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => {
  // Undefined if setup itself failed; let that error be the one reported.
  await h?.dispose();
});

beforeEach(async () => {
  await h.resetRateLimits();
});

describe('rate limiting', () => {
  let n = 0;
  const signUpFrom = (ip: string) =>
    h.request('/api/auth/sign-up/email', {
      method: 'POST',
      ip,
      body: {
        name: 'Student',
        email: `student-${(n += 1)}-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
    });

  const userCount = async () =>
    (await h.db.prepare('SELECT count(*) AS n FROM user').first<{ n: number }>())!.n;

  const globalCount = async () =>
    (
      await h.db
        .prepare('SELECT count FROM rate_limits WHERE key = ?')
        .bind(rateLimitKey('sign-up', GLOBAL_CLIENT, globalRateLimitRules['sign-up']!.window))
        .first<{ count: number }>()
    )?.count ?? 0;

  it('lets a whole class sign up from one campus address', async () => {
    const campus = '128.227.3.1';
    const statuses = [];
    for (let i = 0; i < 30; i += 1) statuses.push((await signUpFrom(campus)).status);

    expect(statuses.every((status) => status === 200)).toBe(true);
  });

  it('blocks the 31st sign-up in an hour from one address', async () => {
    const address = '203.0.113.7';
    for (let i = 0; i < 30; i += 1) await signUpFrom(address);
    const before = await userCount();

    const blocked = await signUpFrom(address);

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await userCount()).toBe(before);
  });

  it('gives each address its own allowance', async () => {
    for (let i = 0; i < 31; i += 1) await signUpFrom('203.0.113.8');

    expect((await signUpFrom('203.0.113.9')).status).toBe(200);
  });

  it('stops sign-ups from every address once the global cap is reached', async () => {
    const cap = globalRateLimitRules['sign-up']!;
    await h.db
      .prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, ?, ?)')
      .bind(
        rateLimitKey('sign-up', GLOBAL_CLIENT, cap.window),
        cap.max,
        Math.floor(Date.now() / 1000) + cap.window,
      )
      .run();
    const before = await userCount();

    const blocked = await signUpFrom('198.51.100.1');

    expect(blocked.status).toBe(429);
    expect(await userCount()).toBe(before);
  });

  it('does not let one address burn the shared cap by hammering its own limit', async () => {
    const address = '198.51.100.2';
    for (let i = 0; i < 30; i += 1) await signUpFrom(address);
    const afterAllowed = await globalCount();

    for (let i = 0; i < 10; i += 1) await signUpFrom(address);

    expect(afterAllowed).toBe(30);
    expect(await globalCount()).toBe(afterAllowed);
  });

  it('never limits the health check', async () => {
    for (let i = 0; i < 20; i += 1) {
      expect((await h.request('/health')).status).toBe(200);
    }
  });
});

describe('signing secret', () => {
  it('refuses to serve rather than sign sessions with a missing or short secret', async () => {
    for (const secret of ['', 'too-short']) {
      const response = await h.request('/api/content/units', {
        env: { BETTER_AUTH_SECRET: secret },
      });
      expect(response.status, `secret "${secret}"`).toBe(500);
    }
  });
});
