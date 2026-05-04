import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../store';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestOtp = useAuthStore((s) => s.requestOtp);

  const onSubmit = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await requestOtp({ phone: trimmed });
      navigation.navigate('VerifyOtp');
    } catch (err: any) {
      Alert.alert('Could not send code', err?.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>Enter your phone number</Text>
        <Text style={styles.caption}>We'll text you a verification code.</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 555 5555"
          placeholderTextColor={AppColors.textSecondary}
          keyboardType="phone-pad"
          autoComplete="tel"
          autoFocus
        />
      </View>
      <PrimaryButton title="Send code" onPress={onSubmit} loading={submitting} disabled={!phone.trim()} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center' },
  heading: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  caption: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  input: {
    ...Typography.h3,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
});
