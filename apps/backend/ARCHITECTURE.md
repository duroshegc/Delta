# Delta Backend Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App]
        Web[Web Dashboard]
    end

    subgraph "API Gateway"
        Elysia[Elysia Server]
        Auth[Auth Middleware]
        RateLimit[Rate Limiter]
        Validate[Validator]
    end

    subgraph "Core Modules"
        Users[Users Module]
        Profiles[Profiles Module]
        Discovery[Discovery Module]
        Matches[Matches Module]
        Chat[Chat Module]
        Wallet[Wallet Module]
        LiveMatch[Live Match Module]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB)]
        Redis[(Redis)]
    end

    subgraph "External Services"
        ImageKit[ImageKit CDN]
        LiveKit[LiveKit Video]
        Apple[Apple IAP]
        Google[Google IAP]
        SMTP[Email SMTP]
    end

    Mobile --> Elysia
    Web --> Elysia
    Elysia --> Auth
    Auth --> RateLimit
    RateLimit --> Validate
    Validate --> Users
    Validate --> Profiles
    Validate --> Discovery
    Validate --> Matches
    Validate --> Chat
    Validate --> Wallet
    Validate --> LiveMatch

    Users --> MongoDB
    Profiles --> MongoDB
    Discovery --> MongoDB
    Matches --> MongoDB
    Chat --> MongoDB
    Wallet --> MongoDB
    LiveMatch --> MongoDB
    LiveMatch --> Redis

    Auth --> Redis
    RateLimit --> Redis

    Profiles --> ImageKit
    Chat --> ImageKit
    Wallet --> Apple
    Wallet --> Google
    LiveMatch --> LiveKit
    Users --> SMTP
```

## Module Dependencies

```mermaid
graph LR
    Auth[Auth Module] --> Users[Users Module]
    Users --> Profiles[Profiles Module]
    Profiles --> Media[Media Module]
    Profiles --> Discovery[Discovery Module]
    Discovery --> Likes[Likes Module]
    Likes --> Matches[Matches Module]
    Matches --> Chat[Chat Module]
    Users --> Wallet[Wallet Module]
    Wallet --> LiveMatch[Live Match Module]
    LiveMatch --> LiveKit[LiveKit Integration]
    LiveMatch --> Sessions[Session Management]
```

## Data Flow: User Registration to First Match

```mermaid
sequenceDiagram
    participant U as User
    participant A as Auth
    participant P as Profiles
    participant M as Media
    participant D as Discovery
    participant L as Likes
    participant MT as Matches

    U->>A: POST /auth/signup
    A->>A: Create user account
    A->>U: Send verification email
    U->>A: POST /auth/verify-email
    A->>A: Verify email
    U->>P: PUT /profiles
    P->>P: Create profile
    U->>M: POST /media/upload-auth
    M->>U: Return ImageKit auth
    U->>M: POST /media/complete
    M->>P: Link media to profile
    U->>D: GET /discovery/feed
    D->>D: Query candidates
    D->>U: Return profiles
    U->>L: POST /likes
    L->>L: Check mutual like
    alt Mutual Like
        L->>MT: Create match
        MT->>U: Send notification
    end
