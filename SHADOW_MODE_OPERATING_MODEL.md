# Shadow Mode Operating Model — Single Source of Truth

**Version:** 1.0 — Live Product Aligned
**Date:** March 28, 2026
**Status:** Matches live product at https://curalive-platform.replit.app/?tab=shadow-mode
**Audience:** Operators, Replit team, documentation reference

---

## What is Shadow Mode?

Shadow Mode is the archive and post-event analysis interface in CuraLive. It allows operators to review completed sessions, view AI-generated intelligence reports, access transcripts, and download session data in multiple formats.

**Key Principle:** Shadow Mode is for reviewing past events, not managing live sessions. Live sessions are managed in the "Live Intelligence" tab.

---

## Accessing Shadow Mode

1. Log in to CuraLive Operator Console
2. Click **Shadow Mode** tab in left navigation
3. View list of completed sessions (7 sessions visible in current example)
4. Click any session to view full details

---

## Shadow Mode Layout

### Left Column: Session List (Persistent)

The left column displays all completed sessions and remains visible while viewing session details. Each session card shows:

- **Session Name** — Title of the session (e.g., "Demo 5")
- **Status Badge** — Purple "Completed" badge
- **Event Type** — Category (e.g., "Earnings Call")
- **Company/Source** — Organization name (e.g., "Other", "Chorus Call")
- **Metrics Count** — Number of metrics generated (e.g., "3 metrics")

**Actions:**
- Click any session to view details in right column
- Scroll to see more sessions
- Select multiple sessions with checkboxes for bulk operations (if available)

### Right Column: Session Detail (Dynamic)

The right column displays detailed information for the selected session. Content updates when you click a different session.

---

## Session Detail View

### Section 1: Session Header

Displays session metadata at the top of the detail panel:

- **Session Name** — "Demo 5"
- **Status** — Purple "Completed" badge
- **Event Type** — "Earnings Call"
- **Company** — "Other"
- **Duration** — "477m elapsed"

### Section 2: Metrics Dashboard (4 Cards)

Four key metrics are displayed as cards:

1. **Transcript Segments** — Number of transcript segments captured (e.g., 1)
2. **Avg Sentiment** — Average sentiment score (e.g., 0 = neutral)
3. **Compliance Flags** — Number of compliance issues flagged (e.g., 0)
4. **Metrics Generated** — Total metrics created (e.g., 3)

**Status Message:** "Intelligence collection complete — 3 records added to your Tagged Metrics database."

### Section 3: AI Intelligence Report (6 Sections)

The AI Intelligence Report contains 6 collapsible sections. Each section has a red badge indicator. Click to expand and view content:

1. **Executive Summary** — High-level overview of the session
2. **Compliance Review** — Compliance findings and risk assessment
3. **Sentiment Analysis** — Sentiment trends and scores
4. **Key Topics** — Main topics discussed
5. **Risk Factors** — Identified risks or concerns
6. **Action Items** — Recommended actions

**Current Status:** All sections are collapsed by default. Click to expand and view detailed analysis.

### Section 4: Event Recording

Displays recording status and availability:

- **Title:** "Event Recording"
- **Status:** "No recording available" (if not captured)
- **Message:** "Start Loom Audio Capture before the session to record the event."

**Note:** Recordings must be captured during the live session. If no recording was started, this section shows "No recording available."

### Section 5: Live Transcript

Displays the session transcript with timestamps:

- **Title:** "Live Transcript"
- **Segment Count:** Number of segments (e.g., "1 segment")
- **Format:** Timestamp + Speaker + Text

**Example:**
```
14:38 Call Audio
"While trying to defend himself. Watch General Sibiya swear on his life that there is no Truth to Mokwanazi accusing him of being a criminal in bed with syndicates. Dlamini, play it."
```

**Features:**
- Timestamps for each segment
- Speaker identification
- Full transcript text
- Segment counter

### Section 6: Download/Export Controls

