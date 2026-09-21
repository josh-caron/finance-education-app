import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, restoreClock, setToday, type Harness } from './harness';

const DAY = '2026-09-14';

interface LeaderboardBody {
  period: string;
  weekStart: string | null;
  totalLearners: number;
  entries: { rank: number; name: string; xp: number; isYou: boolean }[];
  nearby: { rank: number; name: string }[];
  currentUser: { rank: number; xp: number; isYou: boolean } | null;
}

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

describe('GET /api/leaderboard', () => {
  it('rejects anonymous callers and unknown periods', async () => {
    expect((await h.request('/api/leaderboard')).status).toBe(401);
    const cookie = await h.signUp('Pat');
    expect((await h.request('/api/leaderboard?period=monthly', { cookie })).status).toBe(400);
  });

  it('leaves a learner with no XP unranked and lists people who earned some', async () => {
    const watcher = await h.signUp('Watcher');
    const learner = await h.signUp('Finisher');
    await h.answerAll(learner, 'basics.one', DAY);
    await h.complete(learner, 'basics.one', DAY);

    const empty = (await (
      await h.request('/api/leaderboard?period=all-time', { cookie: watcher })
    ).json()) as LeaderboardBody;
    expect(empty.currentUser).toBeNull();
    expect(empty.totalLearners).toBe(1);
    expect(empty.entries[0]).toMatchObject({ name: 'Finisher', isYou: false, rank: 1 });

    const ranked = (await (
      await h.request('/api/leaderboard', { cookie: learner })
    ).json()) as LeaderboardBody;
    expect(ranked.currentUser).toMatchObject({ rank: 1, isYou: true });
    expect(ranked.period).toBe('all-time');
    expect(ranked.weekStart).toBeNull();
  });

  it('aggregates this week from daily activity and not from leftover all-time XP', async () => {
    const cookie = await h.signUp('Weekly');
    await h.answerAll(cookie, 'basics.one', DAY);
    await h.complete(cookie, 'basics.one', DAY);

    const weekly = (await (
      await h.request('/api/leaderboard?period=weekly', { cookie })
    ).json()) as LeaderboardBody;
    expect(weekly.period).toBe('weekly');
    expect(weekly.weekStart).toBe('2026-09-14');
    expect(weekly.currentUser?.xp).toBeGreaterThan(0);
    expect(weekly.currentUser?.isYou).toBe(true);
  });
});
