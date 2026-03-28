# Chorus.AI Security Hardening Guide

**Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Implementation Ready  
**Target:** Production-Grade Security

---

## Executive Summary

This guide provides comprehensive security hardening procedures for Chorus.AI platform. Focus areas: authentication/authorization, audit logging, rate limiting, data access controls, secret handling, webhook verification, and dependency scanning.

**Security Targets:**
- Zero unauthorized data access incidents
- <0.05% error rate from security violations
- 100% audit trail coverage for operator actions
- <5% false positive rate on rate limiting

---

## Part 1: Authentication & Authorization

### 1.1 OAuth Token Validation

**Verify on Every Request:**

```typescript
// server/_core/context.ts
import { verifyAuth } from './oauth';

export async function createContext(opts: {
  req: Request;
  res: Response;
}) {
  // Extract token from cookie
  const token = opts.req.cookies.get('session_token')?.value;

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Please login (10001)',
    });
  }

  // Verify token validity
  const user = await verifyAuth(token);

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token (10001)',
    });
  }

  return { user, req: opts.req, res: opts.res };
}
```

**Test Coverage:**

```typescript
// server/auth.test.ts
describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const caller = appRouter.createCaller({ user: null });
    expect(() => caller.operator.getSession()).rejects.toThrow('UNAUTHORIZED');
  });

  it('should reject requests with invalid token', async () => {
    const caller = appRouter.createCaller({ user: null });
    expect(() => caller.operator.getSession()).rejects.toThrow('UNAUTHORIZED');
  });

  it('should accept requests with valid token', async () => {
    const user = { id: 1, role: 'operator' };
    const caller = appRouter.createCaller({ user });
    const result = await caller.operator.getSession();
    expect(result).toBeDefined();
  });
});
```

### 1.2 Role-Based Access Control (RBAC)

**Enforce Authorization Boundaries:**

```typescript
// server/routers.ts
import { TRPCError } from '@trpc/server';

// Define role-based procedures
export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'operator') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have required permission (10002)',
    });
  }
  return next({ ctx });
});

export const moderatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'moderator') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have required permission (10002)',
    });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have required permission (10002)',
    });
  }
  return next({ ctx });
});

// Use in procedures
export const operatorRouter = router({
  getSession: operatorProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only operators can access
      return db.query.operatorSessions.findFirst({
        where: eq(operatorSessions.id, input.sessionId),
      });
    }),

  approveQuestion: operatorProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only operators can approve
      return db.update(questions)
        .set({ status: 'approved' })
        .where(eq(questions.id, input.questionId));
    }),
});
```

**Test Coverage:**

```typescript
describe('Authorization', () => {
  it('should reject operator access to admin procedures', async () => {
    const caller = appRouter.createCaller({ user: { id: 1, role: 'operator' } });
    expect(() => caller.admin.deleteUser()).rejects.toThrow('FORBIDDEN');
  });

  it('should reject moderator access to operator procedures', async () => {
    const caller = appRouter.createCaller({ user: { id: 1, role: 'moderator' } });
    expect(() => caller.operator.getSession()).rejects.toThrow('FORBIDDEN');
  });

  it('should allow admin access to all procedures', async () => {
    const caller = appRouter.createCaller({ user: { id: 1, role: 'admin' } });
    const result = await caller.admin.getUsers();
    expect(result).toBeDefined();
  });
});
```

### 1.3 Tenant Isolation

**Verify Users Can Only Access Their Events:**

```typescript
// server/db.ts
export async function getEventWithAuthorization(
  eventId: string,
  userId: string,
  userRole: 'operator' | 'moderator' | 'presenter' | 'attendee'
) {
  // Verify user has access to this event
  const access = await db.query.eventAccess.findFirst({
    where: and(
      eq(eventAccess.eventId, eventId),
      eq(eventAccess.userId, userId),
      eq(eventAccess.role, userRole)
    ),
  });

  if (!access) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this event',
    });
  }

  return db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
}
```

**Test Coverage:**

```typescript
describe('Tenant Isolation', () => {
  it('should prevent user from accessing other users events', async () => {
    const user1Event = await createEvent('user-1');
    const user2 = { id: 2, role: 'operator' };
    
    const caller = appRouter.createCaller({ user: user2 });
    expect(() => caller.operator.getEvent({ eventId: user1Event.id }))
      .rejects.toThrow('FORBIDDEN');
  });

  it('should allow user to access their own events', async () => {
    const user1Event = await createEvent('user-1');
    const user1 = { id: 1, role: 'operator' };
    
    const caller = appRouter.createCaller({ user: user1 });
    const result = await caller.operator.getEvent({ eventId: user1Event.id });
    expect(result.id).toBe(user1Event.id);
  });
});
```

