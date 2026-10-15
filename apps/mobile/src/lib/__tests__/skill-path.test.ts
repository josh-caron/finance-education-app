import { describe, expect, it } from 'vitest';

import type { LessonStatus, UnitSummary } from '../api-types';
import { currentLessonId, nodeState, pathOffset } from '../skill-path';

function unit(id: string, unlocked: boolean, statuses: LessonStatus[]): UnitSummary {
  return {
    id,
    title: id,
    description: '',
    order: 0,
    prerequisites: [],
    unlocked,
    lessons: statuses.map((status, index) => ({
      id: `${id}.${index}`,
      title: `${id} ${index}`,
      order: index,
      status,
      bestScore: 0,
    })),
  };
}

describe('skill path', () => {
  it('points at the first unfinished lesson in the first open unit', () => {
    const units = [
      unit('a', true, ['completed', 'completed']),
      unit('b', true, ['completed', 'in_progress', 'not_started']),
      unit('c', false, ['not_started']),
    ];
    expect(currentLessonId(units)).toBe('b.1');
  });

  it('never points into a locked unit, and is null when all is done', () => {
    expect(
      currentLessonId([unit('a', true, ['completed']), unit('b', false, ['not_started'])]),
    ).toBe(null);
  });

  it('labels each node by unit lock, completion, and the current lesson', () => {
    const open = unit('a', true, ['completed', 'not_started', 'not_started']);
    const locked = unit('b', false, ['completed']);
    const current = currentLessonId([open]);

    expect(open.lessons.map((lesson) => nodeState(open, lesson, current))).toEqual([
      'completed',
      'current',
      'open',
    ]);
    // A locked unit reads as locked even if a lesson in it was finished earlier.
    expect(nodeState(locked, locked.lessons[0]!, current)).toBe('locked');
  });

  it('winds the path and repeats', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(pathOffset)).toEqual([0, 44, 66, 44, 0, -44, -66, -44]);
    expect(pathOffset(8)).toBe(0);
  });
});
