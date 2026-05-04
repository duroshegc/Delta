import { apiClient } from '../../core/api/client';
import { TokenPackage, Transaction, WalletBalance } from './types';

interface BackendWallet {
  balance: number;
  bonusBalance: number;
}

interface BackendWalletResponse {
  wallet: BackendWallet;
  transactions: BackendTransaction[];
}

interface BackendPackage {
  id: string;
  tokens: number;
  bonusTokens: number;
  priceCents: number;
}

interface BackendTransaction {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  status?: string;
}

const normalizeBalance = (wallet: BackendWallet): WalletBalance => ({
  balance: wallet.balance,
  bonus: wallet.bonusBalance,
});

const normalizePackage = (pkg: BackendPackage, index: number): TokenPackage => ({
  id: pkg.id,
  delts: pkg.tokens,
  bonusDelts: pkg.bonusTokens,
  priceUsdCents: pkg.priceCents,
  popular: index === 1,
});

const normalizeTransaction = (tx: BackendTransaction): Transaction => ({
  id: tx.id,
  kind: tx.type === 'settlement' || tx.type === 'reservation' ? 'live_session' : tx.type as Transaction['kind'],
  delts: tx.amount,
  description: tx.type.replace(/_/g, ' '),
  occurredAt: tx.createdAt,
});

export const walletApi = {
  async balance() {
    const { data } = await apiClient.get<BackendWalletResponse>('/wallet/');
    return normalizeBalance(data.wallet);
  },

  async packages() {
    const { data } = await apiClient.get<BackendPackage[]>('/wallet/packages');
    return data.map(normalizePackage);
  },

  async transactions() {
    const { data } = await apiClient.get<BackendWalletResponse>('/wallet/');
    return data.transactions.map(normalizeTransaction);
  },

  async confirmPurchase(packageId: string, receipt: string, platform: 'ios' | 'android') {
    const transactionId = `${platform}-${packageId}-${Date.now()}`;
    const { data } = await apiClient.post<{ wallet: BackendWallet }>(`/wallet/purchase/${platform}/verify`, {
      productId: packageId,
      transactionId,
      idempotencyKey: transactionId,
      receipt,
    });
    return { balance: normalizeBalance(data.wallet) };
  },
};
