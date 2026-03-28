# Replit Setup for CuraLive Development

**Objective:** Connect Replit to GitHub ManusChatgpt branch for collaborative development with Manus and ChatGPT.

**Status:** Ready for Setup  
**Branch:** ManusChatgpt  
**Repository:** https://github.com/davecameron187-sys/curalive-platform

---

## Prerequisites

- [ ] Replit account created
- [ ] GitHub account with access to davecameron187-sys/curalive-platform
- [ ] GitHub PAT available: `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`

---

## Step 1: Create Replit Project

1. Go to https://replit.com
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter repository URL: `https://github.com/davecameron187-sys/curalive-platform`
5. Click "Import"
6. Wait for Replit to clone and initialize

---

## Step 2: Configure Git Credentials

In Replit terminal:

```bash
# Set git user
git config user.email "replit@curalive.dev"
git config user.name "Replit Developer"

# Add GitHub PAT to remote
git remote set-url origin https://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@github.com/davecameron187-sys/curalive-platform.git

# Verify remote is set
git remote -v
```

---

## Step 3: Checkout ManusChatgpt Branch

```bash
# Fetch all branches
git fetch origin

# Checkout ManusChatgpt
git checkout ManusChatgpt

# Verify branch
git branch -a
```

Expected output:
```
  main
* ManusChatgpt
  remotes/origin/main
  remotes/origin/ManusChatgpt
```

---

## Step 4: Install Dependencies

```bash
# Install Node packages
pnpm install

# Verify installation
pnpm list | head -20
```

---

## Step 5: Test Development Environment

```bash
# Run tests
pnpm test

# Start dev server
pnpm dev
```

Expected:
- Tests pass (or show expected failures)
- Dev server starts on port 3000
- No TypeScript errors

---

## Step 6: Create First Commit

```bash
# Create a test file
echo "# Replit Setup Complete - $(date)" > REPLIT_INITIALIZED.md

# Commit
git add REPLIT_INITIALIZED.md
git commit -m "[Replit] Initialize development environment on ManusChatgpt"

# Push to GitHub
git push origin ManusChatgpt
```

---

## Daily Workflow

### Morning: Pull Latest Changes

```bash
# Fetch and merge Manus changes
git fetch origin
git merge origin/ManusChatgpt

# If conflicts, resolve them:
# 1. Open conflicted files in Replit editor
# 2. Choose correct version
# 3. Save and commit
```

### During Development

```bash
# Make changes in Replit editor
# Test locally
pnpm test
pnpm dev

# Commit when ready
git add .
git commit -m "[Sprint 2] Task 2.X: Your changes here"

# Push to GitHub
git push origin ManusChatgpt
```

### End of Day: Notify Team

Share in chat:
- What you worked on
- Any blockers
- Commits pushed to GitHub
- Next steps

---

## Key Commands Reference

```bash
# Check current branch
git branch

# See recent commits
git log -5 --oneline

# Pull latest from GitHub
git fetch origin && git merge origin/ManusChatgpt

# Push your changes
git push origin ManusChatgpt

# Check status
git status

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Run tests
pnpm test

# Start dev server
pnpm dev

# Build for production
pnpm build
```

---

## Troubleshooting

### Issue: "fatal: not a git repository"

**Solution:**
```bash
cd ~/curalive
# or wherever you cloned the repo
```

### Issue: "Permission denied (publickey)"

**Solution:** Re-add PAT to remote
```bash
git remote set-url origin https://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@github.com/davecameron187-sys/curalive-platform.git
```

### Issue: "Your branch is behind origin/ManusChatgpt"

**Solution:** Pull latest changes
```bash
git fetch origin && git merge origin/ManusChatgpt
```

### Issue: Merge conflicts

**Solution:**
1. Open conflicted file in Replit editor
2. Look for `<<<<<<<`, `=======`, `>>>>>>>`
3. Keep the correct version
4. Delete conflict markers
5. Save and commit:
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   git push origin ManusChatgpt
   ```

### Issue: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
pnpm install
```

---

## Integration with Manus and ChatGPT

### Manus Pulls Your Changes

Manus will periodically:
1. Fetch from GitHub: `git fetch github`
2. Merge your commits: `git merge github/ManusChatgpt`
3. Test and verify: `pnpm test`
4. Push back if needed: `git push github ManusChatgpt --force`

### ChatGPT Reviews Your Code

ChatGPT will:
1. Visit GitHub ManusChatgpt branch
2. Review your commits
3. Check code quality and tests
4. Provide feedback in chat

### Workflow Loop

```
You (Replit) → GitHub → Manus → Tests → GitHub → ChatGPT Review
                                ↑                        ↓
                                ← ← ← ← ← ← ← ← ← ← ← ← ↓
```

---

## Success Checklist

- [ ] Replit project created and cloned
- [ ] Git credentials configured with PAT
- [ ] ManusChatgpt branch checked out
- [ ] Dependencies installed (`pnpm install`)
- [ ] Tests run successfully (`pnpm test`)
- [ ] Dev server starts (`pnpm dev`)
- [ ] First commit pushed to GitHub
- [ ] Commit visible on GitHub ManusChatgpt branch
- [ ] Manus can see your commits
- [ ] ChatGPT can review your commits

---

## Next Steps

1. **Confirm Setup:** Reply when Replit is ready
2. **Begin Sprint 2:** Start working on tasks with Manus and ChatGPT
3. **Establish Rhythm:** Daily pulls, commits, and pushes
4. **Collaborate:** Use GitHub for coordination

---

## Support

**Questions?** Ask in chat:
- Manus: Use `webdev_check_status` and `webdev_debug`
- ChatGPT: Share code and ask for help
- Replit: Use Replit's built-in support

**Remember:** All three platforms work on the same ManusChatgpt branch. GitHub is the source of truth.
