import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useAuthStore } from '../../auth/store';
import { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const logout = useAuthStore((s) => s.logout);
  const [pushMatches, setPushMatches] = useState(true);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushLikes, setPushLikes] = useState(false);
  const [showDistance, setShowDistance] = useState(true);

  const onDeleteAccount = () =>
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, matches, and messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Pending backend wiring') },
      ],
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section label="Notifications">
        <ToggleRow label="New matches" value={pushMatches} onValueChange={setPushMatches} />
        <ToggleRow label="Messages" value={pushMessages} onValueChange={setPushMessages} />
        <ToggleRow label="Likes you got" value={pushLikes} onValueChange={setPushLikes} />
      </Section>

      <Section label="Privacy">
        <ToggleRow label="Show distance on profile" value={showDistance} onValueChange={setShowDistance} />
        <NavRow label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
      </Section>

      <Section label="Support">
        <NavRow label="Community guidelines" onPress={() => navigation.navigate('CommunityGuidelines')} />
        <NavRow
          label="Help & support"
          onPress={() => Alert.alert('Help', 'support@delta.app')}
        />
        <NavRow
          label="Privacy policy"
          onPress={() => Alert.alert('Privacy policy', 'Linked to delta.app/privacy')}
        />
        <NavRow
          label="Terms of service"
          onPress={() => Alert.alert('Terms', 'Linked to delta.app/terms')}
        />
      </Section>

      <Section label="Account">
        <Pressable onPress={logout} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={[styles.rowLabel, { color: AppColors.textPrimary }]}>Sign out</Text>
        </Pressable>
        <Pressable onPress={onDeleteAccount} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={[styles.rowLabel, { color: AppColors.danger }]}>Delete account</Text>
        </Pressable>
      </Section>

      <Text style={styles.version}>Delta · v0.1.0 (dev)</Text>
    </ScrollView>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const ToggleRow: React.FC<{ label: string; value: boolean; onValueChange: (v: boolean) => void }> = ({
  label,
  value,
  onValueChange,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: AppColors.primary, false: AppColors.surface3 }}
      thumbColor={AppColors.white}
    />
  </View>
);

const NavRow: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.surface3,
  },
  rowLabel: { ...Typography.body, color: AppColors.textPrimary },
  chevron: { ...Typography.h2, color: AppColors.textMuted },
  version: { ...Typography.caption, color: AppColors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  pressed: { opacity: 0.85 },
});
