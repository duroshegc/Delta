# Backend Implementation Plan

## Overview
This plan outlines the implementation of four critical backend features for the Delta platform:
1. Better-auth configuration with MongoDB adapter
2. Enhanced error handling middleware
3. Request validation with Zod schemas
4. Rate limiting with Upstash Redis

## Current State Analysis

### Existing Infrastructure
- ✅ Elysia.js framework with TypeScript
- ✅ MongoDB connection with connection pooling
- ✅ Upstash Redis integration
- ✅ Pino logger configured
- ✅ Environment validation with Zod
- ✅ Basic error handling in [`src/index.ts`](src/index.ts:46-82)
- ✅ CORS and Swagger documentation
- ✅ Database collections and indexes initialized

### Dependencies Already Installed
- `better-auth@^1.6.9` - Authentication library
- `zod@^4.4.2` - Schema validation
- `@upstash/redis@^1.37.0` - Redis client
- `elysia@^1.4.28` - Web framework
- `mongodb@^7.2.0` - Database driver

## Implementation Strategy

### 1. Better-auth Configuration with MongoDB Adapter

**Goal**: Implement secure authentication with session management, social OAuth, and MongoDB persistence.

**Components to Create**:
- [`src/config/auth.ts`](src/config/auth.ts) - Better-auth configuration
- [`src/lib/auth-adapter.ts`](src/lib/auth-adapter.ts) - Custom MongoDB adapter
- [`src/modules/auth/routes.ts`](src/modules/auth/routes.ts) - Auth endpoints
- [`src/modules/auth/schemas.ts`](src/modules/auth/schemas.ts) - Auth validation schemas
- [`src/types/auth.ts`](src/types/auth.ts) - Auth type definitions

**Features**:
- Email/password authentication
- Social OAuth (Google, Apple) - prepared for future
- Session management with Redis
- JWT token generation
- Password reset flow
- Email verification
- MongoDB adapter for user/session storage

**Database Collections**:
- `users` - Already exists, will be used for auth
- `sessions` - New collection for session management
- `verification_tokens` - New collection for email verification

### 2. Enhanced Error Handling Middleware

**Goal**: Provide consistent, informative error responses with proper logging and error tracking.

**Components to Create**:
- [`src/middleware/error-handler.ts`](src/middleware/error-handler.ts) - Main error handler
- [`src/utils/errors.ts`](src/utils/errors.ts) - Custom error classes
- [`src/types/errors.ts`](src/types/errors.ts) - Error type definitions

**Error Classes**:
```typescript
- AppError (base class)
  - ValidationError (400)
  - AuthenticationError (401)
  - AuthorizationError (403)
  - NotFoundError (404)
  - ConflictError (409)
  - RateLimitError (429)
  - InternalServerError (500)
  - DatabaseError (500)
  - ExternalServiceError (502)
```

**Features**:
- Structured error responses
- Error code mapping
- Stack trace in development only
- Error logging with context
- Error metrics tracking
- User-friendly error messages

### 3. Request Validation with Zod Schemas

**Goal**: Validate all incoming requests with type-safe schemas and provide clear validation errors.

**Components to Create**:
- [`src/middleware/validate.ts`](src/middleware/validate.ts) - Validation middleware factory
- [`src/schemas/common.ts`](src/schemas/common.ts) - Reusable validation schemas
- [`src/schemas/user.ts`](src/schemas/user.ts) - User-related schemas
- [`src/schemas/profile.ts`](src/schemas/profile.ts) - Profile-related schemas

**Common Schemas**:
- Pagination (page, limit, sort)
- ObjectId validation
- Email validation
- Phone number validation
- Coordinates validation
- Date range validation
- File upload validation

**Validation Strategy**:
- Body validation
- Query parameter validation
- Path parameter validation
- Header validation
- File upload validation
- Custom validation rules

### 4. Rate Limiting with Upstash Redis

**Goal**: Protect API endpoints from abuse with flexible, Redis-backed rate limiting.

**Components to Create**:
- [`src/middleware/rate-limit.ts`](src/middleware/rate-limit.ts) - Rate limiting middleware
- [`src/lib/rate-limiter.ts`](src/lib/rate-limiter.ts) - Rate limiter implementation
- [`src/config/rate-limits.ts`](src/config/rate-limits.ts) - Rate limit configurations

**Rate Limit Tiers**:
```typescript
- Global: 1000 requests/hour per IP
- Authentication: 5 requests/15min per IP
- API endpoints: 100 requests/15min per user
- Media upload: 20 requests/hour per user
- Live matching: 50 requests/hour per user
- Admin endpoints: 500 requests/hour per admin
```

**Features**:
- Sliding window algorithm
- Per-IP and per-user limits
- Custom limits per endpoint
- Rate limit headers (X-RateLimit-*)
- Graceful degradation
- Whitelist support for trusted IPs

## Implementation Architecture

