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
export function createAuth(env: Bindings, db: Database) {
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
