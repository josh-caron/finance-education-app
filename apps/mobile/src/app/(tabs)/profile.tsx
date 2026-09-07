import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import type { LearnerProfile } from '@/lib/api-types';
import { signOut, useSession } from '@/lib/auth-client';

export default function ProfileScreen() {
  const theme = useTheme();
  const { data: session } = useSession();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<LearnerProfile>('/api/progress/me'),
  });

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  const profile = profileQuery.data;

  return (
    <Screen>
      <ThemedText type="subtitle">{session?.user.name ?? 'Profile'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {session?.user.email}
      </ThemedText>

      {profileQuery.isPending ? <ActivityIndicator /> : null}

      {profile ? (
        <>
          <View style={styles.stats}>
            <Stat label="Level" value={String(profile.level)} />
            <Stat label="Total XP" value={String(profile.totalXp)} />
            <Stat label="Streak" value={`${profile.currentStreak}d`} />
            <Stat label="Best streak" value={`${profile.longestStreak}d`} />
          </View>

          {/* TODO(backlog 5, Josh): replace with the XP progress bar and streak calendar. */}
          <ThemedText type="small" themeColor="textSecondary">
            {profile.xpToNext} XP to level {profile.level + 1}
          </ThemedText>

          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.brand,
                  width: `${progressPercent(profile)}%`,
                },
              ]}
            />
          </View>
        </>
      ) : null}

      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
    </Screen>
  );
}

function progressPercent(profile: LearnerProfile): number {
  const span = profile.xpIntoLevel + profile.xpToNext;
  return span === 0 ? 0 : Math.round((profile.xpIntoLevel / span) * 100);
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  stat: { flexGrow: 1, minWidth: 140, borderRadius: 14, padding: Spacing.three },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%' },
});
