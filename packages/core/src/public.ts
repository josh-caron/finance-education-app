import type { Exercise, Lesson } from './types';

/**
 * Client-facing shapes. Grading happens on the server, so answer keys
 * (`correctChoiceId`, `correctOrder`, `answer`, `tolerance`) must never leave
 * it, since a learner with devtools would otherwise read the answer off the wire.
 */

export type PublicExercise =
  | Omit<Extract<Exercise, { kind: 'multiple_choice' }>, 'correctChoiceId' | 'explanation'>
  | Omit<Extract<Exercise, { kind: 'ordering' }>, 'correctOrder' | 'explanation'>
  | Omit<Extract<Exercise, { kind: 'computed_answer' }>, 'answer' | 'tolerance' | 'explanation'>;

export type PublicLesson = Omit<Lesson, 'exercises'> & { exercises: PublicExercise[] };

export function toPublicExercise(exercise: Exercise): PublicExercise {
  switch (exercise.kind) {
    case 'multiple_choice': {
      const { correctChoiceId: _key, explanation: _explanation, ...rest } = exercise;
      return rest;
    }
    case 'ordering': {
      const { correctOrder: _key, explanation: _explanation, ...rest } = exercise;
      return rest;
    }
    case 'computed_answer': {
      const { answer: _key, tolerance: _tolerance, explanation: _explanation, ...rest } = exercise;
      return rest;
    }
  }
}

export function toPublicLesson(lesson: Lesson): PublicLesson {
  return { ...lesson, exercises: lesson.exercises.map(toPublicExercise) };
}
