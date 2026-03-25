---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: Post-Event AI Report
Route(s): /post-event/:eventId, /post-event/:eventId/transcript
Priority: high
Depends on: AI Transcription (partial — Forge AI live, Whisper partial), Recall.ai Bot Recording (implemented), Mux Live Streaming (implemented), Ably Real-Time Channels (implemented)
What to build:
- Create a /post-event/:eventId page with a tabbed layout (Executive Summary, Key Moments, Sentiment Timeline, Q&A Log, Engagement Metrics, Compliance Flags, Full Transcript, Replay) that displays a structured AI-generated report after an event ends
- Add a server-side tRPC mutation (reports.generateReport) that assembles transcript + Q&A + sentiment data, calls invokeLLM with json_schema response_format to produce executive_summary, key_themes, action_items, and speaker_highlights, then stores results in the database; poll status via reports.getReportStatus every 3 seconds until ready
- Add PDF export that generates a branded CuraLive PDF server-side (using reportlab or weasyprint), uploads it to S3 via storagePut, and returns a download URL from reports.exportPdf
DB changes needed: yes — add post_event_reports table (id, event_id FK unique, generated_at timestamp nullable, status enum[pending/generating/ready/failed], executive_summary text nullable, key_themes JSON nullable, action_items JSON nullable, sentiment_data JSON nullable, word_count int nullable, speaker_highlights JSON nullable, compliance_flags JSON nullable, pdf_url text nullable, error_message text nullable, created_at, updated_at); add report_key_moments table (id, report_id FK, timestamp_seconds int, moment_type enum[question/highlight/sentiment_shift/action_item/compliance_flag], content text, speaker varchar nullable, severity enum[low/medium/high] nullable, created_at)
New tRPC procedures: yes — reports.generateReport (mutation, protected), reports.getReport (query, protected), reports.getReportStatus (query, protected), reports.exportPdf (mutation, protected), reports.listEventReports (query, protected)
New pages/routes: yes — /post-event/:eventId (tabbed report viewer), /post-event/:eventId/transcript (full transcript with search and speaker filter)
---

# Post-Event AI Report — Full Specification

## 1. Overview

The Post-Event AI Report is the primary deliverable CuraLive produces for every completed event. It transforms the raw data captured during an event — transcription, Q&A submissions, sentiment scores, attendance metrics, and engagement signals — into a structured, professional document that investor relations teams, communications directors, and event operators can share with stakeholders immediately after the event ends.

This feature closes the loop on the CuraLive event lifecycle. Every other feature (Recall.ai bot recording, Mux streaming, Ably real-time channels, AI transcription, Q&A management) feeds data into this report. The report is the primary deliverable the client pays for, and its quality directly determines renewal and expansion revenue.

---

## 2. Report Page Structure

The report is accessible at `/post-event/:eventId` immediately after the event ends. The page uses a tabbed layout with eight tabs.

### Tab Overview

| Tab | Content |
|---|---|
| **Executive Summary** | AI-generated narrative, 4 stat cards, key themes, action items |
| **Key Moments** | Vertical timeline of flagged moments with timestamps |
| **Sentiment Timeline** | Line chart over event duration with annotations |
| **Q&A Log** | Full list of all questions, votes, answers |
| **Engagement Metrics** | Attendee count chart, participation rates, drop-off points |
| **Compliance Flags** | JSE/IFRS material statement and forward-looking statement flags |
| **Full Transcript** | Searchable, speaker-labelled, timestamp-linked transcript |
| **Replay** | Embedded Mux player synced to transcript |

### Executive Summary Tab

The summary tab is the default landing view. It renders:

- **4 stat cards** at the top: Total Attendees, Questions Submitted, Overall Sentiment Score (0–100), Event Duration
- **AI-generated executive summary** — 3–5 paragraphs of professional prose covering what was discussed, key announcements, audience reception, and notable moments. Written in third-person, suitable for board distribution.
- **Key Themes** — 4–6 topic cards, each with a label, a 1–2 sentence description, and the timestamp when the theme first emerged
- **Action Items** — Numbered list of commitments extracted from the transcript (e.g. "CFO to follow up on Q3 guidance by end of month")
- **Speaker Highlights** — Per-speaker cards showing talk time percentage, sentiment during their segments, and 2–3 notable quotes

### Key Moments Tab

