import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LearnerProfile } from '@/lib/api-types';

/** Streak, XP and level, shown across the top of the skill path. */
export function StatBar({ profile }: { profile: LearnerProfile }) {
  const theme = useTheme();
  const streakAlive = profile.currentStreak > 0;

  return (
    <View style={styles.row}>
      <Stat
        icon="fire"
        color={streakAlive ? theme.streak : theme.locked}
        value={String(profile.currentStreak)}
        label={`${profile.currentStreak} day streak`}
      />
      <Stat
        icon="diamond-stone"
        color={theme.xp}
        value={String(profile.totalXp)}
        label={`${profile.totalXp} XP`}
      />
      <Stat
        icon="shield-star"
        color={theme.accent}
        value={`Lv ${profile.level}`}
        label={`Level ${profile.level}`}
      />
    </View>
  );
}

function Stat({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={label}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.two },
  stat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  value: { fontFamily: Fonts.rounded, fontSize: 17, fontWeight: '800' },
});
