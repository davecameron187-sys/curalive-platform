# Bidirectional GitHub Sync Workflow
## Manus ↔ ChatGPT ↔ GitHub

This document defines the complete workflow for seamless collaboration between Manus and ChatGPT via GitHub's `ManusChatgpt` branch.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Repository                      │
│         davecameron187-sys/curalive-platform            │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │          ManusChatgpt Branch (Main)              │   │
│  │  ← ChatGPT pushes updates here                   │   │
│  │  ← Manus pulls updates from here                 │   │
│  │  ← All work syncs through this branch            │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │          main Branch (Stable)                    │   │
│  │  ← Merge only after review and testing           │   │
│  │  ← Production-ready code                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↕                                    ↕
    ┌─────────┐                         ┌─────────┐
    │  Manus  │                         │ ChatGPT │
    │  Agent  │←──────────────────────→│ (Replit)│
    └─────────┘   Bidirectional Sync    └─────────┘
```

---

## Workflow Scenarios

### Scenario 1: ChatGPT Implements Feature

**Timeline:**
1. ChatGPT clones repo and checks out `ManusChatgpt` branch
2. ChatGPT implements feature locally
3. ChatGPT commits with descriptive message: `[Sprint X Task Y] Feature`
4. ChatGPT pushes to GitHub: `git push origin ManusChatgpt`
5. Manus fetches latest: `./scripts/pull-chatgpt-updates.sh`
6. Manus reviews changes and merges
7. Manus pushes back: `git push github ManusChatgpt`
8. ChatGPT pulls latest: `git pull origin ManusChatgpt`

**Commands:**

**ChatGPT:**
```bash
# Clone and setup
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout ManusChatgpt

# Make changes and commit
git add .
git commit -m "[Sprint 1 Task 1.2] Ably Real-Time Sync - Wire state machine"

# Push to GitHub
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

**Manus:**
```bash
# Pull ChatGPT updates
cd /home/ubuntu/chorus-ai
./scripts/pull-chatgpt-updates.sh

# Review changes
git log --oneline -5
git diff HEAD~1

# Test locally
pnpm test
pnpm dev
```

---

### Scenario 2: Manus Implements Feature

**Timeline:**
1. Manus creates feature on local branch
2. Manus commits with descriptive message
3. Manus saves checkpoint: `webdev_save_checkpoint`
4. Manus pushes to GitHub: `git push github ManusChatgpt`
5. ChatGPT fetches latest: `git pull origin ManusChatgpt`
6. ChatGPT reviews and can build upon changes
7. ChatGPT commits additional changes
8. ChatGPT pushes: `git push origin ManusChatgpt`
9. Manus pulls: `./scripts/pull-chatgpt-updates.sh`

**Commands:**

**Manus:**
```bash
# Make changes locally
# ... implement feature ...

# Commit and save checkpoint
git add .
git commit -m "[Sprint 1 Task 1.3] Action Logging - Persist Q&A approvals"
webdev_save_checkpoint

# Push to GitHub
git push github ManusChatgpt --force
```

**ChatGPT:**
```bash
# Pull latest from Manus
git pull origin ManusChatgpt

# Review and build upon
git log --oneline -5

# Make additional changes
git add .
git commit -m "[Sprint 1 Task 1.4] State Validation - Add validation tests"

# Push back
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

---

### Scenario 3: Conflict Resolution

**When conflicts occur:**

**ChatGPT detects conflict:**
```bash
git pull origin ManusChatgpt
# CONFLICT: Merge conflict in file.ts

# Resolve conflicts manually
# Edit file.ts to resolve

git add .
git commit -m "Resolve merge conflicts - keep both implementations"
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

**Manus detects conflict:**
```bash
./scripts/pull-chatgpt-updates.sh
# CONFLICT: Merge conflict detected

# Resolve conflicts manually
# Edit conflicted files

git add .
git commit -m "Resolve merge conflicts - integrate both changes"
git push github ManusChatgpt
```

---

## Daily Sync Checklist

### For ChatGPT (Start of Day)
- [ ] Pull latest from GitHub: `git pull origin ManusChatgpt`
- [ ] Check for new commits: `git log --oneline -5`
- [ ] Review Manus changes: `git diff HEAD~5..HEAD`
- [ ] Verify no breaking changes: Run tests locally
- [ ] Start implementing features

### For ChatGPT (End of Day)
- [ ] Commit all changes: `git add . && git commit -m "[Sprint X Task Y] ..."`
- [ ] Push to GitHub: `git push origin ManusChatgpt`
- [ ] Document what was completed in commit message
- [ ] Note any blockers or TODOs

