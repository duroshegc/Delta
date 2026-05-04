import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useWalletStore } from '../store';
import { TokenPackage } from '../types';

const formatPrice = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TokenPackagesScreen: React.FC = () => {
  const packages = useWalletStore((s) => s.packages);
  const load = useWalletStore((s) => s.load);

  useEffect(() => {
    if (packages.length === 0) load();
  }, [packages.length, load]);

  const onBuy = (pkg: TokenPackage) => {
    Alert.alert(
      'Confirm purchase',
      `${pkg.delts}${pkg.bonusDelts ? ` + ${pkg.bonusDelts} bonus` : ''} delts for ${formatPrice(pkg.priceUsdCents)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () =>
            Alert.alert(
              'Native checkout pending',
              'iOS StoreKit / Android Billing wiring lands when we have a dev build.',
            ),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Buy delts</Text>
      <Text style={styles.subtitle}>Use delts to super-like, boost, or join live video matches.</Text>
      {packages.map((pkg) => (
        <Pressable
          key={pkg.id}
          onPress={() => onBuy(pkg)}
          style={({ pressed }) => [styles.pkg, pkg.popular && styles.pkgPopular, pressed && styles.pressed]}
        >
          <View style={styles.pkgLeft}>
            <Text style={styles.pkgAmount}>
              {pkg.delts.toLocaleString()} <Text style={styles.pkgUnit}>delts</Text>
            </Text>
            {pkg.bonusDelts > 0 && (
              <Text style={styles.pkgBonus}>+ {pkg.bonusDelts} bonus</Text>
            )}
          </View>
          <View style={styles.pkgRight}>
            {pkg.popular && (
              <View style={styles.popularTag}>
                <Text style={styles.popularLabel}>POPULAR</Text>
              </View>
            )}
            <Text style={styles.pkgPrice}>{formatPrice(pkg.priceUsdCents)}</Text>
          </View>
        </Pressable>
      ))}
      <Text style={styles.footnote}>
        Purchases are non-refundable. Bonus delts are credited instantly.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginBottom: Spacing.xl },
  pkg: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pkgPopular: { borderColor: AppColors.primary, borderWidth: 2 },
  pkgLeft: { flex: 1 },
  pkgAmount: { ...Typography.h2, color: AppColors.textPrimary },
  pkgUnit: { ...Typography.h3, color: AppColors.textSecondary },
  pkgBonus: { ...Typography.label, color: AppColors.success, marginTop: 2 },
  pkgRight: { alignItems: 'flex-end', gap: Spacing.xs },
  popularTag: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  popularLabel: { ...Typography.caption, color: AppColors.white, letterSpacing: 1 },
  pkgPrice: { ...Typography.h3, color: AppColors.textPrimary },
  footnote: {
    ...Typography.caption,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  pressed: { opacity: 0.85 },
});
