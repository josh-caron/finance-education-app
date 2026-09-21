import type { AchievementDefinition, GradeResult, PublicExercise, StreakHealth } from '@fin/core';

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

export interface CatalogAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string | null;
}

export interface Celebration {
  unitJustCompleted: boolean;
  unitId: string | null;
  unitTitle: string | null;
  unlockedUnit: { id: string; title: string } | null;
  previousLevel: number;
  previousTitle: string;
  newLevel: number;
  newTitle: string;
  leveledUp: boolean;
  newAchievements: AchievementDefinition[];
}

export interface AttemptResult extends GradeResult {
  attemptNumber: number;
  xpAwarded: number;
  /** True when this exercise was already banked, so the pass earned nothing. */
  practice: boolean;
  totalXp: number;
  level: number;
  title?: string;
  xpIntoLevel: number;
  xpToNext: number;
  leveledUp?: boolean;
  newAchievements?: AchievementDefinition[];
}

export interface LessonCompletion {
  xpEarned: number;
  /** The completion bonus portion of xpEarned. */
  bonus: number;
  score: number;
  firstCompletion: boolean;
  /** True when the run earned nothing new, so it was practice. */
  practice: boolean;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
  title?: string;
  celebration?: Celebration;
}

export interface DailyActivity {
  /** YYYY-MM-DD in the learner's local time. */
  day: string;
  xpEarned: number;
  lessonsCompleted: number;
}

export interface LearnerProfile {
  totalXp: number;
  level: number;
  title?: string;
  nextTitle?: string;
  xpIntoLevel: number;
  xpToNext: number;
  achievements?: CatalogAchievement[];
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  streakHealth: StreakHealth;
  /** The day the API resolved for this request, echoed back for the strip. */
  today: string;
  /** Seven days ending today, oldest first. */
  recentDays: DailyActivity[];
  lessons: { lessonId: string; status: LessonStatus; bestScore: number; xpEarned: number }[];
}
