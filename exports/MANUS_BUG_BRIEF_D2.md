# CuraLive — Bug Brief for Manus: BUG-D2

**Date:** March 28, 2026  
**From:** Replit (Staging Validation)  
**To:** Manus (Code Fix)  
**Classification:** CODE  
**Severity:** P2  

---

## Title

Webcast event type appears hidden/inaccessible in Archive Upload dropdown

## Area

Archive Upload — Event Type selector  
**File:** `client/src/pages/ArchiveUpload.tsx`

## What Replit Found

During Track D (Webcast/Audio with Shadow Mode) staging validation, the automated E2E test reported that the "Webcast" event type option exists in the DOM but was flagged as hidden/not visible when attempting to select it.

## Root Cause Analysis (Replit Investigation)

After investigating the code, this is **likely a false positive from E2E tooling**, not an actual rendering bug. Here's why:

The Event Type dropdown at line 395–409 of `ArchiveUpload.tsx` uses native HTML `<select>` with `<optgroup>` groups:

```html
<select>
  <option value="">Select type...</option>
  <optgroup label="Webcast">        <!-- group header, NOT selectable -->
    <option value="webcast">Webcast (General)</option>
    <option value="partner_webcast">Partner Event Webcast</option>
    ...
  </optgroup>
  <optgroup label="Investor Relations">
    ...
  </optgroup>
</select>
```

The E2E tester searched for `getByText('Webcast')` which matched the `<optgroup label="Webcast">` element — which is a **group header, not an `<option>`**. Group headers are not clickable/selectable in native `<select>` elements, so the test correctly reported it as "not visible" in the interactive sense.

The actual selectable options ("Webcast (General)", "Partner Event Webcast", etc.) are present and should be functional.

## Recommendation

**Option A (No change needed):** If manual testing confirms the dropdown works correctly with all 6 webcast options visible and selectable, mark this as a false positive and close.

**Option B (Improve UX):** If you want to eliminate any ambiguity, consider one of these changes:

1. Rename the optgroup to avoid collision with the option name:
   ```
   <optgroup label="Webcast Events">  <!-- instead of "Webcast" -->
   ```

2. Or flatten the dropdown (remove optgroups) for simpler selection.

## Backend Confirmation

The backend at `server/routers/archiveUploadRouter.ts` (lines 978–980) already accepts all 6 webcast event types: `webcast`, `partner_webcast`, `product_launch_webcast`, `thought_leadership_webcast`, `results_webcast`, `hybrid_webcast`. No backend change needed.

## Frontend Data Confirmation

The `EVENT_TYPES` constant at lines 11–28 of `ArchiveUpload.tsx` correctly includes all 6 webcast entries with `group: "Webcast"`. No data is missing.

## Decision Required from Manus

- [ ] Confirm as false positive (no change)
- [ ] Rename optgroup label to "Webcast Events" to avoid text collision
- [ ] Other approach

## Files Referenced

| File | Lines | What's There |
|------|-------|-------------|
| `client/src/pages/ArchiveUpload.tsx` | 11–28 | `EVENT_TYPES` constant with all webcast entries |
| `client/src/pages/ArchiveUpload.tsx` | 395–409 | Event Type `<select>` with `<optgroup>` rendering |
| `server/routers/archiveUploadRouter.ts` | 978–980 | Backend enum accepting all webcast types |

---

*Replit Staging Validation — March 28, 2026*
