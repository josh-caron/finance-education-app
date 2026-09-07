import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { exercises, lessonProgress, lessons, unitPrerequisites, units } from '@fin/db';
import { toPublicExercise } from '@fin/core';

import type { AppEnv } from '../types';

/**
 * Course content, read from D1 (seeded from @fin/content). Answer keys are
 * stripped here; grading happens in the progress routes.
 */
export const contentRoutes = new Hono<AppEnv>();

/** The skill tree, with unlock state and per-lesson status for the caller. */
contentRoutes.get('/units', async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  const [unitRows, lessonRows, prerequisiteRows] = await Promise.all([
    db.select().from(units).orderBy(asc(units.sortOrder)),
    db.select().from(lessons).orderBy(asc(lessons.sortOrder)),
    db.select().from(unitPrerequisites),
  ]);

  const progressRows = user
    ? await db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id))
    : [];
  const progressByLesson = new Map(progressRows.map((row) => [row.lessonId, row]));

  const lessonsByUnit = new Map<string, typeof lessonRows>();
  for (const lesson of lessonRows) {
    const bucket = lessonsByUnit.get(lesson.unitId) ?? [];
    bucket.push(lesson);
    lessonsByUnit.set(lesson.unitId, bucket);
  }

  const prerequisitesByUnit = new Map<string, string[]>();
  for (const edge of prerequisiteRows) {
    const bucket = prerequisitesByUnit.get(edge.unitId) ?? [];
    bucket.push(edge.prerequisiteUnitId);
    prerequisitesByUnit.set(edge.unitId, bucket);
  }

  const isUnitComplete = (unitId: string): boolean => {
    const unitLessons = lessonsByUnit.get(unitId) ?? [];
    return (
      unitLessons.length > 0 &&
      unitLessons.every((lesson) => progressByLesson.get(lesson.id)?.status === 'completed')
    );
  };

  return c.json({
    units: unitRows.map((unit) => {
      const prerequisites = prerequisitesByUnit.get(unit.id) ?? [];

      return {
        id: unit.id,
        title: unit.title,
        description: unit.description,
        order: unit.sortOrder,
        prerequisites,
        unlocked: prerequisites.every(isUnitComplete),
        lessons: (lessonsByUnit.get(unit.id) ?? []).map((lesson) => {
          const progress = progressByLesson.get(lesson.id);

          return {
            id: lesson.id,
            title: lesson.title,
            order: lesson.sortOrder,
            status: progress?.status ?? 'not_started',
            bestScore: progress?.bestScore ?? 0,
          };
        }),
      };
    }),
  });
});

/** One lesson with its exercises, answer keys removed. */
contentRoutes.get('/lessons/:lessonId', async (c) => {
  const db = c.get('db');
  const lessonId = c.req.param('lessonId');

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404);
  }

  const exerciseRows = await db
    .select()
    .from(exercises)
    .where(eq(exercises.lessonId, lessonId))
    .orderBy(asc(exercises.sortOrder));

  return c.json({
    id: lesson.id,
    unitId: lesson.unitId,
    title: lesson.title,
    intro: lesson.intro,
    exercises: exerciseRows.map((row) => toPublicExercise(row.payload)),
  });
});

/** Lesson ids for a set of units, used by the client to prefetch a unit. */
contentRoutes.get('/units/:unitId/lessons', async (c) => {
  const db = c.get('db');
  const unitId = c.req.param('unitId');

  const rows = await db
    .select({ id: lessons.id, title: lessons.title, order: lessons.sortOrder })
    .from(lessons)
    .where(eq(lessons.unitId, unitId))
    .orderBy(asc(lessons.sortOrder));

  return c.json({ lessons: rows });
});
