import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { AppColors, Spacing, Typography } from '../../../core/theme';
import { useWalletStore } from '../store';
import { Transaction } from '../types';
import { formatRelative } from '../../matches_chat/utils';

const KIND_LABEL: Record<Transaction['kind'], string> = {
  purchase: 'Purchase',
  super_like: 'Super like',
  boost: 'Boost',
  priority_match: 'Priority match',
  live_session: 'Live session',
  bonus: 'Bonus',
};

export const TransactionHistoryScreen: React.FC = () => {
  const transactions = useWalletStore((s) => s.transactions);
  const loading = useWalletStore((s) => s.loading);
  const load = useWalletStore((s) => s.load);

  useEffect(() => {
    if (transactions.length === 0) load();
  }, [transactions.length, load]);

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={transactions}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <Row tx={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
        </View>
      }
    />
  );
};

const Row: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const positive = tx.delts > 0;
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={styles.rowKind}>{KIND_LABEL[tx.kind]}</Text>
        <Text style={styles.rowDescription}>{tx.description}</Text>
        <Text style={styles.rowTime}>{formatRelative(tx.occurredAt)}</Text>
      </View>
      <Text style={[styles.amount, positive ? styles.amountPos : styles.amountNeg]}>
        {positive ? '+' : ''}{tx.delts}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingVertical: Spacing.md },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyTitle: { ...Typography.h3, color: AppColors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  rowBody: { flex: 1 },
  rowKind: { ...Typography.h3, color: AppColors.textPrimary },
  rowDescription: { ...Typography.body, color: AppColors.textSecondary, marginTop: 2 },
  rowTime: { ...Typography.caption, color: AppColors.textMuted, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: AppColors.surface3, marginLeft: Spacing.xl },
  amount: { ...Typography.h2 },
  amountPos: { color: AppColors.success },
  amountNeg: { color: AppColors.textPrimary },
});
