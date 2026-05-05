import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Gradients, Shadows, Spacing, Typography } from '../../../core/theme';
import { useWalletStore } from '../store';
import { WalletStackParamList } from '../../../navigation/types';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { GradientCard } from '../../../shared/components/GradientCard';
import { IconBadge } from '../../../shared/components/IconBadge';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';

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
      <ScreenBackdrop tone="delt">
        <View style={[styles.center]}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop tone="delt">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GradientCard
          colors={Gradients.delt}
          glow
          glowColor={AppColors.delt}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHead}>
            <View>
              <Text style={styles.balanceLabel}>delt balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{balance?.balance ?? 0}</Text>
                <Text style={styles.balanceUnit}>delts</Text>
              </View>
              {balance?.bonus ? (
                <Text style={styles.balanceBonus}>+ {balance.bonus} bonus</Text>
              ) : null}
            </View>
            <View style={styles.coin}>
              <Text style={styles.coinGlyph}>◈</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('TokenPackages')}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <Text style={styles.ctaLabel}>Top up delts</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>
        </GradientCard>

        <SectionHeader title="Quick actions" />
        <ActionTile
          glyph="◆"
          tone="delt"
          title="Buy delts"
          subtitle="Token packages from $4.99"
          onPress={() => navigation.navigate('TokenPackages')}
        />
        <ActionTile
          glyph="↻"
          tone="brand"
          title="Transaction history"
          subtitle="See where your delts went"
          onPress={() => navigation.navigate('TransactionHistory')}
        />

        <SectionHeader title="What delts unlock" hint="Spend them on what matters" style={{ marginTop: Spacing.xl }} />
        <View style={styles.usesCard}>
          <UseRow tone="brand" glyph="★" label="Super like" cost="10 delts" />
          <UseRow tone="delt" glyph="⚡" label="Profile boost (30 min)" cost="50 delts" />
          <UseRow tone="live" glyph="●" label="Live video match" cost="5/min" />
          <UseRow tone="brand" glyph="✦" label="Priority matching" cost="100 delts" />
        </View>

        <PrimaryButton
          title="Get more delts"
          tone="delt"
          iconLeft="✦"
          onPress={() => navigation.navigate('TokenPackages')}
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </ScreenBackdrop>
  );
};

const ActionTile: React.FC<{
  glyph: string;
  tone: 'brand' | 'live' | 'delt';
  title: string;
  subtitle: string;
  onPress: () => void;
}> = ({ glyph, tone, title, subtitle, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, Shadows.soft, pressed && styles.pressed]}>
    <IconBadge glyph={glyph} tone={tone} size="md" />
    <View style={styles.tileBody}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.tileChevron}>›</Text>
  </Pressable>
);

const UseRow: React.FC<{
  tone: 'brand' | 'live' | 'delt';
  glyph: string;
  label: string;
  cost: string;
}> = ({ tone, glyph, label, cost }) => (
  <View style={styles.useRow}>
    <IconBadge glyph={glyph} tone={tone} size="sm" />
    <Text style={styles.useLabel}>{label}</Text>
    <View style={styles.costPill}>
      <Text style={styles.costText}>{cost}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { padding: Spacing.xl, marginBottom: Spacing.xl },
  balanceHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm, gap: Spacing.sm },
  balanceAmount: { ...Typography.display, color: AppColors.white, fontSize: 52, lineHeight: 56 },
  balanceUnit: { ...Typography.h2, color: 'rgba(255,255,255,0.85)' },
  balanceBonus: { ...Typography.label, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  coin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  coinGlyph: { color: AppColors.white, fontSize: 28 },
  cta: {
    marginTop: Spacing.xl,
    backgroundColor: AppColors.white,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLabel: { ...Typography.bodyMedium, color: AppColors.delt, fontWeight: '700' },
  ctaArrow: { color: AppColors.delt, fontSize: 18, fontWeight: '700' },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  tileBody: { flex: 1 },
  tileTitle: { ...Typography.h3, color: AppColors.textPrimary },
  tileSubtitle: { ...Typography.body, color: AppColors.textSecondary, marginTop: 2 },
  tileChevron: { ...Typography.h2, color: AppColors.textMuted },
  usesCard: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md - 2,
    gap: Spacing.md,
  },
  useLabel: { ...Typography.body, color: AppColors.textPrimary, flex: 1 },
  costPill: {
    backgroundColor: AppColors.deltGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  costText: { ...Typography.label, color: AppColors.deltDim, fontWeight: '700' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
