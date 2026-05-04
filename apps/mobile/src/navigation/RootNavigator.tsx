import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppColors, Typography } from '../core/theme';
import { useAuthStore } from '../features/auth/store';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { VerifyOtpScreen } from '../features/auth/screens/VerifyOtpScreen';
import { NameScreen } from '../features/onboarding/screens/NameScreen';
import { BirthDateScreen } from '../features/onboarding/screens/BirthDateScreen';
import { IdentityScreen } from '../features/onboarding/screens/IdentityScreen';
import { ProfileViewScreen } from '../features/profile/screens/ProfileViewScreen';
import { ProfileEditScreen } from '../features/profile/screens/ProfileEditScreen';
import { DiscoveryScreen } from '../features/discovery/screens/DiscoveryScreen';
import { MatchesListScreen } from '../features/matches_chat/screens/MatchesListScreen';
import { ChatScreen } from '../features/matches_chat/screens/ChatScreen';
import { ReportUserScreen } from '../features/safety/screens/ReportUserScreen';
import { BlockedUsersScreen } from '../features/safety/screens/BlockedUsersScreen';
import { CommunityGuidelinesScreen } from '../features/safety/screens/CommunityGuidelinesScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { WalletHomeScreen } from '../features/wallet/screens/WalletHomeScreen';
import { TokenPackagesScreen } from '../features/wallet/screens/TokenPackagesScreen';
import { TransactionHistoryScreen } from '../features/wallet/screens/TransactionHistoryScreen';
import { LiveEntryScreen } from '../features/live_match/screens/LiveEntryScreen';
import { LiveSearchingScreen } from '../features/live_match/screens/LiveSearchingScreen';
import { LivePartnerPreviewScreen } from '../features/live_match/screens/LivePartnerPreviewScreen';
import {
  AuthStackParamList,
  OnboardingStackParamList,
  ProfileStackParamList,
  MatchesStackParamList,
  WalletStackParamList,
  LiveMatchStackParamList,
  AppTabParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MatchesStack = createNativeStackNavigator<MatchesStackParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();
const LiveStack = createNativeStackNavigator<LiveMatchStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

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

const headerScreen = {
  headerShown: true,
  title: '',
  headerBackTitle: '',
  contentStyle: { backgroundColor: AppColors.background },
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={stackScreen}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="SignIn" component={SignInScreen} options={headerScreen} />
    <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={headerScreen} />
  </AuthStack.Navigator>
);

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator screenOptions={headerScreen}>
    <OnboardingStack.Screen name="OnboardingName" component={NameScreen} />
    <OnboardingStack.Screen name="OnboardingBirthDate" component={BirthDateScreen} />
    <OnboardingStack.Screen name="OnboardingIdentity" component={IdentityScreen} />
  </OnboardingStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackScreen}>
    <ProfileStack.Screen name="ProfileView" component={ProfileViewScreen} />
    <ProfileStack.Screen name="ProfileEdit" component={ProfileEditScreen} options={headerScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ ...headerScreen, title: 'Settings' }} />
    <ProfileStack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ ...headerScreen, title: 'Blocked users' }} />
    <ProfileStack.Screen
      name="CommunityGuidelines"
      component={CommunityGuidelinesScreen}
      options={{ ...headerScreen, title: 'Community' }}
    />
  </ProfileStack.Navigator>
);

const MatchesNavigator = () => (
  <MatchesStack.Navigator screenOptions={stackScreen}>
    <MatchesStack.Screen
      name="MatchesList"
      component={MatchesListScreen}
      options={{ ...headerScreen, title: 'Matches' }}
    />
    <MatchesStack.Screen name="Chat" component={ChatScreen} options={headerScreen} />
    <MatchesStack.Screen
      name="ReportUser"
      component={ReportUserScreen}
      options={{ ...headerScreen, title: 'Report' }}
    />
  </MatchesStack.Navigator>
);

const WalletNavigator = () => (
  <WalletStack.Navigator screenOptions={stackScreen}>
    <WalletStack.Screen
      name="WalletHome"
      component={WalletHomeScreen}
      options={{ ...headerScreen, title: 'Wallet' }}
    />
    <WalletStack.Screen
      name="TokenPackages"
      component={TokenPackagesScreen}
      options={{ ...headerScreen, title: '' }}
    />
    <WalletStack.Screen
      name="TransactionHistory"
      component={TransactionHistoryScreen}
      options={{ ...headerScreen, title: 'History' }}
    />
  </WalletStack.Navigator>
);

const LiveNavigator = () => (
  <LiveStack.Navigator screenOptions={stackScreen}>
    <LiveStack.Screen
      name="LiveEntry"
      component={LiveEntryScreen}
      options={{ ...headerScreen, title: 'Live' }}
    />
    <LiveStack.Screen name="LiveSearching" component={LiveSearchingScreen} options={headerScreen} />
    <LiveStack.Screen
      name="LivePartnerPreview"
      component={LivePartnerPreviewScreen}
      options={headerScreen}
    />
  </LiveStack.Navigator>
);

const AppNavigator = () => (
  <AppTabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: AppColors.surface,
        borderTopColor: AppColors.surface3,
      },
      tabBarActiveTintColor: AppColors.primary,
      tabBarInactiveTintColor: AppColors.textMuted,
      tabBarLabelStyle: { ...Typography.caption },
    }}
  >
    <AppTabs.Screen name="Discovery" component={DiscoveryScreen} />
    <AppTabs.Screen name="Matches" component={MatchesNavigator} />
    <AppTabs.Screen name="Live" component={LiveNavigator} options={{ title: 'Live' }} />
    <AppTabs.Screen name="Wallet" component={WalletNavigator} />
    <AppTabs.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
  </AppTabs.Navigator>
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
