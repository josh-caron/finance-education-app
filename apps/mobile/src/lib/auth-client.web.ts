import { createAuthClient } from 'better-auth/react';

import { API_URL } from './config';

/**
 * Web auth client. The browser stores and sends the session cookie itself, so
 * the expo plugin (and its SecureStore dependency, which does not exist on web)
 * is left out. Keep the exports here in sync with auth-client.ts.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { timeout: 10_000 },
});

/** The browser attaches the session cookie itself; nothing to add by hand. */
export async function sessionHeaders(): Promise<Record<string, string>> {
  return {};
}

export const { signIn, signUp, signOut, useSession } = authClient;
