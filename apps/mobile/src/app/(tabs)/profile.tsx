import { toDayKey } from '@fin/core';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
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
import type { CatalogAchievement, LearnerProfile } from '@/lib/api-types';
import { signOut, useSession } from '@/lib/auth-client';

export default function ProfileScreen() {
  const { data: session } = useSession();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Streaks follow the learner's calendar, so the local day goes to the API.
  const localDay = toDayKey(new Date());

  const profileQuery = useQuery({
    queryKey: ['profile', localDay],
    queryFn: () => apiFetch<LearnerProfile>(`/api/progress/me?localDay=${localDay}`),
  });

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError(result.error.message ?? 'Could not sign out. Please try again.');
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch {
      setSignOutError('Could not connect to the server. Please try signing out again.');
    } finally {
      setSigningOut(false);
    }
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
                title={profile.title}
                nextTitle={profile.nextTitle}
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

          <AchievementsList achievements={profile.achievements ?? []} />

          <StreakStrip
            days={profile.recentDays}
            today={profile.today}
            currentStreak={profile.currentStreak}
            health={profile.streakHealth}
          />
        </>
      ) : null}

      {signOutError ? (
        <ThemedText type="small" themeColor="danger">
          {signOutError}
        </ThemedText>
      ) : null}
      <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
    </Screen>
  );
}

function levelFraction(xpIntoLevel: number, xpToNext: number): number {
  const span = xpIntoLevel + xpToNext;
  return span === 0 ? 0 : xpIntoLevel / span;
}

function AchievementsList({ achievements }: { achievements: CatalogAchievement[] }) {
  const theme = useTheme();
  const unlocked = achievements.filter((item) => item.earnedAt).length;

  return (
    <View style={styles.achievements} accessibilityRole="summary">
      <ThemedText type="smallBold">
        Achievements {unlocked} / {achievements.length || 7} unlocked
      </ThemedText>
      {achievements.map((item) => {
        const earned = Boolean(item.earnedAt);
        return (
          <View
            key={item.id}
            accessibilityLabel={`${item.name}. ${earned ? 'Unlocked' : 'Locked'}. ${item.description}`}
            style={[styles.badge, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText style={{ opacity: earned ? 1 : 0.45 }}>{item.icon}</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.description}
              </ThemedText>
              <ThemedText type="small" themeColor={earned ? 'success' : 'locked'}>
                {earned ? `Unlocked ${new Date(item.earnedAt!).toLocaleDateString()}` : 'Locked'}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
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
  achievements: { gap: Spacing.two },
  badge: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'flex-start',
  },
});
