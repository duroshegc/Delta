import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { SelectChip } from '../../../shared/components/SelectChip';
import { LiveMatchStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<LiveMatchStackParamList, 'LiveEntry'>;

const INTERESTS = ['Music', 'Travel', 'Food', 'Hiking', 'Art', 'Gaming', 'Books', 'Fitness'];
const COST_PER_MINUTE = 5;

export const LiveEntryScreen: React.FC<Props> = ({ navigation }) => {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (i: string) =>
    setPicked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Live match</Text>
      <Text style={styles.title}>Meet someone in real-time</Text>
      <Text style={styles.subtitle}>
        We'll pair you with a verified profile for a short video call. Pick interests to bias matching.
      </Text>

      <View style={styles.costCard}>
        <Text style={styles.costLabel}>Cost</Text>
        <Text style={styles.costValue}>{COST_PER_MINUTE} delts / minute</Text>
        <Text style={styles.costNote}>Minimum 1 minute charged. End any time.</Text>
      </View>

      <Text style={styles.section}>Interests</Text>
      <View style={styles.chipRow}>
        {INTERESTS.map((i) => (
          <SelectChip key={i} label={i} selected={picked.includes(i)} onPress={() => toggle(i)} />
        ))}
      </View>

      <View style={styles.guidelines}>
        <Text style={styles.guideTitle}>Before you join</Text>
        <Bullet>Be respectful. Calls are randomly recorded for safety review.</Bullet>
        <Bullet>You can report or end the call at any time.</Bullet>
        <Bullet>Matches you connect with stay in your matches list.</Bullet>
      </View>

      <PrimaryButton
        title="Find a match"
        onPress={() => navigation.navigate('LiveSearching', { interests: picked.length ? picked : ['Music'] })}
      />
    </ScrollView>
  );
};

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  eyebrow: { ...Typography.label, color: AppColors.live, textTransform: 'uppercase' },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginTop: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  costCard: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.live,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  costLabel: { ...Typography.label, color: AppColors.textSecondary, textTransform: 'uppercase' },
  costValue: { ...Typography.h2, color: AppColors.textPrimary, marginTop: 2 },
  costNote: { ...Typography.caption, color: AppColors.textMuted, marginTop: 4 },
  section: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  guidelines: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  guideTitle: { ...Typography.h3, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 },
  bulletDot: { ...Typography.body, color: AppColors.textMuted, width: 16 },
  bulletText: { ...Typography.body, color: AppColors.textSecondary, flex: 1 },
});
