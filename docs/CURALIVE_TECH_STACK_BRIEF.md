# CuraLive AI Platform — Technical Stack Brief

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Audience:** Technical Leadership, Engineering Team, DevOps, Architecture Review

---

## Executive Summary

CuraLive is a production-grade live event intelligence platform built on a modern, scalable tech stack combining React 19, Express 4, tRPC 11, and cloud-native services. The platform processes real-time audio/video streams, performs AI-powered analysis, and delivers intelligent insights to multiple stakeholder groups simultaneously.

**Core Philosophy:** Type-safe end-to-end development with zero manual API contracts, real-time data synchronization, and enterprise-grade compliance.

---

## 1. Frontend Architecture

### Core Framework
- **React 19** — Latest React with concurrent features, automatic batching, and improved performance
- **TypeScript 5.9** — Strict type checking across all frontend code
- **Vite 5** — Lightning-fast development server with HMR, optimized production builds
- **Tailwind CSS 4** — Utility-first CSS framework with OKLCH color support and dynamic theming

### State Management & Data Fetching
- **tRPC 11** — Type-safe RPC framework with automatic client generation
- **TanStack React Query** — Server state management with caching, synchronization, and optimistic updates
- **Ably Realtime** — Sub-100ms message delivery for live updates (violations, muting events, sentiment)
- **Superjson** — Automatic serialization of Date objects, Maps, Sets across tRPC

### UI Component Library
- **shadcn/ui** — Unstyled, accessible component library built on Radix UI
- **Lucide React** — 400+ consistent SVG icons
- **Radix UI** — Headless component primitives (Dialog, Dropdown, Tabs, etc.)

### Routing & Navigation
- **Wouter** — Lightweight client-side router (5KB gzipped)
- **React Router patterns** — Nested routes, lazy loading, code splitting

### Utilities & Helpers
- **date-fns** — Modern date manipulation library
- **clsx** — Conditional className utility
- **Streamdown** — Markdown rendering with streaming support for LLM responses

### Build & Development
- **pnpm** — Fast, disk-space efficient package manager
- **Vitest** — Unit testing framework with React Testing Library
- **ESLint** — Code quality and consistency
- **Prettier** — Automatic code formatting

---

## 2. Backend Architecture

### Core Runtime
- **Node.js 22** — Latest LTS with ES modules support
- **Express 4** — Lightweight HTTP server framework
- **tRPC 11** — Type-safe RPC procedures (publicProcedure, protectedProcedure, adminProcedure)
- **TypeScript 5.9** — Strict type checking for all server code

### API & RPC Layer
- **tRPC Routers** — Modular procedure organization
  - `auth` — OAuth login/logout, session management
  - `system` — Owner notifications, health checks
  - `aiAmPhase2` — Auto-muting control (8 procedures)
  - `aiAmPhase1` — Compliance alerts (6 procedures)
  - Feature-specific routers for each application module

- **HTTP Batch Link** — Optimized network requests with automatic batching
- **SuperJSON Transformer** — Automatic serialization of complex types
- **CORS & Security Headers** — Production-grade security middleware

### Authentication & Authorization
- **Manus OAuth 2.0** — Single sign-on with Manus platform
- **JWT Sessions** — Signed session cookies with configurable expiration
- **Role-Based Access Control (RBAC)** — admin, user roles with extensibility
- **Protected Procedures** — Automatic user context injection via middleware

### Database & ORM
- **Drizzle ORM** — Type-safe SQL query builder with schema-first approach
- **MySQL/TiDB** — Primary database (production-grade relational database)
- **Drizzle Kit** — Schema migrations and type generation
- **Connection Pooling** — Efficient database connection management

### Real-Time Communication
- **Ably Realtime** — Publish/subscribe messaging for live events
  - Violation alerts and acknowledgments
  - Muting state updates
  - Sentiment analysis streaming
  - Operator notifications

- **WebSocket Support** — Native browser WebSocket API via Ably
- **Message Deduplication** — 30-second time window for alert deduplication
- **Channel Subscriptions** — Event-specific channels for scalability

### External Service Integrations

#### AI & Language Models
- **Manus Built-in LLM API** — OpenAI-compatible interface for chat completions
  - Sentiment analysis
  - Compliance violation detection
  - Content summarization
  - Real-time transcription analysis

