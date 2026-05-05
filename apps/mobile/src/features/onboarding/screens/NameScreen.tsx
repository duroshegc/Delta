import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TextField } from '../../../shared/components/TextField';
import { OnboardingShell } from '../../../shared/components/OnboardingShell';
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
    <OnboardingShell
      step={1}
      total={3}
      eyebrow="Your name"
      title="What should we call you?"
      subtitle="This is how you'll appear on Delta."
      ctaTitle="Continue"
      onCta={onNext}
      ctaDisabled={name.trim().length < 2}
    >
      <TextField
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        autoFocus
        autoCapitalize="words"
        iconLeft="◉"
      />
    </OnboardingShell>
  );
};
