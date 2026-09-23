import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { API_URL, APP_SCHEME } from './config';

/**
 * Native auth client. React Native has no cookie jar, so the expo plugin keeps
 * the session token in SecureStore and replays it on each request.
 *
 * SecureStore does not exist on web, so the browser build resolves
 * auth-client.web.ts instead, so keep the exports of the two files in sync.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { timeout: 10_000 },
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: 'finedu',
      storage: SecureStore,
    }),
  ],
});

/** Auth headers for a plain `fetch` to the API. */
export async function sessionHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  deleteUser,
} = authClient;
