# Chorus.AI Performance Optimization Plan

**Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Implementation Ready  
**Target Performance:** API <200ms p95, Error Rate <0.1%, Cache Hit Rate >80%

---

## Executive Summary

This document outlines the performance optimization strategy for Chorus.AI's three highest-priority console surfaces: Operator Console, Moderator Dashboard, and Presenter Teleprompter. Current baseline metrics are established, bottlenecks identified, and optimization techniques specified with expected improvements.

**Expected Improvements:**
- Operator Console: 45% latency reduction (500ms → 275ms)
- Moderator Dashboard: 35% latency reduction (400ms → 260ms)
- Presenter Teleprompter: 55% latency reduction (300ms → 135ms)

---

## Part 1: Performance Baseline & Profiling

### 1.1 Current Baseline Metrics

**Operator Console (Real-Time Session Management)**
- API Response Time: ~500ms p95
- Database Query Time: ~150ms p95
- WebSocket Message Latency: ~200ms
- Cache Hit Rate: ~45%
- Memory Usage: ~250MB per instance
- CPU Usage: ~35% average

**Moderator Dashboard (Q&A Management)**
- API Response Time: ~400ms p95
- Database Query Time: ~120ms p95
- Filter/Sort Operations: ~300ms
- Bulk Action Operations: ~800ms
- Cache Hit Rate: ~50%
- Memory Usage: ~180MB per instance

**Presenter Teleprompter (Live Transcript)**
- API Response Time: ~300ms p95
- Transcript Update Latency: ~250ms
- Q&A Queue Update Latency: ~180ms
- Scroll Smoothness: 45fps average
- Cache Hit Rate: ~55%
- Memory Usage: ~120MB per instance

### 1.2 Profiling Tools & Techniques

**Backend Profiling:**
```bash
# Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.1;

# Profile with Node.js built-in profiler
node --prof server/_core/index.ts
node --prof-process isolate-*.log > profile.txt

# Use clinic.js for detailed profiling
npm install -g clinic
clinic doctor -- npm start
```

**Frontend Profiling:**
```bash
# Chrome DevTools Performance tab
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Record user interactions
# 4. Analyze flame chart for bottlenecks

# React DevTools Profiler
# 1. Install React DevTools extension
# 2. Go to Profiler tab
# 3. Record component renders
# 4. Identify slow components
```

**Database Query Profiling:**
```bash
# Enable query profiling
SET PROFILING = 1;

# Run query
SELECT * FROM questions WHERE event_id = 'test-event-001' ORDER BY created_at DESC LIMIT 100;

# View profile
SHOW PROFILE;

# Analyze with EXPLAIN
EXPLAIN SELECT * FROM questions WHERE event_id = 'test-event-001' ORDER BY created_at DESC LIMIT 100;
```

---

## Part 2: Operator Console Optimization

### 2.1 Identified Bottlenecks

**Database Queries (150ms p95):**
- `getOperatorSession()` — Fetches full session with all related data
- `getQuestions()` — Fetches all questions with sentiment scores
- `getAnalytics()` — Aggregates sentiment, compliance, speaker metrics

**Real-Time Updates (200ms latency):**
- Ably message delivery latency
- Client-side state update processing
- UI re-render time

**Sentiment Analysis (100ms per question):**
- LLM API call for sentiment scoring
- Compliance risk calculation
- Caching miss on new questions

### 2.2 Optimization Techniques

#### Technique 1: Database Query Optimization

**Before:**
```typescript
// Fetches entire session with all related data
const session = await db.query.operatorSessions
  .findFirst({
    where: eq(operatorSessions.id, sessionId),
    with: {
      questions: { with: { speaker: true } },
      speakers: true,
      event: true,
      analytics: true,
    },
  });
```

