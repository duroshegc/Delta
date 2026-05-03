import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { SelectChip } from '../../../shared/components/SelectChip';
import { OnboardingStackParamList } from '../../../navigation/types';
import { useProfileStore } from '../../profile/store';
import { DatingIntent, Gender } from '../../profile/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'female', label: 'Woman' },
  { value: 'male', label: 'Man' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const INTENTS: Array<{ value: DatingIntent; label: string }> = [
  { value: 'long_term', label: 'Long-term' },
  { value: 'short_term', label: 'Short-term' },
  { value: 'friends', label: 'Friends' },
  { value: 'undecided', label: 'Not sure yet' },
];

export const IdentityScreen: React.FC<Props> = () => {
  const setDraft = useProfileStore((s) => s.setDraft);
  const save = useProfileStore((s) => s.save);
  const saving = useProfileStore((s) => s.saving);
  const draft = useProfileStore((s) => s.draft);
  const profile = useProfileStore((s) => s.profile);

  const [gender, setGender] = useState<Gender | null>(draft.gender ?? profile?.gender ?? null);
  const [interestedIn, setInterestedIn] = useState<Gender[]>(
    draft.interestedIn ?? profile?.interestedIn ?? [],
  );
  const [intent, setIntent] = useState<DatingIntent | null>(
    draft.intent ?? profile?.intent ?? null,
  );

  const toggleInterest = (g: Gender) =>
    setInterestedIn((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const onFinish = async () => {
    if (!gender || interestedIn.length === 0 || !intent) return;
    setDraft({ gender, interestedIn, intent });
    try {
      await save();
    } catch (err: any) {
      Alert.alert('Could not save profile', err?.response?.data?.message ?? err.message);
    }
  };

  const canSubmit = !!gender && interestedIn.length > 0 && !!intent;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tell us about you</Text>

        <Text style={styles.section}>I am a</Text>
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectChip
              key={g.value}
              label={g.label}
              selected={gender === g.value}
              onPress={() => setGender(g.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>Interested in</Text>
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectChip
              key={g.value}
              label={g.label}
              selected={interestedIn.includes(g.value)}
              onPress={() => toggleInterest(g.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>Looking for</Text>
        <View style={styles.row}>
          {INTENTS.map((i) => (
            <SelectChip
              key={i.value}
              label={i.label}
              selected={intent === i.value}
              onPress={() => setIntent(i.value)}
            />
          ))}
        </View>
      </ScrollView>
      <PrimaryButton title="Finish" onPress={onFinish} loading={saving} disabled={!canSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl },
  scroll: { paddingBottom: Spacing.xl },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.xl },
  section: {
    ...Typography.label,
    color: AppColors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
