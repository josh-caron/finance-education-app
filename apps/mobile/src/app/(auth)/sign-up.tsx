import { MAX_DISPLAY_NAME_LENGTH } from '@fin/core';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { signUp } from '@/lib/auth-client';

/** Must match `emailAndPassword.minPasswordLength` in apps/api/src/auth.ts. */
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const { error: signUpError } = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? 'Could not create your account.');
      return;
    }

    router.replace('/(tabs)/learn');
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Create your account</ThemedText>

      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        hint="Shown to other learners on the leaderboard"
      />

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
        autoComplete="new-password"
        textContentType="newPassword"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        error={passwordTooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters` : undefined}
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <Button
        label="Create account"
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={submitting}
      />

      <Link href="/(auth)/sign-in" style={styles.link}>
        <ThemedText type="link" themeColor="brand">
          Already have an account? Sign in
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: Spacing.two, alignSelf: 'center' },
});
