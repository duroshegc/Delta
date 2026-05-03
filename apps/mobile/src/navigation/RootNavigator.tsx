import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppColors } from '../core/theme';
import { useAuthStore } from '../features/auth/store';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { VerifyOtpScreen } from '../features/auth/screens/VerifyOtpScreen';
import { NameScreen } from '../features/onboarding/screens/NameScreen';
import { BirthDateScreen } from '../features/onboarding/screens/BirthDateScreen';
import { IdentityScreen } from '../features/onboarding/screens/IdentityScreen';
import { HomePlaceholder } from '../features/home/HomePlaceholder';
import {
  AuthStackParamList,
  AppStackParamList,
  OnboardingStackParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: AppColors.background,
    card: AppColors.surface,
    text: AppColors.textPrimary,
    border: AppColors.surface3,
    primary: AppColors.primary,
    notification: AppColors.primary,
  },
};

const stackScreen = {
  headerShown: false,
  contentStyle: { backgroundColor: AppColors.background },
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={stackScreen}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: true, title: '' }} />
    <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ headerShown: true, title: '' }} />
  </AuthStack.Navigator>
);

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator
    screenOptions={{ ...stackScreen, headerShown: true, title: '', headerBackTitle: '' }}
  >
    <OnboardingStack.Screen name="OnboardingName" component={NameScreen} />
    <OnboardingStack.Screen name="OnboardingBirthDate" component={BirthDateScreen} />
    <OnboardingStack.Screen name="OnboardingIdentity" component={IdentityScreen} />
  </OnboardingStack.Navigator>
);

const AppNavigator = () => (
  <AppStack.Navigator screenOptions={stackScreen}>
    <AppStack.Screen name="Home" component={HomePlaceholder} />
  </AppStack.Navigator>
);

export const RootNavigator: React.FC = () => {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'unknown') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'authenticated' ? (
        <AppNavigator />
      ) : status === 'onboarding' ? (
        <OnboardingNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
});