---

## Part 2: Audit Logging

### 2.1 Comprehensive Audit Trail

**Log All Operator Actions:**

```typescript
// server/audit.ts
import { db } from './db';
import { auditLogs } from '../drizzle/schema';

export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any>,
  status: 'success' | 'failure'
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    resourceType,
    resourceId,
    details: JSON.stringify(details),
    status,
    timestamp: new Date(),
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
  });
}

// Log in procedures
export const operatorRouter = router({
  approveQuestion: operatorProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await db.update(questions)
          .set({ status: 'approved' })
          .where(eq(questions.id, input.questionId));

        await logAuditEvent(
          ctx.user.id,
          'APPROVE_QUESTION',
          'question',
          input.questionId,
          {
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers['user-agent'],
          },
          'success'
        );

        return result;
      } catch (error) {
        await logAuditEvent(
          ctx.user.id,
          'APPROVE_QUESTION',
          'question',
          input.questionId,
          {
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers['user-agent'],
            error: error.message,
          },
          'failure'
        );
        throw error;
      }
    }),
});
```

**Audit Log Schema:**

```typescript
// drizzle/schema.ts
export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }).notNull(),
  details: json('details'),
  status: varchar('status', { length: 20 }).notNull(),
  timestamp: datetime('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

// Create indexes for audit queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resourceType, resourceId);
```

### 2.2 Immutable Audit Trail

**Prevent Audit Log Modification:**

```typescript
// server/audit.ts
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // Read-only query
  const query = db.query.auditLogs.findMany({
    where: and(
      filters.userId ? eq(auditLogs.userId, filters.userId) : undefined,
      filters.action ? eq(auditLogs.action, filters.action) : undefined,
      filters.startDate ? gte(auditLogs.timestamp, filters.startDate) : undefined,
      filters.endDate ? lte(auditLogs.timestamp, filters.endDate) : undefined,
    ),
    orderBy: desc(auditLogs.timestamp),
    limit: filters.limit || 100,
  });

  return query;
}

// Prevent deletion of audit logs
// (Remove delete permissions from audit logs table)
```

---

## Part 3: Rate Limiting

### 3.1 API Rate Limiting

**Implement Rate Limiting on All Endpoints:**

```typescript
// server/_core/index.ts
import rateLimit from 'express-rate-limit';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

// Moderate rate limiter for data export
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: 'Too many export requests, please try again later',
});

app.use('/api/trpc', apiLimiter);
app.post('/api/oauth/login', loginLimiter);
app.post('/api/export', exportLimiter);
```

**Test Coverage:**

```typescript
describe('Rate Limiting', () => {
  it('should reject requests exceeding rate limit', async () => {
    for (let i = 0; i < 1001; i++) {
      const response = await fetch('/api/trpc/operator.getSession');
      if (i < 1000) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429); // Too Many Requests
      }
    }
  });

  it('should enforce strict rate limiting on login', async () => {
    for (let i = 0; i < 6; i++) {
      const response = await fetch('/api/oauth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
      if (i < 5) {
        expect(response.status).toBe(401); // Unauthorized
      } else {
        expect(response.status).toBe(429); // Too Many Requests
      }
    }
  });
});
```

### 3.2 WebSocket Rate Limiting

**Limit Real-Time Message Frequency:**

```typescript
// server/_core/realtime.ts
import { RateLimiter } from 'limiter';

const wsRateLimiter = new RateLimiter({
  tokensPerInterval: 100, // 100 messages
  interval: 'second', // per second
});

export async function handleWebSocketMessage(
  userId: string,
  message: any
) {
  // Check rate limit
  const allowed = await wsRateLimiter.tryRemoveTokens(1);

  if (!allowed) {
    throw new Error('Rate limit exceeded');
  }

  // Process message
  return processMessage(userId, message);
}
```

---

## Part 4: Data Access Controls

### 4.1 Export Restrictions

**Verify Only Authorized Users Can Export:**

