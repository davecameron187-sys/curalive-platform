# CuraLive Operator Console Architecture
## Current State, Gap Analysis, and Implementation Plan

**Last Updated:** 27 March 2026  
**Status:** Audit Complete, Ready for Phase 1

---

## Executive Summary

The CuraLive Operator Console is built on **Shadow Mode** as the foundation with **Live Q&A** as an integrated tab. Core components exist and are production-ready. Phase 1 focuses on stabilizing and refining existing components. Phase 2 integrates Live Q&A as a tab inside Shadow Mode.

**Current Status:**
- ✅ Shadow Mode console foundation: Stable
- ✅ Live Q&A backend: Complete (25+ procedures)
- ✅ Live Q&A frontend: Exists but separate
- ✅ Operator Console component: Created (OperatorConsole.tsx)
- ⏳ Integration: Ready to begin Phase 1

---

## 1. Current Architecture Overview

### 1.1 Project Structure

```
/home/ubuntu/chorus-ai/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OperatorConsole.tsx          ← Main operator surface
│   │   │   ├── ModeratorDashboard.tsx       ← Shadow Mode foundation
│   │   │   ├── LiveQaSession.tsx            ← Q&A (to be integrated)
│   │   │   └── [other pages]
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AIChatBox.tsx
│   │   │   └── [UI components]
│   │   └── lib/
│   │       └── trpc.ts
│   └── public/
├── server/
│   ├── routers/
│   │   ├── operatorConsole.ts               ← Session management
│   │   ├── liveQa.ts                        ← Q&A procedures (25+)
│   │   ├── viasocketSync.ts                 ← Real-time sync
│   │   └── [other routers]
│   ├── db.ts                                ← Database helpers
│   ├── storage.ts                           ← S3 integration
│   └── _core/
│       ├── context.ts                       ← Auth context
│       ├── llm.ts                           ← LLM integration
│       └── [core services]
├── drizzle/
│   └── schema.ts                            ← Database schema
├── shared/
│   └── types.ts
└── todo.md                                  ← Implementation tasks
```

### 1.2 Database Schema

**Key Tables:**
- `users` — Operator/speaker accounts
- `events` — Live events/sessions
- `sessions` — Session state (start, pause, resume, end)
- `liveQaQuestions` — Q&A questions
- `liveQaAnswers` — Speaker answers
- `operatorNotes` — Operator annotations
- `actionLog` — Action history
- `transcriptSegments` — Live transcript
- `intelligenceSignals` — Sentiment, compliance, engagement

---

## 2. Component Breakdown

### 2.1 Shadow Mode Console (ModeratorDashboard.tsx)

**Current State:** ✅ Stable, production-ready

**What it does:**
- Displays live transcript feed
- Shows intelligence signals (sentiment, compliance, risk)
- Manages session state (start/pause/resume/end)
- Displays operator notes
- Provides archive handoff

**Key Features:**
- Real-time transcript streaming
- Sentiment gauge and trend chart
- Compliance risk indicators
- Engagement metrics
- Session timer with elapsed time
- Operator notes with timestamps
- Archive section with downloads

**Files:**
- `client/src/pages/ModeratorDashboard.tsx` (main component)
- `client/src/components/DashboardLayout.tsx` (layout wrapper)
- `server/routers/operatorConsole.ts` (backend procedures)

**Tests:** 35 comprehensive tests (all passing)

---

### 2.2 Live Q&A System (LiveQaSession.tsx)

**Current State:** ⏳ Exists but separate, needs integration

**What it does:**
- Displays question queue
- Allows operators to approve/reject/hold questions
- Supports speaker workflow
- Tracks question upvotes
- Manages compliance screening

**Key Features:**
- Real-time question intake
- Queue management (approved, pending, rejected)
- One-click actions (approve, reject, hold)
- Compliance risk scoring
- Duplicate detection
- Upvote tracking
- Speaker workflow integration

**Files:**
- `client/src/pages/LiveQaSession.tsx` (main component)
- `server/routers/liveQa.ts` (25+ procedures)
- Database: `liveQaQuestions`, `liveQaAnswers` tables

**Tests:** 20+ tests for Q&A procedures

