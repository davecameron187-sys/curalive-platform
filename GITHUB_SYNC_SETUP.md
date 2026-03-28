# GitHub Sync Setup Guide
**Date:** March 28, 2026  
**Purpose:** Enable seamless syncing between Manus, ChatGPT, and Replit  
**Status:** Ready for Configuration

---

## Quick Start

### Step 1: Create Public GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create new repository:
   - **Name:** `chorus-ai` (or your preferred name)
   - **Description:** "Chorus.AI — Live Event Intelligence Platform"
   - **Visibility:** Public (for ChatGPT/Replit access)
   - **Initialize:** No (we'll push existing code)

3. Copy the repository URL (e.g., `https://github.com/username/chorus-ai.git`)

### Step 2: Add GitHub Remote to Manus Project

```bash
cd /home/ubuntu/chorus-ai

# Add GitHub as new remote
git remote add github https://github.com/username/chorus-ai.git

# Verify remotes
git remote -v
# Should show:
# origin    s3://vida-prod-gitrepo/... (Manus S3 remote)
# github    https://github.com/username/chorus-ai.git (GitHub remote)
```

### Step 3: Push ManusChatgpt Branch to GitHub

```bash
# Push ManusChatgpt branch to GitHub
git push github ManusChatgpt:main

# Verify push succeeded
git branch -r
# Should show: github/main
```

### Step 4: Configure ChatGPT Access

**For ChatGPT to pull updates:**

```bash
# ChatGPT clone command:
git clone https://github.com/username/chorus-ai.git
cd chorus-ai
git checkout main  # ManusChatgpt branch is now main

# To pull latest updates from Manus:
git pull origin main
```

**ChatGPT Workflow:**
1. Clone the repository
2. Create feature branch: `git checkout -b chatgpt/feature-name`
3. Make changes and commit
4. Push to GitHub: `git push origin chatgpt/feature-name`
5. Create Pull Request for review

### Step 5: Configure Replit Access

**For Replit to pull updates:**

```bash
# Replit clone command:
git clone https://github.com/username/chorus-ai.git
cd chorus-ai

# To pull latest updates:
git pull origin main
```

**Replit Workflow:**
1. Clone the repository
2. Create feature branch: `git checkout -b replit/feature-name`
3. Make changes and commit
4. Push to GitHub: `git push origin replit/feature-name`
5. Create Pull Request for review

### Step 6: Set Up Automated Sync (Optional)

**Manus → GitHub Sync:**

Create a GitHub Actions workflow in `.github/workflows/sync-from-manus.yml`:

```yaml
name: Sync from Manus

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Add Manus remote
        run: |
          git remote add manus s3://vida-prod-gitrepo/webdev-git/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3
          
      - name: Fetch from Manus
        run: git fetch manus ManusChatgpt
        
      - name: Merge Manus updates
        run: |
          git merge manus/ManusChatgpt --allow-unrelated-histories || true
          
      - name: Push to GitHub
        run: git push origin main
```

---

## Collaboration Workflow

### For All Platforms

**Daily Sync:**
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b platform/feature-name

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: Add feature description"

# Push to GitHub
git push origin platform/feature-name

# Create Pull Request on GitHub for review
```

**Merging Changes:**
1. Create Pull Request on GitHub
2. Request review from other platforms
3. Address feedback
4. Merge to main when approved
5. All platforms pull latest: `git pull origin main`

### Branch Naming Convention

- **Manus:** `manus/feature-name` or checkpoint commits
- **ChatGPT:** `chatgpt/feature-name`
- **Replit:** `replit/feature-name`
- **Bugfixes:** `fix/bug-description`
- **Documentation:** `docs/topic-name`

### Commit Message Convention

```
<type>: <description>

<optional body>

<optional footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test additions/changes
- `chore:` Build/tooling changes

**Examples:**
```
feat: Implement real transcript streaming from Recall.ai
fix: Remove mock data generators from OperatorConsole
docs: Add code-truth audit for Phase 3 implementation
refactor: Optimize Q&A moderation performance
```

---

## Conflict Resolution

**If merge conflicts occur:**

```bash
# Pull latest
git pull origin main

# Resolve conflicts in your editor
# Look for <<<<<<, ======, >>>>>> markers

# After resolving
git add .
git commit -m "fix: Resolve merge conflicts"
git push origin your-branch

# Update Pull Request automatically
```

---

## Code Review Process

**Before Merging:**

1. **Code Quality:**
   - Run TypeScript check: `pnpm tsc --noEmit`
   - Run tests: `pnpm test`
   - No console errors or warnings

2. **Code-Truth Verification:**
   - Is this real implementation or mock data?
   - Are backend procedures actually implemented?
   - Are tests proving the workflow?
   - Is this production-ready?

3. **Documentation:**
   - Updated README if needed
   - Added code comments for complex logic
   - Updated todo.md with completed items

4. **Review Approval:**
   - At least one approval from another platform
   - All conversations resolved
   - All checks passing

---

## Troubleshooting

### "fatal: invalid credentials"
**Solution:** GitHub CLI needs authentication
```bash
gh auth login
# Follow prompts to authenticate
```

### "Merge conflict"
**Solution:** Resolve conflicts manually
```bash
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "fix: Resolve conflicts"
```

### "Branch protection rule violation"
**Solution:** Create Pull Request instead of direct push
```bash
git push origin your-branch
# Go to GitHub and create Pull Request
```

### "Remote rejected"
**Solution:** Pull latest changes first
```bash
git pull origin main
git push origin your-branch
```

---

## GitHub Repository Settings

**Recommended Configuration:**

### Branch Protection (main branch)

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging (1 approval)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require code reviews from code owners

### Collaborators

1. Go to Settings → Collaborators
2. Add:
   - ChatGPT user/team
   - Replit user/team
   - Any other developers

### Secrets (for CI/CD)

1. Go to Settings → Secrets and variables → Actions
2. Add any required secrets:
   - `MANUS_GIT_TOKEN` (for Manus sync)
   - `DEPLOYMENT_TOKEN` (for deployments)
   - etc.

---

## Sync Status Dashboard

**Create a status file to track sync health:**

File: `SYNC_STATUS.md`

```markdown
# GitHub Sync Status

**Last Updated:** [timestamp]

| Platform | Last Commit | Branch | Status |
|----------|-------------|--------|--------|
| Manus | [commit hash] | ManusChatgpt | ✅ Synced |
| ChatGPT | [commit hash] | main | ✅ Updated |
| Replit | [commit hash] | main | ✅ Updated |

**Next Sync:** [scheduled time]
```

Update this file after each sync to track collaboration health.

---

## Quick Reference

### Common Commands

```bash
# Clone repository
git clone https://github.com/username/chorus-ai.git

# Create feature branch
git checkout -b platform/feature-name

# See changes
git status
git diff

# Stage and commit
git add .
git commit -m "feat: Description"

# Push to GitHub
git push origin platform/feature-name

# Pull latest
git pull origin main

# Switch branches
git checkout main
git checkout -b new-branch

# View commit history
git log --oneline

# View branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

---

## Support

**For GitHub sync issues:**
1. Check this guide first
2. Run `git status` to see current state
3. Check GitHub repository settings
4. Review branch protection rules
5. Contact repository owner for access issues

---

**Setup Complete!**

All three platforms (Manus, ChatGPT, Replit) can now collaborate on GitHub with:
- ✅ Centralized code repository
- ✅ Pull request workflow for code review
- ✅ Branch protection for quality control
- ✅ Automated sync capabilities
- ✅ Clear collaboration guidelines

**Next Step:** Push ManusChatgpt branch to GitHub and share repository URL with ChatGPT and Replit teams.
