import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useDiscoveryStore } from '../store';
import { SwipeCard } from '../components/SwipeCard';
import { SwipeDirection } from '../types';

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
    <View style={styles.container}>
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
          <ActionButton tone="pass" label="✕" onPress={() => trigger('pass')} />
          <ActionButton tone="super" label="★" onPress={() => trigger('super')} />
          <ActionButton tone="like" label="♥" onPress={() => trigger('like')} />
        </View>
      )}
    </View>
  );
};

const ActionButton: React.FC<{ tone: 'pass' | 'super' | 'like'; label: string; onPress: () => void }> = ({
  tone,
  label,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.actionBtn, styles[`tone_${tone}`], pressed && styles.pressed]}
  >
    <Text style={[styles.actionLabel, styles[`label_${tone}`]]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: Spacing.xl },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center' },
  retry: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.full,
  },
  retryLabel: { ...Typography.bodyMedium, color: AppColors.white },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
    paddingTop: Spacing.lg,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  actionLabel: { fontSize: 28 },
  tone_pass: { borderWidth: 1, borderColor: AppColors.danger },
  tone_super: { borderWidth: 1, borderColor: AppColors.live },
  tone_like: { borderWidth: 1, borderColor: AppColors.success },
  label_pass: { color: AppColors.danger },
  label_super: { color: AppColors.live },
  label_like: { color: AppColors.success },
  pressed: { opacity: 0.85 },
});
