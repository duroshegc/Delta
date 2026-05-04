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
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { DiscoveryCard, SwipeDirection } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const EXIT_X = SCREEN_W * 1.4;

interface Props {
  card: DiscoveryCard;
  isTop: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  /** Imperative swipe trigger from action buttons. */
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
  const scale = useSharedValue(isTop ? 1 : 0.96);

  useEffect(() => {
    scale.value = withTiming(isTop ? 1 : 0.96, { duration: 200 });
  }, [isTop, scale]);

  const completeSwipe = (direction: SwipeDirection) => {
    onSwipe(direction);
  };

  const flyOff = (direction: SwipeDirection) => {
    'worklet';
    const dx = direction === 'pass' ? -EXIT_X : EXIT_X;
    const dy = direction === 'super' ? -EXIT_X : 0;
    x.value = withTiming(dx, { duration: 220 });
    y.value = withTiming(dy, { duration: 220 }, () => {
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
    const rotate = interpolate(x.value, [-SCREEN_W, 0, SCREEN_W], [-12, 0, 12]);
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
  }));
  const passBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));
  const superBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-SWIPE_THRESHOLD * 1.5, 0], [1, 0], 'clamp'),
  }));

  const cover = card.photos[0]?.url;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]} pointerEvents={isTop ? 'auto' : 'none'}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.overlay} />
        <View style={styles.info}>
          <Text style={styles.name}>
            {card.displayName}
            <Text style={styles.age}>, {card.age}</Text>
          </Text>
          {card.city && <Text style={styles.city}>{card.city}</Text>}
          {card.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {card.bio}
            </Text>
          ) : null}
        </View>

        <Animated.View style={[styles.badge, styles.likeBadge, likeBadgeStyle]}>
          <Text style={styles.badgeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.passBadge, passBadgeStyle]}>
          <Text style={styles.badgeText}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.superBadge, superBadgeStyle]}>
          <Text style={styles.badgeText}>SUPER</Text>
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
    shadowColor: AppColors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  image: { ...StyleSheet.absoluteFillObject },
  imagePlaceholder: { backgroundColor: AppColors.surface2 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  info: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  name: { ...Typography.h1, color: AppColors.white },
  age: { ...Typography.h1, color: AppColors.white, opacity: 0.85 },
  city: { ...Typography.label, color: AppColors.white, opacity: 0.85, marginTop: 2 },
  bio: { ...Typography.body, color: AppColors.white, marginTop: Spacing.sm },
  badge: {
    position: 'absolute',
    top: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 3,
  },
  likeBadge: { right: Spacing.xl, borderColor: AppColors.success, transform: [{ rotate: '15deg' }] },
  passBadge: { left: Spacing.xl, borderColor: AppColors.danger, transform: [{ rotate: '-15deg' }] },
  superBadge: {
    alignSelf: 'center',
    left: '50%',
    marginLeft: -50,
    borderColor: AppColors.live,
  },
  badgeText: { ...Typography.h2, color: AppColors.white, letterSpacing: 2 },
});
