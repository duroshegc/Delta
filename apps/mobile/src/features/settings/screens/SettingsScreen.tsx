import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useAuthStore } from '../../auth/store';
import { ProfileStackParamList } from '../../../navigation/types';
import { settingsApi } from '../api';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const logout = useAuthStore((s) => s.logout);
  const [pushMatches, setPushMatches] = useState(true);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushLikes, setPushLikes] = useState(false);
  const [showDistance, setShowDistance] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    settingsApi
      .getPreferences()
      .then((prefs) => {
        setPushMatches(prefs.notifications.matches);
        setPushMessages(prefs.notifications.messages);
        setPushLikes(prefs.notifications.likes);
        setShowDistance(prefs.privacy.showDistance);
      })
      .catch(() => undefined);
  }, []);

  const updateNotifications = async (
    key: 'matches' | 'messages' | 'likes',
    value: boolean,
    setter: (value: boolean) => void,
  ) => {
    setter(value);
    try {
      await settingsApi.updatePreferences({ notifications: { [key]: value } as any });
    } catch (err: any) {
      setter(!value);
      Alert.alert('Could not update setting', err?.response?.data?.message ?? err.message);
    }
  };

  const updateShowDistance = async (value: boolean) => {
    setShowDistance(value);
    try {
      await settingsApi.updatePreferences({ privacy: { showDistance: value } });
    } catch (err: any) {
      setShowDistance(!value);
      Alert.alert('Could not update setting', err?.response?.data?.message ?? err.message);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await settingsApi.deleteAccount(deletePassword);
      await logout();
    } catch (err: any) {
      Alert.alert('Could not delete account', err?.response?.data?.message ?? err.message);
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteAccount = () =>
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, matches, and messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setDeleteOpen(true) },
      ],
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section label="Notifications">
        <ToggleRow
          label="New matches"
          value={pushMatches}
          onValueChange={(value) => updateNotifications('matches', value, setPushMatches)}
        />
        <ToggleRow
          label="Messages"
          value={pushMessages}
          onValueChange={(value) => updateNotifications('messages', value, setPushMessages)}
        />
        <ToggleRow
          label="Likes you got"
          value={pushLikes}
          onValueChange={(value) => updateNotifications('likes', value, setPushLikes)}
        />
      </Section>

      <Section label="Privacy">
        <ToggleRow label="Show distance on profile" value={showDistance} onValueChange={updateShowDistance} />
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

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm deletion</Text>
            <Text style={styles.modalBody}>Enter your password to delete your account.</Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              placeholderTextColor={AppColors.textMuted}
              style={styles.passwordInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDeleteOpen(false)}
                style={({ pressed }) => [styles.cancelDelete, pressed && styles.pressed]}
              >
                <Text style={styles.cancelDeleteLabel}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Delete"
                  onPress={confirmDeleteAccount}
                  loading={deleting}
                  disabled={!deletePassword}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  modalShade: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  modalBody: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.lg },
  passwordInput: {
    ...Typography.body,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface2,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  cancelDelete: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  cancelDeleteLabel: { ...Typography.bodyMedium, color: AppColors.textPrimary },
  pressed: { opacity: 0.85 },
});
