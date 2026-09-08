import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Circular XP meter with the level in the middle. The arc is drawn with a
 * dash offset rather than a rotation so it fills clockwise from twelve
 * o'clock on both web and native.
 */
export function LevelRing({
  level,
  fraction,
  size = 132,
  thickness = 12,
}: {
  level: number;
  /** Progress through the current level, 0 to 1. */
  fraction: number;
  size?: number;
  thickness?: number;
}) {
  const theme = useTheme();

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, fraction));
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.backgroundElement}
          strokeWidth={thickness}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.brand}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          // Start the arc at the top instead of at three o'clock.
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.label} pointerEvents="none">
        <ThemedText type="small" themeColor="textSecondary">
          Level
        </ThemedText>
        <ThemedText style={styles.level}>{level}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: { fontSize: 40, lineHeight: 44, fontWeight: '700' },
});
