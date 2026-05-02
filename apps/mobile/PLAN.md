# Mobile App Development Plan

**Status**: 🟡 Waiting for Backend  
**Priority**: 2 (After Backend Foundation)  
**Dependencies**: Backend API (auth, profiles, media, wallet endpoints)

---

## Overview

Flutter mobile app for iOS and Android. Provides user-facing features including authentication, profile management, discovery feed, matching, chat, wallet/token purchases, live video matching, and safety controls.

---

## Phase 1: Project Setup & Architecture

### 1.1 Flutter Project Initialization
- [ ] Create Flutter project with iOS and Android support
- [ ] Configure app bundle IDs and signing
- [ ] Set up development, staging, and production flavors
- [ ] Configure app icons and splash screens
- [ ] Set up deep linking (delta://)

### 1.2 Architecture & State Management
- [ ] Choose state management (Riverpod/Bloc/Provider)
- [ ] Set up feature-based folder structure
- [ ] Create base API client with interceptors
- [ ] Implement token refresh logic
- [ ] Error handling and retry mechanisms

### 1.3 Core Dependencies
- [ ] HTTP client (dio/http)
- [ ] State management package
- [ ] Secure storage (flutter_secure_storage)
- [ ] Image picker and camera
- [ ] Video player
- [ ] Push notifications (FCM)
- [ ] Deep linking (uni_links/go_router)
- [ ] Location services (geolocator)

---

## Phase 2: Authentication Module

### 2.1 Auth Screens
- [ ] Welcome/onboarding screen
- [ ] Phone/email input screen
- [ ] OTP verification screen
- [ ] Session management
- [ ] Auto-login with stored tokens
- [ ] Logout functionality

### 2.2 Auth State
- [ ] Auth state provider
- [ ] Token storage (access + refresh)
- [ ] Device registration
- [ ] Session expiry handling
- [ ] Biometric authentication (optional)

---

## Phase 3: Onboarding & Profile Setup

### 3.1 Onboarding Flow
- [ ] Profile photo upload (ImageKit integration)
- [ ] Display name input
- [ ] Birth date and age verification
- [ ] Gender and preferences
- [ ] Dating intent selection
- [ ] Interests selection (multi-select)
- [ ] Location permission request
- [ ] Profile completion progress indicator

### 3.2 Profile Module
- [ ] Profile view screen
- [ ] Profile edit screen
- [ ] Photo/video upload with ImageKit
- [ ] Prompts and answers
- [ ] Preferences (age range, distance, gender)
- [ ] Verification flow (selfie/video)
- [ ] Profile preview

---

## Phase 4: Discovery & Matching

### 4.1 Discovery Feed
- [ ] Swipeable profile cards (Tinder-style)
- [ ] Profile detail view
- [ ] Like/pass actions
- [ ] Super like action (with delt cost)
- [ ] Rewind action (premium)
- [ ] Filters (age, distance, interests)
- [ ] Daily recommendations

### 4.2 Matches & Chat
- [ ] Matches list screen
- [ ] Match notification
- [ ] Chat conversation screen
- [ ] Message input with media
- [ ] Image/video messages (ImageKit)
- [ ] Voice notes (optional)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Unmatch action

---

## Phase 5: Wallet & Token Economy

### 5.1 Wallet UI
- [ ] Wallet balance display
- [ ] Token packages screen
- [ ] Purchase flow (iOS/Android IAP)
- [ ] Transaction history
- [ ] Bonus tokens display
- [ ] Low balance warnings

### 5.2 In-App Purchases
- [ ] iOS StoreKit integration
- [ ] Android Billing Library integration
- [ ] Purchase verification with backend
- [ ] Receipt validation
- [ ] Restore purchases
- [ ] Purchase error handling

### 5.3 Token Usage
- [ ] Super like confirmation dialog
- [ ] Boost purchase and activation
- [ ] Priority matching purchase
- [ ] Live video session cost display
- [ ] Insufficient balance handling

---

## Phase 6: Live Video Matching

### 6.1 Live Match UI
- [ ] Live match entry screen
- [ ] Interest selection for matching
- [ ] Search status screen (animated)
- [ ] Wait time display
- [ ] Cancel search button
- [ ] Match found animation
- [ ] Partner preview screen

### 6.2 LiveKit Integration
- [ ] LiveKit Flutter SDK setup
- [ ] Video/audio room connection
- [ ] Camera/microphone permissions
- [ ] Video renderer (local + remote)
- [ ] Audio-only mode toggle
- [ ] Camera flip (front/back)
- [ ] Mute/unmute controls
- [ ] End call button

### 6.3 Live Session Flow
- [ ] WebSocket connection for status updates
- [ ] Join timeout handling
- [ ] Connection quality indicator
- [ ] Duration timer
- [ ] Token consumption display
- [ ] Extend session option
- [ ] Network error handling

### 6.4 Post-Call Experience
- [ ] Post-call feedback screen
- [ ] Match/skip decision
- [ ] Report/block options
- [ ] Session summary (duration, cost)
- [ ] Return to pool option

---

## Phase 7: Safety & Moderation

### 7.1 Safety Features
- [ ] Report user flow (from profile, chat, live call)
- [ ] Report categories selection
- [ ] Evidence upload (screenshots)
- [ ] Block user confirmation
- [ ] Blocked users list
- [ ] Community guidelines screen
- [ ] Safety tips screen

### 7.2 Verification
- [ ] Selfie verification flow
- [ ] Video verification flow
- [ ] Verification status display
- [ ] Verification badge on profiles

---

## Phase 8: Notifications & Settings

### 8.1 Push Notifications
- [ ] FCM/APNs setup
- [ ] Token registration with backend
- [ ] Foreground notification handling
- [ ] Background notification handling
- [ ] Deep link navigation from notifications
- [ ] Notification preferences

### 8.2 Settings
- [ ] Account settings screen
- [ ] Notification preferences
- [ ] Privacy settings
- [ ] Blocked users management
- [ ] Help & support
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Delete account flow

---

## Phase 9: Polish & Optimization

### 9.1 UI/UX Polish
- [ ] Loading states and skeletons
- [ ] Error states with retry
- [ ] Empty states
- [ ] Animations and transitions
- [ ] Haptic feedback
- [ ] Dark mode support
- [ ] Accessibility (screen readers, font scaling)

### 9.2 Performance
- [ ] Image caching (cached_network_image)
- [ ] List view optimization
- [ ] Memory leak prevention
- [ ] App size optimization
- [ ] Startup time optimization
- [ ] Network request optimization

### 9.3 Offline Support
- [ ] Offline message queue
- [ ] Cached profile data
- [ ] Offline indicators
- [ ] Sync on reconnection

---

## Phase 10: Testing & Release

### 10.1 Testing
- [ ] Unit tests for business logic
- [ ] Widget tests for UI components
- [ ] Integration tests for critical flows
- [ ] Manual testing on iOS devices
- [ ] Manual testing on Android devices
- [ ] Beta testing (TestFlight/Internal Testing)

### 10.2 App Store Preparation
- [ ] App Store screenshots
- [ ] App Store description
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App Store review preparation
- [ ] Age rating configuration

### 10.3 Release
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Staged rollout plan
- [ ] Crash reporting (Sentry/Firebase Crashlytics)
- [ ] Analytics integration
- [ ] Remote config for feature flags

---

## Feature Module Structure

```
lib/
├── core/
│   ├── api/
│   ├── auth/
│   ├── storage/
│   ├── theme/
│   └── utils/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── providers/
│   ├── onboarding/
│   ├── profile/
│   ├── discovery/
│   ├── matches_chat/
│   ├── wallet/
│   ├── live_match/
│   ├── safety/
│   └── settings/
├── shared/
│   ├── widgets/
│   ├── models/
│   └── constants/
└── main.dart
```

---

## Key Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.x
  
  # Networking
  dio: ^5.x
  
  # Storage
  flutter_secure_storage: ^9.x
  shared_preferences: ^2.x
  
  # Media
  image_picker: ^1.x
  video_player: ^2.x
  cached_network_image: ^3.x
  
  # LiveKit
  livekit_client: ^2.x
  
  # Location
  geolocator: ^11.x
  
  # Notifications
  firebase_messaging: ^14.x
  
  # IAP
  in_app_purchase: ^3.x
  
  # UI
  flutter_svg: ^2.x
  shimmer: ^3.x
  
  # Utils
  intl: ^0.19.x
  url_launcher: ^6.x
```

---

## Environment Configuration

```dart
// lib/core/config/env.dart
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  
  static const String imagekitPublicKey = String.fromEnvironment(
    'IMAGEKIT_PUBLIC_KEY',
  );
  
  static const String livekitUrl = String.fromEnvironment(
    'LIVEKIT_URL',
  );
}
```

---

## Success Criteria

- [ ] Users can sign up and create profiles
- [ ] Profile photos upload to ImageKit successfully
- [ ] Discovery feed loads and swipe actions work
- [ ] Matches and chat functional
- [ ] Token purchases work on iOS and Android
- [ ] Live video matching connects successfully
- [ ] Report/block features work
- [ ] App passes App Store review
- [ ] Crash-free rate > 99%
- [ ] App size < 50MB

---

## Development Iterations

### Iteration 1: After Backend Phase 1-3
- Auth, profile, media upload

### Iteration 2: After Backend Phase 4-5
- Discovery, matches, chat

### Iteration 3: After Backend Phase 6
- Wallet and token purchases

### Iteration 4: After Backend Phase 7
- Live video matching

### Iteration 5: After Backend Phase 8
- Safety features and polish

---

**Reference**: See `docs/Delta_Developer_Documentation.docx` Section 7 for detailed mobile architecture.