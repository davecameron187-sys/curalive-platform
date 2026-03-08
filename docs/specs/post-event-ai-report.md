# Post-Event AI Report

## REPLIT SUMMARY

**Feature**: Post-Event AI Report  
**Route**: `/post-event/:eventId`  
**Priority**: High  
**Status**: spec-ready  
**Dependencies**: AI Transcription (partial), Ably Real-Time Channels (implemented), Mux Live Streaming (implemented)  

**What to build**: A comprehensive post-event intelligence report page that automatically generates an AI-powered summary of any completed event. The report aggregates transcript data, Q&A activity, sentiment analysis, audience engagement metrics, and key moments into a single downloadable document. The page should be accessible from the event card (already wired in the Active Events section) and from the Operator Console post-event view.

**Key files to create or modify**:
- `client/src/pages/PostEventReport.tsx` — Main report page component
- `server/routers/postEventReport.ts` — tRPC router for report generation and retrieval
- `server/services/PostEventReportService.ts` — Service layer for AI report generation
- `drizzle/schema.ts` — Add `post_event_reports` table
- `client/src/App.tsx` — Register route `/post-event/:eventId`

**Database table**: `post_event_reports` with columns: `id`, `event_id`, `generated_by` (FK users), `report_type` (enum: full, executive, compliance), `status` (enum: generating, completed, failed), `ai_summary` (text), `key_moments` (JSON), `sentiment_overview` (JSON), `qa_summary` (JSON), `engagement_metrics` (JSON), `compliance_flags` (JSON), `full_transcript_url` (text, S3 link), `pdf_url` (text, S3 link), `created_at`, `updated_at`

**tRPC procedures**:
- `postEventReport.generate` (mutation, protected) — Triggers AI report generation for a given eventId
- `postEventReport.getReport` (query, protected) — Retrieves a completed report by eventId
- `postEventReport.getReportStatus` (query, protected) — Polls generation status
- `postEventReport.downloadPdf` (query, protected) — Returns presigned S3 URL for PDF download
- `postEventReport.regenerate` (mutation, protected) — Re-generates report with updated parameters

---

## Detailed Specification

### 1. Overview

The Post-Event AI Report is the final deliverable for every CuraLive event. It transforms raw event data — transcripts, Q&A logs, sentiment scores, audience engagement, and compliance flags — into a structured, branded intelligence report. The report serves three audiences: the event host (executive summary), the compliance team (JSE/IFRS flagging), and the investor relations team (full transcript with annotations).

### 2. Report Types

The system supports three report types, each tailored to a different audience and use case.

| Report Type | Audience | Content Depth | Typical Length |
|---|---|---|---|
| **Executive** | C-suite, Board | High-level summary, key takeaways, sentiment overview | 2–3 pages |
| **Full** | IR team, Analysts | Complete transcript, Q&A log, sentiment timeline, engagement metrics | 10–30 pages |
| **Compliance** | Legal, Compliance | JSE/IFRS flagging, material statement detection, regulatory risk highlights | 5–10 pages |

### 3. Report Sections

Each full report contains the following sections, generated sequentially by the AI pipeline.

**3.1 Executive Summary** — A 300–500 word AI-generated summary of the event covering the purpose, key discussion points, notable Q&A exchanges, and overall audience sentiment. The summary should be written in professional third-person prose suitable for board distribution.

**3.2 Key Moments Timeline** — A chronological list of significant moments during the event, each with a timestamp, a one-sentence description, and a sentiment indicator (positive, neutral, negative). Key moments are identified by the AI based on sentiment spikes, high Q&A activity, or compliance-flagged statements. The timeline should display as an interactive vertical timeline component with clickable timestamps that link to the corresponding transcript position.

**3.3 Sentiment Analysis Overview** — An aggregated view of audience and speaker sentiment throughout the event. This section includes an overall sentiment score (0–100), a sentiment trend chart (line chart over event duration), a breakdown by speaker, and a breakdown by topic. The sentiment data comes from the existing Ably real-time sentiment channel, aggregated and stored at event completion.

**3.4 Q&A Summary** — A structured summary of all questions submitted during the event, organized by category. Each question entry includes the question text, the submitter (anonymized unless the submitter opted in), the number of upvotes, whether it was answered, and the AI-generated answer summary if applicable. The section also includes aggregate statistics: total questions submitted, total answered, average response time, and top categories.

**3.5 Audience Engagement Metrics** — Quantitative metrics on audience participation including peak concurrent attendees, average session duration, attendee join/leave timeline, Q&A participation rate (percentage of attendees who submitted or upvoted a question), poll response rates, and chat activity volume. These metrics should be displayed as a combination of stat cards and charts.

**3.6 Compliance Flags (JSE/IFRS)** — For events flagged as compliance-relevant (earnings calls, investor days), the AI scans the transcript for material statements, forward-looking statements, and potential regulatory concerns. Each flag includes the transcript excerpt, the timestamp, the flag type (material, forward-looking, risk), and a severity level (low, medium, high). This section is critical for South African JSE-listed companies and must follow IFRS disclosure guidelines.

