import type { LeaderboardPeriod, LeaderboardResult } from '@fin/core';

/** Server chooses the week; scores use existing learner-local day labels. */
export function leaderboardWeek(now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const end = new Date(monday);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start: monday.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export interface RankedLearner {
  userId: string;
  name: string;
  xp: number;
  rank: number;
  position: number;
  total: number;
}

/** Rank before limiting; bind all values; return at most 15 rows in one snapshot. */
export function leaderboardQuery(period: LeaderboardPeriod) {
  const scores =
    period === 'weekly'
      ? `SELECT u.id AS userId, u.name, SUM(a.xp_earned) AS xp
       FROM daily_activity a JOIN user u ON u.id = a.user_id
       WHERE a.day >= ? AND a.day < ?
       GROUP BY u.id, u.name HAVING SUM(a.xp_earned) > 0`
      : `SELECT u.id AS userId, u.name, p.total_xp AS xp
       FROM learner_profiles p JOIN user u ON u.id = p.user_id
       WHERE p.total_xp > 0`;
  return `WITH scores AS (${scores}), ranked AS (
    SELECT *, RANK() OVER (ORDER BY xp DESC) AS rank,
      ROW_NUMBER() OVER (ORDER BY xp DESC, userId ASC) AS position,
      COUNT(*) OVER () AS total FROM scores
  ), caller AS (SELECT position FROM ranked WHERE userId = ?)
  SELECT * FROM ranked WHERE position <= 10
     OR position BETWEEN (SELECT position FROM caller) - 2 AND (SELECT position FROM caller) + 2
  ORDER BY position`;
}

export function leaderboardResult(
  rows: RankedLearner[],
  userId: string,
  period: LeaderboardPeriod,
  week: ReturnType<typeof leaderboardWeek>,
): LeaderboardResult {
  const entry = (row: RankedLearner) => ({
    rank: row.rank,
    name: row.name,
    xp: row.xp,
    isYou: row.userId === userId,
  });
  const caller = rows.find((row) => row.userId === userId);
  return {
    period,
    weekStart: period === 'weekly' ? week.start : null,
    weekEndExclusive: period === 'weekly' ? week.end : null,
    totalLearners: rows[0]?.total ?? 0,
    entries: rows.filter((row) => row.position <= 10).map(entry),
    nearby: rows.filter((row) => row.position > 10).map(entry),
    currentUser: caller ? entry(caller) : null,
  };
}
