# CuraLive — GitHub Custodian Migration Brief

## Repository
- **Repo**: `github.com/davecameron187-sys/curalive-platform`
- **Canonical branch**: `main`

---

## Current State (as of this commit)

### Branches Created
| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | CuraLive production deployment | Active, all code current |
| `shadow-mode` | Shadow Mode deployment | Created, synced with main |
| `develop` | Integration/staging for active work | Created, synced with main |

### CI/CD Workflows Created
| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | PRs to main/shadow-mode/develop, pushes to develop | Build, lint, type check |
| `.github/workflows/deploy-production.yml` | Push to `main` | Production build verify + release tag |
| `.github/workflows/deploy-shadow.yml` | Push to `shadow-mode` | Shadow build verify + release tag |

### Configuration Files Added
| File | Purpose |
|------|---------|
| `.devcontainer/devcontainer.json` | GitHub Codespaces container config (Node 20 + PostgreSQL 16) |
| `.devcontainer/setup.sh` | Auto-setup script for Codespaces |
| `.env.example` | Environment variable template (no secrets) |
| `.env.codespace` | Pre-filled template for Codespace local PostgreSQL |
| `CODESPACE-SETUP.md` | Quick-start guide for running in Codespaces |
| `.github/BRANCH_PROTECTION.md` | Instructions for setting up branch protection rules |

---

## Branching + Promotion Model

```
feature-branch ──PR──> develop ──PR──> shadow-mode ──PR──> main
                        (staging)      (shadow deploy)     (production)
```

1. **Feature branches** → PR into `develop`
2. **Validated changes** → PR from `develop` into `shadow-mode`
3. **Approved release** → PR from `shadow-mode` into `main`

---

## Deployment Architecture

### Option A: GitHub Codespaces (Ready Now)
CuraLive can run fully in GitHub Codespaces with zero Replit dependency:
- Open Codespace on any branch
- PostgreSQL 16 is provisioned automatically
- Set API keys in `.env`
- Run `pnpm run dev` (port 5000) or `npm run build && npm run start` (port 23636)

### Option B: Replit (Pending Platform Fix)
Replit deployment is currently blocked by platform-side issue (`Failed to fetch PostgreSQL major version`). When resolved:
- **Deployment A (CuraLive)**: tracks `main` branch
- **Deployment B (Shadow Mode)**: tracks `shadow-mode` branch
- Replit should sync from GitHub, not accept direct edits

### Option C: Any VPS / Cloud Provider
The app is standard Node.js + PostgreSQL. To deploy anywhere:
```bash
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
cp .env.example .env   # Fill in secrets
pnpm install
npm run build
npm run start           # Listens on port 23636
```

---

## Environment Variables by Deployment

### Production (`main`)
| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Production PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI modules |
| `RECALL_AI_API_KEY` | Yes | Recall.ai for meeting bot integration |
| `MUX_WEBHOOK_SECRET` | No | Mux webhook verification |
| `RESEND_API_KEY` | No | Email delivery via Resend |
| `APP_URL` | Yes | Public URL for webhook callbacks |
| `NODE_ENV` | Auto | Set to `production` |

### Shadow Mode (`shadow-mode`)
Same variables, but with separate values (different database, possibly different API keys for isolation).

### Secrets Handling
- Real secrets go in GitHub Environment Secrets (Settings → Environments → production / shadow)
- Or in hosting platform's secret manager (Replit Secrets, Codespace Secrets, etc.)
- Only `.env.example` with placeholders is committed to the repo
- `.env` is in `.gitignore`

---

## Governance Rules
1. No direct push to `main`
2. PR review required for merges to `main`
3. CI checks (build) must pass before merge
4. Hotfixes go through GitHub branch + PR flow
5. Rollback by reverting merge commit in GitHub + redeploy

---

## Replit-Specific Notes

### Variables NOT Needed Outside Replit
These are auto-provided by Replit and the code handles their absence gracefully:
- `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` → Falls back to direct OpenAI API
- `REPLIT_DEV_DOMAIN` / `REPLIT_DEPLOYMENT_URL` → Falls back to `APP_URL`
- `REPL_ID` → Only used by dev tooling

### Replit Deployment Config (`.replit`)
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```
This file is managed by Replit and should NOT be edited from GitHub.

---

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express + tRPC
- **Database**: PostgreSQL 16 (Drizzle ORM)
- **AI**: OpenAI GPT-4 + Whisper
- **Meeting Integration**: Recall.ai
- **Runtime**: Node.js 20
- **Package Manager**: pnpm 10

## Ports
- **Development**: Port 5000
- **Production**: Port 23636

## Build Commands
```bash
pnpm install                    # Install dependencies
npm run build                   # Vite build + esbuild server bundle
npm run start                   # Production server (port 23636)
pnpm run dev                    # Development server (port 5000)
pnpm run db:push                # Push schema to database
```

---

## Immediate Next Actions
1. ✅ Branches created: `main`, `shadow-mode`, `develop`
2. ✅ CI/CD workflows created
3. ✅ Codespaces configuration added
4. ✅ Environment templates created
5. ⬜ Configure branch protection rules in GitHub Settings (see `.github/BRANCH_PROTECTION.md`)
6. ⬜ Set up GitHub Environment Secrets for `production` and `shadow` environments
7. ⬜ Test Codespace launch on `shadow-mode` branch
8. ⬜ When Replit is fixed: connect Replit deployments to track GitHub branches

---

## Rollback Plan
1. Identify last known-good commit or tag (e.g., `v20260325.094742`)
2. Revert problematic merge in GitHub
3. Push revert to `main` or `shadow-mode`
4. Deployment auto-triggers from CI/CD
5. Verify deployment reflects reverted branch head

## Last Known Successful Deployment (Replit)
- **Deployment ID**: `4b80a6ba-d5e8-4e07-9979-e999e11345d5`
- **Timestamp**: `2026-03-25T09:47:42Z`
- **Commit**: `afd0d28`
