import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
  it('blocks the sixth sign-up in an hour from one address', async () => {
    for (let i = 0; i < 5; i += 1) await h.signUp();

    const blocked = await h.request('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name: 'One too many', email: 'extra@example.com', password: 'password123' },
    });

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
    const users = await h.db
      .prepare("SELECT count(*) AS n FROM user WHERE email = 'extra@example.com'")
      .first<{ n: number }>();
    expect(users!.n).toBe(0);
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
