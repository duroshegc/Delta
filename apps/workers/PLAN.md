# Workers Development Plan

**Status**: 🟡 Waiting for Backend  
**Priority**: 3 (After Backend Core + Mobile Testing)  
**Dependencies**: Backend API, MongoDB schemas, Redis structures, LiveKit integration

---

## Overview

Worker processes handle asynchronous operations for Delta: live matching pool scanning, candidate pairing, token reservations, LiveKit room creation, session timeouts, billing settlement, moderation automation, and analytics aggregation.

---

## Architecture Strategy

### Phase 0-1: Combined Worker
Single worker process running all loops - simplifies deployment and debugging.

### Phase 2+: Separated Workers
Independent worker services for scaling and isolation:
- Pool Scanner Worker
- Candidate Matcher Worker
- Token Reservation Worker
- LiveKit Room Worker
- Timeout Worker
- Settlement Worker
- Moderation Worker
- Analytics Worker

---

## Phase 1: Foundation & Shared Infrastructure

### 1.1 Project Setup
- [ ] Initialize Bun worker project
- [ ] Share types/schemas with backend (monorepo packages)
- [ ] MongoDB connection setup
- [ ] Upstash Redis connection setup
- [ ] LiveKit SDK setup
- [ ] Structured logging
- [ ] Health check/heartbeat system

### 1.2 Shared Worker Utilities
- [ ] Distributed lock helpers (Redis)
- [ ] Idempotency key management
- [ ] Retry logic with exponential backoff
- [ ] Dead letter queue handling
- [ ] Worker state persistence
- [ ] Graceful shutdown handling

### 1.3 Queue Infrastructure
- [ ] Redis queue abstractions
- [ ] Job priority handling
- [ ] Job timeout management
- [ ] Failed job tracking
- [ ] Queue metrics (depth, lag, throughput)

---

## Phase 2: Live Matching Workers

### 2.1 Pool Scanner Worker
**Purpose**: Scan Redis pool sorted sets and identify candidates ready for matching

- [ ] Pool key enumeration (region, intent, interest, language, trust)
- [ ] Sorted set scanning (ZRANGE by score)
- [ ] Ticket age calculation
- [ ] Priority boost handling
- [ ] Pool expansion logic (15s → 45s → 90s+)
- [ ] Candidate pair proposals
- [ ] Lock acquisition for processing tickets
- [ ] Metrics: tickets scanned, pairs proposed, scan latency

**Loop Frequency**: 1-2 seconds per pool

**Scaling**: Shard by region/interest, multiple instances with pool ownership

### 2.2 Candidate Matcher Worker
**Purpose**: Validate candidate pairs and apply matching rules

- [ ] Receive pair proposals from scanner
- [ ] Hard reject filters:
  - [ ] Block/report checks
  - [ ] Trust score restrictions
  - [ ] Age/preference policy
  - [ ] Already in call check
  - [ ] Delt eligibility check
- [ ] Soft scoring calculation (Section 12.6):
  - [ ] Interest overlap score
  - [ ] Intent match score
  - [ ] Language compatibility
  - [ ] Preference fit
  - [ ] Location proximity
  - [ ] Wait time boost
  - [ ] Report risk penalty
  - [ ] Recent pair penalty
- [ ] User locking (both users)
- [ ] Approved pair handoff to reservation worker
- [ ] Metrics: pairs evaluated, hard rejects, soft rejects, approvals

**Loop Frequency**: Event-driven from scanner queue

**Scaling**: Horizontal with distributed locks

### 2.3 Token Reservation Worker
**Purpose**: Reserve delt tokens before room creation

- [ ] Receive approved pairs
- [ ] Calculate required reserve:
  ```
  reserve = connectionFee + (minMinutes * perMinuteRate)
  ```
- [ ] Check wallet balance (both users)
- [ ] Create token_reservations in MongoDB
- [ ] Increment wallet.reservedBalance
- [ ] Write reservation transaction to ledger
- [ ] Use idempotency keys
- [ ] Handle insufficient balance gracefully
- [ ] Handoff to room creation worker
- [ ] Metrics: reservations created, insufficient balance, reservation failures

**Loop Frequency**: Event-driven from matcher queue

**Scaling**: Horizontal with idempotency

### 2.4 LiveKit Room Worker
**Purpose**: Create LiveKit rooms and generate participant tokens

- [ ] Receive reserved pairs
- [ ] Create live_sessions document in MongoDB
- [ ] Generate stable room name: `delta-live-{sessionId}`
- [ ] Create LiveKit room (idempotent)
- [ ] Generate participant access tokens (JWT)
- [ ] Set token expiry (20 seconds for join)
- [ ] Notify both users via WebSocket
- [ ] Update session status: `waiting_for_join`
- [ ] Metrics: rooms created, token generation, notification success

**Loop Frequency**: Event-driven from reservation queue

