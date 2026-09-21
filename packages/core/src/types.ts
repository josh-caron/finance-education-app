import { z } from 'zod';

/**
 * Content model: a unit is a node in the skill tree, a unit holds lessons,
 * and a lesson holds an ordered list of exercises.
 */

export const exerciseKinds = ['multiple_choice', 'ordering', 'computed_answer'] as const;
export type ExerciseKind = (typeof exerciseKinds)[number];

/** How a computed answer is displayed and compared. */
export const answerFormats = ['number', 'usd', 'percent', 'years'] as const;
export type AnswerFormat = (typeof answerFormats)[number];

const exerciseBase = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  /** Shown after the learner answers, right or wrong. */
  explanation: z.string().optional(),
  /** Optional teaching nudge available before grading. */
  hint: z.string().optional(),
});

export const multipleChoiceExerciseSchema = exerciseBase.extend({
  kind: z.literal('multiple_choice'),
  choices: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  correctChoiceId: z.string().min(1),
});

export const orderingExerciseSchema = exerciseBase.extend({
  kind: z.literal('ordering'),
  items: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  /** Item ids in the correct order. */
  correctOrder: z.array(z.string().min(1)).min(2),
});

/**
 * The exercise type that differentiates this app: the learner computes a value
 * (a bond's yield, a compounded balance) instead of recognizing one.
 */
export const computedAnswerExerciseSchema = exerciseBase.extend({
  kind: z.literal('computed_answer'),
  answer: z.number(),
  format: z.enum(answerFormats).default('number'),
  /**
   * Accepted distance from `answer`. Absolute tolerance is in answer units;
   * relative tolerance is a fraction of the answer (0.01 = within 1%).
   */
  tolerance: z.object({
    type: z.enum(['absolute', 'relative']),
    value: z.number().positive(),
  }),
});

export const exerciseSchema = z.discriminatedUnion('kind', [
  multipleChoiceExerciseSchema,
  orderingExerciseSchema,
  computedAnswerExerciseSchema,
]);

export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Short teaching copy shown before the exercises. */
  intro: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1),
});

export const unitSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  /** Position in the skill tree; lower sorts first. */
  order: z.number().int().nonnegative(),
  /** Unit ids that must be completed before this one unlocks. */
  prerequisites: z.array(z.string().min(1)).default([]),
  lessons: z.array(lessonSchema).min(1),
});

export const courseSchema = z.array(unitSchema);

export type MultipleChoiceExercise = z.infer<typeof multipleChoiceExerciseSchema>;
export type OrderingExercise = z.infer<typeof orderingExerciseSchema>;
export type ComputedAnswerExercise = z.infer<typeof computedAnswerExerciseSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Course = z.infer<typeof courseSchema>;

/** What the client submits for each exercise kind. */
export type Answer =
  | { kind: 'multiple_choice'; choiceId: string }
  | { kind: 'ordering'; order: string[] }
  | { kind: 'computed_answer'; value: number };
