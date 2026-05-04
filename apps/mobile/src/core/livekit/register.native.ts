import Constants, { ExecutionEnvironment } from 'expo-constants';

export const registerLiveKitGlobals = () => {
  if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@livekit/react-native').registerGlobals();
  }
};
