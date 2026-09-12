import { describe, expect, it } from 'vitest';
import { gradeExercise } from '@fin/core';
import { budgetingSaving } from '../units/00-budgeting-saving';

const exercises = budgetingSaving.lessons.flatMap((lesson) => lesson.exercises);

describe('budgeting and saving answer keys', () => {
  it.each([
    ['income-expenses.remaining', 450, 1800],
    ['income-expenses.total', 1170, 1130],
    ['needs-wants.flexible', 39, 27],
    ['build-budget.savings', 250, 700],
    ['build-budget.adjust', 100, 400],
    ['savings-goal.monthly', 80, 100],
    ['savings-goal.deposits', 6, 5],
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
});
