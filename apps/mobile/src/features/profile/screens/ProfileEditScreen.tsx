import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { TextField } from '../../../shared/components/TextField';
import { SelectChip } from '../../../shared/components/SelectChip';
import { getApiErrorMessage } from '../../../core/api/errors';
import { useProfileStore } from '../store';
import { ProfileStackParamList } from '../../../navigation/types';
import { DatingIntent, Gender } from '../types';
import { genderLabels, intentLabels } from '../utils';
import { PhotoGrid } from '../components/PhotoGrid';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

const GENDERS: Gender[] = ['female', 'male', 'nonbinary', 'other'];
const INTENTS: DatingIntent[] = ['serious', 'casual', 'friendship', 'networking'];

const splitInterests = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useProfileStore((s) => s.profile);
  const setDraft = useProfileStore((s) => s.setDraft);
  const save = useProfileStore((s) => s.save);
  const saving = useProfileStore((s) => s.saving);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [interestsRaw, setInterestsRaw] = useState((profile?.interests ?? []).join(', '));
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [interestedIn, setInterestedIn] = useState<Gender[]>(profile?.interestedIn ?? []);
  const [intent, setIntent] = useState<DatingIntent | null>(profile?.intent ?? null);

  const toggleInterestedIn = (g: Gender) =>
    setInterestedIn((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const onSave = async () => {
    setDraft({
      displayName: displayName.trim(),
      bio: bio.trim(),
      interests: splitInterests(interestsRaw),
      gender,
      interestedIn,
      intent,
    });
    try {
      await save();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save', getApiErrorMessage(err, 'Profile save failed'));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit profile</Text>

        <Text style={styles.section}>Photos</Text>
        <PhotoGrid />

        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
        />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="A few words about you…"
          multiline
          numberOfLines={4}
          style={styles.bioInput}
        />
        <TextField
          label="Interests (comma-separated)"
          value={interestsRaw}
          onChangeText={setInterestsRaw}
          placeholder="Hiking, jazz, coffee"
        />

        <Text style={styles.section}>I am a</Text>
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectChip
              key={g}
              label={genderLabels[g]}
              selected={gender === g}
              onPress={() => setGender(g)}
            />
          ))}
        </View>

        <Text style={styles.section}>Interested in</Text>
        <View style={styles.row}>
          {GENDERS.map((g) => (
            <SelectChip
              key={g}
              label={genderLabels[g]}
              selected={interestedIn.includes(g)}
              onPress={() => toggleInterestedIn(g)}
            />
          ))}
        </View>

        <Text style={styles.section}>Looking for</Text>
        <View style={styles.row}>
          {INTENTS.map((i) => (
            <SelectChip
              key={i}
              label={intentLabels[i]}
              selected={intent === i}
              onPress={() => setIntent(i)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title="Save" onPress={onSave} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xl },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.lg },
  bioInput: { minHeight: 110, textAlignVertical: 'top' },
  section: {
    ...Typography.label,
    color: AppColors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: AppColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.surface3,
  },
});
