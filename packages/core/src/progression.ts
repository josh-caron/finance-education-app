/**
 * XP, levels and streaks. Backlog item 5 (Josh) builds the UI on top of these;
 * the rules live here so the API and the client score identically.
 */

const MS_PER_DAY = 86_400_000;

export const XP_PER_CORRECT_EXERCISE = 10;
/** Awarded on top when the exercise is answered correctly on the first attempt. */
export const XP_FIRST_TRY_BONUS = 5;
/** Awarded once, the first time a lesson is completed. */
export const XP_LESSON_COMPLETE_BONUS = 20;

export interface AttemptOutcome {
  correct: boolean;
  /** 1 for the learner's first ever submission for this exercise. */
  attemptNumber: number;
  /** Whether this exercise has already been answered correctly at some point. */
  alreadySolved: boolean;
}

/**
 * XP for a single submission, and the only place exercise XP is decided.
 *
 * An exercise pays out at most once, ever. Replaying a finished lesson is free
 * practice worth nothing, so XP cannot be farmed by repeating easy content.
 */
export function xpForAttempt({ correct, attemptNumber, alreadySolved }: AttemptOutcome): number {
  if (!correct || alreadySolved) return 0;
  return XP_PER_CORRECT_EXERCISE + (attemptNumber <= 1 ? XP_FIRST_TRY_BONUS : 0);
}

/** Paid once, on the first completion of a lesson. */
export function lessonCompletionBonus(firstCompletion: boolean): number {
  return firstCompletion ? XP_LESSON_COMPLETE_BONUS : 0;
}

/**
 * Share of exercises answered correctly on the first try, 0-100, over one pass
 * through a lesson.
 */
export function firstTryRate(attempts: { correct: boolean; attemptNumber: number }[]): number {
  if (attempts.length === 0) return 0;

  const clean = attempts.filter((a) => a.correct && a.attemptNumber <= 1).length;
  return Math.round((clean / attempts.length) * 100);
}

/** XP needed to reach each level, from level 1 up. Quadratic so levels slow down. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
}

export function levelForXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
} {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  let level = 1;
  while (safeXp >= xpForLevel(level + 1)) level += 1;

  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return { level, xpIntoLevel: safeXp - floor, xpToNext: ceiling - safeXp };
}

/**
 * Named ranks on the existing quadratic curve (level 2 = 100, 3 = 300, 4 = 600,
 * 5 = 1000). Those thresholds are one clean first-try lesson, about a unit,
 * two units, and a full first-pass through the authored course.
 */
export const LEVEL_TITLES = [
  { level: 1, name: 'Money Rookie', minXp: xpForLevel(1) },
  { level: 2, name: 'Budget Builder', minXp: xpForLevel(2) },
  { level: 3, name: 'Savings Starter', minXp: xpForLevel(3) },
  { level: 4, name: 'Money Manager', minXp: xpForLevel(4) },
  { level: 5, name: 'Finance Pro', minXp: xpForLevel(5) },
] as const;

export function titleForLevel(level: number): string {
  if (level <= 1) return LEVEL_TITLES[0].name;
  const named = LEVEL_TITLES.find((item) => item.level === level);
  return named?.name ?? LEVEL_TITLES[LEVEL_TITLES.length - 1]!.name;
}

export function levelProgress(totalXp: number) {
  const progress = levelForXp(totalXp);
  return {
    ...progress,
    title: titleForLevel(progress.level),
    nextTitle: titleForLevel(progress.level + 1),
    totalXp: Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0,
    span: progress.xpIntoLevel + progress.xpToNext,
  };
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Last day the learner completed a lesson, as YYYY-MM-DD in their local time. */
  lastActiveDay: string | null;
}

/**
 * Advances a streak for activity on `today`. Same-day activity is a no-op,
 * consecutive days extend, any gap resets to 1.
 */
export function advanceStreak(state: StreakState, today: string): StreakState {
  if (state.lastActiveDay === today) return state;

  const consecutive =
    state.lastActiveDay !== null && dayDifference(state.lastActiveDay, today) === 1;
  const currentStreak = consecutive ? state.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDay: today,
  };
}

/**
 * How a streak stands as of `today`, for the UI to render:
 *   active  studied today, the streak is banked
 *   at_risk last studied yesterday, so today is still open but unfinished
 *   broken  missed a day, or never started
 */
export type StreakHealth = 'active' | 'at_risk' | 'broken';

export function streakHealth(state: StreakState, today: string): StreakHealth {
  if (state.lastActiveDay === null) return 'broken';

  const gap = dayDifference(state.lastActiveDay, today);
  if (gap <= 0) return 'active';
  if (gap === 1) return 'at_risk';
  return 'broken';
}

/**
 * The `count` day keys ending at `today`, oldest first. Used to lay out the
 * streak strip so the UI never has to do date arithmetic of its own.
 */
export function recentDayKeys(today: string, count: number): string[] {
  const end = Date.parse(`${today}T00:00:00Z`);

  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    return new Date(end - offset * MS_PER_DAY).toISOString().slice(0, 10);
  });
}

/** Single-letter weekday label for a day key, Sunday-indexed. */
export function weekdayLabel(dayKey: string): string {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const index = new Date(`${dayKey}T00:00:00Z`).getUTCDay();
  return labels[index] ?? '?';
}

/** Whether a streak is still alive as of `today`, without mutating it. */
export function isStreakActive(state: StreakState, today: string): boolean {
  if (state.lastActiveDay === null) return false;
  return dayDifference(state.lastActiveDay, today) <= 1;
}

/** Whole days between two YYYY-MM-DD strings, compared at UTC midnight. */
export function dayDifference(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/**
 * Whether `day` could be today somewhere on Earth at `now`.
 *
 * The client reports its own local day so streaks follow the learner's
 * calendar, which makes the value client-controlled. Every timezone is within
 * one calendar day of UTC, so anything further away is not a real local date
 * and would let a learner build a streak by labelling replays with consecutive
 * future days.
 */
export function isPlausibleLocalDay(day: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;

  // Reject dates like 2026-02-30 that parse by rolling into the next month.
  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) return false;

  const utcToday = now.toISOString().slice(0, 10);
  return Math.abs(dayDifference(utcToday, day)) <= 1;
}

/** Today as YYYY-MM-DD. Pass the client's date so streaks follow the learner's calendar. */
export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
