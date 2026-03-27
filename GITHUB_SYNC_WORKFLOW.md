# CuraLive GitHub Sync Workflow

**Purpose:** Standardized process for syncing Manus development to GitHub and enabling ChatGPT to access updates consistently.

## Repository Configuration

- **Repository:** https://github.com/davecameron187-sys/curalive-platform
- **Development Branch:** `ManusChatgpt` (all Manus agent work)
- **Production Branch:** `main` (stable releases)
- **GitHub Remote:** `github` (configured in git)

## Sync Process (Automated)

### Step 1: Checkpoint Creation (Manus)
After completing features, run:
```bash
webdev_save_checkpoint
```
This automatically:
- Commits changes to local `ManusChatgpt` branch
- Syncs to GitHub remote `github`
- Updates checkpoint version

### Step 2: Create Pull Request (Manus)
After checkpoint is saved, create PR:
```bash
cd /home/ubuntu/chorus-ai
gh pr create \
  --base main \
  --head ManusChatgpt \
  --title "[Sprint X Task Y.Z] Feature Name" \
  --body "## Changes
- Task description
- Acceptance criteria met
- Files modified

## Checkpoint
Version: [checkpoint_id]"
```

### Step 3: ChatGPT Access
ChatGPT retrieves updates from:
```
https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt
```

**Clone command for ChatGPT:**
```bash
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout ManusChatgpt
git pull origin ManusChatgpt
```

## Commit Message Format

**Standard format for all commits:**
```
[Sprint X Task Y.Z] Feature Name

## Summary
Brief description of changes (1-2 sentences)

## Changes
- Change 1
- Change 2
- Change 3

## Files Modified
- file1.ts
- file2.tsx
- file3.sql

## Acceptance Criteria
- [x] Criteria 1
- [x] Criteria 2
- [x] Criteria 3

## Testing
- [x] Unit tests written
- [x] Integration tests passed
- [x] Manual testing completed

## Related Issues
Closes #123
```

## Branch Management

| Branch | Purpose | Owner | Update Frequency |
|--------|---------|-------|------------------|
| `main` | Production-ready code | Release manager | On PR merge |
| `ManusChatgpt` | Manus agent development | Manus | After each checkpoint |
| `ChatGPT-Review` | ChatGPT review branch | ChatGPT | On demand |

## PR Review Checklist

Before merging PR to `main`:
- [ ] All tests passing
- [ ] Code review completed
- [ ] Acceptance criteria verified
- [ ] No merge conflicts
- [ ] Documentation updated
- [ ] Checkpoint version recorded

## ChatGPT Workflow

1. **Check for Updates:**
   ```bash
   git fetch origin
   git log ManusChatgpt..main --oneline
   ```

2. **Review PR:**
   - Visit: https://github.com/davecameron187-sys/curalive-platform/pulls
   - Filter by: `base:main head:ManusChatgpt`

3. **Pull Latest Changes:**
   ```bash
   git checkout ManusChatgpt
   git pull origin ManusChatgpt
   ```

4. **Review Files Changed:**
   ```bash
   git diff main...ManusChatgpt --stat
   ```

## Troubleshooting

### Issue: ChatGPT can't find updates
**Solution:**
1. Verify PR exists: https://github.com/davecameron187-sys/curalive-platform/pulls
2. Check branch: `git branch -a | grep ManusChatgpt`
3. Pull latest: `git pull origin ManusChatgpt`

### Issue: Merge conflicts
**Solution:**
1. Resolve conflicts locally
2. Commit resolution
3. Push to `ManusChatgpt`
4. Update PR automatically

### Issue: Checkpoint not synced
**Solution:**
1. Verify remote: `git remote -v`
2. Manual push: `git push github ManusChatgpt`
3. Check status: `git log --oneline -5`

## Quick Reference

**Manus Agent Workflow:**
```bash
# 1. Complete feature development
# 2. Save checkpoint
webdev_save_checkpoint

# 3. Create PR
gh pr create --base main --head ManusChatgpt --title "[Sprint X Task Y] Feature"

# 4. Done - ChatGPT can now access updates
```

**ChatGPT Workflow:**
```bash
# 1. Clone or update repository
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform

# 2. Switch to development branch
git checkout ManusChatgpt

# 3. Pull latest updates
git pull origin ManusChatgpt

# 4. Review PR and changes
# Visit: https://github.com/davecameron187-sys/curalive-platform/pulls
```

## Status Dashboard

**Latest Sync Status:**
- Last Update: [Auto-updated by system]
- Branch: `ManusChatgpt`
- PR Status: [Check GitHub]
- Checkpoint: [Latest version]

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-27  
**Maintained By:** Manus Agent
