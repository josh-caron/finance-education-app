import { Hono } from 'hono';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  dailyActivity,
  exerciseAttempts,
  exercises,
  learnerProfiles,
  lessonProgress,
  lessons,
} from '@fin/db';
import {
  advanceStreak,
  gradeExercise,
  levelForXp,
  xpForExercise,
  xpForLesson,
  type Answer,
  type StreakState,
} from '@fin/core';

import { requireAuth } from '../middleware/session';
import type { AppEnv } from '../types';

export const progressRoutes = new Hono<AppEnv>();

progressRoutes.use('*', requireAuth);

const answerSchema: z.ZodType<Answer> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('multiple_choice'), choiceId: z.string().min(1) }),
  z.object({ kind: z.literal('ordering'), order: z.array(z.string().min(1)).min(2) }),
  z.object({ kind: z.literal('computed_answer'), value: z.number().finite() }),
]);

const submitSchema = z.object({
  exerciseId: z.string().min(1),
  answer: answerSchema,
});

/** YYYY-MM-DD in the learner's local time; streaks follow their calendar, not UTC. */
const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD day key');

const completeSchema = z.object({
  localDay: dayKeySchema,
  timezone: z.string().optional(),
});

/** The caller's profile: XP, level and streak. */
progressRoutes.get('/me', async (c) => {
  const db = c.get('db');
  const user = c.get('user')!;

  const profile = await getOrCreateProfile(c.get('db'), user.id);
  const lessonRows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, user.id));

  return c.json({
    totalXp: profile.totalXp,
    ...levelForXp(profile.totalXp),
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDay: profile.lastActiveDay,
    lessons: lessonRows.map((row) => ({
      lessonId: row.lessonId,
      status: row.status,
      bestScore: row.bestScore,
      xpEarned: row.xpEarned,
    })),
  });
});

/**
 * Grades one submission. Grading runs here rather than on the client so the
 * answer key never has to be shipped, and every attempt is logged.
 */
progressRoutes.post('/lessons/:lessonId/attempts', async (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const lessonId = c.req.param('lessonId');

  const parsed = submitSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Invalid submission', issues: parsed.error.issues }, 400);
  }

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, parsed.data.exerciseId), eq(exercises.lessonId, lessonId)))
    .limit(1);

  if (!exercise) {
    return c.json({ error: 'Exercise not found in this lesson' }, 404);
  }

  const previousAttempts = await countAttempts(db, user.id, exercise.id);
  const attemptNumber = previousAttempts + 1;
  const result = gradeExercise(exercise.payload, parsed.data.answer);
  const xpAwarded = xpForExercise({ correct: result.correct, attempts: attemptNumber });

  await db.insert(exerciseAttempts).values({
    id: crypto.randomUUID(),
    userId: user.id,
    lessonId,
    exerciseId: exercise.id,
    attemptNumber,
    isCorrect: result.correct,
    submitted: parsed.data.answer,
    xpAwarded,
  });

  await db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId, status: 'in_progress' })
    .onConflictDoNothing();

  return c.json({ ...result, attemptNumber, xpAwarded });
});

/**
 * Closes out a lesson: recomputes the score from the logged attempts, awards XP
 * and advances the streak. Scores are derived server-side, so a client cannot
 * claim a perfect run it did not earn.
 */
progressRoutes.post('/lessons/:lessonId/complete', async (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const lessonId = c.req.param('lessonId');

  const parsed = completeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
  }

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404);
  }

  const lessonExercises = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(eq(exercises.lessonId, lessonId))
    .orderBy(asc(exercises.sortOrder));

  const attempts = await db
    .select()
    .from(exerciseAttempts)
    .where(and(eq(exerciseAttempts.userId, user.id), eq(exerciseAttempts.lessonId, lessonId)))
    .orderBy(asc(exerciseAttempts.attemptNumber));

  const scores = lessonExercises.map((exercise) => {
    const forExercise = attempts.filter((attempt) => attempt.exerciseId === exercise.id);
    const firstCorrect = forExercise.find((attempt) => attempt.isCorrect);

    return {
      correct: firstCorrect !== undefined,
      attempts: firstCorrect?.attemptNumber ?? forExercise.length,
    };
  });

  const answered = scores.filter((score) => score.correct).length;
  if (lessonExercises.length === 0 || answered < lessonExercises.length) {
    return c.json({ error: 'Every exercise must be answered correctly first', answered }, 409);
  }

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  const firstCompletion = existing?.status !== 'completed';
  const xpEarned = xpForLesson(scores, firstCompletion);
  const score = Math.round(
    (scores.filter((s) => s.correct && s.attempts <= 1).length / scores.length) * 100,
  );

  const profile = await getOrCreateProfile(db, user.id);
  const streak = advanceStreak(toStreakState(profile), parsed.data.localDay);

  // D1 has no interactive transactions; these run as a batch so the profile,
  // lesson row and daily rollup cannot land partially.
  await db.batch([
    db
      .insert(lessonProgress)
      .values({
        userId: user.id,
        lessonId,
        status: 'completed',
        bestScore: score,
        xpEarned,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          bestScore: sql`max(${lessonProgress.bestScore}, ${score})`,
          xpEarned: sql`${lessonProgress.xpEarned} + ${xpEarned}`,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    db
      .update(learnerProfiles)
      .set({
        totalXp: sql`${learnerProfiles.totalXp} + ${xpEarned}`,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDay: streak.lastActiveDay,
        timezone: parsed.data.timezone ?? profile.timezone,
        updatedAt: new Date(),
      })
      .where(eq(learnerProfiles.userId, user.id)),
    db
      .insert(dailyActivity)
      .values({
        userId: user.id,
        day: parsed.data.localDay,
        xpEarned,
        lessonsCompleted: firstCompletion ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: {
          xpEarned: sql`${dailyActivity.xpEarned} + ${xpEarned}`,
          lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + ${firstCompletion ? 1 : 0}`,
        },
      }),
  ]);

  const totalXp = profile.totalXp + xpEarned;

  return c.json({
    xpEarned,
    score,
    firstCompletion,
    totalXp,
    ...levelForXp(totalXp),
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
  });
});

type Db = AppEnv['Variables']['db'];

async function getOrCreateProfile(db: Db, userId: string) {
  const [existing] = await db
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db.insert(learnerProfiles).values({ userId }).returning();
  return created!;
}

async function countAttempts(db: Db, userId: string, exerciseId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exerciseAttempts)
    .where(and(eq(exerciseAttempts.userId, userId), eq(exerciseAttempts.exerciseId, exerciseId)));

  return row?.count ?? 0;
}

function toStreakState(profile: {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
}): StreakState {
  return {
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDay: profile.lastActiveDay,
  };
}
