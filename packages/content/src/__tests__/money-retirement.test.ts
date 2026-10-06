import { describe, expect, it } from 'vitest';
import { gradeExercise, isUnitUnlocked, type Answer } from '@fin/core';
import { findExercise, units } from '../index';

describe('interest, credit, inflation, and retirement answer keys', () => {
  it.each([
    ['money-basics.compounding.ten-years', 3581.7, 3200],
    ['money-basics.compounding.first-year', 50, 1050],
    ['money-basics.compounding.second-year', 1102.5, 1100],
    ['money-basics.credit-utilization.single-card', 25, 0.25],
    ['money-basics.credit-utilization.combined', 10, 17.5],
    ['money-basics.credit-utilization.payment', 25, 40],
    ['money-basics.borrowing.interest', 60, 560],
    ['money-basics.borrowing.total', 575, 560],
    ['money-basics.borrowing.remaining', 575, 0],
    ['money-basics.inflation.basket', 208, 8],
    ['money-basics.inflation.today-dollars', 1000, 1102.5],
    ['money-basics.inflation.two-years', 121, 120],
    ['money-basics.review.growth', 1622.4, 1620],
    ['money-basics.review.utilization', 20, 30],
    ['money-basics.review.price-gap', 18, 318],
    ['retirement.start.contributions', 900, 75],
    ['retirement.start.growth', 1102.5, 1100],
    ['retirement.workplace.contribution', 120, 4],
    ['retirement.workplace.match', 60, 180],
    ['retirement.workplace.cap', 60, 90],
    ['retirement.workplace.vested', 2400, 1200],
  ])('grades %s and rejects a plausible misconception', (id, correct, incorrect) => {
    const exercise = findExercise(id)!;
    expect(exercise, id).toBeDefined();
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: correct }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'computed_answer', value: incorrect }).correct).toBe(
      false,
    );
  });

  it.each([
    ['money-basics.compounding.definition', 'b'],
    ['money-basics.credit-utilization.closing-a-card', 'c'],
    ['money-basics.credit-utilization.score', 'ratio'],
    ['money-basics.borrowing.grace', 'full'],
    ['money-basics.inflation.meaning', 'less'],
    ['money-basics.inflation.compare', 'loss'],
    ['money-basics.review.prediction', 'assumption'],
    ['retirement.start.purpose', 'future'],
    ['retirement.start.realistic', 'plan'],
    ['retirement.workplace.verify', 'terms'],
  ])('accepts the intended decision and rejects all distractors in %s', (id, correct) => {
    const exercise = findExercise(id)!;
    if (exercise.kind !== 'multiple_choice') throw new Error(`Expected choices: ${id}`);
    for (const choice of exercise.choices) {
      expect(
        gradeExercise(exercise, { kind: 'multiple_choice', choiceId: choice.id }).correct,
      ).toBe(choice.id === correct);
    }
  });

  it.each([
    ['money-basics.compounding.growth-order', ['savings', 'bond', 'index']],
    ['money-basics.borrowing.compare', ['a', 'c', 'b']],
    ['money-basics.review.costs', ['a', 'b', 'c']],
    ['retirement.start.time', ['short', 'middle', 'long']],
  ])('grades the unambiguous order in %s', (id, order) => {
    const exercise = findExercise(id)!;
    expect(gradeExercise(exercise, { kind: 'ordering', order }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'ordering', order: [...order].reverse() }).correct).toBe(
      false,
    );
  });

  it('keeps retirement locked until every Unit 3 lesson is complete', () => {
    const graph = {
      prerequisitesByUnit: new Map(units.map((unit) => [unit.id, unit.prerequisites])),
      lessonsByUnit: new Map(
        units.map((unit) => [unit.id, unit.lessons.map((lesson) => lesson.id)]),
      ),
    };
    const unitThree = units.find((unit) => unit.id === 'money-basics')!;
    const completed = new Set(['money-basics.compounding', 'money-basics.credit-utilization']);
    expect(isUnitUnlocked('retirement', graph, completed)).toBe(false);
    for (const lesson of unitThree.lessons.slice(2)) {
      expect(isUnitUnlocked('retirement', graph, completed)).toBe(false);
      completed.add(lesson.id);
    }
    expect(isUnitUnlocked('retirement', graph, completed)).toBe(true);
    for (const lesson of unitThree.lessons) {
      const missingOne = new Set(completed);
      missingOne.delete(lesson.id);
      expect(isUnitUnlocked('retirement', graph, missingOne), lesson.id).toBe(false);
    }
  });

  it('provides five full Unit 3 lessons and eight playable retirement lessons', () => {
    const unitThree = units.find((unit) => unit.id === 'money-basics')!;
    const unitFour = units.find((unit) => unit.id === 'retirement')!;
    expect(unitThree.lessons).toHaveLength(5);
    expect(unitFour.lessons).toHaveLength(8);
    for (const lesson of [...unitThree.lessons, ...unitFour.lessons]) {
      expect(lesson.intro?.length, lesson.id).toBeGreaterThan(40);
      expect(lesson.exercises, lesson.id).toHaveLength(5);
      for (const exercise of lesson.exercises) {
        const answer: Answer =
          exercise.kind === 'computed_answer'
            ? { kind: exercise.kind, value: exercise.answer }
            : exercise.kind === 'multiple_choice'
              ? { kind: exercise.kind, choiceId: exercise.correctChoiceId }
              : { kind: exercise.kind, order: exercise.correctOrder };
        expect(gradeExercise(exercise, answer).correct, exercise.id).toBe(true);
      }
    }
  });
});
