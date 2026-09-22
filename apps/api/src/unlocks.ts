import { and, eq, inArray } from 'drizzle-orm';
import { lessonProgress, lessons, unitPrerequisites, type Database } from '@fin/db';
import { groupBy, missingPrerequisites } from '@fin/core';

/**
 * Prerequisite units a learner still has to finish before `unitId` opens.
 * Empty means the unit is unlocked.
 *
 * Reads only the edges and lessons this unit depends on, so checking a single
 * answer does not load the whole course.
 */
export async function lockingPrerequisites(
  db: Database,
  userId: string,
  unitId: string,
): Promise<string[]> {
  const edges = await db
    .select({ prerequisite: unitPrerequisites.prerequisiteUnitId })
    .from(unitPrerequisites)
    .where(eq(unitPrerequisites.unitId, unitId));

  if (edges.length === 0) return [];

  const prerequisiteIds = edges.map((edge) => edge.prerequisite);
  const prerequisiteLessons = await db
    .select({ id: lessons.id, unitId: lessons.unitId })
    .from(lessons)
    .where(inArray(lessons.unitId, prerequisiteIds));

  const completed =
    prerequisiteLessons.length === 0
      ? []
      : await db
          .select({ lessonId: lessonProgress.lessonId })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.status, 'completed'),
              inArray(
                lessonProgress.lessonId,
                prerequisiteLessons.map((lesson) => lesson.id),
              ),
            ),
          );

  return missingPrerequisites(
    unitId,
    {
      prerequisitesByUnit: new Map([[unitId, prerequisiteIds]]),
      lessonsByUnit: groupBy(
        prerequisiteLessons,
        (lesson) => lesson.unitId,
        (lesson) => lesson.id,
      ),
    },
    new Set(completed.map((row) => row.lessonId)),
  );
}