A vertical timeline showing significant events in chronological order. Each entry includes:

- Timestamp (clickable — links to that position in the Replay tab)
- Moment type icon: question mark (Q&A), star (highlight), arrow (sentiment shift), checkmark (action item), warning (compliance flag)
- One-sentence description of the moment
- Speaker name if applicable

### Sentiment Timeline Tab

A Chart.js line chart showing audience sentiment score (0–100) over the event duration, bucketed into 1-minute intervals. Annotations mark significant shifts (changes of more than 15 points within 60 seconds). Below the chart: per-speaker sentiment breakdown table and topic-level sentiment summary.

### Q&A Log Tab

A searchable, filterable list of all questions submitted during the event. Each question card shows:

- Question text
- Submitter (anonymised unless they opted in)
- Upvote count
- Category badge (Financial, Strategy, Operations, Other)
- Answered status (Yes / No)
- Answer text if recorded by the operator

Aggregate stats at the top: total submitted, total answered, average response time, top category.

### Engagement Metrics Tab

- Line chart: attendee count over time (join/leave events plotted)
- Stat cards: peak concurrent, average session duration, Q&A participation rate, poll response rate (if polls used)
- Drop-off analysis: table showing the top 3 timestamps where attendee count dropped by more than 5%

### Compliance Flags Tab

For events flagged as compliance-relevant (earnings calls, investor days), the AI scans the transcript for:

- **Material statements** — price-sensitive information
- **Forward-looking statements** — projections, guidance, targets
- **Regulatory risk language** — language that may require JSE or IFRS disclosure

Each flag is displayed as a table row: Timestamp | Transcript Excerpt | Flag Type | Severity (Low / Medium / High). Clicking a row highlights the corresponding line in the Full Transcript tab.

### Full Transcript Tab

The complete verbatim transcript with:

- Speaker labels on each paragraph (from Whisper diarisation where available)
- Timestamps on every paragraph (clickable — seeks the Replay player)
- Inline colour coding: yellow background for key moments, red background for compliance flags
- Search bar to find specific words or phrases
- Speaker filter dropdown to show only selected speakers
- "Copy to Clipboard" button for selected sections

### Replay Tab

Embedded Mux video player with transcript sync. Clicking a transcript line seeks the video to that timestamp. If no recording is available, displays a message indicating the event was not recorded and offers a transcript-only view.

---

## 3. Report Generation Flow

### 3.1 Trigger

Report generation is triggered in one of three ways:

1. **Automatic** — When the operator clicks "End Event" in the OCC, the system automatically queues report generation. Status is set to `pending`.
2. **Manual** — From the post-event page, any authorised user can click "Generate Report" if generation has not yet started.
3. **Scheduled fallback** — A server-side job checks every 5 minutes for events that ended more than 5 minutes ago with no report and triggers generation automatically.

### 3.2 Generation Pipeline (server-side, async)

**Step 1 — Data Assembly.** Fetch all event data: transcript segments, Q&A submissions and answers, sentiment scores, attendance logs, event metadata (title, date, platform, speakers, duration).

**Step 2 — Transcript Assembly.** Merge transcript segments in chronological order, resolve speaker identification conflicts, format timestamps. If Whisper data is incomplete, fall back to Forge AI transcript.

**Step 3 — LLM Summary Generation.** Call `invokeLLM` with the assembled transcript and event metadata. Use `response_format: json_schema` requesting:

```json
{
  "executive_summary": "string",
  "key_themes": [{ "label": "string", "description": "string", "first_mentioned_at_seconds": "integer" }],
  "action_items": ["string"],
  "speaker_highlights": [{ "speaker_name": "string", "talk_time_percent": "number", "notable_quotes": ["string"], "sentiment_summary": "string" }]
}
```

For events longer than 2 hours, chunk the transcript into 30-minute segments, process each independently, then merge results.

**Step 4 — Key Moments Extraction.** Scan transcript for: questions with 5 or more votes, sentiment changes of more than 15 points in 60 seconds, timestamps where action items were stated. Store each as a row in `report_key_moments`.

**Step 5 — Sentiment Timeline Construction.** Aggregate per-segment sentiment scores into 1-minute buckets, producing a time-series array for Chart.js.