**Scaling**: Horizontal with room name idempotency

---

## Phase 3: Session Management Workers

### 3.1 Timeout Worker
**Purpose**: Handle join timeouts and abandoned sessions

- [ ] Scan sessions in `waiting_for_join` status
- [ ] Check join deadline (20 seconds)
- [ ] Handle scenarios:
  - [ ] Both users joined → no action
  - [ ] One user joined, partner timeout → close room, refund joiner
  - [ ] Neither joined → close room, release both reservations
- [ ] Update session status and endReason
- [ ] Release user locks
- [ ] Return eligible users to pool (if desired)
- [ ] Apply timeout penalties (trust score)
- [ ] Metrics: timeouts detected, rooms closed, refunds issued

**Loop Frequency**: Every 5-10 seconds

**Scaling**: Single instance or leader election

### 3.2 Settlement Worker
**Purpose**: Calculate final charges and settle delt after sessions end

- [ ] Listen to LiveKit webhooks (participant left, room ended)
- [ ] Process live_session_events
- [ ] Calculate billable duration:
  ```
  billable = max(0, duration - gracePeriod)
  actualCost = connectionFee + (billableMinutes * perMinuteRate)
  ```
- [ ] Debit wallet (both users)
- [ ] Release unused reservation
- [ ] Write settlement transactions to ledger
- [ ] Update session billing status
- [ ] Handle edge cases:
  - [ ] Disconnects during grace period
  - [ ] Network failures
  - [ ] Disputed charges
- [ ] Idempotency for webhook replay
- [ ] Metrics: sessions settled, charges applied, refunds, settlement errors

**Loop Frequency**: Event-driven from webhooks + periodic reconciliation

**Scaling**: Horizontal with idempotency keys

---

## Phase 4: Moderation & Safety Workers

### 4.1 Moderation Worker
**Purpose**: Process reports, update trust scores, create moderation cases

- [ ] Listen to report queue
- [ ] Categorize report severity
- [ ] Automated actions for low-risk reports:
  - [ ] Spam detection
  - [ ] Duplicate reports
  - [ ] Clear false positives
- [ ] Create moderation_cases for human review:
  - [ ] Severe categories (harassment, explicit content)
  - [ ] Repeated offenders
  - [ ] High-confidence violations
- [ ] Update trust scores based on reports
- [ ] Apply automatic restrictions:
  - [ ] Shadow restrict
  - [ ] Disable live matching
  - [ ] Require verification
- [ ] Notify dashboard for case assignment
- [ ] Metrics: reports processed, cases created, auto-actions, escalations

**Loop Frequency**: Event-driven from report submissions

**Scaling**: Horizontal with case deduplication

### 4.2 Trust Score Worker
**Purpose**: Recalculate trust scores based on behavior signals

- [ ] Process trust score events:
  - [ ] Profile completion (+5)
  - [ ] Verification (+15)
  - [ ] Good session feedback (+1 to +3)
  - [ ] Report received (-5 to -25)
  - [ ] Confirmed violation (-30 to -80)
  - [ ] Repeated disconnects (-5 to -15)
  - [ ] Chargeback/fraud (-20 to -50)
- [ ] Update trust_scores collection
- [ ] Adjust risk level (new, trusted, verified, restricted)
- [ ] Trigger pool reassignment if trust band changes
- [ ] Metrics: score updates, band changes, restrictions applied

**Loop Frequency**: Event-driven + daily recalculation

**Scaling**: Horizontal with user-level locking

---

## Phase 5: Analytics & Aggregation Workers

### 5.1 Analytics Worker
**Purpose**: Aggregate raw events into dashboard metrics

- [ ] Process analytics_events collection
- [ ] Aggregate by time windows (hourly, daily)
- [ ] Calculate metrics:
  - [ ] Growth: DAU, MAU, signups, verified users
  - [ ] Dating funnel: views, likes, matches, chats
  - [ ] Live funnel: searches, wait time, success rate, duration
  - [ ] Revenue: purchases, spend, refunds
  - [ ] Safety: reports per 1K users, ban rate
- [ ] Write to dashboard_metrics collection
- [ ] Flush Redis counters to MongoDB
- [ ] Data retention cleanup (old events)
- [ ] Metrics: events processed, aggregations created, processing lag

**Loop Frequency**: Hourly for real-time metrics, daily for historical

**Scaling**: Single instance or time-window sharding

### 5.2 Cleanup Worker
**Purpose**: Maintain data hygiene and enforce retention policies

- [ ] Expire old Redis keys (tickets, locks, presence)
- [ ] Archive old analytics events
- [ ] Clean up abandoned sessions
- [ ] Remove expired media (deleted accounts)
- [ ] Prune old audit logs (per retention policy)
- [ ] Database index maintenance
- [ ] Metrics: records cleaned, storage reclaimed

