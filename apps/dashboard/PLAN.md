# Dashboard Development Plan

**Status**: 🟢 Dashboard plan implemented in frontend  
**Priority**: 4 (After Backend + Mobile + Workers Core)  
**Dependencies**: Backend Admin API, MongoDB data, Analytics aggregations

**Implementation note**: The dashboard now includes every planned admin surface in the Next.js frontend with typed API adapters pointed at the deployed backend. Live backend responses are required by default; mock data can still be enabled explicitly for isolated local UI development while remaining backend endpoints reach parity.

---

## Overview

Next.js web application for internal moderation, analytics, user management, live session review, wallet support, and operational monitoring. Provides tools for Trust & Safety team, moderators, support agents, and admins.

## Current Implementation Coverage

- [x] Authentication shell, MFA code capture, session cookie timeout, protected middleware, and bearer-token API client
- [x] Role-aware dashboard shell, navigation, breadcrumbs, responsive desktop/tablet/mobile layout, and Vercel deployment config
- [x] Overview metrics, trends, geographic distribution, top interests, active pool depths, worker health, API latency, queue lag, and safety alerts
- [x] User search, filters, sorting, pagination, detail review, restrictions, wallet summary, reports, live history, devices, notes, audit, and guarded actions
- [x] Report queue filters, severity/status/category sorting, bulk assignment/dismissal, detail view, evidence/context/timeline/notes, and moderation actions
- [x] Moderation cases, workflow states, assignment, priority/SLA tracking, templates, appeal handling, and case actions
- [x] Live session list, filters, detail metadata, participants, quality indicators, billing, reports, timeline, refund/flag/note actions
- [x] Media review queue, verification review, viewer, user context, related media, guidelines, notes, quick actions, and bulk approval/rejection
- [x] Trust score management, distribution chart, risk breakdown, event history, adjustment actions, automated triggers, safety analytics, and policy controls
- [x] Wallet support, balances, transaction filters, failed settlements, disputes, refunds, adjustments, revenue analytics, and token economy monitoring
- [x] Growth, dating funnel, live funnel, revenue, safety, and operational analytics surfaces
- [x] Audit logs, actor/target/action filters, CSV export, retention/compliance status, admin management, role assignment, access revocation, MFA enforcement, and settings

---

## Phase 1: Project Setup & Authentication

### 1.1 Next.js Project Setup
- [x] Initialize Next.js 14+ with App Router
- [x] Configure TypeScript
- [x] Set up branded CSS using Delta design system tokens
- [x] Configure environment variables
- [x] Set up API client for backend admin endpoints
- [ ] Configure deployment (Vercel/Cloudflare Pages)

### 1.2 Authentication & RBAC
- [x] Admin login page
- [x] Session management (JWT from backend)
- [x] Role-based menu items
- [ ] Role-based access control (RBAC) middleware
- [ ] Protected routes by role
- [ ] Multi-factor authentication (MFA) setup
- [ ] Session timeout handling
- [ ] Audit log for all admin logins

### 1.3 Layout & Navigation
- [x] Dashboard shell with sidebar
- [x] Top navigation with user menu
- [x] Role-based menu items
- [ ] Breadcrumb navigation
- [x] Responsive design (desktop-first)
- [ ] Dark mode toggle (optional)

---

## Phase 2: Overview Dashboard

### 2.1 Key Metrics Cards
- [x] Total users
- [x] Profile count
- [ ] New signups (today, this week)
- [ ] Active matches
- [x] Active live sessions
- [x] Open reports
- [x] Purchased delt
- [ ] Safety alerts

### 2.2 Charts & Visualizations
- [x] User growth chart (7-day placeholder)
- [x] Live session volume (7-day placeholder)
- [ ] Revenue trend
- [x] Report volume trend (7-day placeholder)
- [ ] Geographic distribution map
- [ ] Top interests/intents

### 2.3 Real-Time Monitoring
- [ ] Active live sessions count
- [ ] Current pool depths by region
- [ ] Worker health status
- [ ] API response times
- [ ] Error rate alerts
- [ ] Queue lag indicators

---

## Phase 3: User Management

### 3.1 User Search & Listing
- [ ] Search by user ID, email, phone, name
- [ ] Filter by status (active, suspended, banned)
- [ ] Filter by verification status
- [ ] Filter by trust score range
- [ ] Filter by registration date
- [ ] Filter by location/region
- [ ] Pagination and sorting

### 3.2 User Detail View
- [ ] User profile information
- [ ] Account status and restrictions
- [ ] Trust score breakdown
- [ ] Verification status and media
- [ ] Wallet balance and transaction history
- [ ] Match history
- [ ] Live session history
- [ ] Reports filed by user
- [ ] Reports against user
- [ ] Block list
- [ ] Device and login history

### 3.3 User Actions
- [ ] View full profile
- [ ] Suspend account (with reason and duration)
- [ ] Ban account (permanent)
- [ ] Lift suspension
- [ ] Shadow restrict
- [ ] Disable live matching
- [ ] Disable messaging
- [ ] Require verification
- [ ] Adjust trust score (with reason)
- [ ] Add internal note
- [ ] View audit log for user
- [ ] Confirmation dialogs for destructive actions

