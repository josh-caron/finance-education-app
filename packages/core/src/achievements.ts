/**
 * Data-driven badges. Evaluation is pure so the API and tests share one rule
 * set. Persistence is the API's job: once a row exists, later snapshots cannot
 * take the badge away.
 */

export const UNIT_BUDGETING_SAVING = 'budgeting-saving';
export const UNIT_BANKING_EMERGENCY = 'banking-emergency';

export const HINT_FREE_EXERCISE_GOAL = 10;
export const STREAK_ON_A_ROLL = 3;
export const WEEKLY_TOP_RANK = 10;

export const achievementIds = [
  'first_steps',
  'on_a_roll',
  'budget_brain',
  'emergency_ready',
  'perfect_lesson',
  'independent_thinker',
  'top_10',
] as const;

export type AchievementId = (typeof achievementIds)[number];

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'habit' | 'mastery' | 'social';
  conditionType: AchievementId;
}

export const achievements: AchievementDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first lesson.',
    icon: '🐣',
    category: 'progress',
    conditionType: 'first_steps',
  },
  {
    id: 'on_a_roll',
    name: 'On a Roll',
    description: 'Maintain a 3-day learning streak.',
    icon: '🔥',
    category: 'habit',
    conditionType: 'on_a_roll',
  },
  {
    id: 'budget_brain',
    name: 'Budget Brain',
    description: 'Complete the Budgeting & Saving unit.',
    icon: '🧠',
    category: 'progress',
    conditionType: 'budget_brain',
  },
  {
    id: 'emergency_ready',
    name: 'Emergency Ready',
    description: 'Complete the Banking / Emergency Savings unit.',
    icon: '💰',
    category: 'progress',
    conditionType: 'emergency_ready',
  },
  {
    id: 'perfect_lesson',
    name: 'Perfect Lesson',
    description: 'Complete a lesson without any incorrect answers.',
    icon: '🎯',
    category: 'mastery',
    conditionType: 'perfect_lesson',
  },
  {
    id: 'independent_thinker',
    name: 'Independent Thinker',
    description: 'Complete 10 exercises without using hints.',
    icon: '💡',
    category: 'mastery',
    conditionType: 'independent_thinker',
  },
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Reach the top 10 of the weekly leaderboard.',
    icon: '🏆',
    category: 'social',
    conditionType: 'top_10',
  },
];

export interface AchievementSnapshot {
  earnedIds: readonly string[];
  /** Lessons with status completed, ever. */
  completedLessonCount: number;
  currentStreak: number;
  completedUnitIds: readonly string[];
  /** True only for the run being closed, with zero incorrect attempts. */
  perfectLessonJustCompleted: boolean;
  hintFreeExerciseCount: number;
  /** Weekly competition rank, or null when the learner is unranked this week. */
  weeklyRank: number | null;
}

export function achievementById(id: string): AchievementDefinition | undefined {
  return achievements.find((item) => item.id === id);
}

export function isAchievementMet(
  id: AchievementId,
  snapshot: Omit<AchievementSnapshot, 'earnedIds'>,
): boolean {
  switch (id) {
    case 'first_steps':
      return snapshot.completedLessonCount >= 1;
    case 'on_a_roll':
      return snapshot.currentStreak >= STREAK_ON_A_ROLL;
    case 'budget_brain':
      return snapshot.completedUnitIds.includes(UNIT_BUDGETING_SAVING);
    case 'emergency_ready':
      return snapshot.completedUnitIds.includes(UNIT_BANKING_EMERGENCY);
    case 'perfect_lesson':
      return snapshot.perfectLessonJustCompleted;
    case 'independent_thinker':
      return snapshot.hintFreeExerciseCount >= HINT_FREE_EXERCISE_GOAL;
    case 'top_10':
      return snapshot.weeklyRank !== null && snapshot.weeklyRank <= WEEKLY_TOP_RANK;
  }
}

/** Badges the snapshot newly qualifies for. Already-earned ids are skipped. */
export function newlyUnlockedAchievements(snapshot: AchievementSnapshot): AchievementDefinition[] {
  const earned = new Set(snapshot.earnedIds);
  return achievements.filter((item) => !earned.has(item.id) && isAchievementMet(item.id, snapshot));
}

/**
 * Unique exercises whose first successful solve had no hint on any attempt
 * before that first correct answer. Replays of an already-solved exercise do
 * not change the count.
 */
export function hintFreeSolvedCount(
  attempts: { exerciseId: string; isCorrect: boolean; hintUsed: boolean }[],
): number {
  const byExercise = new Map<string, { isCorrect: boolean; hintUsed: boolean }[]>();
  for (const attempt of attempts) {
    const bucket = byExercise.get(attempt.exerciseId) ?? [];
    bucket.push(attempt);
    byExercise.set(attempt.exerciseId, bucket);
  }

  let count = 0;
  for (const list of byExercise.values()) {
    const firstCorrectIndex = list.findIndex((attempt) => attempt.isCorrect);
    if (firstCorrectIndex === -1) continue;
    const untilCorrect = list.slice(0, firstCorrectIndex + 1);
    if (untilCorrect.every((attempt) => !attempt.hintUsed)) count += 1;
  }
  return count;
}

export function lessonRunIsPerfect(
  outcomes: { correct: boolean; attemptNumber: number }[],
): boolean {
  return (
    outcomes.length > 0 &&
    outcomes.every((outcome) => outcome.correct && outcome.attemptNumber <= 1)
  );
}
