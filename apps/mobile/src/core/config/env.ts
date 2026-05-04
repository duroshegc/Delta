/**
 * Delta App Environment Configuration
 * Manages different environments (dev, staging, prod)
 */

export type Environment = 'development' | 'staging' | 'production';

// This will be set based on the build configuration
// You can override this with EXPO_PUBLIC_ENV environment variable
const getEnvironment = (): Environment => {
  const envVar = process.env.EXPO_PUBLIC_ENV as Environment | undefined;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar;
  }
  return __DEV__ ? 'development' : 'production';
};

const ENV: Environment = getEnvironment();

interface EnvConfig {
  apiBaseUrl: string;
  imagekitPublicKey: string;
  imagekitUrlEndpoint: string;
  livekitUrl: string;
  websocketUrl: string;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://backend-teal-one-10.vercel.app';

const WEBSOCKET_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_URL ||
  API_BASE_URL.replace(/^http/, 'ws').replace(/\/$/, '') + '/live-match/events';

const configs: Record<Environment, EnvConfig> = {
  development: {
    apiBaseUrl: API_BASE_URL,
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: WEBSOCKET_URL,
  },
  staging: {
    apiBaseUrl: API_BASE_URL,
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: WEBSOCKET_URL,
  },
  production: {
    apiBaseUrl: API_BASE_URL,
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: WEBSOCKET_URL,
  },
};

export const Env = {
  ...configs[ENV],
  environment: ENV,
  isDev: ENV === 'development',
  isStaging: ENV === 'staging',
  isProd: ENV === 'production',
  enableLogging: ENV !== 'production',
  apiTimeout: 30000, // 30 seconds
  websocketTimeout: 10000, // 10 seconds
} as const;

export default Env;

// Made with Bob
