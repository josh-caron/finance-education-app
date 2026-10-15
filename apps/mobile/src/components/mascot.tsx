import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** The piggy bank that asks the questions. Purely decorative. */
export function Mascot({ size = 40 }: { size?: number }) {
  const theme = useTheme();

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentSurface,
          borderBottomColor: theme.accentEdge,
        },
      ]}
    >
      <MaterialCommunityIcons name="piggy-bank-outline" size={size * 0.58} color={theme.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 },
});
