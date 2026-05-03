import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { MatchesStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'ReportUser'>;

const REASONS = [
  'Inappropriate photos',
  'Harassment or hateful language',
  'Spam or scam',
  'Underage user',
  'Off-platform contact request',
  'Threats or violence',
  'Other',
];

export const ReportUserScreen: React.FC<Props> = ({ navigation }) => {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const onSubmit = () => {
    if (!reason) return;
    Alert.alert(
      'Report submitted',
      'Our safety team will review within 24 hours. You can also block this user.',
      [
        {
          text: 'Block & exit',
          style: 'destructive',
          onPress: () => navigation.popToTop(),
        },
        { text: 'Done', onPress: () => navigation.popToTop() },
      ],
    );
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
            key={r}
            onPress={() => setReason(r)}
            style={({ pressed }) => [
              styles.reason,
              reason === r && styles.reasonSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.reasonLabel, reason === r && styles.reasonLabelSelected]}>{r}</Text>
            {reason === r && <Text style={styles.checkmark}>✓</Text>}
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

      <PrimaryButton title="Submit report" onPress={onSubmit} disabled={!reason} />
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
