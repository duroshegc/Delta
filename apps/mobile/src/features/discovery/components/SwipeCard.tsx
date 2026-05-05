import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AppColors,
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
  pickProfileGradient,
} from '../../../core/theme';
import { DiscoveryCard, SwipeDirection } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const EXIT_X = SCREEN_W * 1.4;

interface Props {
  card: DiscoveryCard;
  isTop: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  externalAction?: SwipeDirection | null;
  onExternalActionConsumed?: () => void;
}

export const SwipeCard: React.FC<Props> = ({
  card,
  isTop,
  onSwipe,
  externalAction,
  onExternalActionConsumed,
}) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(isTop ? 1 : 0.95);

  useEffect(() => {
    scale.value = withTiming(isTop ? 1 : 0.95, { duration: 220 });
  }, [isTop, scale]);

  const completeSwipe = (direction: SwipeDirection) => onSwipe(direction);

  const flyOff = (direction: SwipeDirection) => {
    'worklet';
    const dx = direction === 'pass' ? -EXIT_X : EXIT_X;
    const dy = direction === 'super' ? -EXIT_X : 0;
    x.value = withTiming(dx, { duration: 240 });
    y.value = withTiming(dy, { duration: 240 }, () => {
      runOnJS(completeSwipe)(direction);
    });
  };

  useEffect(() => {
    if (!externalAction || !isTop) return;
    flyOff(externalAction);
    onExternalActionConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAction, isTop]);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd(() => {
      if (x.value > SWIPE_THRESHOLD) {
        flyOff('like');
      } else if (x.value < -SWIPE_THRESHOLD) {
        flyOff('pass');
      } else if (y.value < -SWIPE_THRESHOLD * 1.5) {
        flyOff('super');
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(x.value, [-SCREEN_W, 0, SCREEN_W], [-10, 0, 10]);
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    transform: [{ rotate: '-12deg' }, { scale: interpolate(x.value, [0, SWIPE_THRESHOLD], [0.85, 1], 'clamp') }],
  }));
  const passBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    transform: [{ rotate: '12deg' }, { scale: interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0.85], 'clamp') }],
  }));
  const superBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-SWIPE_THRESHOLD * 1.5, 0], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(y.value, [-SWIPE_THRESHOLD * 1.5, 0], [1, 0.85], 'clamp') }],
  }));

  const cover = card.photos[0]?.url;
  const grad = pickProfileGradient(card.displayName ?? 'Delta');

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, Shadows.large, cardStyle]}
        pointerEvents={isTop ? 'auto' : 'none'}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          >
            <Text style={styles.placeholderInitial}>
              {(card.displayName ?? '?').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(28,15,20,0.05)', 'rgba(28,15,20,0.92)'] as const}
          locations={[0, 0.45, 1]}
          style={styles.overlay}
        />

        {card.verified && (
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Verified</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>
            {card.displayName}
            <Text style={styles.age}>, {card.age}</Text>
          </Text>
          {card.city && (
            <View style={styles.cityRow}>
              <Text style={styles.cityGlyph}>◉</Text>
              <Text style={styles.city}>{card.city}</Text>
            </View>
          )}
          {card.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {card.bio}
            </Text>
          ) : null}
        </View>

        <Animated.View style={[styles.badge, styles.likeBadge, likeBadgeStyle]}>
          <Text style={[styles.badgeText, { color: AppColors.primary }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.passBadge, passBadgeStyle]}>
          <Text style={[styles.badgeText, { color: AppColors.danger }]}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.superBadge, superBadgeStyle]}>
          <Text style={[styles.badgeText, { color: AppColors.live }]}>SUPER</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  image: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  placeholderInitial: { fontSize: 160, color: 'rgba(255,255,255,0.45)', fontWeight: '800' },
  overlay: { ...StyleSheet.absoluteFillObject },
  onlinePill: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.live,
  },
  onlineText: { ...Typography.caption, color: AppColors.textPrimary, fontWeight: '700' },
  info: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  name: { ...Typography.display, color: AppColors.white, fontSize: 30, lineHeight: 34 },
  age: { ...Typography.display, color: 'rgba(255,255,255,0.85)', fontSize: 30, lineHeight: 34 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cityGlyph: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  city: { ...Typography.body, color: 'rgba(255,255,255,0.92)' },
  bio: { ...Typography.body, color: 'rgba(255,255,255,0.92)', marginTop: Spacing.sm },
  badge: {
    position: 'absolute',
    top: Spacing.xl + 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  likeBadge: { right: Spacing.xl, borderColor: AppColors.primary },
  passBadge: { left: Spacing.xl, borderColor: AppColors.danger },
  superBadge: {
    alignSelf: 'center',
    left: '50%',
    marginLeft: -56,
    top: 100,
    borderColor: AppColors.live,
  },
  badgeText: { ...Typography.h1, letterSpacing: 2.5, fontWeight: '800', fontSize: 22 },
});
