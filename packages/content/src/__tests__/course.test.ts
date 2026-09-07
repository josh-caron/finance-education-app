import { describe, expect, it } from 'vitest';

import { course, exercises, findLesson, findUnitForLesson, lessons, units } from '../index';

/**
 * Content is hand-authored, so these guard the invariants the schema alone
 * cannot express. They run against every unit, so new content is covered
 * automatically.
 */

describe('course integrity', () => {
  it('parses against the content schema', () => {
    expect(course.length).toBeGreaterThan(0);
  });

  it('has unique ids across units, lessons and exercises', () => {
    const ids = [...units, ...lessons, ...exercises].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references prerequisite units that exist', () => {
    const unitIds = new Set(units.map((unit) => unit.id));
    for (const unit of units) {
      for (const prerequisite of unit.prerequisites) {
        expect(unitIds, `${unit.id} requires ${prerequisite}`).toContain(prerequisite);
      }
    }
  });

  it('gives every unit a distinct position in the tree', () => {
    const orders = units.map((unit) => unit.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('points every multiple-choice answer key at a real choice', () => {
    for (const exercise of exercises) {
      if (exercise.kind !== 'multiple_choice') continue;
      const choiceIds = exercise.choices.map((choice) => choice.id);
      expect(choiceIds, exercise.id).toContain(exercise.correctChoiceId);
      expect(new Set(choiceIds).size, exercise.id).toBe(choiceIds.length);
    }
  });

  it('orders exactly the items each ordering exercise offers', () => {
    for (const exercise of exercises) {
      if (exercise.kind !== 'ordering') continue;
      expect([...exercise.correctOrder].sort(), exercise.id).toEqual(
        exercise.items.map((item) => item.id).sort(),
      );
    }
  });

  it('gives every computed answer a usable tolerance', () => {
    for (const exercise of exercises) {
      if (exercise.kind !== 'computed_answer') continue;
      expect(Number.isFinite(exercise.answer), exercise.id).toBe(true);
      expect(exercise.tolerance.value, exercise.id).toBeGreaterThan(0);
    }
  });

  it('resolves every lesson back to its unit', () => {
    for (const lesson of lessons) {
      expect(findUnitForLesson(lesson.id), lesson.id).toBeDefined();
      expect(findLesson(lesson.id)).toBe(lesson);
    }
  });
});
