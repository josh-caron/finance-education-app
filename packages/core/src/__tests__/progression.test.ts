import { describe, expect, it } from 'vitest';

import {
  advanceStreak,
  firstTryRate,
  isPlausibleLocalDay,
  isStreakActive,
  lessonCompletionBonus,
  levelForXp,
  recentDayKeys,
  streakHealth,
  toDayKey,
  weekdayLabel,
  xpForAttempt,
  XP_FIRST_TRY_BONUS,
  XP_LESSON_COMPLETE_BONUS,
  XP_PER_CORRECT_EXERCISE,
  type StreakState,
} from '../progression';

describe('xpForAttempt', () => {
  it('pays a bonus only for a first-try correct answer', () => {
    expect(xpForAttempt({ correct: true, attemptNumber: 1, alreadySolved: false })).toBe(
      XP_PER_CORRECT_EXERCISE + XP_FIRST_TRY_BONUS,
    );
    expect(xpForAttempt({ correct: true, attemptNumber: 3, alreadySolved: false })).toBe(
      XP_PER_CORRECT_EXERCISE,
    );
  });

  it('pays nothing for a wrong answer', () => {
    expect(xpForAttempt({ correct: false, attemptNumber: 1, alreadySolved: false })).toBe(0);
  });

  it('pays nothing for an exercise already solved, however it is answered', () => {
    expect(xpForAttempt({ correct: true, attemptNumber: 1, alreadySolved: true })).toBe(0);
    expect(xpForAttempt({ correct: true, attemptNumber: 9, alreadySolved: true })).toBe(0);
    expect(xpForAttempt({ correct: false, attemptNumber: 1, alreadySolved: true })).toBe(0);
  });

  it('makes replaying a finished lesson worth nothing', () => {
    const replay = [1, 2, 3].map(() =>
      xpForAttempt({ correct: true, attemptNumber: 1, alreadySolved: true }),
    );
    expect(replay.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('lessonCompletionBonus', () => {
  it('pays only on the first completion', () => {
    expect(lessonCompletionBonus(true)).toBe(XP_LESSON_COMPLETE_BONUS);
    expect(lessonCompletionBonus(false)).toBe(0);
  });
});

describe('firstTryRate', () => {
  it('scores a clean run at 100', () => {
    expect(
      firstTryRate([
        { correct: true, attemptNumber: 1 },
        { correct: true, attemptNumber: 1 },
      ]),
    ).toBe(100);
  });

  it('discounts exercises that took more than one attempt', () => {
    expect(
      firstTryRate([
        { correct: true, attemptNumber: 1 },
        { correct: true, attemptNumber: 2 },
        { correct: true, attemptNumber: 1 },
      ]),
    ).toBe(67);
  });

  it('is zero with nothing attempted', () => {
    expect(firstTryRate([])).toBe(0);
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

describe('isPlausibleLocalDay', () => {
  const noonUtc = new Date('2026-09-16T12:00:00Z');

  it('accepts the UTC date and one day either side', () => {
    expect(isPlausibleLocalDay('2026-09-15', noonUtc)).toBe(true);
    expect(isPlausibleLocalDay('2026-09-16', noonUtc)).toBe(true);
    expect(isPlausibleLocalDay('2026-09-17', noonUtc)).toBe(true);
  });

  it('rejects days no timezone could be on', () => {
    expect(isPlausibleLocalDay('2026-09-14', noonUtc)).toBe(false);
    expect(isPlausibleLocalDay('2026-09-18', noonUtc)).toBe(false);
    expect(isPlausibleLocalDay('2030-01-01', noonUtc)).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    const feb = new Date('2026-03-01T00:00:00Z');
    expect(isPlausibleLocalDay('2026-02-29', feb)).toBe(false);
    expect(isPlausibleLocalDay('2026-02-30', feb)).toBe(false);
    expect(isPlausibleLocalDay('2026-13-01', noonUtc)).toBe(false);
  });

  it('accepts a real leap day', () => {
    expect(isPlausibleLocalDay('2028-02-29', new Date('2028-02-29T06:00:00Z'))).toBe(true);
  });

  it('rejects anything not shaped like YYYY-MM-DD', () => {
    expect(isPlausibleLocalDay('16/09/2026', noonUtc)).toBe(false);
    expect(isPlausibleLocalDay('2026-9-16', noonUtc)).toBe(false);
    expect(isPlausibleLocalDay('', noonUtc)).toBe(false);
  });

  it('handles a year boundary', () => {
    const newYear = new Date('2027-01-01T03:00:00Z');
    expect(isPlausibleLocalDay('2026-12-31', newYear)).toBe(true);
    expect(isPlausibleLocalDay('2027-01-02', newYear)).toBe(true);
  });
});
