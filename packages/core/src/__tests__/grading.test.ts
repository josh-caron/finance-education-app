import { describe, expect, it } from 'vitest';

import { gradeExercise, parseNumericAnswer } from '../grading';
import type { ComputedAnswerExercise, MultipleChoiceExercise, OrderingExercise } from '../types';

const multipleChoice: MultipleChoiceExercise = {
  kind: 'multiple_choice',
  id: 'mc-1',
  prompt: 'Which account is meant for retirement?',
  choices: [
    { id: 'a', label: 'Checking account' },
    { id: 'b', label: 'Roth IRA' },
  ],
  correctChoiceId: 'b',
  explanation: 'A Roth IRA is a tax-advantaged retirement account.',
};

const ordering: OrderingExercise = {
  kind: 'ordering',
  id: 'ord-1',
  prompt: 'Order these from lowest to highest risk.',
  items: [
    { id: 'savings', label: 'Savings account' },
    { id: 'bond', label: 'Treasury bond' },
    { id: 'stock', label: 'Individual stock' },
  ],
  correctOrder: ['savings', 'bond', 'stock'],
};

const computed: ComputedAnswerExercise = {
  kind: 'computed_answer',
  id: 'calc-1',
  prompt: 'What is $1,000 after one year at 5%?',
  answer: 1050,
  format: 'usd',
  tolerance: { type: 'absolute', value: 0.5 },
};

describe('gradeExercise', () => {
  it('accepts the correct choice and rejects the rest', () => {
    expect(gradeExercise(multipleChoice, { kind: 'multiple_choice', choiceId: 'b' }).correct).toBe(
      true,
    );

    const wrong = gradeExercise(multipleChoice, { kind: 'multiple_choice', choiceId: 'a' });
    expect(wrong.correct).toBe(false);
    expect(wrong.expected).toBe('Roth IRA');
  });

  it('requires the exact ordering', () => {
    expect(
      gradeExercise(ordering, { kind: 'ordering', order: ['savings', 'bond', 'stock'] }).correct,
    ).toBe(true);

    const wrong = gradeExercise(ordering, {
      kind: 'ordering',
      order: ['bond', 'savings', 'stock'],
    });
    expect(wrong.correct).toBe(false);
    expect(wrong.expected).toBe('Savings account → Treasury bond → Individual stock');
  });

  it('accepts computed answers inside the absolute tolerance', () => {
    expect(gradeExercise(computed, { kind: 'computed_answer', value: 1050 }).correct).toBe(true);
    expect(gradeExercise(computed, { kind: 'computed_answer', value: 1050.4 }).correct).toBe(true);
    expect(gradeExercise(computed, { kind: 'computed_answer', value: 1051 }).correct).toBe(false);
  });

  it('scales a relative tolerance with the answer', () => {
    const relative: ComputedAnswerExercise = {
      ...computed,
      tolerance: { type: 'relative', value: 0.01 },
    };

    expect(gradeExercise(relative, { kind: 'computed_answer', value: 1060 }).correct).toBe(true);
    expect(gradeExercise(relative, { kind: 'computed_answer', value: 1075 }).correct).toBe(false);
  });

  it('rejects NaN rather than treating it as close enough', () => {
    expect(gradeExercise(computed, { kind: 'computed_answer', value: Number.NaN }).correct).toBe(
      false,
    );
  });

  it('rejects an answer of the wrong kind', () => {
    expect(gradeExercise(computed, { kind: 'multiple_choice', choiceId: 'b' }).correct).toBe(false);
  });
});

describe('parseNumericAnswer', () => {
  it('strips currency, percent and separator formatting', () => {
    expect(parseNumericAnswer('$1,050.00')).toBe(1050);
    expect(parseNumericAnswer('7%')).toBe(7);
    expect(parseNumericAnswer(' -12.5 ')).toBe(-12.5);
  });

  it('returns null for input that is not a number yet', () => {
    expect(parseNumericAnswer('')).toBeNull();
    expect(parseNumericAnswer('-')).toBeNull();
    expect(parseNumericAnswer('abc')).toBeNull();
  });
});
