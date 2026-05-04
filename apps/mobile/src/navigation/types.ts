import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  VerifyOtp: undefined;
};

export type OnboardingStackParamList = {
  OnboardingName: undefined;
  OnboardingBirthDate: undefined;
  OnboardingIdentity: undefined;
};

export type ProfileStackParamList = {
  ProfileView: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  BlockedUsers: undefined;
  CommunityGuidelines: undefined;
};

export type MatchesStackParamList = {
  MatchesList: undefined;
  Chat: { matchId: string };
  ReportUser: { userId: string; matchId?: string };
};

export type WalletStackParamList = {
  WalletHome: undefined;
  TokenPackages: undefined;
  TransactionHistory: undefined;
};

export type LiveMatchStackParamList = {
  LiveEntry: undefined;
  LiveSearching: { interests: string[] };
  LivePartnerPreview: { sessionId: string; roomName: string; interest?: string };
  LiveRoom: { sessionId: string; roomName: string; token: string; serverUrl: string };
};

export type AppTabParamList = {
  Discovery: undefined;
  Matches: NavigatorScreenParams<MatchesStackParamList>;
  Live: NavigatorScreenParams<LiveMatchStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
