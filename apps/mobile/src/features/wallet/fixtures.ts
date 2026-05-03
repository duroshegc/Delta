import { TokenPackage, Transaction, WalletBalance } from './types';

export const USE_FIXTURES = true;

export const fixtureBalance: WalletBalance = {
  balance: 248,
  bonus: 32,
};

export const fixturePackages: TokenPackage[] = [
  { id: 'pkg-100', delts: 100, bonusDelts: 0, priceUsdCents: 499 },
  { id: 'pkg-300', delts: 300, bonusDelts: 30, priceUsdCents: 1299, popular: true },
  { id: 'pkg-700', delts: 700, bonusDelts: 100, priceUsdCents: 2499 },
  { id: 'pkg-1500', delts: 1500, bonusDelts: 300, priceUsdCents: 4999 },
];

const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const fixtureTransactions: Transaction[] = [
  { id: 't-1', kind: 'super_like', delts: -10, description: 'Super like — Sophia', occurredAt: hoursAgo(2) },
  { id: 't-2', kind: 'live_session', delts: -25, description: 'Live match (5 min)', occurredAt: hoursAgo(8) },
  { id: 't-3', kind: 'purchase', delts: 330, description: '300 delts + 30 bonus', occurredAt: daysAgo(1) },
  { id: 't-4', kind: 'boost', delts: -50, description: '30-min profile boost', occurredAt: daysAgo(2) },
  { id: 't-5', kind: 'bonus', delts: 25, description: 'Welcome bonus', occurredAt: daysAgo(7) },
];
