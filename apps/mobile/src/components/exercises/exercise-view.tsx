import { parseNumericAnswer, type Answer, type PublicExercise } from '@fin/core';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { ComputedAnswer } from './computed-answer';
import { MultipleChoice } from './multiple-choice';
import { Ordering } from './ordering';

/**
 * Per-exercise draft state, kept as a discriminated union so the lesson screen
 * does not have to know how each exercise type collects its answer.
 */
export type Draft =
  | { kind: 'multiple_choice'; choiceId: string | null }
  | { kind: 'ordering'; order: string[] }
  | { kind: 'computed_answer'; text: string };

export function emptyDraft(exercise: PublicExercise): Draft {
  switch (exercise.kind) {
    case 'multiple_choice':
      return { kind: 'multiple_choice', choiceId: null };
    case 'ordering':
      return { kind: 'ordering', order: [] };
    case 'computed_answer':
      return { kind: 'computed_answer', text: '' };
  }
}

/**
 * Converts a draft into the payload the API grades, or null when the learner
 * has not finished answering. Null is what disables the submit button.
 */
export function toAnswer(exercise: PublicExercise, draft: Draft): Answer | null {
  if (exercise.kind !== draft.kind) return null;

  switch (draft.kind) {
    case 'multiple_choice':
      return draft.choiceId ? { kind: 'multiple_choice', choiceId: draft.choiceId } : null;

    case 'ordering': {
      const complete = exercise.kind === 'ordering' && draft.order.length === exercise.items.length;
      return complete ? { kind: 'ordering', order: draft.order } : null;
    }

    case 'computed_answer': {
      const value = parseNumericAnswer(draft.text);
      return value === null ? null : { kind: 'computed_answer', value };
    }
  }
}

export function ExerciseView({
  exercise,
  draft,
  onChange,
  disabled,
}: {
  exercise: PublicExercise;
  draft: Draft;
  onChange: (draft: Draft) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.container}>
      <ThemedText type="default" style={styles.prompt}>
        {exercise.prompt}
      </ThemedText>

      {exercise.kind === 'multiple_choice' && draft.kind === 'multiple_choice' ? (
        <MultipleChoice
          exercise={exercise}
          selected={draft.choiceId}
          onSelect={(choiceId) => onChange({ kind: 'multiple_choice', choiceId })}
          disabled={disabled}
        />
      ) : null}

      {exercise.kind === 'ordering' && draft.kind === 'ordering' ? (
        <Ordering
          exercise={exercise}
          order={draft.order}
          onChange={(order) => onChange({ kind: 'ordering', order })}
          disabled={disabled}
        />
      ) : null}

      {exercise.kind === 'computed_answer' && draft.kind === 'computed_answer' ? (
        <ComputedAnswer
          exercise={exercise}
          value={draft.text}
          onChange={(text) => onChange({ kind: 'computed_answer', text })}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  prompt: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
});
