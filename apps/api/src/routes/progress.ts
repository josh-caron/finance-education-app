import { Hono, type Context } from 'hono';
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
  isPlausibleLocalDay,
  lessonCompletionBonus,
  levelForXp,
  recentDayKeys,
  streakHealth,
  xpForAttempt,
  type Answer,
  type StreakState,
} from '@fin/core';

import { requireAuth } from '../middleware/session';
import { lockingPrerequisites } from '../unlocks';
import type { AppEnv } from '../types';

export const progressRoutes = new Hono<AppEnv>();

progressRoutes.use('*', requireAuth);

/**
 * Upper bounds on what a learner can submit. Submitted answers are stored as
 * JSON on every attempt, so without caps a client could write arbitrarily large
 * rows while staying under the rate limit. The limits are far above anything
 * real content needs: ids are short slugs and ordering exercises have a handful
 * of items.
 */
const MAX_ID_LENGTH = 200;
const MAX_ORDERING_ITEMS = 50;

const idSchema = z.string().min(1).max(MAX_ID_LENGTH);

const answerSchema: z.ZodType<Answer> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('multiple_choice'), choiceId: idSchema }),
  z.object({
    kind: z.literal('ordering'),
    order: z.array(idSchema).min(2).max(MAX_ORDERING_ITEMS),
  }),
  z.object({ kind: z.literal('computed_answer'), value: z.number().finite() }),
]);

/**
 * The learner's local day, YYYY-MM-DD. Streaks follow their calendar rather
 * than UTC, which makes this client-controlled, so it must also be a day that
 * could actually be today somewhere. Otherwise replays labelled with
 * consecutive future days would build an arbitrary streak.
 */
const dayKeySchema = z
  .string()
  .max(10)
  .refine((day) => isPlausibleLocalDay(day, new Date()), {
    message: 'Expected today in YYYY-MM-DD, as a real date within a day of UTC',
  });

