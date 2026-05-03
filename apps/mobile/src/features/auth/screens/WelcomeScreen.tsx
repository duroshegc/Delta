import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>❤️</Text>
        </View>
        <Text style={styles.title}>Delta</Text>
        <Text style={styles.subtitle}>Dating & Live Discovery</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Get started" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoIcon: { fontSize: 60 },
  title: { ...Typography.displayLarge, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMedium, color: AppColors.textSecondary },
  actions: { paddingBottom: Spacing.xl },
});
