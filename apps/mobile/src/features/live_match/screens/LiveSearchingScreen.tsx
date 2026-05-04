import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { LiveMatchStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<LiveMatchStackParamList, 'LiveSearching'>;

const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const LiveSearchingScreen: React.FC<Props> = ({ navigation }) => {
  const [elapsed, setElapsed] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
    return () => clearInterval(tick);
  }, [pulse]);

  // Demo: after 10s, advance to partner preview so the flow is navigable.
  useEffect(() => {
    if (elapsed >= 10) {
      navigation.replace('LivePartnerPreview', { partnerId: 'demo-partner' });
    }
  }, [elapsed, navigation]);

  const ringStyle = (delay: number) => ({
    opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.15, 0] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1 + delay * 0.05, 2.2 + delay * 0.05] }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <View style={styles.heroWrap}>
        <Animated.View style={[styles.ring, ringStyle(0)]} />
        <Animated.View style={[styles.ring, ringStyle(1)]} />
        <Animated.View style={[styles.ring, ringStyle(2)]} />
        <View style={styles.core}>
          <Text style={styles.coreIcon}>●</Text>
        </View>
      </View>

      <Text style={styles.title}>Searching for a match…</Text>
      <Text style={styles.subtitle}>Average wait: under a minute</Text>
      <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>

      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
      >
        <Text style={styles.cancelLabel}>Cancel</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  heroWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.live,
  },
  core: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.live,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreIcon: { fontSize: 28, color: AppColors.white },
  title: { ...Typography.h1, color: AppColors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginTop: Spacing.sm },
  timer: { ...Typography.display, color: AppColors.live, marginTop: Spacing.lg },
  cancel: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  cancelLabel: { ...Typography.bodyMedium, color: AppColors.textPrimary },
  pressed: { opacity: 0.85 },
});