### Middleware Stack Order
```
1. CORS
2. Request logging
3. Rate limiting (global)
4. Authentication (optional)
5. Authorization (optional)
6. Validation
7. Route handler
8. Error handling
```

### File Structure
```
apps/backend/src/
├── config/
│   ├── auth.ts          # Better-auth config
│   ├── rate-limits.ts   # Rate limit configs
│   └── ...existing
├── lib/
│   ├── auth-adapter.ts  # MongoDB adapter
│   ├── rate-limiter.ts  # Rate limiter
│   └── ...existing
├── middleware/
│   ├── error-handler.ts # Error handling
│   ├── rate-limit.ts    # Rate limiting
│   ├── validate.ts      # Validation
│   └── auth.ts          # Auth middleware
├── modules/
│   └── auth/
│       ├── routes.ts    # Auth routes
│       └── schemas.ts   # Auth schemas
├── schemas/
│   ├── common.ts        # Common schemas
│   ├── user.ts          # User schemas
│   └── profile.ts       # Profile schemas
├── types/
│   ├── auth.ts          # Auth types
│   └── errors.ts        # Error types
└── utils/
    └── errors.ts        # Error classes
```

## Integration Points

### 1. Better-auth Integration
- Mount auth routes at `/api/auth/*`
- Use MongoDB adapter for persistence
- Store sessions in Redis for fast access
- Integrate with existing user collection

### 2. Error Handling Integration
- Replace basic error handler in [`src/index.ts`](src/index.ts:46-82)
- Add error tracking hooks
- Log all errors with context
- Return consistent error format

### 3. Validation Integration
- Apply to all route handlers
- Validate before business logic
- Return clear validation errors
- Type-safe request handling

### 4. Rate Limiting Integration
- Apply global rate limit to all routes
- Add specific limits to sensitive endpoints
- Track rate limit metrics
- Provide rate limit feedback

## Environment Variables

Additional variables needed in [`.env.example`](.env.example):

```bash
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GLOBAL_MAX=1000
RATE_LIMIT_GLOBAL_WINDOW=3600

# Session Management
SESSION_MAX_AGE=604800  # 7 days in seconds
SESSION_UPDATE_AGE=86400  # 1 day in seconds
```

## Testing Strategy

### Unit Tests
- Error class instantiation
- Validation schema tests
- Rate limiter logic
- Auth adapter methods

### Integration Tests
- Auth flow (signup, login, logout)
- Rate limiting behavior
- Error handling responses
- Validation error messages

### Manual Testing
- Test auth endpoints with Swagger
- Verify rate limits with multiple requests
- Check error responses in different scenarios
- Validate request/response schemas

## Migration Strategy

### Phase 1: Foundation (No Breaking Changes)
1. Create error classes and middleware
2. Create validation middleware
3. Create rate limiting middleware
4. Add to codebase without applying

### Phase 2: Better-auth Setup
1. Configure Better-auth with MongoDB
2. Create auth routes
3. Test authentication flow
4. Document auth endpoints

### Phase 3: Integration
1. Apply error handling middleware
2. Apply rate limiting to routes
3. Add validation to existing routes
4. Update documentation

### Phase 4: Testing & Refinement
1. Test all endpoints
2. Adjust rate limits based on usage
3. Refine error messages
4. Update API documentation

## Success Criteria

- ✅ Better-auth successfully authenticates users
- ✅ Sessions persist in MongoDB and Redis
- ✅ All errors return consistent format
- ✅ Rate limits prevent abuse
- ✅ Validation catches invalid requests
- ✅ No breaking changes to existing functionality
- ✅ All tests pass
- ✅ Documentation is complete

## Timeline Estimate

- Better-auth setup: 2-3 hours
- Error handling: 1-2 hours
- Validation middleware: 1-2 hours
- Rate limiting: 1-2 hours
- Integration & testing: 2-3 hours
- Documentation: 1 hour

**Total: 8-13 hours**

## Questions for Review

1. **Authentication Strategy**: Should we implement social OAuth (Google, Apple) now or prepare the structure for future implementation?

2. **Rate Limiting**: Are the proposed rate limits appropriate for your expected traffic? Should we have different tiers for free vs. premium users?

3. **Error Handling**: Should we integrate with an error tracking service (e.g., Sentry) or keep it simple with logging only?

4. **Validation**: Should we validate all existing endpoints immediately or gradually add validation as we develop new features?

5. **Session Storage**: Should sessions be stored in both MongoDB (persistence) and Redis (fast access), or Redis only with periodic MongoDB backups?

6. **Breaking Changes**: Are you okay with the middleware stack order, or do you have specific requirements for middleware execution?

## Next Steps

Once you approve this plan, I'll switch to Code mode to implement:
1. All middleware components
2. Better-auth configuration
3. Validation schemas
4. Error classes
5. Integration with existing code
6. Tests and documentation

Please review and let me know if you'd like any adjustments to this plan!