#### Audio & Transcription
- **Recall.ai** — Universal meeting bot for audio capture
  - Real-time audio streaming
  - Webhook integration for transcript segments
  - Speaker identification
  - Multi-platform support (Zoom, Teams, Webex, RTMP, PSTN)

- **Whisper API** — Speech-to-text transcription
  - 16MB file size limit
  - Supported formats: webm, mp3, wav, ogg, m4a
  - Language detection and context hints

#### Video & Media
- **Mux** — Video streaming and recording
  - Live stream ingestion
  - Recording storage
  - Playback analytics
  - Webhook events for stream status

#### Communication & Notifications
- **Twilio** — SMS and voice capabilities
  - SMS notifications to operators
  - PSTN dial-in for events
  - SIP connections for call routing
  - TwiML app integration

- **Resend** — Email delivery service
  - Transactional emails
  - HTML templates
  - Delivery tracking
  - Bounce handling

- **Telnyx** — SIP and voice infrastructure
  - SIP connection management
  - Call routing
  - Voice recording
  - Webhook integration

#### Payment Processing
- **Stripe** — Payment processing and subscriptions
  - Checkout sessions
  - Subscription management
  - Webhook events for payment status
  - Test mode for development

#### Maps & Location
- **Google Maps API** — Location-based features
  - Geocoding
  - Places API
  - Directions
  - Proxy authentication via Manus

#### Data & Analytics
- **Umami Analytics** — Privacy-focused analytics
  - Event tracking
  - User behavior analysis
  - Dashboard reporting
  - No cookie tracking

#### File Storage
- **AWS S3** — Cloud object storage
  - File uploads (images, videos, documents)
  - Presigned URLs for secure access
  - Public CDN delivery
  - Metadata tracking in database

---

## 3. Infrastructure & Deployment

### Hosting & CDN
- **Manus Platform** — Managed hosting with auto-scaling
  - Node.js runtime
  - Database hosting
  - SSL/TLS certificates
  - Custom domain support
  - Automatic deployments from Git

- **AWS S3 + CloudFront** — Static asset delivery
  - Global CDN distribution
  - Low-latency content delivery
  - Automatic cache invalidation

### Monitoring & Logging
- **Manus Logs** — Centralized logging
  - `.manus-logs/devserver.log` — Server startup and warnings
  - `.manus-logs/browserConsole.log` — Client-side errors with stack traces
  - `.manus-logs/networkRequests.log` — HTTP request tracking
  - `.manus-logs/sessionReplay.log` — User interaction events

- **Webhook Monitoring** — Event delivery tracking
  - Recall.ai webhook events
  - Stripe payment events
  - Mux video events
  - Error logging and retry logic

### Version Control & CI/CD
- **GitHub** — Source code repository
  - Private repository for security
  - Branch protection rules
  - Automated deployments on push to main
  - Webhook integration with Manus

- **Git Workflows** — Standard development flow
  - Feature branches
  - Pull request reviews
  - Automated testing on PRs
  - Semantic versioning

---

## 4. Database Schema

### Core Tables

#### Users & Authentication
```sql
users
  ├── id (primary key)
  ├── email (unique)
  ├── name
  ├── role (enum: admin, user)
  ├── stripe_customer_id
  ├── created_at
  └── updated_at

sessions
  ├── id (primary key)
  ├── user_id (foreign key)
  ├── token
  ├── expires_at
  └── created_at
```

#### Events & Conferences
```sql
webcast_events
  ├── id (primary key)
  ├── conference_id
  ├── title
  ├── description
  ├── start_time
  ├── end_time
  ├── status (enum: scheduled, live, completed)
  ├── platform (enum: zoom, teams, webex, rtmp, pstn)
  ├── recall_bot_id
  ├── mux_stream_id
  ├── created_by (foreign key to users)
  └── created_at

event_speakers
  ├── id (primary key)
  ├── event_id (foreign key)
  ├── speaker_name
  ├── speaker_id (from Recall.ai)
  ├── role
  └── created_at
```

#### Transcription & Analysis
```sql
occ_transcription_segments
  ├── id (primary key)
  ├── event_id (foreign key)
  ├── speaker_id
  ├── speaker_name
  ├── text
  ├── start_time_ms
  ├── end_time_ms
  ├── sentiment (enum: positive, neutral, negative)
  ├── sentiment_score (0-1)
  ├── violations (JSON array)
  └── created_at

compliance_violations
  ├── id (primary key)
  ├── event_id (foreign key)
  ├── segment_id (foreign key)
  ├── speaker_id
  ├── violation_type (enum: profanity, insider_info, confidential, etc.)
  ├── severity (enum: low, medium, high, critical)
  ├── transcript_excerpt
  ├── timestamp
  ├── acknowledged_by (foreign key to users)
  ├── acknowledged_at
  ├── action_taken (enum: alert, soft_mute, hard_mute)
  └── created_at
```

