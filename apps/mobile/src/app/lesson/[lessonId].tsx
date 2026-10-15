import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { levelForXp, toDayKey } from '@fin/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import {
  emptyDraft,
  ExerciseView,
  toAnswer,
  type Draft,
} from '@/components/exercises/exercise-view';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { XpBar } from '@/components/xp-bar';
import { UnitCelebration } from '@/components/unit-celebration';
import { getUnitCelebration } from '@/lib/unit-celebration';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, apiPost } from '@/lib/api';
import { describeError } from '@/lib/errors';
import type { AttemptResult, LessonCompletion, LessonDetail, UnitSummary } from '@/lib/api-types';

/**
 * The lesson player: one exercise at a time, submit for feedback, advance.
 * Grading happens on the server, so this screen never sees an answer key.
 */
export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  // Replacing this route with the next lesson must reset all player state.
  return <LessonPlayer key={lessonId} lessonId={lessonId} />;
}

function LessonPlayer({ lessonId }: { lessonId: string }) {
  const theme = useTheme();
  const queryClient = useQueryClient();

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
        localDay: toDayKey(new Date()),
      });
    },
    onSuccess: setResult,
  });

  const complete = useMutation({
    mutationFn: () =>
      apiPost<LessonCompletion>(`/api/progress/lessons/${lessonId}/complete`, {
        localDay: toDayKey(new Date()),
      }),
    onSuccess: (data) => {
      setCompletion(data);
      // The skill tree and the header stats both moved.
      void queryClient.invalidateQueries({ queryKey: ['units'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  // Fetch after saving so the final lesson is included, even for direct links
  // or an out-of-date skill tree. A failed fetch never discards saved progress.
  const celebrationQuery = useQuery({
    queryKey: ['unit-completion', lessonId, complete.submittedAt],
    queryFn: () => apiFetch<{ units: UnitSummary[] }>('/api/content/units'),
    enabled: completion?.firstCompletion === true,
    gcTime: 0,
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
          {describeError(lessonQuery.error, 'Could not load this lesson.')}
        </ThemedText>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const lesson = lessonQuery.data;

  if (completion) {
    // XP before this completion, so a level-up can be told apart from ordinary XP gain.
    const leveledUp = completion.level > levelFromXp(completion.totalXp - completion.bonus);
    const celebration = getUnitCelebration(
      lesson.unitId,
      completion.firstCompletion,
      celebrationQuery.data?.units ?? [],
    );

    return (
      <Screen>
        {celebration ? <UnitCelebration celebration={celebration} /> : null}
        {completion.firstCompletion && celebrationQuery.isPending ? (
          <ActivityIndicator accessibilityLabel="Checking unit completion" />
        ) : null}
        {completion.firstCompletion && celebrationQuery.isError ? (
          <View style={styles.feedback}>
            <ThemedText type="small">
              Your progress is saved. We could not load your unit milestone.
            </ThemedText>
            <Button
              label="Check unit progress"
              variant="secondary"
              loading={celebrationQuery.isFetching}
              onPress={() => void celebrationQuery.refetch()}
            />
          </View>
        ) : null}
        <View style={styles.celebration}>
          <View
            style={[
              styles.trophy,
              { backgroundColor: theme.accentSurface, borderBottomColor: theme.accentEdge },
            ]}
          >
            <MaterialCommunityIcons
              name={leveledUp ? 'shield-star' : 'trophy'}
              size={64}
              color={theme.accent}
            />
          </View>

          <Text style={[styles.celebrationTitle, { color: theme.accent }]}>
            {leveledUp ? `Level ${completion.level}!` : 'Lesson complete!'}
          </Text>
          <ThemedText type="small" themeColor="textSecondary">
            {completion.practice
              ? 'Practice run. You already banked the XP for these exercises.'
              : lesson.title}
          </ThemedText>
        </View>

        <XpBar
          level={completion.level}
          xpIntoLevel={completion.xpIntoLevel}
          xpToNext={completion.xpToNext}
        />

        <View style={styles.summary}>
          <SummaryTile
            label="XP"
            icon="lightning-bolt"
            value={completion.practice ? '0' : `+${completion.xpEarned}`}
            color={theme.accent}
            edge={theme.accentEdge}
          />
          <SummaryTile
            label="First try"
            icon="target"
            value={`${completion.score}%`}
            color={theme.brand}
            edge={theme.brandEdge}
          />
          <SummaryTile
            label="Streak"
            icon="fire"
            value={String(completion.currentStreak)}
            color={theme.streak}
            edge={theme.streak}
          />
        </View>

        {celebration?.nextLesson ? (
          <Button
            label={`Continue: ${celebration.nextUnit!.title}`}
            onPress={() =>
              router.replace({
                pathname: '/lesson/[lessonId]',
                params: { lessonId: celebration.nextLesson!.id },
              })
            }
          />
        ) : null}
        <Button
          label={celebration?.courseComplete ? 'Back to practice' : 'Back to the tree'}
          variant={celebration?.nextLesson ? 'secondary' : 'primary'}
          onPress={() => router.replace('/(tabs)/learn')}
        />
      </Screen>
    );
  }

  const isLast = index === lesson.exercises.length - 1;
  // Fill the bar as each exercise is passed, not when the next one opens.
  const answered = index + (result?.correct ? 1 : 0);
  const answerReady = exercise && currentDraft ? toAnswer(exercise, currentDraft) !== null : false;

  function goToNext() {
    if (isLast) {
      complete.mutate();
      return;
    }

    setResult(null);
    setDraft(null);
    setIndex((current) => current + 1);
  }

  function retry() {
    setResult(null);
    if (exercise) setDraft(emptyDraft(exercise));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave lesson"
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/learn'))}
        >
          <MaterialCommunityIcons name="close" size={28} color={theme.locked} />
        </Pressable>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`${lesson.title}, exercise ${index + 1} of ${lesson.exercises.length}`}
          accessibilityValue={{ min: 0, max: lesson.exercises.length, now: answered }}
          style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.brand,
                width: `${(answered / lesson.exercises.length) * 100}%`,
              },
            ]}
          />
        </View>
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

      {submit.isError ? (
        <ThemedText type="small" themeColor="danger">
          {describeError(submit.error, 'Could not submit that answer. Try again.')}
        </ThemedText>
      ) : null}

      {complete.isError ? (
        <ThemedText type="small" themeColor="danger">
          {describeError(complete.error, 'Could not save your progress. Try again.')}
        </ThemedText>
      ) : null}

      {result === null ? (
        <Button
          label="Check"
          onPress={() => submit.mutate()}
          disabled={!answerReady}
          loading={submit.isPending}
        />
      ) : (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            { backgroundColor: result.correct ? theme.successSurface : theme.dangerSurface },
          ]}
        >
          <View style={styles.feedbackTitle}>
            <MaterialCommunityIcons
              name={result.correct ? 'check-circle' : 'close-circle'}
              size={30}
              color={result.correct ? theme.success : theme.danger}
            />
            <Text
              style={[
                styles.feedbackHeading,
                { color: result.correct ? theme.success : theme.danger },
              ]}
            >
              {!result.correct
                ? 'Not quite'
                : result.xpAwarded > 0
                  ? `Nice work! +${result.xpAwarded} XP`
                  : 'Correct! Already banked'}
            </Text>
          </View>

          {result.expected ? (
            <ThemedText type="smallBold" themeColor={result.correct ? 'success' : 'danger'}>
              Answer: {result.expected}
            </ThemedText>
          ) : null}

          {result.explanation ? <ThemedText type="small">{result.explanation}</ThemedText> : null}

          {result.correct ? (
            <Button
              label={isLast ? 'Finish lesson' : 'Continue'}
              onPress={goToNext}
              loading={complete.isPending}
            />
          ) : (
            <Button label="Try again" variant="danger" onPress={retry} />
          )}
        </View>
      )}
    </Screen>
  );
}

function levelFromXp(totalXp: number): number {
  return levelForXp(Math.max(0, totalXp)).level;
}

function SummaryTile({
  label,
  icon,
  value,
  color,
  edge,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  color: string;
  edge: string;
}) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { borderColor: color, borderBottomColor: edge }]}
    >
      <View style={[styles.tileHeader, { backgroundColor: color }]}>
        <Text style={[styles.tileLabel, { color: theme.background }]}>{label.toUpperCase()}</Text>
      </View>
      <View style={styles.tileBody}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
        <Text style={[styles.tileValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  celebration: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  trophy: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  celebrationTitle: { fontFamily: Fonts.rounded, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  summary: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, overflow: 'hidden' },
  tileHeader: { paddingVertical: Spacing.one, alignItems: 'center' },
  tileLabel: { fontFamily: Fonts.rounded, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  tileBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  tileValue: { fontFamily: Fonts.rounded, fontSize: 20, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  progressTrack: { flex: 1, height: 16, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  feedback: { borderRadius: 18, padding: Spacing.three, gap: Spacing.three },
  feedbackTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  feedbackHeading: { fontFamily: Fonts.rounded, fontSize: 20, fontWeight: '800', flexShrink: 1 },
});
