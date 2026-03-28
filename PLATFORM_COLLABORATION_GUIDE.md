# Platform Collaboration Guide
**Manus ↔ ChatGPT ↔ Replit Sync Framework**

**Date:** March 28, 2026  
**Status:** Ready for Deployment  
**Sync Frequency:** Every 6 hours (automated)

---

## Overview

This guide establishes the collaboration framework between three platforms:

- **Manus** — Development environment, database, production deployment
- **ChatGPT** — Code review, architecture decisions, feature implementation
- **Replit** — Rapid prototyping, integration testing, deployment validation

All three platforms sync via GitHub with automated workflows.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                   (chorus-ai on GitHub)                      │
│                                                               │
│  ├─ main branch (production-ready code)                     │
│  ├─ ManusChatgpt branch (development)                       │
│  ├─ chatgpt/* branches (ChatGPT features)                   │
│  └─ replit/* branches (Replit features)                     │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    (pull/push)          (pull/push)          (pull/push)
         │                    │                    │
    ┌────────────┐      ┌──────────────┐      ┌──────────┐
    │   Manus    │      │   ChatGPT    │      │  Replit  │
    │            │      │              │      │          │
    │ • Database │      │ • Code       │      │ • Tests  │
    │ • Webhooks │      │ • Reviews    │      │ • Deploy │
    │ • Deploy   │      │ • Features   │      │ • Verify │
    └────────────┘      └──────────────┘      └──────────┘
```

---

## Sync Workflow

### Automated Sync (Every 6 Hours)

1. **Manus Checkpoint** → GitHub `main` branch
   - Triggered by `webdev_save_checkpoint`
   - Pushes ManusChatgpt branch to GitHub
   - GitHub Actions runs tests and builds

2. **GitHub Tests** → All platforms notified
   - TypeScript check
   - Unit tests
   - Code quality scan
   - Code-truth verification

3. **ChatGPT & Replit Pull** → Latest code
   - `git pull origin main` gets latest changes
   - Automatic merge if no conflicts
   - Manual resolution if conflicts exist

### Manual Sync (On Demand)

**ChatGPT Feature → GitHub:**
```bash
git checkout -b chatgpt/feature-name
# Make changes
git add .
git commit -m "feat: Description"
git push origin chatgpt/feature-name
# Create Pull Request on GitHub
```

**Replit Feature → GitHub:**
```bash
git checkout -b replit/feature-name
# Make changes
git add .
git commit -m "feat: Description"
git push origin replit/feature-name
# Create Pull Request on GitHub
```

**Manus Merge → Production:**
```bash
# After PR approval
git checkout main
git pull origin main
git merge chatgpt/feature-name
# Tests run automatically
# Deploy to production if all pass
```

---

## Code Review Process

### Before Merging to Main

**1. Code Quality Checks**
- ✅ TypeScript: `pnpm tsc --noEmit` (zero errors)
- ✅ Tests: `pnpm test` (all passing)
- ✅ Build: `pnpm build` (no errors)
- ✅ Linting: `pnpm lint` (no warnings)

**2. Code-Truth Verification**
- ✅ Is this real implementation or mock data?
- ✅ Are backend procedures actually implemented?
- ✅ Do tests prove the workflow?
- ✅ Is this production-ready?

**3. Documentation**
- ✅ README updated if needed
- ✅ Code comments for complex logic
- ✅ todo.md marked [x] for completed items
- ✅ CHANGELOG updated

**4. Review Approval**
- ✅ At least one approval from another platform
- ✅ All conversations resolved
- ✅ All checks passing

---

## Branch Naming Convention

| Pattern | Purpose | Example |
|---------|---------|---------|
| `main` | Production-ready code | `main` |
| `ManusChatgpt` | Development branch | `ManusChatgpt` |
| `chatgpt/*` | ChatGPT features | `chatgpt/real-transcript-streaming` |
| `replit/*` | Replit features | `replit/load-testing` |
| `fix/*` | Bug fixes | `fix/operator-console-crash` |
| `docs/*` | Documentation | `docs/deployment-guide` |

---

## Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test additions
- `chore:` Build/tooling

**Examples:**
```
feat(operator-console): Implement real transcript streaming from Recall.ai

- Fetch transcript segments from Recall.ai webhook
- Wire Ably real-time subscriptions
- Remove mock data generators
- Add integration tests

Fixes #42
```

---

## Conflict Resolution

**If merge conflicts occur:**

```bash
# Pull latest
git pull origin main

# Resolve conflicts in editor
# Look for <<<<<<, ======, >>>>>> markers

# After resolving
git add .
git commit -m "fix: Resolve merge conflicts"
git push origin your-branch
```

**Conflict Prevention:**
- Pull before pushing: `git pull origin main`
- Commit frequently: Smaller commits = fewer conflicts
- Communicate: Tell others what you're working on

---

## Deployment Pipeline

### Staging Deployment (Automatic)

**Trigger:** Push to `main` or `ManusChatgpt`

**Steps:**
1. GitHub Actions runs tests
2. If all pass: Deploy to staging
3. Staging URL: `https://staging.chorusai.manus.space`
4. Run integration tests
5. Notify all platforms

### Production Deployment (Manual)

**Trigger:** Manual approval from Manus

**Steps:**
1. Create release branch: `git checkout -b release/v1.0.0`
2. Update version numbers
3. Update CHANGELOG
4. Create Pull Request
5. Get approvals from ChatGPT and Replit
6. Merge to main
7. Tag release: `git tag v1.0.0`
8. Push tag: `git push origin v1.0.0`
9. Deploy to production

---

## Collaboration Standards

### Communication

- **GitHub Issues** — Bug reports, feature requests
- **Pull Request Comments** — Code review feedback
- **Commit Messages** — Clear, descriptive messages
- **Documentation** — Keep README and guides updated

### Code Standards

- **TypeScript** — Strict mode, no `any` types
- **Testing** — 80%+ coverage required
- **Performance** — <1s response time for real-time features
- **Security** — No hardcoded secrets, rate limiting on APIs
- **Accessibility** — WCAG 2.1 AA compliance

### Review Standards

- **Response Time** — Review within 24 hours
- **Thoroughness** — Check code, tests, and documentation
- **Constructiveness** — Provide suggestions, not just criticism
- **Code-Truth** — Verify claims with code inspection

---

## Platform Responsibilities

### Manus
- ✅ Database management and migrations
- ✅ Production deployment and monitoring
- ✅ Infrastructure and DevOps
- ✅ Security and compliance
- ✅ Performance optimization
- ✅ Webhook integrations (Recall.ai, Ably)

### ChatGPT
- ✅ Architecture design and review
- ✅ Feature implementation and coding
- ✅ Code quality and best practices
- ✅ Documentation and technical writing
- ✅ Integration testing
- ✅ Performance analysis

### Replit
- ✅ Rapid prototyping
- ✅ Load testing and stress testing
- ✅ Integration validation
- ✅ Deployment verification
- ✅ User acceptance testing
- ✅ Bug discovery and reporting

---

## Sync Status Dashboard

**Location:** `SYNC_STATUS.md` (root directory)

**Updated:** After each sync cycle

**Contents:**
- Last commit from each platform
- Branch status
- Test results
- Deployment status
- Known issues

**Example:**
```markdown
# Sync Status — March 28, 2026

| Platform | Last Commit | Status | Tests | Deploy |
|----------|-------------|--------|-------|--------|
| Manus | a740e7f | ✅ Synced | ✅ 641/641 | ✅ Ready |
| ChatGPT | (awaiting) | ⏳ Pending | - | - |
| Replit | (awaiting) | ⏳ Pending | - | - |

**Next Sync:** 2026-03-28 18:00 UTC
```

---

## Troubleshooting

### "Merge conflict"
**Solution:** Resolve manually, commit, push
```bash
git status  # See conflicted files
# Edit files to resolve
git add .
git commit -m "fix: Resolve conflicts"
```

### "Permission denied"
**Solution:** Check GitHub PAT and credentials
```bash
git config --global credential.helper store
# Re-enter credentials when prompted
```

### "Branch protection rule violation"
**Solution:** Create Pull Request instead of direct push
```bash
git push origin your-branch
# Go to GitHub and create PR
```

### "Tests failing"
**Solution:** Fix code and push again
```bash
pnpm test  # See which tests fail
# Fix the code
git add .
git commit -m "fix: Fix failing tests"
git push origin your-branch
```

---

## Quick Commands

```bash
# Clone repository
git clone https://github.com/username/chorus-ai.git
cd chorus-ai

# Create feature branch
git checkout -b platform/feature-name

# See changes
git status
git diff

# Commit and push
git add .
git commit -m "feat: Description"
git push origin platform/feature-name

# Pull latest
git pull origin main

# Switch branches
git checkout main

# View history
git log --oneline

# Delete branch
git branch -d branch-name
git push origin --delete branch-name
```

---

## Getting Help

**For GitHub issues:**
1. Check existing issues first
2. Create new issue with clear description
3. Include error messages and steps to reproduce
4. Tag relevant platform: `@manus`, `@chatgpt`, `@replit`

**For sync issues:**
1. Run `git status` to see current state
2. Check GitHub Actions logs
3. Review recent commits
4. Contact Manus team

**For deployment issues:**
1. Check staging logs
2. Review recent changes
3. Rollback if needed
4. Create bug report

---

## Success Metrics

**Collaboration Health:**
- ✅ Sync success rate: >95%
- ✅ Code review turnaround: <24 hours
- ✅ Test pass rate: >95%
- ✅ Deployment success rate: >90%
- ✅ Zero merge conflicts per week

**Code Quality:**
- ✅ TypeScript errors: 0
- ✅ Test coverage: >80%
- ✅ Code review approvals: 100%
- ✅ Production bugs: <1 per week

---

**Collaboration Framework Ready!**

All three platforms can now work together seamlessly via GitHub with automated sync, code review, testing, and deployment workflows.

**Next Step:** Create GitHub repository and push ManusChatgpt branch.
