import type { UnitSummary } from './api-types';

export type NodeState = 'completed' | 'current' | 'open' | 'locked';

/**
 * The one lesson the path points the learner at: the first unfinished lesson
 * in the first unlocked unit that has one. Null once everything is done.
 */
export function currentLessonId(units: UnitSummary[]): string | null {
  for (const unit of units) {
    if (!unit.unlocked) continue;
    const next = unit.lessons.find((lesson) => lesson.status !== 'completed');
    if (next) return next.id;
  }
  return null;
}

export function nodeState(
  unit: UnitSummary,
  lesson: UnitSummary['lessons'][number],
  current: string | null,
): NodeState {
  if (!unit.unlocked) return 'locked';
  if (lesson.status === 'completed') return 'completed';
  return lesson.id === current ? 'current' : 'open';
}

/** Sideways offsets for the winding path, repeating every eight nodes. */
const WAVE = [0, 44, 66, 44, 0, -44, -66, -44] as const;

export function pathOffset(index: number): number {
  return WAVE[index % WAVE.length]!;
}
