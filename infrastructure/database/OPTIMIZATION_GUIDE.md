# Database Query Optimization Guide

**Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Implementation Ready

---

## Overview

This guide provides SQL queries and best practices for optimizing Chorus.AI database performance. Focus areas: indexing strategy, query optimization, and monitoring slow queries.

---

## Part 1: Index Strategy

### 1.1 Create Performance Indexes

```sql
-- Operator Sessions Indexes
CREATE INDEX idx_operator_sessions_event_id ON operator_sessions(event_id);
CREATE INDEX idx_operator_sessions_status ON operator_sessions(status);
CREATE INDEX idx_operator_sessions_created_at ON operator_sessions(created_at);
CREATE INDEX idx_operator_sessions_event_status ON operator_sessions(event_id, status);

-- Questions Indexes (Most Critical)
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_sentiment ON questions(sentiment);
CREATE INDEX idx_questions_compliance_risk ON questions(compliance_risk);
CREATE INDEX idx_questions_priority ON questions(priority);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_session_status ON questions(session_id, status);
CREATE INDEX idx_questions_session_compliance ON questions(session_id, compliance_risk);
CREATE INDEX idx_questions_session_priority ON questions(session_id, priority);

-- Events Indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_operator_id ON events(operator_id);

-- Attendees Indexes
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_user_id ON attendees(user_id);
CREATE INDEX idx_attendees_event_user ON attendees(event_id, user_id);

-- Speakers Indexes
CREATE INDEX idx_speakers_event_id ON speakers(event_id);
CREATE INDEX idx_speakers_user_id ON speakers(user_id);

-- Operator Actions Indexes
CREATE INDEX idx_operator_actions_session_id ON operator_actions(session_id);
CREATE INDEX idx_operator_actions_operator_id ON operator_actions(operator_id);
CREATE INDEX idx_operator_actions_action_type ON operator_actions(action_type);
CREATE INDEX idx_operator_actions_created_at ON operator_actions(created_at);

-- Operator Notes Indexes
CREATE INDEX idx_operator_notes_session_id ON operator_notes(session_id);
CREATE INDEX idx_operator_notes_created_at ON operator_notes(created_at);
```

### 1.2 Verify Indexes

```sql
-- Show all indexes
SHOW INDEXES FROM questions;

-- Check index size
SELECT 
  OBJECT_SCHEMA,
  OBJECT_NAME,
  INDEX_NAME,
  STAT_VALUE * @@innodb_page_size / 1024 / 1024 AS size_mb
FROM mysql.innodb_index_stats
WHERE STAT_NAME = 'size'
ORDER BY STAT_VALUE DESC;
```

---

## Part 2: Query Optimization

### 2.1 Operator Console Queries

**BEFORE (Slow - 150ms):**
```sql
SELECT * FROM operator_sessions 
WHERE id = 'session-001'
LIMIT 1;

-- Then separate queries for:
SELECT * FROM questions WHERE session_id = 'session-001';
SELECT * FROM speakers WHERE event_id = 'event-001';
SELECT * FROM operator_notes WHERE session_id = 'session-001';
```

**AFTER (Fast - 80ms):**
```sql
-- Single optimized query with only needed columns
SELECT 
  os.id,
  os.event_id,
  os.status,
  os.created_at,
  os.updated_at,
  COUNT(q.id) as question_count,
  AVG(q.sentiment) as avg_sentiment,
  MAX(q.compliance_risk) as max_compliance_risk
FROM operator_sessions os
LEFT JOIN questions q ON os.id = q.session_id
WHERE os.id = 'session-001'
GROUP BY os.id;

-- Separate paginated query for questions
SELECT 
  id,
  text,
  sentiment,
  compliance_risk,
  status,
  priority,
  created_at
FROM questions
WHERE session_id = 'session-001'
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;
```

### 2.2 Moderator Dashboard Queries

**BEFORE (Slow - 300ms):**
```sql
SELECT * FROM questions 
WHERE session_id = 'session-001'
ORDER BY created_at DESC;

-- Client-side filtering and sorting
```

