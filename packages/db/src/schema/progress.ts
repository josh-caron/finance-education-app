import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { Answer } from '@fin/core';

import { exercises, lessons } from './content';
import { user } from './auth';

/**
 * Learner state: one profile row per user, one row per lesson attempted, and an
 * append-only attempt log. XP and streak values are derived by @fin/core's
 * progression rules and written here by the API.
 */

export const learnerProfiles = sqliteTable('learner_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  totalXp: integer('total_xp').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  /** YYYY-MM-DD in the learner's local time, so streaks follow their calendar. */
  lastActiveDay: text('last_active_day'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const lessonProgressStatuses = ['in_progress', 'completed'] as const;
export type LessonProgressStatus = (typeof lessonProgressStatuses)[number];

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: text('status').$type<LessonProgressStatus>().notNull().default('in_progress'),
    /** Highest fraction of exercises answered correctly in one pass, 0-100. */
    bestScore: integer('best_score').notNull().default(0),
    /**
     * Times this lesson has been completed. Attempts are stamped with the run
     * they belong to, so a replay is scored on its own attempts rather than
     * against the learner's whole history.
     */
    completions: integer('completions').notNull().default(0),
    xpEarned: integer('xp_earned').notNull().default(0),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index('lesson_progress_user_idx').on(table.userId),
  ],
);

/** Append-only log of every submission; the source for review and analytics. */
export const exerciseAttempts = sqliteTable(
  'exercise_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    /** Which pass through the lesson this attempt belongs to, counting from 1. */
    runNumber: integer('run_number').notNull().default(1),
    /** 1 for the first submission of this exercise within `runNumber`. */
    attemptNumber: integer('attempt_number').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
    submitted: text('submitted', { mode: 'json' }).$type<Answer>().notNull(),
    xpAwarded: integer('xp_awarded').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('exercise_attempts_user_idx').on(table.userId),
    index('exercise_attempts_exercise_idx').on(table.exerciseId),
  ],
);

/** Daily rollup. Powers streak repair and the weekly leaderboard without scanning attempts. */
export const dailyActivity = sqliteTable(
  'daily_activity',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** YYYY-MM-DD, same local-day convention as learnerProfiles.lastActiveDay. */
    day: text('day').notNull(),
    xpEarned: integer('xp_earned').notNull().default(0),
    lessonsCompleted: integer('lessons_completed').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.day] }),
    index('daily_activity_day_idx').on(table.day),
  ],
);
