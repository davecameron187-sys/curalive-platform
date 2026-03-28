# Custom Compliance Rules Implementation Guide

**Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Implementation Ready  
**Priority:** TOP - Highest Customer Value

---

## Executive Summary

This guide implements custom compliance rules engine allowing operators to define, manage, and apply custom compliance rules to Q&A questions in real-time. Enables enterprise customers to enforce industry-specific compliance policies.

**Key Features:**
- Rule creation/editing/deletion via admin UI
- Real-time rule evaluation on new questions
- Rule versioning and audit trail
- Bulk rule import/export
- Rule performance monitoring
- False positive tracking

---

## Part 1: Database Schema

### 1.1 Compliance Rules Table

```typescript
// drizzle/schema.ts
export const complianceRules = mysqlTable('compliance_rules', {
  id: int('id').primaryKey().autoincrement(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'keyword', 'pattern', 'sentiment', 'custom'
  ruleExpression: text('rule_expression').notNull(), // JSON or regex
  severity: varchar('severity', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  action: varchar('action', { length: 50 }).notNull(), // 'flag', 'hold', 'reject', 'alert'
  enabled: boolean('enabled').notNull().default(true),
  version: int('version').notNull().default(1),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: datetime('created_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: datetime('updated_at').onUpdateNow(),
});

// Rule Evaluations (audit trail)
export const ruleEvaluations = mysqlTable('rule_evaluations', {
  id: int('id').primaryKey().autoincrement(),
  ruleId: int('rule_id').notNull(),
  questionId: varchar('question_id', { length: 255 }).notNull(),
  matched: boolean('matched').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  evaluatedAt: datetime('evaluated_at').notNull().defaultNow(),
});

// Rule Versions (history)
export const ruleVersions = mysqlTable('rule_versions', {
  id: int('id').primaryKey().autoincrement(),
  ruleId: int('rule_id').notNull(),
  version: int('version').notNull(),
  ruleExpression: text('rule_expression').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  changedBy: varchar('changed_by', { length: 255 }).notNull(),
  changedAt: datetime('changed_at').notNull().defaultNow(),
  changeReason: text('change_reason'),
});

// Create indexes
CREATE INDEX idx_compliance_rules_event_id ON compliance_rules(event_id);
CREATE INDEX idx_compliance_rules_enabled ON compliance_rules(enabled);
CREATE INDEX idx_rule_evaluations_rule_id ON rule_evaluations(ruleId);
CREATE INDEX idx_rule_evaluations_question_id ON rule_evaluations(questionId);
CREATE INDEX idx_rule_versions_rule_id ON rule_versions(ruleId);
```

---

## Part 2: Rule Types

### 2.1 Keyword-Based Rules

**Match specific keywords or phrases:**

```typescript
// server/compliance/rules.ts
export interface KeywordRule {
  type: 'keyword';
  keywords: string[];
  caseSensitive: boolean;
  matchType: 'any' | 'all'; // Match any or all keywords
}

export function evaluateKeywordRule(
  text: string,
  rule: KeywordRule
): { matched: boolean; confidence: number } {
  const normalizedText = rule.caseSensitive ? text : text.toLowerCase();
  const normalizedKeywords = rule.keywords.map(k =>
    rule.caseSensitive ? k : k.toLowerCase()
  );

  const matches = normalizedKeywords.filter(k => normalizedText.includes(k));

  if (rule.matchType === 'any') {
    return {
      matched: matches.length > 0,
      confidence: matches.length / normalizedKeywords.length,
    };
  } else {
    return {
      matched: matches.length === normalizedKeywords.length,
      confidence: matches.length === normalizedKeywords.length ? 1.0 : 0.0,
    };
  }
}

// Example: Flag questions mentioning specific products
const productRule: KeywordRule = {
  type: 'keyword',
  keywords: ['competitor-product-name', 'patent-pending-tech'],
  caseSensitive: false,
  matchType: 'any',
};
```

### 2.2 Pattern-Based Rules

**Match regex patterns:**