**Backend Procedures (25+):**
- `submitQuestion` — Attendee submits question
- `approveQuestion` — Operator approves
- `rejectQuestion` — Operator rejects
- `holdQuestion` — Operator holds for review
- `sendToSpeaker` — Send to speaker
- `getQuestionQueue` — Fetch pending questions
- `upvoteQuestion` — Attendee upvotes
- `getQuestionStats` — Analytics
- [15+ more]

---

### 2.3 Operator Console Component (OperatorConsole.tsx)

**Current State:** ✅ Created, ready for integration

**What it does:**
- Unified operator interface
- Combines transcript, intelligence, session controls
- Provides tab navigation
- Integrates Q&A (placeholder)

**Key Features:**
- Multi-tab interface (Transcript, Intelligence, Q&A, Notes, Archive)
- Session state machine
- Real-time updates
- Operator workflow support

**Files:**
- `client/src/pages/OperatorConsole.tsx` (main component)
- `server/routers/operatorConsole.ts` (backend)

**Tests:** 35 tests (all passing)

---

## 3. Gap Analysis

### 3.1 What Already Works ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Shadow Mode foundation | ✅ Complete | Stable, production-ready |
| Transcript panel | ✅ Complete | Real-time, working |
| Intelligence panel | ✅ Complete | Sentiment, compliance, engagement |
| Session controls | ✅ Complete | Start/pause/resume/end |
| Operator notes | ✅ Complete | Timestamped, searchable |
| Archive handoff | ✅ Complete | Transcript, AI report, downloads |
| Live Q&A backend | ✅ Complete | 25+ procedures, tested |
| Live Q&A frontend | ✅ Complete | Separate component, working |
| Database schema | ✅ Complete | All tables, relations |
| Authentication | ✅ Complete | Manus OAuth integrated |
| Real-time (Ably) | ✅ Complete | Channels configured |
| Viasocket sync | ✅ Complete | 10 procedures, webhook ready |

### 3.2 What Needs Integration ⏳

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Integrate Q&A tab into console | ⏳ Ready | Medium | Wire LiveQaSession into OperatorConsole |
| Refine transcript visibility | ⏳ Ready | Low | Optimize layout and scrolling |
| Enhance intelligence display | ⏳ Ready | Low | Add more visual indicators |
| Operator workflow shortcuts | ⏳ Ready | Medium | Add keyboard shortcuts |
| Alert system | ⏳ Ready | Medium | Compliance and risk alerts |
| Action logging UI | ⏳ Ready | Low | Display action history |
| Post-session handoff UI | ⏳ Ready | Low | Improve archive section |

### 3.3 What's Missing ❌

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Compliance alert system | ❌ Not started | High | Risk-based alerts |
| Keyboard shortcuts | ❌ Not started | Medium | Power user efficiency |
| Role-specific views | ❌ Not started | Medium | Operator vs. speaker views |
| Answer-risk prompts | ❌ Not started | Medium | AI-powered suggestions |
| Team chat | ❌ Not started | Low | Operator communication |
| Speaker teleprompter | ❌ Not started | Out of scope | Separate workstream |
| Webcast platform | ❌ Not started | Out of scope | Future phase |

---

## 4. Implementation Plan

### Phase 1: Lock Core Operator Console

**Goal:** Stabilize and refine existing components into production-ready console.

**Deliverables:**
1. ✅ Audit complete (this document)
2. Integrate Q&A tab into OperatorConsole
3. Refine transcript panel visibility
4. Enhance intelligence panel display
5. Stabilize session controls
6. Comprehensive testing
7. Production deployment

**Effort:** 2-3 weeks  
**Files to Touch:** 5-7 components, 3-4 routers

**Detailed Tasks:**

#### 1.1 Integrate Q&A Tab
- **File:** `client/src/pages/OperatorConsole.tsx`
- **Task:** Import LiveQaSession component, add as Q&A tab
- **Effort:** 2-3 hours
- **Tests:** Verify tab switching, Q&A functionality

#### 1.2 Refine Transcript Panel
- **File:** `client/src/pages/OperatorConsole.tsx`
- **Task:** Optimize layout, scrolling, speaker identification
- **Effort:** 3-4 hours
- **Tests:** Verify real-time updates, performance

#### 1.3 Enhance Intelligence Panel
- **File:** `client/src/pages/OperatorConsole.tsx`
- **Task:** Add visual indicators, trend charts, risk gauges
- **Effort:** 4-5 hours
- **Tests:** Verify data accuracy, visual clarity

