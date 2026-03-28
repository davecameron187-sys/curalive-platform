# Sprint 2 Implementation Plan — Wire UI to Backend

**Status:** Ready for Implementation  
**Sprint Duration:** Week 2 (March 31 - April 4, 2026)  
**Audience:** Manus (Implementation), ChatGPT (Review), Product Owner (Approval)

---

## Overview

Sprint 2 removes all local state from the Operator Console and wires it to production backend procedures. The UI becomes a thin client that calls tRPC procedures and subscribes to Ably channels for real-time updates.

**Key Principle:** Backend is the source of truth. UI never mutates state locally.

---

## Tasks

### Task 2.1: Replace Session State with Backend Calls

**Objective:** Remove all local `useState` for session state. Replace with tRPC queries and mutations.

**Acceptance Criteria:**
- [ ] Remove local `useState` for: status, startedAt, pausedAt, endedAt, duration, elapsedSeconds
- [ ] Replace with `trpc.sessionStateMachine.getSessionState.useQuery()`
- [ ] "Start Session" button calls `trpc.sessionStateMachine.startSession.useMutation()`
- [ ] "Pause Session" button calls `trpc.sessionStateMachine.pauseSession.useMutation()`
- [ ] "Resume Session" button calls `trpc.sessionStateMachine.resumeSession.useMutation()`
- [ ] "End Session" button calls `trpc.sessionStateMachine.endSession.useMutation()`
- [ ] All mutations invalidate `getSessionState` query
- [ ] Loading states shown during mutations
- [ ] Error states handled gracefully with toast notifications
- [ ] Tests verify all mutations work correctly

**Files to Modify:**
- `client/src/pages/OperatorConsole.tsx` - Session state section

**Implementation Pattern:**
```typescript
// Get session state
const { data: sessionState, isLoading } = trpc.sessionStateMachine.getSessionState.useQuery(
  { sessionId },
  { refetchInterval: 5000 } // Fallback polling
);

// Start session mutation
const startSession = trpc.sessionStateMachine.startSession.useMutation({
  onSuccess: () => {
    trpc.useUtils().sessionStateMachine.getSessionState.invalidate();
    toast.success("Session started");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Button handler
const handleStartSession = () => {
  startSession.mutate({ sessionId });
};
```

**Tests Required:**
- [ ] Mutations call correct tRPC procedures
- [ ] Query is invalidated on success
- [ ] Loading states are shown
- [ ] Error states are handled
- [ ] State persists across page reloads (via query)

**Estimated Effort:** 2-3 hours

---

### Task 2.2: Replace Operator Notes with Backend Persistence

**Objective:** Wire notes to database. Notes are immutable and synced in real-time.

**Acceptance Criteria:**
- [ ] Remove local `notes` state from OperatorConsole
- [ ] "Add Note" button calls `trpc.sessionStateMachine.createOperatorAction.useMutation()`
- [ ] Notes retrieved via `trpc.sessionStateMachine.getSessionActionHistory.useQuery()`
- [ ] Notes display in chronological order (newest first)
- [ ] Each note shows: timestamp, operator name, content
- [ ] Notes are immutable (no edit/delete)
- [ ] Real-time sync: new notes appear immediately for all operators via Ably
- [ ] Tests verify notes persist and sync correctly

**Files to Modify:**
- `client/src/pages/OperatorConsole.tsx` - Notes section

**Implementation Pattern:**
```typescript
// Get action history (notes)
const { data: actionHistory = [] } = trpc.sessionStateMachine.getSessionActionHistory.useQuery(
  { sessionId, limit: 50, offset: 0 }
);

// Create note mutation
const createNote = trpc.sessionStateMachine.createOperatorAction.useMutation({
  onSuccess: () => {
    trpc.useUtils().sessionStateMachine.getSessionActionHistory.invalidate();
    setNoteInput("");
    toast.success("Note added");
  },
});

// Ably subscription for real-time updates
useEffect(() => {
  const channel = ably.channels.get(`session:${sessionId}:actions`);
  const subscription = channel.subscribe("action_created", (message) => {
    // Invalidate query to refetch
    trpc.useUtils().sessionStateMachine.getSessionActionHistory.invalidate();
  });
  return () => subscription.unsubscribe();
}, [sessionId]);
```

