import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Celebration } from '@/lib/api-types';

export function CelebrationCard({
  celebration,
  xpEarned,
  onContinue,
}: {
  celebration: Celebration;
  xpEarned: number;
  onContinue: () => void;
}) {
  const theme = useTheme();
  const headline = celebration.unitJustCompleted
    ? `${celebration.unitTitle ?? 'Unit'} complete`
    : celebration.leveledUp
      ? 'Level up'
      : celebration.newAchievements.length > 0
        ? 'Achievement unlocked'
        : 'Lesson complete';

  useEffect(() => {
    void AccessibilityInfo.announceForAccessibility(headline);
  }, [headline]);

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: theme.successSurface, borderColor: theme.border }]}
    >
      <ThemedText type="subtitle">{headline}</ThemedText>
      {xpEarned > 0 ? (
        <ThemedText type="smallBold" themeColor="brand">
          +{xpEarned} XP
        </ThemedText>
      ) : null}
      {celebration.leveledUp ? (
        <ThemedText>
          Level {celebration.newLevel} — {celebration.newTitle}
        </ThemedText>
      ) : null}
      {celebration.newAchievements.map((item) => (
        <ThemedText key={item.id} accessibilityLabel={`Achievement unlocked: ${item.name}`}>
          {item.icon} {item.name}
        </ThemedText>
      ))}
      {celebration.unlockedUnit ? (
        <ThemedText>Unlocked: {celebration.unlockedUnit.title}</ThemedText>
      ) : null}
      <Button label="Continue" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: Spacing.four, gap: Spacing.three },
});
