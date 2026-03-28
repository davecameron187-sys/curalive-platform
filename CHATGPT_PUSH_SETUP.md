# ChatGPT GitHub Push Setup - CuraLive Operator Console

**Status:** ✅ READY FOR CHATGPT TO USE  
**Last Updated:** 2026-03-28  
**Purpose:** Enable ChatGPT to push updates to GitHub ManusChatgpt branch  

---

## Quick Start (Copy-Paste Ready)

### Step 1: Clone Repository
```bash
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout ManusChatgpt
```

### Step 2: Configure Git (One Time Only)
```bash
git config user.name "ChatGPT"
git config user.email "chatgpt@curalive.dev"
```

### Step 3: Make Changes & Commit
```bash
# Make your changes to files
git add .
git commit -m "[Sprint X Task Y] Feature title - description"
```

### Step 4: Push to GitHub
```bash
git push origin ManusChatgpt
```

**That's it!** Your changes are now on GitHub for Manus to review.

---

## Authentication Setup (If Push Fails)

### Option A: SSH Key (Recommended)
```bash
# Check if SSH key exists
ls ~/.ssh/id_rsa

# If not, generate one
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Test SSH connection
ssh -T git@github.com
```

**Then add the public key to GitHub:**
1. Copy your public key: `cat ~/.ssh/id_rsa.pub`
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Paste your public key
5. Save

### Option B: GitHub CLI (Alternative)
```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt-get install gh  # Linux

# Login to GitHub
gh auth login

# Then use normal git commands
git push origin ManusChatgpt
```

### Option C: HTTPS with Token (If SSH doesn't work)
```bash
# Use this ONLY if SSH fails
git config --global credential.helper store
git push origin ManusChatgpt
# GitHub will prompt for username and personal access token
```

---

## Commit Message Format

**REQUIRED:** All commits must follow this format:

```
[Sprint X Task Y] Feature Title - Brief Description

- What was implemented
- Why it was implemented  
- Any breaking changes or dependencies
- Test coverage (if applicable)
```

**Example:**
```
[Sprint 1 Task 2.1] Frontend Analytics Integration - Connect PostEventAnalytics to tRPC

- Updated PostEventAnalytics.tsx to use tRPC queries instead of mock data
- Connected all 7 analytics procedures: getEventAnalytics, getSentimentTrend, etc.
- Added loading states and error handling
- Real data now flows from database through tRPC to UI
- Tests: 15 unit + 8 integration (all passing)
```

---

## Verification Checklist

After pushing, verify your changes are on GitHub:

```bash
# 1. Check local commits
git log --oneline -5

# 2. Verify remote has your commits
git fetch origin
git log --oneline origin/ManusChatgpt -5

# 3. View on GitHub web
# https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt
```

**Expected:** Your commit should appear in the GitHub commit history within 30 seconds.

---

## Workflow for ChatGPT

### When Starting Work:
```bash
cd curalive-platform
git checkout ManusChatgpt
git pull origin ManusChatgpt  # Get latest from Manus
```

### When Finishing Work:
```bash
git add .
git commit -m "[Sprint X Task Y] Your work"
git push origin ManusChatgpt
# Notify Manus: "Pushed commit [hash] with [description]"
```

### When Manus Pushes Updates:
```bash
git fetch origin
git merge origin/ManusChatgpt
# Or: git pull origin ManusChatgpt
```

---

## Troubleshooting

### "Permission denied (publickey)"
**Solution:** Set up SSH key (see Authentication Setup above)

### "fatal: 'origin' does not appear to be a git repository"
**Solution:** You're not in the repo directory
```bash
cd curalive-platform
git remote -v  # Should show origin
```

### "Your branch is ahead of 'origin/ManusChatgpt'"
**Solution:** You have unpushed commits
```bash
git push origin ManusChatgpt
```

### "Merge conflict"
**Solution:** Resolve conflicts manually
```bash
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "[Fix] Resolved merge conflict"
git push origin ManusChatgpt
```

### "Push rejected - non-fast-forward"
**Solution:** Pull latest first
```bash
git pull origin ManusChatgpt
git push origin ManusChatgpt
```

---

## Key Points for ChatGPT

✅ **Always work on ManusChatgpt branch** - Never push to main  
✅ **Follow commit message format** - [Sprint X Task Y] required  
✅ **Pull before pushing** - Avoid merge conflicts  
✅ **Verify on GitHub** - Check commits appear within 30 seconds  
✅ **Notify Manus** - Post commit hash when pushing  

---

## GitHub Repository

**Repository:** https://github.com/davecameron187-sys/curalive-platform  
**Branch:** `ManusChatgpt` (development branch)  
**Main Branch:** `main` (production - do NOT push here)  

**View Your Commits:**
- Latest: https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt
- Specific commit: https://github.com/davecameron187-sys/curalive-platform/commit/[hash]

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Clone repo | `git clone https://github.com/davecameron187-sys/curalive-platform.git` |
| Switch to branch | `git checkout ManusChatgpt` |
| Pull latest | `git pull origin ManusChatgpt` |
| See changes | `git status` |
| Stage changes | `git add .` |
| Commit | `git commit -m "[Sprint X Task Y] Description"` |
| Push | `git push origin ManusChatgpt` |
| View commits | `git log --oneline -10` |
| View on GitHub | https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt |

---

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Verify SSH key is set up correctly
3. Confirm you're on ManusChatgpt branch: `git branch`
4. Try: `git fetch origin` then `git push origin ManusChatgpt`
5. If still failing, contact Manus with: `git status` output