const submitSchema = z.object({
  exerciseId: idSchema,
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
    showOnLeaderboard: !profile.hideFromLeaderboard,
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

const settingsSchema = z
  .object({
    /** False keeps the learner out of every leaderboard ranking. */
    showOnLeaderboard: z.boolean(),
  })
  .strict();

/** Updates the caller's own settings. */
progressRoutes.patch('/me', async (c) => {
  const db = c.get('db');
  const user = c.get('user')!;

  const parsed = settingsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Invalid settings', issues: parsed.error.issues }, 400);
  }

  await getOrCreateProfile(db, user.id);
  await db
    .update(learnerProfiles)
    .set({ hideFromLeaderboard: !parsed.data.showOnLeaderboard, updatedAt: new Date() })
    .where(eq(learnerProfiles.userId, user.id));

  return c.json({ showOnLeaderboard: parsed.data.showOnLeaderboard });
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

  const [owningLesson] = await db
    .select({ unitId: lessons.unitId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  const locked = await lockingPrerequisites(db, user.id, owningLesson!.unitId);
  if (locked.length > 0) {
    return lockedResponse(c, locked);
  }

  const result = gradeExercise(exercise.payload, parsed.data.answer);
  await getOrCreateProfile(db, user.id);

  // These reads execute inside the write batch, rather than before it. D1
  // serializes batches, so a competing request sees the first one's attempt.
  const runNumber = sql`(select completions + 1 from lesson_progress
    where user_id = ${user.id} and lesson_id = ${lessonId})`;
  const prior = sql`user_id = ${user.id} and exercise_id = ${exercise.id}`;
  const alreadySolvedQuery = db
    .select({ id: exerciseAttempts.id })
    .from(exerciseAttempts)
    .where(
      and(
        eq(exerciseAttempts.userId, user.id),
        eq(exerciseAttempts.exerciseId, exercise.id),
        eq(exerciseAttempts.isCorrect, true),
      ),
    )
    .limit(1);
  const firstTryXp = xpForAttempt({
    correct: result.correct,
    attemptNumber: 1,
    alreadySolved: false,
  });
  const retryXp = xpForAttempt({ correct: result.correct, attemptNumber: 2, alreadySolved: false });
  const awardedXp = sql`case
    when exists(select 1 from exercise_attempts where ${prior} and is_correct = 1) then 0
    when exists(select 1 from exercise_attempts where ${prior}) then ${retryXp}
    else ${firstTryXp} end`;
  const attemptId = crypto.randomUUID();
  const bankedXp = sql`(select xp_awarded from exercise_attempts where id = ${attemptId})`;

  const logAttempt = db
    .insert(exerciseAttempts)
    .values({
      id: attemptId,
      userId: user.id,
      lessonId,
      exerciseId: exercise.id,
      runNumber,
      attemptNumber: sql`(select count(*) + 1 from exercise_attempts
      where ${prior} and run_number = ${runNumber})`,
      isCorrect: result.correct,
      submitted: parsed.data.answer,
      xpAwarded: awardedXp,
    })
    .returning();

  const markInProgress = db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId, status: 'in_progress' })
    .onConflictDoNothing();

  const [, solvedBefore, logged, profiles] = await db.batch([
    markInProgress,
    alreadySolvedQuery,
    logAttempt,
    db
      .update(learnerProfiles)
      .set({
        totalXp: sql`${learnerProfiles.totalXp} + ${bankedXp}`,
        updatedAt: new Date(),
      })
      .where(eq(learnerProfiles.userId, user.id))
      .returning(),
    db
      .insert(dailyActivity)
      .select(
        sql`select ${user.id}, ${parsed.data.localDay}, ${bankedXp}, 0
          where ${bankedXp} > 0`,
      )
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: { xpEarned: sql`${dailyActivity.xpEarned} + ${bankedXp}` },
      }),
  ]);

  const { attemptNumber, xpAwarded } = logged[0]!;
  const alreadySolved = solvedBefore.length > 0;
  const totalXp = profiles[0]!.totalXp;

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

  const locked = await lockingPrerequisites(db, user.id, lesson.unitId);
  if (locked.length > 0) {
    return lockedResponse(c, locked);
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

  // Claim this run with a compare-and-set. Each following write is gated by
  // changes() from the preceding write in the same atomic D1 batch. A request
  // that loses the claim cannot pay XP or update daily activity.
  const [completed, profiles] = await db.batch([
    db
      .update(lessonProgress)
      .set({
        status: 'completed',
        bestScore: sql`max(${lessonProgress.bestScore}, ${score})`,
        xpEarned: sql`${lessonProgress.xpEarned} + ${xpEarned}`,
        completions: runNumber,
        completedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(lessonProgress.userId, user.id),
          eq(lessonProgress.lessonId, lessonId),
          eq(lessonProgress.completions, runNumber - 1),
        ),
      )
      .returning(),
    db
      .update(learnerProfiles)
      .set({
        totalXp: sql`${learnerProfiles.totalXp} + ${bonus}`,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDay: streak.lastActiveDay,
        updatedAt: now,
      })
      .where(and(eq(learnerProfiles.userId, user.id), sql`changes() = 1`))
      .returning(),
    db
      .insert(dailyActivity)
      .select(
        sql`select ${user.id}, ${parsed.data.localDay}, ${bonus}, ${firstCompletion ? 1 : 0}
        where changes() = 1`,
      )
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: {
          xpEarned: sql`${dailyActivity.xpEarned} + ${bonus}`,
          lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + ${firstCompletion ? 1 : 0}`,
        },
      }),
  ]);

  if (completed.length === 0) {
    return c.json({ error: 'This lesson run has already been completed' }, 409);
  }

  const totalXp = profiles[0]!.totalXp;

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

/**
 * Locked units are enforced here, not only hidden in the UI: otherwise a learner
 * calling the API directly could earn XP and leaderboard rank from them.
 */
function lockedResponse(c: Context<AppEnv>, requires: string[]) {
  return c.json({ error: 'This lesson is locked', requires }, 403);
}

async function getOrCreateProfile(db: Db, userId: string) {
  const [existing] = await db
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1);

  if (existing) return existing;

  // Concurrent first requests can both observe a missing profile.
  await db.insert(learnerProfiles).values({ userId }).onConflictDoNothing();
  const [created] = await db
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1);
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
