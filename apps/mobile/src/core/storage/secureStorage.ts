import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN = 'delta.auth.accessToken';
const REFRESH_TOKEN = 'delta.auth.refreshToken';

const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const secureStorage = {
  async getAccessToken() {
    return storage.getItem(ACCESS_TOKEN);
  },
  async getRefreshToken() {
    return storage.getItem(REFRESH_TOKEN);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await storage.setItem(ACCESS_TOKEN, accessToken);
    await storage.setItem(REFRESH_TOKEN, refreshToken);
  },
  async clear() {
    await storage.deleteItem(ACCESS_TOKEN);
    await storage.deleteItem(REFRESH_TOKEN);
  },
};
