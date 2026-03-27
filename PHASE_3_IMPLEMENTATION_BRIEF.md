# CuraLive Operator Console — Phase 3 Implementation Brief for Manus

**Status:** Execution Contract  
**Version:** 1.0  
**Date:** March 27, 2026  
**Audience:** Manus (Implementation), ChatGPT (Review), Product Owner (Approval)

---

## Executive Summary

Phase 3 transforms the Operator Console from a beautiful UI shell into a production-ready, server-authoritative system. This phase wires the premium UI (Phase 1) to the backend state machine (Phase 2), removes all placeholder data, implements real-time sync, and establishes the durable operator workflow.

**Phase 3 Success Criteria:**
- ✅ All session state flows through backend procedures (zero local state mutations)
- ✅ All operator actions are persisted and auditable
- ✅ Real-time sync works for concurrent operators
- ✅ No placeholder data or hardcoded defaults
- ✅ 50+ new tests covering all workflows
- ✅ Production-ready error handling and edge cases
- ✅ Zero TypeScript errors
- ✅ 99%+ test passing rate

---

## Architecture Overview

### State Flow (Canonical)

```
UI Event (operator clicks "Start Session")
    ↓
React Handler calls tRPC procedure
    ↓
Backend validates state transition
    ↓
Backend executes state change (idempotent)
    ↓
Backend persists to database
    ↓
Backend emits Ably event
    ↓
All connected operators receive update via Ably
    ↓
UI updates from Ably subscription (not local state)
    ↓
Viasocket webhook fires (async, non-blocking)
```

**Key Principle:** Backend is the source of truth. UI is a thin client that subscribes to state changes.

### Real-Time Architecture

```
Operator Console (UI)
    ↓
tRPC Procedure Call
    ↓
sessionStateMachine Router (Backend)
    ↓
Database (Persistence)
    ↓
Ably Channel (Real-Time Broadcast)
    ↓
All Connected Operators (Subscription)
    ↓
Viasocket Webhook (External Sync, Async)
```

**Latency Targets:**
- tRPC call: <100ms
- Database write: <50ms
- Ably broadcast: <100ms
- Total round-trip: <250ms

---

## Phase 3 Scope & Sequencing

### Sprint 1: Backend Persistence & Real-Time Sync (Week 1)

**Goal:** Make backend the source of truth. All state flows through database and Ably.

#### Task 1.1: Implement Session Persistence
**Acceptance Criteria:**
- [ ] `sessionStateMachine.startSession` persists to `operatorSessions` table
- [ ] `sessionStateMachine.pauseSession` updates `status` and `pausedAt` timestamp
- [ ] `sessionStateMachine.resumeSession` updates `status` and clears `pausedAt`
- [ ] `sessionStateMachine.endSession` persists `endedAt` and calculates total duration
- [ ] All state transitions are logged to `sessionStateTransitions` table
- [ ] Database queries are optimized (indexed on `sessionId`, `userId`, `status`)
- [ ] Tests verify all state transitions persist correctly

**Implementation:**
```typescript
// server/routers/sessionStateMachine.ts
// Add database persistence to each procedure:
// - Insert/update operatorSessions
// - Insert sessionStateTransitions (audit log)
// - Emit Ably event
```

**Tests:**
- State transitions persist to database
- Timestamps are accurate
- Concurrent state changes don't corrupt data
- Idempotent (same call twice = same result)

---

#### Task 1.2: Implement Ably Real-Time Sync
**Acceptance Criteria:**
- [ ] `sessionStateMachine` emits Ably events for all state changes
- [ ] Ably channel name: `session:{sessionId}:state`
- [ ] Event payload includes: `previousState`, `newState`, `timestamp`, `operatorId`
- [ ] OperatorConsole subscribes to Ably channel on mount
- [ ] UI updates when Ably event received (not from local state)
- [ ] Multiple operators see updates in real-time (<100ms latency)
- [ ] Connection loss is handled gracefully (reconnect with backoff)
- [ ] Tests verify Ably events are emitted and received

