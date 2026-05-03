import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useProfileStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { ProfileStackParamList } from '../../../navigation/types';
import { ageFromBirthDate, genderLabels, intentLabels } from '../utils';
import { PhotoGrid } from '../components/PhotoGrid';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileView'>;

export const ProfileViewScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const load = useProfileStore((s) => s.load);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!profile) load().catch(() => undefined);
  }, [profile, load]);

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Couldn't load profile.</Text>
      </View>
    );
  }

  const age = ageFromBirthDate(profile.birthDate);
  const cover = profile.photos?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.cover}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>Add a photo</Text>
          </View>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.name}>
          {profile.displayName}
          {age !== null ? <Text style={styles.age}>, {age}</Text> : null}
        </Text>
        {profile.location?.city && <Text style={styles.muted}>{profile.location.city}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <PhotoGrid />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <Text style={styles.body}>{profile.bio || 'Add a short bio so people get a feel for you.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Identity</Text>
        <View style={styles.metaRow}>
          {profile.gender && <Pill label={genderLabels[profile.gender] ?? profile.gender} />}
          {profile.intent && <Pill label={intentLabels[profile.intent] ?? profile.intent} />}
          {profile.verified && <Pill label="Verified" tone="accent" />}
        </View>
      </View>

      {profile.interests?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Interests</Text>
          <View style={styles.metaRow}>
            {profile.interests.map((i) => (
              <Pill key={i} label={i} />
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => navigation.navigate('ProfileEdit')}
        style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
      >
        <Text style={styles.editBtnLabel}>Edit profile</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Settings')}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
      >
        <Text style={styles.logoutLabel}>Settings</Text>
      </Pressable>

      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
      >
        <Text style={styles.logoutLabel}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
};

const Pill: React.FC<{ label: string; tone?: 'default' | 'accent' }> = ({ label, tone = 'default' }) => (
  <View style={[styles.pill, tone === 'accent' && styles.pillAccent]}>
    <Text style={[styles.pillLabel, tone === 'accent' && styles.pillLabelAccent]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingBottom: Spacing['2xl'] },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: AppColors.textSecondary },
  cover: { padding: Spacing.xl, paddingBottom: 0 },
  coverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    backgroundColor: AppColors.surface2,
  },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { ...Typography.label, color: AppColors.textMuted },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md },
  name: { ...Typography.display, color: AppColors.textPrimary },
  age: { ...Typography.display, color: AppColors.textSecondary },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionLabel: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  body: { ...Typography.body, color: AppColors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.surface2,
  },
  pillAccent: { backgroundColor: AppColors.primary },
  pillLabel: { ...Typography.label, color: AppColors.textPrimary },
  pillLabelAccent: { color: AppColors.white },
  editBtn: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },
  editBtnLabel: { ...Typography.bodyMedium, color: AppColors.white },
  logoutBtn: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  logoutLabel: { ...Typography.label, color: AppColors.textSecondary },
  pressed: { opacity: 0.85 },
});
