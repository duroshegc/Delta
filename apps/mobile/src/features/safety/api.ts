import { apiClient } from '../../core/api/client';

export type ReportCategory =
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'scam'
  | 'underage'
  | 'other';

export interface BlockedUser {
  userId: string;
  displayName: string;
  blockedAt: string;
  reason?: string;
}

export const safetyApi = {
  async submitReport(input: {
    reportedUserId: string;
    category: ReportCategory;
    description: string;
    conversationId?: string;
    messageId?: string;
    liveSessionId?: string;
  }) {
    const { conversationId, messageId, liveSessionId, ...body } = input;
    const { data } = await apiClient.post('/reports', {
      ...body,
      evidenceMediaIds: [],
      context: { conversationId, messageId, liveSessionId },
    });
    return data;
  },

  async blockUser(blockedUserId: string, reason?: string) {
    const { data } = await apiClient.post('/blocks', { blockedUserId, reason });
    return data;
  },

  async listBlockedUsers() {
    const { data } = await apiClient.get<BlockedUser[]>('/blocks');
    return data;
  },

  async unblockUser(userId: string) {
    await apiClient.delete(`/blocks/${userId}`);
  },
};
