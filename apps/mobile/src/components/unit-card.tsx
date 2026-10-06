import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UnitSummary } from '@/lib/api-types';

/** One node of the skill tree: a unit and its lessons. */
export function UnitCard({
  unit,
  units,
  expanded,
  onToggle,
}: {
  unit: UnitSummary;
  units: UnitSummary[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const requiredUnits = unit.prerequisites.map(
    (id) => `Unit ${units.findIndex((item) => item.id === id) + 1}`,
  );
  const completed = unit.lessons.filter((lesson) => lesson.status === 'completed').length;
  // `order` is a sort key and starts at 0, so number units by their position in
  // the tree instead. The API already returns them in tree order.
  const position = units.findIndex((item) => item.id === unit.id) + 1;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Unit ${position}: ${unit.title}`}
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Hide lessons' : 'Show lessons'}
        onPress={onToggle}
        style={styles.summary}
      >
        <View style={styles.summaryHeading}>
          <ThemedText type="smallBold" themeColor={unit.unlocked ? 'brand' : 'locked'}>
            {`Unit ${position}`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {expanded ? 'Hide lessons −' : 'Show lessons +'}
          </ThemedText>
        </View>
        <ThemedText type="default" style={styles.title}>
          {unit.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {`${completed} of ${unit.lessons.length} lessons complete`}
        </ThemedText>
        {!unit.unlocked ? (
          <ThemedText type="small" themeColor="locked">
            {`Complete ${requiredUnits.join(', ')} to unlock`}
          </ThemedText>
        ) : null}
      </Pressable>
      {expanded ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {unit.description}
          </ThemedText>
          <View style={styles.lessons}>
            {unit.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} locked={!unit.unlocked} />
            ))}
          </View>
        </>
      ) : null}
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
  summary: { gap: Spacing.two },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
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
