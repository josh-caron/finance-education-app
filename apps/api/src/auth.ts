import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { account, session, user, verification, type Database } from '@fin/db';
import { checkDisplayName } from '@fin/core';

import { createMailer, passwordResetEmail, verificationEmail } from './email';
import type { Bindings } from './types';

/**
 * Minimum length for the signing secret. `openssl rand -base64 32` produces 44
 * characters, comfortably over.
 */
const MIN_SECRET_LENGTH = 32;

const ONE_HOUR = 60 * 60;

/**
 * Workers hand bindings to the request, not the module, so auth is constructed
 * per request rather than at import time.
 *
 * The expo plugin is what lets the native app hold a session: it returns the
 * session token in a response header for expo-secure-store instead of relying
 * on cookies, which React Native does not manage.
 *
 * `ctx` lets auth emails send after the response. Without it Better Auth awaits
 * them, which still works but makes sign-up wait on the email provider.
 */
/** All auth needs from the request's execution context. */
export interface BackgroundTasks {
  waitUntil(task: Promise<unknown>): void;
}

export function createAuth(env: Bindings, db: Database, ctx?: BackgroundTasks) {
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

  const sendEmail = createMailer(env);

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
      // Learners can start straight away and verify whenever they like.
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: ONE_HOUR,
      // A reset is often a response to a compromised password, so any session
      // opened with the old one should not survive it.
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ user: learner, url }) {
        // Only to addresses the learner has proven they own. Otherwise anyone
        // could sign up with someone else's address and have reset links sent
        // to it. Returning quietly keeps the response identical either way, so
        // the endpoint cannot be used to learn which addresses are verified.
        if (!learner.emailVerified) return;
        await sendEmail(passwordResetEmail(learner.email, learner.name, url));
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * ONE_HOUR,
      async sendVerificationEmail({ user: learner, url }) {
        await sendEmail(verificationEmail(learner.email, learner.name, url));
      },
    },

    user: {
      // Cascades to every learner row: profile, attempts, lesson progress and
      // daily activity. Better Auth would also accept a session under a day old
      // in place of the password; the hook below closes that.
      deleteUser: { enabled: true },
    },

    hooks: {
      before: createAuthMiddleware(async (context) => {
        // Names show on the leaderboard, so both ways of setting one are checked.
        if (
          (context.path === '/sign-up/email' || context.path === '/update-user') &&
          context.body?.name !== undefined
        ) {
          const check = checkDisplayName(context.body.name);
          if (!check.ok) throw new APIError('BAD_REQUEST', { message: check.message });
        }

        if (context.path === '/delete-user' && !context.body?.password) {
          // A stolen session cookie alone should not be enough to erase an
          // account and its history.
          throw new APIError('BAD_REQUEST', {
            message: 'Enter your password to delete your account',
          });
        }
      }),
    },

    advanced: ctx ? { backgroundTasks: { handler: (task) => ctx.waitUntil(task) } } : undefined,

    plugins: [expo()],
    trustedOrigins: env.TRUSTED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  });
}