#### Muting & Moderation
```sql
muting_events
  ├── id (primary key)
  ├── event_id (foreign key)
  ├── speaker_id
  ├── mute_type (enum: soft, hard)
  ├── reason (violation_type or manual)
  ├── initiated_by (foreign key to users)
  ├── unmute_scheduled_at (for soft mutes)
  ├── unmuted_at
  ├── unmuted_by (foreign key to users)
  └── created_at

muting_config
  ├── event_id (primary key, foreign key)
  ├── soft_mute_threshold (default: 2)
  ├── hard_mute_threshold (default: 5)
  ├── soft_mute_duration_ms (default: 30000)
  ├── auto_mute_enabled
  ├── manual_override_enabled
  └── updated_at
```

#### Notifications & Preferences
```sql
operator_preferences
  ├── user_id (primary key, foreign key)
  ├── email_notifications_enabled
  ├── sms_notifications_enabled
  ├── in_app_notifications_enabled
  ├── violation_severity_threshold
  ├── notification_frequency (enum: immediate, digest, disabled)
  └── updated_at

notifications
  ├── id (primary key)
  ├── user_id (foreign key)
  ├── type (enum: violation, muting, system)
  ├── title
  ├── content
  ├── read_at
  ├── created_at
  └── expires_at
```

#### Payments & Subscriptions
```sql
subscriptions
  ├── id (primary key)
  ├── user_id (foreign key)
  ├── stripe_subscription_id
  ├── bundle_id (references ai_bundles)
  ├── status (enum: active, paused, canceled)
  ├── current_period_start
  ├── current_period_end
  ├── cancel_at_period_end
  └── created_at

ai_bundles
  ├── id (primary key)
  ├── name (Investor Relations, Compliance & Risk, etc.)
  ├── description
  ├── features (JSON array)
  ├── price_monthly
  ├── price_annual
  └── created_at
```

#### Feature Management
```sql
user_feature_state
  ├── user_id (primary key, foreign key)
  ├── feature_id (primary key)
  ├── bundle_id (foreign key)
  ├── status (enum: locked, available, activated, disabled)
  ├── unlocked_at
  ├── activated_at
  ├── first_used_at
  ├── usage_count
  └── satisfaction_rating

user_progress_state
  ├── user_id (primary key, foreign key)
  ├── bundle_id (primary key, foreign key)
  ├── signup_date
  ├── first_event_date
  ├── events_completed
  ├── features_activated
  ├── current_phase (enum: day1, week1, month1, ongoing)
  └── last_unlock_date
```

---

## 5. API Endpoints & tRPC Procedures

### Authentication Procedures
```typescript
trpc.auth.me.useQuery()                    // Get current user
trpc.auth.logout.useMutation()             // Logout user
trpc.system.notifyOwner.useMutation()      // Send owner notification
```

### Phase 2 Auto-Muting Procedures
```typescript
trpc.aiAmPhase2.getMutingConfig.useQuery()           // Get current config
trpc.aiAmPhase2.configureMuting.useMutation()        // Update thresholds
trpc.aiAmPhase2.evaluateSpeaker.useMutation()        // Evaluate single speaker
trpc.aiAmPhase2.evaluateAllSpeakers.useMutation()    // Batch evaluation
trpc.aiAmPhase2.applyMute.useMutation()              // Apply mute
trpc.aiAmPhase2.removeMute.useMutation()             // Remove mute
trpc.aiAmPhase2.getSpeakerViolations.useQuery()      // Get violation history
trpc.aiAmPhase2.getMutingStats.useQuery()            // Get statistics
```

### Phase 1 Compliance Procedures
```typescript
trpc.aiAmPhase1.getAlerts.useQuery()                 // Get compliance alerts
trpc.aiAmPhase1.acknowledgeAlert.useMutation()       // Acknowledge alert
trpc.aiAmPhase1.getComplianceReport.useQuery()       // Generate report
```