```typescript
// server/compliance/rules.ts
export interface PatternRule {
  type: 'pattern';
  pattern: string; // Regex pattern
  flags: string; // 'i' for case-insensitive, 'g' for global
}

export function evaluatePatternRule(
  text: string,
  rule: PatternRule
): { matched: boolean; confidence: number } {
  try {
    const regex = new RegExp(rule.pattern, rule.flags);
    const matches = text.match(regex);

    return {
      matched: !!matches,
      confidence: matches ? 1.0 : 0.0,
    };
  } catch (error) {
    console.error('Invalid regex pattern:', rule.pattern);
    return { matched: false, confidence: 0 };
  }
}

// Example: Flag questions with phone numbers
const phoneNumberRule: PatternRule = {
  type: 'pattern',
  pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
  flags: 'g',
};

// Example: Flag questions with email addresses
const emailRule: PatternRule = {
  type: 'pattern',
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  flags: 'g',
};
```

### 2.3 Sentiment-Based Rules

**Match based on sentiment score:**

```typescript
// server/compliance/rules.ts
export interface SentimentRule {
  type: 'sentiment';
  minSentiment: number; // -1 to 1
  maxSentiment: number; // -1 to 1
}

export function evaluateSentimentRule(
  sentiment: number,
  rule: SentimentRule
): { matched: boolean; confidence: number } {
  const matched = sentiment >= rule.minSentiment && sentiment <= rule.maxSentiment;

  return {
    matched,
    confidence: matched ? 1.0 : 0.0,
  };
}

// Example: Flag highly negative questions
const negativeRule: SentimentRule = {
  type: 'sentiment',
  minSentiment: -1,
  maxSentiment: -0.7,
};

// Example: Flag neutral questions (potential spam)
const neutralRule: SentimentRule = {
  type: 'sentiment',
  minSentiment: -0.2,
  maxSentiment: 0.2,
};
```

### 2.4 Custom Rules

**Execute custom JavaScript logic:**

```typescript
// server/compliance/rules.ts
export interface CustomRule {
  type: 'custom';
  code: string; // JavaScript function code
}

export function evaluateCustomRule(
  text: string,
  sentiment: number,
  metadata: any,
  rule: CustomRule
): { matched: boolean; confidence: number } {
  try {
    // Create safe function from code
    const func = new Function('text', 'sentiment', 'metadata', rule.code);
    const result = func(text, sentiment, metadata);

    return {
      matched: !!result.matched,
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error('Error evaluating custom rule:', error);
    return { matched: false, confidence: 0 };
  }
}

// Example: Flag questions from specific speakers
const speakerRule: CustomRule = {
  type: 'custom',
  code: `
    return {
      matched: metadata.speakerId === 'speaker-123',
      confidence: 1.0
    };
  `,
};

// Example: Flag questions with mixed sentiment and negative keywords
const complexRule: CustomRule = {
  type: 'custom',
  code: `
    const hasNegativeKeywords = ['bad', 'terrible', 'awful'].some(k => text.toLowerCase().includes(k));
    const hasNeutralSentiment = sentiment > -0.3 && sentiment < 0.3;
    
    return {
      matched: hasNegativeKeywords && hasNeutralSentiment,
      confidence: hasNegativeKeywords ? 0.8 : 0.0
    };
  `,
};
```

---

## Part 3: Rule Engine

### 3.1 Evaluate All Rules

