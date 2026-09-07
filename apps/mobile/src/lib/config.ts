/**
 * EXPO_PUBLIC_ variables are inlined at build time, so they are readable in the
 * shipped bundle. Only non-secret configuration belongs here.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

/** Matches `scheme` in app.json; Better Auth uses it for the native redirect. */
export const APP_SCHEME = 'fineduapp';
