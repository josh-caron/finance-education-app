import { toDayKey } from '@fin/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { LevelRing } from '@/components/level-ring';
import { Screen } from '@/components/screen';
import { StreakStrip } from '@/components/streak-strip';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { XpBar } from '@/components/xp-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, apiPatch } from '@/lib/api';
import type { LearnerProfile } from '@/lib/api-types';
import { deleteUser, sendVerificationEmail, signOut, useSession } from '@/lib/auth-client';
import { describeError } from '@/lib/errors';

export default function ProfileScreen() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Streaks follow the learner's calendar, so the local day goes to the API.
  const localDay = toDayKey(new Date());

  const profileQuery = useQuery({
    queryKey: ['profile', localDay],
    queryFn: () => apiFetch<LearnerProfile>(`/api/progress/me?localDay=${localDay}`),
  });

  async function handleResendVerification() {
    if (sendingVerification || !session?.user.email) return;
    setSendingVerification(true);
    setVerificationError(null);

    try {
      const { error } = await sendVerificationEmail({
        email: session.user.email,
        callbackURL: '/',
      });
      if (error) {
        setVerificationError(describeError(error, 'Could not send the email. Try again.'));
        return;
      }
      setVerificationSent(true);
    } catch (thrown) {
      setVerificationError(describeError(thrown, 'Could not send the email. Try again.'));
    } finally {
      setSendingVerification(false);
    }
  }

  /** Deleting takes the password every time, so a borrowed session is not enough. */
  async function handleDeleteAccount() {
    if (deleting || deletePassword.length === 0) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await deleteUser({ password: deletePassword });
      if (error) {
        setDeleteError(describeError(error, 'Could not delete your account. Check your password.'));
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch (thrown) {
      setDeleteError(describeError(thrown, 'Could not delete your account. Try again.'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError(describeError(result.error, 'Could not sign out. Please try again.'));
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch (thrown) {
      setSignOutError(describeError(thrown, 'Could not sign out. Please try again.'));
    } finally {
      setSigningOut(false);
    }
  }

  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();
  const visibility = useMutation({
    mutationFn: (showOnLeaderboard: boolean) =>
      apiPatch<{ showOnLeaderboard: boolean }>('/api/progress/me', { showOnLeaderboard }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const profile = profileQuery.data;
  const completed = profile?.lessons.filter((lesson) => lesson.status === 'completed').length ?? 0;

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">{session?.user.name ?? 'Profile'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {session?.user.email}
        </ThemedText>
      </View>

      {profileQuery.isPending ? <ActivityIndicator /> : null}

      {profileQuery.isError ? (
        <ThemedText type="small" themeColor="danger">
          {describeError(profileQuery.error, 'Could not load your progress.')}
        </ThemedText>
      ) : null}

      {profile ? (
        <>
          <View style={styles.hero}>
            <LevelRing
              level={profile.level}
              fraction={levelFraction(profile.xpIntoLevel, profile.xpToNext)}
            />

            <View style={styles.heroMeta}>
              <XpBar
                level={profile.level}
                xpIntoLevel={profile.xpIntoLevel}
                xpToNext={profile.xpToNext}
              />

              <View style={styles.stats}>
                <Stat label="Total XP" value={String(profile.totalXp)} />
                <Stat label="Best streak" value={`${profile.longestStreak}d`} />
                <Stat label="Lessons" value={String(completed)} />
              </View>
            </View>
          </View>

          <StreakStrip
            days={profile.recentDays}
            today={profile.today}
            currentStreak={profile.currentStreak}
            health={profile.streakHealth}
          />

          <View style={styles.setting}>
            <View style={styles.settingText}>
              <ThemedText type="smallBold">Show me on the leaderboard</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Other learners see your name and XP. Turn this off to stay private.
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel="Show me on the leaderboard"
              value={visibility.isPending ? visibility.variables : profile.showOnLeaderboard}
              onValueChange={(value) => visibility.mutate(value)}
              disabled={visibility.isPending}
            />
          </View>
          {visibility.isError ? (
            <ThemedText type="small" themeColor="danger">
              {describeError(visibility.error, 'Could not save that setting. Try again.')}
            </ThemedText>
          ) : null}
        </>
      ) : null}

      {session && !session.user.emailVerified ? (
        <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Verify your email</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {verificationSent
              ? 'Sent. Check your inbox, and your spam folder.'
              : 'You can keep learning either way, but a verified address is what lets you reset your password.'}
          </ThemedText>
          {verificationError ? (
            <ThemedText type="small" themeColor="danger">
              {verificationError}
            </ThemedText>
          ) : null}
          {verificationSent ? null : (
            <Button
              label="Send verification email"
              variant="secondary"
              onPress={handleResendVerification}
              loading={sendingVerification}
            />
          )}
        </View>
      ) : null}

      {signOutError ? (
        <ThemedText type="small" themeColor="danger">
          {signOutError}
        </ThemedText>
      ) : null}
      <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />

      <View style={[styles.notice, { borderColor: theme.danger, borderWidth: 1 }]}>
        <ThemedText type="smallBold" themeColor="danger">
          Delete your account
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          This removes your account, your XP, and every lesson you have finished. It cannot be
          undone.
        </ThemedText>

        {confirmingDelete ? (
          <>
            <TextField
              label="Confirm your password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
            {deleteError ? (
              <ThemedText type="small" themeColor="danger">
                {deleteError}
              </ThemedText>
            ) : null}
            <Button
              label="Delete my account permanently"
              variant="danger"
              onPress={handleDeleteAccount}
              disabled={deletePassword.length === 0}
              loading={deleting}
            />
            <Button
              label="Keep my account"
              variant="secondary"
              onPress={() => {
                setConfirmingDelete(false);
                setDeletePassword('');
                setDeleteError(null);
              }}
            />
          </>
        ) : (
          <Button
            label="Delete account"
            variant="secondary"
            onPress={() => setConfirmingDelete(true)}
          />
        )}
      </View>
    </Screen>
  );
}

function levelFraction(xpIntoLevel: number, xpToNext: number): number {
  const span = xpIntoLevel + xpToNext;
  return span === 0 ? 0 : xpIntoLevel / span;
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, flexWrap: 'wrap' },
  heroMeta: { flexGrow: 1, flexShrink: 1, minWidth: 220, gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  statValue: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  settingText: { flex: 1, gap: Spacing.one },
  notice: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
});
