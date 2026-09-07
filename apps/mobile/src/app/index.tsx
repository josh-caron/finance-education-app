import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSession } from '@/lib/auth-client';

/** Entry point: send signed-in learners to the skill tree, everyone else to sign-in. */
export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={session ? '/(tabs)/learn' : '/(auth)/sign-in'} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
