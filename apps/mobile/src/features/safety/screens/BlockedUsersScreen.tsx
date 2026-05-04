import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, Spacing, Typography } from '../../../core/theme';

interface Blocked {
  userId: string;
  displayName: string;
  blockedAt: string;
}

const SEED: Blocked[] = [
  { userId: 'b-1', displayName: 'Alex', blockedAt: '2 weeks ago' },
  { userId: 'b-2', displayName: 'Jamie', blockedAt: 'last month' },
];

export const BlockedUsersScreen: React.FC = () => {
  const [blocked, setBlocked] = useState<Blocked[]>(SEED);

  const onUnblock = (userId: string, name: string) =>
    Alert.alert(`Unblock ${name}?`, "They'll be able to see your profile and message you.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => setBlocked((prev) => prev.filter((b) => b.userId !== userId)),
      },
    ]);

  if (blocked.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>No blocked users</Text>
        <Text style={styles.emptyBody}>People you block won't see your profile or message you.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={blocked}
      keyExtractor={(b) => b.userId}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.meta}>Blocked {item.blockedAt}</Text>
          </View>
          <Pressable
            onPress={() => onUnblock(item.userId, item.displayName)}
            style={({ pressed }) => [styles.unblock, pressed && styles.pressed]}
          >
            <Text style={styles.unblockLabel}>Unblock</Text>
          </Pressable>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingVertical: Spacing.md },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  name: { ...Typography.h3, color: AppColors.textPrimary },
  meta: { ...Typography.caption, color: AppColors.textSecondary, marginTop: 2 },
  unblock: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 9999,
  },
  unblockLabel: { ...Typography.label, color: AppColors.primary },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: AppColors.surface3, marginLeft: Spacing.xl },
  pressed: { opacity: 0.85 },
});