**AFTER (Fast - 120ms):**
```sql
-- Server-side filtering with indexes
SELECT 
  id,
  text,
  sentiment,
  compliance_risk,
  status,
  priority,
  created_at
FROM questions
WHERE session_id = 'session-001'
  AND status = 'pending'
  AND compliance_risk > 0.5
ORDER BY priority DESC, created_at DESC
LIMIT 100 OFFSET 0;

-- Use EXPLAIN to verify index usage
EXPLAIN SELECT * FROM questions
WHERE session_id = 'session-001'
  AND status = 'pending'
  AND compliance_risk > 0.5
ORDER BY priority DESC;
```

### 2.3 Presenter Teleprompter Queries

**BEFORE (Slow - 180ms):**
```sql
SELECT * FROM questions 
WHERE session_id = 'session-001' 
  AND status = 'approved'
ORDER BY priority DESC;
```

**AFTER (Fast - 60ms):**
```sql
-- Optimized with composite index
SELECT 
  id,
  text,
  priority,
  created_at
FROM questions
WHERE session_id = 'session-001'
  AND status = 'approved'
ORDER BY priority DESC
LIMIT 50;

-- Verify index is used
EXPLAIN SELECT * FROM questions
WHERE session_id = 'session-001'
  AND status = 'approved'
ORDER BY priority DESC;
```

---

## Part 3: Slow Query Logging

### 3.1 Enable Slow Query Log

```sql
-- Check current settings
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.1; -- Log queries > 100ms
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- Make permanent (add to my.cnf)
[mysqld]
slow_query_log = 1
long_query_time = 0.1
log_queries_not_using_indexes = 1
```

### 3.2 Analyze Slow Queries

```bash
# View slow query log
tail -100 /var/log/mysql/slow.log

# Analyze with mysqldumpslow
mysqldumpslow -s c -t 10 /var/log/mysql/slow.log

# Parse with pt-query-digest (Percona Toolkit)
pt-query-digest /var/log/mysql/slow.log
```

---

## Part 4: Query Execution Plans

### 4.1 EXPLAIN Analysis

```sql
-- Analyze query execution plan
EXPLAIN SELECT * FROM questions
WHERE session_id = 'session-001'
  AND status = 'pending'
ORDER BY priority DESC;

-- Output interpretation:
-- - type: Should be 'ref' or 'range' (not 'ALL')
-- - key: Should show index name (not NULL)
-- - rows: Should be small number (not entire table)
-- - Extra: Should not contain 'Using filesort' or 'Using temporary'
```

### 4.2 EXPLAIN Extended

```sql
-- Get detailed execution plan
EXPLAIN EXTENDED SELECT * FROM questions
WHERE session_id = 'session-001'
  AND status = 'pending'
ORDER BY priority DESC;

-- Show optimized query
SHOW WARNINGS;
```

---

## Part 5: Connection Pooling

### 5.1 Configure Connection Pool

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50, // Increase from default 10
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

export const db = drizzle(pool);
```

### 5.2 Monitor Connection Usage

```sql
-- Check current connections
SHOW PROCESSLIST;

-- Count connections by user
SELECT user, COUNT(*) FROM INFORMATION_SCHEMA.PROCESSLIST GROUP BY user;

-- Check max connections
SHOW VARIABLES LIKE 'max_connections';

-- Increase if needed
SET GLOBAL max_connections = 200;
```

---

## Part 6: Query Caching Strategy

### 6.1 Cache Invalidation on Updates

```typescript
// When updating a question
await db.update(questions)
  .set({ status: 'approved' })
  .where(eq(questions.id, questionId));

