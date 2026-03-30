# Shadow Mode — Definitive Root Cause Analysis

**Previous diagnosis (missing server router) has been ruled out by Manus team.**
**This document identifies THREE new root causes that explain the exact symptoms.**

---

## Symptom Recap

- Header renders ✅
- Tab buttons render ✅
- Content area blank ❌
- No visible console errors ❌

---

## Root Cause #1: Missing Component Imports (MOST LIKELY)

The Replit `ShadowMode.tsx` imports **four child components** that render inside the tabs. If Manus doesn't have these files, the **entire component crashes silently** before reaching the return statement — because the import fails at the module level.

### Required Components (check ALL exist in Manus codebase):

```
client/src/components/LocalAudioCapture.tsx    ← Used in Live Intelligence tab
client/src/components/AIDashboard.tsx          ← Used in AI Dashboard tab
client/src/components/SystemDiagnostics.tsx     ← Used in Diagnostics tab
client/src/components/LiveQaDashboard.tsx       ← Used in Live Q&A tab
client/src/components/LiveSessionPanel.tsx      ← Used in live session overlay
```

**Test:** Open browser Network tab → check if any of these files return 404.

**Quick fix:** If any are missing, create empty stub components:

```tsx
// client/src/components/LocalAudioCapture.tsx
export default function LocalAudioCapture(props: any) {
  return <div>Local Audio Capture (stub)</div>;
}
```

```tsx
// client/src/components/AIDashboard.tsx
export default function AIDashboard(props: any) {
  return <div>AI Dashboard (stub)</div>;
}
```

```tsx
// client/src/components/SystemDiagnostics.tsx
export default function SystemDiagnostics(props: any) {
  return <div>System Diagnostics (stub)</div>;
}
```

```tsx
// client/src/components/LiveQaDashboard.tsx
export default function LiveQaDashboard(props: any) {
  return <div>Live Q&A Dashboard (stub)</div>;
}
```

```tsx
// client/src/components/LiveSessionPanel.tsx
export default function LiveSessionPanel(props: any) {
  return <div>Live Session Panel (stub)</div>;
}
```

---

## Root Cause #2: tRPC `archiveUpload` Router Missing

The ShadowMode component calls tRPC hooks for **TWO different routers**, not just `shadowMode`:

```typescript
// Line 678 — called unconditionally on every render
const processTranscript = trpc.archiveUpload.processTranscript.useMutation({...});

// Line 687 — called unconditionally on every render  
const archives = trpc.archiveUpload.listArchives.useQuery();

// Line 806 — conditional but still a hook
const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(...);

// Line 811
const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation({...});

// Line 824
const generateReport = trpc.archiveUpload.generateReport.useMutation({...});
```

**If `archiveUpload` is not registered on the Manus server**, these hooks will crash the component — same as the original `shadowMode` issue.

### Required Server Router Registration:

```typescript
// server/routers.ts
import { archiveUploadRouter } from "./routers/archiveUploadRouter";

export const appRouter = router({
  shadowMode: shadowModeRouter,
  archiveUpload: archiveUploadRouter,  // ← REQUIRED — ShadowMode calls this too
  // ... other routers ...
});
```

**Quick stub if full implementation isn't ready:**

```typescript
// server/routers/archiveUploadRouter.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const archiveUploadRouter = router({
  listArchives: publicProcedure.query(async () => {
    return [];
  }),
  processTranscript: publicProcedure
    .input(z.object({
      clientName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      transcriptText: z.string(),
      eventDate: z.string().optional(),
      platform: z.string().optional(),
      notes: z.string().optional(),
      savedRecordingPath: z.string().optional(),
      transcriptionStatus: z.string().optional(),
      transcriptionError: z.string().optional(),
    }))
    .mutation(async () => {
      return { message: "Processed (stub)", archiveId: 1 };
    }),
  getArchiveDetail: publicProcedure
    .input(z.object({ archiveId: z.number() }))
    .query(async () => {
      return null;
    }),
  emailArchiveReport: publicProcedure
    .input(z.object({ archiveId: z.number(), recipientEmail: z.string(), recipientName: z.string().optional() }))
    .mutation(async () => {
      return { success: true, message: "Email sent (stub)" };
    }),
  generateReport: publicProcedure
    .input(z.object({ archiveId: z.number(), modules: z.array(z.string()).optional() }))
    .mutation(async () => {
      return { success: true };
    }),
});
```

---

## Root Cause #3: `@ts-nocheck` Is Hiding the Real Error

**Line 1 of the Replit ShadowMode.tsx:**

```typescript
// @ts-nocheck
```

