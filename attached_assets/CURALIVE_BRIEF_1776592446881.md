# CuraLive — Living Session Brief
**Last updated:** 19 April 2026
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
| Shadow Mode loads | ⚠ Old version showing — V3 not yet live |
| Session creation (tRPC) | ✓ Working |
| Database migrations | ✓ All Phase 2 tables created |

---

## SHADOW MODE — V3 vs CURRENT

### What's live now (old version)
- 11 tabs, 4,472 lines, bloated — includes archive upload, AI dashboard, AI learning, advisory bot, diagnostics, board compass, compliance monitor

### What V3 should have (built in Claude, not yet live)
**5 focused tabs:**
1. **Live Console** — session list, intelligence feed, PSIL indicator, heartbeat, session stats
2. **Live Q&A** — placeholder, ready for next build phase
3. **Participants** — placeholder, ready for next build phase
4. **Pre-Event** — placeholder, ready for next build phase
5. **History** — completed sessions list

**New features not in old version:**
- Intelligence Feed — live AI outputs colour-coded by severity
- PSIL Indicator — shows Clear / Constrain / Redirect / Escalate in real time
- CuraLive Assistant — floating advisory bot always accessible
- Auto-select live session on page load
- Live session duration timer
- Clean monospace cockpit aesthetic

### Files created or modified for V3
| File | Status |
|---|---|
| `client/src/pages/ShadowMode.tsx` | Complete replacement — V3 code |
| `server/migrations/create-phase2-tables.ts` | Created |
| `server/services/IntelligencePipelineService.ts` | Created |
| `server/routers/shadowModeRouter.ts` | Modified — added `pushTranscriptSegment` and `getIntelligenceFeed` |
| `drizzle/gaps.schema.ts` | Modified — added `intelligenceFeed` table |
| `server/_core/vite.ts` | Modified — static path corrected |
| `vite.config.ts` | Modified — build output directory |
| `package.json` | Modified — build script and start script corrected |

---

## KNOWN ISSUES — OPEN

| # | Issue | Priority |
|---|---|---|
| 1 | Shadow Mode V3 not live — old version showing | HIGH |
| 2 | Live Q&A tab — placeholder only | NEXT |
| 3 | Participants tab — placeholder only | NEXT |
| 4 | Pre-Event tab — placeholder only | NEXT |
| 5 | `dialin` platform option not accepted by router enum | LOW |
| 6 | `health_checks`, `health_baselines`, `health_incidents` tables missing — cosmetic log noise only | LOW |
| 7 | `OAUTH_SERVER_URL` not configured — OAuth disabled | DEFERRED |

---

## FIXED TODAY — 19 APRIL 2026

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

1. **Get Shadow Mode V3 live** — confirm V3 file exists on RenderMigration, deploy it
2. **Wire Live Q&A tab** — build out from placeholder
3. **Wire Participants tab** — build out from placeholder
4. **Meridian Resources demo data** — test session end to end
5. **Fix `dialin` router enum**

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