```typescript
// server/compliance/engine.ts
import { db } from '../db';
import { complianceRules, ruleEvaluations } from '../../drizzle/schema';

export async function evaluateQuestionAgainstRules(
  questionId: string,
  questionText: string,
  sentiment: number,
  eventId: string,
  metadata: any = {}
): Promise<{
  violations: Array<{
    ruleId: number;
    ruleName: string;
    severity: string;
    action: string;
    confidence: number;
  }>;
  highestSeverity: string;
  recommendedAction: string;
}> {
  // Get all enabled rules for this event
  const rules = await db.query.complianceRules.findMany({
    where: and(
      eq(complianceRules.eventId, eventId),
      eq(complianceRules.enabled, true)
    ),
  });

  const violations = [];
  let highestSeverity = 'low';

  // Evaluate each rule
  for (const rule of rules) {
    const ruleExpression = JSON.parse(rule.ruleExpression);
    let evaluation;

    switch (rule.ruleType) {
      case 'keyword':
        evaluation = evaluateKeywordRule(questionText, ruleExpression);
        break;
      case 'pattern':
        evaluation = evaluatePatternRule(questionText, ruleExpression);
        break;
      case 'sentiment':
        evaluation = evaluateSentimentRule(sentiment, ruleExpression);
        break;
      case 'custom':
        evaluation = evaluateCustomRule(questionText, sentiment, metadata, ruleExpression);
        break;
      default:
        evaluation = { matched: false, confidence: 0 };
    }

    // Log evaluation
    await db.insert(ruleEvaluations).values({
      ruleId: rule.id,
      questionId,
      matched: evaluation.matched,
      confidence: evaluation.confidence,
    });

    // Add to violations if matched
    if (evaluation.matched) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        action: rule.action,
        confidence: evaluation.confidence,
      });

      // Update highest severity
      if (getSeverityScore(rule.severity) > getSeverityScore(highestSeverity)) {
        highestSeverity = rule.severity;
      }
    }
  }

  // Determine recommended action
  const recommendedAction = determineAction(violations);

  return {
    violations,
    highestSeverity,
    recommendedAction,
  };
}

function getSeverityScore(severity: string): number {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return scores[severity] || 0;
}

function determineAction(violations: any[]): string {
  if (violations.length === 0) return 'approve';

  // Check for critical violations
  if (violations.some(v => v.severity === 'critical')) {
    return 'reject';
  }

  // Check for high severity violations
  if (violations.some(v => v.severity === 'high')) {
    return 'hold';
  }

  // Check for medium severity violations
  if (violations.some(v => v.severity === 'medium')) {
    return 'flag';
  }

  return 'flag';
}
```

### 3.2 Integrate with Question Processing

```typescript
// server/routers.ts
export const moderatorRouter = router({
  submitQuestion: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      text: z.string(),
      speakerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create question
      const question = await db.insert(questions).values({
        sessionId: input.sessionId,
        text: input.text,
        speakerId: input.speakerId,
        sentiment: await calculateSentiment(input.text),
        status: 'pending',
      });

      // Evaluate compliance rules
      const session = await db.query.operatorSessions.findFirst({
        where: eq(operatorSessions.id, input.sessionId),
      });

      const compliance = await evaluateQuestionAgainstRules(
        question.id,
        input.text,
        question.sentiment,
        session.eventId,
        { speakerId: input.speakerId }
      );

      // Update question with compliance risk
      await db.update(questions)
        .set({
          complianceRisk: compliance.violations.length > 0 ? 0.8 : 0.2,
          complianceViolations: JSON.stringify(compliance.violations),
          recommendedAction: compliance.recommendedAction,
        })
        .where(eq(questions.id, question.id));

      // Broadcast to moderators
      await ably.channels.get(`session:${input.sessionId}`)
        .publish('question-submitted', {
          questionId: question.id,
          text: input.text,
          complianceRisk: compliance.violations.length > 0 ? 0.8 : 0.2,
          violations: compliance.violations,
          recommendedAction: compliance.recommendedAction,
        });

      return question;
    }),
});
```

---

## Part 4: Admin UI for Rule Management

### 4.1 Create Rule API

