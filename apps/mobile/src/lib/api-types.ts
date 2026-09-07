import type { GradeResult, PublicExercise } from '@fin/core';

/** Response shapes returned by apps/api. Kept next to the client that reads them. */

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface UnitSummary {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisites: string[];
  unlocked: boolean;
  lessons: {
    id: string;
    title: string;
    order: number;
    status: LessonStatus;
    bestScore: number;
  }[];
}

export interface LessonDetail {
  id: string;
  unitId: string;
  title: string;
  intro: string | null;
  exercises: PublicExercise[];
}

export interface AttemptResult extends GradeResult {
  attemptNumber: number;
  xpAwarded: number;
}

export interface LessonCompletion {
  xpEarned: number;
  score: number;
  firstCompletion: boolean;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LearnerProfile {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  lessons: { lessonId: string; status: LessonStatus; bestScore: number; xpEarned: number }[];
}
