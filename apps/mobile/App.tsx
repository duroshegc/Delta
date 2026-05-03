import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts as usePlusJakartaSans,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { RootNavigator } from './src/navigation/RootNavigator';

// LiveKit ships native modules absent from Expo Go; importing it there would
// crash the bundle and surface as "Invariant Violation: app entry not found."
// Load it only in development builds / standalone apps.
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@livekit/react-native').registerGlobals();
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded, fontError] = usePlusJakartaSans({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (fontError) console.warn('Font load error:', fontError);
  }, [fontError]);

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <RootNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
