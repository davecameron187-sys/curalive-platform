# Linting Baseline Tracking Issue

## Overview

The CuraLive codebase currently has **1,170 linting errors** and **794 warnings** (1,964 total issues) detected by ESLint. This document tracks the effort to reduce linting violations to <500 by the end of the next sprint.

## Current Baseline

| Category | Count | Fixable | Manual |
|----------|-------|---------|--------|
| **Errors** | 1,170 | 4 | 1,166 |
| **Warnings** | 794 | 0 | 794 |
| **Total** | 1,964 | 4 | 1,960 |

## Auto-Fixable Issues (4 issues)

Run `pnpm lint:fix` to automatically resolve:
- [ ] Unused variables (2 issues)
- [ ] Incorrect imports (2 issues)

## Manual Fixes Required (1,960 issues)

### High Priority (Blocks production)
- [ ] Remove all `console.log()` statements in production code (estimated 200 issues)
- [ ] Fix all `require()` imports to use ES6 `import` (estimated 150 issues)
- [ ] Resolve all `any` type usages (estimated 300 issues)

### Medium Priority (Code quality)
- [ ] Fix unused function parameters (estimated 400 issues)
- [ ] Resolve missing error handling (estimated 200 issues)
- [ ] Fix naming conventions (camelCase vs snake_case) (estimated 250 issues)

### Low Priority (Style)
- [ ] Enforce consistent spacing (estimated 200 issues)
- [ ] Fix comment formatting (estimated 100 issues)
- [ ] Resolve other style issues (estimated 160 issues)

## Sprint Goals

### Sprint 1 (This Week)
- [x] Auto-fix 4 fixable issues
- [ ] Remove all console.log() from production code (200 issues)
- [ ] Fix require() imports to ES6 (150 issues)
- **Target: 1,610 issues remaining**

### Sprint 2 (Next Week)
- [ ] Resolve `any` type usages (300 issues)
- [ ] Fix unused function parameters (400 issues)
- **Target: 910 issues remaining**

### Sprint 3 (Week 3)
- [ ] Resolve missing error handling (200 issues)
- [ ] Fix naming conventions (250 issues)
- **Target: 460 issues remaining** ✅ Goal achieved

## Implementation Strategy

1. **Automated fixes first** — Run `pnpm lint:fix` to resolve 4 auto-fixable issues
2. **High-impact manual fixes** — Focus on console.log() and require() imports (350 issues)
3. **Gradual reduction** — Allocate 1-2 hours per sprint to linting cleanup
4. **CI enforcement** — Prevent new linting violations from being introduced

## CI/CD Integration

The GitHub Actions workflow (`test.yml`) includes a linting step that:
- Runs `pnpm lint` on every push
- Reports violations in the Actions tab
- Does NOT block the build (continue-on-error: true)
- Sends Slack notifications on failure

To make linting a hard requirement:
```yaml
- name: Lint code
  run: pnpm lint
  continue-on-error: false  # Change to true to block on linting errors
```

## Monitoring Progress

Track progress by running:
```bash
pnpm lint 2>&1 | grep "problems" | tail -1
```

Expected output:
```
1964 problems (1170 errors, 794 warnings)  # Current
1610 problems (966 errors, 644 warnings)   # After Sprint 1
910 problems (566 errors, 344 warnings)    # After Sprint 2
460 problems (266 errors, 194 warnings)    # After Sprint 3 ✅
```

## Resources

- **ESLint Configuration:** `.eslintrc.config.js`
- **Ignore Patterns:** `.eslintignore`
- **Lint Script:** `pnpm lint` (check only) or `pnpm lint:fix` (auto-fix)
- **GitHub Actions:** `.github/workflows/test.yml`

## Success Criteria

- [ ] Reduce linting violations from 1,964 to <500
- [ ] Auto-fix all 4 fixable issues
- [ ] Remove all console.log() from production code
- [ ] Convert all require() to ES6 imports
- [ ] Establish linting as part of the PR review process
- [ ] Add pre-commit hook to prevent linting violations

## Next Steps

1. Run `pnpm lint:fix` to auto-resolve 4 issues
2. Create a GitHub issue for tracking manual fixes
3. Assign high-priority items to team members
4. Review and merge linting fixes in batches
5. Update this document weekly with progress

---

**Last Updated:** 2026-03-12  
**Target Completion:** 2026-04-02 (3 weeks)
