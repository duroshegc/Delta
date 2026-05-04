import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColors, BorderRadius, Spacing, Typography } from '../../../core/theme';
import { useMatchesStore } from '../store';
import { ChatMessage } from '../types';
import { formatRelative } from '../utils';
import { MatchesStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { matchId } = route.params;
  const messages = useMatchesStore((s) => s.messagesByMatch[matchId] ?? []);
  const header = useMatchesStore((s) => s.headersByMatch[matchId]);
  const loadMessages = useMatchesStore((s) => s.loadMessages);
  const sendMessage = useMatchesStore((s) => s.sendMessage);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: header?.displayName ?? 'Chat',
      headerRight: () => (
        <Pressable
          hitSlop={12}
          onPress={() =>
            navigation.navigate('ReportUser', {
              userId: header?.userId ?? 'unknown',
              matchId,
            })
          }
        >
          <Text style={styles.headerAction}>Report</Text>
        </Pressable>
      ),
    });
  }, [navigation, header, matchId]);

  useEffect(() => {
    loadMessages(matchId).catch(() => undefined);
  }, [matchId, loadMessages]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)),
    [messages],
  );

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setSending(true);
    try {
      await sendMessage(matchId, text);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (err: any) {
      Alert.alert('Could not send', err?.response?.data?.message ?? err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => {
          const prev = sortedMessages[index - 1];
          const showTime =
            !prev ||
            new Date(item.sentAt).getTime() - new Date(prev.sentAt).getTime() > 15 * 60_000;
          return (
            <View>
              {showTime && <Text style={styles.timeStamp}>{formatRelative(item.sentAt)}</Text>}
              <MessageBubble msg={item} />
            </View>
          );
        }}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Say hi to {header?.displayName ?? 'them'}</Text>
            <Text style={styles.emptyBody}>You matched — your move.</Text>
          </View>
        }
      />
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={AppColors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={onSend}
          disabled={!draft.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            (!draft.trim() || sending) && styles.sendBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const mine = msg.sender === 'me';
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
          {msg.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  messages: { padding: Spacing.md, paddingBottom: Spacing.lg },
  timeStamp: {
    ...Typography.caption,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  empty: { alignItems: 'center', paddingTop: Spacing['2xl'] },
  emptyTitle: { ...Typography.h2, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: AppColors.textSecondary },
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  bubbleMine: { backgroundColor: AppColors.primary, borderBottomRightRadius: BorderRadius.xs },
  bubbleTheirs: { backgroundColor: AppColors.surface2, borderBottomLeftRadius: BorderRadius.xs },
  bubbleText: { ...Typography.body },
  bubbleTextMine: { color: AppColors.white },
  bubbleTextTheirs: { color: AppColors.textPrimary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.surface3,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface2,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxHeight: 120,
  },
  sendBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendLabel: { ...Typography.bodyMedium, color: AppColors.white },
  headerAction: { ...Typography.label, color: AppColors.danger, paddingHorizontal: Spacing.sm },
  pressed: { opacity: 0.85 },
});
