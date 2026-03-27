# Shadow Mode Sale-Readiness Test Plan

**Date:** 27 March 2026  
**Objective:** Validate Shadow Mode end-to-end functionality across 6 sessions (3 Recall.ai + 3 local-capture)  
**Success Criteria:** All sessions complete successfully with no silent failures

---

## Test Overview

This test plan validates Shadow Mode production readiness through repeated session execution, ensuring consistency and reliability across both capture paths.

### Test Sessions

| Session | Type | Platform | Status | Notes |
|---------|------|----------|--------|-------|
| 1 | Recall.ai | Zoom/Teams | ⏳ Pending | Primary bot path |
| 2 | Recall.ai | Zoom/Teams | ⏳ Pending | Repeated validation |
| 3 | Recall.ai | Zoom/Teams | ⏳ Pending | Consistency check |
| 4 | Local Capture | Browser | ⏳ Pending | Fallback path |
| 5 | Local Capture | Browser | ⏳ Pending | Repeated validation |
| 6 | Local Capture | Browser | ⏳ Pending | Consistency check |

---

## Session Validation Checklist

### Pre-Session Setup

- [ ] Production environment accessible
- [ ] Ably real-time streaming configured
- [ ] Recall.ai webhook configured
- [ ] Database connection verified
- [ ] Operator UI ready

### Session Execution (Per Session)

#### Recall.ai Sessions (1-3)

**Session Start:**
- [ ] Recall.ai bot joins meeting
- [ ] Bot status shows "connected"
- [ ] Webhook verification succeeds
- [ ] Session created in database

**Transcript Capture:**
- [ ] Audio captured from meeting
- [ ] Transcript visible in real-time
- [ ] Ably streaming updates flowing
- [ ] Operator UI shows live updates
- [ ] No message loss observed

**AI Analysis:**
- [ ] AI analysis initiated
- [ ] Report generation started
- [ ] Multi-module analysis complete
- [ ] Report displayed in UI

**Session Completion:**
- [ ] Session marked complete
- [ ] Recording saved
- [ ] Transcript finalized
- [ ] Report finalized
- [ ] Session retrievable from archive

#### Local Capture Sessions (4-6)

**Session Start:**
- [ ] Browser audio capture initialized
- [ ] Microphone access granted
- [ ] Session created in database
- [ ] Local capture path active

**Transcript Capture:**
- [ ] Audio captured from browser
- [ ] Transcript visible in real-time
- [ ] Ably streaming updates flowing
- [ ] Operator UI shows live updates
- [ ] No message loss observed

**AI Analysis:**
- [ ] AI analysis initiated
- [ ] Report generation started
- [ ] Multi-module analysis complete
- [ ] Report displayed in UI

**Session Completion:**
- [ ] Session marked complete
- [ ] Recording saved
- [ ] Transcript finalized
- [ ] Report finalized
- [ ] Session retrievable from archive

---

## Post-Session Validation

### Archive Retrieval

- [ ] Session appears in archive list
- [ ] Session metadata correct
- [ ] Transcript accessible
- [ ] Recording accessible
- [ ] Report accessible

### Data Integrity

- [ ] Transcript content accurate
- [ ] Recording plays correctly
- [ ] Report data complete
- [ ] No data corruption observed
- [ ] Timestamps correct

### Performance

- [ ] Real-time updates <100ms latency
- [ ] No UI freezing
- [ ] No console errors
- [ ] No silent failures
- [ ] Consistent performance across sessions

---

## Success Criteria

**All 6 sessions must:**

1. ✅ Complete successfully without errors
2. ✅ Generate accurate transcripts
3. ✅ Generate complete AI reports
4. ✅ Be retrievable from archive
5. ✅ Show no silent failures
6. ✅ Demonstrate consistent performance

**Operator UI must:**

1. ✅ Receive live transcript updates
2. ✅ Display real-time information
3. ✅ Show accurate session status
4. ✅ Allow archive retrieval
5. ✅ Provide download functionality

---

## Failure Handling

If any session fails:

1. Document the failure mode
2. Check production logs
3. Verify environment configuration
4. Attempt session retry
5. If retry fails, escalate for debugging

---

## Test Execution Log

### Recall.ai Sessions

**Session 1:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

**Session 2:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

**Session 3:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

### Local Capture Sessions

**Session 4:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

**Session 5:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

**Session 6:**
- Start time: [TBD]
- End time: [TBD]
- Status: ⏳ Pending
- Issues: None yet

---

## Test Results Summary

**Overall Status:** ⏳ Pending Execution

**Metrics:**
- Sessions Completed: 0/6
- Success Rate: 0%
- Average Session Duration: [TBD]
- Average Real-Time Latency: [TBD]

**Recommendation:** [TBD - Will be determined after test execution]

---

## Notes

- Each session should run for at least 5 minutes to ensure adequate data capture
- Test during off-peak hours to minimize interference
- Monitor production logs during test execution
- Document any anomalies or unexpected behavior
- Verify database state after each session

---

**Test Plan Status:** Ready for Execution  
**Next Step:** Execute Shadow Mode sale-readiness test suite
