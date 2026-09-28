import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UnitCelebration as Celebration } from '@/lib/unit-celebration';

export function UnitCelebration({ celebration }: { celebration: Celebration }) {
  const theme = useTheme();
  const { unit, unlocked, courseComplete } = celebration;
  return (
    <View
      style={[styles.card, { backgroundColor: theme.successSurface }]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.medal, { borderColor: theme.success }]} accessible={false}>
        <ThemedText style={styles.star} themeColor="success" accessible={false}>
          ★
        </ThemedText>
      </View>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.center}>
        {courseComplete ? 'Course complete!' : 'Unit complete!'}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.center}>
        {unit.title}
      </ThemedText>
      <ThemedText style={styles.center}>
        {unit.lessons.length} of {unit.lessons.length} lessons completed. Take a moment to celebrate
        your progress.
      </ThemedText>
      {courseComplete ? (
        <ThemedText style={styles.center}>
          You finished every unit! Revisit any lesson to keep your skills sharp.
        </ThemedText>
      ) : unlocked.length > 0 ? (
        <View style={styles.unlocked}>
          <ThemedText type="smallBold" themeColor="success">
            Unlocked next
          </ThemedText>
          {unlocked.map((next) => (
            <ThemedText key={next.id}>{next.title}</ThemedText>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.center}>
          Another milestone in your financial learning journey.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: 24, alignItems: 'center', gap: Spacing.three },
  medal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { fontSize: 44, lineHeight: 56 },
  center: { textAlign: 'center' },
  unlocked: { alignSelf: 'stretch', gap: Spacing.two },
});
