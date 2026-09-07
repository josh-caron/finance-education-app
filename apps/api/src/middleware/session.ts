import { createMiddleware } from 'hono/factory';
import { createDb } from '@fin/db';

import { createAuth } from '../auth';
import type { AppEnv } from '../types';

/**
 * Builds the per-request database and auth clients and resolves the session.
 * Runs on every route; `user` is null when the caller is anonymous.
 */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  const db = createDb(c.env.DB);
  const auth = createAuth(c.env, db);

  c.set('db', db);
  c.set('auth', auth);

  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user', result?.user ?? null);
  c.set('session', result?.session ?? null);

  await next();
});

/** Rejects anonymous callers. Use on any route that reads or writes learner data. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  await next();
});
