import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { StatBar } from '@/components/stat-bar';
import { ThemedText } from '@/components/themed-text';
import { UnitPath } from '@/components/unit-path';
import { Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { describeError } from '@/lib/errors';
import type { LearnerProfile, UnitSummary } from '@/lib/api-types';
import { currentLessonId } from '@/lib/skill-path';

/**
 * The skill tree, drawn as a winding path. Every unit is shown, locked ones
 * greyed out with what they are waiting on, and the next lesson is marked.
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

  const units = unitsQuery.data?.units ?? [];
  const current = currentLessonId(units);

  return (
    <Screen>
      {profileQuery.data ? <StatBar profile={profileQuery.data} /> : null}

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

      <View style={styles.units}>
        {units.map((unit) => (
          <UnitPath key={unit.id} unit={unit} units={units} current={current} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  units: { gap: Spacing.five, paddingBottom: Spacing.five },
});
