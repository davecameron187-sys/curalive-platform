# Shadow Mode Mismatch Analysis — Live vs Documentation

**Date:** March 28, 2026
**Analysis:** Comparing live product at https://curalive-platform.replit.app/?tab=shadow-mode against SHADOW_MODE_IMPLEMENTATION.md and other docs

---

## Mismatch Summary

| # | Area | Live Product | Documentation | Classification | Recommendation |
|---|------|--------------|----------------|-----------------|-----------------|
| 1 | AI Report Sections | 6 sections visible | "20-module AI report" mentioned | **Doc Wrong** | Update docs to reflect 6 sections |
| 2 | Export Formats | .txt, .json visible | Mentions CSV, PDF, JSON | **Doc Wrong** | Verify all formats, update docs |
| 3 | Notes Panel | Not visible | Documented as feature | **Product Missing** | Add notes panel to UI or remove from docs |
| 4 | Q&A Moderation | Not visible | Documented as feature | **Product Missing** | Add Q&A panel to UI or remove from docs |
| 5 | Action Log | Not visible | Documented as feature | **Product Missing** | Add action log to UI or remove from docs |
| 6 | Handoff Section | Not visible | Documented as feature | **Product Missing** | Add handoff section or remove from docs |
| 7 | Recording Status | Shows "No recording available" | Not clearly documented | **Both OK** | Document recording capture workflow |
| 8 | Transcript Display | Shows 1 segment with timestamp | Documented as feature | **Both OK** | Docs accurate |
| 9 | Metrics Dashboard | 4 cards (segments, sentiment, flags, metrics) | Not specifically documented | **Doc Missing** | Add metrics dashboard to docs |
| 10 | Info Cards | 3 cards at bottom (invisible, real-time, database) | Not documented | **Doc Missing** | Add info cards to docs |
| 11 | Session Selection | Click session to view details | Not clearly documented | **Doc Missing** | Add session selection workflow |
| 12 | Layout Structure | Left sidebar + right detail panel | Not documented | **Doc Missing** | Document layout structure |

---

## Detailed Mismatch Analysis

### MISMATCH #1: AI Report Sections (6 vs 20)

**Live Product Shows:**
- 6 collapsible sections: Executive Summary, Compliance Review, Sentiment Analysis, Key Topics, Risk Factors, Action Items
- All sections have red badge indicators
- Sections are expandable/collapsible

**Documentation States:**
- "20-module AI report" (SHADOW_MODE_IMPLEMENTATION.md line 58)
- "full 20-module AI report runs" (multiple references)

**Classification:** DOC WRONG

**Recommendation:** 
- Update documentation to reflect 6 sections, not 20 modules
- Clarify what each section contains
- Document the red badge indicators and their meaning

---

### MISMATCH #2: Export Formats (.txt, .json vs CSV, PDF, JSON)

**Live Product Shows:**
- Download .txt button
- Download .json button
- Export .txt button
- (No CSV or PDF buttons visible)

**Documentation States:**
- "CSV export" (SHADOW_MODE_IMPLEMENTATION.md line 45)
- "exportSessionAsCSV" procedure documented
- "exportSessionAsJSON" procedure documented
- No mention of .txt export

**Classification:** DOC WRONG (partially)

**Recommendation:**
- Verify if CSV and PDF exports are available but not visible in current view
- If not available, remove from documentation
- Add .txt export to documentation if it's the primary export format
- Clarify export format priority

---

### MISMATCH #3: Notes Panel

**Live Product Shows:**
- No notes panel visible in session detail view
- No notes input area
- No notes display

**Documentation States:**
- "Operator notes from action log" mentioned (SHADOW_MODE_IMPLEMENTATION.md line 26)
- "adds notes" mentioned in workflows

**Classification:** PRODUCT MISSING

**Recommendation:**
- Option A: Add notes panel to Shadow Mode UI
- Option B: Remove notes feature from documentation
- Decision needed: Is notes feature planned but not implemented?

---

### MISMATCH #4: Q&A Moderation Interface

**Live Product Shows:**
- No Q&A moderation interface visible
- No Q&A panel in session detail
- No question approval/rejection controls

**Documentation States:**
- "moderates Q&A" mentioned in workflows
- "Q&A questions with submitter info" in getSessionDetails output
- "Live Q&A" tab exists in navigation

**Classification:** PRODUCT MISSING (in Shadow Mode)

**Recommendation:**
- Clarify if Q&A moderation is in "Live Q&A" tab, not Shadow Mode
- If Q&A belongs in Shadow Mode, add to UI
- If Q&A is separate feature, update docs to clarify separation

---

### MISMATCH #5: Action Log

**Live Product Shows:**
- No action log visible in session detail
- No operator actions display
- No audit trail visible

**Documentation States:**
- "Operator action log" mentioned (SHADOW_MODE_IMPLEMENTATION.md line 26)
- "Operator actions and audit trail" mentioned (line 58)
- "operatorActions" table referenced

**Classification:** PRODUCT MISSING

**Recommendation:**
- Option A: Add action log panel to Shadow Mode UI
- Option B: Remove action log from documentation
- Decision needed: Is action log feature planned but not implemented?

---

### MISMATCH #6: Handoff/Summary Section

**Live Product Shows:**
- No handoff section visible
- No summary section visible
- No post-session workflow display

