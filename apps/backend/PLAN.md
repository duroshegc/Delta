# Backend Development Plan

**Status**: 🔴 Not Started  
**Priority**: 1 (Build First)  
**Dependencies**: None - Foundation layer

---

## Overview

The backend is the core API service built with Bun runtime and ElysiaJS framework. It handles authentication, user management, profile operations, media coordination with ImageKit, wallet/token economy, live matching orchestration, moderation, and admin operations.

---

## Phase 1: Foundation & Infrastructure

### 1.1 Project Setup
- [ ] Initialize Bun project with TypeScript
- [ ] Install ElysiaJS and core dependencies
- [ ] Configure environment variables (`.env.example`)
- [ ] Set up MongoDB Atlas connection
- [ ] Set up Upstash Redis connection
- [ ] Configure CORS and security middleware
- [ ] Create health check endpoint `/health`

### 1.2 Database Schema & Indexes
- [ ] Create MongoDB collections (users, profiles, media, etc.)
- [ ] Define indexes per Section 9.1 of spec
- [ ] Create database seed scripts
- [ ] Set up migration system for schema changes

### 1.3 Shared Utilities
- [ ] JWT token generation and validation
- [ ] Error handling middleware
- [ ] Request validation with Zod/TypeBox
- [ ] Logger setup (structured logging)
- [ ] Rate limiting middleware (Upstash)

---

## Phase 2: Authentication & User Management

### 2.1 Auth Module (`/auth`)
- [ ] `POST /auth/start` - Email/phone authentication
- [ ] `POST /auth/verify` - OTP verification
- [ ] `POST /auth/refresh` - Token refresh
- [ ] `POST /auth/logout` - Session termination
- [ ] Device registration and binding
- [ ] Session management in Redis

### 2.2 Users Module (`/users`)
- [ ] `GET /me` - Current user profile
- [ ] `PATCH /me` - Update account settings
- [ ] `DELETE /me` - Account deletion
- [ ] Privacy controls and preferences
- [ ] Account status checks (banned, suspended, restricted)

---

## Phase 3: Profile & Media

### 3.1 Profiles Module (`/profiles`)
- [ ] `GET /profiles/:userId` - Get profile
- [ ] `PUT /profiles` - Create/update profile
- [ ] Profile completion validation
- [ ] Interests, prompts, preferences
- [ ] Location handling (GeoJSON)
- [ ] Visibility controls

### 3.2 Media Module (`/media`)
- [ ] `POST /media/upload-auth` - ImageKit auth generation
- [ ] `POST /media/complete` - Store media metadata
- [ ] `DELETE /media/:mediaId` - Delete media
- [ ] `PATCH /media/:mediaId/status` - Moderation status update
- [ ] Media type validation (profile_image, profile_video, etc.)
- [ ] ImageKit webhook handler

---

## Phase 4: Discovery & Matching

### 4.1 Discovery Module (`/discovery`)
- [ ] `GET /discovery/feed` - Profile candidates
- [ ] Geospatial queries (MongoDB 2dsphere)
- [ ] Filter by preferences, intent, age range
- [ ] Ranking algorithm implementation
- [ ] Pagination and cursor-based loading

### 4.2 Likes & Matches Module (`/likes`, `/matches`)
- [ ] `POST /likes` - Send like/super like
- [ ] `GET /matches` - List matches
- [ ] `DELETE /matches/:matchId` - Unmatch
- [ ] Match creation on mutual like
- [ ] Match notifications

---

## Phase 5: Chat System

### 5.1 Chat Module (`/chat`)
- [ ] `GET /conversations` - List conversations
- [ ] `GET /conversations/:id/messages` - Get messages
- [ ] `POST /conversations/:id/messages` - Send message
- [ ] Message metadata storage
- [ ] Media message authorization
- [ ] Safety filters and moderation hooks

---

## Phase 6: Wallet & Token Economy

### 6.1 Wallet Module (`/wallet`)
- [ ] `GET /wallet` - Get balance and history
- [ ] `GET /wallet/packages` - Available token packages
- [ ] `POST /wallet/purchase/ios/verify` - iOS IAP verification
- [ ] `POST /wallet/purchase/android/verify` - Android IAP verification
- [ ] Wallet ledger (immutable transactions)
- [ ] Idempotency key handling
- [ ] Balance calculation from ledger

