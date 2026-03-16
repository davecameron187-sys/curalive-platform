# Chorus.AI Development Roadmap

## Completed Rounds (1-54)
All core features implemented and production-ready.

## Round 55 — Webhook Auto-Trigger, Email Reports, Comparison Analytics
- [x] Webhook Auto-Trigger — Call sentiment/summary services on recording completion
  - [x] recordingWebhooks.ts service with triggerRecordingAnalysis function
  - [x] generateComparisonAnalytics for cross-event analysis
- [x] Email Report Export — Generate PDF reports with sentiment trends and summaries
  - [x] reportGeneration.ts with PDF generation using pdf-lib
  - [x] sendReportEmail with Resend integration
  - [x] generateComparisonReport for multi-event reports
- [x] Comparison Analytics — Track sentiment changes across multiple events
  - [x] generateComparisonAnalytics function for trend analysis
  - [x] Average score, positive/negative percentages
  - [x] Per-recording sentiment tracking

## Round 56 — Attendee Check-In Kiosk, SMS Retry Automation, Advanced Reporting

### Attendee Check-In Kiosk (Backend Complete)
- [x] Database schema: checkInSessions, attendeeCheckIns tables
- [x] QR code scanning and validation logic
- [x] Check-in success/failure feedback logic
- [x] tRPC procedures: startCheckInSession, scanAttendeeQr, getCheckInSession, getCheckInStats
- [x] Duplicate detection and session tracking
- [ ] UI: /check-in/:eventId/kiosk page with camera integration (deferred)

### SMS Retry Automation (Schema Complete)
- [x] Database schema for SMS retry queue tracking
- [x] Exponential backoff implementation (1min → 5min → 25min)
- [x] Retry attempt tracking and logging support
- [ ] Webhook endpoint POST /api/sms-retry-trigger (deferred)
- [ ] tRPC procedure: triggerSmsRetryQueue (deferred)
- [ ] Admin dashboard to view retry queue status (deferred)

### Advanced Reporting (Backend Complete)
- [x] Database schema: reportConfigs, generatedReports tables
- [x] Report configuration management with metric selection
- [x] Support for sentiment, transcription, Q&A, attendees metrics
- [x] Export formats: PDF, CSV, JSON
- [x] tRPC procedures: createReportConfig, generateCustomReport, listReportConfigs, updateReportConfig
- [x] Report scheduling capability (daily/weekly/monthly)
- [x] Date range filtering and aggregation
- [ ] UI: /reports/builder page with date range picker (deferred)

### Testing & Validation
- [x] 20+ vitest tests for check-in kiosk features
- [x] 20+ vitest tests for reporting features
- [x] Data integrity and error handling tests
- [x] Database helper functions (db.round56.ts)
- [x] TypeScript compilation: 0 errors
