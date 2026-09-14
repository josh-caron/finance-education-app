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