### 6.2 Token Operations
- [ ] Reservation system (hold tokens)
- [ ] Settlement system (charge tokens)
- [ ] Refund logic
- [ ] Bonus token handling
- [ ] Admin adjustments with audit trail

---

## Phase 7: Live Matching System

### 7.1 Live Match Module (`/live-match`)
- [ ] `POST /live-match/search` - Create match ticket
- [ ] `POST /live-match/cancel` - Cancel search
- [ ] `GET /live-match/status/:ticketId` - Polling endpoint
- [ ] `WS /live-match/events` - WebSocket status channel
- [ ] Ticket creation in MongoDB + Redis
- [ ] Pool placement logic (region, intent, interest)
- [ ] Rate limiting for search attempts

### 7.2 LiveKit Integration (`/livekit`)
- [ ] Room creation helpers
- [ ] Participant token generation (JWT)
- [ ] `POST /livekit/webhook` - Webhook handler
- [ ] Session lifecycle management
- [ ] Participant events processing

### 7.3 Session Management
- [ ] Session document creation
- [ ] Status state machine
- [ ] Join timeout handling
- [ ] Duration tracking
- [ ] Billing status updates

---

## Phase 8: Safety & Moderation

### 8.1 Moderation Module (`/moderation`)
- [ ] `POST /reports` - Submit report
- [ ] `POST /blocks` - Block user
- [ ] Report categorization
- [ ] Trust score calculation
- [ ] Moderation case creation
- [ ] User restrictions (ban, suspend, restrict features)

### 8.2 Trust & Safety
- [ ] Trust score system
- [ ] Block/report checks in matching
- [ ] Verification status management
- [ ] Safety filters for live matching
- [ ] Abuse pattern detection

---

## Phase 9: Admin & Dashboard API

### 9.1 Admin Module (`/admin`)
- [ ] `GET /admin/users` - User search and listing
- [ ] `GET /admin/reports` - Report queue
- [ ] `GET /admin/sessions` - Live session review
- [ ] `PATCH /admin/users/:id` - User actions
- [ ] `GET /admin/analytics` - Dashboard metrics
- [ ] RBAC middleware (roles: super_admin, moderator, support, etc.)
- [ ] Audit log creation for all actions

### 9.2 Analytics Endpoints
- [ ] Growth metrics (DAU, MAU, signups)
- [ ] Dating funnel metrics
- [ ] Live match funnel metrics
- [ ] Revenue/wallet metrics
- [ ] Safety metrics

---

## Phase 10: Testing & Documentation

### 10.1 Testing
- [ ] Unit tests for core business logic
- [ ] API integration tests
- [ ] Wallet transaction tests (idempotency)
- [ ] Matching logic tests
- [ ] Safety filter tests
- [ ] Load testing setup

### 10.2 Documentation
- [ ] OpenAPI/Swagger documentation
- [ ] API endpoint documentation
- [ ] Environment setup guide
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## Technical Requirements

### Dependencies
```json
{
  "elysia": "latest",
  "mongodb": "latest",
  "@upstash/redis": "latest",
  "imagekit": "latest",
  "livekit-server-sdk": "latest",
  "zod": "latest",
  "jsonwebtoken": "latest"
}
```

### Environment Variables
```env
APP_ENV=development
PORT=3000
API_PUBLIC_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=delta

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ImageKit
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...

# LiveKit
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# IAP
APPLE_IAP_SHARED_SECRET=...
GOOGLE_PLAY_PACKAGE_NAME=...
```

---

## Success Criteria

- [ ] All API endpoints documented and tested
- [ ] Authentication flow working end-to-end
- [ ] Profile and media upload functional
- [ ] Wallet transactions are idempotent
- [ ] Live match ticket creation works
- [ ] Admin API secured with RBAC
- [ ] Health checks and monitoring in place
- [ ] Ready for mobile app integration

---

## Next Steps After Completion

Once backend Phase 1-7 is complete, move to:
1. **Mobile app** - Test APIs with real UI
2. **Workers** - Automate matching pipeline
3. **Backend Phase 8-9** - Complete safety and admin features

---

**Reference**: See `docs/Delta_Developer_Documentation.docx` Sections 8-9 for detailed specifications.