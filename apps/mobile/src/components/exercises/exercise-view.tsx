import { parseNumericAnswer, type Answer, type PublicExercise } from '@fin/core';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { Mascot } from '@/components/mascot';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
      if (exercise.kind !== 'computed_answer') return null;
      const value = parseNumericAnswer(draft.text, exercise.format);
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
      <KindBadge kind={exercise.kind} />

      <View style={styles.ask}>
        <Mascot size={48} />
        <SpeechBubble>{exercise.prompt}</SpeechBubble>
      </View>

      {exercise.kind !== 'computed_answer' && exercise.hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          Hint: {exercise.hint}
        </ThemedText>
      ) : null}

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
          key={exercise.id}
          exercise={exercise}
          value={draft.text}
          onChange={(text) => onChange({ kind: 'computed_answer', text })}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const kindLook = {
  multiple_choice: { label: 'CHOOSE ONE', icon: 'gesture-tap' },
  ordering: { label: 'PUT IN ORDER', icon: 'sort-numeric-ascending' },
  computed_answer: { label: 'CALCULATE', icon: 'calculator-variant' },
} as const;

function KindBadge({ kind }: { kind: PublicExercise['kind'] }) {
  const theme = useTheme();
  const look = kindLook[kind];

  return (
    <View style={[styles.badge, { backgroundColor: theme.accentSurface }]}>
      <MaterialCommunityIcons name={look.icon} size={16} color={theme.accent} />
      <Text style={[styles.badgeText, { color: theme.accent }]}>{look.label}</Text>
    </View>
  );
}

function SpeechBubble({ children }: { children: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.bubble, { borderColor: theme.border }]}>
      <ThemedText type="default" style={styles.prompt}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  ask: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  bubble: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: Spacing.three,
  },
  prompt: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  badgeText: { fontFamily: Fonts.rounded, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
});
