/**
 * Skill-tree unlocking. A unit unlocks once every lesson in each of its
 * prerequisite units is completed.
 *
 * The API uses this twice: to tell the client which units are open, and to
 * refuse answers to lessons in units that are not. It lives here so those two
 * can never disagree about what counts as unlocked.
 */

export interface UnlockGraph {
  /** Prerequisite unit ids for each unit. Units with none may be absent. */
  prerequisitesByUnit: ReadonlyMap<string, readonly string[]>;
  /** Lesson ids in each unit. */
  lessonsByUnit: ReadonlyMap<string, readonly string[]>;
}

/**
 * A unit is complete when it has lessons and every one of them is completed.
 * An empty unit never counts as complete, so a unit that depends on one stays
 * locked rather than silently opening.
 */
export function isUnitComplete(
  unitId: string,
  lessonsByUnit: UnlockGraph['lessonsByUnit'],
  completedLessonIds: ReadonlySet<string>,
): boolean {
  const lessonIds = lessonsByUnit.get(unitId) ?? [];
  return lessonIds.length > 0 && lessonIds.every((id) => completedLessonIds.has(id));
}

/** Prerequisite units the learner has not finished yet. Empty means unlocked. */
export function missingPrerequisites(
  unitId: string,
  graph: UnlockGraph,
  completedLessonIds: ReadonlySet<string>,
): string[] {
  return (graph.prerequisitesByUnit.get(unitId) ?? []).filter(
    (prerequisite) => !isUnitComplete(prerequisite, graph.lessonsByUnit, completedLessonIds),
  );
}

export function isUnitUnlocked(
  unitId: string,
  graph: UnlockGraph,
  completedLessonIds: ReadonlySet<string>,
): boolean {
  return missingPrerequisites(unitId, graph, completedLessonIds).length === 0;
}

/** Groups (key, value) rows into a map of arrays, preserving row order. */
export function groupBy<T>(rows: readonly T[], key: (row: T) => string, value: (row: T) => string) {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const bucket = groups.get(key(row)) ?? [];
    bucket.push(value(row));
    groups.set(key(row), bucket);
  }
  return groups;
}
