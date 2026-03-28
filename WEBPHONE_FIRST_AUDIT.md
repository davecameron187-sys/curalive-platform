# WebPhone-First Architecture Audit Report

**Date:** 2026-03-28  
**Status:** Phase 1 Complete - Audit Findings  
**Objective:** Identify all non-WebPhone defaults and connectivity assumptions in CuraLive platform

---

## Executive Summary

Current platform architecture treats connectivity providers (Zoom, Teams, Webex, RTMP, PSTN) as **primary options** with WebPhone as a secondary capability. The audit identifies **9 critical areas** requiring changes to make WebPhone the default connectivity layer.

**Key Finding:** WebPhone infrastructure exists (`server/webphone.ts`) but is **not integrated into event creation, session setup, or operator workflows**. It's a standalone module with no connection to the main event/session lifecycle.

---

## Current Architecture Analysis

### 1. Database Schema - Platform Field

**File:** `drizzle/schema.ts:52`

```typescript
platform: varchar("platform", { length: 64 }).notNull(), // "zoom", "teams", "webex", "rtmp", "pstn"
```

**Current State:**
- Events table has a `platform` field that accepts: `"zoom"`, `"teams"`, `"webex"`, `"rtmp"`, `"pstn"`
- **WebPhone is NOT listed as a platform option**
- No default value specified → requires explicit selection during event creation
- No migration path from other platforms to WebPhone

**Issue:** WebPhone cannot be selected as the platform. System architecture assumes one of the 5 listed providers.

**Required Change:** Add `"webphone"` as a platform option and set it as the default value.

---

### 2. Event Creation Flow

**File:** `server/routers/liveQa.ts:72-94` (createSession procedure)

```typescript
createSession: protectedProcedure
  .input(CreateSessionInput)
  .mutation(async ({ input }) => {
    // Creates session but NO connectivity provider selection
    // No platform/connectivity field in input
  })
```

**Current State:**
- `createSession` procedure does NOT accept platform/connectivity provider parameter
- No default connectivity provider assigned during session creation
- Session metadata created without connectivity information

**Issue:** Sessions are created without specifying connectivity provider. No WebPhone initialization.

**Required Change:** 
1. Add `connectivityProvider` parameter to CreateSessionInput (default: "webphone")
2. Call `initializeWebphone()` when provider is "webphone"
3. Store connectivity provider in session metadata

---

### 3. Session Metadata Storage

**File:** `drizzle/schema.ts` - `liveQaSessionMetadata` table

**Current State:**
- Session metadata stores: eventId, sessionId, sessionName, moderatorId, operatorId, isLive, timestamps
- **NO field for connectivity provider or connection status**
- **NO field for WebPhone configuration (SIP username, connection ID, etc.)**

**Issue:** Cannot track which connectivity provider a session uses. No way to store WebPhone-specific configuration.

**Required Change:** Add fields to `liveQaSessionMetadata`:
- `connectivityProvider: varchar("connectivity_provider", { length: 64 }).default("webphone")`
- `webphoneConnectionId: varchar("webphone_connection_id", { length: 128 })`
- `webphoneStatus: mysqlEnum("webphone_status", ["initialized", "active", "disconnected", "failed"])`

---

### 4. WebPhone Module Status

**File:** `server/webphone.ts`

**Current State:**
- Standalone module with 8 functions:
  - `initializeWebphone()` - Mock implementation
  - `handleIncomingCall()` - Mock implementation
  - `recordCall()` - Mock implementation
  - `endCall()` - Mock implementation
  - `routeCallToSpeaker()` - Mock implementation
  - `getCallQuality()` - Mock implementation
  - `transcribeVoiceQuestion()` - Mock implementation
  - `monitorCallQuality()` - Mock implementation

**Current State:**
- **NOT imported or used anywhere in the codebase**
- **NOT called during session creation**
- **NOT integrated with operator console**
- **NOT integrated with Shadow Mode**
- All functions are mock implementations

**Issue:** WebPhone exists but is completely disconnected from the event/session lifecycle.

**Required Change:**
1. Import webphone module into session creation flow
2. Call `initializeWebphone()` for every new session (default)
3. Integrate with operator console for call management
4. Store WebPhone connection ID in session metadata
5. Replace mock implementations with real Telnyx API calls

---

### 5. Operator Console - No Connectivity Provider Display

