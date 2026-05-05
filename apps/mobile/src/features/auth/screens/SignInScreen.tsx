import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { TextField } from '../../../shared/components/TextField';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { DeltaLogo } from '../../../shared/components/DeltaLogo';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../store';
import { getApiErrorMessage } from '../../../core/api/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

const isValidSignupPassword = (value: string) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);

export const SignInScreen: React.FC<Props> = () => {
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
      if (mode === 'signin') await signIn(trimmedEmail, password);
      else await signUp(trimmedEmail, password, name.trim() || undefined);
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setError(message);
      Alert.alert(mode === 'signin' ? 'Could not sign in' : 'Could not create account', message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasEmail = email.trim().includes('@');
  const canSubmit =
    hasEmail && (mode === 'signin' ? password.length > 0 : isValidSignupPassword(password));

  return (
    <ScreenBackdrop tone="mixed">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brandRow}>
          <DeltaLogo size={28} />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{mode === 'signin' ? 'Welcome back' : 'Get started'}</Text>
          <Text style={styles.title}>
            {mode === 'signin' ? 'Pick up where\nyou left off.' : 'Create your\nDelta account.'}
          </Text>

          <View style={styles.modeTabs}>
            <ModeTab
              label="Sign in"
              active={mode === 'signin'}
              onPress={() => setMode('signin')}
            />
            <ModeTab
              label="Create account"
              active={mode === 'signup'}
              onPress={() => setMode('signup')}
            />
          </View>

          {mode === 'signup' && (
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
              iconLeft="◉"
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
            iconLeft="✉"
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
            iconLeft="◆"
            hint={mode === 'signup' ? '8+ characters with uppercase, lowercase, number, and symbol' : undefined}
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorGlyph}>!</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            iconLeft="→"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

const ModeTab: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <Pressable onPress={onPress} style={[styles.modeTab, active && styles.modeTabActive]}>
    <Text style={[styles.modeTabLabel, active && styles.modeTabLabelActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  brandRow: { marginBottom: Spacing.lg },
  body: { flex: 1, justifyContent: 'flex-start', paddingTop: Spacing.lg },
  eyebrow: { ...Typography.label, color: AppColors.primary, textTransform: 'uppercase', letterSpacing: 1.4 },
  title: {
    ...Typography.display,
    color: AppColors.textPrimary,
    fontSize: 36,
    lineHeight: 40,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  modeTabActive: { backgroundColor: AppColors.primaryGlow },
  modeTabLabel: { ...Typography.label, color: AppColors.textSecondary, fontWeight: '600' },
  modeTabLabelActive: { color: AppColors.primary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.dangerBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  errorGlyph: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.danger,
    color: AppColors.white,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '800',
  },
  errorText: { ...Typography.body, color: AppColors.danger, flex: 1 },
  actions: { gap: Spacing.md },
});