```

## Data Flow: Live Match Session

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant LM as Live Match
    participant R as Redis
    participant W as Wallet
    participant LK as LiveKit
    participant S as Session Manager

    U1->>W: Reserve tokens
    W->>W: Hold 10 DELT
    U1->>LM: POST /live-match/search
    LM->>R: Add to pool
    LM->>U1: Return ticket
    
    U2->>W: Reserve tokens
    W->>W: Hold 10 DELT
    U2->>LM: POST /live-match/search
    LM->>R: Add to pool
    LM->>R: Check for matches
    R->>LM: Match found!
    
    LM->>S: Create session
    S->>LK: Create room
    LM->>U1: Match found (WebSocket)
    LM->>U2: Match found (WebSocket)
    
    U1->>LK: Join room
    U2->>LK: Join room
    
    LK->>S: Both joined
    S->>W: Settle tokens
    W->>W: Charge 10 DELT each
    
    Note over U1,U2: Video chat in progress
    
    U1->>LK: Leave room
    U2->>LK: Leave room
    LK->>S: Session ended
    S->>S: Update duration
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o| PROFILES : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ MEDIA : owns
    USERS ||--|| WALLETS : has
    USERS ||--o{ WALLET_TRANSACTIONS : has
    
    PROFILES ||--o{ MEDIA : contains
    PROFILES ||--o{ LIKES : sends
    PROFILES ||--o{ LIKES : receives
    
    LIKES }o--|| MATCHES : creates
    MATCHES ||--|| CONVERSATIONS : has
    CONVERSATIONS ||--o{ MESSAGES : contains
    
    USERS ||--o{ LIVE_MATCH_TICKETS : creates
    LIVE_MATCH_TICKETS }o--|| LIVE_SESSIONS : creates
    LIVE_SESSIONS ||--o{ LIVE_SESSION_EVENTS : has
    
    USERS ||--o{ REPORTS : files
    USERS ||--o{ REPORTS : receives
    REPORTS }o--|| MODERATION_CASES : creates
    
    USERS {
        ObjectId _id
        string email
        string passwordHash
        string status
        date createdAt
    }
    
    PROFILES {
        ObjectId _id
        ObjectId userId
        string displayName
        GeoJSON location
        string intent
        array interests
        date createdAt
    }
    
    MATCHES {
        ObjectId _id
        array participants
        string status
        date matchedAt
    }
    
    WALLETS {
        ObjectId _id
        ObjectId userId
        number balance
        date updatedAt
    }
    
    LIVE_SESSIONS {
        ObjectId _id
        string sessionId
        array participants
        string status
        date startedAt
    }
```

## Token Economy Flow

```mermaid
graph TD
    A[User Purchases Tokens] --> B{Platform}
    B -->|iOS| C[Apple IAP]
    B -->|Android| D[Google IAP]
    C --> E[Verify Receipt]
    D --> E
    E --> F[Create Transaction]
    F --> G[Credit Wallet]
    
    G --> H{User Action}
    H -->|Super Like| I[Reserve 1 DELT]
    H -->|Profile Boost| J[Reserve 5 DELT]
    H -->|Live Match| K[Reserve 10 DELT]
    
    I --> L{Action Success}
    J --> L
    K --> L
    
    L -->|Yes| M[Settle Reservation]
    L -->|No| N[Release Reservation]
    
    M --> O[Deduct from Balance]
    N --> P[Return to Balance]
```

## Live Matching Pool Structure

```mermaid
graph TB
    subgraph "Redis Pools"
        P1["pool:us-west:serious:travel"]
        P2["pool:us-west:serious:music"]
        P3["pool:us-west:casual:travel"]
        P4["pool:eu-central:serious:travel"]
    end
    
    subgraph "User A"
        UA[Region: us-west<br/>Intent: serious<br/>Interests: travel, music]
    end
    
    subgraph "User B"
        UB[Region: us-west<br/>Intent: serious<br/>Interests: travel, food]
    end
    
    UA --> P1
    UA --> P2
    UB --> P1
    
    P1 -.Match Found.-> Match[Create Session]
```

## Middleware Stack

```mermaid
graph TD
    Request[Incoming Request] --> CORS[CORS Handler]
    CORS --> Logger[Request Logger]
    Logger --> Global[Global Rate Limit]
    Global --> Auth{Auth Required?}
    Auth -->|Yes| AuthMW[Auth Middleware]
    Auth -->|No| Validate
    AuthMW --> Role{Role Required?}
    Role -->|Yes| RoleMW[Role Middleware]
    Role -->|No| Validate
    RoleMW --> Validate[Validation Middleware]
    Validate --> Endpoint[Route Handler]
    Endpoint --> Response[Response]
    
    Endpoint -.Error.-> ErrorHandler[Error Handler]
    ErrorHandler --> ErrorResponse[Error Response]
```

## Geospatial Discovery Query

