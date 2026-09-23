import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { signIn } from '@/lib/auth-client';
import { describeError } from '@/lib/errors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (submitting || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: signInError } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(describeError(signInError, 'Could not sign in. Check your email and password.'));
        return;
      }

      router.replace('/(tabs)/learn');
    } catch (thrown) {
      setError(describeError(thrown, 'Could not sign in. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Welcome back</ThemedText>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => canSubmit && handleSubmit()}
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <Button label="Sign in" onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />

      <Link href="/(auth)/forgot-password" style={styles.link}>
        <ThemedText type="link" themeColor="brand">
          Forgot your password?
        </ThemedText>
      </Link>

      <Link href="/(auth)/sign-up" style={styles.link}>
        <ThemedText type="link" themeColor="brand">
          New here? Create an account
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: Spacing.two, alignSelf: 'center' },
});
