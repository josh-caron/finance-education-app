import { describe, expect, it } from 'vitest';
import { isUnitUnlocked } from '@fin/core';

import { course, exercises, findLesson, findUnitForLesson, lessons, units } from '../index';

/**
 * Content is hand-authored, so these guard the invariants the schema alone
 * cannot express. They run against every unit, so new content is covered
 * automatically.
 */

describe('course integrity', () => {
  it('requires the new review and savings lessons before advancing', () => {
    const graph = {
      prerequisitesByUnit: new Map(units.map((unit) => [unit.id, unit.prerequisites])),
      lessonsByUnit: new Map(
        units.map((unit) => [unit.id, unit.lessons.map((lesson) => lesson.id)]),
      ),
    };
    const completed = new Set(units[0]!.lessons.slice(0, -1).map((lesson) => lesson.id));
    expect(isUnitUnlocked('banking-emergency', graph, completed)).toBe(false);
    completed.add('budgeting-saving.review');
    expect(isUnitUnlocked('banking-emergency', graph, completed)).toBe(true);
    for (const lesson of units[1]!.lessons.slice(0, -2)) completed.add(lesson.id);
    expect(isUnitUnlocked('money-basics', graph, completed)).toBe(false);
    completed.add('banking-emergency.savings-habit');
    expect(isUnitUnlocked('money-basics', graph, completed)).toBe(false);
    completed.add('banking-emergency.review');
    expect(isUnitUnlocked('money-basics', graph, completed)).toBe(true);
  });

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
    expect(units.map((unit) => unit.id)).toEqual([
      'budgeting-saving',
      'banking-emergency',
      'money-basics',
    ]);
  });

  it('locks each later unit on the previous unit in tree order', () => {
    expect(units[0]!.prerequisites).toEqual([]);
    for (let index = 1; index < units.length; index += 1) {
      expect(units[index]!.prerequisites, units[index]!.id).toEqual([units[index - 1]!.id]);
    }
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

  it('teaches every exercise with an explanation and a hint', () => {
    for (const exercise of exercises) {
      expect(exercise.explanation?.length, exercise.id).toBeGreaterThan(20);
      expect(exercise.hint?.length, exercise.id).toBeGreaterThan(8);
    }
  });

  it('resolves every lesson back to its unit', () => {
    for (const lesson of lessons) {
      expect(findUnitForLesson(lesson.id), lesson.id).toBeDefined();
      expect(findLesson(lesson.id)).toBe(lesson);
    }
  });
});
