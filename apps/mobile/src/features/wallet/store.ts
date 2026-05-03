import { create } from 'zustand';
import { walletApi } from './api';
import { TokenPackage, Transaction, WalletBalance } from './types';
import { USE_FIXTURES, fixtureBalance, fixturePackages, fixtureTransactions } from './fixtures';

interface WalletState {
  balance: WalletBalance | null;
  packages: TokenPackage[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  packages: [],
  transactions: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      if (USE_FIXTURES) {
        set({
          balance: fixtureBalance,
          packages: fixturePackages,
          transactions: fixtureTransactions,
        });
      } else {
        const [balance, packages, transactions] = await Promise.all([
          walletApi.balance(),
          walletApi.packages(),
          walletApi.transactions(),
        ]);
        set({ balance, packages, transactions });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? err.message ?? 'Failed to load wallet' });
    } finally {
      set({ loading: false });
    }
  },
}));
