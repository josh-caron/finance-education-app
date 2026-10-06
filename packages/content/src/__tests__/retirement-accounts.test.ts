import { describe, expect, it } from 'vitest';
import { gradeExercise, isUnitComplete } from '@fin/core';
import { findExercise, findUnit } from '../index';

describe('retirement account practice', () => {
  it.each([
    ['401k.pay', 200, 5],
    ['401k.tax-example', 40, 200],
    ['traditional-ira.monthly', 200, 2400],
    ['traditional-ira.deduction', 220, 1000],
    ['roth-ira.remaining', 1800, 3000],
    ['hsa.balance', 1150, 1500],
    ['investments.fee', 20, 2000],
    ['investments.difference', 80, 100],
    ['review.budget', 130, 180],
  ])('grades %s against independent math and a common error', (suffix, correct, incorrect) => {
    const exercise = findExercise(`retirement.${suffix}`)!;
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: correct }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: incorrect }).correct).toBe(
      false,
    );
  });

  it.each([
    ['401k.access', 'payroll'],
    ['401k.tax', 'traditional'],
    ['401k.shared', 'combined'],
    ['traditional-ira.account', 'personal'],
    ['traditional-ira.deduct', 'check'],
    ['traditional-ira.records', 'records'],
    ['roth-ira.contribution', 'after'],
    ['roth-ira.qualified', 'yes'],
    ['roth-ira.early', 'check'],
    ['roth-ira.combined', 'shared'],
    ['hsa.eligible', 'check'],
    ['hsa.receipt', 'records'],
    ['hsa.carry', 'remain'],
    ['hsa.after65', 'income'],
    ['investments.wrapper', 'holdings'],
    ['investments.diversify', 'spread'],
    ['review.match', 'terms'],
    ['review.hsa', 'check'],
    ['review.tax', 'conditional'],
  ])('requires the qualified account distinction in %s', (suffix, correct) => {
    const exercise = findExercise(`retirement.${suffix}`)!;
    if (exercise.kind !== 'multiple_choice') throw new Error(suffix);
    for (const choice of exercise.choices) {
      expect(
        gradeExercise(exercise, { kind: 'multiple_choice', choiceId: choice.id }).correct,
      ).toBe(choice.id === correct);
    }
  });

  it.each([
    ['investments.order', ['low', 'middle', 'high']],
    ['review.process', ['check', 'budget', 'invest']],
  ])('grades the stated order in %s', (suffix, order) => {
    const exercise = findExercise(`retirement.${suffix}`)!;
    expect(gradeExercise(exercise, { kind: 'ordering', order }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'ordering', order: [...order].reverse() }).correct).toBe(
      false,
    );
  });

  it('does not count the old two-lesson introduction as the expanded unit completion', () => {
    const unit = findUnit('retirement')!;
    const byUnit = new Map([[unit.id, unit.lessons.map((lesson) => lesson.id)]]);
    const done = new Set(['retirement.start', 'retirement.workplace']);
    expect(isUnitComplete(unit.id, byUnit, done)).toBe(false);
    for (const lesson of unit.lessons.slice(2)) {
      expect(isUnitComplete(unit.id, byUnit, done)).toBe(false);
      done.add(lesson.id);
    }
    expect(isUnitComplete(unit.id, byUnit, done)).toBe(true);
    for (const lesson of unit.lessons) {
      const missing = new Set(done);
      missing.delete(lesson.id);
      expect(isUnitComplete(unit.id, byUnit, missing), lesson.id).toBe(false);
    }
  });
});
