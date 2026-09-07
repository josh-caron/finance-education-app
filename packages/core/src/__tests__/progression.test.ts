import { describe, expect, it } from 'vitest';

import {
  advanceStreak,
  isStreakActive,
  levelForXp,
  toDayKey,
  xpForExercise,
  xpForLesson,
  XP_FIRST_TRY_BONUS,
  XP_LESSON_COMPLETE_BONUS,
  XP_PER_CORRECT_EXERCISE,
  type StreakState,
} from '../progression';

describe('xp', () => {
  it('pays a bonus only for a first-try correct answer', () => {
    expect(xpForExercise({ correct: true, attempts: 1 })).toBe(
      XP_PER_CORRECT_EXERCISE + XP_FIRST_TRY_BONUS,
    );
    expect(xpForExercise({ correct: true, attempts: 3 })).toBe(XP_PER_CORRECT_EXERCISE);
    expect(xpForExercise({ correct: false, attempts: 1 })).toBe(0);
  });

  it('adds the lesson bonus only on a flawless first completion', () => {
    const perfect = [
      { correct: true, attempts: 1 },
      { correct: true, attempts: 1 },
    ];
    const base = 2 * (XP_PER_CORRECT_EXERCISE + XP_FIRST_TRY_BONUS);

    expect(xpForLesson(perfect, true)).toBe(base + XP_LESSON_COMPLETE_BONUS);
    expect(xpForLesson(perfect, false)).toBe(base);
    expect(xpForLesson([...perfect, { correct: false, attempts: 2 }], true)).toBe(base);
  });
});

describe('levelForXp', () => {
  it('starts every learner at level 1', () => {
    expect(levelForXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpToNext: 100 });
  });

  it('levels up at the threshold, not before', () => {
    expect(levelForXp(99).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(300).level).toBe(3);
  });
});

describe('streaks', () => {
  const start: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDay: '2026-09-07' };

  it('ignores a second session on the same day', () => {
    expect(advanceStreak(start, '2026-09-07')).toEqual(start);
  });

  it('extends across consecutive days', () => {
    expect(advanceStreak(start, '2026-09-08')).toEqual({
      currentStreak: 4,
      longestStreak: 5,
      lastActiveDay: '2026-09-08',
    });
  });

  it('resets after a missed day and keeps the longest streak', () => {
    expect(advanceStreak(start, '2026-09-10')).toEqual({
      currentStreak: 1,
      longestStreak: 5,
      lastActiveDay: '2026-09-10',
    });
  });

  it('extends across a month boundary', () => {
    const endOfMonth: StreakState = {
      currentStreak: 2,
      longestStreak: 2,
      lastActiveDay: '2026-09-30',
    };
    expect(advanceStreak(endOfMonth, '2026-10-01').currentStreak).toBe(3);
  });

  it('counts a streak as alive until the day after the last session', () => {
    expect(isStreakActive(start, '2026-09-08')).toBe(true);
    expect(isStreakActive(start, '2026-09-09')).toBe(false);
    expect(isStreakActive({ ...start, lastActiveDay: null }, '2026-09-08')).toBe(false);
  });
});

describe('toDayKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDayKey(new Date(2026, 8, 7))).toBe('2026-09-07');
  });
});
