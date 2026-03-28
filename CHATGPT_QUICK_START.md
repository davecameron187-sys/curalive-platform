# ChatGPT Quick Start Guide

## How to Access and Pull Latest Chorus.AI Updates

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/chorus-ai.git
cd chorus-ai
git checkout ManusChatgpt
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Add required environment variables (from Manus Management UI → Settings → Secrets):
# - DATABASE_URL
# - JWT_SECRET
# - VITE_APP_ID
# - OAUTH_SERVER_URL
# - VITE_OAUTH_PORTAL_URL
# - BUILT_IN_FORGE_API_URL
# - BUILT_IN_FORGE_API_KEY
# - VITE_FRONTEND_FORGE_API_KEY
# - VITE_FRONTEND_FORGE_API_URL
```

### Step 4: Start Development Server

```bash
pnpm dev
```

Server will run at `http://localhost:3000`

---

## Pulling Latest Updates from Manus

### Quick Update (Every 2-3 Days)

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Pull updates
git pull origin ManusChatgpt

# 3. Install any new dependencies
pnpm install

# 4. Restart dev server
# (Press Ctrl+C and run: pnpm dev)
```

### After Major Release (New Checkpoint)

```bash
# 1. Pull latest changes
git pull origin ManusChatgpt

# 2. Review what changed
git log --oneline HEAD~5..HEAD

# 3. Check modified files
git diff HEAD~5..HEAD --name-only

# 4. Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 5. Run tests
pnpm test

# 6. Restart dev server
pnpm dev
```

---

## Key Directories & Files

| Path | Purpose |
|------|---------|
| `server/compliance/rulesEngine.ts` | Custom compliance rules engine |
| `server/middleware/rateLimiter.ts` | Rate limiting implementation |
| `server/middleware/auditLogger.ts` | Audit logging system |
| `server/routers/complianceRules.ts` | Compliance rules API (tRPC) |
| `client/src/pages/ComplianceRulesAdmin.tsx` | Compliance rules admin UI |
| `infrastructure/terraform/` | Production infrastructure setup |
| `REVISED_ROADMAP.md` | Strategic priorities |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Deployment instructions |
| `SECURITY_HARDENING_GUIDE.md` | Security implementation details |
| `CUSTOM_COMPLIANCE_RULES_GUIDE.md` | Compliance rules architecture |

---

## Common Tasks

### Run Tests

```bash
pnpm test
```

### Check TypeScript Errors

```bash
pnpm tsc --noEmit
```

### Format Code

```bash
pnpm format
```

### Build for Production

```bash
pnpm build
```

### Check Git Status

```bash
git status
git log --oneline -10
```

---

## Latest Completed Features (Checkpoint: b1f31742)

✅ Custom Compliance Rules Engine  
✅ Rate Limiting Middleware  
✅ Audit Logging System  
✅ Database Query Optimization (25+ indexes)  
✅ Security Hardening Framework  
✅ Performance Optimization Plan  
✅ Production Infrastructure-as-Code (Terraform)  
✅ Operational Runbooks  

---

## Next Phases (In Progress)

🔄 Production Deployment Infrastructure  
🔄 Mobile App Build & Submission  
🔄 Final Integration Testing  

---

## Need Help?

1. **Read the Guides:**
   - `REVISED_ROADMAP.md` — Strategic overview
   - `PRODUCTION_DEPLOYMENT_GUIDE.md` — Infrastructure setup
   - `SECURITY_HARDENING_GUIDE.md` — Security details
   - `CUSTOM_COMPLIANCE_RULES_GUIDE.md` — Compliance system

2. **Check the Code:**
   - Review `server/compliance/rulesEngine.ts` for rules engine
   - Review `server/middleware/` for security middleware
   - Review `infrastructure/` for deployment setup

3. **Run Tests:**
   - `pnpm test` — Run all tests
   - Check test output for specific errors

4. **Check Logs:**
   - `.manus-logs/devserver.log` — Server startup logs
   - `.manus-logs/browserConsole.log` — Client-side errors

---

## GitHub Workflow

### Pulling Updates

```bash
# Check for new commits
git fetch origin
git log --oneline origin/ManusChatgpt -5

# Pull latest
git pull origin ManusChatgpt
```

### Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub (target: ManusChatgpt)
```

### Merging Back to ManusChatgpt

```bash
# After PR approval
git checkout ManusChatgpt
git pull origin ManusChatgpt
git merge feature/your-feature
git push origin ManusChatgpt
```

---

## Production Deployment

When ready to deploy:

1. **Review Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
2. **Set Up Infrastructure:** Run Terraform scripts in `infrastructure/terraform/`
3. **Configure Secrets:** Add production environment variables
4. **Run Tests:** `pnpm test` and verify all tests pass
5. **Build:** `pnpm build`
6. **Deploy:** Follow CI/CD pipeline in deployment guide

---

**Last Updated:** March 28, 2026  
**Status:** Production Ready ✅  
**Current Branch:** ManusChatgpt  
**Latest Checkpoint:** b1f31742
