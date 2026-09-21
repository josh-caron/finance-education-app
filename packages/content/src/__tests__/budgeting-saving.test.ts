import { describe, expect, it } from 'vitest';
import { cashRemainder, depositsToReach, gradeExercise } from '@fin/core';
import { budgetingSaving } from '../units/00-budgeting-saving';

const exercises = budgetingSaving.lessons.flatMap((lesson) => lesson.exercises);

describe('budgeting and saving answer keys', () => {
  it.each([
    ['income-expenses.remaining', cashRemainder(1800, 1350), 1800],
    ['income-expenses.total', cashRemainder(800 + 240 + 90 + 40), 1130],
    ['needs-wants.flexible', cashRemainder(15 + 12 + 12), 27],
    ['build-budget.savings', cashRemainder(2000, 1300, 450), 700],
    ['build-budget.adjust', cashRemainder(1200 + 500 + 200, 1800), 400],
    ['savings-goal.monthly', cashRemainder(600, 120) / 6, 100],
    ['savings-goal.deposits', depositsToReach(500, 100, 75), 5],
  ])('grades %s and rejects a plausible misconception', (suffix, correct, incorrect) => {
    const exercise = exercises.find((item) => item.id === `budgeting-saving.${suffix}`)!;
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: correct }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: incorrect }).correct).toBe(
      false,
    );
  });

  it('requires a whole sixth deposit rather than accepting a fractional timeline', () => {
    const exercise = exercises.find((item) => item.id.endsWith('.deposits'))!;
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: 400 / 75 }).correct).toBe(
      false,
    );
  });

  it('grades the income-versus-expenses comparison and ordering keys', () => {
    const gap = exercises.find((item) => item.id.endsWith('.shortfall'))!;
    expect(gradeExercise(gap, { kind: 'multiple_choice', choiceId: 'gap' }).correct).toBe(true);
    const order = exercises.find((item) => item.id.endsWith('.compare'))!;
    expect(
      gradeExercise(order, { kind: 'ordering', order: ['low', 'middle', 'high'] }).correct,
    ).toBe(true);
  });
});