**3.7 Full Transcript** — The complete event transcript with speaker identification, timestamps, and inline annotations for key moments and compliance flags. The transcript should support search, filtering by speaker, and export to PDF/DOCX. The transcript data comes from the existing AI Transcription pipeline (Forge AI and Whisper).

**3.8 Replay Link** — If the event was recorded via Mux, the report includes an embedded video player with the event replay. The player should sync with the transcript, allowing users to click a transcript line and jump to that moment in the video.

### 4. AI Generation Pipeline

The report generation process follows a multi-step pipeline that processes raw event data through the LLM.

**Step 1: Data Collection** — Gather all event data from the database: transcript segments, Q&A entries, sentiment scores, engagement metrics, participant logs, and compliance flags. This step queries existing tables (conferences, transcriptSegments, qaEntries, sentimentScores, participants).

**Step 2: Transcript Assembly** — Assemble the full transcript from individual segments, merging overlapping segments, resolving speaker identification conflicts, and formatting timestamps. If Whisper transcription is incomplete, fall back to Forge AI transcript data.

**Step 3: AI Summary Generation** — Send the assembled transcript and event metadata to the LLM (via `invokeLLM`) with a structured prompt requesting the executive summary, key moments, and Q&A summary. Use `response_format: json_schema` to ensure structured output. The prompt should include the event type (earnings call, roadshow, webcast) to tailor the summary tone and focus.

**Step 4: Sentiment Aggregation** — Process raw sentiment scores into aggregated views: overall score, trend data (5-minute intervals), per-speaker breakdown, and per-topic breakdown. This is a computational step, not an LLM call.

**Step 5: Compliance Scan** — Send the transcript to the LLM with a compliance-focused prompt that identifies material statements, forward-looking statements, and regulatory risk language. The prompt should reference JSE Listings Requirements and IFRS disclosure standards. Use structured JSON output for consistent flag formatting.

**Step 6: PDF Generation** — Render the complete report as a branded PDF using a server-side PDF library (e.g., `@react-pdf/renderer` or `puppeteer`). The PDF should include the CuraLive logo, event branding, page numbers, and a table of contents. Upload the PDF to S3 via `storagePut` and store the URL in the database.

**Step 7: Status Update** — Update the report status from "generating" to "completed" and notify the event host via the existing `notifyOwner` helper.

### 5. Frontend Design

The Post-Event Report page should follow the existing CuraLive dark theme with the following layout.

**Header** — Event title, date, duration, and report generation timestamp. Include buttons for "Download PDF", "Regenerate Report", and "Share Report". The header should be sticky on scroll.

**Tab Navigation** — Tabs for each report section: Summary, Key Moments, Sentiment, Q&A, Engagement, Compliance, Transcript, Replay. Default to the Summary tab.

**Summary Tab** — Render the AI-generated executive summary as formatted prose. Below the summary, display 4 stat cards: Total Attendees, Questions Asked, Sentiment Score, Duration.

**Key Moments Tab** — Vertical timeline component with clickable entries. Each entry shows timestamp, description, and sentiment badge. Clicking an entry scrolls the transcript to that position.

**Sentiment Tab** — Line chart showing sentiment over time (use Chart.js). Below the chart, display per-speaker sentiment cards and a topic breakdown table.

**Q&A Tab** — Searchable, filterable list of all questions. Each question card shows the question text, category badge, upvote count, answered status, and AI answer summary. Include aggregate stats at the top.

**Engagement Tab** — Grid of stat cards (peak attendees, avg duration, participation rate) and a line chart showing attendee count over time.

**Compliance Tab** — Table of compliance flags with columns: Timestamp, Excerpt, Flag Type, Severity. Clicking a row highlights the corresponding transcript line. Include a summary count of flags by type and severity.

**Transcript Tab** — Full transcript with speaker labels, timestamps, and inline highlights for key moments (yellow) and compliance flags (red). Include a search bar and speaker filter dropdown. Support "Copy to Clipboard" for selected sections.

**Replay Tab** — Embedded Mux video player with transcript sync. Clicking a transcript line seeks the video to that timestamp. If no recording is available, display a message indicating the event was not recorded.

### 6. Error Handling

Report generation can fail at any step. The system should handle failures gracefully by storing the failure reason in the database, displaying a user-friendly error message on the frontend, allowing the user to retry generation, and sending a notification to the event host if generation fails after 3 retries. The frontend should poll the report status every 5 seconds during generation and display a progress indicator showing which step is currently executing.

### 7. Access Control

Post-event reports are accessible to the event host (creator), assigned operators, and admin users. The `postEventReport.getReport` procedure should verify that the requesting user has access to the event before returning the report. Compliance reports should additionally require the user to have a "compliance" or "admin" role.

### 8. Performance Considerations

Report generation is a long-running process (30–120 seconds depending on event length). The generation should run asynchronously — the mutation returns immediately with a report ID, and the frontend polls for completion. For events longer than 2 hours, the transcript should be chunked before sending to the LLM to stay within token limits. Each chunk should be processed independently, then the results merged.
