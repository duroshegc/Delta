import { apiClient } from '../../core/api/client';
import { ChatMessage, MatchHeader, MatchSummary } from './types';
import { useAuthStore } from '../auth/store';

interface BackendConversation {
  id: string;
  matchId: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number;
  otherUser?: {
    userId: string;
    displayName: string;
    photoUrl?: string | null;
  } | null;
}

interface BackendMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  createdAt: string;
}

const normalizeConversation = (conversation: BackendConversation): MatchSummary => ({
  matchId: conversation.id,
  userId: conversation.otherUser?.userId ?? '',
  displayName: conversation.otherUser?.displayName ?? 'Delta member',
  photoUrl: conversation.otherUser?.photoUrl ?? null,
  lastMessage: conversation.lastMessagePreview ?? null,
  lastMessageAt: conversation.lastMessageAt ?? null,
  unread: Boolean(conversation.unreadCount),
  matchedAt: conversation.lastMessageAt ?? new Date().toISOString(),
});

const normalizeHeader = (conversation: BackendConversation): MatchHeader => ({
  matchId: conversation.id,
  userId: conversation.otherUser?.userId ?? '',
  displayName: conversation.otherUser?.displayName ?? 'Delta member',
  photoUrl: conversation.otherUser?.photoUrl ?? null,
});

const normalizeMessage = (message: BackendMessage): ChatMessage => ({
  id: message.id,
  matchId: message.conversationId,
  sender: message.senderId === useAuthStore.getState().user?.id ? 'me' : 'them',
  text: message.text ?? '',
  sentAt: message.createdAt,
});

export const matchesApi = {
  async list() {
    const { data } = await apiClient.get<{ conversations: BackendConversation[] }>('/conversations');
    return data.conversations.map(normalizeConversation);
  },

  async listHeaders() {
    const { data } = await apiClient.get<{ conversations: BackendConversation[] }>('/conversations');
    return Object.fromEntries(
      data.conversations.map((conversation) => [conversation.id, normalizeHeader(conversation)]),
    );
  },

  async messages(conversationId: string, before?: string) {
    const { data } = await apiClient.get<{ messages: BackendMessage[] }>(
      `/conversations/${conversationId}/messages`,
      { params: { cursor: before } },
    );
    return data.messages.map(normalizeMessage);
  },

  async sendMessage(conversationId: string, text: string) {
    const { data } = await apiClient.post<BackendMessage>(
      `/conversations/${conversationId}/messages`,
      { text, mediaIds: [] },
    );
    return normalizeMessage(data);
  },

  async getMatch(conversationId: string) {
    const { data } = await apiClient.get<{ conversations: BackendConversation[] }>('/conversations');
    const conversation = data.conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    return normalizeHeader(conversation);
  },

  async unmatch(conversationId: string) {
    const { data } = await apiClient.get<{ conversations: BackendConversation[] }>('/conversations');
    const conversation = data.conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    await apiClient.delete(`/matches/${conversation.matchId}`);
  },
};
