import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { correctAnswers } from './fixtures';
import { createHarness, type AttemptBody, type CompletionBody, type Harness } from './harness';

const DAY1 = '2026-09-14';
const DAY2 = '2026-09-15';
const DAY3 = '2026-09-16';
const DAY4 = '2026-09-17';

const [choice, calc, order] = correctAnswers['basics.one'];

interface MeBody {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  streakHealth: string;
  recentDays: { day: string; xpEarned: number; lessonsCompleted: number }[];
}

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

const json = async <T>(response: Response) => (await response.json()) as T;
const me = async (cookie: string, day = DAY1) =>
  json<MeBody>(await h.request(`/api/progress/me?localDay=${day}`, { cookie }));

describe('authentication', () => {
  it('rejects anonymous callers on every progress route', async () => {
    expect((await h.request('/api/progress/me')).status).toBe(401);
    expect(
      (
        await h.request('/api/progress/lessons/basics.one/attempts', {
          method: 'POST',
          body: { ...choice, localDay: DAY1 },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await h.request('/api/progress/lessons/basics.one/complete', {
          method: 'POST',
          body: { localDay: DAY1 },
        })
      ).status,
    ).toBe(401);
  });
});

describe('POST /api/progress/lessons/:lessonId/attempts', () => {
  it('pays the first-try bonus and banks the XP immediately', async () => {
    const cookie = await h.signUp();

    const result = await json<AttemptBody>(await h.attempt(cookie, 'basics.one', choice, DAY1));

    expect(result).toMatchObject({ correct: true, attemptNumber: 1, xpAwarded: 15, totalXp: 15 });
    expect((await me(cookie)).totalXp).toBe(15);
  });

  it('pays no bonus once an exercise has been missed', async () => {
    const cookie = await h.signUp();
    const wrong = {
      exerciseId: choice.exerciseId,
      answer: { kind: 'multiple_choice', choiceId: 'a' },
    };

    const miss = await json<AttemptBody>(await h.attempt(cookie, 'basics.one', wrong, DAY1));
    const hit = await json<AttemptBody>(await h.attempt(cookie, 'basics.one', choice, DAY1));

    expect(miss).toMatchObject({ correct: false, attemptNumber: 1, xpAwarded: 0, expected: 'B' });
    expect(hit).toMatchObject({ correct: true, attemptNumber: 2, xpAwarded: 10, totalXp: 10 });
  });

  it('never pays twice for the same exercise', async () => {
    const cookie = await h.signUp();
    await h.attempt(cookie, 'basics.one', choice, DAY1);

    const again = await json<AttemptBody>(await h.attempt(cookie, 'basics.one', choice, DAY1));

    expect(again).toMatchObject({ correct: true, xpAwarded: 0, practice: true, totalXp: 15 });
  });

  it("tracks solved exercises per learner, so one learner's answer does not block another", async () => {
    const first = await h.signUp();
    const second = await h.signUp();
    await h.attempt(first, 'basics.one', choice, DAY1);

    const result = await json<AttemptBody>(await h.attempt(second, 'basics.one', choice, DAY1));

    expect(result).toMatchObject({ xpAwarded: 15, practice: false });
  });

  it('grades computed answers against their tolerance', async () => {
    const cookie = await h.signUp();
    const submit = (value: number) =>
      h.attempt(
        cookie,
        'basics.one',
        { exerciseId: calc.exerciseId, answer: { kind: 'computed_answer', value } },
        DAY1,
      );

    expect(await json<AttemptBody>(await submit(1051))).toMatchObject({
      correct: false,
      expected: '$1,050.00',
    });
    expect(await json<AttemptBody>(await submit(1050.4))).toMatchObject({ correct: true });
  });

  it('requires the exact order for ordering exercises', async () => {
    const cookie = await h.signUp();
    const wrong = {
      exerciseId: order.exerciseId,
      answer: { kind: 'ordering', order: ['y', 'x', 'z'] },
    };

    expect(
      await json<AttemptBody>(await h.attempt(cookie, 'basics.one', wrong, DAY1)),
    ).toMatchObject({
      correct: false,
      expected: 'X → Y → Z',
    });
  });

  it('marks an answer of the wrong kind incorrect rather than crashing', async () => {
    const cookie = await h.signUp();
    const mismatched = {
      exerciseId: choice.exerciseId,
      answer: { kind: 'computed_answer', value: 1 },
    };

    const response = await h.attempt(cookie, 'basics.one', mismatched, DAY1);

    expect(response.status).toBe(200);
    expect(await json<AttemptBody>(response)).toMatchObject({ correct: false, xpAwarded: 0 });
  });

  it('rejects malformed submissions', async () => {
    const cookie = await h.signUp();
    const post = (body: unknown) =>
      h.request('/api/progress/lessons/basics.one/attempts', { method: 'POST', cookie, body });

    expect((await post({ ...choice })).status, 'missing localDay').toBe(400);
    expect((await post({ ...choice, localDay: '14/09/2026' })).status, 'bad day format').toBe(400);
    expect(
      (await post({ exerciseId: choice.exerciseId, answer: { kind: 'essay' }, localDay: DAY1 }))
        .status,
      'unknown answer kind',
    ).toBe(400);
    expect(
      (
        await post({
          exerciseId: calc.exerciseId,
          answer: { kind: 'computed_answer', value: 'lots' },
          localDay: DAY1,
        })
      ).status,
      'non-numeric value',
    ).toBe(400);
  });

  it('refuses an exercise that belongs to a different lesson', async () => {
    const cookie = await h.signUp();

    const response = await h.attempt(cookie, 'basics.two', choice, DAY1);

    expect(response.status).toBe(404);
    expect((await me(cookie)).totalXp).toBe(0);
  });
});

describe('POST /api/progress/lessons/:lessonId/complete', () => {
  it('refuses to complete a lesson until every exercise is answered correctly', async () => {
    const cookie = await h.signUp();
    await h.attempt(cookie, 'basics.one', choice, DAY1);

    const response = await h.complete(cookie, 'basics.one', DAY1);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ answered: 1 });
  });

  it('still accepts a timezone from an older client, and ignores it', async () => {
    const cookie = await h.signUp();
    await h.answerAll(cookie, 'basics.one', DAY1);

    const response = await h.request('/api/progress/lessons/basics.one/complete', {
      method: 'POST',
      cookie,
      body: { localDay: DAY1, timezone: 'America/New_York' },
    });

    expect(response.status).toBe(200);
  });

  it('returns 404 for an unknown lesson and 400 for a bad day', async () => {
    const cookie = await h.signUp();
    expect((await h.complete(cookie, 'nope', DAY1)).status).toBe(404);
    expect((await h.complete(cookie, 'basics.one', 'yesterday')).status).toBe(400);
  });

  it('pays the completion bonus once and reports totals that add up everywhere', async () => {
    const cookie = await h.signUp();

    const attempts = await h.answerAll(cookie, 'basics.one', DAY1);
    const completion = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));
    const profile = await me(cookie);

    const perAttempt = attempts.reduce((sum, attempt) => sum + attempt.xpAwarded, 0);
    const perDay = profile.recentDays.reduce((sum, day) => sum + day.xpEarned, 0);

    expect(perAttempt).toBe(45);
    expect(completion).toMatchObject({
      bonus: 20,
      xpEarned: 65,
      score: 100,
      firstCompletion: true,
      practice: false,
      totalXp: 65,
    });
    // The same number, arrived at four different ways.
    expect(perAttempt + completion.bonus).toBe(completion.xpEarned);
    expect(profile.totalXp).toBe(completion.xpEarned);
    expect(perDay).toBe(profile.totalXp);
  });

  it('makes a replay worth nothing and scores it on its own attempts', async () => {
    const cookie = await h.signUp();
    const wrong = {
      exerciseId: choice.exerciseId,
      answer: { kind: 'multiple_choice', choiceId: 'a' },
    };

    // First pass: miss one exercise before getting it, so the run scores 2/3.
    await h.attempt(cookie, 'basics.one', wrong, DAY1);
    await h.answerAll(cookie, 'basics.one', DAY1);
    const first = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));
    expect(first).toMatchObject({ score: 67, firstCompletion: true });

    // Replay cleanly. Nothing is earned, but the score reflects this pass.
    const replayAttempts = await h.answerAll(cookie, 'basics.one', DAY1);
    const replay = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));

    expect(replayAttempts.every((a) => a.xpAwarded === 0 && a.practice)).toBe(true);
    expect(replayAttempts.map((a) => a.attemptNumber)).toEqual([1, 1, 1]);
    expect(replay).toMatchObject({
      xpEarned: 0,
      bonus: 0,
      score: 100,
      firstCompletion: false,
      practice: true,
      totalXp: first.totalXp,
    });
  });

  it('cannot be farmed by completing the same lesson repeatedly', async () => {
    const cookie = await h.signUp();
    await h.answerAll(cookie, 'basics.one', DAY1);
    const first = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));

    for (let run = 0; run < 3; run += 1) {
      await h.answerAll(cookie, 'basics.one', DAY1);
      await h.complete(cookie, 'basics.one', DAY1);
    }

    expect((await me(cookie)).totalXp).toBe(first.totalXp);
  });

  it('keeps the best score rather than the latest', async () => {
    const cookie = await h.signUp();
    await h.answerAll(cookie, 'basics.one', DAY1);
    await h.complete(cookie, 'basics.one', DAY1);

    const wrong = {
      exerciseId: choice.exerciseId,
      answer: { kind: 'multiple_choice', choiceId: 'a' },
    };
    await h.attempt(cookie, 'basics.one', wrong, DAY1);
    await h.answerAll(cookie, 'basics.one', DAY1);
    const worse = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));
    expect(worse.score).toBe(67);

    const units = (await (await h.request('/api/content/units', { cookie })).json()) as {
      units: { lessons: { id: string; bestScore: number }[] }[];
    };
    expect(units.units[0]!.lessons.find((l) => l.id === 'basics.one')!.bestScore).toBe(100);
  });
});

