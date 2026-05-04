# Mobile App Development Plan

**Status**: 🟢 API integration in progress; core backend is reachable  
**Priority**: 1  
**Stack**: Expo + React Native + TypeScript  
**Backend**: `https://backend-teal-one-10.vercel.app`

---

## Current Snapshot

- [x] Mobile app runs in Expo/React Native
- [x] Light theme uses Delta design-system colors, fonts, and app logo asset
- [x] Production API health is green (`api`, `database`, `redis`)
- [x] Mobile TypeScript check passes
- [x] Backend TypeScript check passes
- [x] In-app browser reaches the Delta sign-in screen

## Phase 1: Project Setup & Architecture

### 1.1 Expo Project Initialization
- [x] Create Expo project with iOS, Android, and web support
- [x] Configure app bundle IDs
- [x] Configure app icons and splash screens
- [x] Configure light-mode app shell
- [ ] Set up native development/staging/production build profiles
- [ ] Set up deep linking (`delta://`)

### 1.2 Architecture & State Management
- [x] Set up feature-based folder structure
- [x] Set up Zustand stores
- [x] Create base API client with interceptors
- [x] Implement token refresh logic
- [x] Add backend response unwrapping
- [x] Add web-safe auth token storage fallback
- [ ] Add centralized retry policy for transient API failures

### 1.3 Core Dependencies
- [x] Axios HTTP client
- [x] Zustand state management
- [x] Expo Secure Store
- [x] Image picker and media library
- [x] Camera and microphone packages
- [x] Expo Notifications package
- [x] Expo Location package
- [x] LiveKit packages guarded for native builds
- [x] React Native Web runtime

---

## Phase 2: Authentication Module

### 2.1 Auth Screens
- [x] Welcome screen
- [x] Email/password sign-in screen
- [x] Account creation mode
- [x] Session bootstrap
- [x] Auto-login with stored tokens
- [x] Logout functionality
- [ ] Email verification UX
- [ ] Password reset UX

### 2.2 Auth State
- [x] Auth state provider/store
- [x] Token storage (access + refresh)
- [x] Session expiry handling through refresh interceptor
- [ ] Device registration
- [ ] Biometric authentication

---

## Phase 3: Onboarding & Profile Setup

### 3.1 Onboarding Flow
- [x] Display name input
- [x] Birth date and age validation
- [x] Gender selection
- [x] Dating intent selection
- [x] Interested-in selection
- [x] Save onboarding profile to backend
- [ ] Interest selection during onboarding
- [ ] Location permission request and backend save
- [ ] Profile completion progress indicator

### 3.2 Profile Module
- [x] Profile view screen
- [x] Profile edit screen
- [x] Profile API normalization for backend field names
- [x] Profile photo upload through backend ImageKit auth
- [x] Photo removal
- [x] Preferences mapping for age range, distance, and gender
- [ ] Prompt editor UX
- [ ] Verification selfie/video flow
- [ ] Profile preview mode
- [ ] Video upload UX

---

## Phase 4: Discovery & Matching

### 4.1 Discovery Feed
- [x] Swipeable profile cards
- [x] Backend discovery feed integration
- [x] Like action
- [x] Pass action
- [x] Super like action mapped to backend
- [x] Match notification alert
- [ ] Profile detail view
- [ ] Super-like cost confirmation
- [ ] Rewind action
- [ ] Discovery filters
- [ ] Daily recommendations UX

### 4.2 Matches & Chat
- [x] Matches/conversations list screen
- [x] Chat conversation screen
- [x] Message send flow
- [x] Backend conversation/message integration
- [x] Unmatch API helper
- [ ] Image/video chat messages
- [ ] Voice notes
- [ ] Typing indicators
- [ ] Read receipts UI
- [ ] Real-time message updates

---

## Phase 5: Wallet & Token Economy

### 5.1 Wallet UI
- [x] Wallet balance display
- [x] Token packages screen
- [x] Transaction history
- [x] Bonus token display
- [x] Backend wallet/package/history integration
- [ ] Low balance warnings

### 5.2 In-App Purchases
- [x] Backend purchase verification endpoints wired in client
- [ ] iOS StoreKit checkout
- [ ] Android Billing checkout
- [ ] Receipt collection from native purchase APIs
- [ ] Restore purchases
- [ ] Purchase error recovery UX

