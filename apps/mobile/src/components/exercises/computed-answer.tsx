import type { PublicExercise } from '@fin/core';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Exercise = Extract<PublicExercise, { kind: 'computed_answer' }>;

const placeholders: Record<Exercise['format'], string> = {
  usd: '$0.00',
  percent: '0%',
  years: '0 years',
  number: '0',
};

/**
 * The differentiating exercise type: the learner computes a value instead of
 * recognizing one. Input stays free text so "1,234.56" and "1234.56" both work;
 * @fin/core's parseNumericAnswer normalizes it before the answer is submitted.
 */
export function ComputedAnswer({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Exercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.container}>
      <TextField
        label="Your answer"
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        keyboardType="numbers-and-punctuation"
        inputMode="decimal"
        placeholder={placeholders[exercise.format]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {exercise.hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          Hint: {exercise.hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
});
