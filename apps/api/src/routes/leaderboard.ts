import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { learnerProfiles } from '@fin/db';
import { truncateDisplayName, type LeaderboardEntry, type LeaderboardResponse } from '@fin/core';

import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/session';
import {
  leaderboardQuery,
  leaderboardResult,
  leaderboardWeek,
  type RankedLearner,
} from '../leaderboard-query';

export const leaderboardRoutes = new Hono<AppEnv>();

leaderboardRoutes.use('*', requireAuth);

leaderboardRoutes.get('/', async (c) => {
  c.header('Cache-Control', 'private, no-store');
  const period = c.req.query('period') ?? 'all-time';
  if (period !== 'weekly' && period !== 'all-time') {
    return c.json({ error: 'period must be weekly or all-time' }, 400);
  }
  const userId = c.get('user')!.id;
  const week = leaderboardWeek();
  const args = period === 'weekly' ? [week.start, week.end, userId] : [userId];
  const [{ results }, [profile]] = await Promise.all([
    c.env.DB.prepare(leaderboardQuery(period))
      .bind(...args)
      .all<RankedLearner>(),
    c
      .get('db')
      .select({ hidden: learnerProfiles.hideFromLeaderboard })
      .from(learnerProfiles)
      .where(eq(learnerProfiles.userId, userId))
      .limit(1),
  ]);

  const result = leaderboardResult(results, userId, period, week);
  // Names are capped at sign-up now, but rows from before the cap are not.
  const shorten = (entry: LeaderboardEntry) => ({
    ...entry,
    name: truncateDisplayName(entry.name),
  });

  const response: LeaderboardResponse = {
    ...result,
    entries: result.entries.map(shorten),
    nearby: result.nearby.map(shorten),
    currentUser: result.currentUser && shorten(result.currentUser),
    hidden: profile?.hidden ?? false,
  };
  return c.json(response);
});
