import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { LiveMatchStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<LiveMatchStackParamList, 'LiveRoom'>;

export const LiveRoomScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native build required</Text>
      <Text style={styles.body}>
        Live video uses native WebRTC, so this room opens in a custom Expo development build on iOS or Android.
      </Text>
      <PrimaryButton title="Back to live" onPress={() => navigation.popToTop()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  body: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
});
