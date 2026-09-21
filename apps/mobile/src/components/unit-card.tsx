import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UnitSummary } from '@/lib/api-types';

/** One node of the skill tree: a unit and its lessons. */
export function UnitCard({ unit, units }: { unit: UnitSummary; units: UnitSummary[] }) {
  const theme = useTheme();
  const requiredTitles = unit.prerequisites.map(
    (id) => units.find((item) => item.id === id)?.title ?? id,
  );

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <ThemedText type="smallBold" themeColor={unit.unlocked ? 'brand' : 'locked'}>
        {unit.unlocked ? `Unit ${unit.order}` : `Locked · finish ${requiredTitles.join(', ')}`}
      </ThemedText>

      <ThemedText type="default" style={styles.title}>
        {unit.title}
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary">
        {unit.description}
      </ThemedText>

      <View style={styles.lessons}>
        {unit.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} locked={!unit.unlocked} />
        ))}
      </View>
    </View>
  );
}

function LessonRow({
  lesson,
  locked,
}: {
  lesson: UnitSummary['lessons'][number];
  locked: boolean;
}) {
  const theme = useTheme();
  const done = lesson.status === 'completed';

  const row = (
    <View
      style={[
        styles.lesson,
        {
          backgroundColor: done ? theme.successSurface : theme.background,
          borderColor: theme.border,
          opacity: locked ? 0.5 : 1,
        },
      ]}
    >
      <ThemedText type="default">{lesson.title}</ThemedText>
      <ThemedText type="small" themeColor={done ? 'success' : 'textSecondary'}>
        {done ? `${lesson.bestScore}%` : lesson.status === 'in_progress' ? 'In progress' : 'Start'}
      </ThemedText>
    </View>
  );

  if (locked) {
    return <View accessibilityState={{ disabled: true }}>{row}</View>;
  }

  return (
    <Link href={{ pathname: '/lesson/[lessonId]', params: { lessonId: lesson.id } }} asChild>
      <Pressable accessibilityRole="button">{row}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: { fontWeight: '700' },
  lessons: { gap: Spacing.two, marginTop: Spacing.two },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
