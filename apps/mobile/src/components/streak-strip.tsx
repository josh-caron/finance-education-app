import { weekdayLabel, type StreakHealth } from '@fin/core';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DailyActivity } from '@/lib/api-types';

const headline: Record<StreakHealth, (streak: number) => string> = {
  active: (streak) => `${streak} day streak`,
  at_risk: (streak) => `${streak} day streak at risk`,
  broken: () => 'No streak yet',
};

const caption: Record<StreakHealth, string> = {
  active: 'Banked for today. Come back tomorrow to keep it.',
  at_risk: 'Finish a lesson today to keep it alive.',
  broken: 'Finish a lesson to start one.',
};

/**
 * Seven-day activity strip. The API sends the window already laid out oldest
 * to newest, so this does no date arithmetic of its own.
 */
export function StreakStrip({
  days,
  today,
  currentStreak,
  health,
}: {
  days: DailyActivity[];
  today: string;
  currentStreak: number;
  health: StreakHealth;
}) {
  const theme = useTheme();

  const accent =
    health === 'active' ? theme.success : health === 'at_risk' ? theme.accent : theme.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={{ color: accent }}>
          {headline[health](currentStreak)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Last 7 days
        </ThemedText>
      </View>

      <View style={styles.week}>
        {days.map((entry) => {
          const studied = entry.xpEarned > 0;
          const isToday = entry.day === today;

          return (
            <View key={entry.day} style={styles.dayColumn}>
              <ThemedText type="small" themeColor="textSecondary">
                {weekdayLabel(entry.day)}
              </ThemedText>

              <View
                accessibilityLabel={`${entry.day}: ${studied ? `${entry.xpEarned} XP` : 'no activity'}`}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: studied ? theme.success : theme.backgroundElement,
                    borderColor: isToday ? accent : 'transparent',
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: studied ? theme.brandText : theme.textSecondary }}
                >
                  {studied ? entry.xpEarned : ''}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {caption[health]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  week: { flexDirection: 'row', gap: Spacing.two },
  dayColumn: { flex: 1, alignItems: 'center', gap: Spacing.one },
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 44,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
