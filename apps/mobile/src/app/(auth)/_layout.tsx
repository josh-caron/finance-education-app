import { Redirect, Stack, usePathname } from 'expo-router';

import { useSession } from '@/lib/auth-client';

/**
 * Screens a signed-in learner still needs to reach. A reset link arrives by
 * email and may well be opened in a browser where they are already signed in;
 * bouncing them to the skill tree would leave them unable to change a password
 * they have probably forgotten.
 */
const ALLOWED_WHILE_SIGNED_IN = ['/reset-password', '/forgot-password'];

export default function AuthLayout() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  const signedInIsFine = ALLOWED_WHILE_SIGNED_IN.some((path) => pathname.startsWith(path));

  // Someone already signed in has no business on the sign-in screen.
  if (!isPending && session && !signedInIsFine) {
    return <Redirect href="/(tabs)/learn" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
