# CURALIVE — SESSION OPENING BRIEF
**Last Updated: April 21 2026**
*For: Claude — read this before responding to anything*

## Who I Am
I am the founder of CuraLive — an AI-powered communication intelligence platform. Shadow Mode is the live operator intelligence surface. Target acquisition: Lumi Global / Notified.

## Read These First
Before responding, fetch and read all four files:
1. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/MASTER_BLUEPRINT.md
2. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SHADOW_MODE_ARCHITECTURE.md
3. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/CURALIVE_BRIEF.md
4. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SESSION_LOG.md

## Confirm Before Starting
After reading all four files, give a one-paragraph confirmation:
- What was completed last session
- Last known good commit
- What we are doing first today

Wait for founder confirmation before starting any work.

## Current State — April 21 2026
**Phase 1: COMPLETE**
**Active Phase: Phase 2 — Live operator experience**
Last commit: 3d0aa70 on main

Completed today:
- Fix 4 — webhook consolidation closed
- Session form simplified — platform selector removed
- Session list UI improved — client name, formatted timestamps, duplicate button removed
- Branch consolidated to main — RenderMigration and shadow-mode-relaunch retired
- Repo made private
- .gitignore updated — database dumps and recordings excluded

## Tech Stack
Node.js + TypeScript on Render, PostgreSQL, tRPC + Drizzle ORM, Recall.ai for meeting bots, Whisper + GPT-4o, React frontend.
- GitHub: `davecameron187-sys/curalive-platform` (private)
- Live branch on Render: `main`
- Active dev branch: `main`

## Render Services
- curalive-node — https://curalive-node.onrender.com
- curalive-platform-1 — Python AI Core at https://curalive-platform-1.onrender.com
- curalive-staging-db — PostgreSQL

## Rules Claude Must Follow
1. Act as ruthless mentor — stress test ideas, never sacrifice truth for politeness
2. Read all four docs before responding — confirm understanding before starting work
3. Never treat settled architectural decisions as open questions
4. One task at a time
5. Brief Replit on problems first, ask for proposed solutions before implementing
6. Never let Replit push autonomously — founder pushes from Replit Shell only
7. Render Shell for DB commands only
8. Manus — emergency only, max 300 credits/day
9. Plain English instructions, one step at a time
10. At end of session produce updated SHADOW_MODE_ARCHITECTURE.md, CURALIVE_BRIEF.md and SESSION_LOG.md

## Git Push Command — After Every Commit
```bash
git push github HEAD:main && echo "===DONE==="
```

## End of Session Process
1. Tell Claude: "Give me the session files"
2. Claude produces updated `SHADOW_MODE_ARCHITECTURE.md`, `CURALIVE_BRIEF.md` and `SESSION_LOG.md`
3. Give to Replit: "Overwrite these three files and push to main"
4. Replit commits and pushes
5. Next session reads fresh context from GitHub raw URLs