```mermaid
graph TD
    A[User Location] --> B[MongoDB 2dsphere Index]
    B --> C[Find Profiles Within Radius]
    C --> D[Apply Age Filter]
    D --> E[Apply Gender Filter]
    E --> F[Apply Intent Filter]
    F --> G[Exclude Already Liked/Matched]
    G --> H[Calculate Ranking Score]
    H --> I[Sort by Score]
    I --> J[Apply Pagination]
    J --> K[Return Results]
    
    subgraph "Ranking Factors"
        R1[Distance: 40%]
        R2[Activity: 20%]
        R3[Compatibility: 20%]
        R4[Profile Quality: 10%]
        R5[Freshness: 10%]
    end
    
    H --> R1
    H --> R2
    H --> R3
    H --> R4
    H --> R5
```

## Session State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: Match Found
    Created --> Waiting: First User Joins
    Waiting --> Active: Second User Joins
    Waiting --> Timeout: 30s Elapsed
    Active --> Completed: Both Users Leave
    Active --> Timeout: 1 Hour Elapsed
    Created --> Cancelled: User Cancels
    Timeout --> [*]
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Waiting
        Refund if timeout
    end note
    
    note right of Active
        Charge both users
    end note
```

## Error Handling Flow

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}
    B -->|Validation| C[ValidationError 400]
    B -->|Auth| D[AuthenticationError 401]
    B -->|Permission| E[AuthorizationError 403]
    B -->|Not Found| F[NotFoundError 404]
    B -->|Conflict| G[ConflictError 409]
    B -->|Rate Limit| H[RateLimitError 429]
    B -->|Database| I[DatabaseError 500]
    B -->|External| J[ExternalServiceError 502]
    B -->|Unknown| K[InternalServerError 500]
    
    C --> L[Log Error]
    D --> L
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M{Environment}
    M -->|Development| N[Return Stack Trace]
    M -->|Production| O[Return Generic Message]
    
    N --> P[Send Response]
    O --> P
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/CloudFlare]
    end
    
    subgraph "Application Servers"
        API1[Bun Server 1]
        API2[Bun Server 2]
        API3[Bun Server 3]
    end
    
    subgraph "Database Cluster"
        Primary[(MongoDB Primary)]
        Secondary1[(MongoDB Secondary)]
        Secondary2[(MongoDB Secondary)]
    end
    
    subgraph "Cache Layer"
        Redis1[(Redis Primary)]
        Redis2[(Redis Replica)]
    end
    
    subgraph "External Services"
        ImageKit[ImageKit CDN]
        LiveKit[LiveKit SFU]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Primary
    API2 --> Primary
    API3 --> Primary
    
    Primary --> Secondary1
    Primary --> Secondary2
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    
    Redis1 --> Redis2
    
    API1 --> ImageKit
    API2 --> ImageKit
    API3 --> ImageKit
    
    API1 --> LiveKit
    API2 --> LiveKit
    API3 --> LiveKit
```

## Performance Optimization Strategy

### Database Indexes
- **Geospatial**: 2dsphere index on `profiles.location`
- **Compound**: `(userId, createdAt)` for user-specific queries
- **TTL**: Automatic expiration for sessions and tickets
- **Unique**: Email, phone, fileId for data integrity

### Caching Strategy
- **Session Data**: Redis (fast access)
- **Rate Limits**: Redis (sliding window)
- **Live Match Pools**: Redis (real-time matching)
- **User Preferences**: Redis (frequently accessed)

### Query Optimization
- **Pagination**: Cursor-based for large datasets
- **Projection**: Only fetch required fields
- **Aggregation**: Pipeline optimization for complex queries
- **Connection Pooling**: Reuse database connections

### Scalability Considerations
- **Horizontal Scaling**: Stateless API servers
- **Database Sharding**: By user ID or region
- **CDN**: Static assets via ImageKit
- **WebSocket**: Separate server for real-time features
- **Background Jobs**: Queue system for async tasks

---

This architecture supports:
- ✅ High availability with load balancing
- ✅ Horizontal scalability
- ✅ Real-time features via WebSocket
- ✅ Efficient geospatial queries
- ✅ Secure payment processing
- ✅ Content moderation pipeline
- ✅ Comprehensive monitoring