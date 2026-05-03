import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { TextField } from '../../../shared/components/TextField';
import { OnboardingStackParamList } from '../../../navigation/types';
import { useProfileStore } from '../../profile/store';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingName'>;

export const NameScreen: React.FC<Props> = ({ navigation }) => {
  const setDraft = useProfileStore((s) => s.setDraft);
  const initial = useProfileStore((s) => s.draft.displayName ?? s.profile?.displayName ?? '');
  const [name, setName] = useState(initial);

  const onNext = () => {
    setDraft({ displayName: name.trim() });
    navigation.navigate('OnboardingBirthDate');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.body}>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>This is how you'll appear on Delta.</Text>
        <TextField value={name} onChangeText={setName} placeholder="Your name" autoFocus autoCapitalize="words" />
      </View>
      <PrimaryButton title="Continue" onPress={onNext} disabled={name.trim().length < 2} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center' },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
});