**Tests Required:**
- [ ] Notes persist to database
- [ ] Notes retrieved correctly
- [ ] Real-time sync works via Ably
- [ ] Immutability is enforced
- [ ] Pagination works correctly

**Estimated Effort:** 2-3 hours

---

### Task 2.3: Wire Q&A Tab to Backend

**Objective:** Replace hardcoded Q&A with real questions from database. All actions logged.

**Acceptance Criteria:**
- [ ] Q&A tab displays questions from `trpc.liveQa.getQuestions.useQuery()`
- [ ] "Approve" button calls `trpc.liveQa.approveQuestion.useMutation()`
- [ ] "Reject" button calls `trpc.liveQa.rejectQuestion.useMutation()`
- [ ] "Hold" button calls `trpc.liveQa.holdQuestion.useMutation()`
- [ ] "Send to Speaker" button calls `trpc.liveQa.sendToSpeaker.useMutation()`
- [ ] Question list updates in real-time via Ably subscription
- [ ] Each action creates an `operatorAction` log entry
- [ ] Tests verify all Q&A actions work correctly

**Files to Modify:**
- `client/src/pages/OperatorConsole.tsx` - Q&A tab section

**Implementation Pattern:**
```typescript
// Get questions
const { data: questions = [] } = trpc.liveQa.getQuestions.useQuery(
  { sessionId, status: "pending" }
);

// Approve question mutation
const approveQuestion = trpc.liveQa.approveQuestion.useMutation({
  onSuccess: async (result) => {
    // Create operator action log
    await createOperatorAction.mutateAsync({
      sessionId,
      actionType: "question_approved",
      targetId: result.id,
      targetType: "question",
      metadata: { questionText: result.text },
    });
    // Invalidate queries
    trpc.useUtils().liveQa.getQuestions.invalidate();
    toast.success("Question approved");
  },
});

// Ably subscription for real-time Q&A updates
useEffect(() => {
  const channel = ably.channels.get(`session:${sessionId}:qa`);
  const subscription = channel.subscribe("question_updated", (message) => {
    trpc.useUtils().liveQa.getQuestions.invalidate();
  });
  return () => subscription.unsubscribe();
}, [sessionId]);
```

**Tests Required:**
- [ ] All Q&A actions call correct procedures
- [ ] Questions update in real-time
- [ ] Operator actions are logged
- [ ] Queries are invalidated correctly
- [ ] Error handling works

**Estimated Effort:** 2-3 hours

---

### Task 2.4: Remove Hardcoded Demo Data

**Objective:** Delete all hardcoded DEMO_* constants. Console only shows real data.

**Acceptance Criteria:**
- [ ] Delete all `DEMO_QUESTIONS` from OperatorConsole
- [ ] Delete all `DEMO_NOTES` from OperatorConsole
- [ ] Delete all mock data and placeholder values
- [ ] Q&A tab only displays questions from `trpc.liveQa.getQuestions`
- [ ] Notes section only displays from `trpc.sessionStateMachine.getSessionActionHistory`
- [ ] Empty states show "No questions yet" / "No notes yet"
- [ ] Tests verify no hardcoded data exists

**Files to Modify:**
- `client/src/pages/OperatorConsole.tsx` - Remove DEMO_* constants

**Implementation Pattern:**
```typescript
// REMOVE:
// const DEMO_QUESTIONS = [...]
// const DEMO_NOTES = [...]

// KEEP ONLY:
const { data: questions = [] } = trpc.liveQa.getQuestions.useQuery({ sessionId });
const { data: actionHistory = [] } = trpc.sessionStateMachine.getSessionActionHistory.useQuery({ sessionId });

// Empty state handling
if (questions.length === 0) {
  return <div className="text-muted-foreground">No questions yet</div>;
}
```

**Tests Required:**
- [ ] No hardcoded data exists in component
- [ ] Empty states display correctly
- [ ] Real data displays when available

