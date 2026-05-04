import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Image source={require('../../../../assets/icon.png')} style={styles.logoImage} />
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
    borderRadius: BorderRadius.xl,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  logoImage: { width: 92, height: 92, borderRadius: BorderRadius.lg },
  title: { ...Typography.displayLarge, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMedium, color: AppColors.textSecondary },
  actions: { paddingBottom: Spacing.xl },
});