**Implementation:**
```typescript
// server/routers/sessionStateMachine.ts
import { ably } from "./server/_core/ably";

// After state change:
await ably.channels.get(`session:${sessionId}:state`).publish("state-changed", {
  previousState,
  newState,
  timestamp: Date.now(),
  operatorId: ctx.user.id,
});

// client/src/pages/OperatorConsole.tsx
useEffect(() => {
  const channel = ably.channels.get(`session:${sessionId}:state`);
  channel.subscribe("state-changed", (message) => {
    setSessionState(message.data.newState);
  });
  return () => channel.unsubscribe();
}, [sessionId]);
```

**Tests:**
- Ably events are emitted on state change
- UI updates when event received
- Multiple subscribers receive same event
- Reconnection works after network loss

---

#### Task 1.3: Implement Operator Action Persistence
**Acceptance Criteria:**
- [ ] `createOperatorAction` persists to `operatorActions` table
- [ ] Action types: note_created, question_approved, question_rejected, question_held, question_sent_to_speaker, compliance_flag_raised, compliance_flag_cleared, key_moment_marked
- [ ] Each action includes: `sessionId`, `userId`, `actionType`, `targetId`, `targetType`, `metadata`, `timestamp`
- [ ] Actions are immutable (no updates, only inserts)
- [ ] Action history is retrievable via `getSessionActionHistory`
- [ ] Tests verify all action types persist correctly

**Implementation:**
```typescript
// server/routers/sessionStateMachine.ts
export const sessionStateMachineRouter = router({
  createOperatorAction: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      actionType: z.enum([...]),
      targetId: z.string().optional(),
      targetType: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Insert to operatorActions table
      // Emit Ably event
      // Return action ID
    }),
  
  getSessionActionHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      // Query operatorActions table
      // Return sorted by timestamp DESC
    }),
});
```

**Tests:**
- All action types persist
- Action history is retrievable
- Actions are immutable
- Timestamps are accurate

---

### Sprint 2: Wire UI to Backend (Week 2)

**Goal:** Replace all local state with tRPC calls and Ably subscriptions.

#### Task 2.1: Replace Session State with Backend Calls
**Acceptance Criteria:**
- [ ] Remove all local `useState` for session state (status, startedAt, pausedAt, endedAt, duration)
- [ ] Replace with `trpc.sessionStateMachine.getSessionState.useQuery()`
- [ ] "Start Session" button calls `trpc.sessionStateMachine.startSession.useMutation()`
- [ ] "Pause Session" button calls `trpc.sessionStateMachine.pauseSession.useMutation()`
- [ ] "Resume Session" button calls `trpc.sessionStateMachine.resumeSession.useMutation()`
- [ ] "End Session" button calls `trpc.sessionStateMachine.endSession.useMutation()`
- [ ] All mutations invalidate `getSessionState` query
- [ ] Loading states are shown during mutations
- [ ] Error states are handled gracefully
- [ ] Tests verify all mutations work correctly

**Implementation:**
```typescript
// client/src/pages/OperatorConsole.tsx
const { data: sessionState } = trpc.sessionStateMachine.getSessionState.useQuery(
  { sessionId },
  { refetchInterval: 5000 } // Fallback polling
);

const startSession = trpc.sessionStateMachine.startSession.useMutation({
  onSuccess: () => {
    trpc.useUtils().sessionStateMachine.getSessionState.invalidate();
  },
});

const handleStartSession = () => {
  startSession.mutate({ sessionId });
};
```

**Tests:**
- Mutations call correct tRPC procedures
- Query is invalidated on success
- Loading states are shown
- Error states are handled

---

#### Task 2.2: Replace Operator Notes with Backend Persistence
**Acceptance Criteria:**
- [ ] Remove local `notes` state from OperatorConsole
- [ ] "Add Note" button calls `trpc.sessionStateMachine.createOperatorAction.useMutation()`
- [ ] Notes are retrieved via `trpc.sessionStateMachine.getSessionActionHistory.useQuery()`
- [ ] Notes display in chronological order (newest first)
- [ ] Each note shows: timestamp, operator name, content
- [ ] Notes are immutable (no edit/delete)
- [ ] Real-time sync: new notes appear immediately for all operators
- [ ] Tests verify notes persist and sync correctly

**Implementation:**
```typescript
// client/src/pages/OperatorConsole.tsx
const { data: actionHistory } = trpc.sessionStateMachine.getSessionActionHistory.useQuery(
  { sessionId }
);

const createNote = trpc.sessionStateMachine.createOperatorAction.useMutation({
  onSuccess: () => {
    trpc.useUtils().sessionStateMachine.getSessionActionHistory.invalidate();
  },
});

const handleAddNote = (content: string) => {
  createNote.mutate({
    sessionId,
    actionType: "note_created",
    metadata: { content },
  });
};
```

