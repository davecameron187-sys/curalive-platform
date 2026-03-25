# CuraLive Platform — Status Brief
**Date**: 25 March 2026

---

## Current Situation

CuraLive is a real-time investor events intelligence platform. Today we completed significant code updates and prepared the platform for GitHub-first operations. Replit publishing is currently blocked by a platform-side issue — the code itself builds and runs correctly.

---

## What Was Done Today

### Code Updates (all pushed to GitHub `main`)
1. **ComplianceEngine fixed** — PostgreSQL column names and timestamp comparisons corrected
2. **Recording & Transcription downloads** — MP3 and TXT download buttons added to Archives & Reports, with secure REST download endpoints
3. **Email reports rebuilt** — Full AI intelligence report now includes all 16 modules (executive summary, sentiment, compliance, key topics, speaker analysis, investor signals, Q&A, action items, communication score, risk factors, financials, sentiment arc, ESG, competitive intel, board summary, recommendations)
4. **Webhook URL handling improved** — Shadow Mode sessions now pass webhook base URL from client, with multiple fallback options
5. **Runtime error fixes synced** — Schema and audio transcription updates from Codespaces team integrated

### GitHub Infrastructure (all pushed)
1. **3 branches created and synced**: `main` (production), `shadow-mode` (shadow deployment), `develop` (staging)
2. **Codespaces configuration added** — `.devcontainer/` with Node 20 + PostgreSQL 16, auto-setup script, environment templates
3. **CI/CD workflow files prepared** — CI checks on PRs, production deploy on `main`, shadow deploy on `shadow-mode` (need manual upload to GitHub — see below)
4. **Branch protection rules documented**
5. **Environment variable templates** — `.env.example` and `.env.codespace` with all required keys listed

---

## What's Blocking

### Replit Publishing
- **Error**: `Failed to fetch PostgreSQL major version for development database`
- **Root cause**: Replit's deployment service cannot access the database binding during the publish process
- **Status**: This is a Replit platform issue, not a code issue. Build and start both succeed locally.
- **Action needed**: Contact Replit support with the message below

### GitHub Actions Workflow Files
- Replit's GitHub integration lacks the `workflow` scope to push `.github/workflows/` files
- **Action needed**: Manually create 3 files on GitHub from `GITHUB-WORKFLOWS-TO-ADD.md`

---

## Message for Replit Support

> We fixed repo config drift in `.replit` restoring autoscale deployment config. Build/start work locally, but publish fails with `Failed to fetch PostgreSQL major version for development database`. Please verify:
>
> 1. Deployment is using latest `main`
> 2. Development/deployment database binding is valid and healthy
> 3. `DATABASE_URL` is injected in deployment environment (not only workspace runtime)
> 4. Account/plan deployment DB quota and autoscale backend health
> 5. If needed, rebind or reprovision the deployment database for this repl
>
> Last successful deployment ID: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`
> Last successful deploy: `2026-03-25T09:47:42Z`
> Repo: `davecameron187-sys/curalive-platform` (branch: `main`)

---

## Manual Steps Remaining

| # | Action | Where | Time |
|---|--------|-------|------|
| 1 | Add 3 CI/CD workflow files | GitHub web UI (copy from `GITHUB-WORKFLOWS-TO-ADD.md`) | 5 min |
| 2 | Configure branch protection rules | GitHub Settings → Branches (see `BRANCH_PROTECTION.md`) | 5 min |
| 3 | Create GitHub Environments (`production`, `shadow`) with secrets | GitHub Settings → Environments | 5 min |
| 4 | Contact Replit support re: database binding | Replit support channel | 2 min |

---

## Running CuraLive Tonight (Without Replit)

Open a GitHub Codespace on `main`:
1. Go to `github.com/davecameron187-sys/curalive-platform`
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait ~5 minutes for container build
4. `cp .env.codespace .env` and add your API keys
5. `pnpm run db:push` to set up the database
6. `pnpm run dev` to start on port 5000

Full guide: `CODESPACE-SETUP.md` in the repo.

---

## Repository Structure

```
github.com/davecameron187-sys/curalive-platform
├── main          → CuraLive production
├── shadow-mode   → Shadow Mode deployment
├── develop       → Integration/staging
```

**Promotion flow**: Feature branches → PR to `develop` → PR to `shadow-mode` → PR to `main`

---

## Key Reference Documents (all in repo root)

| Document | Purpose |
|----------|---------|
| `GITHUB-CUSTODIAN-BRIEF.md` | Full migration/operating brief for GitHub as source of truth |
| `CODESPACE-SETUP.md` | Quick-start guide for Codespaces |
| `GITHUB-WORKFLOWS-TO-ADD.md` | CI/CD workflow files to add manually |
| `.github/BRANCH_PROTECTION.md` | Governance rules for branch protection |
| `REPLIT-PUBLISH-DEBUG-BRIEF.md` | Detailed publish issue diagnostic |
| `.env.example` | Environment variable template |
