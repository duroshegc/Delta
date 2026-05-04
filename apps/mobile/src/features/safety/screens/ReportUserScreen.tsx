import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { MatchesStackParamList } from '../../../navigation/types';
import { ReportCategory, safetyApi } from '../api';

type Props = NativeStackScreenProps<MatchesStackParamList, 'ReportUser'>;

const REASONS: Array<{ label: string; category: ReportCategory }> = [
  { label: 'Inappropriate photos', category: 'inappropriate_content' },
  { label: 'Harassment or hateful language', category: 'harassment' },
  { label: 'Spam or scam', category: 'scam' },
  { label: 'Underage user', category: 'underage' },
  { label: 'Fake profile', category: 'fake_profile' },
  { label: 'Other', category: 'other' },
];

export const ReportUserScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, matchId } = route.params;
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await safetyApi.submitReport({
        reportedUserId: userId,
        category: reason.category,
        description: details.trim() || reason.label,
        conversationId: matchId,
      });
      Alert.alert(
        'Report submitted',
        'Our safety team will review within 24 hours. You can also block this user.',
        [
          {
            text: 'Block & exit',
            style: 'destructive',
            onPress: async () => {
              try {
                await safetyApi.blockUser(userId, reason.label);
              } finally {
                navigation.popToTop();
              }
            },
          },
          { text: 'Done', onPress: () => navigation.popToTop() },
        ],
      );
    } catch (err: any) {
      Alert.alert('Could not submit report', err?.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report user</Text>
      <Text style={styles.subtitle}>
        Reports are confidential. We'll review and may remove the account if our guidelines are violated.
      </Text>

      <Text style={styles.section}>Reason</Text>
      <View style={styles.reasonList}>
        {REASONS.map((r) => (
          <Pressable
            key={r.category}
            onPress={() => setReason(r)}
            style={({ pressed }) => [
              styles.reason,
              reason?.category === r.category && styles.reasonSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.reasonLabel, reason?.category === r.category && styles.reasonLabelSelected]}>
              {r.label}
            </Text>
            {reason?.category === r.category && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Details (optional)</Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={5}
        placeholder="Add anything that helps us investigate."
        placeholderTextColor={AppColors.textMuted}
        style={styles.detailsInput}
      />

      <PrimaryButton title="Submit report" onPress={onSubmit} loading={submitting} disabled={!reason} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  section: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  reasonList: { marginBottom: Spacing.xl },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reasonSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryGlow },
  reasonLabel: { ...Typography.body, color: AppColors.textPrimary },
  reasonLabelSelected: { color: AppColors.primary },
  checkmark: { ...Typography.h3, color: AppColors.primary },
  detailsInput: {
    ...Typography.body,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.xl,
  },
  pressed: { opacity: 0.85 },
});
