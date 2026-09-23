import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { resetPassword } from '@/lib/auth-client';
import { describeError } from '@/lib/errors';

/** Must match `emailAndPassword.minPasswordLength` in apps/api/src/auth.ts. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Where the emailed link lands. The server checks the token first and then
 * redirects here with it, or with an error when it has expired or been used.
 */
export default function ResetPasswordScreen() {
  const { token, error: linkError } = useLocalSearchParams<{ token?: string; error?: string }>();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  async function handleSubmit() {
    if (submitting || !token) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: failure } = await resetPassword({ token, newPassword: password });
      if (failure) {
        setError(describeError(failure, 'Could not reset your password. Request a new link.'));
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch (thrown) {
      setError(describeError(thrown, 'Could not reset your password. Request a new link.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (linkError || !token) {
    return (
      <Screen>
        <ThemedText type="subtitle">This link has expired</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Reset links last one hour and work once. Ask for a new one.
        </ThemedText>
        <Button label="Send a new link" onPress={() => router.replace('/(auth)/forgot-password')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Choose a new password</ThemedText>

      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        error={tooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters` : undefined}
        onSubmitEditing={handleSubmit}
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Choosing a new password signs you out everywhere else.
      </ThemedText>

      <Button
        label="Save new password"
        onPress={handleSubmit}
        disabled={password.length < MIN_PASSWORD_LENGTH}
        loading={submitting}
      />

      <Link href="/(auth)/sign-in" style={styles.link}>
        <ThemedText type="link" themeColor="brand">
          Back to sign in
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: Spacing.two, alignSelf: 'center' },
});
