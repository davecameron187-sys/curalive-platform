# Critical Production Readiness Implementation Guide

## Overview

This guide focuses on the 4 critical issues that MUST be resolved before customer onboarding:

1. **Test Coverage** (Currently ~30%, Target 80%+)
2. **Security Audit** (Not started)
3. **Monitoring** (Not configured)
4. **Database Backups** (Not automated)

**Timeline: 4 weeks to complete all 4 critical items**

---

## 1. COMPREHENSIVE TEST COVERAGE (Week 1-2)

### Current State
- Basic tests exist: `server/auth.logout.test.ts`, `server/round69.test.ts`
- Coverage: ~30% (need 80%+)
- Missing: Integration tests, E2E tests, load tests

### Implementation Plan

#### 1.1 Unit Tests (Week 1)

**Target Coverage: 80%+ of server code**

**Files to Test:**

```
server/
├── db.ts (Database helpers)
├── services/
│   ├── recommendationEngine.ts
│   ├── shadowModeService.ts
│   ├── eventService.ts
│   ├── recordingService.ts
│   └── analyticsService.ts
├── routers/
│   ├── shadowModeRouter.ts
│   ├── eventRouter.ts
│   ├── recordingRouter.ts
│   └── marketplaceRound69.ts
└── _core/
    ├── llm.ts
    ├── imageGeneration.ts
    └── voiceTranscription.ts
```

**Test Structure:**

```typescript
// server/services/shadowModeService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createShadowSession, endShadowSession, getShadowSession } from './shadowModeService';

describe('Shadow Mode Service', () => {
  describe('createShadowSession', () => {
    it('should create a new shadow session', async () => {
      // Test implementation
    });
    
    it('should validate required parameters', async () => {
      // Test implementation
    });
    
    it('should handle Recall.ai API errors', async () => {
      // Test implementation
    });
  });
  
  describe('endShadowSession', () => {
    it('should end an active session', async () => {
      // Test implementation
    });
    
    it('should save transcript and metrics', async () => {
      // Test implementation
    });
  });
});
```

**Test Files to Create:**

1. `server/services/shadowModeService.test.ts` (50+ tests)
2. `server/services/recommendationEngine.test.ts` (30+ tests)
3. `server/services/eventService.test.ts` (40+ tests)
4. `server/services/analyticsService.test.ts` (25+ tests)
5. `server/db.test.ts` (35+ tests)
6. `server/routers/shadowModeRouter.test.ts` (40+ tests)
7. `server/routers/eventRouter.test.ts` (35+ tests)

**Total: 250+ unit tests**

#### 1.2 Integration Tests (Week 1-2)

**Target: 60%+ integration coverage**

**Test Scenarios:**

```typescript
// server/integration/shadowMode.integration.test.ts
describe('Shadow Mode Integration', () => {
  describe('Full Shadow Session Flow', () => {
    it('should create session → start recording → end session', async () => {
      // 1. Create session via API
      // 2. Verify Recall.ai bot joined
      // 3. Simulate transcript segments
      // 4. End session
      // 5. Verify transcript saved
      // 6. Verify metrics generated
    });
  });
  
  describe('Recall.ai Integration', () => {
    it('should handle webhook events', async () => {
      // Test webhook payload processing
    });
    
    it('should retry failed API calls', async () => {
      // Test retry logic
    });
  });
  
  describe('Database Transactions', () => {
    it('should rollback on error', async () => {
      // Test transaction rollback
    });
  });
});
```

**Integration Test Files:**

1. `server/integration/shadowMode.integration.test.ts`
2. `server/integration/recallAi.integration.test.ts`
3. `server/integration/twilio.integration.test.ts`
4. `server/integration/database.integration.test.ts`

#### 1.3 End-to-End Tests (Week 2)

**Target: Key user workflows**

**E2E Test Scenarios:**

