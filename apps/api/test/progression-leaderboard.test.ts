import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import type { LeaderboardResponse } from '@fin/core';
import { correctAnswers } from './fixtures';
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
afterEach(restoreClock);

async function board(cookie: string, period = 'all-time') {
  const response = await h.request(`/api/leaderboard?period=${period}`, { cookie });
  expect(response.status).toBe(200);
  return (await response.json()) as LeaderboardResponse;
}

it('keeps level, profile and both boards consistent through completion, replay and week reset', async () => {
  const cookie = await h.signUp('Journey');
  expect((await board(cookie)).currentUser).toBeNull();
  for (const lesson of ['basics.one', 'basics.two'] as const) {
    const attempts = await h.answerAll(cookie, lesson, DAY);
    expect(attempts.every((attempt) => attempt.correct)).toBe(true);
    expect((await h.complete(cookie, lesson, DAY)).status).toBe(200);
  }
  const profile = await (await h.request(`/api/progress/me?localDay=${DAY}`, { cookie })).json();
  expect(profile).toMatchObject({ totalXp: 100, level: 2, xpIntoLevel: 0, xpToNext: 200 });
  expect((await board(cookie)).currentUser?.xp).toBe(100);
  expect((await board(cookie, 'weekly')).currentUser?.xp).toBe(100);
  expect(
    (await h.attempt(cookie, 'advanced.one', correctAnswers['advanced.one'][0], DAY)).status,
  ).toBe(200);
  await h.answerAll(cookie, 'basics.one', DAY);
  expect(await (await h.complete(cookie, 'basics.one', DAY)).json()).toMatchObject({
    bonus: 0,
    totalXp: 115,
  });
  expect((await board(cookie)).currentUser?.xp).toBe(115);
  setToday('2026-09-21');
  expect((await board(cookie, 'weekly')).currentUser).toBeNull();
  expect((await board(cookie)).currentUser?.xp).toBe(115);
});

it('awards exercise XP only once when two submissions arrive together', async () => {
  const cookie = await h.signUp('Concurrent attempts');
  await h.request(`/api/progress/me?localDay=${DAY}`, { cookie });
  const responses = await Promise.all([
    h.attempt(cookie, 'basics.one', correctAnswers['basics.one'][0], DAY),
    h.attempt(cookie, 'basics.one', correctAnswers['basics.one'][0], DAY),
  ]);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  expect((await board(cookie)).currentUser?.xp).toBe(15);
  expect((await board(cookie, 'weekly')).currentUser?.xp).toBe(15);
});

it('awards the completion bonus only once when two completions arrive together', async () => {
  const cookie = await h.signUp('Concurrent completions');
  await h.answerAll(cookie, 'basics.one', DAY);
  const responses = await Promise.all([
    h.complete(cookie, 'basics.one', DAY),
    h.complete(cookie, 'basics.one', DAY),
  ]);
  expect(responses.some((response) => response.status === 200)).toBe(true);
  expect(responses.every((response) => [200, 409].includes(response.status))).toBe(true);
  expect((await board(cookie)).currentUser?.xp).toBe(65);
  expect((await board(cookie, 'weekly')).currentUser?.xp).toBe(65);
});
