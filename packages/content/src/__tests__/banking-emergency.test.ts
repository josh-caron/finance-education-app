import { describe, expect, it } from 'vitest';
import { cashRemainder, depositsToReach, gradeExercise, monthsOfExpensesCovered } from '@fin/core';
import { bankingEmergency } from '../units/02-banking-emergency';

const exercises = bankingEmergency.lessons.flatMap((lesson) => lesson.exercises);

function exercise(suffix: string) {
  return exercises.find((item) => item.id === `banking-emergency.${suffix}`)!;
}

describe('banking and emergency answer keys', () => {
  it.each([
    ['accounts.transfer', cashRemainder(420, 150, 60), 270],
    ['accounts.split', cashRemainder(350, 80), 350],
    ['emergency-fund.starter', cashRemainder(500, 140), 500],
    ['emergency-fund.deposits', depositsToReach(360, 0, 40), 8],
    ['emergency-fund.months', monthsOfExpensesCovered(3600, 1200), 3600],
    ['fees.balance', cashRemainder(12, 40, 35), -28],
    ['fees.atm', cashRemainder(60 + 3 + 2.5), 60],
    ['insurance.uninsured', cashRemainder(280000, 250000), 280000],
    ['insurance.split', cashRemainder(180000 + 180000), 250000],
  ])('grades %s and rejects a plausible misconception', (suffix, correct, incorrect) => {
    const item = exercise(suffix);
    expect(gradeExercise(item, { kind: 'computed_answer', value: correct }).correct).toBe(true);
    expect(gradeExercise(item, { kind: 'computed_answer', value: incorrect }).correct).toBe(false);
  });

  it('requires the checking-versus-savings distinction', () => {
    const item = exercise('accounts.purpose');
    expect(gradeExercise(item, { kind: 'multiple_choice', choiceId: 'checking' }).correct).toBe(
      true,
    );
    expect(gradeExercise(item, { kind: 'multiple_choice', choiceId: 'cash' }).correct).toBe(false);
  });
});