**Estimated Effort:** 1 hour

---

### Task 2.5: Add Loading States & Error Handling

**Objective:** Professional UX with loading skeletons and error toasts.

**Acceptance Criteria:**
- [ ] Loading skeleton shown while queries fetch
- [ ] Error toast shown on mutation failure
- [ ] Retry button available on errors
- [ ] Disabled state on buttons during mutations
- [ ] Loading spinner on async operations
- [ ] Tests verify all states display correctly

**Files to Modify:**
- `client/src/pages/OperatorConsole.tsx` - Add loading/error states

**Implementation Pattern:**
```typescript
// Loading state
if (isLoading) {
  return <OperatorConsoleSkeleton />;
}

// Error state
if (error) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    </div>
  );
}

// Mutation loading state
<button 
  disabled={startSession.isPending}
  onClick={() => startSession.mutate({ sessionId })}
>
  {startSession.isPending ? "Starting..." : "Start Session"}
</button>
```

**Tests Required:**
- [ ] Loading states display
- [ ] Error states display
- [ ] Retry logic works
- [ ] Buttons disabled during mutations

**Estimated Effort:** 1-2 hours

---

### Task 2.6: Write Comprehensive Integration Tests

**Objective:** 50+ tests covering all Sprint 2 workflows.

**Acceptance Criteria:**
- [ ] Tests verify session state mutations work
- [ ] Tests verify notes persist and sync
- [ ] Tests verify Q&A actions work
- [ ] Tests verify error handling
- [ ] Tests verify loading states
- [ ] Tests verify empty states
- [ ] All tests pass (100% pass rate)

**Files to Create:**
- `client/src/pages/OperatorConsole.integration.test.ts` - 50+ tests

**Test Categories:**
- Session state mutations (10 tests)
- Notes persistence and sync (10 tests)
- Q&A actions (10 tests)
- Error handling (10 tests)
- Loading states (5 tests)
- Empty states (5 tests)

**Estimated Effort:** 3-4 hours

---

## Implementation Sequence

1. **Task 2.1** (2-3h) - Session state mutations
2. **Task 2.2** (2-3h) - Notes persistence
3. **Task 2.3** (2-3h) - Q&A backend wiring
4. **Task 2.4** (1h) - Remove demo data
5. **Task 2.5** (1-2h) - Loading/error states
6. **Task 2.6** (3-4h) - Integration tests

**Total Estimated Time:** 14-18 hours (2-3 days)

---

## Testing Strategy

### Unit Tests
- Verify each tRPC mutation works
- Verify each query returns correct data
- Verify error handling

### Integration Tests
- Verify full workflows (start session → add note → approve question → end session)
- Verify real-time sync via Ably
- Verify concurrent operator scenarios

### Manual Testing
- Test in browser with real backend
- Test error scenarios (network failure, timeout)
- Test concurrent operators

---

## Success Criteria

✅ All 6 tasks completed  
✅ 50+ integration tests passing  
✅ Zero TypeScript errors  
✅ Zero hardcoded data  
✅ All mutations work correctly  
✅ Real-time sync works  
✅ Loading/error states display  
✅ Code reviewed and approved  

---

## GitHub Integration

**Branch:** ManusChatgpt  
**PR Title:** `Sprint 2: Wire Operator Console to Backend (Tasks 2.1-2.6)`  
**PR Description:** Links to this document and PHASE_3_IMPLEMENTATION_BRIEF.md

**Commit Pattern:**
```
[Sprint 2] Task 2.1: Replace session state with backend calls
[Sprint 2] Task 2.2: Wire operator notes to database
[Sprint 2] Task 2.3: Wire Q&A tab to backend
[Sprint 2] Task 2.4: Remove hardcoded demo data
[Sprint 2] Task 2.5: Add loading states and error handling
[Sprint 2] Task 2.6: Write 50+ integration tests
```

---

## Notes

- All work stays on ManusChatgpt branch
- Push to GitHub after each task completion
- Create PR when all 6 tasks complete
- Link PR to PHASE_3_IMPLEMENTATION_BRIEF.md
- Request ChatGPT review before merging
