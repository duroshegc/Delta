/**
 * Local fixtures so screens render and navigation flows can be tested
 * without the backend. Toggle USE_FIXTURES off (or remove the import sites)
 * once `/matches` and friends are live.
 */
import { ChatMessage, MatchHeader, MatchSummary } from './types';

export const USE_FIXTURES = true;

const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 60 * 60_000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60_000).toISOString();

export const fixtureMatches: MatchSummary[] = [
  {
    matchId: 'm-1',
    userId: 'u-sophia',
    displayName: 'Sophia',
    photoUrl: null,
    lastMessage: 'Farmer\'s market on Saturday?',
    lastMessageAt: minutesAgo(8),
    unread: true,
    matchedAt: hoursAgo(3),
  },
  {
    matchId: 'm-2',
    userId: 'u-marcus',
    displayName: 'Marcus',
    photoUrl: null,
    lastMessage: 'I\'ll send the playlist tonight',
    lastMessageAt: hoursAgo(2),
    unread: false,
    matchedAt: daysAgo(1),
  },
  {
    matchId: 'm-3',
    userId: 'u-priya',
    displayName: 'Priya',
    photoUrl: null,
    lastMessage: null,
    lastMessageAt: null,
    unread: false,
    matchedAt: minutesAgo(20),
  },
];

export const fixtureMessages: Record<string, ChatMessage[]> = {
  'm-1': [
    { id: '1', matchId: 'm-1', sender: 'them', text: 'Hey! Loved your hiking pic.', sentAt: hoursAgo(3) },
    { id: '2', matchId: 'm-1', sender: 'me', text: 'Thanks! That trail is unreal in fall.', sentAt: hoursAgo(2.5) },
    { id: '3', matchId: 'm-1', sender: 'them', text: "Farmer's market on Saturday?", sentAt: minutesAgo(8) },
  ],
  'm-2': [
    { id: '1', matchId: 'm-2', sender: 'me', text: 'Saw you play at Blackbird last week.', sentAt: daysAgo(1) },
    { id: '2', matchId: 'm-2', sender: 'them', text: "I\'ll send the playlist tonight", sentAt: hoursAgo(2) },
  ],
  'm-3': [],
};

export const fixtureHeaders: Record<string, MatchHeader> = Object.fromEntries(
  fixtureMatches.map((m) => [
    m.matchId,
    { matchId: m.matchId, userId: m.userId, displayName: m.displayName, photoUrl: m.photoUrl },
  ]),
);
