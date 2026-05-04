import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../store';
import { TextField } from '../../../shared/components/TextField';
import { getApiErrorMessage } from '../../../core/api/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

const isValidSignupPassword = (value: string) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const onSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || password.length < 8) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password, name.trim() || undefined);
      }
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setError(message);
      Alert.alert(
        mode === 'signin' ? 'Could not sign in' : 'Could not create account',
        message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasEmail = email.trim().includes('@');
  const canSubmit =
    hasEmail && (mode === 'signin' ? password.length > 0 : isValidSignupPassword(password));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.caption}>
          {mode === 'signin'
            ? 'Sign in with the email and password you used for Delta.'
            : 'Use an email and password to connect to the Delta API.'}
        </Text>
        {mode === 'signup' && (
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
        )}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'signin' ? 'Your password' : '8+ chars, Aa, 1, symbol'}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
        {mode === 'signup' && (
          <Text style={styles.passwordHint}>
            Use 8+ characters with uppercase, lowercase, number, and symbol
          </Text>
        )}
        <Pressable
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={({ pressed }) => [styles.modeLink, pressed && styles.pressed]}
        >
          <Text style={styles.modeText}>
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      <PrimaryButton
        title={mode === 'signin' ? 'Sign in' : 'Create account'}
        onPress={onSubmit}
        loading={submitting}
        disabled={!canSubmit}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center' },
  heading: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  caption: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  passwordHint: { ...Typography.caption, color: AppColors.textSecondary, marginTop: -Spacing.sm },
  modeLink: { alignSelf: 'center', marginTop: Spacing.sm, padding: Spacing.sm },
  modeText: { ...Typography.bodyMedium, color: AppColors.primary },
  errorBox: {
    backgroundColor: AppColors.dangerBg,
    borderWidth: 1,
    borderColor: AppColors.danger,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: { ...Typography.body, color: AppColors.danger },
  pressed: { opacity: 0.75 },
});
