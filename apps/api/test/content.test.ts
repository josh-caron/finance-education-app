import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from './harness';

const DAY = '2026-09-14';

interface UnitsBody {
  units: {
    id: string;
    order: number;
    unlocked: boolean;
    prerequisites: string[];
    lessons: { id: string; status: string; bestScore: number }[];
  }[];
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

describe('GET /api/content/units', () => {
  it('serves the skill tree to anonymous visitors, in order, with nothing started', async () => {
    const response = await h.request('/api/content/units');
    expect(response.status).toBe(200);

    const { units } = (await response.json()) as UnitsBody;
    expect(units.map((unit) => unit.id)).toEqual(['basics', 'advanced']);
    expect(units[0]!.lessons.map((lesson) => lesson.id)).toEqual(['basics.one', 'basics.two']);
    expect(units.flatMap((unit) => unit.lessons).every((l) => l.status === 'not_started')).toBe(
      true,
    );
  });

  it('locks a unit until every lesson in its prerequisite is completed', async () => {
    const cookie = await h.signUp();
    const lockState = async () => {
      const { units } = (await (
        await h.request('/api/content/units', { cookie })
      ).json()) as UnitsBody;
      return units.find((unit) => unit.id === 'advanced')!.unlocked;
    };

    expect(await lockState()).toBe(false);

    await h.answerAll(cookie, 'basics.one', DAY);
    await h.complete(cookie, 'basics.one', DAY);
    // One of two lessons done is not enough.
    expect(await lockState()).toBe(false);

    await h.answerAll(cookie, 'basics.two', DAY);
    await h.complete(cookie, 'basics.two', DAY);
    expect(await lockState()).toBe(true);
  });

  it("shows the caller's own lesson status and score, not anyone else's", async () => {
    const finisher = await h.signUp();
    await h.answerAll(finisher, 'basics.one', DAY);
    await h.complete(finisher, 'basics.one', DAY);

    const statusFor = async (cookie?: string) => {
      const { units } = (await (
        await h.request('/api/content/units', { cookie })
      ).json()) as UnitsBody;
      return units[0]!.lessons.find((lesson) => lesson.id === 'basics.one');
    };

    expect(await statusFor(finisher)).toMatchObject({ status: 'completed', bestScore: 100 });
    expect(await statusFor(await h.signUp())).toMatchObject({ status: 'not_started' });
    expect(await statusFor()).toMatchObject({ status: 'not_started' });
  });
});

describe('GET /api/content/lessons/:lessonId', () => {
  it('never sends an answer key to the client', async () => {
    const response = await h.request('/api/content/lessons/basics.one');
    expect(response.status).toBe(200);

    const raw = await response.text();
    for (const secret of ['correctChoiceId', 'correctOrder', 'tolerance', 'explanation', '1050']) {
      expect(raw, `lesson response leaked ${secret}`).not.toContain(secret);
    }
  });

  it('still sends everything needed to answer', async () => {
    const lesson = (await (await h.request('/api/content/lessons/basics.one')).json()) as {
      exercises: Record<string, unknown>[];
    };

    expect(lesson.exercises.map((exercise) => exercise.kind)).toEqual([
      'multiple_choice',
      'computed_answer',
      'ordering',
    ]);
    expect(lesson.exercises[0]).toHaveProperty('choices');
    expect(lesson.exercises[1]).toMatchObject({ format: 'usd', hint: 'Multiply by 1.05' });
    expect(lesson.exercises[2]).toHaveProperty('items');
  });

  it('returns 404 for a lesson that does not exist', async () => {
    const response = await h.request('/api/content/lessons/nope');
    expect(response.status).toBe(404);
  });
});

describe('removed endpoints', () => {
  it('no longer serves the per-unit lesson list', async () => {
    const response = await h.request('/api/content/units/basics/lessons');
    expect(response.status).toBe(404);
  });
});