**Tests:**
- Notes persist to database
- Notes are retrieved correctly
- Real-time sync works
- Immutability is enforced

---

#### Task 2.3: Wire Q&A Tab to Backend
**Acceptance Criteria:**
- [ ] Q&A tab displays questions from `trpc.liveQa.getQuestions.useQuery()`
- [ ] "Approve" button calls `trpc.liveQa.approveQuestion.useMutation()`
- [ ] "Reject" button calls `trpc.liveQa.rejectQuestion.useMutation()`
- [ ] "Hold" button calls `trpc.liveQa.holdQuestion.useMutation()`
- [ ] "Send to Speaker" button calls `trpc.liveQa.sendToSpeaker.useMutation()`
- [ ] Question list updates in real-time via Ably subscription
- [ ] Each action creates an `operatorAction` log entry
- [ ] Tests verify all Q&A actions work correctly

**Implementation:**
```typescript
// client/src/pages/OperatorConsole.tsx - Q&A Tab
const { data: questions } = trpc.liveQa.getQuestions.useQuery({ sessionId });

const approveQuestion = trpc.liveQa.approveQuestion.useMutation({
  onSuccess: async () => {
    // Create operator action log
    await createOperatorAction.mutateAsync({
      sessionId,
      actionType: "question_approved",
      targetId: questionId,
      targetType: "question",
    });
    // Invalidate queries
    trpc.useUtils().liveQa.getQuestions.invalidate();
  },
});
```

**Tests:**
- All Q&A actions call correct procedures
- Questions update in real-time
- Operator actions are logged
- Queries are invalidated correctly

---

### Sprint 3: Remove Placeholder Data & Hardcoded Defaults (Week 2)

**Goal:** Strip all fake data. Console only shows real session data.

#### Task 3.1: Remove Hardcoded Questions
**Acceptance Criteria:**
- [ ] Delete all hardcoded `DEMO_QUESTIONS` from OperatorConsole
- [ ] Delete all mock question data
- [ ] Q&A tab only displays questions from `trpc.liveQa.getQuestions`
- [ ] If no questions exist, show "No questions yet" message
- [ ] Tests verify no hardcoded data exists

**Implementation:**
```typescript
// REMOVE:
// const DEMO_QUESTIONS = [...]

// KEEP ONLY:
const { data: questions = [] } = trpc.liveQa.getQuestions.useQuery({ sessionId });

if (questions.length === 0) {
  return <div>No questions yet</div>;
}
```

---

#### Task 3.2: Remove Hardcoded Notes
**Acceptance Criteria:**
- [ ] Delete all hardcoded `DEMO_NOTES` from OperatorConsole
- [ ] Delete all mock note data
- [ ] Notes tab only displays notes from `trpc.sessionStateMachine.getSessionActionHistory`
- [ ] If no notes exist, show "No notes yet" message
- [ ] Tests verify no hardcoded data exists

---

#### Task 3.3: Remove Hardcoded Intelligence Signals
**Acceptance Criteria:**
- [ ] Delete all hardcoded sentiment, compliance, engagement data
- [ ] Intelligence signals come from real session data or backend procedures
- [ ] If no data available, show "Waiting for data..." message
- [ ] Tests verify no hardcoded data exists

---

### Sprint 4: Error Handling & Edge Cases (Week 3)

**Goal:** Handle all failure modes gracefully.

#### Task 4.1: Session State Validation
**Acceptance Criteria:**
- [ ] Cannot start session if already running
- [ ] Cannot pause session if not running
- [ ] Cannot resume session if not paused
- [ ] Cannot end session if already ended
- [ ] Invalid state transitions show user-friendly error messages
- [ ] Tests verify all invalid transitions are rejected

**Implementation:**
```typescript
// server/routers/sessionStateMachine.ts
export const startSession = protectedProcedure
  .input(z.object({ sessionId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const session = await getSessionState(input.sessionId);
    
    if (session.status !== "idle") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot start session in ${session.status} state`,
      });
    }
    
    // Proceed with state change
  }),