1. User Registration → Login → Create Event → Start Shadow Mode
2. Shadow Session Creation → Real-time Monitoring → End Session → View Analytics
3. Admin Moderation → Approve/Reject Template → View Moderation Log
4. Event Recording → Generate Report → Export Transcript

**E2E Test File:**

```typescript
// client/e2e/shadowMode.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Shadow Mode E2E', () => {
  test('should complete full shadow session workflow', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Navigate to Shadow Mode
    await page.goto('/shadow-mode');
    
    // 3. Create new session
    await page.click('button:has-text("Create Session")');
    await page.fill('input[name="eventName"]', 'Test Event');
    await page.selectOption('select[name="platform"]', 'zoom');
    await page.click('button:has-text("Start Session")');
    
    // 4. Verify session created
    await expect(page.locator('text=Live')).toBeVisible();
    
    // 5. Monitor session
    await expect(page.locator('text=Transcript')).toBeVisible();
    
    // 6. End session
    await page.click('button:has-text("End Session")');
    
    // 7. Verify session completed
    await expect(page.locator('text=Completed')).toBeVisible();
  });
});
```

#### 1.4 Load Testing (Week 2)

**Tools: k6 or Artillery**

**Load Test Scenarios:**

```javascript
// load-tests/shadowMode.load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
};

export default function () {
  // Test API endpoints under load
  let response = http.get('https://chorusai.example.com/api/trpc/shadowMode.listSessions');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Load Test Targets:**

- 100 concurrent users
- 1000 concurrent API requests
- Database with 1M+ records
- Real-time updates with 10K+ subscribers

### Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Unit Test Coverage | 80%+ | `pnpm test:coverage` |
| Integration Tests | 60%+ | All integration tests pass |
| E2E Tests | Key workflows | All E2E tests pass |
| Load Test (100 users) | < 500ms p95 | k6 report |
| Load Test (200 users) | < 1s p95 | k6 report |

---

## 2. SECURITY AUDIT (Week 2-3)

### Current State
- No formal security audit conducted
- Basic authentication implemented
- No rate limiting
- No input validation framework
- No audit logging

### Implementation Plan

#### 2.1 Code Security Review

**Areas to Review:**

1. **Authentication & Authorization**
   - [ ] JWT token validation
   - [ ] Session management
   - [ ] Role-based access control (RBAC)
   - [ ] API endpoint protection

2. **Input Validation**
   - [ ] API input validation (Zod schemas)
   - [ ] File upload validation
   - [ ] Database query parameterization
   - [ ] HTML/XSS prevention

3. **Data Protection**
   - [ ] Password hashing (bcrypt)
   - [ ] Sensitive data encryption
   - [ ] API key management
   - [ ] PII handling

4. **API Security**
   - [ ] CORS configuration
   - [ ] HTTP security headers
   - [ ] Rate limiting
   - [ ] Request size limits

5. **Database Security**
   - [ ] SQL injection prevention
   - [ ] Connection encryption
   - [ ] Access control
   - [ ] Data backup encryption

#### 2.2 Security Implementation

**Phase 1: Rate Limiting**

```typescript
// server/_core/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Too many requests',
});
```

**Phase 2: Security Headers**

```typescript
// server/_core/middleware/securityHeaders.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});
```

**Phase 3: Input Validation**

```typescript
// server/routers/shadowModeRouter.ts
import { z } from 'zod';

const createSessionSchema = z.object({
  eventName: z.string().min(1).max(255),
  clientName: z.string().min(1).max(255),
  platform: z.enum(['zoom', 'teams', 'webex', 'meet']),
  eventType: z.enum(['earnings_call', 'investor_day', 'board_meeting']),
  recordingUrl: z.string().url().optional(),
});

export const createSession = protectedProcedure
  .input(createSessionSchema)
  .mutation(async ({ input, ctx }) => {
    // Input is now validated by Zod
    return await shadowModeService.createSession(input, ctx.user.id);
  });
