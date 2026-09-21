import { describe, expect, it } from 'vitest';

import {
  hintFreeSolvedCount,
  isAchievementMet,
  lessonRunIsPerfect,
  newlyUnlockedAchievements,
  type AchievementSnapshot,
} from '../achievements';

const base: AchievementSnapshot = {
  earnedIds: [],
  completedLessonCount: 0,
  currentStreak: 0,
  completedUnitIds: [],
  perfectLessonJustCompleted: false,
  hintFreeExerciseCount: 0,
  weeklyRank: null,
};

describe('newlyUnlockedAchievements', () => {
  it('unlocks First Steps only after a completed lesson and only once', () => {
    expect(newlyUnlockedAchievements(base).map((item) => item.id)).not.toContain('first_steps');
    expect(
      newlyUnlockedAchievements({ ...base, completedLessonCount: 1 }).map((item) => item.id),
    ).toContain('first_steps');
    expect(
      newlyUnlockedAchievements({
        ...base,
        completedLessonCount: 4,
        earnedIds: ['first_steps'],
      }).map((item) => item.id),
    ).not.toContain('first_steps');
  });

  it('unlocks On a Roll at streak 3 and keeps it after a reset', () => {
    expect(isAchievementMet('on_a_roll', { ...base, currentStreak: 2 })).toBe(false);
    expect(isAchievementMet('on_a_roll', { ...base, currentStreak: 3 })).toBe(true);
    expect(
      newlyUnlockedAchievements({ ...base, currentStreak: 1, earnedIds: ['on_a_roll'] }).map(
        (item) => item.id,
      ),
    ).not.toContain('on_a_roll');
  });

  it('unlocks unit badges only when those units are complete', () => {
    expect(isAchievementMet('budget_brain', base)).toBe(false);
    expect(
      isAchievementMet('budget_brain', { ...base, completedUnitIds: ['budgeting-saving'] }),
    ).toBe(true);
    expect(
      isAchievementMet('emergency_ready', { ...base, completedUnitIds: ['budgeting-saving'] }),
    ).toBe(false);
    expect(
      isAchievementMet('emergency_ready', { ...base, completedUnitIds: ['banking-emergency'] }),
    ).toBe(true);
  });

  it('unlocks Perfect Lesson only for a clean run', () => {
    expect(isAchievementMet('perfect_lesson', base)).toBe(false);
    expect(isAchievementMet('perfect_lesson', { ...base, perfectLessonJustCompleted: true })).toBe(
      true,
    );
  });

  it('unlocks Independent Thinker at 10 hint-free solves, not 9', () => {
    expect(isAchievementMet('independent_thinker', { ...base, hintFreeExerciseCount: 9 })).toBe(
      false,
    );
    expect(isAchievementMet('independent_thinker', { ...base, hintFreeExerciseCount: 10 })).toBe(
      true,
    );
  });

  it('unlocks Top 10 at ranks 1 and 10, not 11, and does not revoke', () => {
    expect(isAchievementMet('top_10', { ...base, weeklyRank: 1 })).toBe(true);
    expect(isAchievementMet('top_10', { ...base, weeklyRank: 10 })).toBe(true);
    expect(isAchievementMet('top_10', { ...base, weeklyRank: 11 })).toBe(false);
    expect(isAchievementMet('top_10', { ...base, weeklyRank: null })).toBe(false);
    expect(
      newlyUnlockedAchievements({ ...base, weeklyRank: 20, earnedIds: ['top_10'] }).map(
        (item) => item.id,
      ),
    ).not.toContain('top_10');
  });
});

describe('lessonRunIsPerfect', () => {
  it('requires every exercise correct on the first attempt', () => {
    expect(
      lessonRunIsPerfect([
        { correct: true, attemptNumber: 1 },
        { correct: true, attemptNumber: 1 },
      ]),
    ).toBe(true);
    expect(
      lessonRunIsPerfect([
        { correct: true, attemptNumber: 1 },
        { correct: true, attemptNumber: 2 },
      ]),
    ).toBe(false);
    expect(lessonRunIsPerfect([])).toBe(false);
  });
});

describe('hintFreeSolvedCount', () => {
  it('counts a unique first solve without hints and ignores hinted or incomplete work', () => {
    expect(
      hintFreeSolvedCount([
        { exerciseId: 'a', isCorrect: true, hintUsed: false },
        { exerciseId: 'b', isCorrect: true, hintUsed: true },
        { exerciseId: 'c', isCorrect: false, hintUsed: false },
        { exerciseId: 'a', isCorrect: true, hintUsed: false },
      ]),
    ).toBe(1);
  });

  it('rejects an exercise if a hint was used before the first correct answer', () => {
    expect(
      hintFreeSolvedCount([
        { exerciseId: 'a', isCorrect: false, hintUsed: true },
        { exerciseId: 'a', isCorrect: true, hintUsed: false },
      ]),
    ).toBe(0);
  });
});
