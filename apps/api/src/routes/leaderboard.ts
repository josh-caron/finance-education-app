import { Hono } from 'hono';

import type { AppEnv } from '../types';

export const leaderboardRoutes = new Hono<AppEnv>();

/**
 * TODO(backlog 8, Gustavo): leaderboard.
 *
 * The data is already in place, so this is a query rather than a schema change:
 *   - all-time: learnerProfiles.totalXp, joined to `user` for the display name
 *   - weekly:   sum(dailyActivity.xpEarned) where day >= the start of the week
 *
 * Decisions still open: global vs. friends-only, and whether to show learners
 * who have opted out. Return ranks around the caller, not just the top N, so
 * the screen is useful to someone outside the top 10.
 */
leaderboardRoutes.get('/', (c) =>
  c.json({ error: 'Leaderboard is not implemented yet', entries: [] }, 501),
);
