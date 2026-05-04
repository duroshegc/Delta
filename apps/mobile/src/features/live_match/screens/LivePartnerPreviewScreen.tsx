import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { LiveMatchStackParamList } from '../../../navigation/types';
import { liveMatchApi } from '../api';

type Props = NativeStackScreenProps<LiveMatchStackParamList, 'LivePartnerPreview'>;

const COUNTDOWN_SECONDS = 10;

export const LivePartnerPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigation.popToTop();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.previewCard}>
        <View style={styles.preview}>
          <Text style={styles.previewInitial}>S</Text>
        </View>
        <Text style={styles.name}>Live match ready</Text>
        <Text style={styles.meta}>{route.params.roomName}</Text>
        <View style={styles.tagRow}>
          <Tag label={route.params.interest ?? 'Shared interests'} />
          <Tag label="Video" />
          <Tag label="Safety tools on" />
        </View>
      </View>

      <View style={styles.countdown}>
        <Text style={styles.countdownLabel}>Connecting in</Text>
        <Text style={styles.countdownValue}>{secondsLeft}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
        >
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Join now"
            loading={joining}
            onPress={async () => {
              setJoining(true);
              try {
                const token = await liveMatchApi.createLiveKitToken(route.params.sessionId);
                Alert.alert(
                  'LiveKit token ready',
                  token.provider === 'development'
                    ? 'Development room is ready. Native video rendering is available in a dev build.'
                    : 'Room token created. Native video rendering is available in a dev build.',
                );
              } catch (err: any) {
                Alert.alert('Could not join live room', err?.response?.data?.message ?? err.message);
              } finally {
                setJoining(false);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  previewCard: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  preview: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: AppColors.live,
    marginBottom: Spacing.lg,
  },
  previewInitial: { ...Typography.display, fontSize: 64, color: AppColors.textSecondary },
  name: { ...Typography.h1, color: AppColors.textPrimary },
  meta: { ...Typography.body, color: AppColors.textSecondary, marginTop: Spacing.xs },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.full,
  },
  tagLabel: { ...Typography.label, color: AppColors.textPrimary },
  countdown: { alignItems: 'center' },
  countdownLabel: { ...Typography.label, color: AppColors.textSecondary, textTransform: 'uppercase' },
  countdownValue: { ...Typography.display, color: AppColors.live, fontSize: 56 },
  actions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  skipBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  skipLabel: { ...Typography.bodyMedium, color: AppColors.textPrimary },
  pressed: { opacity: 0.85 },
});