### Webhook Endpoints
```
POST /api/webhooks/recall                  // Recall.ai transcript segments
POST /api/webhooks/mux                     // Mux video events
POST /api/webhooks/stripe                  // Stripe payment events
POST /api/webhooks/twilio                  // Twilio call events
```

---

## 6. Development Workflow

### Local Development
```bash
pnpm install                               # Install dependencies
pnpm dev                                   # Start dev server (Vite + Express)
pnpm test                                  # Run vitest suite
pnpm format                                # Format code with Prettier
pnpm db:push                               # Sync database schema
```

### Database Migrations
```bash
# Schema-first workflow
# 1. Edit drizzle/schema.ts
# 2. Run pnpm db:push (generates migration + applies)
# 3. Verify changes in database
# 4. Commit schema.ts and migrations/
```

### Testing Strategy
```typescript
// Unit tests for procedures
describe('aiAmPhase2.applyMute', () => {
  it('should apply soft mute with 30s auto-unmute', async () => {
    // Test implementation
  });
});

// Integration tests for webhooks
describe('Recall.ai webhook integration', () => {
  it('should detect violations and trigger auto-muting', async () => {
    // Test implementation
  });
});
```

### Deployment
```bash
git push origin main                       # Trigger automatic deployment
# Manus platform automatically:
# 1. Runs pnpm build
# 2. Deploys to Node.js runtime
# 3. Updates database schema
# 4. Restarts services
```

---

## 7. Performance Optimization

### Frontend
- **Code Splitting** — Automatic with Vite
- **Image Optimization** — CDN delivery via S3
- **Bundle Analysis** — Monitor with Vite analyzer
- **Lazy Loading** — React.lazy() for route components
- **Memoization** — useMemo, useCallback for expensive operations

### Backend
- **Database Indexing** — Optimized queries with proper indexes
- **Connection Pooling** — Efficient database connections
- **Caching** — React Query with configurable stale time
- **Batch Operations** — tRPC batch link for multiple requests
- **Real-Time Optimization** — Ably message batching and compression

### Network
- **HTTP/2** — Multiplexed connections
- **Gzip Compression** — Automatic with Express
- **CDN Caching** — S3 CloudFront for static assets
- **Presigned URLs** — Secure direct S3 access without backend proxy

---

## 8. Security & Compliance

### Authentication & Authorization
- **OAuth 2.0** — Manus platform single sign-on
- **JWT Sessions** — Signed cookies with expiration
- **RBAC** — Role-based access control (admin, user)
- **Protected Procedures** — Automatic user context validation

### Data Security
- **HTTPS/TLS** — All traffic encrypted in transit
- **Database Encryption** — At-rest encryption for sensitive data
- **Presigned URLs** — Time-limited S3 access
- **No PII in Logs** — Sanitized logging for compliance

### Compliance
- **GDPR Ready** — User data export, deletion capabilities
- **SOC 2 Type II** — Audit trail and access controls
- **Immutable Audit Trail** — Compliance violation logging
- **Webhook Verification** — HMAC signature validation

---

## 9. Scalability & Reliability

### Horizontal Scaling
- **Stateless API** — Multiple Node.js instances
- **Database Connection Pooling** — Shared pool across instances
- **Real-Time Sync** — Ably handles multi-instance coordination
- **Load Balancing** — Manus platform automatic load balancing

### High Availability
- **Auto-Scaling** — Based on CPU/memory metrics
- **Health Checks** — Automatic instance replacement
- **Database Replication** — Primary + replica setup
- **Backup & Recovery** — Automated daily backups

### Monitoring & Alerting
- **Error Tracking** — Centralized error logging
- **Performance Monitoring** — Request latency and throughput
- **Webhook Monitoring** — Delivery status and retry logic
- **Uptime Monitoring** — 99.9% SLA target

---

## 10. Third-Party Dependencies

### Production Dependencies (45+)
```json
{
  "@aws-sdk/client-s3": "^3.693.0",
  "@aws-sdk/s3-request-presigner": "^3.693.0",
  "@tanstack/react-query": "^5.x",
  "@trpc/client": "^11.x",
  "@trpc/server": "^11.x",
  "ably": "^1.x",
  "cookie": "^1.0.2",
  "date-fns": "^4.1.0",
  "drizzle-orm": "^0.44.5",
  "express": "^4.x",
  "jose": "6.1.0",
  "mysql2": "^3.15.0",
  "react": "^19.x",
  "react-dom": "^19.x",
  "stripe": "^14.x",
  "superjson": "^1.13.3",
  "tailwindcss": "^4.x"
}
```

