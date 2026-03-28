# CuraLive — Manus Code Gap Report

**Date:** March 28, 2026  
**From:** Replit (Staging Validation)  
**To:** Manus / Project Lead  
**Purpose:** Report what Manus code has landed in the Replit environment vs what hasn't

---

## Summary

**None of the Manus ManusChatgpt branch files are present in the Replit environment.**

The GitHub remote is not connected to this Replit project. Only the internal backup remote exists (`gitsafe-backup`). The ManusChatgpt branch cannot be pulled without connecting the GitHub repo.

---

## What IS Present (Built Directly in Replit)

These features were built and validated directly in this Replit environment and are fully operational:

| Feature | Status | Key Files |
|---------|--------|-----------|
| Shadow Mode (full implementation) | WORKING | `server/routers/shadowModeRouter.ts`, `client/src/pages/ShadowMode.tsx` |
| Archive Upload + AI Processing | WORKING | `server/routers/archiveUploadRouter.ts`, `client/src/pages/ArchiveUpload.tsx` |
| Session Handoff + Export (CSV/JSON/PDF) | WORKING | `shadowModeRouter.ts` (exportSession, getHandoffPackage) |
| WebPhone (Twilio + Telnyx dual-carrier) | WORKING | `client/src/components/Webphone.tsx`, `server/webphone/` |
| Carrier Failover (Twilio/Telnyx) | WORKING | `server/webphone/carrierManager.ts` |
| Live Q&A — P1 Enhancements | WORKING | `server/routers/liveQaRouter.ts`, `client/src/components/LiveQaDashboard.tsx` |
| Duplicate Detection (Jaccard) | WORKING | `liveQaRouter.ts` (submitQuestion) |
| Legal Review Workflow | WORKING | `liveQaRouter.ts` (setLegalReview) |
| AI Draft Responses | WORKING | `liveQaRouter.ts` (generateContextDraft) |
| Enhanced Filters + Sort + Keyboard Shortcuts | WORKING | `LiveQaDashboard.tsx` |
| Bulk Actions | WORKING | `LiveQaDashboard.tsx` |
| Operator Action Logging | WORKING | `operator_actions` table |
| AI Dashboard (20 modules) | WORKING | `client/src/components/AIDashboard.tsx` |
| Real-time Ably Pub/Sub | WORKING | Throughout codebase |
| Recall.ai Bot Integration | WORKING | `shadowModeRouter.ts` |

---

## What is NOT Present (Manus ManusChatgpt Branch)

These files and features exist only on the ManusChatgpt branch and have not been pulled into Replit:

### New Files — NOT FOUND

| File | Purpose | Status |
|------|---------|--------|
| `client/src/components/LiveSessionPanel.tsx` | Full-screen live operator console modal | NOT IN REPLIT |
| `client/src/components/WebPhoneCallManager.tsx` | Call manager with participant list, quality badges, audio levels | NOT IN REPLIT |
| `client/src/components/WebPhoneJoinInstructions.tsx` | Customer-facing join instructions with WebPhone primary | NOT IN REPLIT |
| `server/services/connectivityFallback.ts` | Fallback logic service (retry + provider switching) | NOT IN REPLIT |
| `server/services/webcastSessionManager.ts` | Webcast session support | NOT IN REPLIT |
| `server/services/webcastSessionManager.test.ts` | Webcast tests | NOT IN REPLIT |
| `server/routers/fallback.test.ts` | Fallback logic tests | NOT IN REPLIT |
| `server/routers/archive.test.ts` | Archive router tests | NOT IN REPLIT |
| `STAGING_REPORT.md` | Staging overview doc | NOT IN REPLIT |
| `STAGING_EXECUTION_LOG.md` | Test procedures doc | NOT IN REPLIT |
| `IMPLEMENTATION_TODO.md` | Feature completion status | NOT IN REPLIT |

### Features — NOT PRESENT

| Feature | Description |
|---------|-------------|
| Embedded Live Console | "Open Live Console" button, full-screen modal with tabs (WebPhone/Q&A/Transcript/Notes), quick actions sidebar, provider state bar |
| WebPhone Call Manager UI | Operator dashboard for active participants, quality badges, audio levels, call stats |
| WebPhone Join Instructions | Customer-facing component with dial-in, SIP URI, access code, tabbed alternatives |
| Live Session Alert Banner | Banner at top of Shadow Mode showing active live session |
| Provider State Bar | Visual indicator of current connectivity provider and fallback status |
| Connectivity Fallback Service | Server-side retry mechanism with exponential backoff and provider switching |
| Webcast Session Manager | Server-side webcast session lifecycle management |
| WebPhone-as-Default | Session creation defaulting to WebPhone connectivity |

### Staging Fixes — STATUS UNKNOWN

| Fix | Manus Says | Replit Status |
|-----|-----------|---------------|
| BUG-A1 (HTML nesting in AI Dashboard) | Fixed | Cannot verify — code not pulled |
| BUG-B1 (Bulk approve count delay) | Fixed | Cannot verify — code not pulled |
| BUG-D2 (Webcast dropdown) | Resolved as false positive | Confirmed as likely false positive by Replit investigation |
| BUG-D1 (Chorus Call dropdown) | Intentionally deferred | Acknowledged |

---

## What Needs to Happen

### Option 1: Connect GitHub Remote
Connect the GitHub repository to this Replit project so the ManusChatgpt branch can be pulled:

```
git remote add origin https://github.com/[your-org]/[your-repo].git
git fetch origin
git checkout ManusChatgpt
git pull origin ManusChatgpt
pnpm install
pnpm dev
```

### Option 2: Upload Key Files
Upload these files directly to Replit:
1. `client/src/components/LiveSessionPanel.tsx`
2. `client/src/components/WebPhoneCallManager.tsx`
3. `client/src/components/WebPhoneJoinInstructions.tsx`
4. `server/services/connectivityFallback.ts`
5. `server/services/webcastSessionManager.ts`
6. Any modified versions of existing files (ShadowMode.tsx, shadowModeRouter.ts, etc.)

### Option 3: Replit Builds from Manus Spec
Replit builds the features based on the Manus brief. However, per the operating model, this is Manus's scope (building), not Replit's (validation).

---

## Validation Tracks Status

All 9 validation tracks from the brief **cannot be executed** until the Manus code is present:

| Track | Area | Status |
|-------|------|--------|
| 1 | Shadow Mode entry + live console launch | BLOCKED — LiveSessionPanel.tsx not present |
| 2 | Live console layout | BLOCKED — LiveSessionPanel.tsx not present |
| 3 | WebPhone tab | BLOCKED — WebPhoneCallManager.tsx not present |
| 4 | Provider state + fallback | BLOCKED — connectivityFallback.ts not present |
| 5 | Q&A tab in live console | BLOCKED — LiveSessionPanel.tsx not present |
| 6 | Transcript tab | BLOCKED — LiveSessionPanel.tsx not present |
| 7 | Notes tab | BLOCKED — LiveSessionPanel.tsx not present |
| 8 | Quick actions sidebar | BLOCKED — LiveSessionPanel.tsx not present |
| 9 | Regression on archive/sessions | CAN RUN — existing code present |

---

*Replit Gap Report — March 28, 2026*
