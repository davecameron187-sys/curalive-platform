# AI Automated Moderator (AI-AM) — Implementation Guide

**Audience:** Engineering Team, Product Managers, QA Engineers  
**Purpose:** Detailed technical specifications and implementation roadmap  
**Last Updated:** March 9, 2026

---

## Table of Contents

1. [Phase 1: Alert-Only Mode Implementation](#phase-1-alert-only-mode-implementation)
2. [Phase 2: Auto-Actions Implementation](#phase-2-auto-actions-implementation)
3. [Phase 3: Full Automation Implementation](#phase-3-full-automation-implementation)
4. [Testing Strategy](#testing-strategy)
5. [Deployment & Rollout](#deployment--rollout)
6. [Monitoring & Observability](#monitoring--observability)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Phase 1: Alert-Only Mode Implementation

### 1.1 Sprint Breakdown (Weeks 1-8)

#### Week 1: Architecture & Setup
**Goal:** Finalize architecture, set up development environment, create project structure

**Tasks:**
- [ ] Design system architecture diagram (data flow, components, dependencies)
- [ ] Create database schema (migration files)
- [ ] Set up tRPC procedures skeleton
- [ ] Configure Manus Forge LLM integration
- [ ] Set up Ably WebSocket configuration

**Deliverables:**
- Architecture document with data flow diagrams
- Database migration files (ready to apply)
- tRPC router structure
- Integration configuration files

**Owner:** Tech Lead, Backend Lead

---

#### Week 2: Manus Forge LLM Integration
**Goal:** Integrate LLM for abuse detection, sentiment analysis, spam detection

**Tasks:**
- [ ] Implement abuse detection using GPT-4
  - Create prompt templates for abuse detection
  - Test on 100+ abuse/non-abuse examples
  - Measure accuracy and false positive rate
  
- [ ] Implement sentiment analysis
  - Create sentiment scoring system (0-100)
  - Define "bearish" threshold (e.g., <30)
  - Test on 100+ examples
  
- [ ] Implement spam/bot detection
  - Create pattern matching for repetitive content
  - Detect non-human behavior (e.g., rapid-fire messages)
  - Test on 50+ spam examples

- [ ] Create caching layer (Redis)
  - Cache LLM responses for duplicate content
  - Set TTL to 1 hour
  - Measure cache hit rate

**Deliverables:**
- LLM integration module with all three detection types
- Test results showing accuracy metrics
- Caching implementation with performance benchmarks
- Prompt templates and configuration

**Owner:** AI/ML Engineer

---

#### Week 3: Real-Time Alert Delivery
**Goal:** Implement Ably WebSocket for real-time alert delivery to operator console

**Tasks:**
- [ ] Set up Ably channel per event
  - Channel naming: `event:{eventId}:alerts`
  - Channel encryption enabled
  
- [ ] Implement alert publishing
  - Create alert object schema
  - Publish to Ably channel <100ms after detection
  - Implement retry logic with exponential backoff
  
- [ ] Implement alert subscription (frontend)
  - Subscribe to event alerts channel
  - Display alerts in Operator Console "Alarm" tab
  - Handle connection loss and reconnection
  
- [ ] Implement audit logging
  - Log all alerts to MySQL
  - Include timestamp, participant ID, detection type, confidence score
  - Enable full-text search on flagged content

**Deliverables:**
- Ably integration module
- Alert publishing system with latency monitoring
- Frontend alert subscription component
- Audit logging system

**Owner:** Backend Engineer, Frontend Engineer

---

#### Week 4: Operator Console UI
**Goal:** Build "Alarm" tab in Operator Console for alert management

**Tasks:**
- [ ] Design Alarm tab UI
  - Alert list with severity indicators
  - Real-time updates using Ably
  - Filters: detection type, severity, time range
  
- [ ] Implement alert actions
  - "Acknowledge" button (mark as reviewed)
  - "Dismiss" button with reason dropdown
  - "Escalate" button for high-severity alerts
  
- [ ] Implement alert details panel
  - Show flagged text/audio segment
  - Show confidence score
  - Show participant info (name, role, history)
  
- [ ] Implement alert history
  - Searchable log of all alerts for event
  - Export to CSV/PDF for compliance

**Deliverables:**
- Operator Console Alarm tab component
- Alert management UI
- Alert details panel
- Alert history view

**Owner:** Frontend Engineer

---

#### Week 5-6: Internal Testing
**Goal:** Test with 5 CuraLive operators, identify bugs, measure performance

**Tasks:**
- [ ] Prepare test scenarios
  - Simulate abuse/spam/sentiment anomalies
  - Test with 50+ events
  - Measure latency, accuracy, false positive rate
  
- [ ] Conduct operator testing
  - Train 5 operators on AI-AM
  - Have them run 10 events each
  - Collect feedback on UI, alert quality, usefulness
  
- [ ] Performance testing
  - Load test with 1000+ concurrent participants
  - Measure system latency under load
  - Identify bottlenecks and optimize
  
- [ ] Bug fixes and refinements
  - Fix critical bugs
  - Optimize latency
  - Improve alert quality based on feedback

**Deliverables:**
- Test results report (latency, accuracy, false positives)
- Operator feedback summary
- Performance benchmarks
- Bug fixes and optimizations

**Owner:** QA Lead, Backend Lead

---

#### Week 7: Beta Launch Preparation
**Goal:** Prepare for beta launch with 10-15 operators and 5 pilot customers

**Tasks:**
- [ ] Finalize operator training
  - Create training materials (docs, videos, screenshots)
  - Conduct training sessions
  - Measure operator proficiency
  
- [ ] Prepare customer onboarding
  - Create customer documentation
  - Prepare customer training sessions
  - Set up support channels
  
- [ ] Set up monitoring and alerting
  - Create dashboards for system health
  - Set up alerts for latency/errors
  - Prepare incident response playbook
  
- [ ] Prepare launch communication
  - Draft announcement for operators
  - Draft announcement for customers
  - Prepare FAQ document

**Deliverables:**
- Operator training materials
- Customer onboarding materials
- Monitoring dashboards and alerts
- Launch communication materials

**Owner:** Product Manager, Customer Success

---

#### Week 8: Beta Launch
**Goal:** Launch Phase 1 with 10-15 operators and 5 pilot customers

**Tasks:**
- [ ] Conduct operator training sessions
- [ ] Onboard 5 pilot customers
- [ ] Monitor system performance and alerts
- [ ] Collect feedback from operators and customers
- [ ] Prepare for Phase 1 → Phase 2 gate review

**Deliverables:**
- Beta launch report
- Operator feedback summary
- Customer feedback summary
- Performance metrics report

**Owner:** Product Manager, Customer Success

---

### 1.2 Database Schema (Phase 1)

```sql
-- Moderation Events (all alerts logged here)
CREATE TABLE ai_moderation_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eventId INT NOT NULL,
  participantId VARCHAR(255) NOT NULL,
  detectionType ENUM('abuse', 'sentiment_anomaly', 'spam', 'policy_violation') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  detectedText TEXT,
  detectedAudioUrl VARCHAR(500),
  aiModel VARCHAR(100) DEFAULT 'gpt-4',
  aiConfidenceScore FLOAT,
  operatorAction ENUM('acknowledged', 'dismissed', 'escalated') DEFAULT NULL,
  operatorActionReason TEXT,
  operatorActionAt TIMESTAMP NULL,
  operatorId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_event_participant (eventId, participantId),
  INDEX idx_created_at (createdAt),
  INDEX idx_severity (severity),
  FULLTEXT INDEX ft_detected_text (detectedText)
);

-- Participant Moderation History (for context)
CREATE TABLE participant_moderation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eventId INT NOT NULL,
  participantId VARCHAR(255) NOT NULL,
  totalAlerts INT DEFAULT 0,
  abusiveAlerts INT DEFAULT 0,
  spamAlerts INT DEFAULT 0,
  sentimentAnomalies INT DEFAULT 0,
  policyViolations INT DEFAULT 0,
  lastAlertAt TIMESTAMP,
  
  UNIQUE KEY unique_event_participant (eventId, participantId),
  INDEX idx_event (eventId)
);

-- Moderation Configuration (per event)
CREATE TABLE moderation_configuration (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eventId INT NOT NULL UNIQUE,
  abuseDetectionEnabled BOOLEAN DEFAULT TRUE,
  abuseConfidenceThreshold FLOAT DEFAULT 0.8,
  sentimentDetectionEnabled BOOLEAN DEFAULT TRUE,
  sentimentBearishThreshold INT DEFAULT 30,
  spamDetectionEnabled BOOLEAN DEFAULT TRUE,
  operatorNotificationsEnabled BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_event (eventId)
);
```

---

### 1.3 tRPC Procedures (Phase 1)

```typescript
// server/routers/aiModerator.ts

import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { ai_moderation_events } from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const aiModeratorRouter = router({
  // Get all alerts for an event
  getAlerts: operatorProcedure
    .input(z.object({
      eventId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      detectionType: z.enum(['abuse', 'sentiment_anomaly', 'spam', 'policy_violation']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select()
        .from(ai_moderation_events)
        .where(eq(ai_moderation_events.eventId, input.eventId));

      if (input.severity) {
        query = query.where(eq(ai_moderation_events.severity, input.severity));
      }

      if (input.detectionType) {
        query = query.where(eq(ai_moderation_events.detectionType, input.detectionType));
      }

      const alerts = await query
        .orderBy(desc(ai_moderation_events.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return alerts;
    }),

  // Acknowledge alert (mark as reviewed)
  acknowledgeAlert: operatorProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(ai_moderation_events)
        .set({
          operatorAction: 'acknowledged',
          operatorActionAt: new Date(),
          operatorId: ctx.user.id.toString(),
        })
        .where(eq(ai_moderation_events.id, input.alertId));

      return { success: true };
    }),

  // Dismiss alert with reason
  dismissAlert: operatorProcedure
    .input(z.object({
      alertId: z.number(),
      reason: z.string().max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(ai_moderation_events)
        .set({
          operatorAction: 'dismissed',
          operatorActionReason: input.reason,
          operatorActionAt: new Date(),
          operatorId: ctx.user.id.toString(),
        })
        .where(eq(ai_moderation_events.id, input.alertId));

      return { success: true };
    }),

  // Escalate alert to higher priority
  escalateAlert: operatorProcedure
    .input(z.object({
      alertId: z.number(),
      escalationLevel: z.enum(['medium', 'high', 'critical']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(ai_moderation_events)
        .set({
          operatorAction: 'escalated',
          severity: input.escalationLevel,
          operatorActionAt: new Date(),
          operatorId: ctx.user.id.toString(),
        })
        .where(eq(ai_moderation_events.id, input.alertId));

      return { success: true };
    }),

  // Get moderation configuration for event
  getConfiguration: operatorProcedure
    .input(z.object({
      eventId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [config] = await db.select()
        .from(moderation_configuration)
        .where(eq(moderation_configuration.eventId, input.eventId));

      return config || {
        eventId: input.eventId,
        abuseDetectionEnabled: true,
        abuseConfidenceThreshold: 0.8,
        sentimentDetectionEnabled: true,
        sentimentBearishThreshold: 30,
        spamDetectionEnabled: true,
        operatorNotificationsEnabled: true,
      };
    }),

  // Get alert statistics for event
  getAlertStats: operatorProcedure
    .input(z.object({
      eventId: z.number(),
      timeWindow: z.enum(['1h', '4h', '8h', '24h']).default('24h'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const timeWindowMs = {
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
        '8h': 8 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
      }[input.timeWindow];

      const since = new Date(Date.now() - timeWindowMs);

      const alerts = await db.select()
        .from(ai_moderation_events)
        .where(
          and(
            eq(ai_moderation_events.eventId, input.eventId),
            gte(ai_moderation_events.createdAt, since)
          )
        );

      return {
        totalAlerts: alerts.length,
        byDetectionType: {
          abuse: alerts.filter(a => a.detectionType === 'abuse').length,
          sentiment_anomaly: alerts.filter(a => a.detectionType === 'sentiment_anomaly').length,
          spam: alerts.filter(a => a.detectionType === 'spam').length,
          policy_violation: alerts.filter(a => a.detectionType === 'policy_violation').length,
        },
        bySeverity: {
          low: alerts.filter(a => a.severity === 'low').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          high: alerts.filter(a => a.severity === 'high').length,
          critical: alerts.filter(a => a.severity === 'critical').length,
        },
        acknowledged: alerts.filter(a => a.operatorAction === 'acknowledged').length,
        dismissed: alerts.filter(a => a.operatorAction === 'dismissed').length,
        escalated: alerts.filter(a => a.operatorAction === 'escalated').length,
      };
    }),

  // Get participant risk profile
  getParticipantRiskScore: operatorProcedure
    .input(z.object({
      eventId: z.number(),
      participantId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [history] = await db.select()
        .from(participant_moderation_history)
        .where(
          and(
            eq(participant_moderation_history.eventId, input.eventId),
            eq(participant_moderation_history.participantId, input.participantId)
          )
        );

      if (!history) {
        return {
          participantId: input.participantId,
          riskScore: 0,
          totalAlerts: 0,
          lastAlertAt: null,
        };
      }

      // Calculate risk score (0-100)
      const riskScore = Math.min(100, history.totalAlerts * 10);

      return {
        participantId: input.participantId,
        riskScore,
        totalAlerts: history.totalAlerts,
        abusiveAlerts: history.abusiveAlerts,
        spamAlerts: history.spamAlerts,
        sentimentAnomalies: history.sentimentAnomalies,
        policyViolations: history.policyViolations,
        lastAlertAt: history.lastAlertAt,
      };
    }),
});
```

---

### 1.4 LLM Integration (Phase 1)

```typescript
// server/_core/aiModerator.ts

import { invokeLLM } from "./llm";

interface DetectionResult {
  type: 'abuse' | 'sentiment_anomaly' | 'spam' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  reason: string;
}

export async function detectAbuse(text: string): Promise<DetectionResult | null> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a content moderation expert. Analyze the following text for abusive, inappropriate, or harmful language.
        
        Respond with JSON:
        {
          "isAbusive": boolean,
          "severity": "low" | "medium" | "high" | "critical",
          "confidence": 0.0-1.0,
          "reason": "explanation"
        }`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "abuse_detection",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isAbusive: { type: "boolean" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            confidence: { type: "number" },
            reason: { type: "string" },
          },
          required: ["isAbusive", "severity", "confidence", "reason"],
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);

  if (!result.isAbusive) return null;

  return {
    type: 'abuse',
    severity: result.severity,
    confidence: result.confidence,
    reason: result.reason,
  };
}

export async function detectSentimentAnomaly(
  text: string,
  bearishThreshold: number = 30
): Promise<DetectionResult | null> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Analyze the sentiment of the following text on a scale of 0-100, where:
        - 0-30: Very negative/bearish
        - 31-60: Neutral
        - 61-100: Positive/bullish
        
        Respond with JSON:
        {
          "sentimentScore": 0-100,
          "tone": "very_negative" | "negative" | "neutral" | "positive" | "very_positive",
          "confidence": 0.0-1.0,
          "reason": "explanation"
        }`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sentiment_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentimentScore: { type: "number" },
            tone: { type: "string" },
            confidence: { type: "number" },
            reason: { type: "string" },
          },
          required: ["sentimentScore", "tone", "confidence", "reason"],
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Trigger alert if sentiment is below threshold
  if (result.sentimentScore >= bearishThreshold) return null;

  return {
    type: 'sentiment_anomaly',
    severity: result.sentimentScore < 10 ? 'critical' : result.sentimentScore < 20 ? 'high' : 'medium',
    confidence: result.confidence,
    reason: `Bearish sentiment detected (score: ${result.sentimentScore}/100)`,
  };
}

export async function detectSpam(text: string): Promise<DetectionResult | null> {
  // Simple pattern-based spam detection
  const spamPatterns = [
    /(.)\1{4,}/gi, // 5+ repeated characters
    /\b(click here|buy now|limited offer|act now)\b/gi, // Common spam phrases
    /https?:\/\/[^\s]+/g, // Multiple URLs
  ];

  let spamScore = 0;

  for (const pattern of spamPatterns) {
    const matches = text.match(pattern);
    if (matches) spamScore += matches.length * 0.2;
  }

  if (spamScore < 0.5) return null;

  return {
    type: 'spam',
    severity: spamScore > 1.5 ? 'high' : 'medium',
    confidence: Math.min(1, spamScore),
    reason: `Spam pattern detected (score: ${spamScore.toFixed(2)})`,
  };
}
```

---

## Phase 2: Auto-Actions Implementation

### 2.1 Strike Count System

```typescript
// server/_core/strikeSystem.ts

interface StrikeConfig {
  strike1Action: 'warning' | 'none';
  strike2Action: 'mute_30s' | 'warning' | 'none';
  strike3Action: 'mute_5m' | 'escalate' | 'warning' | 'none';
  strikeResetAfter: number; // minutes
}

export async function recordViolation(
  eventId: number,
  participantId: string,
  violationType: string,
  config: StrikeConfig
): Promise<{ action: string; strikeCount: number }> {
  // Get current strike count from Redis
  const redisKey = `strikes:${eventId}:${participantId}`;
  let strikeCount = await redis.get(redisKey) || 0;

  // Increment strike count
  strikeCount++;
  await redis.setex(redisKey, config.strikeResetAfter * 60, strikeCount);

  // Determine action based on strike count
  let action = 'none';
  if (strikeCount === 1) action = config.strike1Action;
  else if (strikeCount === 2) action = config.strike2Action;
  else if (strikeCount >= 3) action = config.strike3Action;

  // Log to database
  await db.insert(strike_count_history).values({
    eventId,
    participantId,
    strikeCount,
    reason: violationType,
  });

  return { action, strikeCount };
}
```

---

## Phase 3: Full Automation Implementation

### 3.1 Industry-Specific Rule Templates

```typescript
// server/config/ruleTemplates.ts

export const RULE_TEMPLATES = {
  financial_services: {
    earnings_call: {
      rules: [
        {
          name: 'forward_looking_statements',
          keywords: ['will', 'expects', 'projects', 'targets', 'guidance', 'outlook'],
          action: 'escalate', // Always escalate to operator
          severity: 'high',
        },
        {
          name: 'insider_trading_language',
          keywords: ['buy', 'sell', 'hold', 'accumulate', 'divest'],
          action: 'warn', // Warn participant
          severity: 'medium',
        },
      ],
    },
  },
  healthcare: {
    webinar: {
      rules: [
        {
          name: 'hipaa_violation',
          keywords: ['patient', 'medical record', 'diagnosis', 'prescription'],
          action: 'mute_5m', // Immediate 5-minute mute
          severity: 'critical',
        },
      ],
    },
  },
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// server/routers/aiModerator.test.ts

import { describe, it, expect } from "vitest";
import { detectAbuse, detectSentimentAnomaly, detectSpam } from "../_core/aiModerator";

describe("AI Moderator Detection", () => {
  describe("Abuse Detection", () => {
    it("should detect abusive language", async () => {
      const result = await detectAbuse("You're a stupid idiot");
      expect(result).toBeDefined();
      expect(result?.type).toBe('abuse');
      expect(result?.confidence).toBeGreaterThan(0.8);
    });

    it("should not flag normal conversation", async () => {
      const result = await detectAbuse("Good morning, how are you?");
      expect(result).toBeNull();
    });
  });

  describe("Sentiment Analysis", () => {
    it("should detect bearish sentiment", async () => {
      const result = await detectSentimentAnomaly("This is terrible, worst day ever", 30);
      expect(result).toBeDefined();
      expect(result?.type).toBe('sentiment_anomaly');
    });

    it("should not flag positive sentiment", async () => {
      const result = await detectSentimentAnomaly("This is great, best day ever", 30);
      expect(result).toBeNull();
    });
  });

  describe("Spam Detection", () => {
    it("should detect spam patterns", async () => {
      const result = await detectSpam("CLICK HERE NOW!!! Limited offer!!!!");
      expect(result).toBeDefined();
      expect(result?.type).toBe('spam');
    });

    it("should not flag normal text", async () => {
      const result = await detectSpam("Let's discuss the quarterly results");
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

```typescript
// server/routers/aiModerator.integration.test.ts

import { describe, it, expect } from "vitest";
import { trpc } from "../_core/trpc";

describe("AI Moderator Integration", () => {
  it("should create alert and retrieve it", async () => {
    // Create alert
    const alert = await db.insert(ai_moderation_events).values({
      eventId: 1,
      participantId: "user123",
      detectionType: "abuse",
      severity: "high",
      detectedText: "You're stupid",
      aiConfidenceScore: 0.95,
    });

    // Retrieve alert
    const alerts = await trpc.aiModerator.getAlerts.query({
      eventId: 1,
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].detectionType).toBe("abuse");
  });

  it("should acknowledge alert", async () => {
    // Create alert
    const alert = await db.insert(ai_moderation_events).values({
      eventId: 1,
      participantId: "user123",
      detectionType: "abuse",
      severity: "high",
      detectedText: "You're stupid",
      aiConfidenceScore: 0.95,
    });

    // Acknowledge alert
    await trpc.aiModerator.acknowledgeAlert.mutate({
      alertId: alert.insertId,
    });

    // Verify alert is acknowledged
    const alerts = await trpc.aiModerator.getAlerts.query({
      eventId: 1,
    });

    expect(alerts[0].operatorAction).toBe("acknowledged");
  });
});
```

### Performance Tests

```typescript
// server/performance.test.ts

import { describe, it, expect } from "vitest";
import { detectAbuse } from "../_core/aiModerator";

describe("Performance Tests", () => {
  it("should detect abuse in <500ms", async () => {
    const startTime = Date.now();
    await detectAbuse("You're stupid");
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);
  });

  it("should handle 1000 concurrent detections", async () => {
    const startTime = Date.now();
    
    const promises = Array(1000).fill(null).map(() =>
      detectAbuse("You're stupid")
    );

    await Promise.all(promises);
    
    const endTime = Date.now();
    const avgLatency = (endTime - startTime) / 1000;

    expect(avgLatency).toBeLessThan(500);
  });
});
```

---

## Deployment & Rollout

### Deployment Checklist

**Pre-Deployment (Week Before)**
- [ ] Code review completed
- [ ] All tests passing (unit, integration, performance)
- [ ] Database migrations tested on staging
- [ ] Monitoring dashboards created
- [ ] Runbook prepared
- [ ] Rollback plan documented

**Deployment Day**
- [ ] Backup database
- [ ] Run database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify all systems operational
- [ ] Smoke test key features
- [ ] Monitor error rates and latency

**Post-Deployment**
- [ ] Monitor for 24 hours
- [ ] Collect operator feedback
- [ ] Address any critical issues
- [ ] Document lessons learned

---

## Monitoring & Observability

### Key Metrics to Monitor

```
Detection Latency:
- p50: <200ms
- p95: <400ms
- p99: <500ms

System Health:
- Uptime: >99.9%
- Error rate: <0.1%
- Database query latency: <100ms

Alert Quality:
- False positive rate: <15%
- LLM accuracy: >85%
- Operator satisfaction: >4.0/5.0
```

### Monitoring Dashboard

```
[Real-Time Metrics]
├─ Detection Latency (p50, p95, p99)
├─ Alerts/minute
├─ System uptime
├─ Error rate
├─ Database latency
└─ LLM API latency

[Alert Analytics]
├─ Alerts by detection type
├─ Alerts by severity
├─ False positive rate
├─ Operator actions (acknowledge, dismiss, escalate)
└─ Top participants by alert count

[Customer Health]
├─ Active events
├─ Operator satisfaction
├─ Support tickets
└─ Feature adoption rate
```

---

## Troubleshooting Guide

### Common Issues

**Issue: High Detection Latency (>500ms)**
- Check LLM API latency (may be slow)
- Check database query performance
- Check Ably WebSocket latency
- Solution: Add caching, optimize queries, scale infrastructure

**Issue: High False Positive Rate (>15%)**
- LLM may be too sensitive
- Solution: Adjust confidence thresholds, retrain model

**Issue: Alerts Not Reaching Operator Console**
- Check Ably WebSocket connection
- Check frontend subscription
- Solution: Verify Ably channel, check browser console for errors

**Issue: Database Growing Too Fast**
- Archive old alerts to S3
- Implement data retention policy
- Solution: Set up automated archival job

---

## Success Criteria Checklist

**Phase 1 Complete When:**
- [ ] Detection latency <500ms (95% of alerts)
- [ ] False positive rate <15%
- [ ] LLM accuracy >85%
- [ ] Operator satisfaction >4.0/5.0
- [ ] Zero critical bugs
- [ ] All 5 pilot customers willing to continue
- [ ] Steering committee approves Phase 2

**Phase 2 Complete When:**
- [ ] Action execution latency <200ms (98% of actions)
- [ ] Strike system accuracy >95%
- [ ] Mute reliability ≥99.5%
- [ ] Operator adoption >70%
- [ ] Customer upgrade rate >60%
- [ ] Steering committee approves Phase 3

**Phase 3 Complete When:**
- [ ] Model accuracy >92%
- [ ] Autonomous action reliability 99.8%
- [ ] Operator intervention rate <20%
- [ ] Customer satisfaction >4.5/5.0
- [ ] 25+ customers signed up
- [ ] Steering committee approves general availability

---

**Document Status:** READY FOR IMPLEMENTATION  
**Last Updated:** March 9, 2026  
**Next Review:** End of Phase 1 (Month 2)

