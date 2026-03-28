# Shadow Mode Live UI Audit — March 28, 2026

**Source:** https://curalive-platform.replit.app/?tab=shadow-mode
**Status:** Live, Operator Console Active
**Operator:** Dev Operator (logged in)

---

## Current Live Shadow Mode UI Structure

### Top Navigation Bar
- **Logo:** CuraLive
- **Title:** Operator Console
- **Subtitle:** REAL-TIME INVESTOR EVENT INTELLIGENCE
- **User:** Dev Operator (top right)
- **Sign Out Button:** Available

### Main Navigation Tabs (Left Sidebar)
1. **Overview** — Main dashboard
2. **Shadow Mode** — Archive/completed sessions (CURRENTLY SELECTED)
3. **Events** — Event management
4. **Partners** — Partner management
5. **Billing** — Billing/subscription
6. **Settings** — Configuration

### Secondary Navigation (Under Main Tabs)
- **Live Intelligence** — Active sessions
- **Archive Upload** — Upload recordings (shows "50" badge)
- **Archives & Reports** — Archived sessions (shows "50" badge)
- **AI Dashboard** — AI service management
- **AI Learning** — AI model training
- **AI Advisory** — AI recommendations
- **Live Q&A** — Q&A management
- **System Test** — System testing tools

### Shadow Mode Content Area

#### Three Input Methods (Top Section)
1. **Join Live Event**
   - "Free — no call charges"
   - Action: "Paste a Zoom, Teams, or Meet link"
   - Functionality: "AI bot joins silently, transcribes in real time"
   - Button: "Start a new live session"

2. **Upload Recording**
   - "Audio or video file"
   - Supported formats: MP3, WAV, M4A, MP4, MOV
   - Functionality: "Whisper AI transcribes, then full 20-module AI report runs"
   - Button: "Upload a recording"

3. **Paste Transcript**
   - "Text or .txt file"
   - Functionality: "Runs sentiment analysis, compliance scanning, full AI report"
   - Button: "Submit a transcript"

#### Sessions List (Bottom Section)
- **Status Filter:** "COMPLETED (7)" — Shows 7 completed sessions
- **Select All Checkbox:** Available for bulk operations
- **Session Cards:** Each shows:
  - Session name
  - Status badge (purple "Completed")
  - Event type (e.g., "Earnings Call")
  - Company/source (e.g., "Other", "Chorus Call")
  - Metrics count (e.g., "3 metrics")

#### Visible Sessions (7 total)
1. Demo 5 — Earnings Call · Other · 3 metrics
2. Audio Demo 4 — Earnings Call · Other · 3 metrics
3. Results Test — Earnings Call · Chorus Call · 3 metrics
4. Results Presentation — Earnings Call · Chorus Call
5. Audio Demo 4 — Earnings Call · Other · 3 metrics
6. Audio Demo 3 — Earnings Call · Other · 3 metrics
7. Audio Demo 32 — Earnings Call · Other

#### Right Panel (Empty State)
- Message: "Select a session to view live intelligence"
- Subtext: "Or start a new session to begin collecting data"
- (No session currently selected)

#### Bottom Info Section
- **Invisible to clients:** "The bot joins as 'CuraLive Intelligence' — a standard named participant"
- **Real-time analysis:** "Sentiment scored every 5 transcript segments. Compliance keywords flagged automatically"
- **Database compounds:** "After 10 events, you have baselines. After 50, you have investor profiles"

---

## Key Observations

### What IS Present in Live UI
✅ Shadow Mode tab accessible
✅ Session list with 7 completed sessions
✅ Three input methods (Join Live, Upload Recording, Paste Transcript)
✅ Session status indicators (Completed)
✅ Event type classification
✅ Metrics display
✅ Select all checkbox for bulk operations
✅ Right panel for session details (currently empty)
✅ Navigation to other modules (AI Dashboard, Archives & Reports, etc.)

### What IS NOT Visible Yet
❌ Session detail view (no session selected)
❌ Transcript display
❌ Notes panel
❌ Q&A moderation interface
❌ Action log
❌ Handoff/summary section
❌ Export controls (CSV, JSON, PDF)
❌ AI service status indicators
❌ Archive processing status
❌ Playback controls

---

## Next Steps for Full Audit

1. **Click a session** to view detail panel
2. **Document transcript display** area
3. **Document notes panel** layout
4. **Document Q&A moderation** interface
5. **Document action log** display
6. **Document handoff/summary** section
7. **Document export controls** (CSV, JSON, PDF)
8. **Document AI service indicators** (Whisper, Recall, etc.)
9. **Document archive processing** status display
10. **Screenshot each section** for documentation

---

## Current Status

**Phase 1 Progress:** 40% — Initial UI structure documented
**Next Action:** Click a session to view full detail panel and workflow

