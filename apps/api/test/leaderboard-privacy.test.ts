import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { LeaderboardResponse } from '@fin/core';

import { createHarness, restoreClock, setToday, type Harness } from './harness';

const DAY = '2026-09-14';

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => {
  await h?.dispose();
});

beforeEach(async () => {
  setToday(DAY);
  await h.resetRateLimits();
});

afterEach(() => {
  restoreClock();
});

async function board(cookie: string, period = 'all-time') {
  return (await (
    await h.request(`/api/leaderboard?period=${period}`, { cookie })
  ).json()) as LeaderboardResponse;
}

async function setVisible(cookie: string, showOnLeaderboard: unknown) {
  return h.request('/api/progress/me', { method: 'PATCH', cookie, body: { showOnLeaderboard } });
}

async function learnerWithXp(name: string) {
  const learner = await h.signUpAs(name);
  await h.answerAll(learner.cookie, 'basics.one', DAY);
  return learner;
}

const names = (result: LeaderboardResponse) =>
  [...result.entries, ...result.nearby].map((e) => e.name);

describe('leaderboard opt-out', () => {
  it('shows learners by default', async () => {
    const learner = await learnerWithXp('Visible Val');

    const me = (await (
      await h.request(`/api/progress/me?localDay=${DAY}`, { cookie: learner.cookie })
    ).json()) as { showOnLeaderboard: boolean };

    expect(me.showOnLeaderboard).toBe(true);
    expect(names(await board(learner.cookie))).toContain('Visible Val');
  });

  it('removes a learner who hides from everyone else, on both boards', async () => {
    const hider = await learnerWithXp('Hidden Hal');
    const watcher = await learnerWithXp('Watcher Wes');

    expect((await setVisible(hider.cookie, false)).status).toBe(200);

    expect(names(await board(watcher.cookie))).not.toContain('Hidden Hal');
    expect(names(await board(watcher.cookie, 'weekly'))).not.toContain('Hidden Hal');
  });

  it('tells a hidden learner they are hidden instead of giving them a rank', async () => {
    const hider = await learnerWithXp('Private Pat');
    await setVisible(hider.cookie, false);

    const result = await board(hider.cookie);

    expect(result.hidden).toBe(true);
    expect(result.currentUser).toBeNull();
  });

  it('puts a learner back when they opt in again', async () => {
    const learner = await learnerWithXp('Returning Rae');
    await setVisible(learner.cookie, false);
    await setVisible(learner.cookie, true);

    const result = await board(learner.cookie);
    expect(result.hidden).toBe(false);
    expect(result.currentUser?.name).toBe('Returning Rae');
  });

  it('accepts only a boolean setting, and only when signed in', async () => {
    const learner = await h.signUpAs();

    expect((await setVisible(learner.cookie, 'no')).status).toBe(400);
    expect(
      (await h.request('/api/progress/me', { method: 'PATCH', cookie: learner.cookie, body: {} }))
        .status,
    ).toBe(400);
    expect(
      (
        await h.request('/api/progress/me', {
          method: 'PATCH',
          cookie: learner.cookie,
          body: { showOnLeaderboard: true, totalXp: 99999 },
        })
      ).status,
      'unknown fields, including anything that looks like a score, are refused',
    ).toBe(400);
    expect(
      (await h.request('/api/progress/me', { method: 'PATCH', body: { showOnLeaderboard: false } }))
        .status,
    ).toBe(401);
  });
});

describe('name length', () => {
  const signUpNamed = (name: string) =>
    h.request('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name, email: `named-${crypto.randomUUID()}@example.com`, password: 'password123' },
    });

  it('accepts a 40-character name and refuses 41', async () => {
    expect((await signUpNamed('a'.repeat(40))).status).toBe(200);
    expect((await signUpNamed('a'.repeat(41))).status).toBe(400);
  });

  it('refuses a blank name', async () => {
    expect((await signUpNamed('    ')).status).toBe(400);
  });

  it('applies the same cap when a learner renames themselves', async () => {
    const learner = await h.signUpAs('Short Name');

    const tooLong = await h.request('/api/auth/update-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: { name: 'x'.repeat(41) },
    });
    const fine = await h.request('/api/auth/update-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: { name: 'New Name' },
    });

    expect(tooLong.status).toBe(400);
    expect(fine.status).toBe(200);
  });

  it('shortens names stored before the cap existed', async () => {
    const learner = await learnerWithXp('Placeholder');
    await h.db
      .prepare('UPDATE user SET name = ? WHERE email = ?')
      .bind('L'.repeat(200), learner.email)
      .run();

    const shown = (await board(learner.cookie)).currentUser!.name;

    expect([...shown]).toHaveLength(40);
    expect(shown.endsWith('…')).toBe(true);
  });
});
