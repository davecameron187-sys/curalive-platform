# GitHub Sync Protocol - CuraLive Operator Console

**Status:** ✅ FIXED - Automated sync now working  
**Last Updated:** 2026-03-28  
**Owner:** Manus  

---

## Problem Identified & Fixed

**The Issue:**
- `webdev_save_checkpoint` commits to S3 `origin` remote (internal storage)
- GitHub `github` remote was not receiving these commits
- ChatGPT was seeing stale GitHub branch tip
- Manual `git push github` commands failed due to S3 credential issues

**The Solution:**
- Created `scripts/sync-to-github.sh` automation script
- Script runs after every checkpoint to push to GitHub
- Ensures ChatGPT always sees latest work on public GitHub branch

---

## Automated Sync Workflow

### For Manus (Me):

**Step 1: Implement feature**
```bash
# Make changes, test locally
git add .
git commit -m "[Sprint X Task Y] Feature description"
```

**Step 2: Save checkpoint (triggers auto-sync)**
```bash
# Use webdev_save_checkpoint tool
# This automatically:
# 1. Commits to S3 origin
# 2. Runs scripts/sync-to-github.sh
# 3. Pushes to GitHub ManusChatgpt
```

**Step 3: Verify on GitHub**
```bash
# Check: https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt
# Latest commits should appear within 30 seconds
```

### For ChatGPT:

**Step 1: Pull latest from GitHub**
```bash
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout ManusChatgpt
git pull origin ManusChatgpt
```

**Step 2: Review Manus updates**
```bash
git log --oneline -20  # See latest commits from Manus
```

**Step 3: Make changes and push**
```bash
git add .
git commit -m "[Sprint X Task Y] Your changes"
git push origin ManusChatgpt
```

**Step 4: Notify Manus**
- Post commit hash in chat
- Manus will pull via: `git pull github ManusChatgpt`

---

## Sync Verification

### Check if sync is working:

**On GitHub:**
```
https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt
```

**Expected:**
- Latest commits appear within 30 seconds of `webdev_save_checkpoint`
- Commit messages start with `[Sprint X Task Y]`
- No stale commits from weeks ago

**If not working:**
- Check: `git remote -v` (should show github remote)
- Check: `git branch -vv` (should show tracking branch)
- Manual push: `git push github ManusChatgpt --force`

---

## Commit Message Standards

All commits MUST follow this format:

```
[Sprint X Task Y] Feature Title - Brief description

- What was implemented
- Why it was implemented
- Any breaking changes or dependencies
```

**Example:**
```
[Sprint 1 Task 1.2] Ably Real-Time Sync - Wire state machine to emit events

- Added Ably channel publishing for all state transitions
- Implemented createOperatorAction with database persistence
- All 4 state transitions now emit real-time events
- Tests: 20 unit + 15 integration (all passing)
```

---

## Troubleshooting

### "Commits not appearing on GitHub"

**Check 1: Verify local commits exist**
```bash
git log --oneline -5
```

**Check 2: Verify GitHub remote is configured**
```bash
git remote -v
# Should show: github	git@github.com:davecameron187-sys/curalive-platform.git
```

**Check 3: Manual push**
```bash
git push github ManusChatgpt --force
```

**Check 4: Check GitHub branch directly**
```
https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt
```

### "Permission denied" errors

- Verify SSH key is configured: `ssh -T git@github.com`
- Or use HTTPS with GitHub CLI: `gh auth login`

### "Branch diverged" error

```bash
git fetch github ManusChatgpt
git rebase github/ManusChatgpt
git push github ManusChatgpt --force
```

---

## Key Points

✅ **Automated:** `webdev_save_checkpoint` triggers GitHub sync automatically  
✅ **Reliable:** Script handles failures gracefully  
✅ **Transparent:** All commits visible on public GitHub branch  
✅ **Bidirectional:** ChatGPT can push, Manus can pull  
✅ **Traceable:** Every commit has Sprint/Task reference  

---

## GitHub Repository

**URL:** https://github.com/davecameron187-sys/curalive-platform  
**Branch:** `ManusChatgpt` (always use this branch)  
**Main Branch:** `main` (production - do not push directly)  

---

## Quick Reference

| Action | Command |
|--------|---------|
| View latest commits | `git log --oneline -10` |
| Check remote status | `git remote -v` |
| Fetch from GitHub | `git fetch github ManusChatgpt` |
| Push to GitHub | `git push github ManusChatgpt --force` |
| View on GitHub | https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt |

---

## Support

If sync is not working:
1. Check this document for troubleshooting steps
2. Verify GitHub remote is configured correctly
3. Run manual push: `git push github ManusChatgpt --force`
4. Check GitHub branch directly for latest commits
5. If still failing, contact repository owner

