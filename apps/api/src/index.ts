import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { withDb, withSession } from './middleware/session';
import { pruneRateLimits, rateLimit } from './rate-limit';
import { contentRoutes } from './routes/content';
import { leaderboardRoutes } from './routes/leaderboard';
import { progressRoutes } from './routes/progress';
import type { AppEnv, Bindings } from './types';

const app = new Hono<AppEnv>();

app.use('*', logger());

app.use('*', (c, next) =>
  cors({
    origin: c.env.TRUSTED_ORIGINS.split(',').map((origin) => origin.trim()),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // The Expo client reads its session token from this header.
    exposeHeaders: ['set-auth-token'],
    credentials: true,
  })(c, next),
);

// Storage first, then the limit, then auth. A flood is rejected before any
// session lookup or password hashing happens.
app.use('*', withDb);
app.use('*', rateLimit);
app.use('*', withSession);

app.get('/health', (c) => c.json({ status: 'ok' }));

/** Better Auth owns sign-up, sign-in, sign-out and session refresh under this prefix. */
app.on(['GET', 'POST'], '/api/auth/*', (c) => c.get('auth').handler(c.req.raw));

app.route('/api/content', contentRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/leaderboard', leaderboardRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((error, c) => {
  console.error('Unhandled error', error);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,

  /**
   * Clears rate-limit windows that have already elapsed. Active keys are reset
   * in place by the limiter itself, so this only removes keys seen once and
   * never again. Scheduled daily in wrangler.jsonc.
   */
  async scheduled(_event: ScheduledController, env: Bindings) {
    const { createDb } = await import('@fin/db');
    await pruneRateLimits(createDb(env.DB));
  },
} satisfies ExportedHandler<Bindings>;