**Step 6 — Compliance Scan.** Call `invokeLLM` with a compliance-focused prompt identifying material statements, forward-looking statements, and regulatory risk language. Reference JSE Listings Requirements and IFRS disclosure standards. Use `json_schema` output for consistent flag formatting.

**Step 7 — Persistence.** Write all generated data to `post_event_reports`. Update status to `ready`. Send notification to event operator via `notifyOwner`.

**Step 8 — PDF Generation.** Generate a branded PDF server-side (reportlab or weasyprint). Upload to S3 via `storagePut`. Save URL to `post_event_reports.pdf_url`.

### 3.3 Status Polling

While status is `generating`, the frontend polls `reports.getReportStatus` every 3 seconds. The page shows a progress indicator with the current step:

`Assembling data → Generating AI summary → Building timeline → Compliance scan → Exporting PDF → Ready`

Once status is `ready`, the page auto-refreshes to show the full report without a manual reload.

---

## 4. PDF Export

The PDF is generated server-side for consistent formatting across all browsers and devices.

**PDF Structure:**

1. Cover page — CuraLive logo, event title, date, client company name
2. Executive Summary — full AI-generated narrative
3. Key Themes — 2-column card grid
4. Sentiment Timeline — chart rendered server-side as image
5. Q&A Log — table: question | votes | answered | answer text
6. Action Items — numbered list
7. Speaker Highlights — per-speaker section with quote callouts
8. Compliance Flags — table: timestamp | excerpt | flag type | severity
9. Full Transcript — paginated, with timestamps and speaker labels
10. Back page — CuraLive branding, event metadata, generation timestamp

The PDF is stored in S3 and the URL is returned to the frontend for direct download. The PDF URL is also included in the post-event notification email.

---

## 5. Database Schema

### `post_event_reports`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences, unique | One report per event |
| `generated_at` | timestamp, nullable | Set when status = ready |
| `status` | enum: pending, generating, ready, failed | |
| `executive_summary` | text, nullable | AI-generated narrative |
| `key_themes` | JSON, nullable | Array of theme objects |
| `action_items` | JSON, nullable | Array of strings |
| `sentiment_data` | JSON, nullable | Time-series array for chart |
| `word_count` | int, nullable | Total transcript word count |
| `speaker_highlights` | JSON, nullable | Per-speaker breakdown |
| `compliance_flags` | JSON, nullable | Array of flag objects |
| `pdf_url` | text, nullable | S3 URL of generated PDF |
| `error_message` | text, nullable | Set if status = failed |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `report_key_moments`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `report_id` | int, FK post_event_reports | |
| `timestamp_seconds` | int | Position in event recording |
| `moment_type` | enum: question, highlight, sentiment_shift, action_item, compliance_flag | |
| `content` | text | Description of the moment |
| `speaker` | varchar(255), nullable | Speaker name if known |
| `severity` | enum: low, medium, high, nullable | For compliance flags only |
| `created_at` | timestamp | |

---

## 6. tRPC Procedures

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `reports.generateReport` | mutation | protected | Triggers report generation for a given `eventId`. Returns `{ reportId, status }`. Idempotent — if a ready report exists, returns it. |
| `reports.getReport` | query | protected | Returns the full report object for a given `reportId`, all JSON fields expanded. |
| `reports.getReportStatus` | query | protected | Returns `{ status, currentStep }` for polling during generation. |
| `reports.exportPdf` | mutation | protected | Triggers PDF generation if not done and returns the S3 download URL. |
| `reports.listEventReports` | query | protected | Returns all reports for a given `eventId` (supports re-generation history). |

---

## 7. Error Handling

If LLM generation fails (API timeout, rate limit, or malformed response), status is set to `failed` and `error_message` is populated. The frontend shows a "Generation failed — retry" button that re-triggers `reports.generateReport`. The system retries automatically up to 3 times with exponential backoff before marking as permanently failed.

If the transcript is incomplete (event ended prematurely, bot disconnected early), the report is still generated with a warning banner noting the transcript may be incomplete.

---

## 8. Access Control

The post-event report is accessible to:

- The event operator assigned to the event
- Admin users
- Users with a valid share link (signed token, expires after 30 days)

Share links allow read-only access without authentication. The share link renders a static view of the report data fetched at link generation time. PDF download is enabled on share links. Compliance flags are hidden from share links unless the link was explicitly generated with compliance access enabled.
