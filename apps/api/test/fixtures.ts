import type { Unit } from '@fin/core';

/**
 * A small, stable course for route tests. Kept apart from @fin/content so that
 * editing real lessons can never break these tests, and so every answer key is
 * visible right here next to the assertions that depend on it.
 */
export const fixtureCourse: Unit[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Fixture unit',
    order: 0,
    prerequisites: [],
    lessons: [
      {
        id: 'basics.one',
        title: 'Lesson one',
        exercises: [
          {
            kind: 'multiple_choice',
            id: 'basics.one.choice',
            prompt: 'Pick B',
            choices: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
            correctChoiceId: 'b',
            explanation: 'B was right',
          },
          {
            kind: 'computed_answer',
            id: 'basics.one.calc',
            prompt: 'What is 1000 after 5%?',
            answer: 1050,
            format: 'usd',
            tolerance: { type: 'absolute', value: 0.5 },
            hint: 'Multiply by 1.05',
          },
          {
            kind: 'ordering',
            id: 'basics.one.order',
            prompt: 'Order these',
            items: [
              { id: 'x', label: 'X' },
              { id: 'y', label: 'Y' },
              { id: 'z', label: 'Z' },
            ],
            correctOrder: ['x', 'y', 'z'],
          },
        ],
      },
      {
        id: 'basics.two',
        title: 'Lesson two',
        exercises: [
          {
            kind: 'multiple_choice',
            id: 'basics.two.choice',
            prompt: 'Pick A',
            choices: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
            correctChoiceId: 'a',
          },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Locked until basics is done',
    order: 1,
    prerequisites: ['basics'],
    lessons: [
      {
        id: 'advanced.one',
        title: 'Advanced one',
        exercises: [
          {
            kind: 'multiple_choice',
            id: 'advanced.one.choice',
            prompt: 'Pick A',
            choices: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
            correctChoiceId: 'a',
          },
        ],
      },
    ],
  },
];

/** Correct answers for every fixture exercise, in lesson order. */
export const correctAnswers = {
  'basics.one': [
    { exerciseId: 'basics.one.choice', answer: { kind: 'multiple_choice', choiceId: 'b' } },
    { exerciseId: 'basics.one.calc', answer: { kind: 'computed_answer', value: 1050 } },
    { exerciseId: 'basics.one.order', answer: { kind: 'ordering', order: ['x', 'y', 'z'] } },
  ],
  'basics.two': [
    { exerciseId: 'basics.two.choice', answer: { kind: 'multiple_choice', choiceId: 'a' } },
  ],
  'advanced.one': [
    { exerciseId: 'advanced.one.choice', answer: { kind: 'multiple_choice', choiceId: 'a' } },
  ],
} as const;

export type FixtureLessonId = keyof typeof correctAnswers;
