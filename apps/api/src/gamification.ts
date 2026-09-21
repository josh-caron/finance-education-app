import { eq } from 'drizzle-orm';
import {
  achievements,
  achievementById,
  hintFreeSolvedCount,
  newlyUnlockedAchievements,
  titleForLevel,
  type AchievementDefinition,
} from '@fin/core';
import {
  exerciseAttempts,
  lessons,
  lessonProgress,
  unitPrerequisites,
  units,
  userAchievements,
} from '@fin/db';

import { leaderboardQuery, leaderboardResult, leaderboardWeek } from './leaderboard-query';
import type { AppEnv } from './types';

type Db = AppEnv['Variables']['db'];
type D1 = AppEnv['Bindings']['DB'];

export interface CelebrationPayload {
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

export async function completedUnitIds(db: Db, userId: string): Promise<string[]> {
  const [unitRows, lessonRows, progressRows] = await Promise.all([
    db.select({ id: units.id }).from(units),
    db.select({ id: lessons.id, unitId: lessons.unitId }).from(lessons),
    db
      .select({ lessonId: lessonProgress.lessonId, status: lessonProgress.status })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId)),
  ]);

  const done = new Set(
    progressRows.filter((row) => row.status === 'completed').map((row) => row.lessonId),
  );

  return unitRows
    .filter((unit) => {
      const unitLessons = lessonRows.filter((lesson) => lesson.unitId === unit.id);
      return unitLessons.length > 0 && unitLessons.every((lesson) => done.has(lesson.id));
    })
    .map((unit) => unit.id);
}

export async function weeklyRankForUser(d1: D1, userId: string): Promise<number | null> {
  const week = leaderboardWeek();
  const { results } = await d1
    .prepare(leaderboardQuery('weekly'))
    .bind(week.start, week.end, userId)
    .all<{
      userId: string;
      name: string;
      xp: number;
      rank: number;
      position: number;
      total: number;
    }>();
  return leaderboardResult(results, userId, 'weekly', week).currentUser?.rank ?? null;
}

export async function hintFreeCount(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select({
      exerciseId: exerciseAttempts.exerciseId,
      isCorrect: exerciseAttempts.isCorrect,
      hintUsed: exerciseAttempts.hintUsed,
    })
    .from(exerciseAttempts)
    .where(eq(exerciseAttempts.userId, userId));

  return hintFreeSolvedCount(
    rows.map((row) => ({
      exerciseId: row.exerciseId,
      isCorrect: row.isCorrect,
      hintUsed: Boolean(row.hintUsed),
    })),
  );
}

export async function persistNewAchievements(
  db: Db,
  userId: string,
  unlocked: AchievementDefinition[],
): Promise<AchievementDefinition[]> {
  if (unlocked.length === 0) return [];
  const now = new Date();
  await db
    .insert(userAchievements)
    .values(
      unlocked.map((item) => ({
        userId,
        achievementId: item.id,
        earnedAt: now,
      })),
    )
    .onConflictDoNothing();
  return unlocked;
}

export async function evaluateAndAward(
  db: Db,
  d1: D1,
  userId: string,
  extras: {
    completedLessonCount: number;
    currentStreak: number;
    perfectLessonJustCompleted: boolean;
  },
): Promise<AchievementDefinition[]> {
  const [earned, unitIds, weeklyRank, hintFreeExerciseCount] = await Promise.all([
    db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId)),
    completedUnitIds(db, userId),
    weeklyRankForUser(d1, userId),
    hintFreeCount(db, userId),
  ]);

  const unlocked = newlyUnlockedAchievements({
    earnedIds: earned.map((row) => row.achievementId),
    completedLessonCount: extras.completedLessonCount,
    currentStreak: extras.currentStreak,
    completedUnitIds: unitIds,
    perfectLessonJustCompleted: extras.perfectLessonJustCompleted,
    hintFreeExerciseCount,
    weeklyRank,
  });

  return persistNewAchievements(db, userId, unlocked);
}

export async function unitUnlockAfter(
  db: Db,
  completedUnitId: string | null,
): Promise<{ id: string; title: string } | null> {
  if (!completedUnitId) return null;
  const waiting = await db
    .select({
      id: units.id,
      title: units.title,
      prerequisite: unitPrerequisites.prerequisiteUnitId,
    })
    .from(units)
    .innerJoin(unitPrerequisites, eq(unitPrerequisites.unitId, units.id));

  const match = waiting.find((row) => row.prerequisite === completedUnitId);
  return match ? { id: match.id, title: match.title } : null;
}

export async function celebrationFor(
  db: Db,
  d1: D1,
  input: {
    userId: string;
    lessonUnitId: string;
    firstCompletion: boolean;
    completedLessonCount: number;
    currentStreak: number;
    perfectLessonJustCompleted: boolean;
    previousLevel: number;
    newLevel: number;
  },
): Promise<CelebrationPayload> {
  const unitsBefore = input.firstCompletion
    ? (await completedUnitIds(db, input.userId)).filter((id) => id !== input.lessonUnitId)
    : await completedUnitIds(db, input.userId);

  const newAchievements = await evaluateAndAward(db, d1, input.userId, {
    completedLessonCount: input.completedLessonCount,
    currentStreak: input.currentStreak,
    perfectLessonJustCompleted: input.perfectLessonJustCompleted,
  });

  const unitsAfter = await completedUnitIds(db, input.userId);
  const unitJustCompleted =
    input.firstCompletion &&
    !unitsBefore.includes(input.lessonUnitId) &&
    unitsAfter.includes(input.lessonUnitId);

  const [unit] = await db
    .select({ id: units.id, title: units.title })
    .from(units)
    .where(eq(units.id, input.lessonUnitId))
    .limit(1);

  return {
    unitJustCompleted,
    unitId: unitJustCompleted ? (unit?.id ?? input.lessonUnitId) : null,
    unitTitle: unitJustCompleted ? (unit?.title ?? null) : null,
    unlockedUnit: unitJustCompleted ? await unitUnlockAfter(db, input.lessonUnitId) : null,
    previousLevel: input.previousLevel,
    previousTitle: titleForLevel(input.previousLevel),
    newLevel: input.newLevel,
    newTitle: titleForLevel(input.newLevel),
    leveledUp: input.newLevel > input.previousLevel,
    newAchievements,
  };
}

export function catalogWithEarned(rows: { achievementId: string; earnedAt: Date }[]): {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string | null;
}[] {
  const earnedAt = new Map(rows.map((row) => [row.achievementId, row.earnedAt.toISOString()]));
  return achievements.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    category: item.category,
    earnedAt: earnedAt.get(item.id) ?? null,
  }));
}

export { achievementById };