describe('streaks', () => {
  it('extends across consecutive days and reports its health from the learner calendar', async () => {
    const cookie = await h.signUp();

    await h.answerAll(cookie, 'basics.one', DAY1);
    const day1 = await json<CompletionBody>(await h.complete(cookie, 'basics.one', DAY1));
    await h.answerAll(cookie, 'basics.two', DAY2);
    const day2 = await json<CompletionBody>(await h.complete(cookie, 'basics.two', DAY2));

    expect(day1.currentStreak).toBe(1);
    expect(day2).toMatchObject({ currentStreak: 2, longestStreak: 2 });
    expect((await me(cookie, DAY2)).streakHealth).toBe('active');
    expect((await me(cookie, DAY3)).streakHealth).toBe('at_risk');
    expect((await me(cookie, DAY4)).streakHealth).toBe('broken');
  });

  it('does not extend the streak for a second lesson on the same day', async () => {
    const cookie = await h.signUp();

    await h.answerAll(cookie, 'basics.one', DAY1);
    await h.complete(cookie, 'basics.one', DAY1);
    await h.answerAll(cookie, 'basics.two', DAY1);
    const second = await json<CompletionBody>(await h.complete(cookie, 'basics.two', DAY1));

    expect(second.currentStreak).toBe(1);
  });
});
