# ESLint Violations Tracking

## Current Baseline (March 12, 2026)

**Total Issues: 1,881**
- Errors: 1,109
- Warnings: 772
- Previous: 1,964 (reduced by 83 after auto-fix)

## Top 5 Violation Categories

| Category | Count | Type | Action |
|----------|-------|------|--------|
| `no-console` | 772 | Warning | Remove `.log()`, keep `.warn()/.error()/.info()` |
| `@typescript-eslint/no-require-imports` | 200+ | Error | Convert `require()` to `import` statements |
| `@typescript-eslint/no-unused-vars` | 150+ | Error | Remove unused variables/imports |
| `no-undef` | 100+ | Error | Add missing imports or declare globals |
| `@typescript-eslint/no-explicit-any` | 80+ | Warning | Add proper TypeScript types |

## Sprint Reduction Plan

### Week 1: Console Statements (Est. -400 warnings)
- Run `eslint . --fix --rule 'no-console: ["error", { allow: ["warn", "error", "info"] }]'`
- Manually remove `console.log()` statements in:
  - `server/**/*.ts` (priority: services, routers)
  - `client/src/**/*.tsx` (priority: hooks, utilities)
- Target: 372 warnings remaining

### Week 2: Require to Import (Est. -150 errors)
- Convert `.cjs` files to `.mjs` with ES modules
- Update `buy-sa-number.cjs`, `buy-twilio-number.cjs`, etc.
- Add `/* global require, process, Buffer, fetch */` comments for Node.js globals
- Target: 959 errors remaining

### Week 3: Unused Variables & Types (Est. -200 errors)
- Fix `@typescript-eslint/no-unused-vars` (150+ errors)
- Add type annotations for `any` (80+ warnings)
- Update function signatures in test files
- Target: 759 errors remaining

### Week 4: Final Cleanup (Est. -250 errors)
- Fix remaining `no-undef` errors
- Add missing imports
- Review and merge all fixes
- Target: <500 violations

## Files Requiring Attention

### High Priority (>50 violations each)
- `server/routers/*.ts` - Multiple console.log statements
- `client/src/pages/*.tsx` - Unused variables, any types
- `*.cjs` files - Require imports, Node.js globals
- `server/services/*.ts` - Console statements, unused vars

### Medium Priority (10-50 violations each)
- `server/webhooks/*.ts`
- `client/src/components/*.tsx`
- Test files (`.test.ts`)

### Low Priority (<10 violations each)
- Configuration files
- Utility files

## Configuration Files

- `.eslintrc.json` - ESLint rules configuration
- `.eslintignore` - Ignore patterns (deprecated, use `ignores` in config)
- `.husky/pre-commit` - Pre-commit linting hook
- `.github/workflows/ci.yml` - CI/CD linting step

## Success Criteria

- [ ] <500 total violations by end of sprint
- [ ] <200 errors (from 1,109)
- [ ] <300 warnings (from 772)
- [ ] All tests passing (760/760)
- [ ] Build succeeds cleanly
- [ ] Pre-commit hook prevents new violations

## Related Documentation

- See `LINTING_BASELINE_ISSUE.md` for GitHub issue template
- See `.github/workflows/ci.yml` for linting in CI/CD pipeline
- See `eslint.config.js` for rule definitions

## Last Updated

- **Date:** March 12, 2026
- **Baseline:** 1,881 violations (1,109 errors, 772 warnings)
- **Status:** Tracking in progress
