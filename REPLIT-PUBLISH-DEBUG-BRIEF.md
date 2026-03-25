# CuraLive — Replit Publish Issue: Diagnostic Brief for GitHub Codespaces

## Repository
- **Repo**: github.com/davecameron187-sys/curalive-platform
- **Branch**: `main`
- **Latest commit**: `add3d7c`

---

## Summary
CuraLive is unable to publish new deployments on Replit. The Publish button in the Replit UI is unresponsive. The last successful publish was **2026-03-25T09:47:42Z**.

---

## Critical Finding: What Changed

The **only config change** between working and broken state is the `deploymentTarget` in `.replit`:

| Setting | Last Working Publish (commit `afd0d28`) | After Publish Broke |
|---------|----------------------------------------|---------------------|
| `deploymentTarget` | `"vm"` | Changed to `"autoscale"` |
| `build` | `["npm", "run", "build"]` | Unchanged |
| `run` | `["npm", "run", "start"]` | Unchanged |

The target has been reverted to `"vm"` but publishing still fails. This suggests the Replit deployment state may be stuck or corrupted from the target switch.

---

## Timeline of Events

| Time (UTC) | Commit | Event |
|------------|--------|-------|
| 08:47 | `f380c25` | ✅ Publish successful (`deploymentTarget = "vm"`) |
| 09:47 | `afd0d28` | ✅ Publish successful (`deploymentTarget = "vm"`) — **LAST WORKING** |
| 10:00 | `47017ec` | ✅ Publish successful (`deploymentTarget = "vm"`) |
| 10:56 | `b788770` | Major DB migration: MySQL → PostgreSQL (schema, db.ts, 58 files changed) |
| 12:48–13:20 | Various | PostgreSQL fixes, download tabs, email report rebuild |
| ~13:30 | — | `deploymentTarget` changed from `"vm"` to `"autoscale"` (via agent tool) |
| 13:30+ | — | ❌ All publish attempts fail — button unresponsive |
| 15:13 | — | `deploymentTarget` reverted to `"vm"` |
| 15:13+ | — | ❌ Still failing |

---

## What Was Working at Last Successful Publish

### `.replit` (exact content at commit `afd0d28`)
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

### `package.json` scripts (at last publish)
```json
{
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build --logLevel warn && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

### Key differences since last publish
- **2 new packages added**: `pg` and `@types/pg` (PostgreSQL driver)
- **58 files changed** across the full MySQL → PostgreSQL migration
- **`pnpm-lock.yaml`** updated with 134 line changes
- **No `.replit` structural changes** (only the `deploymentTarget` value was toggled)

---

## What Works Right Now
1. ✅ `npm run build` — Produces `dist/index.js` (1.8MB) successfully
2. ✅ `npm run start` — Server boots cleanly on port 23636
3. ✅ Git fully synced (local = GitHub `main`)
4. ✅ `.replit` config is valid TOML and matches last working state
5. ✅ App runs correctly in development on port 5000
6. ✅ Production database (PostgreSQL 16.10) is healthy

---

## Production Runtime Errors (in currently deployed old code)
These are NOT blocking publish but should be fixed in next deploy:

### 1. Whisper API — Invalid file format (recurring)
```
[AudioTranscribe] Error: Whisper API failed (400): Invalid file format.
```
- **Fix applied in commit `add3d7c`**: Updated audio transcription handling

### 2. Bastion Intelligence — MySQL backtick syntax
```
DrizzleQueryError: insert into `bastion_intelligence_sessions` ...
cause: Data truncated for column 'event_type' at row 1
```
- **Fix applied in commit `add3d7c`**: Changed `event_type` to text column

### 3. Auth — Missing session cookie (noisy but non-critical)
```
[Auth] Missing session cookie
```
- Webhook/health check endpoints hit without auth context

---

## Possible Root Causes for Publish Failure

### Theory 1: Deployment state corrupted by target switch
The `deploymentTarget` was changed from `"vm"` to `"autoscale"` and back. Replit's internal deployment state may be stuck in an inconsistent state between the two targets. **Resolution**: Contact Replit support to reset deployment state.

### Theory 2: Replit account/plan limitation
The `"autoscale"` target may have triggered a plan check that put the deployment in a locked state. Even after reverting to `"vm"`, the lock persists. **Resolution**: Check account billing/plan status in Replit dashboard.

### Theory 3: Cached deployment manifest
Replit caches the deployment image. The target switch may have invalidated the cache in a way that prevents new deploys. **Resolution**: Try changing a port number or workflow name slightly to force a fresh deployment pipeline.

### Theory 4: Large changeset since last deploy
58 files changed with a major DB migration. The deploy builder may be encountering an issue with the new `pg` package or lockfile. **Resolution**: Verify `pnpm install` completes cleanly in a fresh environment.

---

## Recommended Debug Steps (in order)

1. **Verify `.replit` file byte-for-byte** — Check for hidden characters or BOM:
   ```bash
   xxd .replit | head -5
   file .replit
   ```

2. **Test clean install + build**:
   ```bash
   rm -rf node_modules && pnpm install && npm run build
   ```

3. **Try Replit CLI deploy** (if available):
   ```bash
   replit deploy
   ```

4. **Check Replit deployment dashboard** — Look for stuck/pending deployments at:
   `https://replit.com/@<username>/<repl-name> → Deployments tab`

5. **Force new deployment state** — Make a trivial `.replit` change (e.g., add a comment) to trigger Replit's config watcher

6. **Contact Replit support** with:
   - Last successful Deployment ID: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`
   - Last successful deploy time: `2026-03-25T09:47:42Z`
   - Symptom: Publish button unresponsive after `deploymentTarget` was changed from `vm` to `autoscale` and back

---

## Key Files
| File | Purpose |
|------|---------|
| `.replit` | Deployment + workflow config |
| `package.json` | Build/start scripts (build + start) |
| `pnpm-lock.yaml` | Dependency lockfile |
| `server/_core/index.ts` | Express server entry (port 23636 in prod) |
| `vite.config.ts` | Vite frontend build config |
| `drizzle/schema.ts` | PostgreSQL database schema |
| `server/db.ts` | DB connection + rawSql() compatibility layer |

## Build Verification
```bash
npm run build        # Should produce dist/index.js (~1.8MB)
npm run start        # Should listen on port 23636
```