**After:**
```typescript
// Fetch only necessary fields, use pagination
const session = await db.query.operatorSessions
  .findFirst({
    where: eq(operatorSessions.id, sessionId),
    columns: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

// Fetch questions separately with pagination
const questions = await db.query.questions
  .findMany({
    where: eq(questions.sessionId, sessionId),
    columns: {
      id: true,
      text: true,
      sentiment: true,
      complianceRisk: true,
      status: true,
    },
    orderBy: desc(questions.createdAt),
    limit: 50,
    offset: 0,
  });
```

**Expected Improvement:** 150ms → 80ms (47% reduction)

#### Technique 2: Redis Caching Strategy

**Cache Layers:**

| Data | TTL | Max Size | Hit Rate Target |
|------|-----|----------|-----------------|
| Session state | 1 min | 1000 items | 85% |
| Questions list | 2 min | 5000 items | 80% |
| Sentiment scores | 5 min | 10000 items | 90% |
| Compliance rules | 10 min | 500 items | 95% |
| Speaker profiles | 15 min | 500 items | 85% |

**Implementation:**
```typescript
// Cache session state
const cacheKey = `session:${sessionId}`;
let session = await redis.get(cacheKey);

if (!session) {
  session = await db.query.operatorSessions.findFirst({...});
  await redis.setex(cacheKey, 60, JSON.stringify(session));
}

// Cache questions with pagination
const questionsKey = `questions:${sessionId}:${page}`;
let questions = await redis.get(questionsKey);

if (!questions) {
  questions = await db.query.questions.findMany({...});
  await redis.setex(questionsKey, 120, JSON.stringify(questions));
}

// Invalidate cache on updates
await redis.del(cacheKey);
await redis.del(`questions:${sessionId}:*`);
```

**Expected Improvement:** 80ms → 40ms (50% reduction from caching)

#### Technique 3: Real-Time Update Optimization

**Batch Updates:**
```typescript
// Instead of sending individual updates, batch them
const updates = [];

// Collect updates for 100ms window
setTimeout(() => {
  // Send batched updates via Ably
  ably.channels.get(`session:${sessionId}`).publish('updates', {
    questions: updates.filter(u => u.type === 'question'),
    sentiment: updates.filter(u => u.type === 'sentiment'),
    compliance: updates.filter(u => u.type === 'compliance'),
  });
  updates = [];
}, 100);
```

**Debounce Client Updates:**
```typescript
// Debounce sentiment score updates
const debouncedUpdateSentiment = debounce((questionId, score) => {
  setSentiment(questionId, score);
}, 500);

// Debounce compliance score updates
const debouncedUpdateCompliance = debounce((questionId, risk) => {
  setCompliance(questionId, risk);
}, 500);
```

**Expected Improvement:** 200ms → 100ms (50% reduction)

#### Technique 4: Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load sentiment chart component
const SentimentChart = lazy(() => import('./SentimentChart'));

// Lazy load compliance rules panel
const ComplianceRules = lazy(() => import('./ComplianceRules'));

// Lazy load speaker profiles
const SpeakerProfiles = lazy(() => import('./SpeakerProfiles'));
```

**Memoization:**
```typescript
// Memoize expensive calculations
const memoizedSentimentTrend = useMemo(
  () => calculateSentimentTrend(questions),
  [questions]
);