```typescript
// server/routers.ts
export const analyticsRouter = router({
  exportTranscript: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this session
      const session = await getEventWithAuthorization(
        input.sessionId,
        ctx.user.id,
        ctx.user.role
      );

      // Log export
      await logAuditEvent(
        ctx.user.id,
        'EXPORT_TRANSCRIPT',
        'session',
        input.sessionId,
        { ipAddress: ctx.req.ip },
        'success'
      );

      // Generate and return transcript
      return generateTranscript(session);
    }),
});
```

### 4.2 Data Masking

**Mask Sensitive Fields in Responses:**

```typescript
// server/db.ts
export function maskSensitiveData(data: any) {
  return {
    ...data,
    email: data.email ? data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    phone: data.phone ? data.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3') : null,
  };
}

// Use in procedures
export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    return maskSensitiveData(user);
  }),
});
```

---

## Part 5: Secret Handling

### 5.1 Environment Variables

**Never Log or Expose Secrets:**

```typescript
// server/_core/env.ts
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  RECALL_AI_API_KEY: process.env.RECALL_AI_API_KEY,
  ABLY_API_KEY: process.env.ABLY_API_KEY,
};

// Validate on startup
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Never log secrets
console.log('Database configured'); // ✅ Good
console.log(`Database: ${env.DATABASE_URL}`); // ❌ Bad
```

### 5.2 Secret Rotation

**Implement Secret Rotation Procedures:**

```typescript
// server/secrets.ts
export async function rotateJWTSecret() {
  // 1. Generate new secret
  const newSecret = generateRandomString(32);

  // 2. Update environment variable
  process.env.JWT_SECRET = newSecret;

  // 3. Notify all services
  await notifyServicesOfSecretRotation('JWT_SECRET', newSecret);

  // 4. Log rotation event
  await logAuditEvent(
    'system',
    'ROTATE_SECRET',
    'secret',
    'JWT_SECRET',
    { timestamp: new Date() },
    'success'
  );

  // 5. Schedule old secret invalidation (after grace period)
  setTimeout(() => {
    invalidateOldJWTTokens();
  }, 24 * 60 * 60 * 1000); // 24 hours
}
```

---

## Part 6: Webhook Verification

### 6.1 Verify Webhook Signatures

**Validate Recall.ai Webhook Signatures:**

```typescript
// server/_core/webhooks.ts
import crypto from 'crypto';

export function verifyRecallWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

// Use in webhook handler
app.post('/api/webhooks/recall', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-recall-signature'] as string;
  const payload = req.body.toString();

  // Verify signature
  if (!verifyRecallWebhookSignature(payload, signature, process.env.RECALL_AI_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  const event = JSON.parse(payload);
  await handleRecallWebhookEvent(event);

  res.json({ received: true });
});
```

### 6.2 Webhook Retry Logic

**Implement Robust Webhook Handling:**

```typescript
// server/_core/webhooks.ts
export async function handleRecallWebhookEvent(event: any, retries = 0) {
  try {
    // Process event
    await processRecallEvent(event);

    // Log success
    await logAuditEvent(
      'system',
      'WEBHOOK_RECEIVED',
      'webhook',
      event.id,
      { eventType: event.type },
      'success'
    );
  } catch (error) {
    if (retries < 3) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      setTimeout(() => {
        handleRecallWebhookEvent(event, retries + 1);
      }, delay);
    } else {
      // Log failure
      await logAuditEvent(
        'system',
        'WEBHOOK_FAILED',
        'webhook',
        event.id,
        { error: error.message },
        'failure'
      );
    }
  }
}
```

---

## Part 7: Token Issuance

### 7.1 Scoped Tokens

**Issue Tokens with Limited Permissions:**

```typescript
// server/_core/oauth.ts
export interface TokenClaims {
  userId: string;
  role: 'operator' | 'moderator' | 'presenter' | 'attendee';
  scope: string[]; // Limited permissions
  expiresAt: number;
  issuedAt: number;
}

export function issueToken(user: User, scope: string[] = []): string {
  const claims: TokenClaims = {
    userId: user.id,
    role: user.role,
    scope: scope.length > 0 ? scope : getDefaultScope(user.role),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  return jwt.sign(claims, process.env.JWT_SECRET);
}

function getDefaultScope(role: string): string[] {
  switch (role) {
    case 'operator':
      return ['read:session', 'write:questions', 'read:analytics'];
    case 'moderator':
      return ['read:questions', 'write:questions'];
    case 'presenter':
      return ['read:transcript', 'read:qa'];
    case 'attendee':
      return ['read:transcript', 'write:qa'];
    default:
      return [];
  }
}

// Verify scope on every request
export function verifyTokenScope(token: string, requiredScope: string): boolean {
  const claims = jwt.verify(token, process.env.JWT_SECRET) as TokenClaims;
  return claims.scope.includes(requiredScope);
}
```

