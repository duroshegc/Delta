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

const configs: Record<Environment, EnvConfig> = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: 'ws://localhost:3000/live-match/events',
  },
  staging: {
    apiBaseUrl: 'https://api-staging.delta.app',
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: 'wss://api-staging.delta.app/live-match/events',
  },
  production: {
    apiBaseUrl: 'https://api.delta.app',
    imagekitPublicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    imagekitUrlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || '',
    websocketUrl: 'wss://api.delta.app/live-match/events',
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
