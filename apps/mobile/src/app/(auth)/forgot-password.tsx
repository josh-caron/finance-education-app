import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { requestPasswordReset } from '@/lib/auth-client';
import { describeError } from '@/lib/errors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: failure } = await requestPasswordReset({
        email: email.trim(),
        // Where the emailed link lands once the server has checked the token.
        redirectTo: '/reset-password',
      });
      if (failure) {
        setError(describeError(failure, 'Could not send the email. Try again.'));
        return;
      }
      setSent(true);
    } catch (thrown) {
      setError(describeError(thrown, 'Could not send the email. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Screen>
        <ThemedText type="subtitle">Check your email</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          If {email.trim()} has a verified account, a reset link is on its way. The link lasts one
          hour.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Nothing arrived? Check spam, or confirm you verified this address when you signed up.
        </ThemedText>
        <Button label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Reset your password</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        We will email you a link to choose a new one.
      </ThemedText>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        onSubmitEditing={handleSubmit}
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <Button
        label="Send reset link"
        onPress={handleSubmit}
        disabled={email.trim().length === 0}
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
