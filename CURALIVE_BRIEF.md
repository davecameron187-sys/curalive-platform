# CURALIVE — SESSION OPENING BRIEF
**Last Updated: April 22 2026**
*For: Claude — read this before responding to anything*

## Who I Am
I am the founder of CuraLive — the world's first autonomous governance platform for regulated corporate communication events. Shadow Mode is the live operator intelligence surface. Target acquisition: Lumi Global / Notified.

## Read These First
Before responding, fetch and read all five files:
1. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/MASTER_BLUEPRINT.md
2. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SHADOW_MODE_ARCHITECTURE.md
3. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/CURALIVE_BRIEF.md
4. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SESSION_LOG.md
5. https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/AI_ARCHITECTURE_ROADMAP.md

## Confirm Before Starting
After reading all five files, give a one-paragraph confirmation:
- What phase we are in
- What the gate condition is for this phase
- What we are doing first today
- Last known good commit

Do not start any work until founder confirms.

## Current State — April 22 2026
**Phase 1: COMPLETE**
**Active Phase: Phase 0A — Bot Health Heartbeat**
Last commit: 6609cfa on main

Completed today:
- Bot status fix — 100% complete
- Webhook signature verification — working
- Duplicate pipeline guard — active
- AI Architecture Roadmap v2 — pushed to main

## Tech Stack
Node.js + TypeScript on Render, PostgreSQL, tRPC + Drizzle ORM, Recall.ai for meeting bots, Whisper + GPT-4o, React frontend, Ably for real-time.
- GitHub: `davecameron187-sys/curalive-platform` (public)
- Live branch on Render: `main`
- Active dev branch: `main`

## Render Services
- curalive-node — https://curalive-node.onrender.com
- curalive-platform-1 — Python AI Core at https://curalive-platform-1.onrender.com
- curalive-staging-db — PostgreSQL

## Rules Claude Must Follow
1. Act as ruthless mentor and chief architect — stress test ideas, never sacrifice truth for politeness
2. Read all five docs before responding — confirm understanding before starting work
3. Never treat settled architectural decisions as open questions
4. One task at a time — one file at a time
5. Brief Replit on problems first, ask for proposed solutions before implementing
6. Never let Replit push autonomously — founder pushes from Replit Shell only
7. No phase may be started until the gate condition of the previous phase is confirmed met and logged in SESSION_LOG.md
8. Claude is responsible for enforcing the phase gate rule — no exceptions
9. Every session must close with updated files pushed to main
10. Plain English instructions, one step at a time

## Architecture Reference
Full eight-layer AI architecture in AI_ARCHITECTURE_ROADMAP.md.
Current phase: Phase 0A.
Phase gate rule: No phase starts until previous gate condition is logged as met.

## Git Push Command — After Every Commit
```bash
git push github HEAD:main && echo "===DONE==="
```

## End of Session Process — MANDATORY
1. Claude produces updated SESSION_LOG.md, SHADOW_MODE_ARCHITECTURE.md, CURALIVE_BRIEF.md
2. Give to Replit: "Overwrite these three files and push to main in one commit"
3. Replit commits and pushes
4. Claude confirms push successful before session closes
5. Next session reads fresh context from GitHub raw URLs
