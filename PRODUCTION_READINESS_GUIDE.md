# Production Readiness Implementation Guide

## Overview

This guide outlines the 6 critical areas needed to move Chorus AI from development to production with Shadow Mode fully operational and customer-ready.

---

## 1. SHADOW MODE FRONTEND UI COMPLETION

### Current State
- **Backend:** 80% complete (Recall.ai integration, session management)
- **Frontend:** 0% (no UI components)
- **Testing:** Minimal

### What Needs to Be Built

#### 1.1 Shadow Mode Dashboard (`/shadow-mode`)
**Purpose:** Main interface for managing shadow sessions

**Components:**
- Session list with status indicators (active, idle, completed)
- Quick-start button to create new shadow session
- Real-time metrics display (active bots, captured minutes, sentiment average)
- Session filters (by date, status, event)
- Search functionality

**Data to Display:**
- Session ID, creation time, duration
- Bot status (connecting, recording, idle, error)
- Participants count
- Sentiment score (real-time)
- Transcript word count
- Error messages if any

#### 1.2 Shadow Session Creation Wizard
**Purpose:** Step-by-step guide to set up a new shadow session

**Steps:**
1. **Select Conference Platform** (Zoom, Teams, Webex, RTMP)
2. **Enter Meeting Details** (URL, meeting ID, passcode if needed)
3. **Configure Recording Options** (transcript, sentiment, Q&A capture)
4. **Review & Confirm** (show what will be captured)
5. **Launch Bot** (start Recall.ai bot)

**Validation:**
- Verify meeting URL format
- Check if meeting is currently active
- Validate Recall.ai bot availability
- Test connection before starting

#### 1.3 Real-Time Session Monitoring
**Purpose:** Live view of what's happening in a shadow session

**Display:**
- Live transcript (scrolling)
- Sentiment gauge (real-time)
- Participant list
- Q&A submissions (if enabled)
- Bot status and latency
- Recording duration
- Error alerts

**Refresh Rate:** Every 1-2 seconds via Ably

#### 1.4 Session History & Analytics
**Purpose:** View past shadow sessions and extract insights

**Features:**
- Session list with sorting/filtering
- Session details page with full transcript
- Sentiment timeline chart
- Participant engagement metrics
- Q&A summary
- Export options (PDF, CSV, JSON)

#### 1.5 Bot Management UI
**Purpose:** Admin controls for shadow bots

**Features:**
- View all active bots
- Manual bot restart
- Bot logs viewer
- Bot health status
- Resource usage (CPU, memory)
- Error logs

### Implementation Timeline: 3-5 days

### Files to Create
```
client/src/pages/ShadowMode.tsx
client/src/pages/ShadowModeCreate.tsx
client/src/pages/ShadowModeMonitor.tsx
client/src/pages/ShadowModeHistory.tsx
client/src/components/ShadowSessionCard.tsx
client/src/components/ShadowTranscriptViewer.tsx
client/src/components/ShadowSentimentChart.tsx
client/src/components/ShadowBotStatus.tsx
client/src/lib/shadowModeHooks.ts
```

### Testing Requirements
- Unit tests for all components
- Integration tests with shadow mode API
- End-to-end tests for session creation flow
- Real-time update tests with Ably

---

## 2. SSL/TLS AND DOMAIN CONFIGURATION

### Current State
- **Domain:** `3000-i2ws5u2eloy643dg1hqvt-ea16b4d5.us1.manus.computer` (development)
- **SSL:** Self-signed certificate (causes browser warnings)
- **Issue:** "You are in danger of having your data stolen" warnings

### What Needs to Be Done

#### 2.1 Custom Domain Setup
**Options:**
1. **Use Manus Custom Domain:** `chorusai-mdu4k2ib.manus.space`
   - Already configured
   - Automatic SSL via Manus
   - Recommended for MVP

2. **Use Your Own Domain:** `chorus.yourdomain.com`
   - Purchase domain (GoDaddy, Namecheap, etc.)
   - Point DNS to Manus infrastructure
   - Configure SSL certificate

#### 2.2 SSL/TLS Configuration
**Process:**
1. Enable HTTPS redirect (all HTTP → HTTPS)
2. Configure security headers:
   ```
   Strict-Transport-Security: max-age=31536000
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Content-Security-Policy: default-src 'self'
   X-XSS-Protection: 1; mode=block
   ```
