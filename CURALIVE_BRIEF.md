# CuraLive — Living Session Brief
**Last updated:** 19 April 2026 — Evening checkpoint
**Updated by:** Claude (Chief Architect)
**Branch:** `RenderMigration`
**Repo:** `davecameron187-sys/curalive-platform`
**Live URL:** `https://curalive-node.onrender.com`

---

## HOW TO START A NEW SESSION

1. Open ChatGPT first
2. Say: *"Please fetch the file `CURALIVE_BRIEF.md` from GitHub repo `davecameron187-sys/curalive-platform` branch `RenderMigration` and paste the full contents."*
3. Copy what ChatGPT returns
4. Open Claude and paste it with: *"Here is the CuraLive brief. Pick up from here."*
5. Claude is instantly up to speed — no repeated explanations, no lost context

---

## TOOL STACK & RULES — NON-NEGOTIABLE

| Tool | Role |
|---|---|
| **Claude** | Chief architect, all decisions, code writing, brief updates |
| **Replit** | Critical file edits, git push via Shell, complex terminal tasks, builds from brief |
| **ChatGPT** | Small new files under 100 lines, GitHub file reads, web searches |
| **GitHub RenderMigration** | Single source of truth — always |
| **Render** | Auto-deploys on every push to RenderMigration |

**Git push command from Replit Shell:**
```
git push github RenderMigration
```

**Rules — non-negotiable:**
- Before building or fixing anything, ChatGPT reads the current file from GitHub first
- Never replace a working file from scratch — always preserve existing functionality
- One task at a time to ChatGPT — small commands only
- Replit handles all critical file edits and git operations
- Brief updated at end of every session — no exceptions
- Second opinion from Replit before any destructive operation
- NEVER force push without Claude verifying GitHub has no commits ahead of Replit

**Session start rule:** ChatGPT fetches this file and pastes it to Claude before any work begins.
**Session end rule:** Claude updates this file, Replit pushes it to GitHub. NO EXCEPTIONS.

---

## CRITICAL LESSONS LEARNED — 19 APRIL 2026

1. **Force push wiped working commits** — `d34ea20` and `255cd01` permanently lost. Always verify GitHub has no commits ahead of Replit before force pushing.
2. **Never rewrite working files from scratch** — Always read current file first, preserve working functionality, only change what needs changing.
3. **Screenshots are documentation** — If something works and looks right, screenshot it and add to brief as reference.
4. **ChatGPT hallucinates file contents** — Always verify against actual GitHub files, never trust ChatGPT's description of what's in a file.

---

## CURRENT DEPLOY STATE — FULLY WORKING

| Check | Status |
|---|---|
| Server running | ✓ Live |
| `/ping` returns pong | ✓ |
| tRPC API responding | ✓ |
| Frontend loads at root URL | ✓ |
| Shadow Mode V3 loads | ✓ |
| Session creation works | ✓ |
| Recall.ai bot joins Zoom sessions | ✓ Fixed — eu-central-1 region |
| Live Console shows live sessions | ✓ |
| END SESSION button works | ✓ |
| Intelligence feed table | ✓ |
| Live Q&A tab wired | ✓ |
| Database migrations clean | ✓ |

---

## ENVIRONMENT VARIABLES — RENDER

| Variable | Status |
|---|---|
| `RECALL_AI_API_KEY` | ✓ Updated 19 Apr 2026 — key: CuraLive Production |
| `RECALL_AI_BASE_URL` | ✓ Set to `https://eu-central-1.recall.ai/api/v1` |
| `ABLY_API_KEY` | ✓ Set — real-time streaming active |
| `OAUTH_SERVER_URL` | ⚠ Not set — OAuth disabled, auth bypass active |
| `RECALL_AI_WEBHOOK_SECRET` | ⚠ Not set — webhook verification disabled |

---

## SHADOW MODE V3 — CURRENT STATE

### What's working
- **Live Console** — session list, NEW SESSION button, session creation form, intelligence feed, PSIL indicator, duration timer, auto-select live session, END SESSION button
- **Live Q&A** — wired to LiveQaDashboard component, shows questions when session selected
- **History** — completed sessions list
- **Floating CuraLive Assistant**
- **Monospace cockpit aesthetic**

### Session creation form fields
- Client Name, Event Name, Event Type, Platform (Zoom/Teams/Webex/Google Meet/Phone/Dial-in/Other), Meeting URL (auto-detects platform), Notes

### Platforms
- Zoom, Teams, Webex, Google Meet — use Recall.ai bot (now working)
- Phone/Dial-in, Other — Local Audio Capture mode (always worked)

### Still placeholder
- **Participants tab** — coming next build phase
- **Pre-Event tab** — coming next build phase

---

## FILES — CURRENT STATE

| File | Lines | Status |
|---|---|---|
| `client/src/pages/ShadowMode.tsx` | ~460 | ✓ V3 with session creation + END SESSION |
| `client/src/components/LiveQaDashboard.tsx` | ~120 | ✓ Rebuilt |
| `client/src/pages/AttendeeQA.tsx` | ~100 | ✓ Rebuilt |
| `server/routers/liveQaRouter.ts` | ~100 | ✓ Rebuilt |
| `server/services/PlatformEmbedService.ts` | ~40 | ✓ Rebuilt |
| `server/routers/shadowModeRouter.ts` | ~1425 | ✓ Working — rawSql INSERT |
| `server/_core/index.ts` | ~1318 | ✓ shadow_sessions migration patched |
| `server/routers/broadcastControlRouter.ts` | — | ✗ Not yet rebuilt |
| `client/src/components/BroadcastControl.tsx` | — | ✗ Not yet rebuilt |
| `CURALIVE_BRIEF.md` | — | ✓ Living brief on GitHub |

---

## KNOWN ISSUES — OPEN

| # | Issue | Priority |
|---|---|---|
| 1 | Broadcast Control — needs full rebuild (lost in force push) | NEXT |
| 2 | Participants tab — placeholder | NEXT |
| 3 | Pre-Event tab — placeholder | NEXT |
| 4 | `ABLY_API_KEY` not set — real-time transcript streaming disabled | IMPORTANT |
| 5 | `OAUTH_SERVER_URL` not configured — auth bypass active | DEFERRED |
| 6 | Intelligence feed not yet tested with live session data | TEST NEEDED |

---

## NEXT BUILD PRIORITIES

1. **Test intelligence feed with a real live session** — create session, join Zoom, confirm feed receives data
2. **Set `ABLY_API_KEY` on Render** — enables real-time transcript streaming
3. **Rebuild Broadcast Control** — 4 DB tables, 9 tRPC procedures, 3 modes
4. **Build Participants tab** — show who is on the call, role, join time
5. **Build Pre-Event tab** — briefing documents, talking points, risk flags
6. **Meridian Resources demo data** — end to end demo session

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

## REFERENCE — SHADOW MODE V3 SCREENSHOTS
Two screenshots saved by Dave showing the working Shadow Mode from 19 April 2026:
- Screenshot 1: New Shadow Intelligence Session form — Client Name, Event Name, Event Type, Platform buttons, Meeting URL, Notes
- Screenshot 2: Live Console with + NEW SESSION button, No sessions yet state, 5 tabs visible

---

*This file is the single source of truth for session context. Update it at the end of every session without fail.*
