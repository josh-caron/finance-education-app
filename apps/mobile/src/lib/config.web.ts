/**
 * Web build configuration.
 *
 * The deployed web client is served by the same Worker as the API, so with no
 * explicit override the API base is empty and every request goes out as a
 * relative URL against the page's own origin. That means no CORS, and the
 * session cookie is first-party.
 *
 * In development the Expo dev server is on :8081 while the API is on :8787, so
 * `pnpm setup:local` writes EXPO_PUBLIC_API_URL to bridge the two. `expo export`
 * does not read .env.local, so a production build gets the empty default.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Matches `scheme` in app.json. Unused on web, kept so both files export the same names. */
export const APP_SCHEME = 'fineduapp';
