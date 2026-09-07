import { toDayKey } from '@fin/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import {
  emptyDraft,
  ExerciseView,
  toAnswer,
  type Draft,
} from '@/components/exercises/exercise-view';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, apiPost } from '@/lib/api';
import type { AttemptResult, LessonCompletion, LessonDetail } from '@/lib/api-types';

/**
 * The lesson player: one exercise at a time, submit for feedback, advance.
 * Grading happens on the server, so this screen never sees an answer key.
 */
export default function LessonScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [completion, setCompletion] = useState<LessonCompletion | null>(null);

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => apiFetch<LessonDetail>(`/api/content/lessons/${lessonId}`),
    enabled: Boolean(lessonId),
  });

  const exercise = lessonQuery.data?.exercises[index];
  const currentDraft = useMemo(
    () => draft ?? (exercise ? emptyDraft(exercise) : null),
    [draft, exercise],
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (!exercise || !currentDraft) throw new Error('Nothing to submit');

      const answer = toAnswer(exercise, currentDraft);
      if (!answer) throw new Error('Answer is incomplete');

      return apiPost<AttemptResult>(`/api/progress/lessons/${lessonId}/attempts`, {
        exerciseId: exercise.id,
        answer,
      });
    },
    onSuccess: setResult,
  });

  const complete = useMutation({
    mutationFn: () =>
      apiPost<LessonCompletion>(`/api/progress/lessons/${lessonId}/complete`, {
        localDay: toDayKey(new Date()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: (data) => {
      setCompletion(data);
      // The skill tree and the header stats both moved.
      void queryClient.invalidateQueries({ queryKey: ['units'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  if (lessonQuery.isPending) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="danger">
          Could not load this lesson.
        </ThemedText>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const lesson = lessonQuery.data;

  if (completion) {
    return (
      <Screen>
        <ThemedText type="subtitle">Lesson complete</ThemedText>
        <ThemedText type="default">
          +{completion.xpEarned} XP · {completion.score}% first-try · {completion.currentStreak} day
          streak
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {completion.xpToNext} XP to level {completion.level + 1}
        </ThemedText>
        <Button label="Back to the tree" onPress={() => router.back()} />
      </Screen>
    );
  }

  const isLast = index === lesson.exercises.length - 1;
  const answerReady = exercise && currentDraft ? toAnswer(exercise, currentDraft) !== null : false;

  function goToNext() {
    setResult(null);
    setDraft(null);

    if (isLast) {
      complete.mutate();
      return;
    }

    setIndex((current) => current + 1);
  }

  function retry() {
    setResult(null);
    if (exercise) setDraft(emptyDraft(exercise));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {index + 1} of {lesson.exercises.length}
        </ThemedText>
        <ThemedText type="smallBold">{lesson.title}</ThemedText>
      </View>

      {index === 0 && lesson.intro ? (
        <ThemedText type="small" themeColor="textSecondary">
          {lesson.intro}
        </ThemedText>
      ) : null}

      {exercise && currentDraft ? (
        <ExerciseView
          exercise={exercise}
          draft={currentDraft}
          onChange={setDraft}
          disabled={result !== null}
        />
      ) : null}

      {result ? (
        <View
          style={[
            styles.feedback,
            { backgroundColor: result.correct ? theme.successSurface : theme.dangerSurface },
          ]}
        >
          <ThemedText type="smallBold" themeColor={result.correct ? 'success' : 'danger'}>
            {result.correct ? `Correct · +${result.xpAwarded} XP` : 'Not quite'}
          </ThemedText>

          {result.expected ? <ThemedText type="small">Answer: {result.expected}</ThemedText> : null}

          {result.explanation ? <ThemedText type="small">{result.explanation}</ThemedText> : null}
        </View>
      ) : null}

      {submit.isError ? (
        <ThemedText type="small" themeColor="danger">
          Could not submit that answer. Try again.
        </ThemedText>
      ) : null}

      {complete.isError ? (
        <ThemedText type="small" themeColor="danger">
          Could not save your progress. Answer every exercise correctly to finish the lesson.
        </ThemedText>
      ) : null}

      {result === null ? (
        <Button
          label="Check"
          onPress={() => submit.mutate()}
          disabled={!answerReady}
          loading={submit.isPending}
        />
      ) : result.correct ? (
        <Button
          label={isLast ? 'Finish lesson' : 'Continue'}
          onPress={goToNext}
          loading={complete.isPending}
        />
      ) : (
        <Button label="Try again" onPress={retry} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  feedback: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
});
