import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Env } from '../config/env';
import { secureStorage } from '../storage/secureStorage';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: Env.apiBaseUrl,
  timeout: Env.apiTimeout,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

const refreshTokens = async (): Promise<string | null> => {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${Env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { timeout: Env.apiTimeout },
    );
    await secureStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await secureStorage.clear();
    return null;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshTokens().finally(() => { refreshing = null; });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