3. Set up certificate renewal (automatic with Let's Encrypt)
4. Test SSL configuration

#### 2.3 Remove Development Warnings
**Steps:**
1. Update all internal links to use HTTPS
2. Remove self-signed certificate references
3. Configure proper SSL certificate
4. Test in browser (should show green lock)

### Implementation Timeline: 1-2 days

### Verification Checklist
- [ ] All pages load over HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate is valid
- [ ] Certificate renewal is automated
- [ ] Security headers are present
- [ ] Browser shows green lock icon

---

## 3. COMPREHENSIVE TEST COVERAGE

### Current State
- **Coverage:** ~30% (some rounds have tests, many don't)
- **Test Types:** Mostly unit tests
- **Missing:** Integration tests, E2E tests, load tests

### What Needs to Be Built

#### 3.1 Unit Tests (Target: 80% coverage)
**Priority Areas:**
- Authentication flows
- API procedures (tRPC)
- Database helpers
- Utility functions
- Shadow mode logic
- Marketplace features

**Framework:** Vitest (already configured)

**Example Structure:**
```typescript
describe('Shadow Mode', () => {
  describe('createShadowSession', () => {
    it('should create session with valid input', () => {});
    it('should reject invalid meeting URL', () => {});
    it('should handle Recall.ai API errors', () => {});
  });
});
```

#### 3.2 Integration Tests
**Priority Areas:**
- Recall.ai API integration
- Twilio integration
- Mux integration
- Database transactions
- Webhook handlers

**Example:**
```typescript
describe('Recall.ai Integration', () => {
  it('should create bot and receive webhook', async () => {});
  it('should handle bot disconnection', async () => {});
});
```

#### 3.3 End-to-End Tests
**Priority Flows:**
1. Create event → Start recording → Generate report
2. Create shadow session → Capture transcript → Export
3. User registration → Login → Create event
4. Admin moderation → Flag template → Remove

**Framework:** Playwright or Cypress

#### 3.4 Load Testing
**Scenarios:**
- 100 concurrent users
- 1000 concurrent API requests
- Database with 1M+ records
- Real-time updates (Ably) with 10K+ subscribers

**Tool:** K6 or Apache JMeter

### Implementation Timeline: 1-2 weeks

### Coverage Goals
- Unit tests: 80%+
- Integration tests: 60%+
- E2E tests: Key workflows
- Load tests: Pass at 2x expected load

### Files to Create
```
server/tests/shadowMode.test.ts
server/tests/recallAiIntegration.test.ts
server/tests/authentication.test.ts
server/tests/marketplace.test.ts
client/tests/ShadowMode.test.tsx
e2e/shadowModeFlow.spec.ts
e2e/eventCreationFlow.spec.ts
load-tests/concurrent-users.k6.js
```

---

## 4. PRODUCTION MONITORING & LOGGING

### Current State
- **Logging:** Console logs only
- **Monitoring:** None
- **Alerting:** None

### What Needs to Be Built

#### 4.1 Structured Logging
**Implementation:** Winston or Pino

**Log Levels:**
- ERROR: Critical issues
- WARN: Potential problems
- INFO: Important events
- DEBUG: Detailed information

**What to Log:**
- API requests/responses
- Database queries (slow queries only)
- External API calls (Recall.ai, Twilio, etc.)
- Authentication events
- Error stack traces
- Performance metrics

**Example:**
```typescript
logger.info('Shadow session created', {
  sessionId: '123',
  eventId: 'evt_456',
  platform: 'zoom',
  timestamp: new Date().toISOString(),
  userId: ctx.user.id
});
```

#### 4.2 Error Tracking (Sentry)
**Setup:**
1. Create Sentry account
2. Add Sentry SDK to backend and frontend
3. Configure error grouping
4. Set up alerting rules

**What to Track:**
- Unhandled exceptions
- API errors
- Database errors
- External API failures
- Performance degradation

#### 4.3 Performance Monitoring
**Metrics to Track:**
- API response times (p50, p95, p99)
- Database query times
- External API latency
- Frontend load time
- Real-time message latency (Ably)

**Tool:** Datadog or New Relic

#### 4.4 Alerting Rules
**Critical Alerts:**
- Error rate > 1%
- API response time > 5s
- Database connection pool exhausted
- Recall.ai API down
- Disk space < 10%
- Memory usage > 90%

**Warning Alerts:**
- Error rate > 0.5%
- API response time > 2s
- Database query time > 1s

### Implementation Timeline: 3-5 days

### Files to Create
```
server/_core/logging.ts
server/_core/monitoring.ts
server/middleware/requestLogging.ts
server/middleware/errorTracking.ts
```

---

## 5. DATABASE OPTIMIZATION

### Current State
- **Size:** ~50 tables, millions of records
- **Performance:** Slow queries observed
- **Caching:** None
- **Backups:** Not configured

### What Needs to Be Done

#### 5.1 Query Optimization
**Process:**
1. Identify slow queries (> 1s)
2. Add indexes to frequently queried columns
3. Optimize JOIN operations
4. Implement query pagination
5. Use database query profiling

**Common Indexes Needed:**
```sql
-- Shadow sessions
CREATE INDEX idx_shadow_sessions_event_id ON shadow_sessions(event_id);
CREATE INDEX idx_shadow_sessions_created_at ON shadow_sessions(created_at);

-- Recordings
CREATE INDEX idx_recordings_event_id ON recordings(event_id);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);

-- Attendees
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_email ON attendees(email);
```

#### 5.2 Caching Layer (Redis)
**Use Cases:**
- Cache user sessions
- Cache event details
- Cache recommendation results
- Cache API responses (5-minute TTL)

**Implementation:**
```typescript
// Example: Cache event details
const cacheKey = `event:${eventId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const event = await db.query.webcastEvents.findFirst({ where: eq(webcastEvents.id, eventId) });
await redis.setex(cacheKey, 300, JSON.stringify(event)); // 5 min TTL
return event;
```

#### 5.3 Connection Pooling
**Configuration:**
- Pool size: 20-50 connections
- Max wait time: 5 seconds
- Idle timeout: 30 seconds

#### 5.4 Backup Strategy
**Daily Backups:**
- Automated daily backup to S3
- 30-day retention
- Point-in-time recovery capability
- Test restore process monthly

### Implementation Timeline: 1 week

### Performance Targets
- API response time: < 500ms (p95)
- Database query time: < 100ms (p95)
- Cache hit rate: > 80%

---

## 6. SECURITY HARDENING

### Current State
- **Rate Limiting:** None
- **Input Validation:** Basic
- **Encryption:** Not at rest
- **Audit Logging:** None

### What Needs to Be Done

#### 6.1 Rate Limiting
**Implementation:** express-rate-limit

**Rules:**
- API endpoints: 100 requests/minute per user
- Login endpoint: 5 attempts/minute per IP
- Public endpoints: 1000 requests/minute per IP

**Example:**
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
});

app.use('/api/trpc', limiter);
```

#### 6.2 Input Validation & Sanitization
**Process:**
1. Validate all API inputs with Zod
2. Sanitize HTML inputs
3. Escape database queries
4. Validate file uploads

**Example:**
```typescript
const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000),
  eventType: z.enum(['webcast', 'earnings', 'investor']),
});

const event = createEventSchema.parse(input);
```

#### 6.3 Database Encryption
**At Rest:**
- Enable MySQL encryption (TDE)
- Encrypt sensitive fields (passwords, API keys)

**In Transit:**
- Use SSL/TLS for all connections
- Require SSL for database connections

#### 6.4 Audit Logging
**What to Log:**
- User login/logout
- Data access (who accessed what)
- Data modifications (create, update, delete)
- Admin actions
- API key usage
- Permission changes

**Example:**
```typescript
await auditLog.create({
  userId: ctx.user.id,
  action: 'DELETE_EVENT',
  resourceId: eventId,
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

#### 6.5 API Security
**Headers:**
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

**CORS:**
- Only allow trusted origins
- Restrict HTTP methods
- Validate credentials

#### 6.6 Secrets Management
**Process:**
1. Never commit secrets to git
2. Use environment variables
3. Rotate API keys regularly
4. Use secret manager (AWS Secrets Manager)

#### 6.7 DDoS Protection
**Options:**
- Cloudflare (recommended for MVP)
- AWS Shield
- Rate limiting (already covered)

### Implementation Timeline: 1-2 weeks

### Security Checklist
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Database encryption enabled
- [ ] Audit logging implemented
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys rotated
- [ ] DDoS protection enabled
- [ ] Security audit passed

---

## 7. IMPLEMENTATION ROADMAP

### Week 1-2: Shadow Mode UI
- Build dashboard and monitoring components
- Integrate with shadow mode API
- Add real-time updates
- Write tests

### Week 3: SSL/TLS & Monitoring
- Configure custom domain and SSL
- Set up Sentry and logging
- Create monitoring dashboard
- Set up alerting

### Week 4-5: Testing
- Write unit tests (80% coverage)
- Write integration tests
- Write E2E tests
- Run load tests

### Week 6: Database & Security
- Optimize database queries
- Implement caching layer
- Add rate limiting
- Implement audit logging

### Week 7: Final Validation
- Security audit
- Performance testing
- Backup/restore testing
- Documentation

### Week 8: Production Deployment
- Deploy to production
- Run smoke tests
- Monitor for issues
- Prepare for customer onboarding

---

## 8. SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | 80%+ | ~30% |
| API Response Time (p95) | < 500ms | Unknown |
| Error Rate | < 0.5% | Unknown |
| Uptime | 99.9% | N/A |
| SSL Certificate Valid | Yes | No |
| Security Audit Pass | Yes | No |
| Database Backup | Daily | No |
| Monitoring Alerts | Configured | No |

---

## 9. DEPLOYMENT CHECKLIST

Before going live, verify:
- [ ] All tests passing (80%+ coverage)
- [ ] SSL certificate valid and green lock showing
- [ ] Monitoring and alerting configured
- [ ] Database backups automated
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Customer onboarding materials ready
- [ ] Incident response plan documented
- [ ] Team trained on production systems

---

## 10. NEXT STEPS

1. **Start Phase 1:** Shadow Mode UI (3-5 days)
2. **Parallel Phase 2:** SSL/TLS setup (1-2 days)
3. **Continue Phases 3-6:** Testing, monitoring, optimization, security (4-6 weeks)
4. **Final validation:** 1 week
5. **Production deployment:** Week 8

**Total Timeline:** 8 weeks to production-ready with Shadow Mode fully operational

---

## Questions & Support

For implementation details on any phase, refer to the specific section above or create a new task with specific requirements.
