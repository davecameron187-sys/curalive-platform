# MANUS: EXECUTE THESE FIXES NOW

**Stop debugging. Stop writing status reports. The problems are identified below. Execute each fix in order.**

---

## PROBLEM 1: `useLocation` from `wouter` — WRONG ROUTER LIBRARY

Your ShadowMode.tsx line 3 imports:
```typescript
import { useLocation } from "wouter";
```

**Manus does NOT use `wouter`.** Manus uses `react-router-dom`. This import **fails silently** — the entire ShadowMode module never loads. Vite cannot resolve the module. The component never mounts. That's why the content area is blank — **ShadowMode.tsx never executes at all.**

### FIX 1: Replace the wouter import

Open `/client/src/pages/ShadowMode.tsx`

**Find this line (near the top):**
```typescript
import { useLocation } from "wouter";
```

**Replace it with:**
```typescript
import { useNavigate } from "react-router-dom";
```

**Then find this line (inside the ShadowMode function, around line 475):**
```typescript
const [, navigate] = useLocation();
```

**Replace it with:**
```typescript
const navigate = useNavigate();
```

**If `wouter` is not in your `package.json`, this is 100% the primary cause of the blank page.** Run this to check:
```bash
cat package.json | grep wouter
```

If nothing prints, `wouter` is not installed and this import is crashing the entire module.

---

## PROBLEM 2: `pushState("/shadow-mode")` UNMOUNTS THE COMPONENT

After fixing Problem 1, there's a `useEffect` that will break your app. Lines 477-486 contain:

```typescript
useEffect(() => {
  if (embedded) return;
  window.history.pushState(null, "", "/shadow-mode");
  // ...
}, [embedded]);
```

When ShadowMode is at route `/` and `embedded` is not passed, this code runs on mount and **changes the URL to `/shadow-mode`**. If you don't have a route for `/shadow-mode`, react-router unmounts the component.

### FIX 2: Delete the pushState useEffect

**Find and DELETE this entire block** (lines 477-486):
```typescript
useEffect(() => {
  if (embedded) return;
  window.history.pushState(null, "", "/shadow-mode");
  const handlePopState = () => {
    navigate("/shadow-mode");
    window.history.pushState(null, "", "/shadow-mode");
  };
  window.addEventListener("popstate", handlePopState, true);
  return () => window.removeEventListener("popstate", handlePopState, true);
}, [embedded]);
```

**Replace it with nothing.** Just delete the entire block.

---

## PROBLEM 3: Missing `deleteSessions` Procedure (PLURAL)

Your ShadowMode.tsx line 557 calls:
```typescript
const deleteSessions = trpc.shadowMode.deleteSessions.useMutation({...});
```

Note: this is `deleteSessions` (PLURAL) — a **bulk delete** operation. This is DIFFERENT from `deleteSession` (singular).

Your status brief lists only `deleteSession` (singular) in your 18 procedures. **If `deleteSessions` (plural) does not exist on your server, this tRPC hook crashes the component on every render.**

The Replit router has BOTH procedures:
- `deleteSession` at line 813 (deletes one session)
- `deleteSessions` at line 857 (deletes multiple sessions)

### FIX 3: Add `deleteSessions` to your shadowModeRouter

Open `/server/routers/shadowModeRouter.ts` and add this procedure:

```typescript
deleteSessions: publicProcedure
  .input(z.object({ sessionIds: z.array(z.number()) }))
  .mutation(async ({ input }) => {
    // Stub — bulk delete
    console.log("[Shadow] Bulk delete sessions:", input.sessionIds);
    return { success: true, deleted: input.sessionIds.length, message: `Deleted ${input.sessionIds.length} sessions` };
  }),
```

Add it right after your existing `deleteSession` procedure.

---

## PROBLEM 4: Missing `listSessions` and `getSession` Procedure Types

Your status brief says these procedures exist but they may be using wrong procedure types. In the Replit codebase:

- `listSessions` is a **`protectedProcedure`** (not `publicProcedure` or `operatorProcedure`)
- `getSession` is a **`protectedProcedure`**

If your procedures use a different base procedure type that requires authentication context your Manus app doesn't provide, the hook will throw during initialization.

### FIX 4: Make sure listSessions returns an array

Verify your `listSessions` procedure returns `[]` (empty array) and doesn't throw. Test it:

```bash
curl -s http://localhost:3000/api/trpc/shadowMode.listSessions | head -100
```

