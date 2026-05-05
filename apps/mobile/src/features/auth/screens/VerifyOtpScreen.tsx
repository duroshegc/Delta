import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { DeltaLogo } from '../../../shared/components/DeltaLogo';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export const VerifyOtpScreen: React.FC<Props> = ({ navigation }) => {
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
          <Text style={styles.eyebrow}>One more step</Text>
          <Text style={styles.title}>Email sign-in is ready.</Text>
          <Text style={styles.caption}>
            Delta now connects to the backend email and password auth flow.
          </Text>
        </View>
        <PrimaryButton title="Back to sign in" iconLeft="←" onPress={() => navigation.navigate('SignIn')} />
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  brandRow: { marginBottom: Spacing.lg },
  body: { flex: 1, justifyContent: 'center' },
  eyebrow: { ...Typography.label, color: AppColors.primary, textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { ...Typography.display, color: AppColors.textPrimary, fontSize: 32, lineHeight: 36, marginTop: Spacing.sm, marginBottom: Spacing.md },
  caption: { ...Typography.body, color: AppColors.textSecondary },
});
