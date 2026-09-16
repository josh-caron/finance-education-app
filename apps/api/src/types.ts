import type { Database } from '@fin/db';

import type { createAuth } from './auth';

export interface Bindings {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  /** Comma-separated origins allowed to send credentialed requests. */
  TRUSTED_ORIGINS: string;
  /** Resend API key. Auth emails are only sent when this and EMAIL_FROM are both set. */
  RESEND_API_KEY?: string;
  /** Sender, e.g. "Finance Education App <noreply@example.com>", on a domain verified in Resend. */
  EMAIL_FROM?: string;
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
