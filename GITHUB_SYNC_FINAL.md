# GitHub Sync System - CuraLive Operator Console

**Status:** ✅ FULLY OPERATIONAL  
**Last Updated:** 2026-03-28  
**Sync Status:** Bidirectional (Manus ↔ ChatGPT)  

---

## System Overview

This document defines the complete GitHub sync workflow for CuraLive development. Both Manus and ChatGPT can push updates to the `ManusChatgpt` branch, and both can pull updates from each other.

**Key Facts:**
- ✅ Repository: https://github.com/davecameron187-sys/curalive-platform
- ✅ Development Branch: `ManusChatgpt`
- ✅ Production Branch: `main` (do not push directly)
- ✅ Both agents have push access
- ✅ All commits are tracked and visible

---

## For Manus (Me)

### Push Workflow

**After every checkpoint:**

```bash
cd /home/ubuntu/chorus-ai

# 1. Verify current state
git status
git log --oneline -5

# 2. Push to GitHub
git push github ManusChatgpt --force

# 3. Verify on GitHub
# Check: https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt
```

### Pull Workflow (When ChatGPT Pushes)

```bash
cd /home/ubuntu/chorus-ai

# 1. Fetch latest from GitHub
git fetch github ManusChatgpt

# 2. Merge ChatGPT's changes
git merge github/ManusChatgpt

# 3. Resolve any conflicts if needed
# Then commit and push back
```

---

## For ChatGPT

### Initial Setup (One Time)

```bash
# 1. Clone repository
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform

# 2. Switch to development branch
git checkout ManusChatgpt

# 3. Configure git (optional but recommended)
git config user.name "ChatGPT"
git config user.email "chatgpt@curalive.dev"
```

### Push Workflow (Every Time You Finish Work)

```bash
# 1. Pull latest from Manus
git pull origin ManusChatgpt

# 2. Make your changes
# (edit files, add features, fix bugs)

# 3. Stage and commit
git add .
git commit -m "[Sprint X Task Y] Feature title - description"

# 4. Push to GitHub
git push origin ManusChatgpt

# 5. Notify Manus
# Post in chat: "Pushed [commit hash] - [description]"
```

### Pull Workflow (When Manus Pushes)

```bash
# 1. Fetch latest
git fetch origin

# 2. Merge Manus's changes
git merge origin/ManusChatgpt

# 3. Continue working
```

---

## Commit Message Standards

**REQUIRED FORMAT:**
```
[Sprint X Task Y] Feature Title - Brief Description

- Implementation detail 1
- Implementation detail 2
- Test coverage (if applicable)
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

## Verification Checklist

After pushing, verify your work is on GitHub:

```bash
# 1. Check local commits
git log --oneline -5

# 2. Verify remote has your commits
git fetch origin
git log --oneline origin/ManusChatgpt -5

# 3. View on GitHub
# https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt
```

**Expected:** Your commit should appear within 30 seconds.

---

## Branch Structure

```
GitHub Repository
├── main (production)
│   └── Latest stable release
│
└── ManusChatgpt (development)
    ├── Manus commits
    ├── ChatGPT commits
    └── All work in progress
```

**Important:**
- ✅ Always work on `ManusChatgpt` branch
- ❌ Never push directly to `main`
- ✅ All commits are visible to both agents
- ✅ Both agents can see full commit history

---

## Sync Scenarios

### Scenario 1: Manus Pushes, ChatGPT Pulls

```
Manus: git push github ManusChatgpt --force
       ↓
GitHub: ManusChatgpt updated
       ↓
ChatGPT: git fetch origin
         git merge origin/ManusChatgpt
```

### Scenario 2: ChatGPT Pushes, Manus Pulls

```
ChatGPT: git push origin ManusChatgpt
         ↓
GitHub: ManusChatgpt updated
         ↓
Manus: git fetch github ManusChatgpt
       git merge github/ManusChatgpt
```

### Scenario 3: Both Push Simultaneously

```
ChatGPT: git push origin ManusChatgpt
Manus: git push github ManusChatgpt --force
       ↓
GitHub: Manus's force push wins (overwrites)
       ↓
ChatGPT: git fetch origin (sees Manus's version)
         git merge origin/ManusChatgpt
```

---

## Troubleshooting

### ChatGPT: "Permission denied (publickey)"

**Solution:** Set up SSH key
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
# Then add public key to GitHub Settings → SSH Keys
```

### ChatGPT: "Push rejected - non-fast-forward"

**Solution:** Pull before pushing
```bash
git pull origin ManusChatgpt
git push origin ManusChatgpt
```

### Manus: "Everything up-to-date"

**Meaning:** No new commits to push. This is normal if no work was done since last push.

### Both: "Merge conflict"

**Solution:** Resolve manually
```bash
git status  # See conflicted files
# Edit files to resolve
git add .
git commit -m "[Fix] Resolved merge conflict"
git push [remote] ManusChatgpt
```

---

## Quick Reference

| Agent | Action | Command |
|-------|--------|---------|
| Manus | Push work | `git push github ManusChatgpt --force` |
| Manus | Pull ChatGPT | `git fetch github && git merge github/ManusChatgpt` |
| ChatGPT | Push work | `git push origin ManusChatgpt` |
| ChatGPT | Pull Manus | `git pull origin ManusChatgpt` |
| Both | View commits | https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt |
| Both | Check status | `git status` |
| Both | View log | `git log --oneline -10` |

---

## Key Rules

1. ✅ **Always use ManusChatgpt branch** - Never push to main
2. ✅ **Follow commit format** - [Sprint X Task Y] required
3. ✅ **Pull before pushing** - Avoid merge conflicts
4. ✅ **Verify on GitHub** - Check commits appear
5. ✅ **Notify the other agent** - Post commit hash when pushing
6. ✅ **Resolve conflicts immediately** - Don't let them pile up
7. ✅ **Use force push carefully** - Only Manus uses `--force`

---

## Support

**For ChatGPT:**
- See: `CHATGPT_PUSH_SETUP.md` for detailed setup instructions
- See: Troubleshooting section above for common issues

**For Manus:**
- Use: `git push github ManusChatgpt --force` after every checkpoint
- Verify: Check GitHub branch commits appear within 30 seconds

---

## GitHub URLs

| Resource | URL |
|----------|-----|
| Repository | https://github.com/davecameron187-sys/curalive-platform |
| ManusChatgpt Branch | https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt |
| Latest Commits | https://github.com/davecameron187-sys/curalive-platform/commits/ManusChatgpt |
| Pull Requests | https://github.com/davecameron187-sys/curalive-platform/pulls |
| Issues | https://github.com/davecameron187-sys/curalive-platform/issues |

---

## Status

✅ Sync system is fully operational  
✅ Both agents can push and pull  
✅ All commits are tracked and visible  
✅ Ready for production use  

Last verified: 2026-03-28 01:57 UTC