This pragma disables TypeScript checking for the entire file. The Replit codebase uses this because the file is 4,221 lines long and has some intentional type flexibility.

**If Manus does NOT have `// @ts-nocheck`**, TypeScript will enforce strict typing on ALL 4,221 lines. Any type mismatch will:
1. Cause Vite's TypeScript transform to fail
2. Prevent the module from loading
3. Show the "Failed to reload /src/App.tsx" HMR error
4. Result in a blank page with no console error (because the module never loads)

**Fix:** Add `// @ts-nocheck` as the very first line of `ShadowMode.tsx`.

---

## Root Cause #4: `wouter` vs React Router

The Replit codebase uses **wouter** for routing:

```typescript
import { useLocation } from "wouter";
```

If Manus uses **react-router-dom** instead, this import will fail silently (or error), and the component won't mount.

**Fix:** Change the import to match Manus's router:

```typescript
// If using react-router-dom:
import { useNavigate } from "react-router-dom";

// Then replace the useLocation usage:
// OLD (wouter):
const [, navigate] = useLocation();

// NEW (react-router-dom):
const navigate = useNavigate();
```

---

## Debugging Sequence (Do These In Order)

### Step 1: Check Browser Console for Import Errors

Open DevTools → Console tab. Look for ANY red error, especially:
- `Failed to resolve import`
- `Module not found`
- `Cannot find module`
- `is not a function`
- `is not defined`

### Step 2: Check Network Tab for 404s

Open DevTools → Network tab → filter by "tsx" or "ts". Look for:
- `LocalAudioCapture.tsx` → 404?
- `AIDashboard.tsx` → 404?
- `SystemDiagnostics.tsx` → 404?
- `LiveQaDashboard.tsx` → 404?
- `LiveSessionPanel.tsx` → 404?

### Step 3: Add a Console Log at the Very Top

```typescript
export default function ShadowMode({ embedded }: { embedded?: boolean } = {}) {
  console.log("🔴 SHADOWMODE RENDER START");  // ← Add this

  // ... rest of component
```

Then check console:
- If `🔴 SHADOWMODE RENDER START` appears → component is mounting, crash is later
- If it does NOT appear → component never mounts (import error or routing issue)

### Step 4: Add Console Log Before Return

```typescript
  console.log("🟢 SHADOWMODE ABOUT TO RETURN JSX", { activeTab, showForm });  // ← Add this

  return (
    <div className={...}>
```

