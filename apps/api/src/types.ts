import type { Database } from '@fin/db';

import type { createAuth } from './auth';

export interface Bindings {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  /** Comma-separated origins allowed to send credentialed requests. */
  TRUSTED_ORIGINS: string;
}

type Auth = ReturnType<typeof createAuth>;

/** Set by middleware, read by routes. */
export interface Variables {
  db: Database;
  auth: Auth;
  user: AuthUser | null;
  session: AuthSession | null;
}

export type AuthUser = Auth['$Infer']['Session']['user'];
export type AuthSession = Auth['$Infer']['Session']['session'];

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}