**Documentation States:**
- "accesses handoff / summary / exports / downloads" mentioned in brief
- "Handoff workflow" mentioned in requirements

**Classification:** PRODUCT MISSING

**Recommendation:**
- Option A: Add handoff/summary section to Shadow Mode UI
- Option B: Remove from documentation
- Decision needed: Is this feature planned?

---

### MATCH #7: Event Recording Section

**Live Product Shows:**
- "Event Recording" section with status
- Shows "No recording available" message
- Suggests "Start Loom Audio Capture before the session"

**Documentation States:**
- Recording mentioned but workflow not clearly documented

**Classification:** BOTH OK (but docs could be clearer)

**Recommendation:**
- Document recording capture workflow more clearly
- Explain when recordings are available vs unavailable
- Document Loom Audio Capture integration

---

### MATCH #8: Transcript Display

**Live Product Shows:**
- "Live Transcript" section
- Shows timestamped segments (14:38)
- Shows speaker identification (Call Audio)
- Shows full transcript text

**Documentation States:**
- Transcript mentioned as part of session data
- Transcription services mentioned

**Classification:** BOTH OK

**Recommendation:**
- Docs are accurate
- Could add more detail about transcript format and timestamps

---

### MISSING #9: Metrics Dashboard

**Live Product Shows:**
- 4-card metrics dashboard:
  - Transcript Segments (1)
  - Avg Sentiment (0)
  - Compliance Flags (0)
  - Metrics Generated (3)

**Documentation States:**
- Not specifically documented
- No mention of metrics dashboard

**Classification:** DOC MISSING

**Recommendation:**
- Add metrics dashboard section to documentation
- Explain what each metric represents
- Document how metrics are calculated

---

### MISSING #10: Info Cards

**Live Product Shows:**
- 3 info cards at bottom:
  1. "Invisible to clients" — Bot joins as standard participant
  2. "Real-time analysis" — Sentiment and compliance scoring
  3. "Database compounds" — Building investor profiles

**Documentation States:**
- Not documented

**Classification:** DOC MISSING

**Recommendation:**
- Add info cards section to documentation
- Explain purpose of each card
- Document when/how cards are displayed

---

### MISSING #11: Session Selection Workflow

**Live Product Shows:**
- Click session in left sidebar to view details
- Right panel updates with session information
- Can switch sessions without closing detail view
- Session list remains visible

**Documentation States:**
- Not clearly documented
- No mention of left sidebar + right panel layout

**Classification:** DOC MISSING

**Recommendation:**
- Add session selection workflow to documentation
- Document left sidebar + right panel interaction pattern
- Explain how to switch between sessions

---

### MISSING #12: Layout Structure

**Live Product Shows:**
- Left column: Session list (persistent)
- Right column: Session detail (dynamic)
- Top: Input methods (always visible)
- Bottom: Info cards
- Session list scrolls independently from detail view

**Documentation States:**
- Not documented

**Classification:** DOC MISSING

**Recommendation:**
- Add layout structure section to documentation
- Document column layout and responsiveness
- Explain persistent vs dynamic sections

---

## Classification Summary

| Classification | Count | Items |
|---|---|---|
| **Doc Wrong** | 2 | AI sections (6 vs 20), Export formats |
| **Product Missing** | 4 | Notes panel, Q&A moderation, Action log, Handoff section |
| **Both OK** | 2 | Recording section, Transcript display |
| **Doc Missing** | 4 | Metrics dashboard, Info cards, Session selection, Layout structure |
| **Total Mismatches** | 12 | |

---

## Recommendations by Priority

### HIGH PRIORITY (Affects Operator Workflow)

1. **Clarify AI Report Sections** — Update from "20 modules" to "6 sections"
2. **Clarify Export Formats** — Verify CSV/PDF availability or remove from docs
3. **Decide on Missing Features** — Notes, Q&A, Action Log, Handoff
   - Are these planned but not implemented?
   - Should they be removed from documentation?
   - Should they be added to product?

### MEDIUM PRIORITY (Improves Documentation Accuracy)

4. **Document Metrics Dashboard** — Add section explaining 4 metrics
5. **Document Info Cards** — Add section explaining 3 cards
6. **Document Session Selection** — Add workflow section
7. **Document Layout Structure** — Add layout section

### LOW PRIORITY (Nice to Have)

8. **Clarify Recording Workflow** — Document Loom Audio Capture integration
9. **Add Screenshots** — Include annotated screenshots in documentation

---

## Decision Matrix

| Mismatch | Option A | Option B | Recommended |
|---|---|---|---|
| Notes Panel | Add to UI | Remove from docs | **DECISION NEEDED** |
| Q&A Moderation | Add to Shadow Mode | Move to Live Q&A tab | **DECISION NEEDED** |
| Action Log | Add to UI | Remove from docs | **DECISION NEEDED** |
| Handoff Section | Add to UI | Remove from docs | **DECISION NEEDED** |
| AI Sections | Update docs to 6 | Change product to 20 | **Update Docs** |
| Export Formats | Add CSV/PDF to UI | Remove from docs | **DECISION NEEDED** |

---

## Next Steps

1. **Clarify Product Decisions** — Determine if missing features should be added or removed
2. **Update Documentation** — Reflect actual product behavior
3. **Create Aligned Operating Model** — Single source of truth document
4. **Prepare for Replit Validation** — Ensure Replit tests against aligned model

