import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { OnboardingShell } from '../../../shared/components/OnboardingShell';
import { SelectChip } from '../../../shared/components/SelectChip';
import { OnboardingStackParamList } from '../../../navigation/types';
import { getApiErrorMessage } from '../../../core/api/errors';
import { useProfileStore } from '../../profile/store';
import { DatingIntent, Gender } from '../../profile/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;

const GENDERS: Array<{ value: Gender; label: string; glyph: string }> = [
  { value: 'female', label: 'Woman', glyph: '♀' },
  { value: 'male', label: 'Man', glyph: '♂' },
  { value: 'nonbinary', label: 'Non-binary', glyph: '◇' },
  { value: 'other', label: 'Other', glyph: '✦' },
];

const INTENTS: Array<{ value: DatingIntent; label: string; glyph: string }> = [
  { value: 'serious', label: 'Long-term', glyph: '♥' },
  { value: 'casual', label: 'Short-term', glyph: '◐' },
  { value: 'friendship', label: 'Friends', glyph: '☻' },
  { value: 'networking', label: 'Networking', glyph: '◈' },
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
      Alert.alert('Could not save profile', getApiErrorMessage(err, 'Profile save failed'));
    }
  };

  const canSubmit = !!gender && interestedIn.length > 0 && !!intent;

  return (
    <OnboardingShell
      step={3}
      total={3}
      eyebrow="About you"
      title="Tell us who you are."
      subtitle="We use this to find better matches."
      ctaTitle="Finish setup"
      ctaIcon="✓"
      onCta={onFinish}
      ctaLoading={saving}
      ctaDisabled={!canSubmit}
      scrollable
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>I am a</Text>
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectChip
              key={g.value}
              label={g.label}
              glyph={g.glyph}
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
              glyph={g.glyph}
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
              glyph={i.glyph}
              selected={intent === i.value}
              onPress={() => setIntent(i.value)}
            />
          ))}
        </View>
      </ScrollView>
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  section: {
    ...Typography.label,
    color: AppColors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
