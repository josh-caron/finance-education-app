import { parseNumericAnswer, type PublicExercise } from '@fin/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Exercise = Extract<PublicExercise, { kind: 'computed_answer' }>;

const placeholders: Record<Exercise['format'], string> = {
  usd: '$0.00',
  percent: '0%',
  years: '0',
  number: '0',
};

const guidance: Record<Exercise['format'], string> = {
  usd: 'Enter dollars, for example 1,234.56 or $1234.56. Use a period for decimals.',
  percent: 'Enter the percentage: for 7%, type 7 or 7%, not 0.07.',
  years: 'Enter years as a number, for example 2 or 2.5. Do not type "years".',
  number:
    'Enter a number, for example 12 or 12.5. Follow any rounding instructions in the question.',
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
  const [blurredValue, setBlurredValue] = useState<string | null>(null);
  const blank = value.trim() === '';
  const invalid = !blank && parseNumericAnswer(value, exercise.format) === null;
  const error = invalid
    ? `Enter a valid number in the requested units. ${guidance[exercise.format]}`
    : blank && blurredValue === value
      ? 'Enter an answer to enable Check.'
      : undefined;

  return (
    <View style={styles.container}>
      <TextField
        label="Your answer"
        hint={guidance[exercise.format]}
        error={error}
        onBlur={() => setBlurredValue(value)}
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
