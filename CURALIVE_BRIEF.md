# CuraLive — Living Session Brief
**Last updated:** 19 April 2026 (Session 2)
**Updated by:** Claude (Chief Architect)
**Branch:** `RenderMigration`
**Repo:** `davecameron187-sys/curalive-platform`
**Live URL:** `https://curalive-node.onrender.com`

---

## TOOL STACK & RULES — NON-NEGOTIABLE

| Tool | Role |
|---|---|
| **Claude** | Chief architect, all decisions, code writing, brief updates |
| **Replit** | Critical file edits, git push via Shell, complex terminal tasks |
| **ChatGPT** | Small new files under 100 lines, GitHub file reads |
| **GitHub RenderMigration** | Single source of truth — always |
| **Render** | Auto-deploys on every push to RenderMigration |

**Git push command from Replit Shell:**
```
git push github RenderMigration
```

**ChatGPT command rules:**
- One file at a time
- Always fetch before writing
- Always name branch: `RenderMigration`
- Maximum one commit per instruction
- Never use for large file edits — use Replit instead

**Session start rule:** ChatGPT fetches this file and pastes it to Claude before any work begins.
**Session end rule:** Claude updates this file, Replit pushes it to GitHub.

---

## CURRENT DEPLOY STATE

| Check | Status |
|---|---|
| Server running | ✓ Live |
| `/ping` returns pong | ✓ |
| tRPC API responding | ✓ |
| Frontend loads at root URL | ✓ Fixed 19 Apr 2026 |
| Shadow Mode | ⚠ Old version still showing — V3 code written but not yet pushed |
| Operator Dashboard | ✓ Built and verified working locally — needs push to deploy |
| Session creation (tRPC) | ✓ Working |
| Database migrations | ✓ All tables created on startup |

---

## OPERATOR DASHBOARD — STATUS

**Route:** `/operator/dashboard`
**Status:** ✓ Complete — verified working locally

### 5 Panels (all working)
1. **Command** — KPI cards, live session hero, upcoming this week, attention stack. Auto-refresh 60s.
2. **Sessions** — Live hero + close button, paginated session list, row click to Shadow Mode detail.
3. **Customers** — Active/Demo/Pilot tabs, data-incomplete indicators, pilot events progress bar.
4. **Reports** — Pending reports with preview + approve+send, sent list paginated.
5. **Billing** — Revenue KPIs, subscription list, ad-hoc/pilot/demo list, data-incomplete indicators.

### Backend (all 10 procedures wired)
`getDashboardSummary` · `getLiveSession` · `getUpcomingSessions` · `getAttentionItems` · `getAllSessions` · `getCustomersByStage` · `getReportsPending` · `getReportsSent` · `approveAndSendReport` · `getBillingSummary`

### Files built or modified for Operator Dashboard
| File | Status |
|---|---|
| `client/src/pages/OperatorDashboard.tsx` | ✓ Complete — 745 lines |
| `server/routers/operatorDashboardRouter.ts` | ✓ Complete — 473 lines |
| `server/_core/index.ts` | ✓ Modified — startup migrations added |
| `drizzle/gaps.schema.ts` | ✓ Modified — `scheduledSessions` confirmed, `intelligenceFeed` added |
| `client/src/pages/OperatorConsole.tsx` | ✓ Modified — Dashboard link added to header |
| `client/src/App.tsx` | ✓ Already routed at `/operator/dashboard` |

### Startup migrations added (run on Render startup)
- `organisations` — created if missing + seeded 3 demo orgs on first run
- `scheduled_sessions` — created if missing + `org_id`, `notes`, `platform` columns added if absent
- `billing_invoices` — created if missing
- `intelligence_feed` — created if missing
- `shadow_sessions` — added `org_id`, `company`, `ai_core_results` columns

### Demo organisations seeded (on first Render boot)
| Name | Status | Billing |
|---|---|---|
| Meridian Resources | active | subscription — R25,000/mo |
| Acacia Capital | pilot | adhoc |
| Stellarway Holdings | demo | demo |

---

## SHADOW MODE — V3 vs CURRENT

### What's live now (old version)
- 11 tabs, 4,472 lines, bloated

### What V3 should have (built, NOT yet pushed)
**5 focused tabs:**
1. **Live Console** — session list, intelligence feed, PSIL indicator, heartbeat
2. **Live Q&A** — placeholder
3. **Participants** — placeholder
4. **Pre-Event** — placeholder
5. **History** — completed sessions list

