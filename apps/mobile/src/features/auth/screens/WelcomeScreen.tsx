import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { DeltaLogo } from '../../../shared/components/DeltaLogo';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenBackdrop tone="mixed">
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <DeltaLogo size={32} />
        </View>

        <View style={styles.hero}>
          <View style={styles.bigLogoWrap}>
            <DeltaLogo size={88} showWordmark={false} />
          </View>

          <Text style={styles.headline}>
            Real{' '}
            <GradText>connection.</GradText>
          </Text>
          <Text style={styles.sub}>
            Date, discover, and meet live with people who match your vibe.
          </Text>

          <View style={styles.pills}>
            {['Profile matching', 'Live video', 'Verified', 'Interest-based'].map((p) => (
              <View key={p} style={styles.pill}>
                <Text style={styles.pillText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Get started"
            iconLeft="→"
            onPress={() => navigation.navigate('SignIn')}
          />
          <Pressable
            onPress={() => navigation.navigate('SignIn')}
            style={({ pressed }) => [styles.signin, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.signinText}>
              Have an account? <Text style={styles.signinLink}>Sign in</Text>
            </Text>
          </Pressable>
          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </ScreenBackdrop>
  );
};

const GradText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.gradText}>{children}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing.xl, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  bigLogoWrap: { marginBottom: Spacing.xl },
  headline: {
    ...Typography.display,
    fontSize: 40,
    lineHeight: 44,
    color: AppColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  gradText: {
    color: AppColors.primary,
    fontStyle: 'italic',
  },
  sub: {
    ...Typography.body,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  pillText: { ...Typography.label, color: AppColors.textPrimary },
  actions: { gap: Spacing.md },
  signin: { alignItems: 'center', paddingVertical: Spacing.sm },
  signinText: { ...Typography.body, color: AppColors.textSecondary },
  signinLink: { color: AppColors.primary, fontWeight: '600' },
  terms: {
    ...Typography.caption,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  termsLink: { color: AppColors.primary },
});
