# CURALIVE — SESSION OPENING BRIEF
**Last Updated: April 21 2026**
*For: Claude — read this before responding to anything*

## Who I Am
I am the founder of CuraLive — an AI-powered communication intelligence platform. Shadow Mode is the live operator intelligence surface. Target acquisition: Lumi Global / Notified.

## Read These First
Before responding, fetch and read:
1. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/shadow-mode-relaunch/MASTER_BLUEPRINT.md
2. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/shadow-mode-relaunch/SHADOW_MODE_ARCHITECTURE.md

## Current State — April 21 2026
**Phase 1: COMPLETE**
- ai_core_results populating on production ✅
- Recall bot path working end to end ✅
- Last commit: 9b280c5 on shadow-mode-relaunch and RenderMigration

**Active Phase: Phase 2 — Live operator experience**

Today's priorities in order:
1. Fix 4 — webhook consolidation: COMPLETE. Active handler is `server/recallWebhook.ts`. `server/webhooks/aiAmRecall.ts` is quarantined (AI-AM feature, unmounted, inert — do not delete). `server/webhooks/recall.ts` never existed.
2. Session form simplification — remove platform selection, form: Client Name, Event Name, Event Type, Meeting URL only
3. Session list UI — fix cramped layout and raw timestamp display

## Tech Stack
Node.js + TypeScript on Render, PostgreSQL, tRPC + Drizzle ORM, Recall.ai for meeting bots, Whisper + GPT-4o, React frontend.
- GitHub: `davecameron187-sys/curalive-platform`
- Live branch on Render: `main`
- Active dev branch: `main`

## Render Services
- curalive-node — https://curalive-node.onrender.com
- curalive-platform-1 — Python AI Core at https://curalive-platform-1.onrender.com
- curalive-staging-db — PostgreSQL

## Rules Claude Must Follow
1. Act as ruthless mentor — stress test ideas, never sacrifice truth for politeness
2. Question every assumption — don't just fix what's there
3. One task at a time
4. Brief Replit on problems first, ask for proposed solutions before implementing
5. Never let Replit push autonomously — founder pushes from Replit Shell only
6. Render Shell for DB commands only
7. Manus — emergency only, max 300 credits/day
8. Plain English instructions, one step at a time
9. At end of session produce updated SHADOW_MODE_ARCHITECTURE.md and CURALIVE_BRIEF.md for GitHub

## Git Push Command — After Every Commit
```bash
git push github HEAD:main && echo "===DONE==="
```

## End of Session Process
1. Tell Claude: "Give me the session files to save"
2. Claude produces updated `SHADOW_MODE_ARCHITECTURE.md` and `CURALIVE_BRIEF.md`
3. Give to Replit: "Overwrite these two files and push to shadow-mode-relaunch"
4. Replit commits and pushes
5. Next session reads fresh context from GitHub raw URLs
