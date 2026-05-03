import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';

const RULES = [
  {
    title: 'Be real',
    body: 'Use your own photos. No catfishing, impersonation, or stolen images.',
  },
  {
    title: 'Be respectful',
    body: 'No harassment, hate speech, threats, or unwanted explicit content.',
  },
  {
    title: 'Be safe',
    body: 'Never share financial info or send money. Meet in public for first dates.',
  },
  {
    title: 'No solicitation',
    body: 'Delta is for dating, not promoting other services or selling products.',
  },
  {
    title: '18 and over only',
    body: 'Underage profiles are removed and reported.',
  },
];

export const CommunityGuidelinesScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Community guidelines</Text>
    <Text style={styles.subtitle}>
      Delta works because people show up authentically and treat each other well. Here's what we expect.
    </Text>
    {RULES.map((r) => (
      <View key={r.title} style={styles.rule}>
        <Text style={styles.ruleTitle}>{r.title}</Text>
        <Text style={styles.ruleBody}>{r.body}</Text>
      </View>
    ))}
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>See something off?</Text>
      <Text style={styles.calloutBody}>
        Report from any profile, chat, or live call. Reports stay confidential and our safety team reviews
        within 24 hours.
      </Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  rule: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  ruleTitle: { ...Typography.h3, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  ruleBody: { ...Typography.body, color: AppColors.textSecondary },
  callout: {
    backgroundColor: AppColors.primaryGlow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  calloutTitle: { ...Typography.h3, color: AppColors.primary, marginBottom: Spacing.xs },
  calloutBody: { ...Typography.body, color: AppColors.textPrimary },
});