**File:** `client/src/pages/OperatorConsole.tsx:1-100`

**Current State:**
- Operator console displays: questions, notes, event log, transcript
- **NO indication of which connectivity provider is being used**
- **NO WebPhone call management UI**
- **NO WebPhone participant list**
- **NO WebPhone call quality monitoring**

**Issue:** Operators cannot see or manage WebPhone connections. No UI for WebPhone-specific features.

**Required Change:**
1. Add connectivity provider indicator in console header
2. Add WebPhone call management panel (if provider is "webphone")
3. Display active WebPhone participants
4. Show call quality metrics
5. Add call routing controls

---

### 6. Event Registration - No Connectivity Method Selection

**File:** `client/src/pages/EventRegistration.tsx`

**Current State:**
- Registration form collects: name, email, company, job title, language
- `dialIn` boolean field exists but not connected to WebPhone
- **No connectivity method selection**
- **No WebPhone dial-in number display**

**Issue:** Customers cannot select WebPhone as their connectivity method. No dial-in information provided.

**Required Change:**
1. Display WebPhone as the default connectivity method
2. Show WebPhone dial-in number (from Telnyx)
3. Show SIP URI for direct connection
4. Make other connectivity methods secondary/optional

---

### 7. Shadow Mode - No Connectivity Provider Awareness

**File:** `client/src/pages/ShadowMode.tsx`

**Current State:**
- Shadow Mode displays archived sessions
- **NO indication of which connectivity provider was used**
- **NO WebPhone-specific session handling**
- Export procedures don't capture connectivity provider

**Issue:** Cannot verify that archived sessions used WebPhone. No WebPhone-specific archive handling.

**Required Change:**
1. Store connectivity provider in session archive
2. Display provider in session details
3. Filter sessions by provider (default: WebPhone)
4. Include provider in exports

---

### 8. Email Templates - Connectivity Instructions

**File:** `server/_core/email.ts`

**Current State:**
```typescript
joinMethod?: "phone" | "teams" | "zoom" | "web";
teams: { label: "Microsoft Teams", ... },
zoom: { label: "Zoom", ... },
// WebPhone NOT included
```

**Issue:** Email templates support Teams, Zoom, but not WebPhone. No WebPhone join instructions.

**Required Change:**
1. Add WebPhone to joinMethod enum
2. Create WebPhone email template with dial-in number and SIP URI
3. Make WebPhone the default join method
4. Reorder templates: WebPhone first, others secondary

---

### 9. Backend Routing - No Provider-Based Logic

**File:** `server/routers/liveQa.ts`, `server/routers/sessionStateMachine.ts`

**Current State:**
- No routing logic based on connectivity provider
- No fallback logic if WebPhone fails
- No provider-specific session handling

**Issue:** System doesn't differentiate between providers. No WebPhone-specific backend logic.

**Required Change:**
1. Add provider-aware routing in session procedures
2. Implement WebPhone-first attempt logic
3. Define fallback conditions (when to use other providers)
4. Add provider-specific error handling

---

## Files Requiring Changes

### Priority 1: Core Architecture (Must change first)

1. **drizzle/schema.ts**
   - Add `connectivityProvider` field to `events` table (default: "webphone")
   - Add `connectivityProvider`, `webphoneConnectionId`, `webphoneStatus` to `liveQaSessionMetadata`
   - Create migration

2. **server/routers/liveQa.ts**
   - Update `CreateSessionInput` to include `connectivityProvider` (default: "webphone")
   - Update `createSession` procedure to call `initializeWebphone()`
   - Store WebPhone connection ID in session metadata

3. **server/webphone.ts**
   - Replace mock implementations with real Telnyx API calls
   - Add error handling and retry logic
   - Add connection status tracking

### Priority 2: Backend Integration

4. **server/routers/sessionStateMachine.ts**
   - Add provider-aware session state management
   - Implement WebPhone-first routing
   - Add fallback logic

5. **server/_core/email.ts**
   - Add WebPhone to joinMethod enum
   - Create WebPhone email template
   - Set WebPhone as default

### Priority 3: Frontend Updates

6. **client/src/pages/OperatorConsole.tsx**
   - Add connectivity provider indicator
   - Add WebPhone call management panel
   - Display call quality metrics

7. **client/src/pages/EventRegistration.tsx**
   - Display WebPhone as default connectivity
   - Show dial-in number and SIP URI
   - Make other methods secondary

