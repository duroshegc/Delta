import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppColors, Typography, Spacing } from './src/core/theme';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Delta Logo Placeholder */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>❤️</Text>
        </View>
      </View>

      {/* App Title */}
      <Text style={styles.title}>Delta</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>Dating & Live Discovery</Text>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>

      {/* Version Info */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 60,
  },
  title: {
    ...Typography.displayLarge,
    color: AppColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: AppColors.secondary,
    marginBottom: Spacing['3xl'],
  },
  loadingContainer: {
    marginTop: Spacing.xl,
  },
  version: {
    ...Typography.labelSmall,
    color: AppColors.textSecondary,
    position: 'absolute',
    bottom: Spacing.xl,
  },
});

// Made with Bob