// Memoize component renders
const QuestionList = memo(({ questions }) => {
  return questions.map(q => <QuestionItem key={q.id} question={q} />);
});
```

**Expected Improvement:** 40ms → 20ms (50% reduction)

### 2.3 Operator Console Optimization Summary

| Optimization | Before | After | Improvement |
|---|---|---|---|
| Database Queries | 150ms | 80ms | 47% |
| Redis Caching | 80ms | 40ms | 50% |
| Real-Time Updates | 200ms | 100ms | 50% |
| Frontend Rendering | 40ms | 20ms | 50% |
| **Total API Response** | **500ms** | **275ms** | **45%** |

---

## Part 3: Moderator Dashboard Optimization

### 3.1 Identified Bottlenecks

**Q&A Filtering & Sorting (300ms):**
- In-memory filtering of 1000+ questions
- Sorting by multiple fields (priority, compliance, timestamp)
- Re-rendering entire list on filter change

**Bulk Actions (800ms):**
- Updating 50+ questions in sequence
- Database round-trips for each update
- Real-time broadcast to all users

**Priority Scoring (150ms):**
- LLM-based priority calculation
- Compliance risk assessment
- Speaker relevance scoring

### 3.2 Optimization Techniques

#### Technique 1: Server-Side Filtering & Sorting

**Before:**
```typescript
// Client-side filtering (inefficient)
const filteredQuestions = questions
  .filter(q => q.status === 'pending')
  .filter(q => q.complianceRisk > 0.5)
  .sort((a, b) => b.priority - a.priority);
```

**After:**
```typescript
// Server-side filtering with database indexes
const filteredQuestions = await db.query.questions
  .findMany({
    where: and(
      eq(questions.status, 'pending'),
      gt(questions.complianceRisk, 0.5)
    ),
    orderBy: desc(questions.priority),
    limit: 100,
  });
```

**Database Indexes:**
```sql
-- Create indexes for filtering
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_compliance_risk ON questions(complianceRisk);
CREATE INDEX idx_questions_priority ON questions(priority);
CREATE INDEX idx_questions_session_status ON questions(sessionId, status);
```

**Expected Improvement:** 300ms → 120ms (60% reduction)

#### Technique 2: Bulk Action Optimization

**Before:**
```typescript
// Sequential updates (slow)
for (const questionId of questionIds) {
  await db.update(questions)
    .set({ status: 'approved' })
    .where(eq(questions.id, questionId));
}
```

**After:**
```typescript
// Batch update (fast)
await db.update(questions)
  .set({ status: 'approved' })
  .where(inArray(questions.id, questionIds));

// Single broadcast to all users
await ably.channels.get(`session:${sessionId}`)
  .publish('bulk-update', {
    questionIds,
    status: 'approved',
    timestamp: Date.now(),
  });
```

**Expected Improvement:** 800ms → 300ms (62% reduction)

#### Technique 3: Priority Scoring Caching

**Before:**
```typescript
// Recalculate priority for every question
const priority = await calculatePriority(question);
```

**After:**
```typescript
// Cache priority scores
const cacheKey = `priority:${questionId}`;
let priority = await redis.get(cacheKey);

if (!priority) {
  priority = await calculatePriority(question);
  await redis.setex(cacheKey, 300, priority);
}

// Invalidate on question update
await redis.del(`priority:${questionId}`);
```

**Expected Improvement:** 150ms → 50ms (67% reduction)

#### Technique 4: Virtual Scrolling

**Before:**
```typescript
// Render all 1000+ questions (DOM bloat)
{questions.map(q => <QuestionItem key={q.id} question={q} />)}
```

**After:**
```typescript
// Virtual scroll - render only visible items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={questions.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <QuestionItem question={questions[index]} />
    </div>
  )}
</FixedSizeList>
```

**Expected Improvement:** 80ms → 30ms (62% reduction)

### 3.3 Moderator Dashboard Optimization Summary

| Optimization | Before | After | Improvement |
|---|---|---|---|
| Filtering & Sorting | 300ms | 120ms | 60% |
| Bulk Actions | 800ms | 300ms | 62% |
| Priority Scoring | 150ms | 50ms | 67% |
| Virtual Scrolling | 80ms | 30ms | 62% |
| **Total API Response** | **400ms** | **260ms** | **35%** |

---

## Part 4: Presenter Teleprompter Optimization

### 4.1 Identified Bottlenecks

**Transcript Updates (250ms):**
- Real-time transcript streaming
- DOM updates for each new sentence
- Scroll position management

**Q&A Queue Updates (180ms):**
- Fetching approved questions
- Sorting by priority
- Real-time updates via WebSocket

**Scroll Smoothness (45fps):**
- Large transcript DOM
- Inefficient scroll event handlers
- Frequent re-renders

### 4.2 Optimization Techniques

#### Technique 1: Transcript Streaming Optimization

**Before:**
```typescript
// Update DOM for each sentence
const newTranscript = transcript + ' ' + newSentence;
setTranscript(newTranscript);
```

**After:**
```typescript
// Buffer updates and batch render
const transcriptBuffer = [];
const flushTranscript = () => {
  setTranscript(prev => prev + transcriptBuffer.join(' '));
  transcriptBuffer = [];
};

