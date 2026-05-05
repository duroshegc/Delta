import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Shadows, Spacing, Typography, pickProfileGradient } from '../../../core/theme';
import { useProfileStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { ProfileStackParamList } from '../../../navigation/types';
import { ageFromBirthDate, genderLabels, intentLabels } from '../utils';
import { PhotoGrid } from '../components/PhotoGrid';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { SectionHeader } from '../../../shared/components/SectionHeader';

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
      <ScreenBackdrop tone="mixed">
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      </ScreenBackdrop>
    );
  }

  if (!profile) {
    return (
      <ScreenBackdrop tone="mixed">
        <View style={styles.center}>
          <Text style={styles.muted}>Couldn't load profile.</Text>
        </View>
      </ScreenBackdrop>
    );
  }

  const age = ageFromBirthDate(profile.birthDate);
  const cover = profile.photos?.[0];
  const grad = pickProfileGradient(profile.displayName ?? 'Delta');

  return (
    <ScreenBackdrop tone="mixed">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          <View style={[styles.coverFrame, Shadows.medium]}>
            {cover ? (
              <Image source={{ uri: cover.url }} style={styles.coverImage} />
            ) : (
              <LinearGradient
                colors={grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverImage}
              >
                <Text style={styles.coverInitial}>{(profile.displayName ?? '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(28,15,20,0.78)'] as const}
              style={styles.coverOverlay}
            />
            <View style={styles.coverHeader}>
              <View style={styles.coverNameRow}>
                <Text style={styles.coverName}>
                  {profile.displayName}
                  {age !== null ? <Text style={styles.coverAge}>, {age}</Text> : null}
                </Text>
                {profile.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedGlyph}>✓</Text>
                  </View>
                )}
              </View>
              {profile.location?.city && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationGlyph}>◉</Text>
                  <Text style={styles.locationText}>{profile.location.city}</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={({ pressed }) => [styles.gearBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.gearGlyph}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Photos"
            actionLabel="Manage"
            onAction={() => navigation.navigate('ProfileEdit')}
          />
          <PhotoGrid />
        </View>

        <View style={styles.section}>
          <SectionHeader title="About" />
          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.body}>
              {profile.bio || 'Add a short bio so people get a feel for you.'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Identity" />
          <View style={styles.metaRow}>
            {profile.gender && <Pill label={genderLabels[profile.gender] ?? profile.gender} />}
            {profile.intent && <Pill label={intentLabels[profile.intent] ?? profile.intent} tone="brand" />}
            {profile.verified && <Pill label="Verified" tone="live" />}
          </View>
        </View>

        {profile.interests?.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Interests" />
            <View style={styles.metaRow}>
              {profile.interests.map((i) => (
                <Pill key={i} label={i} />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.section, { marginTop: Spacing.lg }]}>
          <PrimaryButton title="Edit profile" onPress={() => navigation.navigate('ProfileEdit')} />
          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.signOutLabel}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
};

type PillTone = 'default' | 'brand' | 'live';
const pillBg: Record<PillTone, string> = {
  default: AppColors.surface,
  brand: AppColors.primaryGlow,
  live: AppColors.liveGlow,
};
const pillFg: Record<PillTone, string> = {
  default: AppColors.textPrimary,
  brand: AppColors.primary,
  live: AppColors.liveDim,
};

const Pill: React.FC<{ label: string; tone?: PillTone }> = ({ label, tone = 'default' }) => (
  <View style={[styles.pill, { backgroundColor: pillBg[tone] }]}>
    <Text style={[styles.pillLabel, { color: pillFg[tone] }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: AppColors.textSecondary },
  cover: { padding: Spacing.xl, paddingBottom: 0 },
  coverFrame: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    aspectRatio: 0.95,
  },
  coverImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  coverInitial: { fontSize: 120, color: 'rgba(255,255,255,0.6)', fontWeight: '800' },
  coverOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  coverHeader: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: Spacing.lg },
  coverNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  coverName: { ...Typography.display, color: AppColors.white, fontSize: 32 },
  coverAge: { ...Typography.display, color: 'rgba(255,255,255,0.85)', fontSize: 32 },
  verifiedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.live,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowLive,
  },
  verifiedGlyph: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationGlyph: { color: 'rgba(255,255,255,0.85)' },
  locationText: { ...Typography.body, color: 'rgba(255,255,255,0.92)' },
  gearBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gearGlyph: { color: AppColors.white, fontSize: 18 },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  body: { ...Typography.body, color: AppColors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  pillLabel: { ...Typography.label, fontWeight: '600' },
  signOut: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.md },
  signOutLabel: { ...Typography.label, color: AppColors.textSecondary },
});
