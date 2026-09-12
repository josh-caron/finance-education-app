import { courseSchema, type Course, type Exercise, type Lesson, type Unit } from '@fin/core';

import { moneyBasics } from './units/01-money-basics';
import { budgetingSaving } from './units/00-budgeting-saving';

/**
 * The course, in skill-tree order. Add a unit by importing it here; the schema
 * check below runs at import time, so a malformed unit fails fast in dev, in
 * CI, and in the seed script rather than at lesson time.
 */
export const course: Course = courseSchema.parse([budgetingSaving, moneyBasics]);

export const units: Unit[] = [...course].sort((a, b) => a.order - b.order);

export const lessons: Lesson[] = units.flatMap((unit) => unit.lessons);

export const exercises: Exercise[] = lessons.flatMap((lesson) => lesson.exercises);

export function findUnit(unitId: string): Unit | undefined {
  return units.find((unit) => unit.id === unitId);
}

export function findLesson(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}

/** The unit a lesson belongs to, for breadcrumbs and unlock checks. */
export function findUnitForLesson(lessonId: string): Unit | undefined {
  return units.find((unit) => unit.lessons.some((lesson) => lesson.id === lessonId));
}

export function findExercise(exerciseId: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.id === exerciseId);
}