---

## Phase 4: Reports & Moderation

### 4.1 Report Queue
- [ ] List all reports with filters:
  - [ ] Status (pending, under_review, resolved, dismissed)
  - [ ] Severity (low, medium, high, critical)
  - [ ] Category (harassment, explicit, spam, fake, etc.)
  - [ ] Date range
- [ ] Sort by severity, date, status
- [ ] Bulk actions (assign, dismiss)
- [ ] Priority indicators
- [ ] Assigned moderator display

### 4.2 Report Detail View
- [ ] Reporter information
- [ ] Reported user information
- [ ] Report category and description
- [ ] Evidence (screenshots, media)
- [ ] Context (chat messages, profile, live session)
- [ ] Related reports (same user, same reporter)
- [ ] Report history timeline
- [ ] Internal notes

### 4.3 Moderation Actions
- [ ] Assign to moderator
- [ ] Change severity
- [ ] Add internal note
- [ ] Request more information
- [ ] Take action on reported user:
  - [ ] Warn user
  - [ ] Remove content
  - [ ] Suspend account
  - [ ] Ban account
  - [ ] Adjust trust score
- [ ] Close case (resolved/dismissed)
- [ ] Escalate to Trust & Safety Manager
- [ ] Action confirmation with reason

### 4.4 Moderation Cases
- [ ] Case workflow (new → assigned → under_review → resolved)
- [ ] Case assignment to moderators
- [ ] Case priority queue
- [ ] Case SLA tracking (time to first response, time to resolution)
- [ ] Case templates for common violations
- [ ] Appeal handling

---

## Phase 5: Live Session Review

### 5.1 Live Session Listing
- [ ] Active sessions (real-time)
- [ ] Recent sessions (last 24 hours)
- [ ] Filter by region, interest, duration
- [ ] Filter by reported sessions
- [ ] Search by user ID or session ID

### 5.2 Session Detail View
- [ ] Session metadata (ID, room name, region, interest)
- [ ] Participants information
- [ ] Start/end time and duration
- [ ] Connection quality indicators
- [ ] Disconnect reason
- [ ] Billing status and charges
- [ ] Reports filed during/after session
- [ ] Session events timeline (join, leave, quality changes)

### 5.3 Session Actions
- [ ] View participant profiles
- [ ] Review reports from session
- [ ] Refund charges (with reason)
- [ ] Flag session for review
- [ ] Add internal note

---

## Phase 6: Media Review

### 6.1 Media Queue
- [ ] Pending profile images
- [ ] Pending profile videos
- [ ] Pending verification media
- [ ] Flagged chat media
- [ ] Report evidence media
- [ ] Filter by media type, user, date
- [ ] Bulk approval/rejection

### 6.2 Media Review Interface
- [ ] Image/video viewer
- [ ] User profile context
- [ ] Previous media from same user
- [ ] Moderation guidelines reference
- [ ] Quick actions:
  - [ ] Approve
  - [ ] Reject (with reason)
  - [ ] Flag for escalation
  - [ ] Request re-upload

### 6.3 Verification Review
- [ ] Selfie verification queue
- [ ] Video verification queue
- [ ] Compare with profile photos
- [ ] Approve/reject verification
- [ ] Request re-verification

---

## Phase 7: Trust & Safety

### 7.1 Trust Score Management
- [ ] User trust score distribution chart
- [ ] Trust score history for user
- [ ] Risk level breakdown (new, trusted, verified, restricted)
- [ ] Trust score adjustment interface
- [ ] Trust score event log
- [ ] Automated restriction triggers

### 7.2 Safety Analytics
- [ ] Reports per 1,000 users
- [ ] Reports per 1,000 live sessions
- [ ] Top report categories
- [ ] Repeat offenders list
- [ ] Ban rate trends
- [ ] False positive rate
- [ ] Moderator performance metrics

### 7.3 Policy Management
- [ ] Community guidelines editor
- [ ] Moderation policy settings
- [ ] Automated action thresholds
- [ ] Trust score rules configuration
- [ ] Restriction templates

---

## Phase 8: Wallet & Revenue

### 8.1 Wallet Support
- [ ] Search user wallet
- [ ] View balance (paid, bonus, reserved)
- [ ] Transaction history with filters
- [ ] Failed settlements
- [ ] Disputed charges
- [ ] Refund interface (with approval workflow)
- [ ] Manual adjustments (with reason and approval)

### 8.2 Revenue Analytics
- [ ] Total revenue (today, week, month, year)
- [ ] Revenue by region
- [ ] Revenue by token package
- [ ] Purchase conversion rate
- [ ] Refund rate
- [ ] Failed payment rate
- [ ] Chargeback tracking
- [ ] Top spending users

