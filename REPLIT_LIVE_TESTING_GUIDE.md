# Replit Live Testing Guide — Operator Console Phase 3

**Status:** Ready for Replit Integration  
**Branch:** ManusChatgpt  
**Latest Commit:** 7e8434f  
**Tests:** ✅ 29/29 passing

---

## 1. Replit: Pull Latest Changes

```bash
# In Replit terminal
cd ~/curalive-platform
git fetch origin ManusChatgpt
git checkout ManusChatgpt
git pull origin ManusChatgpt
pnpm install
```

**Expected Output:**
```
Switched to branch 'ManusChatgpt'
Your branch is up to date with 'origin/ManusChatgpt'.
```

---

## 2. Verify Console Compiles

```bash
# In Replit
pnpm dev
```

**Expected Output:**
```
✓ client compiled successfully
✓ server running on http://localhost:3000
```

**Check Console:**
- Navigate to http://localhost:3000
- Should see CuraLive home page
- No TypeScript errors in terminal

---

## 3. Create Test Session in Database

```bash
# In Replit terminal (new tab)
cd ~/curalive-platform
pnpm db:push
```

Then use the database UI to create a test session:

```sql
INSERT INTO operator_sessions (
  sessionId, eventId, operatorId, status, 
  startedAt, pausedAt, resumedAt, endedAt, 
  totalPausedDuration, createdAt, updatedAt
) VALUES (
  'test-session-001',
  'test-event-001',
  1,
  'idle',
  NULL, NULL, NULL, NULL,
  0,
  NOW(),
  NOW()
);
```

---

## 4. Test Session Lifecycle

### 4.1 Start Session

**URL:** `http://localhost:3000/operator/test-session-001`

**Expected:**
- Console loads with "test-event-001" in header
- Status shows "idle"
- "Start" button visible
- Timer shows 00:00:00

**Action:** Click "Start" button

**Expected Result:**
- Status changes to "running"
- Live indicator appears (red dot + "LIVE" text)
- Timer starts incrementing
- "Start" button replaced with "Pause" and "End" buttons

---

### 4.2 Pause Session

**Action:** Click "Pause" button after 10 seconds

**Expected Result:**
- Status changes to "paused"
- Live indicator disappears
- Timer stops
- "Pause" button replaced with "Resume" button

---

### 4.3 Resume Session

**Action:** Click "Resume" button

**Expected Result:**
- Status changes to "running"
- Live indicator reappears
- Timer resumes from where it stopped
- "Resume" button replaced with "Pause" and "End" buttons

---

### 4.4 End Session

**Action:** Click "End" button

**Expected Result:**
- Status changes to "ended"
- Live indicator disappears
- Timer stops
- All control buttons disabled
- "Session Ended" message appears

---

## 5. Test Q&A Moderation

### 5.1 Create Test Questions

```sql
INSERT INTO questions (
  sessionId, questionText, submitterName, status,
  upvotes, complianceRiskScore, triageScore, priorityScore,
  isAnswered, questionCategory, createdAt, updatedAt
) VALUES
(
  'test-session-001',
  'What is your guidance for next quarter?',
  'John Analyst',
  'pending',
  5, 0.75, NULL, NULL,
  FALSE, 'guidance', NOW(), NOW()
),
(
  'test-session-001',
  'Can you discuss the new product launch timeline?',
  'Jane Investor',
  'pending',
  3, 0.2, NULL, NULL,
  FALSE, 'product', NOW(), NOW()
),
(
  'test-session-001',
  'What about market expansion plans?',
  'Anonymous',
  'pending',
  8, 0.5, NULL, NULL,
  FALSE, 'strategy', NOW(), NOW()
);
```

### 5.2 Verify Questions Tab

**Expected:**
- Questions tab shows "Questions (3)"
- Three questions listed with upvotes
- Questions with compliance risk > 0.5 show red flag icon
- Questions are clickable

### 5.3 Approve Question

**Action:** Click first question → Click "Approve" button

**Expected Result:**
- Question detail panel opens
- Shows question text, submitter, upvotes, compliance risk
- "Approve" button is clickable
- After clicking: Question disappears from pending list
- Questions count decreases to 2

### 5.4 Reject Question

**Action:** Click second question → Click "Reject" button