- If `🟢` appears → JSX is being returned, issue is CSS/layout
- If `🔴` appears but `🟢` does NOT → crash happens between hooks and return (Root Cause #1 or #2)

### Step 5: Bisect the Hooks

If `🔴` appears but `🟢` doesn't, comment out sections of hooks one by one to find which one crashes:

```typescript
// Comment out ALL archive-related hooks first:
// const processTranscript = trpc.archiveUpload.processTranscript.useMutation({...});
// const archives = trpc.archiveUpload.listArchives.useQuery();
// const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(...);
// const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation({...});
// const generateReport = trpc.archiveUpload.generateReport.useMutation({...});
```

If form appears after commenting these out → Root Cause #2 confirmed.

---

## Nuclear Option: Minimal ShadowMode Component

If all debugging fails, replace the entire `ShadowMode.tsx` with this minimal version that has ZERO external dependencies. If this renders, add back features one by one:

```tsx
import { useState } from "react";

export default function ShadowMode({ embedded }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState("live");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    eventName: "",
    eventType: "earnings_call",
    platform: "zoom",
    meetingUrl: "",
    notes: "",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Shadow Mode</h1>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "4px 0 0" }}>
          CuraLive runs silently — clients see nothing
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {["live", "archive", "reports"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #34d399" : "2px solid transparent",
              color: activeTab === tab ? "#6ee7b7" : "#64748b",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab === "live" ? "Live Intelligence" : tab === "archive" ? "Archive Upload" : "Reports"}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
        {activeTab === "live" && (
          <>
            {!showForm ? (
              <div style={{
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 32,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>
                  How do you want to capture this event?
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
                  Choose your intelligence capture method
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 20,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "white",
                    width: "100%",
                    maxWidth: 340,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Join Live Event</div>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, marginBottom: 0 }}>
                    Paste a Zoom, Teams, or Meet link. An AI bot joins silently and captures everything.
                  </p>
                </button>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "2px solid rgba(16,185,129,0.2)",
                borderRadius: 12,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>
                  Start a New Shadow Intelligence Session
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Client Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box" }}
                      placeholder="e.g. Anglo American Platinum"
                      value={formData.clientName}
                      onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Event Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box" }}
                      placeholder="e.g. Q4 2025 Earnings Call"
                      value={formData.eventName}
                      onChange={e => setFormData(f => ({ ...f, eventName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Event Type *</label>
                    <select
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box" }}
                      value={formData.eventType}
                      onChange={e => setFormData(f => ({ ...f, eventType: e.target.value }))}
                    >
                      <option value="earnings_call">Earnings Call</option>
                      <option value="interim_results">Interim Results</option>
                      <option value="annual_results">Annual Results</option>
                      <option value="agm">AGM</option>
                      <option value="capital_markets_day">Capital Markets Day</option>
                      <option value="webcast">Webcast</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Platform *</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[["zoom","Zoom"],["teams","Microsoft Teams"],["meet","Google Meet"],["webex","Cisco Webex"],["choruscall","Chorus Call"],["other","Other"]].map(([val, lab]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, platform: val }))}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            border: formData.platform === val ? "1px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.1)",
                            background: formData.platform === val ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                            color: formData.platform === val ? "#6ee7b7" : "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Meeting URL *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", boxSizing: "border-box" }}
                      placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                      value={formData.meetingUrl}
                      onChange={e => setFormData(f => ({ ...f, meetingUrl: e.target.value }))}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                    <textarea
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", resize: "none", boxSizing: "border-box" }}
                      placeholder="Any context about this event..."
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button
                    onClick={() => {
                      if (!formData.clientName || !formData.eventName || !formData.meetingUrl) {
                        alert("Please fill in all required fields");
                        return;
                      }
                      alert("Session would start here — connect to tRPC when ready");
                    }}
                    style={{
                      background: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Start Shadow Intelligence
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ background: "none", border: "none", color: "#94a3b8", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "archive" && (
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Archive Upload tab — coming soon</div>
        )}

        {activeTab === "reports" && (
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Reports tab — coming soon</div>
        )}
      </div>
    </div>
  );
}
```

**This minimal version:**
- Has ZERO imports except `useState` from React
- Has ZERO tRPC calls
- Has ZERO external component dependencies
- Uses ONLY inline styles (no CSS framework dependency)
- Has NO `wouter` or router dependency
- Will render the form with ALL fields

**If this renders → the issue is one of the dependencies. Add them back one at a time.**
**If this does NOT render → the issue is in App.tsx / routing / entry point, not in ShadowMode at all.**

---

## Architecture Difference: Manus vs Replit

**Critical finding:** In the working Replit codebase, `ShadowMode` is **NOT a standalone route at `/`**.

### Replit Architecture:
```
/ → Dashboard component
    └── Dashboard renders <ShadowMode embedded /> when tab === "shadow-mode"
```

The Dashboard itself (`Dashboard.tsx`) also calls `trpc.shadowMode.listSessions.useQuery()` for the quick-start cards. ShadowMode is always rendered as a child of Dashboard with the `embedded` prop.

### Manus Architecture (from their doc):
```
/ → ShadowMode component (standalone)
```

This difference means:
1. Manus's ShadowMode runs without `embedded` prop → triggers `window.history.pushState(null, "", "/shadow-mode")` on mount
2. If Manus's router listens to pushState, this URL change navigates away from `/` to `/shadow-mode`
3. If no route matches `/shadow-mode`, the component unmounts instantly

**Fix for Manus:** Either:
- Add `<Route path="/shadow-mode" component={ShadowMode} />` to their router
- OR remove the pushState effect from their ShadowMode copy
- OR pass `embedded` as true: `<Route path="/" element={<ShadowMode embedded />} />`

---

## Summary: Most Likely to Least Likely

| # | Root Cause | Probability | Quick Test |
|---|-----------|-------------|------------|
| 1 | Missing component imports (LocalAudioCapture, AIDashboard, etc.) | **Very High** | Check Network tab for 404s on .tsx files |
| 2 | Missing `archiveUpload` router on server | **High** | Comment out archive tRPC hooks, see if form appears |
| 3 | `pushState("/shadow-mode")` causing route unmount | **High** | Add `embedded` prop or remove the pushState useEffect |
| 4 | `wouter` import when Manus uses react-router | **Medium** | Check if `wouter` is installed in Manus's package.json |
| 5 | Missing `// @ts-nocheck` causing TypeScript build failure | **Medium** | Check terminal for TS errors on ShadowMode.tsx |
| 6 | Missing `sonner` / `@/components/ui/button` / lucide icons | **Low** | Check Network tab for any 404s |

---

*End of Definitive Debug Brief*