// Invalidate related caches
await cache.invalidateQuestionsCache(sessionId);
await cache.invalidatePriorityCache(questionId);
await cache.invalidateAnalyticsCache(sessionId);
```

### 6.2 Cache Warming

```typescript
// Pre-load frequently accessed data
export async function warmCache(sessionId: string) {
  // Cache session state
  const session = await db.query.operatorSessions.findFirst({
    where: eq(operatorSessions.id, sessionId),
  });
  await cache.cacheSessionState(sessionId, session);

  // Cache first page of questions
  const questions = await db.query.questions.findMany({
    where: eq(questions.sessionId, sessionId),
    limit: 50,
  });
  await cache.cacheQuestions(sessionId, questions, 0);

  // Cache compliance rules
  const rules = await db.query.complianceRules.findMany({
    where: eq(complianceRules.eventId, session.eventId),
  });
  await cache.cacheComplianceRules(session.eventId, rules);
}
```

---

## Part 7: Performance Monitoring

### 7.1 Query Performance Metrics

```sql
-- Get query statistics
SELECT 
  digest_text,
  count_star,
  avg_timer_wait / 1000000000000 as avg_time_sec,
  sum_timer_wait / 1000000000000 as total_time_sec
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_timer_wait DESC
LIMIT 10;
```

### 7.2 Table Statistics

```sql
-- Get table size
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'chorus_ai'
ORDER BY size_mb DESC;

-- Get row count
SELECT 
  table_name,
  table_rows
FROM information_schema.tables
WHERE table_schema = 'chorus_ai'
ORDER BY table_rows DESC;
```

---

## Part 8: Best Practices

### 8.1 DO's

- ✅ Use indexes on frequently filtered columns
- ✅ Use composite indexes for common WHERE/ORDER BY combinations
- ✅ Limit result set with LIMIT and OFFSET
- ✅ Select only needed columns (not SELECT *)
- ✅ Use prepared statements to prevent SQL injection
- ✅ Monitor slow query log regularly
- ✅ Test queries with EXPLAIN before deployment
- ✅ Use connection pooling for multiple connections
- ✅ Cache frequently accessed data
- ✅ Archive old data periodically

### 8.2 DON'Ts

- ❌ Don't create indexes on low-cardinality columns
- ❌ Don't use LIKE with leading wildcard (% at start)
- ❌ Don't use OR without proper indexing
- ❌ Don't use subqueries when JOIN would work
- ❌ Don't update indexes too frequently
- ❌ Don't ignore slow query log
- ❌ Don't assume query is fast without testing
- ❌ Don't use SELECT * without good reason
- ❌ Don't store large text in indexed columns
- ❌ Don't forget to test with production-like data volume

---

## Part 9: Maintenance Tasks

### 9.1 Regular Maintenance

```sql
-- Analyze tables (updates statistics)
ANALYZE TABLE questions;
ANALYZE TABLE operator_sessions;
ANALYZE TABLE events;

-- Optimize tables (defragments)
OPTIMIZE TABLE questions;
OPTIMIZE TABLE operator_sessions;
OPTIMIZE TABLE events;

-- Check table integrity
CHECK TABLE questions;
CHECK TABLE operator_sessions;
CHECK TABLE events;

-- Repair if needed
REPAIR TABLE questions;
```

### 9.2 Scheduled Maintenance

```bash
#!/bin/bash
# Daily maintenance script

# Backup database
mysqldump -u root -p chorus_ai > /backups/chorus_ai_$(date +%Y%m%d).sql

# Analyze tables
mysql -u root -p chorus_ai -e "ANALYZE TABLE questions; ANALYZE TABLE operator_sessions;"

# Optimize tables
mysql -u root -p chorus_ai -e "OPTIMIZE TABLE questions; OPTIMIZE TABLE operator_sessions;"

# Archive old data
mysql -u root -p chorus_ai -e "DELETE FROM operator_actions WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);"
```

---

## Part 10: Performance Targets

| Metric | Target | Current | Status |
|---|---|---|---|
| Operator Console Query | <80ms | 150ms | 🔴 |
| Moderator Dashboard Query | <120ms | 300ms | 🔴 |
| Presenter Teleprompter Query | <60ms | 180ms | 🔴 |
| Cache Hit Rate | >80% | 45-55% | 🔴 |
| Slow Queries | <1% | TBD | 🟡 |

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Implementation  
**Next Review:** After index deployment
