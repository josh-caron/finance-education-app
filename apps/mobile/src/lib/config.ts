import Constants from 'expo-constants';

import { reachableApiUrl } from './device-url';

/**
 * Native build configuration. The web build resolves config.web.ts instead,
 * where the API base defaults to the page's own origin; keep the exports of the
 * two files in sync.
 *
 * EXPO_PUBLIC_ variables are inlined at build time, so they are readable in the
 * shipped bundle. Only non-secret configuration belongs here.
 *
 * A native binary has no origin to fall back on, so a release build must be
 * built with EXPO_PUBLIC_API_URL pointing at the deployed API. In development a
 * localhost URL is rewritten to the laptop's address so Expo Go on a phone can
 * reach `pnpm dev:api:lan`.
 */
export const API_URL = reachableApiUrl(
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787',
  __DEV__ ? Constants.expoConfig?.hostUri : undefined,
);

/** Matches `scheme` in app.json; Better Auth uses it for the native redirect. */
export const APP_SCHEME = 'fineduapp';
