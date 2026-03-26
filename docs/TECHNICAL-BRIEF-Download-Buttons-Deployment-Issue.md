# Technical Brief: Download Recording & Download Transcript Buttons — Deployment Issue

**Date:** 26 March 2026  
**Platform:** CuraLive (CIPC Patent App ID 1773575338868)  
**Production URL:** https://curalive-platform.replit.app/?tab=shadow-mode  
**Affected Feature:** Archives & Reports — Download Recording and Download Transcript buttons  

---

## 1. What Was Requested

Add two buttons — "Download Recording" (green) and "Download Transcript" (blue) — next to the existing "Email Report" (cyan) button in the Archives & Reports event detail view, inside Shadow Mode.

## 2. Current Status

- **Development server:** WORKING. All three buttons render correctly. Verified by automated Playwright tests multiple times. The buttons appear in two locations:
  - Top of the event detail header (next to event name)
  - Bottom action bar (alongside "Regenerate Report" and "View Intelligence Database")
- **Production/published site:** NOT WORKING. Only "Email Report" is visible. The production site is serving a stale JavaScript bundle from **25 March 2026 09:58 UTC** that does not contain the new button code.

## 3. Root Cause: Replit Deployment Build Cache Issue

The Replit deployment system is not building from the latest source code. Despite multiple publishes (7+ attempts), the production site consistently serves an old JavaScript bundle.

### Evidence

| Check | Local Dev | Production |
|-------|-----------|------------|
| HTML script reference | `src="/assets/index.js"` (fixed name) | `src="/assets/index-CeJR35-p.js"` (old hashed name) |
| Bundle last-modified | Current session | `Wed, 25 Mar 2026 09:58:05 GMT` |
| "Download Recording" occurrences in bundle | 3 | 1 (only the Live Intelligence tab, not Archives) |
| "Download Transcript" occurrences in bundle | 3 | 1 (only the Live Intelligence tab, not Archives) |

### What This Means

The deployment's build step (defined in `artifact.toml`) runs:
```
cd /home/runner/workspace && rm -rf dist && vite build && esbuild server/_core/index.ts ...
```

But the deployment environment appears to have a **cached or stale copy of the source files**. Even though:
1. The source code in git (HEAD commit `e0e6bf6`) contains all button code
2. The `vite.config.ts` was updated to use fixed filenames
3. The `.gitignore` was updated to include `dist/`
4. The build command was updated to `rm -rf dist` before building
5. The Vite cache was cleared (`node_modules/.vite`)

...the production site STILL serves the identical old bundle from March 25th.

## 4. Files Modified (All Changes Are Correct)

### `client/src/pages/ShadowMode.tsx`
- **Lines 1961-1990:** Added Email Report, Download Recording, Download Transcript buttons to the event detail HEADER area (top-right, next to event name)
- **Lines 2705-2735:** Added the same three buttons to the BOTTOM ACTION BAR (alongside Regenerate Report, View Intelligence Database)
- All buttons are unconditional — they always render regardless of data
- Download Recording shows green when a recording file exists, greyed out when not
- Download Transcript shows blue when a transcript exists, greyed out when not

### `vite.config.ts`
- Changed build output to use fixed filename (`assets/index.js`) instead of hashed names
- Purpose: Eliminate hash mismatch between HTML and JS bundle

### `.gitignore`
- Removed `dist` from ignore list so pre-built files ship with deployment checkpoints

### `artifacts/api-server/.replit-artifact/artifact.toml`
- Updated production build command to include `rm -rf dist` before building
- Purpose: Force clean rebuild, prevent stale cache

## 5. Backend Endpoints (Working)

The server-side download endpoints are fully functional:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/archives/:id/transcript` | 200 OK | Returns .txt file for all 4 test events |
| `GET /api/archives/:id/recording` | 404 | Expected — test events were text-only (no audio uploaded) |

## 6. What Needs to Happen to Fix This

The issue is NOT in the application code. The code is correct and verified working in development. The issue is that **Replit's deployment build system is using a cached/stale version of the source files** and not rebuilding from the latest committed source.

### Possible Fixes (In Order of Preference)

1. **Clear the Replit deployment build cache** — If Replit's deployment environment caches node_modules, dist, or source files between deploys, that cache needs to be invalidated. There may be a way to do this through Replit's deployment settings or support.

2. **Force a full redeployment** — Instead of incremental deploy, trigger a complete fresh deployment that clones the latest source and builds from scratch with no cached files.

3. **Serve the pre-built dist directly** — Change the artifact.toml build step to `echo 'skip'` and ensure the pre-built `dist/` directory (which contains the correct bundle) is included in the deployment. This was attempted but the deployment still served old files.

4. **Contact Replit support** — The deployment cache behavior appears to be a platform-level issue that cannot be resolved through application code changes alone.

## 7. How to Verify the Fix Worked

After deploying, run:
```bash
curl -s "https://curalive-platform.replit.app/" | grep -o 'src="[^"]*index[^"]*"'
```

- If it returns `src="/assets/index.js"` — the new build is being used
- If it returns `src="/assets/index-CeJR35-p.js"` — still using the stale cache

Then check the bundle:
```bash
curl -s "https://curalive-platform.replit.app/assets/index.js" | grep -c "Download Recording"
```

- Should return `3` (Live Intelligence + Header + Bottom Action Bar)
- If returns `1` or `0` — still stale

## 8. Visual Layout (When Working)

When deployed correctly, the Archives & Reports event detail will show:

**Top Header:**
```
[Event Name]                          [Email Report] [Download Recording] [Download Transcript]
[Client · Type · Date]
```

**Bottom Action Bar (below AI report content):**
```
[Regenerate Report] [View Intelligence Database] [Email Report] [Download Recording] [Download Transcript]
```

- Email Report: cyan (`bg-cyan-600`)
- Download Recording: green (`bg-emerald-600`) or greyed out (`bg-slate-700 opacity-60`)
- Download Transcript: blue (`bg-blue-600`) or greyed out (`bg-slate-700 opacity-60`)
