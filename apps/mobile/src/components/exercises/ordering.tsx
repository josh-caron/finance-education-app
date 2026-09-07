import type { PublicExercise } from '@fin/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Exercise = Extract<PublicExercise, { kind: 'ordering' }>;

/**
 * Tap-to-order rather than drag-to-reorder: it works identically on web and
 * native and stays reachable with a screen reader.
 *
 * TODO(backlog 3, Josh): consider drag-and-drop on native once the lesson flow
 * is settled, keeping this as the accessible fallback.
 */
export function Ordering({
  exercise,
  order,
  onChange,
  disabled,
}: {
  exercise: Exercise;
  order: string[];
  onChange: (order: string[]) => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  const remaining = exercise.items.filter((item) => !order.includes(item.id));

  const labelFor = (id: string) => exercise.items.find((item) => item.id === id)?.label ?? id;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Tap in order. Tap a chosen item to remove it.
      </ThemedText>

      <View style={styles.slots}>
        {order.map((id, index) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`Position ${index + 1}: ${labelFor(id)}. Tap to remove.`}
            disabled={disabled}
            onPress={() => onChange(order.filter((candidate) => candidate !== id))}
            style={[
              styles.slot,
              { backgroundColor: theme.backgroundSelected, borderColor: theme.brand },
            ]}
          >
            <ThemedText type="smallBold" themeColor="brand">
              {index + 1}
            </ThemedText>
            <ThemedText type="default">{labelFor(id)}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.slots}>
        {remaining.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onChange([...order, item.id])}
            style={[
              styles.slot,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <ThemedText type="default">{item.label}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  slots: { gap: Spacing.two },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
  },
});