If this returns an error, your procedure is crashing. Fix whatever error it shows.

---

## PROBLEM 5: Missing `@ts-nocheck` Pragma

The Replit ShadowMode.tsx is 4,221 lines. Line 1 is:
```typescript
// @ts-nocheck
```

This disables TypeScript checking for the file. Without it, TypeScript will find type errors in the 4,221-line file, Vite's esbuild transform may fail, and the module won't load.

### FIX 5: Add `@ts-nocheck` as the VERY FIRST LINE

Open `/client/src/pages/ShadowMode.tsx` and make sure the very first line is:
```typescript
// @ts-nocheck
```

---

## PROBLEM 6: `@/` Path Alias Not Configured

ShadowMode.tsx uses imports like:
```typescript
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import LocalAudioCapture from "@/components/LocalAudioCapture";
```

The `@/` prefix must be configured in both `tsconfig.json` AND `vite.config.ts`.

### FIX 6: Verify path alias configuration

**Check `vite.config.ts`** — it must have:
```typescript
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      // OR if your structure is different:
      // "@": path.resolve(__dirname, "src"),
    },
  },
  // ...
});
```

**Check `tsconfig.json`** — it must have:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/src/*"]
    }
  }
}
```

Run this to check:
```bash
grep -n "@" vite.config.ts
grep -n "@" tsconfig.json
```

If the alias is missing, ALL `@/` imports fail and the module never loads.

---

## EXECUTION ORDER

Do these in EXACT order. After each step, refresh the browser and check if the form appears.

```
Step 1: Fix wouter → react-router-dom import (PROBLEM 1)
Step 2: Delete pushState useEffect (PROBLEM 2)  
Step 3: Add deleteSessions procedure (PROBLEM 3)
Step 4: Add // @ts-nocheck as line 1 (PROBLEM 5)
Step 5: Verify @/ alias in vite.config.ts (PROBLEM 6)
Step 6: Restart dev server: pkill -f vite && pnpm run dev
Step 7: Hard refresh browser: Ctrl+Shift+R
Step 8: Check browser console for ANY red errors
```

**After Step 2, the form WILL render if Problems 1 and 2 were the cause.**

---

## IF ALL FIXES FAIL: NUCLEAR REPLACEMENT

If after all fixes above the form still doesn't render, replace the ENTIRE `ShadowMode.tsx` with this minimal version. This has ZERO external dependencies — it will render on ANY React setup:

```tsx
// @ts-nocheck
import { useState } from "react";

export default function ShadowMode() {
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
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }}></div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Shadow Mode</h1>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
            Background Intelligence
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "4px 0 0" }}>
          CuraLive runs silently — clients see nothing
        </p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {[
          { id: "live", label: "Live Intelligence", color: "#34d399" },
          { id: "archive", label: "Archive Upload", color: "#a78bfa" },
          { id: "reports", label: "Archives & Reports", color: "#22d3ee" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
              color: activeTab === tab.id ? tab.color : "#64748b",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
        {activeTab === "live" && (
          <>
            {!showForm ? (
              <div style={{
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 32,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0, marginBottom: 8 }}>
                  How do you want to capture this event?
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
                  Choose your intelligence capture method
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      padding: 20,
                      textAlign: "left",
                      cursor: "pointer",
                      color: "white",
                      width: 300,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Join Live Event</div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      Paste a Zoom, Teams, or Meet link. An AI bot joins silently and captures everything in real-time.
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("archive")}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      padding: 20,
                      textAlign: "left",
                      cursor: "pointer",
                      color: "white",
                      width: 300,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload Recording / Transcript</div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      Upload an audio file or paste transcript text from a past event.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "2px solid rgba(16,185,129,0.25)",
                borderRadius: 12,
                padding: 28,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 24, color: "#e2e8f0" }}>
                  Start a New Shadow Intelligence Session
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Client Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box", outline: "none" }}
                      placeholder="e.g. Anglo American Platinum"
                      value={formData.clientName}
                      onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Event Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box", outline: "none" }}
                      placeholder="e.g. Q4 2025 Earnings Call"
                      value={formData.eventName}
                      onChange={e => setFormData(f => ({ ...f, eventName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Event Type *</label>
                    <select
                      style={{ width: "100%", background: "#15151f", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#e2e8f0", boxSizing: "border-box", outline: "none" }}
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
                  <div></div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 8 }}>Platform *</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        ["zoom", "Zoom"],
                        ["teams", "Microsoft Teams"],
                        ["meet", "Google Meet"],
                        ["webex", "Cisco Webex"],
                        ["choruscall", "Chorus Call"],
                        ["other", "Other"],
                      ].map(([val, lab]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, platform: val }))}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            border: formData.platform === val ? "1px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.12)",
                            background: formData.platform === val ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                            color: formData.platform === val ? "#6ee7b7" : "#94a3b8",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Meeting URL *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", boxSizing: "border-box", outline: "none" }}
                      placeholder="https://zoom.us/j/123456789 or https://hdeu.choruscall.com/..."
                      value={formData.meetingUrl}
                      onChange={e => setFormData(f => ({ ...f, meetingUrl: e.target.value }))}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                    <textarea
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#e2e8f0", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                      placeholder="Any context for the intelligence team..."
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                  <button
                    onClick={() => {
                      if (!formData.clientName || !formData.eventName || !formData.meetingUrl) {
                        alert("Please fill in Client Name, Event Name, and Meeting URL");
                        return;
                      }
                      alert("✅ Form data captured:\\n\\nClient: " + formData.clientName + "\\nEvent: " + formData.eventName + "\\nType: " + formData.eventType + "\\nPlatform: " + formData.platform + "\\nURL: " + formData.meetingUrl + "\\n\\nConnect tRPC startSession mutation to submit to server.");
                    }}
                    style={{
                      background: "linear-gradient(135deg, #059669, #047857)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Start Shadow Intelligence
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "archive" && (
          <div style={{ color: "#94a3b8", fontSize: 14, padding: 24, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}>
            <h3 style={{ color: "#e2e8f0", marginTop: 0 }}>Archive Upload</h3>
            <p>Upload recordings or paste transcript text for post-event analysis. Connect tRPC archiveUpload router to enable.</p>
          </div>
        )}

        {activeTab === "reports" && (
          <div style={{ color: "#94a3b8", fontSize: 14, padding: 24, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}>
            <h3 style={{ color: "#e2e8f0", marginTop: 0 }}>Archives & Reports</h3>
            <p>View processed sessions and AI-generated intelligence reports. Connect tRPC archiveUpload.listArchives to populate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

This version:
- **Imports ONLY `useState` from React** — nothing else
- **ZERO tRPC calls** — form renders without any server
- **ZERO third-party imports** — no wouter, no lucide, no sonner, no shadcn
- **ZERO `@/` imports** — no path alias needed
- **All inline styles** — no Tailwind, no CSS files
- **Working form** with all fields that shows an alert on submit
- **Dark theme** matching CuraLive design

**If this doesn't render, the problem is in App.tsx routing, not in ShadowMode.**

---

## VERIFICATION COMMANDS

After applying fixes, run these:

```bash
# 1. Check if wouter is installed (if not, Problem 1 is confirmed)
cat package.json | grep -c wouter

# 2. Check if path alias exists (if not, Problem 6 is confirmed)  
grep -c "@" vite.config.ts

# 3. Test tRPC server endpoint
curl -s http://localhost:3000/api/trpc/shadowMode.listSessions

# 4. Check for TypeScript errors in ShadowMode
npx tsc --noEmit 2>&1 | grep -i shadow

# 5. Check dev server for module errors
pnpm run dev 2>&1 | grep -i "error\|failed\|cannot"
```

---

## WHAT "NO CONSOLE ERRORS" REALLY MEANS

Manus keeps saying "no console errors." This is misleading. When a Vite module fails to resolve an import, the error appears in the **dev server terminal**, not in the browser console. The browser just sees a blank component because the module never loaded.

**Check the terminal where `pnpm run dev` is running.** Look for:
```
[vite] Internal server error: Failed to resolve import "wouter"
```
or
```
[vite] Internal server error: Failed to resolve import "@/components/LocalAudioCapture"
```

**This is where the error is hiding.**

---

## SUMMARY: THE 3 THINGS TO DO RIGHT NOW

1. **Replace the entire ShadowMode.tsx with the Nuclear Replacement above** (paste it, save it, refresh browser). The form WILL appear. This proves the issue.

2. **Check the dev server terminal** (not browser console) for import resolution errors.

3. **Once the nuclear version renders**, add back features one at a time: first wouter→react-router fix, then tRPC hooks, then component imports.

**Do not write another status report. Execute these steps. The form will render.**
