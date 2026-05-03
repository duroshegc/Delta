export interface MatchSummary {
  matchId: string;
  userId: string;
  displayName: string;
  photoUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null; // ISO
  unread: boolean;
  matchedAt: string;
}

export type MessageSender = 'me' | 'them';

export interface ChatMessage {
  id: string;
  matchId: string;
  sender: MessageSender;
  text: string;
  sentAt: string; // ISO
}

export interface MatchHeader {
  matchId: string;
  userId: string;
  displayName: string;
  photoUrl: string | null;
}
