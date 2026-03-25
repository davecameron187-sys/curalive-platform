# CuraLive — Replit Publish Issue: Diagnostic Brief

## CRITICAL WARNING FOR CODESPACES
**DO NOT modify the `.replit` file from GitHub.** Replit manages this file with special protections. External edits cause merge conflicts that cannot be resolved inside Replit. A previous Codespaces commit (`7a9ad46`) added a **duplicate `[deployment]` section** to `.replit` which had to be force-reverted. All `.replit` changes must be made from within the Replit editor only.

---

## Repository
- **Repo**: github.com/davecameron187-sys/curalive-platform
- **Branch**: `main`

## Problem
CuraLive cannot publish new deployments on Replit. The Publish button in the Replit UI is unresponsive. No build logs appear, no error messages shown. The last successful publish was **2026-03-25T09:47:42Z** (Deployment ID: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`).

---

## What Happened

### Timeline
| Time (UTC) | Event |
|------------|-------|
| 08:47 | Publish successful — `deploymentTarget = "vm"` |
| 09:47 | Publish successful — `deploymentTarget = "vm"` — **LAST WORKING** |
| 10:00 | Publish successful — `deploymentTarget = "vm"` |
| 10:56 | Major DB migration committed: MySQL → PostgreSQL (58 files, 2 new packages) |
| ~13:30 | `deploymentTarget` accidentally changed from `"vm"` to `"autoscale"` by Replit agent tool |
| 13:30+ | All publish attempts fail |
| ~15:13 | `deploymentTarget` reverted to `"vm"` |
| 15:13+ | Still failing |
| ~15:26 | Codespaces commit added duplicate `[deployment]` section to `.replit` — force-reverted |
| Current | `.replit` is back to exact working state but publishing still fails |

### The Only Config Change
Every successful publish used `deploymentTarget = "vm"`. The switch to `"autoscale"` broke it. Even after reverting, publishing remains broken — suggesting Replit's internal deployment state is stuck.

---

## Current `.replit` (verified correct — matches all successful publishes)
```toml
modules = ["nodejs-20", "web"]

[agent]
expertMode = true
integrations = ["github:1.0.0", "javascript_openai_ai_integrations:2.0.0"]

[nix]
channel = "stable-25_05"
packages = ["ffmpeg"]

[userenv]

[userenv.shared]
PORT = "5000"

[userenv.production]
AUTH_BYPASS = "true"

[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "NODE_ENV=development pnpm exec tsx watch server/_core/index.ts"
waitForPort = 5000

[workflows.workflow.metadata]
outputType = "webview"

[[ports]]
localPort = 5000
externalPort = 5000

[[ports]]
localPort = 5001
externalPort = 3002

[[ports]]
localPort = 23636
externalPort = 80

[[ports]]
localPort = 23637
externalPort = 3001

[deployment]
deploymentTarget = "vm"
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]
```

---

## What Works Right Now
- `npm run build` — Produces `dist/index.js` (1.8MB) successfully
- `npm run start` — Server boots on port 23636
- Git fully synced (local = GitHub `main`)
- `.replit` matches exact working state from last successful publish
- App runs correctly in development on port 5000
- PostgreSQL 16.10 database is healthy

---

## Build & Start Scripts (`package.json`)
```json
{
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build --logLevel warn && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

---

## Possible Root Causes

### 1. Deployment state corrupted by target switch (MOST LIKELY)
The `deploymentTarget` was switched from `"vm"` → `"autoscale"` → `"vm"`. Replit's internal deployment pipeline may be stuck between the two targets. The Replit UI may be looking for an autoscale deployment slot that doesn't exist on the current plan, while the config says `"vm"`.

### 2. Account/plan limitation triggered
Switching to `"autoscale"` may have triggered a plan check that locked the deployment pipeline. The lock may persist even after reverting to `"vm"`.

### 3. Cached deployment manifest
Replit caches deployment images. The target switch may have invalidated the cache in a way that prevents new deploys from being queued.

### 4. Stale deployment session in browser
The Replit UI may have cached a stale deployment session in the browser. A hard refresh or different browser may fix it.

---

## Recommended Actions

### From Replit (user should try these):
1. **Hard refresh** the Replit page (Ctrl+Shift+R / Cmd+Shift+R)
2. **Try a different browser** or incognito window
3. **Check the Deployments tab** in Replit sidebar for stuck/pending deployments
4. **Contact Replit support** with:
   - Last successful Deployment ID: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`
   - Last successful deploy: `2026-03-25T09:47:42Z`
   - Issue: Publish button unresponsive after `deploymentTarget` was changed from `"vm"` to `"autoscale"` and back
   - Request: Reset deployment state for this Repl

### From Codespaces (code fixes only):
- DO NOT touch `.replit`
- Fix any code-level issues that might affect the build or startup
- Verify `pnpm install && npm run build && npm run start` all work cleanly

---

## Production Runtime Errors (fix in code, will deploy when publish works)

### 1. Whisper API — Invalid file format
```
[AudioTranscribe] Error: Whisper API failed (400): Invalid file format.
```
- File: `server/audioTranscribe.ts`
- Fix applied in commit `add3d7c`

### 2. Bastion Intelligence — MySQL backtick syntax in PostgreSQL
```
DrizzleQueryError: insert into `bastion_intelligence_sessions` ...
cause: Data truncated for column 'event_type'
```
- File: `server/services/BastionIntelligenceService.ts`
- Fix applied in commit `add3d7c` (changed `event_type` to text column)

### 3. Auth — Missing session cookie (non-critical, noisy)
```
[Auth] Missing session cookie
```
- Webhook/health check endpoints being hit without auth — cosmetic noise

---

## Key Files
| File | Purpose |
|------|---------|
| `.replit` | **DO NOT EDIT FROM CODESPACES** — Deployment + workflow config |
| `package.json` | Build (`vite build + esbuild`) and start (`node dist/index.js`) scripts |
| `pnpm-lock.yaml` | Dependency lockfile (includes new `pg` package) |
| `server/_core/index.ts` | Express server entry point (port 23636 in production) |
| `vite.config.ts` | Vite frontend build config |
| `drizzle/schema.ts` | PostgreSQL database schema |
| `server/db.ts` | DB connection + rawSql() compatibility layer |
| `server/audioTranscribe.ts` | Audio transcription (Whisper API) |
| `server/services/BastionIntelligenceService.ts` | Bastion intelligence session management |

## Build Verification
```bash
pnpm install
npm run build        # Should produce dist/index.js (~1.8MB)
npm run start        # Should listen on port 23636
```
