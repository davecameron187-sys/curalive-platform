# CuraLive Staging + Operator Acceptance Testing Plan

## Phase Overview
Validate CuraLive in staging environment under realistic operator workflows.

## Test Tracks

### Track A: Normal Live Session
- Open Shadow Mode
- Start a session
- Monitor transcript
- Add/delete notes
- Moderate Q&A
- End session
- Review handoff
- Download exports

**Validation:**
- Transcript updates correctly
- Notes persist
- Action log updates automatically
- Handoff appears for completed/failed sessions
- Exports work
- No confusing workflow breaks
- No hidden/blocked operator states

**Pass Criteria:** One operator can run workflow end-to-end without engineering intervention

---

### Track B: High-Volume Q&A with Deduplication and Legal Review
- Many similar questions
- Duplicates
- Legal review
- Prioritization and shortcuts

**Validation:**
- Similar questions auto-flagged or linked
- Duplicate filter tab works
- Manual link/unlink works
- Dedup does not wrongly collapse unrelated questions
- AI draft responses generated with transcript context
- Drafts clearly labeled as AI-generated
- Drafts not auto-sent
- Edits visible/tracked
- Legal action easy to trigger
- Reason capture works
- Legal review filter works
- Legally flagged questions visually distinct
- Actions appear in audit trail
- Filter tabs work
- Sort modes work
- Keyboard shortcuts work
- Bulk approve/reject works safely

**Pass Criteria:** Operators can handle live Q&A faster and more safely than before

---

### Track C: Post-Event Archive and Transcription Resilience
- Upload archive
- Transcribe
- Retry after failure
- Export and playback

**Validation:**
- Archive upload succeeds
- Gemini primary path works
- Whisper fallback path works when needed
- Quota/provider failures do not destroy archive ingestion
- Retry transcription works
- User sees clean status messages
- No raw provider JSON appears in UI

**Edge Cases:**
- Provider unavailable
- Quota exceeded
- Retry after failure
- Archive saved without completed transcript

**Pass Criteria:** Archive workflow is resilient and understandable to operators

---

### Track D: Webcast/Audio Event with Shadow Mode
- Live video event started/joined
- Attendee experience works
- Shadow Mode sees/manages session
- Transcript/notes/Q&A/action log/handoff work with webcast session
- Audio-only session can run
- Operator can manage in Shadow Mode
- Transcript and archive flows work
- Recording/playback work where applicable

**WebPhone-First Requirement:**
- Webcast/audio sessions default to WebPhone
- Shadow Mode handles WebPhone-based sessions correctly
- Fallback path is secondary only and clearly documented

**Pass Criteria:** Webcast and audio workflows are usable as sellable service offerings

---

### Track E: Failure Handling and Degraded Paths
- Missing transcript
- Missing AI report
- Quota failure
- Reconnect/reload
- Degraded provider path

**Validation:**
- CSV formula injection protection does not break legitimate exports
- Fallback text appears when AI report is missing
- All compliance sections explicit and readable
- System handles provider failures gracefully
- Operators see clear error messages
- Degraded paths are documented

**Pass Criteria:** System is resilient and operators understand failure states

---

## P0 Validation: Playback, Exports, Reporting

### Transcript-Synced Playback
- Recording loads
- Transcript segments clickable
- Clicking transcript seeks playback
- Active segment highlighting works
- Timestamps align with playback

### Exports
- CSV export works
- JSON export works
- PDF export works
- Transcript, notes, action log, AI report, compliance data present
- Filenames correct
- Output usable without cleanup

### Compliance/Reporting
- CSV formula injection protection works
- Fallback text appears when AI report missing
- All compliance sections explicit and readable

**Pass Criteria:** Exported files and playback trustworthy for operational use and customer follow-up

---

## Operator Acceptance Questions

Operators must answer:

1. Can I understand what state the session is in?
2. Can I trust the transcript and playback?
3. Can I handle a busy Q&A queue quickly?
4. Can I tell which questions need legal review?
5. Are AI drafts useful under time pressure?
6. Can I finish the session and get what I need afterward?
7. Would I trust this in a real customer event?

---

## Bug Reporting Format

For every issue found:

- **Title:** Short bug name
- **Area:** Console / Q&A / Playback / Export / Archive / Webcast / Audio / Security / UX
- **Severity:** Critical / High / Medium / Low
- **Expected:** What should happen
- **Actual:** What happened
- **Steps to Reproduce:** Numbered steps
- **Evidence:** Screenshot / video / logs
- **Likely File(s):** If known

---

## Acceptance Gates

Phase complete only when:

- [ ] Core console workflow passes in staging
- [ ] P0 playback/export/reporting passes
- [ ] P1 Q&A workflow passes
- [ ] Archive resilience passes
- [ ] Webcast/audio flow validated for customer planning
- [ ] No critical blocking bugs remain
- [ ] Operator testers sign off workflow is usable

---

## Deliverables

**Manus Returns:**
- Bug fixes applied
- Files changed
- Unresolved blockers
- Workflow decisions made during staging fixes

**Replit Returns:**
- Pass/fail per test track
- Evidence for major workflows
- Operator feedback summary
- Prioritized bug list
- Recommendation: ready / almost ready / not ready
