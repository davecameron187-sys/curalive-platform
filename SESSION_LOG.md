# CURALIVE — SESSION LOG
**Last Updated: April 21 2026**

---

## Session: April 21 2026

### Last Commit
`3d0aa70` on main

### Completed This Session
- **Fix 4 — Webhook consolidation — Closed.** `server/webhooks/recall.ts` never existed. `server/recallWebhook.ts` is the canonical active handler. `server/webhooks/aiAmRecall.ts` is quarantined — AI-AM feature, unmounted, inert. Do not delete.
- **Session form simplified** — Platform selector removed from `ShadowMode.tsx`. `platform: "zoom"` hardcoded in mutation. Form now: Client Name, Event Name, Event Type, Meeting URL, Notes.
- **Session list UI improved** — Client name displayed above event name. Timestamps formatted via `formatSessionTime` helper. Duplicate END SESSION button removed from list row.
- **Branch consolidated to main** — RenderMigration and shadow-mode-relaunch retired. Render updated to deploy from main. Replit workspace on main.
- **Repo secured** — Made private on GitHub. `.gitignore` updated to exclude database dumps, recordings, and attached assets.
- **Docs updated** — All three blueprint files updated to reflect main branch and current state.

### Decisions Made
- **aiAmRecall.ts quarantined not deleted** — AI-AM is a real partially-built feature with live tRPC routers. Webhook handler is dead code but worth keeping for future AI-AM webhook work.
- **`!isRecallSupported` branch in `startSession` left in place** — dead code but harmless. Remove in Phase 2 cleanup separately.
- **`createScheduledSession` `?` placeholder bug noted** — fix separately, not bundled with UI work.
- **Single main branch adopted** — double push to two identical branches was unnecessary overhead.

### What To Do First Next Session
Phase 2 priority order — pick up from here:
1. Bot status stuck at `created` — `handleBotStatusChange` not updating `recall_bots.status` correctly
2. Shadow Mode UI consistency — align with rest of platform
3. Tier 2 standby buffer — server-side implementation
4. `!isRecallSupported` dead code cleanup in `startSession`

### Open Risks / Watch Items
- Render redeploy from main — confirm both services deployed cleanly after branch switch
- `createScheduledSession` PostgreSQL `?` placeholder bug — will fail if that mutation is ever called
- AI-AM tRPC routers are live but webhook ingest is dead — AI-AM is partially broken by design until fixed
