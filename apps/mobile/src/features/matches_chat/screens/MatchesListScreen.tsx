import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Shadows, Spacing, Typography } from '../../../core/theme';
import { useMatchesStore } from '../store';
import { MatchSummary } from '../types';
import { formatRelative } from '../utils';
import { MatchesStackParamList } from '../../../navigation/types';
import { ScreenBackdrop } from '../../../shared/components/ScreenBackdrop';
import { Avatar } from '../../../shared/components/Avatar';
import { SectionHeader } from '../../../shared/components/SectionHeader';

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
      <ScreenBackdrop tone="pink">
        <View style={[styles.center]}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      </ScreenBackdrop>
    );
  }

  if (matches.length === 0) {
    return (
      <ScreenBackdrop tone="pink">
        <View style={[styles.center]}>
          <View style={styles.emptyArt}>
            <Text style={styles.emptyArtGlyph}>♥</Text>
          </View>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyBody}>Keep swiping — your people are out there.</Text>
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop tone="pink">
      <FlatList
        contentContainerStyle={styles.content}
        data={conversations}
        keyExtractor={(m) => m.matchId}
        ListHeaderComponent={
          <View>
            {newMatches.length > 0 && (
              <View style={styles.newSection}>
                <SectionHeader
                  title="New matches"
                  hint={`${newMatches.length} waiting to chat`}
                  style={{ paddingHorizontal: Spacing.xl }}
                />
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
              </View>
            )}
            <SectionHeader
              title="Conversations"
              style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ConversationRow
            match={item}
            onPress={() => navigation.navigate('Chat', { matchId: item.matchId })}
          />
        )}
      />
    </ScreenBackdrop>
  );
};

const NewMatchTile: React.FC<{ match: MatchSummary; onPress: () => void }> = ({ match, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.newTile, pressed && styles.pressed]}>
    <Avatar uri={match.photoUrl} name={match.displayName} size={76} ring />
    <Text style={styles.newName} numberOfLines={1}>
      {match.displayName}
    </Text>
  </Pressable>
);

const ConversationRow: React.FC<{ match: MatchSummary; onPress: () => void }> = ({ match, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.row, Shadows.soft, pressed && styles.pressed]}
  >
    <Avatar uri={match.photoUrl} name={match.displayName} size={56} />
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

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xl, paddingTop: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyArt: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.glowPink,
  },
  emptyArtGlyph: { fontSize: 56, color: AppColors.primary },
  emptyTitle: { ...Typography.h1, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary, textAlign: 'center' },
  newSection: { marginBottom: Spacing.md },
  newRow: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingVertical: Spacing.sm },
  newTile: { width: 88, alignItems: 'center' },
  newName: { ...Typography.label, color: AppColors.textPrimary, marginTop: Spacing.sm, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  rowBody: { flex: 1 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowName: { ...Typography.h3, color: AppColors.textPrimary, flex: 1 },
  rowTime: { ...Typography.caption, color: AppColors.textSecondary },
  rowSubrow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rowMessage: { ...Typography.body, color: AppColors.textSecondary, flex: 1 },
  rowMessageUnread: { color: AppColors.textPrimary, fontWeight: '600' },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    marginLeft: Spacing.sm,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
