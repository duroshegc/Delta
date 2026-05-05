import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, BorderRadius, Shadows, Spacing, Typography } from '../../../core/theme';
import { useDiscoveryStore } from '../store';
import { SwipeCard } from '../components/SwipeCard';
import { SwipeDirection } from '../types';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { DeltaLogo } from '../../../shared/components/DeltaLogo';

export const DiscoveryScreen: React.FC = () => {
  const cards = useDiscoveryStore((s) => s.cards);
  const loading = useDiscoveryStore((s) => s.loading);
  const error = useDiscoveryStore((s) => s.error);
  const lastMatch = useDiscoveryStore((s) => s.lastMatch);
  const dismissMatch = useDiscoveryStore((s) => s.dismissMatch);
  const load = useDiscoveryStore((s) => s.load);
  const swipe = useDiscoveryStore((s) => s.swipe);

  const [externalAction, setExternalAction] = useState<SwipeDirection | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!lastMatch) return;
    Alert.alert("It's a match!", `You and ${lastMatch.displayName} liked each other.`, [
      { text: 'Keep swiping', onPress: dismissMatch },
    ]);
  }, [lastMatch, dismissMatch]);

  const handleSwipe = (direction: SwipeDirection) => {
    swipe(direction).catch((err: any) => {
      Alert.alert('Could not record swipe', err?.response?.data?.message ?? err.message);
    });
  };

  const trigger = (direction: SwipeDirection) => setExternalAction(direction);

  const visibleCards = cards.slice(0, 2).reverse();

  return (
    <ScreenBackdrop tone="mixed">
      <View style={styles.header}>
        <DeltaLogo size={28} />
        <View style={styles.headerIcons}>
          <HeaderIcon glyph="✦" />
          <HeaderIcon glyph="≡" />
        </View>
      </View>

      <View style={styles.cardArea}>
        {loading && cards.length === 0 ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : error && cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Couldn't load feed</Text>
            <Text style={styles.emptyBody}>{error}</Text>
            <Pressable onPress={load} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>Check back soon for new people.</Text>
          </View>
        ) : (
          visibleCards.map((card, idx) => {
            const isTop = idx === visibleCards.length - 1;
            return (
              <SwipeCard
                key={card.userId}
                card={card}
                isTop={isTop}
                onSwipe={handleSwipe}
                externalAction={isTop ? externalAction : null}
                onExternalActionConsumed={() => setExternalAction(null)}
              />
            );
          })
        )}
      </View>

      {cards.length > 0 && (
        <View style={styles.actions}>
          <ActionButton tone="pass" glyph="✕" onPress={() => trigger('pass')} />
          <ActionButton tone="super" glyph="★" big onPress={() => trigger('super')} />
          <ActionButton tone="like" glyph="♥" onPress={() => trigger('like')} />
        </View>
      )}
    </ScreenBackdrop>
  );
};

const HeaderIcon: React.FC<{ glyph: string }> = ({ glyph }) => (
  <View style={styles.iconBtn}>
    <Text style={styles.iconBtnGlyph}>{glyph}</Text>
  </View>
);

type Tone = 'pass' | 'super' | 'like';

const ActionButton: React.FC<{ tone: Tone; glyph: string; big?: boolean; onPress: () => void }> = ({
  tone,
  glyph,
  big,
  onPress,
}) => {
  const size = big ? 72 : 60;
  const colors: Record<Tone, { ring: string; glyph: string; shadow: any }> = {
    pass: { ring: AppColors.danger, glyph: AppColors.danger, shadow: Shadows.soft },
    super: { ring: AppColors.live, glyph: AppColors.live, shadow: Shadows.glowLive },
    like: { ring: AppColors.primary, glyph: AppColors.primary, shadow: Shadows.glowPink },
  };
  const { ring, glyph: gColor, shadow } = colors[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: AppColors.surface,
          borderWidth: 2,
          borderColor: ring,
        },
        shadow,
        pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
      ]}
    >
      <Text style={{ fontSize: big ? 32 : 26, color: gColor, fontWeight: '600' }}>{glyph}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerIcons: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  iconBtnGlyph: { fontSize: 16, color: AppColors.textPrimary },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center' },
  retry: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.full,
    ...Shadows.glowPink,
  },
  retryLabel: { ...Typography.bodyMedium, color: AppColors.white, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  pressed: { opacity: 0.85 },
});
