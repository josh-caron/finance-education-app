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

export interface ExerciseScore {
  correct: boolean;
  attempts: number;
}

export function xpForExercise({ correct, attempts }: ExerciseScore): number {
  if (!correct) return 0;
  return XP_PER_CORRECT_EXERCISE + (attempts <= 1 ? XP_FIRST_TRY_BONUS : 0);
}

export function xpForLesson(scores: ExerciseScore[], firstCompletion: boolean): number {
  const exerciseXp = scores.reduce((total, score) => total + xpForExercise(score), 0);
  const allCorrect = scores.length > 0 && scores.every((s) => s.correct);
  return exerciseXp + (firstCompletion && allCorrect ? XP_LESSON_COMPLETE_BONUS : 0);
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
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level += 1;

  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return { level, xpIntoLevel: totalXp - floor, xpToNext: ceiling - totalXp };
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

/** Today as YYYY-MM-DD. Pass the client's date so streaks follow the learner's calendar. */
export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
