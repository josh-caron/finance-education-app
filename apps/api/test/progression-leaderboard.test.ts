import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import type { LeaderboardResponse } from '@fin/core';
import { correctAnswers } from './fixtures';
import { createHarness, restoreClock, setToday, type AttemptBody, type Harness } from './harness';

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
  const attempts = await Promise.all(
    responses.map(async (response) => (await response.json()) as AttemptBody),
  );
  expect(attempts.map((attempt) => attempt.xpAwarded).sort((a, b) => a - b)).toEqual([0, 15]);
  expect(attempts.map((attempt) => attempt.attemptNumber).sort()).toEqual([1, 2]);
  expect(attempts.filter((attempt) => attempt.practice)).toHaveLength(1);
  expect(attempts.map((attempt) => attempt.totalXp)).toEqual([15, 15]);
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
  const profile = (await (
    await h.request(`/api/progress/me?localDay=${DAY}`, { cookie })
  ).json()) as {
    recentDays: { day: string; xpEarned: number; lessonsCompleted: number }[];
    lessons: { lessonId: string; xpEarned: number; bestScore: number }[];
  };
  expect(profile.recentDays.find((day: { day: string }) => day.day === DAY)).toMatchObject({
    xpEarned: 65,
    lessonsCompleted: 1,
  });
  expect(
    profile.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === 'basics.one'),
  ).toMatchObject({
    xpEarned: 65,
    bestScore: 100,
  });
  // The losing completion must not consume another run or alter replay scoring.
  expect(
    (await h.answerAll(cookie, 'basics.one', DAY)).map((attempt) => attempt.attemptNumber),
  ).toEqual([1, 1, 1]);
  expect(await (await h.complete(cookie, 'basics.one', DAY)).json()).toMatchObject({
    bonus: 0,
    xpEarned: 0,
    totalXp: 65,
    score: 100,
  });
});

it('banks different exercises concurrently on a brand-new profile without losing XP', async () => {
  const cookie = await h.signUp('Concurrent first activity');
  const responses = await Promise.all(
    correctAnswers['basics.one'].map((answer) => h.attempt(cookie, 'basics.one', answer, DAY)),
  );
  expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
  const attempts = await Promise.all(
    responses.map(async (response) => (await response.json()) as AttemptBody),
  );
  expect(attempts.map((attempt) => attempt.xpAwarded)).toEqual([15, 15, 15]);
  expect(attempts.map((attempt) => attempt.totalXp).sort((a, b) => a - b)).toEqual([15, 30, 45]);
  expect((await board(cookie)).currentUser?.xp).toBe(45);
  expect((await board(cookie, 'weekly')).currentUser?.xp).toBe(45);
  expect(await (await h.complete(cookie, 'basics.one', DAY)).json()).toMatchObject({
    totalXp: 65,
    score: 100,
  });
});
