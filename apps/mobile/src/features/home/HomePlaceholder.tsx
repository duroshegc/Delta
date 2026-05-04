import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors, Spacing, Typography } from '../../core/theme';
import { PrimaryButton } from '../../shared/components/PrimaryButton';
import { useAuthStore } from '../auth/store';

export const HomePlaceholder: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're in.</Text>
      <Text style={styles.body}>
        {user?.email ?? user?.id ?? 'Authenticated user'}
      </Text>
      <PrimaryButton title="Sign out" onPress={logout} style={{ marginTop: Spacing.xl }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.display, color: AppColors.textPrimary, marginBottom: Spacing.md },
  body: { ...Typography.body, color: AppColors.textSecondary },
});
