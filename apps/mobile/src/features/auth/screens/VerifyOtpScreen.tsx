import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../store';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export const VerifyOtpScreen: React.FC<Props> = () => {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const identifier = useAuthStore((s) => s.pendingIdentifier);

  const onSubmit = async () => {
    if (code.length < 4) return;
    setSubmitting(true);
    try {
      await verifyOtp(code);
    } catch (err: any) {
      Alert.alert('Invalid code', err?.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const target =
    identifier && 'phone' in identifier
      ? identifier.phone
      : identifier && 'email' in identifier
        ? identifier.email
        : 'your device';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>Enter verification code</Text>
        <Text style={styles.caption}>We sent a code to {target}.</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={AppColors.textMuted}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
        />
      </View>
      <PrimaryButton title="Verify" onPress={onSubmit} loading={submitting} disabled={code.length < 4} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center' },
  heading: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  caption: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  input: {
    ...Typography.h2,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    letterSpacing: 6,
    textAlign: 'center',
  },
});
