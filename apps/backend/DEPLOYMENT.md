# Delta Backend Deployment Guide

## Required Services

- MongoDB Atlas or compatible MongoDB
- Upstash Redis
- ImageKit for media
- LiveKit for live calls
- SMTP credentials for email
- Apple/Google IAP credentials before production purchases

## Required Environment

Use `.env.example` as the source of truth. Production must provide:

- `APP_ENV=production`
- `API_PUBLIC_URL`
- `MONGODB_URI`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BETTER_AUTH_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SMTP_*`
- `IMAGEKIT_*`
- `LIVEKIT_*`

## Preflight

```bash
./node_modules/.bin/tsc --noEmit
node --loader ./tests/ts-loader.mjs --experimental-strip-types --experimental-transform-types --test "tests/**/*.test.ts"
bun run db:init
```

## Runtime

```bash
bun src/index.ts
```

## Production Caveats

- Apple/Google receipt verification endpoints are wired, but provider API verification remains a required production integration.
- Redis pool mirroring for live match is still pending; Mongo-backed matching is currently the source of truth.
- Join timeout workers are pending; timeout handling should be automated before launch.

// Made with Bob