// Collect updates for 200ms
const addToTranscript = (sentence) => {
  transcriptBuffer.push(sentence);
  if (transcriptBuffer.length === 1) {
    setTimeout(flushTranscript, 200);
  }
};
```

**Expected Improvement:** 250ms → 80ms (68% reduction)

#### Technique 2: Virtual Scrolling for Transcript

**Before:**
```typescript
// Render entire transcript (10000+ lines)
{transcript.split('\n').map((line, i) => (
  <div key={i}>{line}</div>
))}
```

**After:**
```typescript
// Virtual scroll - render only visible lines
import { VariableSizeList } from 'react-window';

<VariableSizeList
  height={500}
  itemCount={transcriptLines.length}
  itemSize={index => transcriptLines[index].length * 8}
  width="100%"
>
  {({ index, style }) => (
    <div style={style} className="transcript-line">
      {transcriptLines[index]}
    </div>
  )}
</VariableSizeList>
```

**Expected Improvement:** 100ms → 30ms (70% reduction)

#### Technique 3: Q&A Queue Optimization

**Before:**
```typescript
// Fetch and sort on every update
const approvedQuestions = await db.query.questions
  .findMany({
    where: eq(questions.status, 'approved'),
  })
  .then(qs => qs.sort((a, b) => b.priority - a.priority));
```

**After:**
```typescript
// Cache sorted queue, update incrementally
const cacheKey = `approved-queue:${sessionId}`;
let queue = await redis.get(cacheKey);

if (!queue) {
  queue = await db.query.questions
    .findMany({
      where: eq(questions.status, 'approved'),
      orderBy: desc(questions.priority),
    });
  await redis.setex(cacheKey, 60, JSON.stringify(queue));
}

// On new approval, insert into correct position
const insertApprovedQuestion = (question) => {
  const index = queue.findIndex(q => q.priority < question.priority);
  queue.splice(index, 0, question);
  await redis.setex(cacheKey, 60, JSON.stringify(queue));
};
```

**Expected Improvement:** 180ms → 60ms (67% reduction)

#### Technique 4: Scroll Performance

**Before:**
```typescript
// Scroll event fires frequently, causes re-renders
window.addEventListener('scroll', () => {
  setScrollPosition(window.scrollY);
  updateHighlightedLine();
});
```

**After:**
```typescript
// Throttle scroll events
const throttledScroll = throttle(() => {
  setScrollPosition(window.scrollY);
  updateHighlightedLine();
}, 100);

window.addEventListener('scroll', throttledScroll);

