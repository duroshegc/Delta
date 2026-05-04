import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useWalletStore } from '../store';
import { WalletStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletHome'>;

export const WalletHomeScreen: React.FC<Props> = ({ navigation }) => {
  const balance = useWalletStore((s) => s.balance);
  const loading = useWalletStore((s) => s.loading);
  const load = useWalletStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !balance) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>{balance?.balance ?? 0}</Text>
          <Text style={styles.balanceUnit}>delts</Text>
        </View>
        {balance?.bonus ? (
          <Text style={styles.balanceBonus}>+ {balance.bonus} bonus</Text>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate('TokenPackages')}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>Top up</Text>
        </Pressable>
      </View>

      <ActionTile
        title="Buy delts"
        subtitle="Token packages from $4.99"
        onPress={() => navigation.navigate('TokenPackages')}
      />
      <ActionTile
        title="Transaction history"
        subtitle="See where your delts went"
        onPress={() => navigation.navigate('TransactionHistory')}
      />

      <View style={styles.usesCard}>
        <Text style={styles.sectionLabel}>What delts unlock</Text>
        <UseRow icon="★" label="Super like" cost="10 delts" />
        <UseRow icon="⚡" label="Profile boost (30 min)" cost="50 delts" />
        <UseRow icon="●" label="Live video match" cost="5 delts/min" />
        <UseRow icon="✦" label="Priority matching" cost="100 delts" />
      </View>
    </ScrollView>
  );
};

const ActionTile: React.FC<{ title: string; subtitle: string; onPress: () => void }> = ({
  title,
  subtitle,
  onPress,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.tileChevron}>›</Text>
  </Pressable>
);

const UseRow: React.FC<{ icon: string; label: string; cost: string }> = ({ icon, label, cost }) => (
  <View style={styles.useRow}>
    <Text style={styles.useIcon}>{icon}</Text>
    <Text style={styles.useLabel}>{label}</Text>
    <Text style={styles.useCost}>{cost}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  center: { alignItems: 'center', justifyContent: 'center' },
  balanceCard: {
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  balanceLabel: { ...Typography.label, color: AppColors.white, opacity: 0.85, textTransform: 'uppercase' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm, gap: Spacing.sm },
  balanceAmount: { ...Typography.display, color: AppColors.white, fontSize: 48 },
  balanceUnit: { ...Typography.h2, color: AppColors.white, opacity: 0.85 },
  balanceBonus: { ...Typography.label, color: AppColors.white, opacity: 0.85, marginTop: 4 },
  cta: {
    marginTop: Spacing.lg,
    backgroundColor: AppColors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  ctaLabel: { ...Typography.bodyMedium, color: AppColors.primary },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tileTitle: { ...Typography.h3, color: AppColors.textPrimary },
  tileSubtitle: { ...Typography.body, color: AppColors.textSecondary, marginTop: 2 },
  tileChevron: { ...Typography.h2, color: AppColors.textMuted },
  usesCard: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.surface3,
  },
  useIcon: { ...Typography.h2, color: AppColors.primary, width: 32, textAlign: 'center' },
  useLabel: { ...Typography.body, color: AppColors.textPrimary, flex: 1, marginLeft: Spacing.sm },
  useCost: { ...Typography.label, color: AppColors.textSecondary },
  pressed: { opacity: 0.85 },
});
