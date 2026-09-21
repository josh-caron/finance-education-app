import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Horizontal XP meter for the current level, with the remaining XP called out. */
export function XpBar({
  level,
  title,
  nextTitle,
  xpIntoLevel,
  xpToNext,
}: {
  level: number;
  title?: string;
  nextTitle?: string;
  xpIntoLevel: number;
  xpToNext: number;
}) {
  const theme = useTheme();

  const span = xpIntoLevel + xpToNext;
  const percent = span === 0 ? 0 : Math.round((xpIntoLevel / span) * 100);
  const towardNext = nextTitle ?? `level ${level + 1}`;

  return (
    <View style={styles.container}>
      {title ? (
        <ThemedText type="smallBold">
          Level {level} — {title}
        </ThemedText>
      ) : null}
      <View style={styles.row}>
        <ThemedText type="smallBold">
          {xpIntoLevel} / {span} XP
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {span === 0 ? 'Max level' : `${xpToNext} XP until ${towardNext}`}
        </ThemedText>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: span, now: xpIntoLevel }}
        style={[styles.track, { backgroundColor: theme.backgroundElement }]}
      >
        <View style={[styles.fill, { backgroundColor: theme.brand, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