```

**Phase 4: Audit Logging**

```typescript
// server/_core/auditLog.ts
import { db } from '@/server/db';
import { auditLogs } from '@/drizzle/schema';

export async function logAuditEvent(
  userId: number,
  action: string,
  resource: string,
  resourceId: string,
  changes?: Record<string, any>
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    resource,
    resourceId,
    changes: JSON.stringify(changes),
    timestamp: new Date(),
    ipAddress: getClientIp(),
    userAgent: getUserAgent(),
  });
}
```

#### 2.3 Security Checklist

**Authentication & Authorization**
- [ ] JWT tokens have 1-hour expiration
- [ ] Refresh tokens stored securely (httpOnly cookies)
- [ ] Role-based access control enforced
- [ ] Admin endpoints require admin role
- [ ] User can only access own data

**Input Validation**
- [ ] All API inputs validated with Zod
- [ ] File uploads restricted to allowed types
- [ ] File size limits enforced (max 100MB)
- [ ] Database queries use parameterized statements
- [ ] HTML inputs sanitized

**Data Protection**
- [ ] Passwords hashed with bcrypt (cost: 12)
- [ ] API keys encrypted at rest
- [ ] Sensitive data fields encrypted
- [ ] PII not logged
- [ ] Secrets not in version control

**API Security**
- [ ] CORS allows only trusted origins
- [ ] Rate limiting enabled on all endpoints
- [ ] Request size limits enforced (max 10MB)
- [ ] Security headers configured
- [ ] HTTPS enforced

**Database Security**
- [ ] SSL/TLS for database connections
- [ ] Database user has minimal permissions
- [ ] Backups encrypted
- [ ] Connection pooling configured
- [ ] Slow query logging enabled

### Success Criteria

| Item | Status | Evidence |
|------|--------|----------|
| Code review completed | [ ] | Review document |
| Rate limiting implemented | [ ] | Tests passing |
| Security headers configured | [ ] | Browser DevTools |
| Input validation added | [ ] | Zod schemas |
| Audit logging implemented | [ ] | Logs in database |
| Security checklist passed | [ ] | All items checked |

---

## 3. PRODUCTION MONITORING (Week 3)

### Current State
- Basic console logging
- No error tracking
- No performance monitoring
- No alerting

### Implementation Plan

#### 3.1 Structured Logging with Pino

```typescript
// server/_core/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Usage
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error: err }, 'API error');
```

#### 3.2 Error Tracking with Sentry

```typescript
// server/_core/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});

// Express middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

#### 3.3 Performance Monitoring

**Metrics to Track:**

| Metric | Target | Alert |
|--------|--------|-------|
| API Response Time (p95) | < 500ms | > 2s |
| API Response Time (p99) | < 1s | > 5s |
| Database Query Time (p95) | < 100ms | > 500ms |
| Error Rate | < 0.5% | > 1% |
| CPU Usage | < 70% | > 90% |
| Memory Usage | < 70% | > 90% |
| Disk Usage | < 70% | > 90% |

#### 3.4 Alerting Rules

```typescript
// Sentry alerts
- Error rate > 1% → Slack notification
- Error rate > 5% → PagerDuty alert
- Specific error patterns → Slack notification

// Infrastructure alerts
- CPU > 90% → Slack notification
- Memory > 90% → Slack notification
- Disk > 90% → Slack notification
- Database connection pool exhausted → PagerDuty alert
```

### Success Criteria

- [ ] Pino logging configured
- [ ] Sentry account created and integrated
- [ ] Performance monitoring dashboard created
- [ ] Alerting rules configured
- [ ] Test alerts working

---

## 4. AUTOMATED DATABASE BACKUPS (Week 1)

### Current State
- No automated backups
- No backup verification
- No restore procedure

### Implementation Plan

#### 4.1 Backup Strategy

**Backup Schedule:**

- **Daily Backups:** Full backup at 2 AM UTC
- **Retention:** 30 days
- **Backup Location:** AWS S3
- **Backup Encryption:** AES-256