### 8.3 Token Economy Monitoring
- [ ] Delt circulation (total issued, spent, reserved)
- [ ] Token package performance
- [ ] Pricing effectiveness
- [ ] Usage patterns (live video, boosts, super likes)
- [ ] Free quota utilization

---

## Phase 9: Analytics & Insights

### 9.1 Growth Metrics
- [ ] User acquisition funnel
- [ ] Registration completion rate
- [ ] Profile completion rate
- [ ] Verification rate
- [ ] Retention cohorts (D1, D7, D30)
- [ ] Churn analysis
- [ ] Geographic growth

### 9.2 Dating Funnel
- [ ] Profiles viewed per user
- [ ] Like rate
- [ ] Match rate
- [ ] Chat initiation rate
- [ ] Reply rate
- [ ] Video date conversion
- [ ] Funnel drop-off analysis

### 9.3 Live Match Funnel
- [ ] Pool entry rate
- [ ] Average wait time by region/interest
- [ ] Match success rate
- [ ] Join failure rate
- [ ] Average session duration
- [ ] Skip rate
- [ ] Post-call match rate
- [ ] Report rate per session

### 9.4 Operational Metrics
- [ ] API latency (p50, p95, p99)
- [ ] Worker lag by type
- [ ] Redis queue depths
- [ ] MongoDB slow queries
- [ ] LiveKit room failures
- [ ] Webhook retry rate
- [ ] Error rate by endpoint

---

## Phase 10: Audit Logs & Settings

### 10.1 Audit Logs
- [ ] All admin actions log
- [ ] Filter by actor, target user, action type, date
- [ ] Search by user ID or admin ID
- [ ] Export audit logs
- [ ] Retention policy enforcement
- [ ] Compliance reporting

### 10.2 Admin Management
- [ ] List admin users
- [ ] Create admin account
- [ ] Assign roles (Super Admin, Trust & Safety Manager, Moderator, Support, Finance, Analyst)
- [ ] Revoke access
- [ ] MFA enforcement
- [ ] Admin activity monitoring

### 10.3 System Settings
- [ ] Feature flags
- [ ] Rate limit configurations
- [ ] Token pricing rules
- [ ] Moderation policy settings
- [ ] Pool expansion rules
- [ ] Trust score thresholds
- [ ] Notification templates

---

## Technical Architecture

### Tech Stack
```json
{
  "framework": "Next.js 14+",
  "language": "TypeScript",
  "styling": "Tailwind CSS + shadcn/ui",
  "charts": "Recharts or Chart.js",
  "tables": "TanStack Table",
  "forms": "React Hook Form + Zod",
  "state": "React Query + Zustand",
  "auth": "NextAuth.js or custom JWT"
}
```

### Folder Structure
```
apps/dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── overview/
│   │   │   ├── users/
│   │   │   ├── reports/
│   │   │   ├── sessions/
│   │   │   ├── media/
│   │   │   ├── wallet/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── tables/
│   │   └── forms/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   └── utils/
│   └── types/
└── public/
```

### API Integration
```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Authorization': `Bearer ${getToken()}`,
  },
});

// Example: Fetch users
export const getUsers = async (filters: UserFilters) => {
  const response = await apiClient.get('/admin/users', { params: filters });
  return response.data;
};
```

---

## Role-Based Access Control

### Roles & Permissions

| Feature | Super Admin | Trust & Safety Manager | Moderator | Support | Finance | Analyst |
|---------|-------------|------------------------|-----------|---------|---------|---------|
| Overview Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Actions | ✅ | ✅ | ✅ (limited) | ✅ (limited) | ❌ | ❌ |
| Reports Queue | ✅ | ✅ | ✅ | ✅ (view only) | ❌ | ❌ |
| Moderation Actions | ✅ | ✅ | ✅ (within policy) | ❌ | ❌ | ❌ |
| Live Sessions | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Media Review | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Trust Scores | ✅ | ✅ | ✅ (view only) | ❌ | ❌ | ❌ |
| Wallet Support | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Revenue Analytics | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ✅ (limited) | ❌ | ❌ | ❌ | ❌ |

---

## Success Criteria

- [ ] All admin roles can access appropriate features
- [ ] RBAC enforced on all routes and actions
- [ ] Audit logs capture all admin actions
- [ ] Real-time metrics update every 30 seconds
- [ ] Report queue loads in < 2 seconds
- [ ] User search returns results in < 1 second
- [ ] MFA required for production access
- [ ] Dashboard accessible on desktop and tablet
- [ ] No sensitive data exposed in client-side code
- [ ] All destructive actions require confirmation

---

## Development Iterations

### Iteration 1: After Backend Admin API
- Authentication, RBAC, overview dashboard

### Iteration 2: After Workers Phase 1
- User management, reports queue, moderation actions

### Iteration 3: After Mobile Live Match
- Live session review, media review

### Iteration 4: Production Ready
- Analytics, wallet support, audit logs, system settings

---

**Reference**: See `docs/Delta_Developer_Documentation.docx` Section 15 for detailed dashboard specifications.