Three download/export options are available:

1. **Download .txt** — Download transcript as plain text file
2. **Download .json** — Download session data as JSON file
3. **Export .txt** — Alternative text export option

**Note:** CSV and PDF exports are not currently visible in the UI. Contact support if you need additional export formats.

### Section 7: Info Cards (Bottom)

Three informational cards appear at the bottom of the session detail:

#### Card 1: Invisible to Clients
- **Message:** "The bot joins as 'CuraLive Intelligence' — a standard named participant. Your clients see a normal event with a regular participant name."
- **Purpose:** Explains that the AI bot is invisible to meeting participants

#### Card 2: Real-time Analysis
- **Message:** "Sentiment scored every 5 transcript segments. Compliance keywords flagged automatically. All data flows into your database."
- **Purpose:** Explains how analysis is performed

#### Card 3: Database Compounds
- **Message:** "Every session adds structured intelligence records. After 10 events, you have baselines. After 50, you have investor profiles."
- **Purpose:** Explains data accumulation over time

---

## How to Use Shadow Mode: Step-by-Step

### Step 1: Open Shadow Mode
1. Click "Shadow Mode" tab in left navigation
2. View list of completed sessions

### Step 2: Select a Session
1. Click on any session card in the left column
2. Right column updates with session details
3. Session remains selected until you click a different session

### Step 3: Review Metrics
1. Look at 4-card metrics dashboard
2. Check status message for confirmation
3. Note the number of metrics generated

### Step 4: Review AI Analysis
1. Scroll to "AI Intelligence Report" section
2. Click any section header to expand (Executive Summary, Compliance Review, etc.)
3. Read the analysis content
4. Click again to collapse

### Step 5: Check Recording
1. Scroll to "Event Recording" section
2. If recording is available, you can play or download it
3. If not available, note the message about Loom Audio Capture

### Step 6: Review Transcript
1. Scroll to "Live Transcript" section
2. Read the timestamped transcript segments
3. Note speaker identification and timing

### Step 7: Download/Export Data
1. Scroll to download/export buttons
2. Click "Download .txt" for text transcript
3. Click "Download .json" for structured data
4. Click "Export .txt" for alternative text export
5. Files download to your computer

### Step 8: Switch to Another Session
1. Click a different session in the left column
2. Right column updates with new session details
3. Repeat steps 3-7 for the new session

---

## What Shadow Mode Does NOT Include

The following features are **not** currently available in Shadow Mode:

- **Notes Panel** — Cannot add or view operator notes
- **Q&A Moderation** — Q&A management is in "Live Q&A" tab, not Shadow Mode
- **Action Log** — Operator action history is not displayed
- **Handoff Workflow** — Post-session handoff is not visible
- **Playback Controls** — Cannot play back the session
- **CSV Export** — Only .txt and .json exports available
- **PDF Export** — PDF download not currently available

---

## WebPhone-First Behavior in Shadow Mode

Shadow Mode displays sessions created with WebPhone as the default connectivity method. When reviewing a session:

- **Connectivity Method** — Sessions use WebPhone by default (no call charges)
- **Fallback Provider** — If WebPhone failed, the session may have used Teams, Zoom, or another provider
- **Participant Details** — The AI bot joins as "CuraLive Intelligence" (invisible to clients)

**Note:** Specific provider information is not displayed in Shadow Mode. Check session metadata or contact support for provider details.

---

## Webcast and Audio-Only Sessions in Shadow Mode

Shadow Mode supports all session types:

- **Standard Sessions** — Normal video/audio meetings
- **Webcast Sessions** — One-way broadcast events
- **Audio-Only Sessions** — Phone or audio-only meetings

All session types display the same Shadow Mode interface (metrics, AI report, transcript, recording status).

---

## Error Handling

### If Recording is Missing
- **Message:** "No recording available"
- **Action:** Start Loom Audio Capture before the next session
- **Note:** Transcripts are still available even if recording is missing