#### 1.4 Stabilize Session Controls
- **File:** `client/src/pages/OperatorConsole.tsx`
- **Task:** Ensure state machine is clear, no ambiguous states
- **Effort:** 2-3 hours
- **Tests:** Verify all state transitions

#### 1.5 Add Viasocket Sync Calls
- **File:** `server/routers/operatorConsole.ts`
- **Task:** Call viasocketSync procedures on session events
- **Effort:** 2-3 hours
- **Tests:** Verify webhook delivery

#### 1.6 Comprehensive Testing
- **File:** `server/operatorConsole.test.ts`
- **Task:** Write 50+ tests covering all scenarios
- **Effort:** 5-6 hours
- **Tests:** 50+ tests, 100% passing

#### 1.7 Documentation
- **File:** `OPERATOR_CONSOLE_GUIDE.md`
- **Task:** Create operator guide and technical docs
- **Effort:** 2-3 hours
- **Tests:** Review by ChatGPT

**Success Criteria:**
- ✅ Single OperatorConsole is main surface
- ✅ All components work together seamlessly
- ✅ 50+ tests passing
- ✅ Zero TypeScript errors
- ✅ Production-ready for real events
- ✅ Viasocket sync working

---

### Phase 2: Implement Live Q&A Tab Inside Console

**Goal:** Integrate Q&A as a tab with full operator workflow.

**Deliverables:**
1. Q&A tab fully integrated
2. Real-time question intake
3. Queue management
4. One-click actions
5. Compliance screening
6. Speaker workflow
7. Comprehensive testing

**Effort:** 2-3 weeks  
**Files to Touch:** 3-4 components, 2-3 routers

**Detailed Tasks:**

#### 2.1 Q&A Tab Integration
- **File:** `client/src/pages/OperatorConsole.tsx`
- **Task:** Integrate LiveQaSession as Q&A tab
- **Effort:** 3-4 hours

#### 2.2 Real-Time Question Intake
- **File:** `server/routers/liveQa.ts`
- **Task:** Ensure real-time updates via Ably
- **Effort:** 2-3 hours

#### 2.3 Queue Management UI
- **File:** `client/src/pages/LiveQaSession.tsx`
- **Task:** Enhance queue display and filtering
- **Effort:** 3-4 hours

#### 2.4 One-Click Actions
- **File:** `client/src/pages/LiveQaSession.tsx`
- **Task:** Implement approve/reject/hold/send-to-speaker
- **Effort:** 2-3 hours

#### 2.5 Compliance Screening
- **File:** `server/routers/liveQa.ts`
- **Task:** Enhance compliance risk scoring
- **Effort:** 3-4 hours

#### 2.6 Speaker Workflow
- **File:** `server/routers/liveQa.ts`
- **Task:** Integrate with speaker communication
- **Effort:** 2-3 hours

#### 2.7 Testing
- **File:** `server/liveQa.test.ts`
- **Task:** Write 50+ tests for Q&A workflow
- **Effort:** 5-6 hours

**Success Criteria:**
- ✅ Q&A tab integrated into console
- ✅ Real-time question intake working
- ✅ All operator actions working
- ✅ 50+ tests passing
- ✅ Production-ready for real events

---

### Phase 3: Deepen Operator Workflow

**Goal:** Add advanced features for power users.

**Deliverables:**
1. Action logging and review history
2. Keyboard shortcuts
3. Alert system
4. Role-specific views
5. Answer-risk prompts
6. Comprehensive testing

**Effort:** 2-3 weeks

---

## 5. File-Level Patch Plan

### Phase 1 Files

#### Client-Side

**`client/src/pages/OperatorConsole.tsx`**
- Import LiveQaSession component
- Add Q&A tab to tab navigation
- Refine transcript panel layout
- Enhance intelligence panel visuals
- Stabilize session controls
- ~300-400 lines of changes

**`client/src/pages/LiveQaSession.tsx`**
- No changes (reuse as-is)

**`client/src/components/DashboardLayout.tsx`**
- Minor layout adjustments if needed
- ~20-30 lines of changes

#### Server-Side

**`server/routers/operatorConsole.ts`**
- Add viasocketSync calls to session procedures
- Add action logging procedures
- ~50-100 lines of changes

**`server/routers/viasocketSync.ts`**
- Already complete, no changes needed

