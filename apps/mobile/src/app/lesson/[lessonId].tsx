import { levelForXp, toDayKey } from '@fin/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import {
  emptyDraft,
  ExerciseView,
  toAnswer,
  type Draft,
} from '@/components/exercises/exercise-view';
import { LevelRing } from '@/components/level-ring';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { XpBar } from '@/components/xp-bar';
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
  // Snapshotted when the lesson opens so the summary can tell a level-up apart
  // from ordinary XP gain.
  const levelBefore = useRef(1);

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
        localDay: toDayKey(new Date()),
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
      levelBefore.current = levelFromXp(data.totalXp - data.bonus);
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
    const leveledUp = completion.level > levelBefore.current;

    return (
      <Screen>
        <View style={styles.celebration}>
          <ThemedText type="subtitle">
            {leveledUp ? `Level ${completion.level}` : 'Lesson complete'}
          </ThemedText>

          {completion.practice ? (
            <ThemedText type="small" themeColor="textSecondary">
              You already banked the XP for these exercises.
            </ThemedText>
          ) : null}

          <LevelRing
            level={completion.level}
            fraction={
              completion.xpIntoLevel + completion.xpToNext === 0
                ? 0
                : completion.xpIntoLevel / (completion.xpIntoLevel + completion.xpToNext)
            }
          />

          <ThemedText
            style={[
              styles.xpGain,
              { color: completion.practice ? theme.textSecondary : theme.brand },
            ]}
          >
            {completion.practice ? 'Practice run' : `+${completion.xpEarned} XP`}
          </ThemedText>
        </View>

        <XpBar
          level={completion.level}
          xpIntoLevel={completion.xpIntoLevel}
          xpToNext={completion.xpToNext}
        />

        <View style={styles.summary}>
          <SummaryTile label="First try" value={`${completion.score}%`} />
          <SummaryTile label="Streak" value={`${completion.currentStreak}d`} />
          <SummaryTile label="Total XP" value={String(completion.totalXp)} />
        </View>

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
            {!result.correct
              ? 'Not quite'
              : result.xpAwarded > 0
                ? `Correct · +${result.xpAwarded} XP`
                : 'Correct · practice, already banked'}
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

function levelFromXp(totalXp: number): number {
  return levelForXp(Math.max(0, totalXp)).level;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={styles.tileValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  celebration: { alignItems: 'center', gap: Spacing.three },
  xpGain: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  summary: { flexDirection: 'row', gap: Spacing.two },
  tile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  tileValue: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  feedback: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
});
