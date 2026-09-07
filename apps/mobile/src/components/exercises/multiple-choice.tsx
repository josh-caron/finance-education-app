import type { PublicExercise } from '@fin/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Exercise = Extract<PublicExercise, { kind: 'multiple_choice' }>;

export function MultipleChoice({
  exercise,
  selected,
  onSelect,
  disabled,
}: {
  exercise: Exercise;
  selected: string | null;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.choices}>
      {exercise.choices.map((choice) => {
        const isSelected = choice.id === selected;

        return (
          <Pressable
            key={choice.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(choice.id)}
            style={[
              styles.choice,
              {
                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: isSelected ? theme.brand : theme.border,
              },
            ]}
          >
            <ThemedText type="default">{choice.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  choices: { gap: Spacing.two },
  choice: {
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
  },
});
