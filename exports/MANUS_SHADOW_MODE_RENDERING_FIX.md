# Shadow Mode Live Intelligence — Root Cause & Fix

**Status:** The rendering problem is NOT a CSS issue, NOT a component pattern issue, and NOT a caching issue.  
**Root Cause:** The server-side tRPC router is incomplete — `shadowMode.startSession` and other procedures are not implemented on the Manus server. This causes React to crash silently when tRPC hooks try to initialize.

---

## The Smoking Gun

From the Manus debugging brief:

> `/server/routers.ts` — **Status: Incomplete** — `shadowMode.startSession mutation not yet implemented`

This is the root cause. Here's why:

### What Happens When tRPC Procedures Are Missing

1. `ShadowMode.tsx` calls `trpc.shadowMode.listSessions.useQuery()` on mount
2. The tRPC React client tries to call the server procedure
3. If `shadowMode` is not registered on the server's `appRouter`, or the procedures don't exist, the tRPC client throws during initialization
4. React catches the error during render
5. **The entire component tree unmounts** — the component returns nothing
6. The header and tabs may render briefly from a cached state, but the content area is blank
7. If there's an ErrorBoundary, it might show an error page — but if the error happens inside a useQuery/useMutation hook during the first render, it can fail silently with just a console warning

### Why The Debugging Steps Didn't Work

- Changing CSS: irrelevant — component isn't rendering at all
- Changing component patterns: irrelevant — the pattern is fine, the server call crashes it
- Clearing cache: irrelevant — the crash is on every fresh render
- Adding test indicators: they're inside the component that crashes, so they never appear
- The Vite HMR error ("Failed to reload /src/App.tsx") is a **secondary symptom** — when the server can't resolve the tRPC procedure types, HMR fails

---

## The Fix (Two Parts)

### Part 1: Make the Component Render Without a Working Server

Wrap tRPC hooks so they don't crash the component. This lets the form render even before the server is ready.

```tsx
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

  // Wrap queries in try-catch — they WILL fail if server procedures don't exist
  let sessions: any = { data: [], isLoading: false, refetch: () => {} };
  try {
    sessions = trpc.shadowMode.listSessions.useQuery(undefined, {
      refetchInterval: 5000,
      retry: false,  // Don't spam retries if procedure doesn't exist
    });
  } catch (e) {
    console.error("[ShadowMode] listSessions hook failed:", e);
  }

  // For mutations, use a safe wrapper
  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data: any) => {
      alert(data.message || "Session started");
      setShowForm(false);
    },
    onError: (e: any) => {
      alert("Error: " + (e.message || "Failed to start session"));
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0a0a0f", color: "white" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Shadow Mode</h1>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          CuraLive runs silently — clients see nothing
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => setActiveTab("live")}
          style={{
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 500,
            background: "none",
            border: "none",
            borderBottom: activeTab === "live" ? "2px solid #34d399" : "2px solid transparent",
            color: activeTab === "live" ? "#6ee7b7" : "#64748b",
            cursor: "pointer",
          }}
        >
          Live Intelligence
        </button>
        {/* Add other tab buttons as needed */}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        {activeTab === "live" && (
          <>
            {!showForm && (
              <div style={{
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  How do you want to capture this event?
                </h2>
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
                    maxWidth: 300,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Join Live Event</div>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Paste a Zoom, Teams, or Meet link. An AI bot joins silently.
                  </p>
                </button>
              </div>
            )}

            {showForm && (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "2px solid rgba(16,185,129,0.2)",
                borderRadius: 12,
                padding: 24,
                maxWidth: 700,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                  Start a New Shadow Intelligence Session
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Client Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0" }}
                      placeholder="e.g. Anglo American Platinum"
                      value={formData.clientName}
                      onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Event Name *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0" }}
                      placeholder="e.g. Q4 2025 Earnings Call"
                      value={formData.eventName}
                      onChange={e => setFormData(f => ({ ...f, eventName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Event Type *</label>
                    <select
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0" }}
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
                      {[
                        ["zoom", "Zoom"],
                        ["teams", "Microsoft Teams"],
                        ["meet", "Google Meet"],
                        ["webex", "Cisco Webex"],
                        ["choruscall", "Chorus Call"],
                        ["other", "Other"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, platform: value }))}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            border: formData.platform === value ? "1px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.1)",
                            background: formData.platform === value ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                            color: formData.platform === value ? "#6ee7b7" : "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Meeting URL *</label>
                    <input
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", fontFamily: "monospace" }}
                      placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                      value={formData.meetingUrl}
                      onChange={e => setFormData(f => ({ ...f, meetingUrl: e.target.value }))}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                    <textarea
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", resize: "none" }}
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
                      startSession.mutate({
                        clientName: formData.clientName,
                        eventName: formData.eventName,
                        eventType: formData.eventType,
                        platform: formData.platform,
                        meetingUrl: formData.meetingUrl,
                        notes: formData.notes || undefined,
                        webhookBaseUrl: window.location.origin,
                      });
                    }}
                    disabled={startSession.isPending}
                    style={{
                      background: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: startSession.isPending ? 0.5 : 1,
                    }}
                  >
                    {startSession.isPending ? "Deploying bot..." : "Start Shadow Intelligence"}
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
      </div>
    </div>
  );
}
```