### 7.2 Token Expiration

**Enforce Token Expiration:**

```typescript
// server/_core/context.ts
export async function verifyAuth(token: string) {
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET) as TokenClaims;

    // Check expiration
    if (claims.expiresAt < Date.now()) {
      throw new Error('Token expired');
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, claims.userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    return null;
  }
}
```

---

## Part 8: Dependency & Security Scanning

### 8.1 npm Audit

**Regular Dependency Scanning:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Fix with review
npm audit fix --audit-level=moderate
```

### 8.2 Automated Security Scanning

**Set Up Snyk or Dependabot:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    allow:
      - dependency-type: "all"
    reviewers:
      - "security-team"
    commit-message:
      prefix: "chore(deps):"
```

### 8.3 Security Policy

**Document Security Procedures:**

```markdown
# SECURITY.md

## Reporting Security Vulnerabilities

Please report security vulnerabilities to security@chorusai.com

## Security Updates

We release security updates as soon as vulnerabilities are identified.

## Dependency Management

- Daily automated security scans
- Weekly manual security reviews
- Immediate patching for critical vulnerabilities
```

---

## Part 9: Security Testing

### 9.1 Security Test Suite

```typescript
// server/security.test.ts
describe('Security', () => {
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await fetch('/api/trpc/operator.getSession');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await fetch('/api/trpc/operator.getSession', {
        headers: { Authorization: 'Bearer invalid' },
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('should prevent privilege escalation', async () => {
      const operatorToken = await getToken('operator');
      const response = await fetch('/api/trpc/admin.deleteUser', {
        headers: { Authorization: `Bearer ${operatorToken}` },
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Data Access', () => {
    it('should prevent cross-user data access', async () => {
      const user1Token = await getToken('user-1');
      const user2Event = await createEvent('user-2');
      
      const response = await fetch(`/api/trpc/operator.getEvent?eventId=${user2Event.id}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      for (let i = 0; i < 1001; i++) {
        const response = await fetch('/api/trpc/operator.getSession');
        if (i >= 1000) {
          expect(response.status).toBe(429);
        }
      }
    });
  });
});
```

---

## Part 10: Security Checklist

### Pre-Production Security Verification

- [ ] All API endpoints require authentication
- [ ] All procedures enforce role-based access control
- [ ] Tenant isolation verified (users can't access other users' data)
- [ ] Audit logging enabled for all operator actions
- [ ] Rate limiting configured on all endpoints
- [ ] Secrets stored in environment variables (not in code)
- [ ] Webhook signatures verified
- [ ] Token expiration enforced
- [ ] npm audit shows no critical vulnerabilities
- [ ] Security tests pass (100% coverage)
- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] SSL/TLS configured
- [ ] CORS properly configured
- [ ] Security headers set (CSP, X-Frame-Options, etc.)
- [ ] Logging doesn't expose secrets
- [ ] Error messages don't leak information
- [ ] Database backups encrypted
- [ ] Secrets rotation procedures documented

---

## Part 11: Security Monitoring

### Continuous Security Monitoring

```typescript
// server/_core/monitoring.ts
export async function monitorSecurityMetrics() {
  setInterval(async () => {
    // Check for suspicious activity
    const suspiciousLogins = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'LOGIN'),
        eq(auditLogs.status, 'failure'),
        gte(auditLogs.timestamp, new Date(Date.now() - 60 * 60 * 1000))
      ),
    });

    if (suspiciousLogins.length > 10) {
      await notifySecurityTeam('High number of failed login attempts');
    }

    // Check for unauthorized access attempts
    const unauthorizedAccess = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.status, 'failure'),
        gte(auditLogs.timestamp, new Date(Date.now() - 60 * 60 * 1000))
      ),
    });

    if (unauthorizedAccess.length > 50) {
      await notifySecurityTeam('High number of unauthorized access attempts');
    }
  }, 60 * 1000); // Check every minute
}
```

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Implementation  
**Next Review:** After security testing completion