**`server/db.ts`**
- Add helper functions for action logging
- ~30-50 lines of changes

#### Tests

**`server/operatorConsole.test.ts`**
- Expand from 35 tests to 50+ tests
- Add integration tests
- ~200-300 lines of new tests

---

## 6. Testing Plan

### Unit Tests

**Transcript Panel:**
- Real-time updates
- Speaker identification
- Timestamp accuracy
- Search functionality

**Intelligence Panel:**
- Sentiment calculation
- Compliance risk scoring
- Engagement metrics
- Trend tracking

**Session Controls:**
- State transitions (idle → running → paused → ended)
- Timer accuracy
- Status indicators
- Event triggering

**Q&A Tab:**
- Question submission
- Approve/reject/hold actions
- Upvote tracking
- Compliance screening

### Integration Tests

- Session → Q&A workflow
- Operator notes → action log
- Archive handoff → downloads
- Viasocket sync → webhook delivery

### End-to-End Tests

- Complete session lifecycle
- Operator workflow
- Q&A moderation
- Post-session handoff

### Performance Tests

- Real-time update latency
- Transcript streaming
- Q&A queue performance
- Archive generation

---

## 7. Success Criteria

### Phase 1 Success

- ✅ Single OperatorConsole is the main operator surface
- ✅ Shadow Mode remains the foundation
- ✅ All components work together seamlessly
- ✅ 50+ tests passing (100%)
- ✅ Zero TypeScript errors
- ✅ Zero console errors
- ✅ Production-ready for real events
- ✅ Viasocket sync working
- ✅ Documentation complete
- ✅ Operator can manage full session from one interface

### Phase 2 Success

- ✅ Q&A tab integrated into console
- ✅ Real-time question intake working
- ✅ All operator actions working (approve/reject/hold/send)
- ✅ Compliance screening working
- ✅ 50+ tests passing (100%)
- ✅ Zero TypeScript errors
- ✅ Production-ready for real events
- ✅ Operator can moderate Q&A from console

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Q&A integration breaks transcript | High | Comprehensive testing, separate tabs |
| Real-time updates lag | High | Ably optimization, caching |
| Compliance screening false positives | Medium | AI model tuning, operator override |
| Archive handoff fails | Medium | Fallback storage, retry logic |
| Performance degrades with many questions | Medium | Pagination, lazy loading |
| Operator confusion with new interface | Medium | Clear documentation, training |

---

## 9. Dependencies

### External Services
- ✅ Ably (real-time messaging)
- ✅ Viasocket (webhook sync)
- ✅ Recall.ai (transcript)
- ✅ Manus OAuth (authentication)
- ✅ S3 (storage)

### Internal Services
- ✅ tRPC (backend API)
- ✅ Drizzle ORM (database)
- ✅ React 19 (frontend)
- ✅ Tailwind CSS 4 (styling)

---

## 10. Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| **Phase 1** | 2-3 weeks | 2026-03-27 | 2026-04-10 |
| **Phase 2** | 2-3 weeks | 2026-04-10 | 2026-04-24 |
| **Phase 3** | 2-3 weeks | 2026-04-24 | 2026-05-08 |
| **Production** | 1 week | 2026-05-08 | 2026-05-15 |

---

## 11. Approval Checklist

Before Phase 1 starts:
- [ ] Architecture audit complete (this document)
- [ ] Gap analysis reviewed
- [ ] Implementation plan approved
- [ ] File-level patches identified
- [ ] Testing plan defined
- [ ] Success criteria clear
- [ ] Timeline agreed
- [ ] ChatGPT review complete
- [ ] User approval obtained

---

## 12. Next Steps

1. **Manus:** Begin Phase 1 implementation
   - Integrate Q&A tab into OperatorConsole
   - Refine transcript and intelligence panels
   - Add viasocketSync calls
   - Write comprehensive tests

2. **ChatGPT:** Review and provide feedback
   - Validate architecture decisions
   - Suggest improvements
   - Review code quality
   - Approve for Phase 2

3. **User:** Monitor progress
   - Review checkpoints
   - Approve major milestones
   - Provide direction on changes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-27 | Initial architecture audit |
| | | Gap analysis complete |
| | | Implementation plan defined |
| | | Phase 1 & 2 detailed |

---

**This architecture document is the single source of truth for the Operator Console project. Both Manus and ChatGPT reference this when making decisions. User approves major changes.**