### Part 2: Register the shadowMode Router on the Server

The server must have the `shadowMode` router registered. At minimum, even stub procedures will prevent the crash.

**Option A: Full Router (copy from Replit)**

Copy `server/routers/shadowModeRouter.ts` from the Replit codebase and register it:

```typescript
// In server/routers.ts (or wherever the appRouter is defined)
import { shadowModeRouter } from "./routers/shadowModeRouter";

export const appRouter = router({
  // ... other routers ...
  shadowMode: shadowModeRouter,
});
```

**Option B: Stub Router (get the form rendering immediately, implement later)**

```typescript
// server/routers/shadowModeRouter.ts — STUB VERSION
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";

export const shadowModeRouter = router({
  listSessions: publicProcedure.query(async () => {
    return [];
  }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async () => {
      throw new Error("Not implemented yet");
    }),

  startSession: publicProcedure
    .input(z.object({
      clientName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      platform: z.string().default("zoom"),
      meetingUrl: z.string(),
      webhookBaseUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Shadow] Start session requested:", input);
      return {
        sessionId: 1,
        botId: null,
        ablyChannel: `shadow-1-${Date.now()}`,
        status: "pending" as const,
        agmSessionId: null,
        manualCapture: false,
        message: "Session created (stub — full implementation pending)",
      };
    }),

  endSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async () => {
      return { success: true, transcriptSegments: 0, taggedMetricsGenerated: 0, message: "Session ended (stub)" };
    }),

  retrySession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async () => {
      return { sessionId: 1, botId: null, ablyChannel: "", status: "pending", message: "Retry (stub)" };
    }),

  deleteSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async () => {
      return { success: true, message: "Deleted (stub)" };
    }),

  updateStatus: publicProcedure
    .input(z.object({ sessionId: z.number(), status: z.string() }))
    .mutation(async () => {
      return { success: true };
    }),

  pushTranscriptSegment: publicProcedure
    .input(z.object({ sessionId: z.number(), speaker: z.string(), text: z.string(), timestamp: z.number() }))
    .mutation(async () => {
      return { success: true, segmentCount: 0 };
    }),

  getNotes: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async () => {
      return [];
    }),

  addNote: publicProcedure
    .input(z.object({ sessionId: z.number(), text: z.string() }))
    .mutation(async () => {
      return { success: true, noteId: "stub", noteCount: 0 };
    }),

  deleteNote: publicProcedure
    .input(z.object({ sessionId: z.number(), noteId: z.string() }))
    .mutation(async () => {
      return { success: true };
    }),

  getActionLog: publicProcedure
    .input(z.object({ sessionId: z.number().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  exportSession: publicProcedure
    .input(z.object({ sessionId: z.number(), format: z.enum(["csv", "json", "pdf"]) }))
    .query(async () => {
      return { content: "", filename: "", contentType: "text/plain" };
    }),

  getHandoffPackage: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async () => {
      return { session: {}, transcript: { segments: [], wordCount: 0 }, recording: { url: null }, notes: [], actionLog: [], aiReport: null, readiness: { score: 0, maxScore: 4 } };
    }),
});
```

Then register it in your `appRouter`:

```typescript
import { shadowModeRouter } from "./routers/shadowModeRouter";

export const appRouter = router({
  // ... existing routers ...
  shadowMode: shadowModeRouter,
});
```

---

## Quick Verification Test

After applying the fix, open browser console and run:

```javascript
// Should return a number > 0 (the content div exists)
document.querySelectorAll('input').length

// Should show the ShadowMode container
document.querySelector('[style*="min-height: 100vh"]')

// Should show tab buttons
document.querySelectorAll('button').length
```

---

## Summary

| Problem | Cause | Fix |
|---------|-------|-----|
| Form not rendering | Server router missing → tRPC hooks crash → component unmounts | Register `shadowMode` router on server (full or stub) |
| Vite HMR error | Type mismatch when server types don't include `shadowMode` procedures | Fix resolves automatically once router is registered |
| Test indicators not showing | They're inside the crashed component | Fix resolves automatically |
| Content div not in DOM | Parent component crashes before rendering children | Fix resolves automatically |

The form code is correct. The component pattern is correct. The CSS is correct. **The server just needs the router.**

---

*End of Rendering Fix Brief*
