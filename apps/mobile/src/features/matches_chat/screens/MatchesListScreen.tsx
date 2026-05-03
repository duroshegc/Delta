import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useMatchesStore } from '../store';
import { MatchSummary } from '../types';
import { formatRelative } from '../utils';
import { MatchesStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchesList'>;

export const MatchesListScreen: React.FC<Props> = ({ navigation }) => {
  const matches = useMatchesStore((s) => s.matches);
  const loading = useMatchesStore((s) => s.loading);
  const load = useMatchesStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  const newMatches = matches.filter((m) => !m.lastMessage);
  const conversations = matches.filter((m) => m.lastMessage);

  if (loading && matches.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptyBody}>Keep swiping — your people are out there.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={conversations}
      keyExtractor={(m) => m.matchId}
      ListHeaderComponent={
        newMatches.length > 0 ? (
          <View style={styles.newSection}>
            <Text style={styles.sectionLabel}>New matches</Text>
            <FlatList
              data={newMatches}
              keyExtractor={(m) => m.matchId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newRow}
              renderItem={({ item }) => (
                <NewMatchTile match={item} onPress={() => navigation.navigate('Chat', { matchId: item.matchId })} />
              )}
            />
            <Text style={[styles.sectionLabel, styles.spacedSection]}>Conversations</Text>
          </View>
        ) : (
          <Text style={styles.sectionLabel}>Conversations</Text>
        )
      }
      renderItem={({ item }) => (
        <ConversationRow
          match={item}
          onPress={() => navigation.navigate('Chat', { matchId: item.matchId })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const NewMatchTile: React.FC<{ match: MatchSummary; onPress: () => void }> = ({ match, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.newTile, pressed && styles.pressed]}>
    <Avatar uri={match.photoUrl} size={72} initials={match.displayName} />
    <Text style={styles.newName} numberOfLines={1}>
      {match.displayName}
    </Text>
  </Pressable>
);

const ConversationRow: React.FC<{ match: MatchSummary; onPress: () => void }> = ({ match, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <Avatar uri={match.photoUrl} size={56} initials={match.displayName} />
    <View style={styles.rowBody}>
      <View style={styles.rowHead}>
        <Text style={styles.rowName} numberOfLines={1}>
          {match.displayName}
        </Text>
        <Text style={styles.rowTime}>{formatRelative(match.lastMessageAt)}</Text>
      </View>
      <View style={styles.rowSubrow}>
        <Text
          style={[styles.rowMessage, match.unread && styles.rowMessageUnread]}
          numberOfLines={1}
        >
          {match.lastMessage}
        </Text>
        {match.unread && <View style={styles.unreadDot} />}
      </View>
    </View>
  </Pressable>
);

const Avatar: React.FC<{ uri: string | null; size: number; initials: string }> = ({
  uri,
  size,
  initials,
}) => {
  const radius = size / 2;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  const letter = initials.charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.avatarLetter, { fontSize: size * 0.4 }]}>{letter}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingBottom: Spacing.xl },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center' },
  sectionLabel: {
    ...Typography.label,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  spacedSection: { marginTop: Spacing.xl },
  newSection: {},
  newRow: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  newTile: { width: 84, alignItems: 'center' },
  newName: { ...Typography.label, color: AppColors.textPrimary, marginTop: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowBody: { flex: 1 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowName: { ...Typography.h3, color: AppColors.textPrimary, flex: 1 },
  rowTime: { ...Typography.caption, color: AppColors.textSecondary },
  rowSubrow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rowMessage: { ...Typography.body, color: AppColors.textSecondary, flex: 1 },
  rowMessageUnread: { color: AppColors.textPrimary, fontFamily: undefined },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.primary,
    marginLeft: Spacing.sm,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: AppColors.surface3, marginLeft: 96 },
  avatarFallback: {
    backgroundColor: AppColors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { ...Typography.h2, color: AppColors.textSecondary },
  pressed: { opacity: 0.85 },
});
