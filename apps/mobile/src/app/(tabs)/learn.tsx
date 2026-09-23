import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { UnitCard } from '@/components/unit-card';
import { Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { describeError } from '@/lib/errors';
import type { LearnerProfile, UnitSummary } from '@/lib/api-types';

/**
 * The skill tree. Units render in order with their lessons; a locked unit shows
 * what it is waiting on rather than hiding itself.
 */
export default function LearnScreen() {
  const unitsQuery = useQuery({
    queryKey: ['units'],
    queryFn: () => apiFetch<{ units: UnitSummary[] }>('/api/content/units'),
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<LearnerProfile>('/api/progress/me'),
  });

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">Learn</ThemedText>
        {profileQuery.data ? (
          <ThemedText type="smallBold" themeColor="accent">
            {profileQuery.data.currentStreak} day streak · {profileQuery.data.totalXp} XP
          </ThemedText>
        ) : null}
      </View>

      {unitsQuery.isPending ? <ActivityIndicator /> : null}

      {unitsQuery.isError ? (
        <ThemedText type="small" themeColor="danger">
          {describeError(unitsQuery.error, 'Could not load the course. Try again.')}
        </ThemedText>
      ) : null}

      {unitsQuery.data?.units.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No content yet. Seed the database with `pnpm db:seed:local`.
        </ThemedText>
      ) : null}

      {unitsQuery.data?.units.map((unit) => (
        <UnitCard key={unit.id} unit={unit} units={unitsQuery.data.units} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
