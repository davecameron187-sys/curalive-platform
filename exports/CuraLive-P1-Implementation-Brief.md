# CuraLive Platform — P1 Implementation Brief

**Document Type:** Technical Implementation Summary  
**Date:** March 28, 2026  
**Platform:** CuraLive Real-Time Investor Events Intelligence  
**Scope:** P1 Workstreams — Q&A Deduplication, AI Draft Responses, Legal Review, Workflow Shortcuts & Prioritization

---

## Executive Summary

This brief covers the completion of all four P1 workstreams for the CuraLive operator console. These enhancements transform the Live Q&A module from a basic question queue into a full-featured operator triage system with intelligent duplicate detection, AI-assisted response drafting, legal compliance workflows, and operator efficiency tools.

All features have been implemented, tested end-to-end, and validated in the development environment. The system is ready for staging deployment and operator acceptance testing.

---

## 1. Q&A Duplicate Detection

**Problem:** High-volume investor events generate many similar or identical questions from multiple attendees, creating operator fatigue and response inconsistency.

**Solution:** Automated Jaccard word-overlap similarity detection runs on every incoming question.

| Parameter | Value |
|-----------|-------|
| Algorithm | Jaccard word-overlap similarity |
| Threshold | 0.55 (55% word overlap) |
| Scan window | Last 200 questions in session |
| Storage | `duplicate_of_id` column links to original |

**Behavior:**
- Questions exceeding the similarity threshold are automatically classified as `duplicate`
- Duplicate questions have their priority score reduced by 20 points
- Triage reason includes the match percentage and linked original question ID
- Operators can manually link/unlink duplicates via dedicated procedures
- A "Duplicates" filter tab isolates all flagged duplicates for batch review

---

## 2. AI Draft Responses

**Problem:** Operators need to craft responses quickly during live events but lack context from the ongoing discussion.

**Solution:** AI-powered draft generation that incorporates live transcript context.

**How it works:**
- Operator clicks "Generate AI Draft" on any question card
- System pulls the most recent transcript segments from the active session
- GPT-4 generates a contextual draft response with reasoning
- Draft is stored in `ai_draft_text` and `ai_draft_reasoning` database columns
- When an operator expands a question card, any existing draft auto-loads into the response textarea
- Drafts are never auto-sent — the operator must review and submit manually
- If the operator modifies the draft, an "Edited from AI draft" indicator appears

**Safety controls:**
- AI drafts require explicit operator action to generate
- No automatic sending — human review is mandatory
- Edit tracking ensures transparency in the audit trail

---

## 3. Legal Review Workflow

**Problem:** Certain investor questions may touch on material non-public information (MNPI), forward-looking statements, or other legally sensitive areas requiring counsel review before response.

**Solution:** A distinct legal review workflow, separate from the existing "flagged" status.

**Workflow:**
1. Operator identifies a sensitive question and clicks the "Legal" action button
2. A modal prompts the operator to enter a reason for legal review
3. The question status changes to `flagged` and the `legal_review_reason` is stored
4. Legal review items appear in a dedicated filter tab
5. Legal reviewers can approve, modify, or reject the proposed response
6. All legal review actions are logged to the operator audit trail

**Visual treatment:**
- Legal review questions display a red-bordered banner with the review reason
- Distinct from compliance-flagged questions in the UI

---

## 4. Workflow Shortcuts & Prioritization

### Enhanced Filter Bar
10-tab filter system for rapid queue triage:

| Tab | Description |
|-----|-------------|
| All | Complete question queue |
| Unanswered | Questions not yet answered or rejected |
| High Priority | High triage score or compliance risk > 60 |
| Legal Review | Questions pending legal review |
| Duplicates | Detected duplicate questions |
| Approved | Operator-approved questions |
| Answered | Questions with submitted responses |
| Rejected | Rejected questions |
| Flagged | Compliance-flagged questions |
| Sent to Speaker | Questions forwarded to the speaker |

### Sort Controls
Three sort dimensions with toggle order:

| Sort | Description |
|------|-------------|
| Priority | By computed priority score (default) |
| Time | By submission timestamp |
| Compliance | By compliance risk score |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 1–6 | Switch between first 6 filter tabs |
| P | Sort by Priority |
| T | Sort by Time |
| C | Sort by Compliance |
| O | Toggle sort order (ascending/descending) |
| ? | Open keyboard shortcut help panel |

### Bulk Actions
- Checkbox selection on each question card
- "Select All" toggle for the current filtered view
- Bulk approve and bulk reject buttons for batch processing

---

## 5. Export & Handoff Integration

All P1 data is included in session exports and handoff packages:

**Handoff Package** (`getHandoffPackage`):
- Full Q&A questions array with dedup and legal review metadata
- Dedup groups mapping (original question ID → list of duplicate IDs)
- Legal review items list (question ID, text, reason, status)
- Enhanced Q&A summary with question count, duplicate group count, and legal review pending count

**CSV Export:**
- New "Q&A" section rows with question text, submitter, status, classification
- Duplicate and legal review labels in metadata column

**JSON/PDF Export:**
- `qa` object containing `questions`, `dedupGroups`, and `legalReviewItems`

---

## 6. Database Schema Changes

New columns added via startup migration (`ensureLiveQaP1Columns`):

| Column | Table | Type | Purpose |
|--------|-------|------|---------|
| `duplicate_of_id` | `live_qa_questions` | `BIGINT` | Links to original question |
| `legal_review_reason` | `live_qa_questions` | `TEXT` | Stores legal review justification |
| `ai_draft_text` | `live_qa_questions` | `TEXT` | AI-generated draft response |
| `ai_draft_reasoning` | `live_qa_questions` | `TEXT` | AI reasoning for the draft |

---

## 7. New Backend Procedures

| Procedure | Type | Description |
|-----------|------|-------------|
| `setLegalReview` | Mutation | Sets legal review status with reason |
| `getDuplicatesOf` | Query | Returns all duplicates of a given question |
| `linkDuplicate` | Mutation | Manually marks a question as duplicate of another |
| `unlinkDuplicate` | Mutation | Removes duplicate link from a question |
| `generateContextDraft` | Mutation | Generates AI draft with transcript context |
| `bulkAction` | Mutation | Applies approve/reject to multiple questions |

---

## 8. Quality & Testing

| Area | Status |
|------|--------|
| Backend API (submit, filter, sort, dedup) | Verified via API testing |
| Frontend rendering (cards, filters, shortcuts) | Verified via E2E Playwright tests |
| Duplicate detection accuracy | Verified with near-duplicate test data |
| Status counter idempotency | Fixed and verified (no counter inflation) |
| Export data completeness | Verified in CSV/JSON payloads |
| No JavaScript runtime errors | Confirmed via browser console monitoring |

**Bugs fixed during implementation:**
1. `ReferenceError: Cannot access 'questions' before initialization` — variable ordering fix
2. `Date.now()` epoch values auto-converted to Date objects by `rawSql()` — pass as strings for bigint columns
3. Status counter inflation on repeated approve/reject — made transitions idempotent with delta-based counter updates

---

## 9. Files Modified

| File | Changes |
|------|---------|
| `server/routers/liveQaRouter.ts` | Duplicate detection, legal review, AI drafts, enhanced filters/sort, bulk actions, idempotent counters |
| `client/src/components/LiveQaDashboard.tsx` | Filter bar, sort controls, keyboard shortcuts, question card redesign, bulk actions, AI draft UI |
| `server/routers/shadowModeRouter.ts` | Handoff/export integration with Q&A dedup groups and legal review data |
| `server/_core/index.ts` | Startup migration for P1 columns, qaAction enum extension |
| `drizzle/schema.ts` | Schema definitions for new columns |

---

## 10. Deployment Readiness

- All P1 features are backward-compatible — no breaking changes to existing data
- Database migration runs automatically on server startup
- No new environment variables or external dependencies required
- Ready for staging deployment and operator acceptance testing

---

*CuraLive Platform — Confidential*  
*Patent Application ID: 1773575338868*