### 5.3 Token Usage
- [x] Live video session cost display
- [ ] Super-like confirmation dialog
- [ ] Boost purchase and activation
- [ ] Priority matching purchase
- [ ] Insufficient balance handling

---

## Phase 6: Live Video Matching

### 6.1 Live Match UI
- [x] Live match entry screen
- [x] Interest selection for matching
- [x] Search status screen
- [x] Wait time display
- [x] Cancel search button
- [x] Partner preview screen
- [ ] Match found animation polish

### 6.2 LiveKit Integration
- [x] LiveKit native packages installed
- [x] LiveKit import guarded for web and Expo Go
- [x] Backend LiveKit token request wired
- [x] Video/audio room connection wired for native dev builds
- [x] Local/remote video renderers wired
- [x] Mute, camera toggle, and end-call controls wired
- [ ] Native dev build validation
- [ ] Camera/microphone permission flow
- [ ] Camera flip and audio-only controls

### 6.3 Live Session Flow
- [x] Start live match search
- [x] Poll live match status
- [x] Cancel live match search
- [x] Join token request
- [ ] WebSocket event stream integration
- [ ] Join timeout handling
- [ ] Connection quality indicator
- [ ] Duration timer
- [ ] Token consumption display
- [ ] Extend session option

### 6.4 Post-Call Experience
- [ ] Post-call feedback screen
- [ ] Match/skip decision
- [ ] Report/block from live call
- [ ] Session summary
- [ ] Return to pool option

---

## Phase 7: Safety & Moderation

### 7.1 Safety Features
- [x] Report user flow from chat
- [x] Report category selection
- [x] Submit report to backend
- [x] Block user from report flow
- [x] Blocked users list
- [x] Unblock user
- [x] Community guidelines screen
- [ ] Evidence upload for reports
- [ ] Safety tips screen
- [ ] Report/block entry points from profile and live call

### 7.2 Verification
- [ ] Selfie verification flow
- [ ] Video verification flow
- [ ] Verification status display
- [ ] Verification badge on profiles

---

## Phase 8: Notifications & Settings

### 8.1 Push Notifications
- [x] Expo Notifications package installed
- [x] Notification preferences UI
- [x] Notification preferences backend integration
- [ ] FCM/APNs project setup
- [ ] Push token registration with backend
- [ ] Foreground notification handling
- [ ] Background notification handling
- [ ] Deep link navigation from notifications

### 8.2 Settings
- [x] Account settings screen
- [x] Notification preferences
- [x] Privacy preferences
- [x] Blocked users management
- [x] Help/support rows
- [x] Terms of service row
- [x] Privacy policy row
- [x] Delete account flow with password confirmation
- [ ] Open support/legal links in browser instead of alerts
- [ ] Change password flow
- [ ] Change email flow

---

## Phase 9: Polish & Optimization

### 9.1 UI/UX Polish
- [x] Loading states for core screens
- [x] Error states with retry on discovery
- [x] Empty states for discovery, matches, blocked users
- [x] Core live-search animation
- [ ] Haptic feedback
- [ ] Accessibility pass
- [ ] Form validation polish
- [ ] Skeleton loading states

### 9.2 Performance
- [ ] Image caching
- [ ] List view optimization pass
- [ ] Memory leak audit
- [ ] Startup time optimization
- [ ] Network request deduping/caching

### 9.3 Offline Support
- [ ] Offline message queue
- [ ] Cached profile data
- [ ] Offline indicators
- [ ] Sync on reconnection

---

## Phase 10: Testing & Release

### 10.1 Testing
- [x] Mobile TypeScript verification
- [x] Backend TypeScript verification
- [x] In-app browser smoke check for sign-in screen
- [ ] Unit tests for stores and API normalizers
- [ ] Integration tests for auth/onboarding/discovery/chat
- [ ] Manual testing on iOS device
- [ ] Manual testing on Android device
- [ ] Native dev build testing for LiveKit and billing
- [ ] Beta testing

### 10.2 App Store Preparation
- [ ] App Store screenshots
- [ ] App Store description
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App Store review preparation
- [ ] Age rating configuration

---

## Immediate Next Todos

- [ ] Create native Expo dev build and verify LiveKit camera/microphone flow
- [ ] Configure iOS StoreKit and Android Billing products
- [ ] Add native purchase checkout and receipt handoff
- [ ] Add WebSocket-based live match updates
- [ ] Add push token registration endpoint/client flow
- [ ] Add tests for API normalizers and auth/profile stores
