import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { account, session, user, verification, type Database } from '@fin/db';

import type { Bindings } from './types';

/**
 * Workers hand bindings to the request, not the module, so auth is constructed
 * per request rather than at import time.
 *
 * The expo plugin is what lets the native app hold a session: it returns the
 * session token in a response header for expo-secure-store instead of relying
 * on cookies, which React Native does not manage.
 */
/**
 * Minimum length for the signing secret. `openssl rand -base64 32` produces 44
 * characters, comfortably over.
 */
const MIN_SECRET_LENGTH = 32;

export function createAuth(env: Bindings, db: Database) {
  // Better Auth falls back to a hardcoded public default when no secret is
  // given, which would leave every session token forgeable by anyone who has
  // read its source. Fail loudly instead of serving something insecure.
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Locally, run `pnpm setup:local`. On a deployed Worker, run ' +
        '`wrangler secret put BETTER_AUTH_SECRET` with the output of ' +
        '`openssl rand -base64 32`.',
    );
  }

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    // TODO(auth, backlog 1): email verification and password reset need an
    // email provider. Left off so sign-up works without one during development.
    plugins: [expo()],
    trustedOrigins: env.TRUSTED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  });
}