```

---

#### Task 4.2: Concurrent Operator Handling
**Acceptance Criteria:**
- [ ] Multiple operators can view same session simultaneously
- [ ] Only one operator can transition state at a time (optimistic locking)
- [ ] If two operators try to start session simultaneously, only one succeeds
- [ ] Failed operator sees error: "Session was started by another operator"
- [ ] Tests verify concurrent access is handled correctly

**Implementation:**
```typescript
// Use database version field for optimistic locking
// operatorSessions table includes: version INT
// Each update increments version
// Update only succeeds if version matches
```

---

#### Task 4.3: Network Failure & Reconnection
**Acceptance Criteria:**
- [ ] UI shows "Disconnected" indicator when Ably connection lost
- [ ] UI automatically reconnects with exponential backoff
- [ ] When reconnected, UI fetches latest state from backend
- [ ] No data loss during disconnection
- [ ] Tests verify reconnection works correctly

**Implementation:**
```typescript
// client/src/pages/OperatorConsole.tsx
useEffect(() => {
  const channel = ably.channels.get(`session:${sessionId}:state`);
  
  channel.on("attached", () => setConnected(true));
  channel.on("detached", () => setConnected(false));
  channel.on("failed", () => setConnected(false));
  
  return () => channel.unsubscribe();
}, [sessionId]);

