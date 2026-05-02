# Delta Backend Troubleshooting

## Server Will Not Start

- Confirm all required environment variables are present.
- Run `./node_modules/.bin/tsc --noEmit` to catch import/type issues.
- Check MongoDB and Upstash Redis credentials.

## Auth Fails

- Verify the access token uses the current `JWT_ACCESS_SECRET`.
- Check that the user status is `active` or `verified`.
- Confirm the session document has not expired.

## Media Upload Fails

- Confirm `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT`.
- Check media constraints in `src/modules/media/schemas.ts`.

## Live Match Does Not Pair

- Both users need active profiles and enough wallet balance.
- Region, intent, and at least one interest must overlap.
- Trust score restrictions can block live matching.

## WebSocket Does Not Connect

- Pass `token=<accessToken>` to `/live-match/events`.
- Subscribe by user automatically, or pass `ticketId` / `sessionId` for scoped updates.

## Wallet Balance Looks Wrong

- Compare `/wallet` `wallet.balance` with `ledgerBalance`.
- Check duplicate client retries use the same idempotency key.

// Made with Bob
