# CuraLive — Three-Way Collaboration Guide

This document is for **Manus**, **Replit Agent**, and the **project owner** to stay coordinated.

---

## The Three Parties

| Party | Role | Writes To |
|---|---|---|
| **Manus** | Specification & documentation | GitHub (docs, DOCX specs) |
| **Replit Agent** | Code implementation | GitHub (via push script) |
| **Project Owner** | Direction & approval | Relays tasks between parties |

---

## Agreed Workflow

### Manus's role
- Write product specs, feature designs, and architecture docs (DOCX or Markdown)
- Commit spec files to the `docs/specs/` folder in GitHub
- **Do NOT write implementation code** — Replit Agent handles all code
- Do NOT push to `client/`, `server/`, `drizzle/`, or any TypeScript/TSX files
- After completing a spec, update `docs/specs/STATUS.md` with the feature name and status `spec-ready`
- **At the top of every spec file, include a REPLIT SUMMARY block** (see format below) — the project owner will copy-paste this block directly into the Replit chat to kick off implementation

### Spec file format (Manus must follow this)

Every spec file in `docs/specs/` must start with this block at the very top:

```
---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: <short feature name>
Route(s): <e.g. /occ, /training-mode>
Priority: <high | medium | low>
Depends on: <list any features that must exist first, or "none">

What to build:
- <bullet 1: one clear task>
- <bullet 2: one clear task>
- <bullet 3: one clear task>

DB changes needed: <yes/no — if yes, describe tables/columns>
New tRPC procedures: <yes/no — if yes, list procedure names>
New pages/routes: <yes/no — if yes, list them>
---
```

Below this block, Manus can write the full detailed spec in any format.

### Replit Agent's role
- Read Manus specs from `docs/specs/` at the start of each session
- Implement all code changes in Replit
- Push completed code to GitHub via `node scripts/github-push-manual.mjs`
- Update `docs/specs/STATUS.md` to mark features as `implemented`
- **Does not pull from GitHub mid-session** — syncs only at session start via `node scripts/github-sync-check.mjs`

### Project Owner's role
- Start each session by saying: "Check GitHub for new Manus specs" — Replit Agent will sync and list what's pending
- Approve pushes to GitHub — say "push to GitHub" after each session
- Act as relay: copy Manus spec filenames or summaries into the Replit chat when kicking off implementation

---

## Why This Division Exists

**The push mechanism**: Replit Agent cannot `git push` directly (it times out in the Replit environment). Instead it uses the GitHub GraphQL API via `scripts/github-push-manual.mjs`, which creates commits directly on GitHub's branch. These commits have **different SHA hashes** than Replit's local git history.

This means:
- **Manus should not `git pull` after Replit Agent pushes**, as it will cause history conflicts
- **Manus should treat GitHub's `main` branch as read-only** after Replit Agent writes to it
- If Manus needs to add a spec doc, they should push to a **separate branch** (e.g. `manus/specs`) and notify the project owner to relay the content to Replit Agent

---

## The Simplest Safe Workflow (Recommended)

```
Manus writes spec → saves to docs/specs/ on branch manus/specs
Owner reads spec → pastes summary into Replit chat
Replit Agent implements → pushes code to main via github-push-manual.mjs
Owner confirms → session complete
```

---

## Session Start Checklist (for Project Owner)

**Step 1** — Open the Replit chat and say:
> "Check GitHub for any new Manus specs or unimplemented work"

Replit Agent will run the sync check and report:
- Files on GitHub not yet in Replit
- Any `docs/specs/` files with status `spec-ready` (pending implementation)

**Step 2** — If Manus has a new spec file, open it in GitHub. Copy the **REPLIT SUMMARY block** at the very top of the file (the section between the `---` lines) and paste it into the Replit chat. That gives Replit Agent everything it needs to start building.

**Step 3** — After Replit Agent finishes, say "push to GitHub" to sync the code back.

---

## What's Currently Implemented (as of March 2026)

| Feature | Status | Route |
|---|---|---|
| OCC Operator Console | Live | `/occ` |
| Training Mode Console | Live | `/training-mode` |
| Operator Analytics | Live | `/operator/analytics` |
| Development Dashboard | Live | `/dev-dashboard` |
| AI Features Status | Live | `/ai-features` |
| Live Webcasting | Live | `/live-video/webcast/*` |
| Roadshow Suite | Live | `/live-video/roadshow/*` |
| Enterprise Billing | Live | `/billing`, `/admin/billing` |
| Recall.ai Integration | Live | Bot recording for Zoom/Teams/Webex |
| Mux Live Streaming | Live | RTMP/HLS |
| Ably Real-Time | Live | All OCC channels |
| Twilio/Telnyx Webphone | Live | Audio bridge |
| AI Transcription | Partial | Forge AI live; OpenAI Whisper partial |
| Post-Event AI Report | Planned | — |

---

## Files Manus Should Never Modify

```
client/         All React frontend code
server/         All Express/tRPC backend code
drizzle/        Database schema
scripts/        Push/sync scripts
package.json    Dependencies
*.ts *.tsx      All TypeScript source files
```

## Files Manus Can Safely Add

```
docs/specs/     Feature specifications (Markdown or DOCX)
docs/designs/   UI designs, wireframes
docs/specs/STATUS.md   Feature status tracker
```
