import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from '@fin/core';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

export default function LeaderboardScreen() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const query = useQuery({
    queryKey: ['leaderboard', session?.user.id, period],
    queryFn: () => apiFetch<LeaderboardResponse>(`/api/leaderboard?period=${period}`),
    enabled: Boolean(session?.user.id),
    refetchInterval: 60_000,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (session?.user.id) void refetch();
    }, [refetch, session?.user.id]),
  );

  return (
    <Screen>
      <ThemedText type="subtitle">Leaderboard</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Learn at your own pace. Every XP earned is progress.
      </ThemedText>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['all-time', 'weekly'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: period === value }}
            onPress={() => setPeriod(value)}
            style={[
              styles.tab,
              { backgroundColor: period === value ? theme.brand : theme.backgroundElement },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{ color: period === value ? theme.brandText : theme.text }}
            >
              {value === 'weekly' ? 'This week' : 'All time'}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {!session?.user.id ? (
        <ThemedText>Sign in to see the leaderboard.</ThemedText>
      ) : query.isPending ? (
        <ActivityIndicator accessibilityLabel="Loading leaderboard" />
      ) : query.isError ? (
        <View style={styles.group}>
          <ThemedText themeColor="danger">Could not load rankings. Please try again.</ThemedText>
          <Button label="Try again" onPress={() => void refetch()} loading={query.isFetching} />
        </View>
      ) : query.data ? (
        <>
          {period === 'weekly' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Week starting {query.data.weekStart}. Resets Monday at 00:00 UTC; XP is grouped by
              each learner's local activity date.
            </ThemedText>
          ) : null}
          <View style={[styles.summary, { backgroundColor: theme.successSurface }]}>
            <ThemedText type="smallBold">
              {query.data.hidden
                ? "You're hidden from the leaderboard. You can change this on your profile."
                : query.data.currentUser
                  ? `Your rank: ${query.data.currentUser.rank} · ${query.data.currentUser.xp.toLocaleString()} XP`
                  : 'Earn XP from exercises to join this leaderboard.'}
            </ThemedText>
            <ThemedText type="small">
              {query.data.totalLearners} learners with XP{period === 'weekly' ? ' this week' : ''}
            </ThemedText>
          </View>
          {query.data.entries.length === 0 ? (
            <ThemedText>
              No rankings yet{period === 'weekly' ? ' this week' : ''}. Be the first to earn XP!
            </ThemedText>
          ) : (
            <View style={styles.group}>
              <ThemedText type="smallBold">Top learners</ThemedText>
              {query.data.entries.map((entry, index) => (
                <RankingRow key={`${entry.rank}-${entry.name}-${index}`} entry={entry} />
              ))}
            </View>
          )}
          {query.data.nearby.length > 0 ? (
            <View style={styles.group}>
              <ThemedText type="smallBold">Around you</ThemedText>
              {query.data.nearby.map((entry, index) => (
                <RankingRow key={`near-${entry.rank}-${entry.name}-${index}`} entry={entry} />
              ))}
            </View>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            Equal XP shares a rank (1, 1, 3). Display names and XP are visible to signed-in
            learners.
          </ThemedText>
          <Button
            label="Refresh rankings"
            variant="secondary"
            onPress={() => void refetch()}
            loading={query.isFetching}
          />
        </>
      ) : null}
    </Screen>
  );
}

function RankingRow({ entry }: { entry: LeaderboardEntry }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Rank ${entry.rank}, ${entry.name}${entry.isYou ? ', you' : ''}, ${entry.xp} XP`}
      style={[
        styles.row,
        { backgroundColor: entry.isYou ? theme.successSurface : theme.backgroundElement },
      ]}
    >
      <ThemedText type="smallBold" style={styles.rank}>
        #{entry.rank}
      </ThemedText>
      <ThemedText style={styles.name}>
        {entry.name}
        {entry.isYou ? ' (you)' : ''}
      </ThemedText>
      <ThemedText type="smallBold">{entry.xp.toLocaleString()} XP</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.two },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  summary: { padding: Spacing.three, borderRadius: 12, gap: Spacing.two },
  group: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  rank: { minWidth: 40 },
  name: { flex: 1, flexShrink: 1 },
});
