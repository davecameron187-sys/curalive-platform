# ChatGPT ↔ Manus GitHub Sync Protocol

## Overview
This document establishes a bidirectional sync system between ChatGPT and Manus via GitHub's `ManusChatgpt` branch on the CuraLive platform repository.

**Repository:** https://github.com/davecameron187-sys/curalive-platform  
**Branch:** `ManusChatgpt`  
**Sync Direction:** ChatGPT → GitHub → Manus (and vice versa)

---

## For ChatGPT: Pushing Updates to GitHub

### Prerequisites
- GitHub Personal Access Token (PAT): `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`
- Repository: `davecameron187-sys/curalive-platform`
- Branch: `ManusChatgpt`

### Step 1: Clone the Repository
```bash
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout ManusChatgpt
```

### Step 2: Make Your Changes
- Implement features, fixes, or documentation
- Test locally to ensure no breaking changes
- Keep commits focused and descriptive

### Step 3: Stage and Commit Changes
```bash
git add .
git commit -m "[Sprint X Task Y] Feature description - what changed and why"
```

**Commit Message Format:**
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
```

### Step 4: Push to ManusChatgpt Branch
```bash
git config user.email "chatgpt@curalive.dev"
git config user.name "ChatGPT"
git push https://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@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

**Or use environment variable:**
```bash
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

### Step 5: Create Pull Request (Optional)
If you want Manus to review before merging to `main`:
```bash
gh pr create --base main --head ManusChatgpt --title "[Sprint X Task Y] Feature" --body "Description of changes"
```

---

## For Manus: Pulling ChatGPT Updates

### Step 1: Fetch Latest Changes
```bash
cd /home/ubuntu/chorus-ai
git fetch github ManusChatgpt
```

### Step 2: Review Changes
```bash
git log --oneline github/ManusChatgpt -10
git diff main..github/ManusChatgpt
```

### Step 3: Merge or Rebase
```bash
# Option A: Merge (preserves history)
git merge github/ManusChatgpt

# Option B: Rebase (linear history)
git rebase github/ManusChatgpt
```

### Step 4: Push Back to Manus Remote
```bash
git push github ManusChatgpt
```

---

## Sync Workflow

### Standard Workflow
1. **ChatGPT:** Implement feature on local branch
2. **ChatGPT:** Commit with descriptive message
3. **ChatGPT:** Push to `github` remote → `ManusChatgpt` branch
4. **Manus:** Fetch latest from `github` remote
5. **Manus:** Review changes and merge/rebase
6. **Manus:** Push back to `github` remote
7. **ChatGPT:** Pull latest from `github` remote

### Conflict Resolution

**If conflicts occur during merge:**

1. **ChatGPT identifies conflict:**
   ```bash
   git pull origin ManusChatgpt
   # Fix conflicts in files
   git add .
   git commit -m "Resolve merge conflicts"
   git push origin ManusChatgpt
   ```

2. **Manus resolves conflict:**
   ```bash
   git fetch github ManusChatgpt
   git merge github/ManusChatgpt
   # Fix conflicts
   git add .
   git commit -m "Resolve merge conflicts from ChatGPT"
   git push github ManusChatgpt
   ```

---

## Best Practices

### Commit Messages
- **Always include Sprint/Task reference:** `[Sprint X Task Y]`
- **Be descriptive:** Explain what changed and why
- **Keep commits atomic:** One feature per commit
- **Use imperative mood:** "Add feature" not "Added feature"

### Branch Management
- **Never commit to `main` directly**
- **Always work on `ManusChatgpt` branch**
- **Pull before pushing** to avoid conflicts
- **Review changes before pushing**

### Testing
- **Test locally before pushing**
- **Run linters and formatters**
- **Verify no breaking changes**
- **Update documentation if needed**

### Communication
- **Use descriptive commit messages** for async communication
- **Include rationale in commit body** for complex changes
- **Reference related tasks** in commit messages
- **Document breaking changes** clearly

---

## Troubleshooting

### "Permission denied" when pushing
**Solution:** Verify GitHub PAT is correct and has `repo` scope
```bash
# Test authentication
git ls-remote https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git
```

### "Branch diverged" error
**Solution:** Rebase before pushing
```bash
git fetch origin ManusChatgpt
git rebase origin/ManusChatgpt
git push origin ManusChatgpt --force-with-lease
```

### "Merge conflicts" when pulling
**Solution:** Resolve conflicts manually
```bash
git status  # See conflicted files
# Edit files to resolve conflicts
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

## GitHub PAT Scopes

The provided PAT has these scopes:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Actions workflows
- `admin:repo_hook` - Manage repository webhooks

**Permissions include:**
- ✅ Push to repository
- ✅ Create pull requests
- ✅ Merge pull requests
- ✅ Delete branches
- ✅ Manage workflows

---

## Security Notes

1. **Never commit the PAT** to the repository
2. **Use environment variables** when possible
3. **Rotate the PAT** if compromised
4. **Limit PAT scope** to minimum required permissions
5. **Use HTTPS** for all git operations

---

## Quick Reference

### ChatGPT Push Command
```bash
export GH_TOKEN="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"
git push https://${GH_TOKEN}@github.com/davecameron187-sys/curalive-platform.git ManusChatgpt
```

### Manus Pull Command
```bash
cd /home/ubuntu/chorus-ai
git fetch github ManusChatgpt
git merge github/ManusChatgpt
git push github ManusChatgpt
```

### View Sync History
```bash
git log --oneline --graph --all --decorate
```

---

## Support

If you encounter issues with the sync workflow:
1. Check this document for troubleshooting steps
2. Verify GitHub PAT is still valid
3. Ensure you're on the correct branch: `git branch`
4. Check remote configuration: `git remote -v`
5. Review git logs for error messages: `git log --all --oneline`