8. **client/src/pages/ShadowMode.tsx**
   - Store and display connectivity provider
   - Filter sessions by provider
   - Include provider in exports

### Priority 4: Documentation & UI Copy

9. **Documentation files**
   - Update onboarding docs
   - Update support runbooks
   - Update API documentation

---

## Fallback Strategy

### When WebPhone Fails

Define clear conditions for fallback:

1. **WebPhone Connection Failure**
   - Retry 3 times with exponential backoff
   - If still failing after 3 retries, trigger fallback
   - Log failure in audit trail

2. **Fallback Provider Selection**
   - If event has `alternativeProvider` configured, use it
   - Otherwise, prompt operator to select fallback
   - Never silently switch providers

3. **Customer Notification**
   - Notify customers of provider change
   - Provide new dial-in/join instructions
   - Update email with new connection details

4. **Audit Trail**
   - Log all provider changes
   - Record reason for fallback
   - Track fallback frequency

---

## Testing Requirements

### Unit Tests
- [ ] WebPhone initialization with valid credentials
- [ ] WebPhone initialization with invalid credentials
- [ ] Session creation with WebPhone as default
- [ ] Session creation with explicit provider selection
- [ ] Fallback logic triggers correctly

### Integration Tests
- [ ] Create event → defaults to WebPhone
- [ ] Create session → initializes WebPhone
- [ ] Operator console displays WebPhone calls
- [ ] Customer registration shows WebPhone dial-in
- [ ] Shadow Mode archives WebPhone sessions

### End-to-End Tests
- [ ] Internal webcast using WebPhone (full workflow)
- [ ] Customer webcast using WebPhone (full workflow)
- [ ] WebPhone fallback to Teams (if WebPhone fails)
- [ ] Export includes connectivity provider
- [ ] Email templates show WebPhone first

---

## Implementation Order

1. **Phase 1 (Done):** Audit current architecture ✅
2. **Phase 2:** Update database schema and migrations
3. **Phase 3:** Update backend routing and session creation
4. **Phase 4:** Integrate WebPhone into operator console
5. **Phase 5:** Update customer-facing flows
6. **Phase 6:** Update documentation and UI copy
7. **Phase 7:** Implement fallback behavior
8. **Phase 8:** Create and run test suite
9. **Phase 9:** Final verification and deployment

---

## Success Criteria

WebPhone-First implementation is complete when:

- ✅ Events default to WebPhone platform
- ✅ Sessions initialize WebPhone automatically
- ✅ Operator console shows WebPhone call management
- ✅ Customers see WebPhone as default join method
- ✅ Shadow Mode archives WebPhone sessions
- ✅ Fallback logic is defined and tested
- ✅ All documentation reflects WebPhone-first
- ✅ UI copy consistently refers to WebPhone as standard
- ✅ All tests pass (unit, integration, E2E)
- ✅ No chorus.ai branding remains (CuraLive only)

---

## Blockers & Dependencies

### External Dependencies
- Telnyx API credentials (already configured in env)
- SIP connection ID (already configured)

### Internal Dependencies
- Database migration framework (Drizzle)
- tRPC router updates
- React component updates

### No Blockers Identified
All required infrastructure and credentials are already in place.

---

## Estimated Effort

| Phase | Effort | Timeline |
|-------|--------|----------|
| Phase 2: Database & Schema | 2-3 hours | Day 1 |
| Phase 3: Backend Integration | 3-4 hours | Day 1-2 |
| Phase 4: Operator Console | 3-4 hours | Day 2 |
| Phase 5: Customer Flows | 2-3 hours | Day 2-3 |
| Phase 6: Documentation | 2-3 hours | Day 3 |
| Phase 7: Fallback Logic | 2-3 hours | Day 3 |
| Phase 8: Testing | 4-5 hours | Day 4 |
| Phase 9: Verification | 2-3 hours | Day 4 |
| **Total** | **20-28 hours** | **4 days** |

---

## Next Steps

1. Review this audit report
2. Approve implementation plan
3. Begin Phase 2: Database schema updates
4. Create migration files
5. Update backend procedures
6. Update frontend components
7. Run comprehensive test suite
8. Deploy to production

---

**Report Prepared By:** Manus AI Agent  
**Review Status:** Ready for approval  
**Recommended Action:** Proceed to Phase 2 immediately
