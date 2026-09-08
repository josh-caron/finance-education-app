import { describe, expect, it } from 'vitest';

import {
  advanceStreak,
  isStreakActive,
  levelForXp,
  recentDayKeys,
  streakHealth,
  toDayKey,
  weekdayLabel,
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

describe('streakHealth', () => {
  const state: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDay: '2026-09-07' };

  it('is active on a day already studied', () => {
    expect(streakHealth(state, '2026-09-07')).toBe('active');
  });

  it('is at risk the day after, while today is still open', () => {
    expect(streakHealth(state, '2026-09-08')).toBe('at_risk');
  });

  it('is broken once a day has been missed', () => {
    expect(streakHealth(state, '2026-09-09')).toBe('broken');
  });

  it('is broken for a learner who has never studied', () => {
    expect(streakHealth({ ...state, lastActiveDay: null }, '2026-09-08')).toBe('broken');
  });
});

describe('recentDayKeys', () => {
  it('returns the window ending today, oldest first', () => {
    expect(recentDayKeys('2026-09-08', 7)).toEqual([
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
    ]);
  });

  it('crosses a month boundary', () => {
    expect(recentDayKeys('2026-10-02', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('handles a window of one', () => {
    expect(recentDayKeys('2026-09-08', 1)).toEqual(['2026-09-08']);
  });
});

describe('weekdayLabel', () => {
  it('labels a known week', () => {
    // 2026-09-06 is a Sunday.
    expect(recentDayKeys('2026-09-12', 7).map(weekdayLabel)).toEqual([
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
  });
});
