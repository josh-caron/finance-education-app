export type LeaderboardPeriod = 'all-time' | 'weekly';

/** Equal XP shares competition ranks: 1, 1, 3. */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  isYou: boolean;
}

export interface LeaderboardResult {
  period: LeaderboardPeriod;
  weekStart: string | null;
  weekEndExclusive: string | null;
  totalLearners: number;
  entries: LeaderboardEntry[];
  nearby: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}

/**
 * What GET /api/leaderboard returns. `hidden` is true when the caller has
 * chosen to stay off the leaderboard, which is why `currentUser` is null for
 * them even if they have XP.
 */
export interface LeaderboardResponse extends LeaderboardResult {
  hidden: boolean;
}