**Expected Result:**
- Question detail panel opens
- "Reject" button is clickable
- After clicking: Question disappears from pending list
- Questions count decreases to 1

---

## 6. Test Operator Notes

### 6.1 Add Note

**Action:** Click "Notes" tab → Type note → Click "Add Note"

**Expected Result:**
- Note appears in Notes tab with timestamp
- Input field clears
- Note is persisted to database

### 6.2 Verify Action History

**Action:** Click "Event Log" tab

**Expected Result:**
- Shows all actions in chronological order
- Includes: session start, pause, resume, question approvals, note creation
- Each action shows timestamp

---

## 7. Test Real-Time Updates

### 7.1 Multi-Tab Sync

**Action:** Open console in two browser tabs (same session)

**Expected Result:**
- Changes in Tab 1 appear in Tab 2 within 2 seconds
- Session state syncs across tabs
- Questions list updates in real-time

### 7.2 Reconnection

**Action:** Close browser tab → Reopen → Navigate back to console

**Expected Result:**
- Console loads with current session state
- All actions are preserved
- No data loss

---

## 8. Test Error Handling

### 8.1 Session Not Found

**URL:** `http://localhost:3000/operator/nonexistent-session`

**Expected Result:**
- Error card displayed
- Message: "Session not found"
- "Back to Home" button visible

### 8.2 Invalid Session ID

**URL:** `http://localhost:3000/operator/invalid@#$`

**Expected Result:**
- Either error card or loading state
- No console errors

---

## 9. Performance Checks

### 9.1 Load Time

**Action:** Navigate to console

**Expected:** Page loads in < 2 seconds

### 9.2 Real-Time Updates

**Action:** Watch timer increment

**Expected:** Updates every second without lag

### 9.3 Q&A Moderation

**Action:** Approve/reject questions rapidly

**Expected:** All mutations complete within 1 second

---

## 10. Database Verification

### 10.1 Check Session State

```sql
SELECT * FROM operator_sessions WHERE sessionId = 'test-session-001';
```

**Expected:** All state changes reflected (status, startedAt, pausedAt, etc.)

### 10.2 Check Action History

```sql
SELECT * FROM operator_actions WHERE sessionId = 'test-session-001' ORDER BY createdAt DESC;
```

**Expected:** All actions logged (note_created, question_approved, etc.)

### 10.3 Check Question Status

```sql
SELECT id, questionText, status, triageScore FROM questions WHERE sessionId = 'test-session-001';
```

**Expected:** Status changes reflected (pending → approved/rejected)

---

## 11. Checklist

- [ ] Replit pulls latest changes without conflicts
- [ ] Dev server compiles cleanly
- [ ] Console loads for test session
- [ ] Session starts successfully
- [ ] Session pauses and resumes
- [ ] Session ends properly
- [ ] Questions display correctly
- [ ] Question approval works
- [ ] Question rejection works
- [ ] Notes can be created
- [ ] Action history displays all actions
- [ ] Real-time updates work across tabs
- [ ] Reconnection preserves state
- [ ] Error handling works
- [ ] Database reflects all changes
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance is acceptable

---

## 12. Known Limitations

- Transcript streaming not yet implemented (placeholder only)
- AI insights not yet integrated
- Compliance report generation not yet implemented
- Session recording playback not yet available

---

## 13. Next Steps After Testing

1. **If all tests pass:** Proceed to production deployment
2. **If errors found:** Report in GitHub issue with:
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment info
3. **If performance issues:** Profile and optimize:
   - Query performance
   - Mutation latency
   - Real-time update frequency

---

## 14. Troubleshooting

### Console won't load

```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm dev
```

### Session state not updating

```bash
# Check database connection
pnpm db:push
# Verify session exists in database
```

### Real-time updates not working

```bash
# Check Ably connection
# Verify tRPC refetch intervals are set
# Check browser console for errors
```

### Tests failing

```bash
# Run integration tests
pnpm test -- server/operatorConsole.integration.test.ts

# If database error, push schema
pnpm db:push
```

---

## Contact

For issues or questions, create a GitHub issue on the ManusChatgpt branch with:
- Test step that failed
- Expected vs actual behavior
- Screenshots/videos if applicable
- Browser and OS info