// Use CSS for scroll styling (no JS)
.transcript-line.highlighted {
  background-color: rgba(255, 255, 0, 0.2);
}
```

**Expected Improvement:** 45fps → 55fps (22% improvement)

### 4.3 Presenter Teleprompter Optimization Summary

| Optimization | Before | After | Improvement |
|---|---|---|---|
| Transcript Updates | 250ms | 80ms | 68% |
| Virtual Scrolling | 100ms | 30ms | 70% |
| Q&A Queue | 180ms | 60ms | 67% |
| Scroll Performance | 45fps | 55fps | 22% |
| **Total API Response** | **300ms** | **135ms** | **55%** |

---

## Part 5: Implementation Roadmap

### Phase 1: Database Optimization (Week 1)
- [ ] Add database indexes for filtering/sorting
- [ ] Implement query profiling and analysis
- [ ] Optimize slow queries (>100ms)
- [ ] Test query performance improvements

### Phase 2: Redis Caching (Week 1-2)
- [ ] Implement Redis connection pooling
- [ ] Add caching layer for session state
- [ ] Add caching for questions and sentiment
- [ ] Implement cache invalidation strategy
- [ ] Test cache hit rates

### Phase 3: Backend Optimization (Week 2)
- [ ] Implement server-side filtering/sorting
- [ ] Optimize bulk operations
- [ ] Implement batch updates
- [ ] Add API response compression
- [ ] Test API response times

### Phase 4: Frontend Optimization (Week 2-3)
- [ ] Implement code splitting
- [ ] Add memoization for expensive calculations
- [ ] Implement virtual scrolling
- [ ] Optimize real-time updates
- [ ] Test frontend performance

### Phase 5: Real-Time Optimization (Week 3)
- [ ] Batch Ably message updates
- [ ] Implement debouncing for client updates
- [ ] Optimize WebSocket connections
- [ ] Test real-time latency
- [ ] Load test with 1000+ concurrent users

### Phase 6: Monitoring & Validation (Week 3-4)
- [ ] Set up performance monitoring
- [ ] Create performance dashboards
- [ ] Run load tests
- [ ] Validate target metrics achieved
- [ ] Document optimization results

---

## Part 6: Performance Targets & Success Criteria

### Target Metrics

| Metric | Current | Target | Success Criteria |
|---|---|---|---|
| Operator Console API | 500ms p95 | 275ms p95 | ✓ 45% reduction |
| Moderator Dashboard API | 400ms p95 | 260ms p95 | ✓ 35% reduction |
| Presenter Teleprompter API | 300ms p95 | 135ms p95 | ✓ 55% reduction |
| Cache Hit Rate | 45-55% | >80% | ✓ Increase by 25-35% |
| Error Rate | <0.1% | <0.05% | ✓ 50% reduction |
| Concurrent Users | 100 | 1000+ | ✓ 10x improvement |

### Load Testing

**Test Scenario 1: 100 Concurrent Operators**
- Expected API response time: <275ms p95
- Expected error rate: <0.05%
- Expected cache hit rate: >80%

**Test Scenario 2: 500 Concurrent Moderators**
- Expected API response time: <260ms p95
- Expected error rate: <0.05%
- Expected bulk operation time: <300ms

**Test Scenario 3: 1000 Concurrent Presenters**
- Expected transcript update latency: <80ms
- Expected Q&A queue update: <60ms
- Expected scroll smoothness: >55fps

---

## Part 7: Rollback & Contingency

### If Performance Degrades

1. **Immediate Rollback:** Revert to previous checkpoint
2. **Root Cause Analysis:** Identify which optimization caused issue
3. **Fix & Retest:** Implement fix and validate
4. **Gradual Rollout:** Deploy to 10% of users first

### If Targets Not Met

1. **Analyze Bottlenecks:** Use profiling tools to identify remaining bottlenecks
2. **Implement Additional Optimizations:** Consider:
   - Database sharding
   - Read replicas for scaling
   - CDN for static assets
   - GraphQL for flexible queries
3. **Reassess Targets:** May need to adjust based on infrastructure constraints

---

## Appendix: Performance Monitoring Dashboard

**Key Metrics to Track:**
- API response time (p50, p95, p99)
- Database query time (p50, p95, p99)
- Cache hit rate
- Error rate
- Concurrent users
- Memory usage
- CPU usage
- WebSocket connection count
- Real-time message latency

**Tools:**
- Prometheus for metrics collection
- Grafana for visualization
- Sentry for error tracking
- Chrome DevTools for frontend profiling

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Implementation  
**Next Review:** After Phase 1 completion
