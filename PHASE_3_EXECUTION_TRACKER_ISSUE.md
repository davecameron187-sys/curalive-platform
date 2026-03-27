# Operator Console Phase 3 — Execution Tracker

**Status:** In Progress  
**Target Completion:** April 24, 2026  
**Owner:** Manus (Implementation)  
**Reviewer:** ChatGPT (Architecture & Code Quality)  

---

## Overview

This issue tracks the execution of Phase 3: Wire UI to Backend, Remove Placeholders, Implement Real-Time Sync.

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

## Workstreams

### Sprint 1: Backend Persistence & Real-Time Sync (Week 1)

- [ ] **Task 1.1: Session Persistence**
  - [ ] `startSession` persists to `operatorSessions` table
  - [ ] `pauseSession` updates status and timestamps
  - [ ] `resumeSession` updates status
  - [ ] `endSession` persists end time and duration
  - [ ] All transitions logged to `sessionStateTransitions`
  - [ ] Database queries optimized with indexes
  - [ ] Tests: 8 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 1.2: Ably Real-Time Sync**
  - [ ] `sessionStateMachine` emits Ably events
  - [ ] Channel name: `session:{sessionId}:state`
  - [ ] Event payload includes: previousState, newState, timestamp, operatorId
  - [ ] OperatorConsole subscribes to Ably channel
  - [ ] UI updates from Ably (not local state)
  - [ ] Multiple operators see updates in real-time (<100ms)
  - [ ] Connection loss handled gracefully
  - [ ] Tests: 6 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 1.3: Operator Action Persistence**
  - [ ] `createOperatorAction` persists to `operatorActions` table
  - [ ] Action types: note_created, question_approved, question_rejected, etc.
  - [ ] Each action includes: sessionId, userId, actionType, targetId, metadata, timestamp
  - [ ] Actions are immutable (insert only, no updates)
  - [ ] `getSessionActionHistory` retrieves action log
  - [ ] Tests: 6 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 1 Status:** 🔴 Not Started

---

### Sprint 2: Wire UI to Backend (Week 2)

- [ ] **Task 2.1: Replace Session State with Backend Calls**
  - [ ] Remove all local `useState` for session state
  - [ ] Replace with `trpc.sessionStateMachine.getSessionState.useQuery()`
  - [ ] "Start Session" calls `startSession.useMutation()`
  - [ ] "Pause Session" calls `pauseSession.useMutation()`
  - [ ] "Resume Session" calls `resumeSession.useMutation()`
  - [ ] "End Session" calls `endSession.useMutation()`
  - [ ] All mutations invalidate `getSessionState` query
  - [ ] Loading states shown during mutations
  - [ ] Error states handled gracefully
  - [ ] Tests: 8 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 2.2: Replace Operator Notes with Backend Persistence**
  - [ ] Remove local `notes` state
  - [ ] "Add Note" calls `createOperatorAction.useMutation()`
  - [ ] Notes retrieved via `getSessionActionHistory.useQuery()`
  - [ ] Notes display chronologically (newest first)
  - [ ] Each note shows: timestamp, operator name, content
  - [ ] Notes are immutable
  - [ ] Real-time sync: new notes appear immediately
  - [ ] Tests: 6 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 2.3: Wire Q&A Tab to Backend**
  - [ ] Q&A tab displays questions from `trpc.liveQa.getQuestions.useQuery()`
  - [ ] "Approve" calls `approveQuestion.useMutation()`
  - [ ] "Reject" calls `rejectQuestion.useMutation()`
  - [ ] "Hold" calls `holdQuestion.useMutation()`
  - [ ] "Send to Speaker" calls `sendToSpeaker.useMutation()`
  - [ ] Question list updates in real-time via Ably
  - [ ] Each action creates operator action log entry
  - [ ] Tests: 8 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 2 Status:** 🔴 Not Started

---

### Sprint 3: Remove Placeholder Data & Hardcoded Defaults (Week 2)

- [ ] **Task 3.1: Remove Hardcoded Questions**
  - [ ] Delete all `DEMO_QUESTIONS` constants
  - [ ] Delete all mock question data
  - [ ] Q&A tab only displays real questions
  - [ ] Show "No questions yet" if empty
  - [ ] Tests: 3 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 3.2: Remove Hardcoded Notes**
  - [ ] Delete all `DEMO_NOTES` constants
  - [ ] Delete all mock note data
  - [ ] Notes tab only displays real notes
  - [ ] Show "No notes yet" if empty
  - [ ] Tests: 2 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 3.3: Remove Hardcoded Intelligence Signals**
  - [ ] Delete all hardcoded sentiment/compliance/engagement data
  - [ ] Intelligence signals from real data or backend
  - [ ] Show "Waiting for data..." if unavailable
  - [ ] Tests: 2 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 3 Status:** 🔴 Not Started

---

### Sprint 4: Error Handling & Edge Cases (Week 3)