```typescript
// server/routers.ts
export const adminRouter = router({
  createComplianceRule: adminProcedure
    .input(z.object({
      eventId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      ruleType: z.enum(['keyword', 'pattern', 'sentiment', 'custom']),
      ruleExpression: z.record(z.any()),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      action: z.enum(['flag', 'hold', 'reject', 'alert']),
    }))
    .mutation(async ({ ctx, input }) => {
      const rule = await db.insert(complianceRules).values({
        eventId: input.eventId,
        name: input.name,
        description: input.description,
        ruleType: input.ruleType,
        ruleExpression: JSON.stringify(input.ruleExpression),
        severity: input.severity,
        action: input.action,
        createdBy: ctx.user.id,
      });

      // Log audit event
      await logAuditEvent(
        ctx.user.id,
        'CREATE_COMPLIANCE_RULE',
        'rule',
        rule.id,
        { ruleName: input.name },
        'success'
      );

      return rule;
    }),

  updateComplianceRule: adminProcedure
    .input(z.object({
      ruleId: z.number(),
      name: z.string().optional(),
      ruleExpression: z.record(z.any()).optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      action: z.enum(['flag', 'hold', 'reject', 'alert']).optional(),
      enabled: z.boolean().optional(),
      changeReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current rule version
      const currentRule = await db.query.complianceRules.findFirst({
        where: eq(complianceRules.id, input.ruleId),
      });

      // Create version history
      if (input.ruleExpression || input.severity || input.action) {
        await db.insert(ruleVersions).values({
          ruleId: input.ruleId,
          version: currentRule.version + 1,
          ruleExpression: input.ruleExpression
            ? JSON.stringify(input.ruleExpression)
            : currentRule.ruleExpression,
          severity: input.severity || currentRule.severity,
          action: input.action || currentRule.action,
          changedBy: ctx.user.id,
          changeReason: input.changeReason,
        });
      }

      // Update rule
      await db.update(complianceRules)
        .set({
          name: input.name || currentRule.name,
          ruleExpression: input.ruleExpression
            ? JSON.stringify(input.ruleExpression)
            : currentRule.ruleExpression,
          severity: input.severity || currentRule.severity,
          action: input.action || currentRule.action,
          enabled: input.enabled !== undefined ? input.enabled : currentRule.enabled,
          version: currentRule.version + 1,
          updatedBy: ctx.user.id,
        })
        .where(eq(complianceRules.id, input.ruleId));

      // Log audit event
      await logAuditEvent(
        ctx.user.id,
        'UPDATE_COMPLIANCE_RULE',
        'rule',
        input.ruleId,
        { changeReason: input.changeReason },
        'success'
      );

      return { success: true };
    }),

  deleteComplianceRule: adminProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(complianceRules)
        .where(eq(complianceRules.id, input.ruleId));

      // Log audit event
      await logAuditEvent(
        ctx.user.id,
        'DELETE_COMPLIANCE_RULE',
        'rule',
        input.ruleId,
        {},
        'success'
      );

      return { success: true };
    }),
});
```

### 4.2 Frontend UI Component

