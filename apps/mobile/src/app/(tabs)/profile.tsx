import { toDayKey } from '@fin/core';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { LevelRing } from '@/components/level-ring';
import { Screen } from '@/components/screen';
import { StreakStrip } from '@/components/streak-strip';
import { ThemedText } from '@/components/themed-text';
import { XpBar } from '@/components/xp-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import type { LearnerProfile } from '@/lib/api-types';
import { signOut, useSession } from '@/lib/auth-client';

export default function ProfileScreen() {
  const { data: session } = useSession();

  // Streaks follow the learner's calendar, so the local day goes to the API.
  const localDay = toDayKey(new Date());

  const profileQuery = useQuery({
    queryKey: ['profile', localDay],
    queryFn: () => apiFetch<LearnerProfile>(`/api/progress/me?localDay=${localDay}`),
  });

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  const profile = profileQuery.data;
  const completed = profile?.lessons.filter((lesson) => lesson.status === 'completed').length ?? 0;

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">{session?.user.name ?? 'Profile'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {session?.user.email}
        </ThemedText>
      </View>

      {profileQuery.isPending ? <ActivityIndicator /> : null}

      {profileQuery.isError ? (
        <ThemedText type="small" themeColor="danger">
          Could not load your progress.
        </ThemedText>
      ) : null}

      {profile ? (
        <>
          <View style={styles.hero}>
            <LevelRing
              level={profile.level}
              fraction={levelFraction(profile.xpIntoLevel, profile.xpToNext)}
            />

            <View style={styles.heroMeta}>
              <XpBar
                level={profile.level}
                xpIntoLevel={profile.xpIntoLevel}
                xpToNext={profile.xpToNext}
              />

              <View style={styles.stats}>
                <Stat label="Total XP" value={String(profile.totalXp)} />
                <Stat label="Best streak" value={`${profile.longestStreak}d`} />
                <Stat label="Lessons" value={String(completed)} />
              </View>
            </View>
          </View>

          <StreakStrip
            days={profile.recentDays}
            today={profile.today}
            currentStreak={profile.currentStreak}
            health={profile.streakHealth}
          />
        </>
      ) : null}

      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
    </Screen>
  );
}

function levelFraction(xpIntoLevel: number, xpToNext: number): number {
  const span = xpIntoLevel + xpToNext;
  return span === 0 ? 0 : xpIntoLevel / span;
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, flexWrap: 'wrap' },
  heroMeta: { flexGrow: 1, flexShrink: 1, minWidth: 220, gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  statValue: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
});
