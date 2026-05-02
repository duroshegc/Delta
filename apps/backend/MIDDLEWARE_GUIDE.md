# Delta Backend Middleware Guide

## Overview

This guide documents the middleware implementation for the Delta API backend, including error handling, request validation, rate limiting, and authentication.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Request Validation](#request-validation)
3. [Rate Limiting](#rate-limiting)
4. [Authentication](#authentication)
5. [Usage Examples](#usage-examples)

---

## Error Handling

### Custom Error Classes

Located in `src/utils/errors.ts`, we provide a comprehensive set of error classes:

```typescript
// Base error class
AppError

// Specific error types
ValidationError (400)
AuthenticationError (401)
AuthorizationError (403)
NotFoundError (404)
ConflictError (409)
RateLimitError (429)
InternalServerError (500)
DatabaseError (500)
ExternalServiceError (502)
BadRequestError (400)
```

### Usage

```typescript
import { NotFoundError, ValidationError } from "./utils/errors";

// Throw a not found error
throw new NotFoundError("User");

// Throw a validation error with details
throw new ValidationError("Invalid input", [
  { field: "email", message: "Invalid email format" }
]);
```

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "User not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/123",
  "details": {},
  "stack": "..." // Only in development
}
```

### Error Handler Middleware

The error handler is automatically applied to all routes:

```typescript
import { errorHandler } from "./middleware/error-handler";

app.use(errorHandler);
```

---

## Request Validation

### Validation Middleware

Located in `src/middleware/validate.ts`, provides Zod-based validation:

```typescript
import { validate } from "./middleware/validate";
import { z } from "zod";

// Define schema
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Apply validation
app.post("/users", async ({ body }) => {
  await validate({ body: userSchema })({ body });
  // body is now validated
});
```

### Common Validation Schemas

Located in `src/schemas/common.ts`:

```typescript
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  objectIdSchema,
  paginationSchema,
  coordinatesSchema,
  geoPointSchema,
} from "./schemas/common";
```

### Validation Options

```typescript
validate({
  body: bodySchema,      // Validate request body
  query: querySchema,    // Validate query parameters
  params: paramsSchema,  // Validate path parameters
  headers: headerSchema, // Validate headers
});
```

---

## Rate Limiting

### Rate Limiter Implementation

Uses Upstash Redis with sliding window algorithm for accurate rate limiting.

### Configuration

Located in `src/config/rate-limits.ts`:

```typescript
export const RATE_LIMITS = {
  GLOBAL: { max: 1000, window: 3600 },        // 1000 req/hour
  AUTH: { max: 5, window: 900 },              // 5 req/15min
  PASSWORD_RESET: { max: 3, window: 3600 },   // 3 req/hour
  API: { max: 100, window: 900 },             // 100 req/15min
  MEDIA_UPLOAD: { max: 20, window: 3600 },    // 20 req/hour
  LIVE_MATCH: { max: 50, window: 3600 },      // 50 req/hour
  MESSAGING: { max: 200, window: 3600 },      // 200 req/hour
  DISCOVERY: { max: 500, window: 3600 },      // 500 req/hour
  ADMIN: { max: 500, window: 3600 },          // 500 req/hour
  REPORTS: { max: 10, window: 3600 },         // 10 req/hour
};
```

### Usage

```typescript
import { rateLimitMiddleware, rateLimit } from "./middleware/rate-limit";

// Use predefined rate limits
app.post("/auth/signin", async (context) => {
  await rateLimitMiddleware.auth()(context);
  // Handle signin
});

// Custom rate limit
app.post("/custom", async (context) => {
  await rateLimit({
    config: { max: 10, window: 60 },
    keyGenerator: (ctx) => `custom:${ctx.user.id}`,
  })(context);
  // Handle request
});
```

### Rate Limit Headers

All rate-limited responses include headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
Retry-After: 60 (when limit exceeded)
```

### Rate Limit Types

```typescript
// Global rate limit (IP-based)
rateLimitMiddleware.global()

// Authentication endpoints
rateLimitMiddleware.auth()

// Password reset
rateLimitMiddleware.passwordReset()

// Email verification
rateLimitMiddleware.emailVerification()

// API endpoints (user-based)
rateLimitMiddleware.api()

// Media upload
rateLimitMiddleware.mediaUpload()

// Live matching
rateLimitMiddleware.liveMatch()

// Messaging
rateLimitMiddleware.messaging()

// Profile discovery
rateLimitMiddleware.discovery()

// Admin endpoints
rateLimitMiddleware.admin()

// Report submission
rateLimitMiddleware.reports()
```

---

## Authentication

### MongoDB Adapter

Located in `src/lib/auth-adapter.ts`, provides MongoDB persistence for authentication:

```typescript
import { mongoAdapter } from "./lib/auth-adapter";

// User operations
await mongoAdapter.createUser(userData);
await mongoAdapter.getUser(userId);
await mongoAdapter.getUserByEmail(email);
await mongoAdapter.updateUser(userId, data);
await mongoAdapter.deleteUser(userId);

// Session operations
await mongoAdapter.createSession(sessionData);
await mongoAdapter.getSession(token);
await mongoAdapter.updateSession(token, data);
await mongoAdapter.deleteSession(token);
await mongoAdapter.deleteUserSessions(userId);

// Verification tokens
await mongoAdapter.createVerificationToken(data);
await mongoAdapter.useVerificationToken(identifier, token);
```

### Database Collections

Authentication uses three MongoDB collections:

1. **users** - User accounts
   - Indexes: email (unique), phone (unique), status, createdAt

2. **sessions** - Active sessions
   - Indexes: token (unique), userId, expiresAt (TTL)

3. **verification_tokens** - Email/phone verification
   - Indexes: identifier+token, expiresAt (TTL)

### Authentication Routes

Located in `src/modules/auth/routes.ts`:

```
POST /auth/signup/email       - Sign up with email
POST /auth/signin/email       - Sign in with email
POST /auth/signout            - Sign out
POST /auth/password/reset-request - Request password reset
GET  /auth/session            - Get current session
```

### Authentication Schemas

Located in `src/modules/auth/schemas.ts`:

```typescript
import {
  signUpEmailSchema,
  signInEmailSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  changePasswordSchema,
} from "./modules/auth/schemas";
```

---

## Usage Examples

### Complete Route with All Middleware

```typescript
import { Elysia, t } from "elysia";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { NotFoundError } from "./utils/errors";

const app = new Elysia()
  .post(
    "/api/users",
    async ({ body }) => {
      // Rate limiting is applied
      // Validation is applied via Elysia's built-in validation
      // Error handling is automatic
      
      // Your business logic
      const user = await createUser(body);
      
      if (!user) {
        throw new NotFoundError("User");
      }
      
      return {
        success: true,
        data: user,
      };
    },
    {
      // Built-in Elysia validation
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.String(),
      }),
      // Apply rate limiting before handler
      beforeHandle: rateLimitMiddleware.api(),
      // Swagger documentation
      detail: {
        tags: ["Users"],
        summary: "Create user",
        description: "Create a new user account",
      },
    }
  );
```

### Testing Rate Limits

```bash
# Test rate limit
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/signin/email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
done

# After 5 requests, you'll get:
# {
#   "success": false,
#   "error": "RateLimitError",
#   "message": "Too many authentication attempts",
#   "statusCode": 429,
#   "details": { "retryAfter": 900 }
# }
```

### Testing Error Handling

```bash
# Test validation error
curl -X POST http://localhost:3000/auth/signup/email \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"short"}'

# Response:
# {
#   "success": false,
#   "error": "ValidationError",
#   "message": "Request validation failed",
#   "statusCode": 400,
#   "details": [
#     { "field": "email", "message": "Invalid email" },
#     { "field": "password", "message": "Must be at least 8 characters" }
#   ]
# }
```

### Custom Validation

```typescript
import { z } from "zod";
import { validate } from "./middleware/validate";

const createProfileSchema = z.object({
  bio: z.string().min(1).max(500),
  age: z.number().int().min(18).max(100),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
});

app.post("/profiles", async ({ body }) => {
  await validate({ body: createProfileSchema })({ body });
  // Create profile
});
```

---

## Best Practices

### 1. Error Handling

- Always use custom error classes for expected errors
- Let unexpected errors bubble up to the error handler
- Provide meaningful error messages
- Include relevant details in error responses

### 2. Validation

- Validate all user input
- Use common schemas for consistency
- Provide clear validation messages
- Validate early in the request lifecycle

### 3. Rate Limiting

- Apply appropriate limits based on endpoint sensitivity
- Use user-based limits for authenticated endpoints
- Use IP-based limits for public endpoints
- Monitor rate limit metrics

### 4. Authentication

- Store sessions in both MongoDB (persistence) and Redis (fast access)
- Use TTL indexes for automatic cleanup
- Implement proper session rotation
- Hash passwords with bcrypt/argon2

---

## Environment Variables

Required environment variables for middleware:

```bash
# Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Authentication
BETTER_AUTH_SECRET=your_secret_min_32_chars
BETTER_AUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=delta

# Application
APP_ENV=development
LOG_LEVEL=info
```

---

## Monitoring and Debugging

### Logging

All middleware operations are logged using Pino:

```typescript
// Error logs
logger.error({ error, userId }, "Operation failed");

// Info logs
logger.info({ userId }, "User created");

// Debug logs (development only)
logger.debug({ data }, "Processing request");
```

### Rate Limit Monitoring

```typescript
import { rateLimiter } from "./lib/rate-limiter";

// Check rate limit status without incrementing
const status = await rateLimiter.getStatus(
  "user:123",
  RATE_LIMITS.API
);

// Reset rate limit (admin/testing)
await rateLimiter.reset("user:123");
```

---

## Made with Bob