### If AI Report is Missing
- **Status:** Report sections may be empty or show "Processing"
- **Action:** Wait for AI analysis to complete or contact support

### If Transcript is Missing
- **Status:** Transcript section may be empty
- **Action:** Check if session was recorded properly or contact support

### If Download Fails
- **Action:** Try a different export format (.txt vs .json)
- **Note:** Contact support if all formats fail

---

## Compliance and Archive Behavior

### Compliance Flags
- Displayed in metrics dashboard (Compliance Flags count)
- Detailed in "Compliance Review" section of AI report
- Automatically flagged based on keywords and risk assessment

### Archive Processing
- Sessions appear in Shadow Mode after completion
- AI analysis runs automatically
- Processing status shown in metrics dashboard
- Records added to Tagged Metrics database

### Retention
- Sessions remain in archive indefinitely (unless deleted)
- All exports preserve compliance and metadata
- Database records compound over time

---

## Export and Download Locations

### Where to Find Exports

**Transcript Export (.txt):**
- Click "Download .txt" button
- File downloads to your Downloads folder
- Filename: `session-[sessionId].txt`

**Data Export (.json):**
- Click "Download .json" button
- File downloads to your Downloads folder
- Filename: `session-[sessionId].json`

**Alternative Text Export (.txt):**
- Click "Export .txt" button
- File downloads to your Downloads folder
- Filename: `session-[sessionId]-export.txt`

### What Each Export Contains

**Text Export (.txt):**
- Session metadata (name, date, duration)
- Full transcript with timestamps
- Speaker identification

**JSON Export (.json):**
- Complete session data structure
- Metadata, transcript, metrics
- AI analysis results
- Compliance flags
- Structured for programmatic access

---

## Operator Workflow Summary

| Step | Action | Location | Result |
|------|--------|----------|--------|
| 1 | Open Shadow Mode | Left navigation | View session list |
| 2 | Select session | Left column | Load session details |
| 3 | Review metrics | Right column top | See 4 key metrics |
| 4 | Read AI analysis | Right column middle | Expand 6 report sections |
| 5 | Check recording | Right column | See recording status |
| 6 | Read transcript | Right column | View timestamped text |
| 7 | Download data | Right column bottom | Get .txt or .json file |
| 8 | Switch session | Left column | Repeat for new session |

---

## Key Differences from Other Tabs

| Feature | Shadow Mode | Live Intelligence | Live Q&A | AI Dashboard |
|---------|-------------|-------------------|----------|--------------|
| **Purpose** | Review past sessions | Manage live sessions | Moderate Q&A | Run AI services |
| **Session Status** | Completed | Active/Live | Active/Live | Any status |
| **Transcript** | Historical | Real-time | Real-time | On-demand |
| **Exports** | .txt, .json | Not available | Not available | Service outputs |
| **Editing** | View only | Full control | Moderation | Service control |

---

## Support & Troubleshooting

**Question:** Why is my recording not available?
**Answer:** Loom Audio Capture must be started before the session begins. Check the "Event Recording" section for instructions.

**Question:** How do I get a CSV export?
**Answer:** CSV exports are not currently available. Use .json export and convert to CSV if needed.

**Question:** Can I edit the transcript?
**Answer:** No, Shadow Mode is view-only. Transcripts are read-only records.

**Question:** How long are sessions kept?
**Answer:** Sessions remain in the archive indefinitely unless deleted. Contact support for retention policies.

**Question:** What if the AI report is incomplete?
**Answer:** AI analysis may still be processing. Refresh the page or contact support if processing is delayed.

---

## Definition of Done

This operating model is complete when:

✅ It matches the live Shadow Mode UI exactly
✅ It describes the actual operator journey
✅ Download/export/archive behavior is clearly documented
✅ AI service behavior is clearly documented
✅ WebPhone-first behavior is clearly documented
✅ All mismatches with previous documentation are resolved
✅ Manus and Replit are working from the same aligned model

