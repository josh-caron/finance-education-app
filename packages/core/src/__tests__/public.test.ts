import { describe, expect, it } from 'vitest';

import { toPublicExercise } from '../public';
import type { Exercise } from '../types';

const samples: Exercise[] = [
  {
    kind: 'multiple_choice',
    id: 'mc',
    prompt: 'p',
    choices: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctChoiceId: 'b',
    explanation: 'because',
  },
  {
    kind: 'ordering',
    id: 'ord',
    prompt: 'p',
    items: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctOrder: ['a', 'b'],
  },
  {
    kind: 'computed_answer',
    id: 'calc',
    prompt: 'p',
    answer: 1050,
    format: 'usd',
    tolerance: { type: 'absolute', value: 1 },
    hint: 'a hint is fine to send',
  },
];

describe('toPublicExercise', () => {
  it('strips every answer key before the exercise leaves the server', () => {
    const serialized = JSON.stringify(samples.map(toPublicExercise));

    for (const key of ['correctChoiceId', 'correctOrder', 'tolerance', 'explanation']) {
      expect(serialized, key).not.toContain(key);
    }
    expect(serialized).not.toContain('1050');
  });

  it('keeps what the learner needs to answer', () => {
    const [choice, ordering, computed] = samples.map(toPublicExercise);

    expect(choice).toMatchObject({ id: 'mc', prompt: 'p' });
    expect(ordering).toHaveProperty('items');
    expect(computed).toMatchObject({ format: 'usd', hint: 'a hint is fine to send' });
  });
});
