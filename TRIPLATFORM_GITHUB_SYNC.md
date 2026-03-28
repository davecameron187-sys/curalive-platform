# Tri-Platform GitHub Sync Workflow
## Manus + ChatGPT + Replit Collaboration on ManusChatgpt Branch

**Status:** Active Workflow  
**Branch:** ManusChatgpt  
**Repository:** https://github.com/davecameron187-sys/curalive-platform  
**Last Updated:** 2026-03-28

---

## Overview

Three platforms work together on the same GitHub branch:

| Platform | Role | Capability | Workflow |
|----------|------|-----------|----------|
| **Manus** | Implementation Engine | Full code execution, testing, checkpoints | Develops features, runs tests, saves checkpoints, pushes to GitHub |
| **ChatGPT** | Code Review + Content Prep | Code review, documentation, content generation | Reviews commits on GitHub, prepares PR descriptions, suggests improvements |
| **Replit** | Collaborative Development | Code editing, testing, real-time collaboration | Pulls from GitHub, makes changes, pushes back to GitHub |

---

## Branch Structure

```
GitHub Repository (davecameron187-sys/curalive-platform)
├── main (production)
└── ManusChatgpt (development)
    ├── Manus commits (implementation)
    ├── Replit commits (collaborative changes)
    └── ChatGPT reviews (on GitHub UI)
```

---

## Workflow for Each Platform

### 1. MANUS WORKFLOW

**Primary Role:** Implementation, testing, checkpoints

**Steps:**
1. Develop features locally in `/home/ubuntu/chorus-ai`
2. Write and run tests with `pnpm test`
3. Save checkpoint with `webdev_save_checkpoint`
4. Push to GitHub:
   ```bash
   git push github ManusChatgpt --force
   ```
5. Wait for ChatGPT review on GitHub
6. If changes needed, iterate and push again

**Commit Pattern:**
```
[Sprint 2] Task 2.1: Replace session state with backend calls
[Sprint 2] Task 2.2: Wire operator notes to database
[Checkpoint] Phase 3 Sprint 2 Complete - All tasks implemented
```

**Key Commands:**
```bash
# Check status
git log github/ManusChatgpt -5 --oneline

# Pull Replit changes
git fetch github && git merge github/ManusChatgpt

# Push after development
git push github ManusChatgpt --force
```

---

### 2. CHATGPT WORKFLOW

**Primary Role:** Code review, documentation, content preparation

**Steps:**
1. Visit GitHub: https://github.com/davecameron187-sys/curalive-platform/tree/ManusChatgpt
2. Review latest commits from Manus
3. Check code quality, test coverage, documentation
4. Prepare content:
   - PR descriptions
   - Commit message improvements
   - Documentation updates
   - Issue descriptions
5. Share prepared content with Manus/Replit via chat
6. Suggest improvements or flag issues

**Review Checklist:**
- [ ] Code follows project conventions
- [ ] Tests are comprehensive (50+ tests for major features)
- [ ] TypeScript: 0 errors
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] No hardcoded data or placeholders

**Cannot Do (Limitations):**
- ❌ Cannot push commits directly
- ❌ Cannot execute git commands
- ❌ Cannot run tests

**Can Do (Capabilities):**
- ✅ Review code on GitHub
- ✅ Prepare commit messages
- ✅ Write PR descriptions
- ✅ Create issue templates
- ✅ Suggest code improvements
- ✅ Validate against requirements

---

### 3. REPLIT WORKFLOW

**Primary Role:** Collaborative development, real-time testing

**Setup (First Time):**
```bash
# In Replit terminal
cd ~
git clone https://github.com/davecameron187-sys/curalive-platform.git curalive
cd curalive
git checkout ManusChatgpt
git config user.email "replit@curalive.dev"
git config user.name "Replit Developer"

# Add GitHub credentials
git remote set-url origin https://YOUR_GITHUB_PAT@github.com/davecameron187-sys/curalive-platform.git
```

**Development Steps:**
1. Pull latest from GitHub:
   ```bash
   git fetch origin && git merge origin/ManusChatgpt
   ```
2. Create feature branch (optional):
   ```bash
   git checkout -b feature/task-name
   ```
3. Make changes and test:
   ```bash
   pnpm install
   pnpm test
   pnpm dev
   ```
4. Commit changes:
   ```bash
   git add .
   git commit -m "[Sprint 2] Task 2.X: Description of changes"
   ```
5. Push to GitHub:
   ```bash
   git push origin ManusChatgpt
   ```
6. Notify Manus/ChatGPT of changes

**Key Commands:**
```bash
# Check current branch
git branch

# See latest commits
git log origin/ManusChatgpt -5 --oneline

# Pull Manus changes
git fetch origin && git merge origin/ManusChatgpt

# Push your changes
git push origin ManusChatgpt
```

**Replit Advantages:**
- ✅ Real-time code editing
- ✅ Integrated terminal
- ✅ Live preview
- ✅ Collaborative editing (if enabled)
- ✅ Can push directly to GitHub

---

## Conflict Resolution

### Scenario 1: Manus and Replit Both Made Changes

**Resolution:**
1. Replit pulls latest from Manus:
   ```bash
   git fetch origin && git merge origin/ManusChatgpt
   ```