### Development Dependencies (20+)
```json
{
  "@types/express": "^4.x",
  "@types/node": "^20.x",
  "@types/react": "^19.x",
  "drizzle-kit": "^0.31.4",
  "typescript": "5.9.3",
  "vite": "^5.x",
  "vitest": "^1.x"
}
```

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Manus Platform (Hosting)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐          │
│  │  Node.js Runtime │◄────────►│  MySQL Database  │          │
│  │  (Express + tRPC)│          │  (Drizzle ORM)   │          │
│  └──────────────────┘          └──────────────────┘          │
│          ▲                                                    │
│          │                                                    │
│  ┌───────┴─────────────────────────────────────────┐         │
│  │         Vite Frontend (React 19)                │         │
│  │  ├─ Operator Console                           │         │
│  │  ├─ Moderator Console                          │         │
│  │  ├─ Presenter Teleprompter                     │         │
│  │  ├─ Attendee Room                              │         │
│  │  ├─ Post-Event Report                          │         │
│  │  └─ AI Shop & Feature Discovery                │         │
│  └───────┬─────────────────────────────────────────┘         │
│          │                                                    │
└──────────┼────────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────────────┐
    │         External Service Integrations            │
    ├───────────────────────────────────────────────────┤
    │  • Recall.ai (Audio Capture & Webhooks)         │
    │  • Mux (Video Streaming)                        │
    │  • Ably (Real-Time Messaging)                   │
    │  • Twilio (SMS & Voice)                         │
    │  • Resend (Email)                               │
    │  • Stripe (Payments)                            │
    │  • AWS S3 (File Storage)                        │
    │  • Google Maps (Location Services)              │
    │  • Umami (Analytics)                            │
    └───────────────────────────────────────────────────┘
```

---

## 12. Technology Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend Framework | React 19 | Latest features, concurrent rendering, ecosystem |
| Type Safety | TypeScript 5.9 | End-to-end type safety, better IDE support |
| RPC Framework | tRPC 11 | Type-safe contracts, zero API boilerplate |
| CSS Framework | Tailwind 4 | Utility-first, OKLCH colors, performance |
| State Management | React Query | Server state, caching, synchronization |
| Real-Time | Ably | Sub-100ms delivery, multi-instance support |
| Database | MySQL/TiDB | Relational, ACID, proven at scale |
| ORM | Drizzle | Type-safe, schema-first, migrations |
| Backend | Express 4 | Lightweight, middleware ecosystem, proven |
| Hosting | Manus Platform | Managed, auto-scaling, integrated services |
| Payment | Stripe | Industry standard, webhook support, compliance |
| Video | Mux | Streaming, recording, analytics |
| Audio | Recall.ai | Universal bot, multi-platform, webhooks |

---

## 13. Known Limitations & Roadmap

### Current Limitations
- Database schema has some legacy fields (cleanup in progress)
- TypeScript errors: 345 pre-existing schema issues (non-blocking)
- Stripe integration requires manual key configuration (not in sandbox)
- Single-region deployment (multi-region planned)

### Planned Improvements
- Multi-region deployment for global scale
- GraphQL federation for complex queries
- WebRTC peer-to-peer for low-latency features
- Advanced analytics with data warehouse
- Machine learning models for predictive compliance

---

## 14. Support & Documentation

### Resources
- **README.md** — Quick start guide
- **docs/PHASE2_BETA_DEPLOYMENT.md** — Beta deployment guide
- **docs/OPERATOR_TRAINING_OUTLINE.md** — Operator training materials
- **docs/MONITORING_DASHBOARD_SETUP.md** — Monitoring setup
- **GitHub Repository** — Source code and issue tracking
- **Manus Platform Dashboard** — Logs, metrics, deployments

### Contact & Support
- **Engineering Team** — GitHub issues and PRs
- **DevOps** — Infrastructure and deployment questions
- **Product** — Feature requests and roadmap
- **Support** — help.manus.im for platform-specific issues

---

## Conclusion

CuraLive's tech stack is designed for **production-grade reliability**, **type-safe development**, and **real-time performance**. The combination of React 19, tRPC, Express, and cloud-native services provides a solid foundation for scaling to millions of concurrent users while maintaining code quality and developer productivity.

**Status:** Production-Ready for Phase 2 Beta Launch (March 3, 2026)
