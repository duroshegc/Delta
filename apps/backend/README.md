# Delta Backend API

The core API service for Delta - a dating and live social discovery platform built with Bun runtime and ElysiaJS framework.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- MongoDB (local or Atlas)
- Upstash Redis account (or local Redis)

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Start development server with hot reload
bun run dev

# Start production server
bun run start

# Type check
bun run typecheck

# Build for production
bun run build
```

The server will start at `http://localhost:3000`

### Master admin

Create or reset the first `super_admin` account with:

```bash
MASTER_ADMIN_EMAIL=owner@example.com MASTER_ADMIN_PASSWORD='StrongPassw0rd!' bun run admin:create-master
```

Only a signed-in `super_admin` can create additional admin accounts through `POST /admin/admins`.

## 📚 API Documentation

- **API Root**: `http://localhost:3000/`
- **Health Check**: `http://localhost:3000/health`
- **Swagger Docs**: `http://localhost:3000/swagger`

## 🏗️ Project Structure

```
apps/backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.ts        # Environment variable validation
│   │   ├── logger.ts     # Pino logger setup
│   │   ├── database.ts   # MongoDB connection
│   │   ├── redis.ts      # Upstash Redis connection
│   │   └── index.ts      # Config exports
│   ├── lib/              # Shared libraries
│   ├── middleware/       # Express-like middleware
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── profiles/     # Profile management
│   │   ├── discovery/    # Profile discovery
│   │   ├── matches/      # Match management
│   │   ├── chat/         # Chat & messaging
│   │   ├── media/        # Media upload (ImageKit)
│   │   ├── wallet/       # Delt token wallet
│   │   ├── live-match/   # Live matching
│   │   ├── livekit/      # LiveKit integration
│   │   ├── moderation/   # Safety & moderation
│   │   └── admin/        # Admin dashboard API
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── workers/          # Background workers
│   └── index.ts          # Main application entry
├── .env                  # Environment variables (gitignored)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `BETTER_AUTH_SECRET` - Secret key for better-auth (min 32 chars)

**Optional (for full functionality):**
- `IMAGEKIT_*` - ImageKit credentials for media storage
- `LIVEKIT_*` - LiveKit credentials for video/audio
- `APPLE_IAP_SHARED_SECRET` - iOS in-app purchase verification
- `GOOGLE_PLAY_PACKAGE_NAME` - Android package name
- `PUSH_FCM_SERVER_KEY` - Firebase Cloud Messaging key

## 🛠️ Technology Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Framework**: [ElysiaJS](https://elysiajs.com) - Fast & type-safe web framework
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) - Document database
- **Cache/Queue**: [Upstash Redis](https://upstash.com) - Serverless Redis
- **Auth**: [Better Auth](https://www.better-auth.com) - Modern authentication
- **Validation**: [Zod](https://zod.dev) - TypeScript-first schema validation
- **Logger**: [Pino](https://getpino.io) - Fast JSON logger
- **Media**: [ImageKit](https://imagekit.io) - Image & video CDN
- **Live Video**: [LiveKit](https://livekit.io) - Real-time video/audio

## 📋 Development Phases

### ✅ Phase 1.1: Project Setup (COMPLETED)
- [x] Bun + TypeScript project initialized
- [x] ElysiaJS with CORS and Swagger
- [x] Environment configuration with Zod validation
- [x] MongoDB connection with graceful shutdown
- [x] Upstash Redis connection
- [x] Structured logging with Pino
- [x] Health check endpoint
- [x] Error handling middleware

### 🔄 Phase 1.2: Database Schema & Indexes (NEXT)
- [ ] MongoDB collections setup
- [ ] Indexes for optimal query performance
- [ ] Database seed scripts
- [ ] Migration system

### 📝 Phase 1.3: Shared Utilities (NEXT)
- [ ] Better-auth configuration
- [ ] Request validation middleware
- [ ] Rate limiting with Upstash
- [ ] Additional error handlers

## 🔐 Security Features

- Environment variable validation on startup
- CORS configuration for production
- Structured error handling (no stack traces in production)
- Graceful shutdown handlers
- Rate limiting (coming soon)
- JWT-based authentication (coming soon)

## 📊 Health Check

The `/health` endpoint returns:

```json
{
  "status": "ok",
  "timestamp": "2026-05-02T05:27:37.000Z",
  "environment": "development",
  "services": {
    "api": "ok",
    "database": "ok",
    "redis": "ok"
  }
}
```

Status can be:
- `ok` - All services healthy
- `degraded` - Some services unavailable
- `error` - Critical failure

## 🐛 Debugging

### View Logs

Logs are formatted with Pino Pretty in development:

```bash
bun run dev
```

### Check Service Health

```bash
curl http://localhost:3000/health | jq .
```

### View API Documentation

Open `http://localhost:3000/swagger` in your browser

## 🚢 Deployment

### Build

```bash
bun run build
```

### Production Start

```bash
bun run start
```

### Recommended Platforms

- [Render](https://render.com) - Web Service
- [Railway](https://railway.app) - Service
- [Fly.io](https://fly.io) - App
- [Koyeb](https://koyeb.com) - Web Service

See `docs/Delta_Developer_Documentation.docx` Section 4 for detailed deployment guidance.

## 📖 API Modules (Coming Soon)

- **Auth** - Email/phone authentication with OTP
- **Users** - Account management
- **Profiles** - Dating profiles with media
- **Discovery** - Profile feed with filters
- **Matches** - Like/match system
- **Chat** - Messaging with media
- **Media** - ImageKit upload flow
- **Wallet** - Delt token economy
- **Live Match** - Real-time video matching
- **Moderation** - Safety & trust system
- **Admin** - Dashboard API

## 🤝 Contributing

This is an internal project. Follow the development plan in `PLAN.md`.

## 📄 License

Proprietary - Delta Platform

---

**Status**: Phase 1.1 Complete ✅ | Next: Phase 1.2 Database Schema