- [ ] **Task 4.1: Session State Validation**
  - [ ] Cannot start if already running
  - [ ] Cannot pause if not running
  - [ ] Cannot resume if not paused
  - [ ] Cannot end if already ended
  - [ ] Invalid transitions show user-friendly errors
  - [ ] Tests: 5 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 4.2: Concurrent Operator Handling**
  - [ ] Multiple operators can view same session
  - [ ] Only one operator can transition state (optimistic locking)
  - [ ] Failed operator sees: "Session was started by another operator"
  - [ ] Tests: 4 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 4.3: Network Failure & Reconnection**
  - [ ] UI shows "Disconnected" indicator
  - [ ] Auto-reconnect with exponential backoff
  - [ ] Fetch latest state on reconnection
  - [ ] No data loss during disconnection
  - [ ] Tests: 4 tests passing
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 4 Status:** 🔴 Not Started

---

### Sprint 5: Testing & Validation (Week 3)

- [ ] **Task 5.1: Integration Tests**
  - [ ] 50+ new integration tests
  - [ ] All state transitions tested
  - [ ] All operator actions tested
  - [ ] Real-time sync tested
  - [ ] Concurrent operators tested
  - [ ] Error cases tested
  - [ ] Code coverage >90%
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 5.2: End-to-End Tests**
  - [ ] 20+ E2E tests
  - [ ] Full operator workflows tested
  - [ ] Multiple operators simultaneously
  - [ ] Real-time sync between operators
  - [ ] Error recovery and reconnection
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 5.3: Performance Tests**
  - [ ] Session state query: <100ms
  - [ ] State transition: <200ms
  - [ ] Ably latency: <100ms
  - [ ] Total round-trip: <250ms
  - [ ] 100+ questions per session
  - [ ] 10+ concurrent operators
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 5 Status:** 🔴 Not Started

---

### Sprint 6: Documentation & Handoff (Week 4)

- [ ] **Task 6.1: Architecture Documentation**
  - [ ] Document state machine architecture
  - [ ] Document real-time sync architecture
  - [ ] Document database schema
  - [ ] Document error handling strategy
  - [ ] Document deployment checklist
  - **PR:** (pending)
  - **Status:** Not Started

- [ ] **Task 6.2: Operator Workflow Documentation**
  - [ ] How to start a session
  - [ ] How to manage Q&A
  - [ ] How to add notes
  - [ ] How to end session and get handoff
  - [ ] Include screenshots and examples
  - **PR:** (pending)
  - **Status:** Not Started

**Sprint 6 Status:** 🔴 Not Started

---

## Definition of Done

Phase 3 is complete when ALL are true:

### Code Quality
- [ ] Zero TypeScript errors
- [ ] All linting rules pass
- [ ] No console errors or warnings
- [ ] Code follows project conventions

### Testing
- [ ] 50+ new tests written
- [ ] 99%+ test passing rate
- [ ] Code coverage >90%
- [ ] All edge cases tested

### Functionality
- [ ] All session state flows through backend
- [ ] All operator actions persisted
- [ ] Real-time sync works for concurrent operators
- [ ] No placeholder data in UI
- [ ] Error handling is graceful
- [ ] Network failures handled

### Performance
- [ ] Session state query: <100ms
- [ ] State transition: <200ms
- [ ] Real-time sync: <100ms
- [ ] Total round-trip: <250ms

### Documentation
- [ ] Architecture documented
- [ ] Operator workflows documented
- [ ] Deployment checklist created

### Acceptance
- [ ] ChatGPT has reviewed and approved
- [ ] Product owner has signed off
- [ ] Ready for production deployment

---

## PR Linking

Each PR must include:

```markdown
## Phase 3 Implementation

**Brief Section:** [Task X.Y: Task Name]

**What Changed:**
- [Change 1]
- [Change 2]

**Acceptance Criteria Met:**
- [x] Criterion 1
- [x] Criterion 2

**Tests:**
- [x] 8 new tests added
- [x] All tests passing
- [x] Code coverage: 92%

**Remaining Work:**
- [ ] Task X.Y+1 (next task)

**Tested:**
- [x] Unit tests
- [x] Integration tests
- [x] Manual testing

**Status:** Ready for review
```

---

## Progress Summary

| Sprint | Status | ETA | Notes |
|--------|--------|-----|-------|
| Sprint 1 | 🔴 Not Started | Apr 3 | Backend persistence & real-time sync |
| Sprint 2 | 🔴 Not Started | Apr 10 | Wire UI to backend |
| Sprint 3 | 🔴 Not Started | Apr 10 | Remove placeholder data |
| Sprint 4 | 🔴 Not Started | Apr 17 | Error handling & edge cases |
| Sprint 5 | 🔴 Not Started | Apr 17 | Testing & validation |
| Sprint 6 | 🔴 Not Started | Apr 24 | Documentation & handoff |

---

## Blockers

None currently.

---

## Related Documents

- **Implementation Brief:** [PHASE_3_IMPLEMENTATION_BRIEF.md](./PHASE_3_IMPLEMENTATION_BRIEF.md)
- **Architecture:** [OPERATOR_CONSOLE_ARCHITECTURE.md](./OPERATOR_CONSOLE_ARCHITECTURE.md)
- **Roadmap:** [OPERATOR_CONSOLE_ROADMAP.md](./OPERATOR_CONSOLE_ROADMAP.md)

---

## Next Steps

1. Manus: Begin Sprint 1 implementation
2. Create PR for Task 1.1 (Session Persistence)
3. Link PR to this issue
4. ChatGPT reviews PR against brief
5. Iterate until acceptance criteria met
6. Move to Task 1.2

---

**This issue is the execution tracker for Phase 3. All work is tracked here. GitHub is the source of truth.**
