# TEAM OPERATING NOTE

GitHub is the custodian for CuraLive and Shadow Mode.

## Source of Truth
- Canonical repository: davecameron187-sys/curalive-platform
- Canonical branches:
  - develop: integration and staging work
  - shadow-mode: shadow deployment validation
  - main: production releases

## Update Flow
1. Create feature branch from develop.
2. Open PR to develop and pass CI checks.
3. Promote develop to shadow-mode for shadow validation.
4. Promote shadow-mode to main for production release.

## Publishing Rules
- No Replit-only drift or untracked edits.
- All updates must be merged through GitHub PRs.
- Branch protection and required checks must remain enabled.
- Environment secrets are scoped by GitHub Environment (shadow and production).

## Rollback
- Revert via GitHub commit history and redeploy known-good commit/tag.
- Back-propagate hotfixes/rollbacks to keep develop, shadow-mode, and main aligned.

## Team Execution Standard
- We operate as one team with this flow as default.
- Safety first: protect production with shadow validation before main deployment.
