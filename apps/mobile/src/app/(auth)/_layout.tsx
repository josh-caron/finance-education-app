import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/auth-client';

export default function AuthLayout() {
  const { data: session, isPending } = useSession();

  // Someone already signed in has no business on the sign-in screen.
  if (!isPending && session) {
    return <Redirect href="/(tabs)/learn" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