// Show indicator
{!connected && <div className="bg-red-500">Disconnected</div>}
```

---

### Sprint 5: Testing & Validation (Week 3)

**Goal:** Comprehensive test coverage for all workflows.

#### Task 5.1: Integration Tests
**Acceptance Criteria:**
- [ ] 50+ new integration tests
- [ ] Test all state transitions (idle → running → paused → ended)
- [ ] Test all operator actions (notes, Q&A approvals, etc.)
- [ ] Test real-time sync (Ably events)
- [ ] Test concurrent operators
- [ ] Test error cases and edge cases
- [ ] All tests passing
- [ ] Code coverage >90%

**Test Structure:**
```typescript
// server/sessionStateMachine.integration.test.ts
describe("Session State Machine", () => {
  describe("startSession", () => {
    it("should transition from idle to running", async () => { });
    it("should persist to database", async () => { });
    it("should emit Ably event", async () => { });
    it("should fail if already running", async () => { });
  });
  
  describe("pauseSession", () => {
    it("should transition from running to paused", async () => { });
    it("should record pause duration", async () => { });
    // ... more tests
  });
  
  // ... more describe blocks
});
```

---

#### Task 5.2: End-to-End Tests
**Acceptance Criteria:**
- [ ] 20+ E2E tests covering full operator workflows
- [ ] Test: Start session → Add note → Approve question → End session
- [ ] Test: Multiple operators working simultaneously
- [ ] Test: Real-time sync between operators
- [ ] Test: Error recovery and reconnection
- [ ] All E2E tests passing

---

#### Task 5.3: Performance Tests
**Acceptance Criteria:**
- [ ] Session state query: <100ms
- [ ] State transition mutation: <200ms
- [ ] Ably event latency: <100ms
- [ ] Total round-trip: <250ms
- [ ] Can handle 100+ questions per session
- [ ] Can handle 10+ concurrent operators
- [ ] Tests verify performance targets

---

### Sprint 6: Documentation & Handoff (Week 4)

**Goal:** Document all workflows and decisions for future maintenance.

#### Task 6.1: Architecture Documentation
**Acceptance Criteria:**
- [ ] Document state machine architecture
- [ ] Document real-time sync architecture
- [ ] Document database schema and relationships
- [ ] Document error handling strategy
- [ ] Document deployment checklist

---

#### Task 6.2: Operator Workflow Documentation
**Acceptance Criteria:**
- [ ] Document how to start a session
- [ ] Document how to manage Q&A
- [ ] Document how to add notes
- [ ] Document how to end session and get handoff
- [ ] Include screenshots and examples

---

## Definition of Done

Phase 3 is complete when ALL of the following are true:

### Code Quality
- ✅ Zero TypeScript errors
- ✅ All linting rules pass
- ✅ No console errors or warnings
- ✅ Code follows project conventions

### Testing
- ✅ 50+ new tests written
- ✅ 99%+ test passing rate
- ✅ Code coverage >90%
- ✅ All edge cases tested

### Functionality
- ✅ All session state flows through backend
- ✅ All operator actions are persisted
- ✅ Real-time sync works for concurrent operators
- ✅ No placeholder data in UI
- ✅ Error handling is graceful
- ✅ Network failures are handled

### Performance
- ✅ Session state query: <100ms
- ✅ State transition: <200ms
- ✅ Real-time sync: <100ms
- ✅ Total round-trip: <250ms

### Documentation
- ✅ Architecture documented
- ✅ Operator workflows documented
- ✅ Deployment checklist created

### Acceptance
- ✅ ChatGPT has reviewed and approved
- ✅ Product owner has signed off
- ✅ Ready for production deployment

---

## Acceptance Criteria by Component

### OperatorConsole.tsx
- [ ] No local state for session status, notes, or Q&A
- [ ] All state comes from tRPC queries
- [ ] All mutations call tRPC procedures
- [ ] Ably subscriptions update UI in real-time
- [ ] No hardcoded data or defaults
- [ ] Loading states shown during mutations
- [ ] Error states handled gracefully
- [ ] 40+ tests passing

### sessionStateMachine Router
- [ ] All procedures persist to database
- [ ] All procedures emit Ably events
- [ ] All procedures create operator action logs
- [ ] State transitions are validated
- [ ] Concurrent access is handled (optimistic locking)
- [ ] Error messages are user-friendly
- [ ] 30+ tests passing

### Database Schema
- [ ] operatorSessions table: complete
- [ ] operatorActions table: complete
- [ ] sessionStateTransitions table: complete
- [ ] sessionHandoffPackages table: complete
- [ ] All indexes created
- [ ] Foreign keys enforced
- [ ] Migrations tested

### Real-Time Sync (Ably)
- [ ] Session state changes broadcast to all operators
- [ ] Operator actions broadcast in real-time
- [ ] Q&A updates broadcast in real-time
- [ ] Connection loss handled gracefully
- [ ] Reconnection with backoff implemented
- [ ] 10+ tests passing

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Tests Passing | 99%+ | TBD | 🔄 |
| Code Coverage | >90% | TBD | 🔄 |
| TypeScript Errors | 0 | TBD | 🔄 |
| Session Query Latency | <100ms | TBD | 🔄 |
| State Transition Latency | <200ms | TBD | 🔄 |
| Real-Time Sync Latency | <100ms | TBD | 🔄 |
| Concurrent Operators | 10+ | TBD | 🔄 |
| Questions per Session | 100+ | TBD | 🔄 |

---

## Risk Mitigation

### Risk: Database Performance Degradation
**Mitigation:**
- Add indexes on `sessionId`, `userId`, `status`
- Use connection pooling
- Monitor query performance
- Load test with 1000+ questions

### Risk: Real-Time Sync Latency
**Mitigation:**
- Use Ably for pub/sub (not polling)
- Implement optimistic updates
- Cache session state locally
- Monitor Ably latency

### Risk: Concurrent Operator Conflicts
**Mitigation:**
- Use optimistic locking (version field)
- Implement conflict resolution
- Show conflict warnings to operators
- Log all concurrent access attempts

### Risk: Data Loss During Network Failure
**Mitigation:**
- Persist all actions to database immediately
- Use Ably for reliable delivery
- Implement retry logic with backoff
- Test network failure scenarios

---

## Rollout Plan

### Phase 3a: Backend Only (Internal Testing)
- Implement all backend procedures
- Deploy to staging
- Run integration tests
- Get ChatGPT approval

### Phase 3b: UI Wiring (Beta)
- Wire UI to backend
- Deploy to staging
- Run E2E tests
- Get product owner approval

### Phase 3c: Production Rollout
- Deploy to production
- Monitor performance and errors
- Gather operator feedback
- Iterate based on feedback

---

## Approval & Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| Manus (Implementation) | - | Pending | - |
| ChatGPT (Architecture Review) | - | Pending | - |
| Product Owner | David Cameron | Pending | - |

---

## Next Steps

1. **Manus:** Review this brief and ask clarifying questions
2. **ChatGPT:** Review and provide architectural feedback
3. **Product Owner:** Approve scope and timeline
4. **Manus:** Begin Phase 3 implementation (Sprint 1)
5. **Weekly:** Sync on progress, blockers, and adjustments

---

**This document is the execution contract for Phase 3. All implementation should align with this brief. Changes require approval from ChatGPT and Product Owner.**