### For Manus (Start of Day)
- [ ] Pull ChatGPT updates: `./scripts/pull-chatgpt-updates.sh`
- [ ] Review new commits: `git log --oneline -5`
- [ ] Check for conflicts: `git status`
- [ ] Run tests: `pnpm test`
- [ ] Start implementing features

### For Manus (End of Day)
- [ ] Commit all changes: `git add . && git commit -m "[Sprint X Task Y] ..."`
- [ ] Save checkpoint: `webdev_save_checkpoint`
- [ ] Push to GitHub: `git push github ManusChatgpt --force`
- [ ] Update todo.md with completed items

---

## Commit Message Format

**All commits must follow this format:**

```
[Sprint X Task Y] Feature Title - Brief description

- What was implemented
- Why it was implemented
- Any breaking changes or dependencies
- Related files or components
```

**Examples:**

```
[Sprint 1 Task 1.2] Ably Real-Time Sync - Wire state machine to emit events

- Added Ably channel publishing for all state transitions
- Implemented createOperatorAction with database persistence
- All 4 state transitions now emit real-time events
- Depends on: ABLY_API_KEY environment variable
```

```
[Sprint 1 Task 1.5] Moderator Console UI - Build React component with Ably subscriptions

- Created ModeratorConsole.tsx with real-time Ably subscriptions
- Implemented session state display (idle/running/paused/ended)
- Added action history panel with pagination
- Integrated with sessionStateMachine tRPC procedures
```

---

## Branch Protection Rules

**ManusChatgpt branch:**
- ✅ Allow direct pushes (for fast iteration)
- ✅ Allow force pushes (for rebasing/cleanup)
- ✅ Require descriptive commit messages
- ✅ Maintain history for audit trail

**main branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Dismiss stale reviews on new commits
- ✅ Require code review from at least 1 maintainer

---

## Sync Frequency

| Scenario | Frequency | Trigger |
|----------|-----------|---------|
| ChatGPT → GitHub | After each task completion | Manual push |
| Manus → GitHub | After checkpoint | Automatic (webdev_save_checkpoint) |
| GitHub → Manus | Daily or on demand | Manual pull script |
| GitHub → ChatGPT | Daily or on demand | Manual git pull |

---

## Troubleshooting

### "Permission denied" when ChatGPT pushes
**Solution:** Verify GitHub PAT is correct
```bash
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

### "Branch diverged" error
**Solution:** Rebase before pushing
```bash
git fetch origin ManusChatgpt
git rebase origin/ManusChatgpt
git push origin ManusChatgpt --force-with-lease
```

### Merge conflicts when pulling
**Solution:** Resolve manually
```bash
git status  # See conflicted files
# Edit files to resolve
git add .
git commit -m "Resolve merge conflicts"
git push origin ManusChatgpt
```

### Changes not appearing after push
**Solution:** Verify push was successful
```bash
git log --oneline -5
git push -v origin ManusChatgpt  # Verbose output
```

---

## Security Best Practices

1. **Never commit the GitHub PAT** to the repository
2. **Use environment variables** for sensitive credentials
3. **Rotate the PAT** if compromised
4. **Limit PAT scope** to minimum required permissions
5. **Use HTTPS** for all git operations
6. **Review commits** before merging to main

---

## Quick Reference Commands

### ChatGPT Push
```bash
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

### Manus Pull
```bash
cd /home/ubuntu/chorus-ai
./scripts/pull-chatgpt-updates.sh
```

### View Sync History
```bash
git log --oneline --graph --all --decorate
```

### Check Remote Status
```bash
git remote -v
git fetch --all
git branch -vv
```

---

## Success Metrics

- ✅ No manual merge conflicts (>95% auto-merge success)
- ✅ All commits have descriptive messages
- ✅ All tests pass before pushing
- ✅ Sync happens at least daily
- ✅ Both agents stay in sync within 24 hours
- ✅ Zero data loss or corrupted commits
- ✅ Clear audit trail of all changes

---

## Support & Escalation

**If sync issues occur:**
1. Check this document for troubleshooting
2. Verify GitHub PAT is valid
3. Ensure on correct branch: `git branch`
4. Check remote config: `git remote -v`
5. Review git logs: `git log --all --oneline`
6. Contact repository maintainer if unresolved

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-28 | Initial bidirectional sync workflow |
| | | Established ChatGPT push protocol |
| | | Created Manus pull script |
| | | Documented conflict resolution |

