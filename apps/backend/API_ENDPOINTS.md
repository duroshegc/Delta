# Delta Backend API Endpoints

Base URL: `http://localhost:3000`

Swagger UI is exposed at `/swagger` when the server is running.

## Core Modules

- Auth: `/auth/signup`, `/auth/signin`, `/auth/signout`, `/auth/refresh`, `/auth/session`
- Users: `/users/me`, `/users/me/preferences`, `/users/me/status`
- Profiles: `/profiles`, `/profiles/me`, `/profiles/:userId`
- Media: `/media/upload-auth`, `/media/complete`, `/media/me`, `/media/:mediaId`
- Discovery: `/discovery/feed`
- Matching: `/likes`, `/matches`, `/matches/:matchId`
- Chat: `/conversations`, `/conversations/:conversationId/messages`
- Wallet: `/wallet`, `/wallet/packages`, `/wallet/purchase/*/verify`, `/wallet/reservations`
- Live Match: `/live-match/search`, `/live-match/cancel`, `/live-match/status/:ticketId`, `WS /live-match/events`
- LiveKit: `/livekit/token`, `/livekit/webhook`
- Safety: `/reports`, `/blocks`
- Admin: `/admin/users`, `/admin/reports`, `/admin/sessions`, `/admin/users/:id`, `/admin/analytics`

## Auth

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

The live match WebSocket uses the same access token as a query parameter:

```text
/live-match/events?token=<accessToken>&ticketId=<optional>&sessionId=<optional>
```

## Testing

Run:

```bash
./node_modules/.bin/tsc --noEmit
node --loader ./tests/ts-loader.mjs --experimental-strip-types --experimental-transform-types --test "tests/**/*.test.ts"
```

// Made with Bob
