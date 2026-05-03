import { apiClient } from '../../core/api/client';
import { TokenPackage, Transaction, WalletBalance } from './types';

export const walletApi = {
  async balance() {
    const { data } = await apiClient.get<WalletBalance>('/wallet/balance');
    return data;
  },

  async packages() {
    const { data } = await apiClient.get<{ packages: TokenPackage[] }>('/wallet/packages');
    return data.packages;
  },

  async transactions() {
    const { data } = await apiClient.get<{ transactions: Transaction[] }>('/wallet/transactions');
    return data.transactions;
  },

  async confirmPurchase(packageId: string, receipt: string, platform: 'ios' | 'android') {
    const { data } = await apiClient.post<{ balance: WalletBalance }>('/wallet/purchases', {
      packageId,
      receipt,
      platform,
    });
    return data;
  },
};
