import { describe, expect, it } from 'vitest';
import { getUnitCelebration } from '../unit-celebration';
import type { UnitSummary } from '../api-types';

function unit(id: string, completed: boolean, options: Partial<UnitSummary> = {}): UnitSummary {
  return {
    id,
    title: id,
    description: '',
    order: 0,
    prerequisites: [],
    unlocked: true,
    lessons: [
      {
        id: `${id}.one`,
        title: 'One',
        order: 0,
        status: completed ? 'completed' : 'not_started',
        bestScore: 0,
      },
    ],
    ...options,
  };
}

describe('unit completion celebration', () => {
  it('celebrates only when every lesson is complete, regardless of lesson order', () => {
    const basics = unit('basics', true);
    basics.lessons.push({
      ...basics.lessons[0]!,
      id: 'basics.two',
      order: 1,
      status: 'in_progress',
    });
    expect(getUnitCelebration('basics', true, [basics])).toBeNull();
    basics.lessons[1]!.status = 'completed';
    expect(getUnitCelebration('basics', true, [basics])?.unit.lessons).toHaveLength(2);
  });

  it('does not celebrate practice, missing units, or empty units', () => {
    expect(getUnitCelebration('basics', false, [unit('basics', true)])).toBeNull();
    expect(getUnitCelebration('missing', true, [unit('basics', true)])).toBeNull();
    expect(getUnitCelebration('basics', true, [unit('basics', true, { lessons: [] })])).toBeNull();
  });

  it('shows newly unlocked units and chooses the first unfinished lesson in course order', () => {
    const next = unit('next', false, { order: 1, prerequisites: ['basics'] });
    next.lessons = [
      { ...next.lessons[0]!, id: 'next.later', order: 2 },
      { ...next.lessons[0]!, id: 'next.done', order: 0, status: 'completed' },
      { ...next.lessons[0]!, id: 'next.resume', order: 1, status: 'in_progress' },
    ];
    const result = getUnitCelebration('basics', true, [
      unit('later', false, { order: 2, prerequisites: ['basics'] }),
      next,
      unit('basics', true),
    ]);
    expect(result?.unlocked.map((item) => item.id)).toEqual(['next', 'later']);
    expect(result?.nextLesson?.id).toBe('next.resume');
    expect(result?.courseComplete).toBe(false);
  });

  it('never offers a unit still locked by another prerequisite', () => {
    const result = getUnitCelebration('basics', true, [
      unit('basics', true),
      unit('locked', false, { unlocked: false, prerequisites: ['basics', 'other'] }),
    ]);
    expect(result?.unlocked).toEqual([]);
    expect(result?.nextLesson).toBeUndefined();
    expect(result?.courseComplete).toBe(false);
  });

  it('offers other available learning when no dependent unit unlocks', () => {
    const result = getUnitCelebration('basics', true, [unit('basics', true), unit('other', false)]);
    expect(result?.unlocked).toEqual([]);
    expect(result?.nextLesson?.id).toBe('other.one');
  });

  it('celebrates the course only when all units are finished', () => {
    const result = getUnitCelebration('last', true, [unit('basics', true), unit('last', true)]);
    expect(result?.courseComplete).toBe(true);
    expect(result?.nextLesson).toBeUndefined();
  });
});
