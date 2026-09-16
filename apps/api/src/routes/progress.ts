import { Hono } from 'hono';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
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
  firstTryRate,
  gradeExercise,
  lessonCompletionBonus,
  levelForXp,
  recentDayKeys,
  streakHealth,
  xpForAttempt,
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

/** YYYY-MM-DD in the learner's local time; streaks follow their calendar, not UTC. */
const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD day key');

const submitSchema = z.object({
  exerciseId: z.string().min(1),
  answer: answerSchema,
  /** Needed here because XP lands on submission, and lands in the day's rollup. */
  localDay: dayKeySchema,
});

const completeSchema = z.object({
  localDay: dayKeySchema,
});

/** How many days of history the streak strip shows. */
const STREAK_WINDOW_DAYS = 7;

/**
 * The caller's profile: XP, level, streak and recent daily activity.
 *
 * `localDay` comes from the client because streaks follow the learner's
 * calendar, not the Worker's UTC clock. It falls back to UTC today so the
 * endpoint stays useful without it.
 */
progressRoutes.get('/me', async (c) => {
  const db = c.get('db');
  const user = c.get('user')!;

  const requestedDay = c.req.query('localDay');
  const today =
    requestedDay && dayKeySchema.safeParse(requestedDay).success
      ? requestedDay
      : new Date().toISOString().slice(0, 10);

  const profile = await getOrCreateProfile(db, user.id);

  const window = recentDayKeys(today, STREAK_WINDOW_DAYS);
  const windowStart = window[0]!;

  const [lessonRows, activityRows] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
    db
      .select()
      .from(dailyActivity)
      .where(and(eq(dailyActivity.userId, user.id), gte(dailyActivity.day, windowStart))),
  ]);

  const activityByDay = new Map(activityRows.map((row) => [row.day, row]));

  return c.json({
    totalXp: profile.totalXp,
    ...levelForXp(profile.totalXp),
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDay: profile.lastActiveDay,
    streakHealth: streakHealth(toStreakState(profile), today),
    today,
    recentDays: window.map((day) => {
      const activity = activityByDay.get(day);

      return {
        day,
        xpEarned: activity?.xpEarned ?? 0,
        lessonsCompleted: activity?.lessonsCompleted ?? 0,
      };
    }),
    lessons: lessonRows.map((row) => ({
      lessonId: row.lessonId,
      status: row.status,
      bestScore: row.bestScore,
      xpEarned: row.xpEarned,
    })),
  });
});

/**
 * Grades one submission and banks any XP it earns.
 *
 * Grading runs here rather than on the client so the answer key never has to be
 * shipped. XP is awarded at submission time and only the first time an exercise
 * is solved, which is what stops a finished lesson from being farmed.
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

  const [progressRow] = await db
    .select({ completions: lessonProgress.completions })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  const runNumber = (progressRow?.completions ?? 0) + 1;

  const priorAttempts = await db
    .select({ isCorrect: exerciseAttempts.isCorrect, runNumber: exerciseAttempts.runNumber })
    .from(exerciseAttempts)
    .where(and(eq(exerciseAttempts.userId, user.id), eq(exerciseAttempts.exerciseId, exercise.id)));

  // Position within this pass, so "first try" stays meaningful on a replay.
  const attemptNumber =
    priorAttempts.filter((attempt) => attempt.runNumber === runNumber).length + 1;
  // Banked once, ever. This is what makes a replay worth no XP.
  const alreadySolved = priorAttempts.some((attempt) => attempt.isCorrect);

  const result = gradeExercise(exercise.payload, parsed.data.answer);
  const xpAwarded = xpForAttempt({ correct: result.correct, attemptNumber, alreadySolved });

  const profile = await getOrCreateProfile(db, user.id);

  const logAttempt = db.insert(exerciseAttempts).values({
    id: crypto.randomUUID(),
    userId: user.id,
    lessonId,
    exerciseId: exercise.id,
    runNumber,
    attemptNumber,
    isCorrect: result.correct,
    submitted: parsed.data.answer,
    xpAwarded,
  });

  const markInProgress = db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId, status: 'in_progress' })
    .onConflictDoNothing();

  if (xpAwarded > 0) {
    await db.batch([
      logAttempt,
      markInProgress,
      db
        .update(learnerProfiles)
        .set({
          totalXp: sql`${learnerProfiles.totalXp} + ${xpAwarded}`,
          updatedAt: new Date(),
        })
        .where(eq(learnerProfiles.userId, user.id)),
      db
        .insert(dailyActivity)
        .values({ userId: user.id, day: parsed.data.localDay, xpEarned: xpAwarded })
        .onConflictDoUpdate({
          target: [dailyActivity.userId, dailyActivity.day],
          set: { xpEarned: sql`${dailyActivity.xpEarned} + ${xpAwarded}` },
        }),
    ]);
  } else {
    await db.batch([logAttempt, markInProgress]);
  }

  const totalXp = profile.totalXp + xpAwarded;

  return c.json({
    ...result,
    attemptNumber,
    xpAwarded,
    /** True when the exercise was already banked, so this pass was practice. */
    practice: alreadySolved,
    totalXp,
    ...levelForXp(totalXp),
  });
});