2. If conflicts, resolve them in Replit editor
3. Commit merge:
   ```bash
   git add .
   git commit -m "Merge Manus changes"
   ```
4. Push to GitHub:
   ```bash
   git push origin ManusChatgpt
   ```
5. Manus pulls Replit changes:
   ```bash
   git fetch github && git merge github/ManusChatgpt
   ```

### Scenario 2: ChatGPT Suggests Changes

**Resolution:**
1. ChatGPT provides code/content via chat
2. Manus or Replit implements the changes
3. Commit with reference to ChatGPT suggestion:
   ```bash
   git commit -m "[ChatGPT Review] Implement suggested improvements"
   ```
4. Push to GitHub

---

## Commit Message Convention

All commits follow this pattern:

```
[Component] Brief description

Optional detailed explanation of changes made.
Acceptance criteria met:
- ✅ Criterion 1
- ✅ Criterion 2
```

**Examples:**
```
[Sprint 2] Task 2.1: Replace session state with backend calls
[Sprint 2] Task 2.2: Wire operator notes to database
[Checkpoint] Phase 3 Sprint 2 Complete - All 6 tasks implemented
[ChatGPT Review] Implement suggested documentation improvements
[Replit] Add integration tests for session mutations
```

---

## GitHub Integration Points

### Pull Requests
- **Created by:** Manus (after sprint completion)
- **Reviewed by:** ChatGPT (on GitHub)
- **Merged by:** Manus (after approval)
- **Title:** `[Sprint N] Task N.X: Description`
- **Description:** Links to PHASE_3_IMPLEMENTATION_BRIEF.md, acceptance criteria, test coverage

### Issues
- **Created by:** ChatGPT or Manus
- **Tracked by:** All three platforms
- **Labels:** sprint-2, task-2-1, bug, feature, documentation
- **Assigned to:** Manus (implementation), ChatGPT (review), Replit (collaboration)

### Discussions
- **Purpose:** Async communication about design decisions
- **Participants:** All three platforms
- **Format:** GitHub Discussions on repository

---

## Daily Sync Checklist

**Every Morning (Manus):**
- [ ] `git fetch github && git log github/ManusChatgpt -5 --oneline` — Check for Replit changes
- [ ] Review any new commits from Replit
- [ ] Pull Replit changes if any: `git merge github/ManusChatgpt`

**After Each Development Session (Manus):**
- [ ] Run tests: `pnpm test`
- [ ] Commit changes
- [ ] Push to GitHub: `git push github ManusChatgpt --force`

**After Each Development Session (Replit):**
- [ ] Run tests: `pnpm test`
- [ ] Commit changes
- [ ] Push to GitHub: `git push origin ManusChatgpt`

**Every Review Cycle (ChatGPT):**
- [ ] Visit GitHub ManusChatgpt branch
- [ ] Review latest commits
- [ ] Check acceptance criteria
- [ ] Prepare review comments or PR description
- [ ] Share feedback via chat

---

## GitHub PAT Configuration

**For Replit:**
```bash
# Set up credentials (one-time)
git config --global user.email "replit@curalive.dev"
git config --global user.name "Replit Developer"

# Add PAT to remote URL
git remote set-url origin https://YOUR_GITHUB_PAT@github.com/davecameron187-sys/curalive-platform.git
```

**Token Permissions Required:**
- ✅ repo (full control)
- ✅ workflow (GitHub Actions)
- ✅ read:user
- ✅ user:email

**Token:** `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`

---

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Solution:**
```bash
# Replit: Re-add PAT to remote
git remote set-url origin https://YOUR_GITHUB_PAT@github.com/davecameron187-sys/curalive-platform.git
```

### Issue: "Your branch is behind origin/ManusChatgpt"

**Solution:**
```bash
# Pull latest changes
git fetch origin && git merge origin/ManusChatgpt
```

### Issue: Merge conflicts

**Solution:**
1. Open conflicted file
2. Resolve conflicts (keep both/choose one)
3. Commit: `git add . && git commit -m "Resolve merge conflicts"`
4. Push: `git push origin ManusChatgpt`

### Issue: "Force push rejected"

**Solution:**
```bash
# Manus only: Force push after checkpoint
git push github ManusChatgpt --force

# Replit: Use regular push (no force)
git push origin ManusChatgpt
```

---

## Success Metrics

✅ All three platforms can see latest code on GitHub  
✅ Commits are atomic and well-documented  
✅ No merge conflicts (resolved within 1 hour)  
✅ ChatGPT reviews within 1 cycle  
✅ Tests pass on all commits (100% pass rate)  
✅ Zero TypeScript errors  
✅ Acceptance criteria met for every task  

---

## Next Steps

1. **Replit Setup:** Connect Replit to GitHub using PAT
2. **First Sync:** Replit clones and checks out ManusChatgpt
3. **Test Workflow:** All three platforms make a test commit
4. **Sprint 2:** Begin implementation with all three platforms active
5. **Continuous Integration:** Establish automated testing on GitHub

---

## Contact & Support

- **Manus Issues:** Use `webdev_check_status` and `webdev_debug`
- **ChatGPT Issues:** Share code snippets, ask for review
- **Replit Issues:** Use Replit's built-in support
- **GitHub Issues:** Create issue on repository for tracking

---

**This workflow enables seamless collaboration across three powerful platforms. All commits flow through GitHub, ensuring single source of truth.**
