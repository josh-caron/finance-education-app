import type { UnitSummary } from './api-types';

const isComplete = (unit: UnitSummary) =>
  unit.lessons.length > 0 && unit.lessons.every((lesson) => lesson.status === 'completed');

/** Use fresh progress after a first completion; practice never repeats a milestone. */
export function getUnitCelebration(unitId: string, firstCompletion: boolean, units: UnitSummary[]) {
  const unit = units.find((candidate) => candidate.id === unitId);
  if (!firstCompletion || !unit || !isComplete(unit)) return null;

  const ordered = [...units].sort((a, b) => a.order - b.order);
  const unlocked = ordered.filter(
    (candidate) =>
      candidate.unlocked && candidate.prerequisites.includes(unitId) && !isComplete(candidate),
  );
  const nextUnit = [...unlocked, ...ordered].find(
    (candidate) =>
      candidate.id !== unitId &&
      candidate.unlocked &&
      candidate.lessons.some((lesson) => lesson.status !== 'completed'),
  );
  const nextLesson = nextUnit
    ? [...nextUnit.lessons]
        .sort((a, b) => a.order - b.order)
        .find((lesson) => lesson.status !== 'completed')
    : undefined;

  return { unit, unlocked, nextUnit, nextLesson, courseComplete: units.every(isComplete) };
}

export type UnitCelebration = NonNullable<ReturnType<typeof getUnitCelebration>>;