/**
 * Closes out a lesson: scores the run, pays the completion bonus and advances
 * the streak.
 *
 * Exercise XP was already banked as each answer came in, so this adds only the
 * bonus. Scores are derived from the logged attempts, never taken from the
 * client, and only attempts since the last completion count, so a replay is
 * scored on its own merits.
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

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  const runNumber = (existing?.completions ?? 0) + 1;

  const [lessonExercises, runAttempts] = await Promise.all([
    db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.lessonId, lessonId))
      .orderBy(asc(exercises.sortOrder)),
    db
      .select()
      .from(exerciseAttempts)
      .where(
        and(
          eq(exerciseAttempts.userId, user.id),
          eq(exerciseAttempts.lessonId, lessonId),
          eq(exerciseAttempts.runNumber, runNumber),
        ),
      )
      .orderBy(asc(exerciseAttempts.attemptNumber)),
  ]);

  const outcomes = lessonExercises.map((exercise) => {
    const forExercise = runAttempts.filter((attempt) => attempt.exerciseId === exercise.id);
    const firstCorrect = forExercise.find((attempt) => attempt.isCorrect);

    return {
      correct: firstCorrect !== undefined,
      attemptNumber: firstCorrect?.attemptNumber ?? forExercise.length,
    };
  });

  const answered = outcomes.filter((outcome) => outcome.correct).length;
  if (lessonExercises.length === 0 || answered < lessonExercises.length) {
    return c.json({ error: 'Every exercise must be answered correctly first', answered }, 409);
  }

  const firstCompletion = existing?.status !== 'completed';
  const bonus = lessonCompletionBonus(firstCompletion);
  const score = firstTryRate(outcomes);

  // Exercise XP already landed on submission; only the bonus is new here. The
  // total reported back is what this run was worth end to end.
  const runXp = runAttempts.reduce((total, attempt) => total + attempt.xpAwarded, 0);
  const xpEarned = runXp + bonus;

  const profile = await getOrCreateProfile(db, user.id);
  const streak = advanceStreak(toStreakState(profile), parsed.data.localDay);
  const now = new Date();

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
        completions: runNumber,
        completedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          bestScore: sql`max(${lessonProgress.bestScore}, ${score})`,
          xpEarned: sql`${lessonProgress.xpEarned} + ${xpEarned}`,
          completions: runNumber,
          completedAt: now,
          updatedAt: now,
        },
      }),
    db
      .update(learnerProfiles)
      .set({
        totalXp: sql`${learnerProfiles.totalXp} + ${bonus}`,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDay: streak.lastActiveDay,
        updatedAt: now,
      })
      .where(eq(learnerProfiles.userId, user.id)),
    db
      .insert(dailyActivity)
      .values({
        userId: user.id,
        day: parsed.data.localDay,
        xpEarned: bonus,
        lessonsCompleted: firstCompletion ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: {
          xpEarned: sql`${dailyActivity.xpEarned} + ${bonus}`,
          lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + ${firstCompletion ? 1 : 0}`,
        },
      }),
  ]);

  const totalXp = profile.totalXp + bonus;

  return c.json({
    xpEarned,
    bonus,
    score,
    firstCompletion,
    /** True when nothing new was earned, so the UI can frame it as practice. */
    practice: xpEarned === 0,
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