```typescript
// client/src/pages/ComplianceRules.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ComplianceRules() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'keyword',
    severity: 'medium',
    action: 'flag',
  });

  const createRule = trpc.admin.createComplianceRule.useMutation();
  const rules = trpc.admin.getComplianceRules.useQuery({ eventId: 'event-001' });

  const handleCreate = async () => {
    await createRule.mutateAsync({
      eventId: 'event-001',
      ...formData,
      ruleExpression: parseRuleExpression(formData),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Create Rule</Button>

      <div className="space-y-2">
        {rules.data?.map(rule => (
          <div key={rule.id} className="border p-4 rounded">
            <h3>{rule.name}</h3>
            <p className="text-sm text-muted-foreground">{rule.description}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-100 px-2 py-1 rounded">{rule.ruleType}</span>
              <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(rule.severity)}`}>
                {rule.severity}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Compliance Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Rule name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <Select value={formData.ruleType} onValueChange={value => setFormData({ ...formData, ruleType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">Keyword</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Part 5: Bulk Import/Export

### 5.1 Export Rules

```typescript
// server/routers.ts
export const adminRouter = router({
  exportComplianceRules: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const rules = await db.query.complianceRules.findMany({
        where: eq(complianceRules.eventId, input.eventId),
      });

      // Convert to CSV/JSON
      const csv = convertRulesToCSV(rules);
      return { data: csv, filename: `rules-${input.eventId}.csv` };
    }),
});

function convertRulesToCSV(rules: any[]): string {
  const headers = ['Name', 'Type', 'Severity', 'Action', 'Enabled'];
  const rows = rules.map(r => [r.name, r.ruleType, r.severity, r.action, r.enabled ? 'Yes' : 'No']);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```

### 5.2 Import Rules

```typescript
// server/routers.ts
export const adminRouter = router({
  importComplianceRules: adminProcedure
    .input(z.object({
      eventId: z.string(),
      csvData: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lines = input.csvData.split('\n');
      const headers = lines[0].split(',');
      const rules = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const rule = {
          name: values[0],
          ruleType: values[1],
          severity: values[2],
          action: values[3],
          enabled: values[4] === 'Yes',
        };

        await db.insert(complianceRules).values({
          eventId: input.eventId,
          ...rule,
          ruleExpression: JSON.stringify({}),
          createdBy: ctx.user.id,
        });

        rules.push(rule);
      }

      return { imported: rules.length };
    }),
});
```

---

## Part 6: Performance Monitoring

### 6.1 Track Rule Performance

```typescript
// server/compliance/monitoring.ts
export async function trackRulePerformance(ruleId: number) {
  const evaluations = await db.query.ruleEvaluations.findMany({
    where: eq(ruleEvaluations.ruleId, ruleId),
  });

  const totalEvaluations = evaluations.length;
  const matches = evaluations.filter(e => e.matched).length;
  const matchRate = matches / totalEvaluations;
  const avgConfidence = evaluations.reduce((sum, e) => sum + e.confidence, 0) / totalEvaluations;

  return {
    totalEvaluations,
    matches,
    matchRate,
    avgConfidence,
    falsePositiveRate: calculateFalsePositiveRate(ruleId),
  };
}

export async function calculateFalsePositiveRate(ruleId: number): Promise<number> {
  // Query questions flagged by rule but later approved
  const falsePositives = await db.query.ruleEvaluations.findMany({
    where: and(
      eq(ruleEvaluations.ruleId, ruleId),
      eq(ruleEvaluations.matched, true)
    ),
  });

  // Check which were approved despite flag
  const approved = falsePositives.filter(async fp => {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, fp.questionId),
    });
    return question?.status === 'approved';
  });

  return approved.length / falsePositives.length;
}
```

---

## Part 7: Testing

### 7.1 Unit Tests

```typescript
// server/compliance/rules.test.ts
describe('Compliance Rules', () => {
  describe('Keyword Rules', () => {
    it('should match keyword', () => {
      const rule: KeywordRule = {
        type: 'keyword',
        keywords: ['sensitive', 'confidential'],
        caseSensitive: false,
        matchType: 'any',
      };

      const result = evaluateKeywordRule('This is sensitive information', rule);
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Pattern Rules', () => {
    it('should match email pattern', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        flags: 'g',
      };

      const result = evaluatePatternRule('Contact me at test@example.com', rule);
      expect(result.matched).toBe(true);
    });
  });

  describe('Sentiment Rules', () => {
    it('should match negative sentiment', () => {
      const rule: SentimentRule = {
        type: 'sentiment',
        minSentiment: -1,
        maxSentiment: -0.7,
      };

      const result = evaluateSentimentRule(-0.85, rule);
      expect(result.matched).toBe(true);
    });
  });
});
```

---

## Part 8: Deployment Checklist

- [ ] Database schema created (compliance_rules, rule_evaluations, rule_versions)
- [ ] Rule evaluation engine implemented
- [ ] All rule types tested (keyword, pattern, sentiment, custom)
- [ ] Admin API endpoints created (create, update, delete, list)
- [ ] Frontend UI for rule management built
- [ ] Bulk import/export functionality working
- [ ] Audit logging for rule changes implemented
- [ ] Performance monitoring dashboard created
- [ ] False positive tracking enabled
- [ ] Rule versioning and history working
- [ ] Integration tests passing
- [ ] Performance targets met (<100ms per rule evaluation)
- [ ] Documentation complete
- [ ] Customer training materials prepared

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Implementation  
**Next Review:** After initial customer deployment