### Files for V3 (built but pending push — verify on GitHub first)
| File | Status |
|---|---|
| `client/src/pages/ShadowMode.tsx` | Built in prior session — verify if on RenderMigration |
| `server/routers/shadowModeRouter.ts` | `listSessions` (line 564) + `pushTranscriptSegment` (line 735) confirmed present — `getIntelligenceFeed` status unknown |
| `drizzle/gaps.schema.ts` | `intelligenceFeed` table added this session |

---

## KNOWN ISSUES — OPEN

| # | Issue | Priority |
|---|---|---|
| 1 | Shadow Mode V3 not live — old version showing on Render | HIGH |
| 2 | `getIntelligenceFeed` procedure in shadowModeRouter — not confirmed present | HIGH |
| 3 | Live Q&A tab — placeholder only | NEXT |
| 4 | Participants tab — placeholder only | NEXT |
| 5 | Pre-Event tab — placeholder only | NEXT |
| 6 | `dialin` platform option not accepted by router enum | LOW |
| 7 | `OAUTH_SERVER_URL` not configured — OAuth disabled, auth bypass active | DEFERRED |

---

## FIXED TODAY — 19 APRIL 2026 (SESSION 2)

| Fix | Details |
|---|---|
| Operator Dashboard built end-to-end | All 5 panels, all 10 tRPC procedures |
| Startup migrations for missing tables | organisations, scheduled_sessions, billing_invoices, intelligence_feed |
| shadow_sessions.org_id + company + ai_core_results | Added via startup ALTER TABLE IF NOT EXISTS |
| Dashboard link added to OCC header | `/operator/dashboard` accessible from OCC |
| `scheduledSessions` duplicate export fixed | Removed duplicate from gaps.schema.ts |

## FIXED IN SESSION 1 — 19 APRIL 2026

| Fix | Commit |
|---|---|
| Restored full 1,124-line `server/_core/index.ts` via Replit force push | `939db97` |
| Corrected start script: `dist/index.js` → `_build/index.js` | `939db97` |
| Fixed static file serving path in `server/vite.ts` | `00e1d32` |
| Added `ws` to production dependencies | `f2b4aa8` |
| Corrected Render start command to `NODE_ENV=production node _build/index.js` | Dashboard |
| Health tables created and migration cleaned up | Replit |
| `shadow_sessions.client_name` column added | Replit |
| Frontend now loads at root URL | ✓ Confirmed |

---

## NEXT BUILD PRIORITIES

1. **Push Operator Dashboard to Render** — run git add/commit/push (files below)
2. **Verify Shadow Mode V3** — check if V3 ShadowMode.tsx is on RenderMigration; if not, push it
3. **Add `getIntelligenceFeed` to shadowModeRouter** — verify it exists or add it
4. **Wire Live Q&A tab** — build out from placeholder
5. **Wire Participants tab** — build out from placeholder

### Git commands for this session's work
```
git add client/src/pages/OperatorDashboard.tsx \
        server/routers/operatorDashboardRouter.ts \
        server/_core/index.ts \
        drizzle/gaps.schema.ts \
        client/src/pages/OperatorConsole.tsx \
        CURALIVE_BRIEF.md
git commit -m "Build: Operator Dashboard — 5 panels, 10 tRPC procedures, startup migrations"
git push github RenderMigration
```

---

## PATENT NOTE

- South African Provisional Application filed March 2026
- PCT deadline: March 2027 — via CIPC direct (not PatentPC)
- 19 invention families, 125 claims, 18 figures
- Four new disclosures to add:
  1. Participant Intelligence Layer
  2. Disclosure Consistency Engine
  3. Pre-Speak Intelligence Lock (PSIL)
  4. Communication Genome

---

## HOW TO START A NEW SESSION

1. Open new Claude chat
2. Send this to ChatGPT first: *"Please fetch the file `CURALIVE_BRIEF.md` from GitHub repo `davecameron187-sys/curalive-platform` branch `RenderMigration` and paste the full contents."*
3. Paste the result into Claude with: *"Here is the CuraLive brief. Pick up from here."*
4. Claude reads it and continues with no lost context.

---

*This file is the single source of truth for session context. Update it at the end of every session.*