**Loop Frequency**: Daily or weekly

**Scaling**: Single instance with scheduled runs

---

## Worker Start Commands

### Combined Worker (Phase 0-1)
```bash
bun run src/worker.ts
```

### Separated Workers (Phase 2+)
```bash
# Matching pipeline
bun run src/workers/pool-scanner.ts
bun run src/workers/candidate-matcher.ts
bun run src/workers/token-reservation.ts
bun run src/workers/livekit-room.ts

# Session management
bun run src/workers/timeout.ts
bun run src/workers/settlement.ts

# Safety & analytics
bun run src/workers/moderation.ts
bun run src/workers/analytics.ts
bun run src/workers/cleanup.ts
```

---

## Worker Configuration

### Environment Variables
```env
APP_ENV=production
WORKER_TYPE=all  # or specific: pool_scanner, matcher, etc.
WORKER_ID=worker-1

# Database
MONGODB_URI=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# LiveKit
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Worker Settings
POOL_SCAN_INTERVAL_MS=2000
TIMEOUT_CHECK_INTERVAL_MS=5000
SETTLEMENT_BATCH_SIZE=50
LOCK_TTL_SECONDS=10
MAX_RETRIES=3
```

### Worker Health Checks
```typescript
// Each worker exposes health endpoint
GET /health
{
  "status": "healthy",
  "worker": "pool_scanner",
  "uptime": 3600,
  "lastProcessed": "2026-05-02T04:00:00Z",
  "queueDepth": 42,
  "errorRate": 0.001
}
```

---

## Idempotency & Safety Rules

### Critical Rules
1. **Every job has deterministic idempotency key**
   - Format: `{operation}:{entityId}:{timestamp}`
   - Example: `reserve:session_123:1760000000`

2. **Locks are short-lived and refreshed**
   - Default TTL: 10 seconds
   - Refresh every 5 seconds while processing
   - Release immediately on completion

3. **MongoDB state checks before updates**
   ```typescript
   // Always check current state
   const result = await sessions.updateOne(
     { _id: sessionId, status: 'waiting_for_join' },
     { $set: { status: 'active' } }
   );
   if (result.modifiedCount === 0) {
     // State already changed, skip
   }
   ```

4. **Wallet operations never run twice**
   - Check idempotency key in wallet_transactions
   - Use MongoDB transactions for multi-document updates

5. **Failed jobs retry with backoff**
   - Max retries: 3
   - Backoff: 1s, 5s, 30s
   - Move to dead letter queue after max retries

---

## Monitoring & Observability

### Key Metrics
- **Pool Scanner**: tickets/sec, scan latency, pool depths
- **Matcher**: pairs/sec, reject rate, scoring latency
- **Reservation**: reservations/sec, insufficient balance rate
- **Room Creation**: rooms/sec, token generation latency
- **Timeout**: timeout rate, refund rate
- **Settlement**: settlement latency, charge errors
- **Moderation**: reports/sec, case creation rate
- **Analytics**: event processing lag, aggregation latency

### Alerts
- [ ] Worker process down
- [ ] Queue depth exceeds threshold
- [ ] Error rate > 1%
- [ ] Processing lag > 30 seconds
- [ ] Settlement failures
- [ ] Lock acquisition failures

---

## Testing Strategy

### Unit Tests
- [ ] Matching score calculation
- [ ] Pool key generation
- [ ] Reservation math
- [ ] Settlement calculation
- [ ] Trust score adjustments

### Integration Tests
- [ ] End-to-end matching flow
- [ ] Timeout handling
- [ ] Settlement with webhooks
- [ ] Idempotency verification
- [ ] Lock behavior under contention

### Load Tests
- [ ] 1000 concurrent pool entries
- [ ] Room creation burst (100/sec)
- [ ] Settlement processing (500/sec)
- [ ] Worker failure recovery

---

## Success Criteria

- [ ] Matching completes in < 30 seconds for 90% of users
- [ ] Zero duplicate room creations
- [ ] Zero double charges
- [ ] Settlement completes within 5 minutes of session end
- [ ] Worker uptime > 99.9%
- [ ] Queue lag < 10 seconds under normal load
- [ ] All failed jobs move to dead letter queue
- [ ] Graceful shutdown without data loss

---

## Development Iterations

### Iteration 1: After Backend Phase 7
- Pool scanner, matcher, reservation, room creation workers
- Test with manual ticket creation

### Iteration 2: After Mobile Live Match UI
- Timeout and settlement workers
- End-to-end live matching flow

### Iteration 3: After Backend Phase 8
- Moderation and trust score workers

### Iteration 4: Production Scaling
- Separate all worker types
- Regional sharding
- Advanced monitoring

---

**Reference**: See `docs/Delta_Developer_Documentation.docx` Sections 12-13 for detailed worker architecture and matching pool design.