#### 4.2 Backup Implementation

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="chorus-ai-backup-${BACKUP_DATE}.sql.gz"
S3_BUCKET="chorus-ai-backups"

# Create backup
mysqldump \
  --host=$DB_HOST \
  --user=$DB_USER \
  --password=$DB_PASSWORD \
  --all-databases \
  --single-transaction \
  --quick \
  --lock-tables=false | gzip > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE s3://$S3_BUCKET/$BACKUP_FILE \
  --sse AES256 \
  --storage-class GLACIER_IR

# Cleanup
rm /tmp/$BACKUP_FILE

# Log
echo "Backup completed: $BACKUP_FILE" >> /var/log/backups.log
```

#### 4.3 Backup Verification

```bash
#!/bin/bash
# scripts/verify-backup.sh

# Download latest backup
LATEST_BACKUP=$(aws s3 ls s3://chorus-ai-backups/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp s3://chorus-ai-backups/$LATEST_BACKUP /tmp/$LATEST_BACKUP

# Verify backup integrity
gunzip -t /tmp/$LATEST_BACKUP

if [ $? -eq 0 ]; then
  echo "Backup verified: $LATEST_BACKUP"
else
  echo "Backup verification failed: $LATEST_BACKUP"
  exit 1
fi

rm /tmp/$LATEST_BACKUP
```

#### 4.4 Restore Procedure

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Download backup
aws s3 cp s3://chorus-ai-backups/$BACKUP_FILE /tmp/$BACKUP_FILE

# Restore database
gunzip < /tmp/$BACKUP_FILE | mysql \
  --host=$DB_HOST \
  --user=$DB_USER \
  --password=$DB_PASSWORD

# Cleanup
rm /tmp/$BACKUP_FILE

echo "Database restored from $BACKUP_FILE"
```

#### 4.5 Backup Monitoring

```typescript
// server/_core/backupMonitor.ts
import cron from 'node-cron';
import { logger } from './logger';

// Run backup verification daily at 3 AM UTC
cron.schedule('0 3 * * *', async () => {
  try {
    const result = await verifyLatestBackup();
    logger.info({ result }, 'Daily backup verification completed');
    
    if (!result.verified) {
      // Alert on backup failure
      await sendAlert('Backup verification failed', result.error);
    }
  } catch (error) {
    logger.error({ error }, 'Backup verification failed');
    await sendAlert('Backup verification error', error);
  }
});
```

### Success Criteria

- [ ] Daily backups automated
- [ ] Backups encrypted and stored in S3
- [ ] Backup verification script working
- [ ] Restore procedure tested
- [ ] Backup monitoring configured
- [ ] Alerts configured for backup failures

---

## Implementation Timeline

| Week | Task | Owner | Status |
|------|------|-------|--------|
| Week 1 | Database Backups | DevOps | [ ] |
| Week 1-2 | Test Coverage (Unit) | QA | [ ] |
| Week 2 | Test Coverage (Integration) | QA | [ ] |
| Week 2 | Test Coverage (E2E) | QA | [ ] |
| Week 2 | Test Coverage (Load) | QA | [ ] |
| Week 2-3 | Security Audit | Security | [ ] |
| Week 3 | Monitoring Setup | DevOps | [ ] |

---

## Success Criteria Summary

| Item | Target | Current | Status |
|------|--------|---------|--------|
| Test Coverage | 80%+ | ~30% | [ ] |
| Security Audit | Pass | Not started | [ ] |
| Monitoring | Configured | Not started | [ ] |
| Database Backups | Automated | Not started | [ ] |

---

## Next Steps

1. **Week 1:** Start database backups immediately (quickest win)
2. **Week 1-2:** Implement unit tests (foundation for other tests)
3. **Week 2:** Conduct security audit and implement fixes
4. **Week 3:** Set up monitoring and alerting

**Ready to start implementation?**
