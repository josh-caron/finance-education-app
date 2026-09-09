/**
 * Native build configuration. The web build resolves config.web.ts instead,
 * where the API base defaults to the page's own origin; keep the exports of the
 * two files in sync.
 *
 * EXPO_PUBLIC_ variables are inlined at build time, so they are readable in the
 * shipped bundle. Only non-secret configuration belongs here.
 *
 * A native binary has no origin to fall back on, so a release build must be
 * built with EXPO_PUBLIC_API_URL pointing at the deployed API.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

/** Matches `scheme` in app.json; Better Auth uses it for the native redirect. */
export const APP_SCHEME = 'fineduapp';
