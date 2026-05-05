import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Shadows, Spacing, Typography } from '../../../core/theme';
import { TextField } from '../../../shared/components/TextField';
import { OnboardingShell } from '../../../shared/components/OnboardingShell';
import { OnboardingStackParamList } from '../../../navigation/types';
import { useProfileStore } from '../../profile/store';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBirthDate'>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const formatBirthDateInput = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const ageInYears = (iso: string): number | null => {
  if (!ISO_DATE.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  const dob = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dob.getTime())) return null;
  if (
    dob.getUTCFullYear() !== year ||
    dob.getUTCMonth() !== month - 1 ||
    dob.getUTCDate() !== day
  ) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
};

export const BirthDateScreen: React.FC<Props> = ({ navigation }) => {
  const setDraft = useProfileStore((s) => s.setDraft);
  const initial = useProfileStore((s) => s.draft.birthDate ?? s.profile?.birthDate ?? '');
  const [value, setValue] = useState(initial);

  const age = useMemo(() => ageInYears(value), [value]);
  const error =
    value.length > 0 && value.length < 10
      ? 'Use YYYY-MM-DD'
      : value.length === 10 && age === null
        ? 'Enter a real date'
        : age !== null && age < 18
          ? 'You must be 18+'
          : age !== null && age > 100
            ? 'Enter an age under 100'
            : null;

  const onNext = () => {
    if (age === null || age < 18 || age > 100) return;
    setDraft({ birthDate: value });
    navigation.navigate('OnboardingIdentity');
  };

  return (
    <OnboardingShell
      step={2}
      total={3}
      eyebrow="Your birthday"
      title="When were you born?"
      subtitle="You must be 18 or older to use Delta."
      ctaTitle="Continue"
      onCta={onNext}
      ctaDisabled={age === null || age < 18 || age > 100}
    >
      <TextField
        value={value}
        onChangeText={(text) => setValue(formatBirthDateInput(text))}
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        autoFocus
        maxLength={10}
        error={error || undefined}
        iconLeft="❉"
      />
      {age !== null && age >= 18 && age <= 100 && (
        <View style={[styles.ageCard, Shadows.soft]}>
          <Text style={styles.ageLabel}>Age</Text>
          <Text style={styles.ageValue}>{age}</Text>
        </View>
      )}
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  ageCard: {
    marginTop: Spacing.md,
    backgroundColor: AppColors.primaryGlow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  ageLabel: { ...Typography.label, color: AppColors.primary, textTransform: 'uppercase', letterSpacing: 1.4 },
  ageValue: { ...Typography.display, color: AppColors.primary, fontSize: 36, lineHeight: 40 },
});
