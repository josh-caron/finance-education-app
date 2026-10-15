import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/** How far a button sits above its edge, and how far it sinks when pressed. */
const EDGE = 4;

/**
 * The chunky button: a solid face over a darker edge. Pressing sinks the face
 * into the edge rather than fading it, which is what makes it feel physical.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const isInactive = disabled || loading;

  const colors =
    variant === 'primary'
      ? { face: theme.brand, edge: theme.brandEdge, label: theme.brandText, outline: theme.brand }
      : variant === 'danger'
        ? {
            face: theme.danger,
            edge: theme.dangerEdge,
            label: theme.brandText,
            outline: theme.danger,
          }
        : {
            face: theme.background,
            edge: theme.elementEdge,
            label: theme.text,
            outline: theme.border,
          };

  // A disabled button goes flat and grey, so it never looks pressable.
  const face = disabled ? theme.lockedSurface : colors.face;
  const edge = disabled ? theme.border : colors.edge;
  const labelColor = disabled ? theme.locked : colors.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={[styles.pressable, style]}
    >
      {({ pressed }) => {
        const sunk = pressed && !isInactive;
        return (
          <View
            style={[
              styles.face,
              {
                backgroundColor: face,
                borderColor: variant === 'secondary' && !disabled ? colors.outline : face,
                borderBottomColor: edge,
                borderBottomWidth: sunk ? 2 : EDGE,
                marginTop: sunk ? EDGE - 2 : 0,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={labelColor} />
            ) : (
              <Text style={[styles.label, { color: labelColor }]}>{label.toUpperCase()}</Text>
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { minHeight: 52 + EDGE },
  face: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  label: {
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
