# CuraLive — Replit Publish Issue Debug Brief

## Repository
- **Repo**: github.com/davecameron187-sys/curalive-platform
- **Branch**: `main`
- **Latest commit**: `dea3b88`

## Context
CuraLive is a React 19 + Vite + Express + tRPC platform deployed on Replit (Autoscale target). The last successful publish was **2026-03-25T09:47:42Z** (Deployment ID: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`). Since then, code updates have been committed and pushed but the Replit Publish button is unresponsive — no new deployment is triggered.

## Deployment Configuration (`.replit`)
```toml
[deployment]
deploymentTarget = "autoscale"
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]
```

- **Build command**: `vite build` (frontend) + `esbuild` (server bundle to `dist/index.js`)
- **Start command**: `node dist/index.js` — listens on port **23636** in production
- **Port mapping**: `localPort 23636 → externalPort 80`

## What Works
1. `npm run build` completes successfully (dist/index.js = 1.8MB)
2. `npm run start` boots the server cleanly on port 23636
3. Git is fully synced (local = origin/main)
4. The deployment config is valid and was used successfully before
5. The app runs correctly in development on port 5000

## The Problem
The Replit UI Publish/Deploy button does not initiate a new deployment. No build logs appear, no error messages are shown. The button appears to do nothing when clicked. This has persisted across multiple attempts and code changes.

## Production Runtime Errors (from deployed version logs)
These are in the **currently running** deployed version and are NOT blocking publish, but should be fixed:

### Error 1: Whisper API — Invalid file format
```
[AudioTranscribe] Error: Whisper API failed (400): Invalid file format.
Supported formats: ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
```
- Audio chunks named `.webm` are being rejected by OpenAI Whisper
- File: `server/routers/shadowModeRouter.ts` — audio transcription pipeline
- Likely cause: chunk data is too small or malformed when sent to the API

### Error 2: Bastion Intelligence — MySQL syntax in PostgreSQL
```
DrizzleQueryError: insert into `bastion_intelligence_sessions` (`id`, ...) values (default, ?, ...)
cause: Data truncated for column 'event_type' at row 1
```
- Using MySQL backtick syntax instead of PostgreSQL double-quotes
- File: `server/services/BastionIntelligenceService.ts` (or related router)
- The `event_type` column also has a value mismatch (enum truncation)

### Error 3: Auth — Missing session cookie
```
[Auth] Missing session cookie
```
- Health check / webhook endpoints being hit without auth context
- Non-critical but noisy in logs

## Steps to Investigate the Publish Issue on Replit
1. **Check Replit account status** — Verify the plan supports Autoscale deployments (requires paid plan)
2. **Check Replit deployment limits** — Some plans have deployment quotas
3. **Try manual redeploy** — In the Replit Shell, run: `replit deploy` (if available)
4. **Check `.replit` file integrity** — Ensure no hidden characters or syntax issues
5. **Try toggling deployment target** — Change to `static` then back to `autoscale`
6. **Clear browser cache** — The Replit UI may have cached a stale state
7. **Contact Replit support** — If all else fails, reference Deployment ID `4b80a6ba-d5e8-4e07-9979-e999e11345d5` and the last successful deploy timestamp

## Key Files
| File | Purpose |
|------|---------|
| `.replit` | Deployment + workflow config |
| `package.json` | Build/start scripts |
| `server/_core/index.ts` | Express server entry point |
| `vite.config.ts` | Vite build config |
| `server/routers/shadowModeRouter.ts` | Shadow mode + audio transcription |
| `drizzle/schema.ts` | Database schema |

## Build Verification Commands
```bash
npm run build        # Should produce dist/index.js (~1.8MB)
npm run start        # Should listen on port 23636
```
