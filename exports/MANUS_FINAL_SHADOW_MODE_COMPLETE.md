# SHADOW MODE — COMPLETE EXECUTION BRIEF

**DO NOT write a status report after reading this. DO NOT suggest "the Replit team needs to debug." YOU are the team. Execute each step below in order. Do not skip steps. Do not deviate.**

**This brief covers ALL 8 tabs: Live Intelligence, Archive Upload, Archives & Reports, AI Dashboard, AI Learning, AI Advisory, Live Q&A, System Test.**

---

## STEP 1: PROVE THE COMPONENT CAN RENDER (5 MINUTES)

Before anything else, you must prove that React can render content in the ShadowMode route. This eliminates ALL hypotheses at once.

**Do this now:**

1. Open `/client/src/pages/ShadowMode.tsx`
2. Select ALL content (Ctrl+A)
3. Delete everything
4. Paste this EXACTLY:

```tsx
import { useState } from "react";

export default function ShadowMode() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 40, background: "#0a0a0f", color: "white", minHeight: "100vh" }}>
      <h1>SHADOW MODE RENDER TEST</h1>
      <p>If you can see this, the routing works.</p>
      <button onClick={() => setCount(c => c + 1)} style={{ padding: "8px 16px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 16 }}>
        Clicked {count} times
      </button>
    </div>
  );
}
```

5. Save the file
6. Wait for Vite HMR to reload (or hard refresh with Ctrl+Shift+R)
7. Look at the page

**RESULT A — You see "SHADOW MODE RENDER TEST" and the button works:**
- The route is fine. The problem is inside the full ShadowMode code. Go to STEP 2.

**RESULT B — The page is still blank:**
- The problem is NOT in ShadowMode.tsx at all. It's in App.tsx routing or main.tsx.
- Go to STEP 1B.

---

### STEP 1B: FIX APP.TSX ROUTING (only if Step 1 Result B)

Check your App.tsx. The ShadowMode route must look like ONE of these:

**If using wouter:**
```tsx
import { Route, Switch } from "wouter";
import ShadowMode from "./pages/ShadowMode";

// Inside your Router/Switch:
<Route path="/" component={ShadowMode} />
```

**If using react-router-dom v6:**
```tsx
import { Route, Routes } from "react-router-dom";
import ShadowMode from "./pages/ShadowMode";

// Inside your Routes:
<Route path="/" element={<ShadowMode />} />
```

**If using react-router-dom v5:**
```tsx
import { Route, Switch } from "react-router-dom";
import ShadowMode from "./pages/ShadowMode";

// Inside your Switch:
<Route exact path="/" component={ShadowMode} />
```

Also check your `main.tsx` / `index.tsx` entry point. It must have:

**If using wouter (no wrapper needed):**
```tsx
import App from "./App";
createRoot(document.getElementById("root")!).render(<App />);
```

**If using react-router-dom:**
```tsx
import { BrowserRouter } from "react-router-dom";
import App from "./App";
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

After fixing, refresh. You MUST see "SHADOW MODE RENDER TEST" before proceeding. If you still don't, check the **dev server terminal** (not browser console) for errors.

---

## STEP 2: REPLACE WITH FULL WORKING COMPONENT (10 MINUTES)

Once Step 1 proves rendering works, replace ShadowMode.tsx with this complete self-contained version. This version has ALL 8 tabs with real UI but NO external component imports and NO tRPC calls. It will render on any React setup.

1. Open `/client/src/pages/ShadowMode.tsx`
2. Select ALL content (Ctrl+A)
3. Delete everything
4. Paste the entire contents of the file from APPENDIX A below
5. Save
6. Refresh browser

**Expected result:** You see Shadow Mode with header, all 8 tab buttons, and clicking each tab shows content. The Live Intelligence tab shows the full form with all fields. The form works (shows an alert on submit).

**If this works → Go to STEP 3.**
**If this doesn't work → You have a problem outside ShadowMode.tsx. Go back to STEP 1B.**

---

## STEP 3: ADD tRPC CONNECTIONS (20 MINUTES)

Once the UI renders, add tRPC hooks one at a time. After adding each hook, save and check if the page still renders.

### 3A: Verify your tRPC server has these routers registered

Open your server's main router file (usually `/server/routers.ts` or wherever `appRouter` is defined).

It MUST have ALL of these registered:

```typescript
export const appRouter = router({
  shadowMode: shadowModeRouter,           // 18+ procedures
  archiveUpload: archiveUploadRouter,     // 5 procedures
  adaptiveIntelligence: adaptiveIntelligenceRouter,  // 7 procedures
  aiEvolution: aiEvolutionRouter,         // 3 procedures
  advisoryBot: advisoryBotRouter,         // 3 procedures
  liveQa: liveQaRouter,                  // 15+ procedures
  systemDiagnostics: systemDiagnosticsRouter,  // 1 procedure
  platformEmbed: platformEmbedRouter,     // 2+ procedures
});
```

**If ANY of these routers are missing, the tab that uses them will crash the component.**

### 3B: Required shadowMode procedures (EXACT names)

Your `shadowModeRouter` must have these EXACT procedure names. If any are missing, create stubs.

```
listSessions        — query, returns array
getSession          — query, input: { sessionId: number }
startSession        — mutation
endSession          — mutation
retrySession        — mutation
deleteSession       — mutation (SINGULAR — deletes one)
deleteSessions      — mutation (PLURAL — deletes multiple, input: { sessionIds: number[] })
updateStatus        — mutation
pushTranscriptSegment — mutation
addNote             — mutation
deleteNote          — mutation
getNotes            — query
getActionLog        — query
qaAction            — mutation
getHandoffPackage   — query
exportSession       — query
```

**Critical:** `deleteSessions` (PLURAL) is different from `deleteSession` (SINGULAR). Both must exist.

### 3C: Required archiveUpload procedures

```
listArchives         — query, returns array
processTranscript    — mutation
getArchiveDetail     — query
emailArchiveReport   — mutation
generateReport       — mutation
```

### 3D: Required adaptiveIntelligence procedures

```
getLearningStats           — query
getAdaptiveThresholds      — query
getComplianceVocabulary    — query
getCorrections             — query
addComplianceKeyword       — mutation
toggleComplianceKeyword    — mutation
submitCorrection           — mutation
```

### 3E: Required aiEvolution procedures

```
getDashboard           — query
runAccumulation        — mutation
updateProposalStatus   — mutation
```

### 3F: Required advisoryBot procedures

```
getHistory      — query, input: { sessionKey: string }
chat            — mutation
clearHistory    — mutation
```

### 3G: Required liveQa procedures

```
getSessionByShadow    — query
listSessions          — query
listQuestions         — query
createSession         — mutation
updateQuestionStatus  — mutation
submitAnswer          — mutation
generateDraft         — mutation
updateSessionStatus   — mutation
sendToSpeaker         — mutation
broadcastToTeam       — mutation
postIrChatMessage     — mutation
generateQaCertificate — mutation
setLegalReview        — mutation
unlinkDuplicate       — mutation
generateContextDraft  — mutation
bulkAction            — mutation
```

### 3H: Required systemDiagnostics procedures

```
runFullDiagnostic    — mutation
```

### 3I: Required platformEmbed procedures

```
generateShareLink    — mutation
getEventSummary      — query
```

**For any router you haven't built yet, create a stub file.** Example stub for adaptiveIntelligence:

```typescript
import { z } from "zod";
import { router, publicProcedure } from "../trpc"; // adjust import path

export const adaptiveIntelligenceRouter = router({
  getLearningStats: publicProcedure.query(async () => ({
    totalCorrections: 0, maturityLevel: "Initialising", maturityScore: 0,
    correctionsByType: {}, adaptedThresholds: 0,
  })),
  getAdaptiveThresholds: publicProcedure.query(async () => []),
  getComplianceVocabulary: publicProcedure.query(async () => []),
  getCorrections: publicProcedure.input(z.object({ limit: z.number().optional() })).query(async () => []),
  addComplianceKeyword: publicProcedure.input(z.object({ keyword: z.string() })).mutation(async ({ input }) => ({ message: `Added: ${input.keyword}` })),
  toggleComplianceKeyword: publicProcedure.input(z.object({ id: z.number() })).mutation(async () => ({ success: true })),
  submitCorrection: publicProcedure.input(z.any()).mutation(async () => ({ success: true })),
});
```

---

## STEP 4: ADD EXTERNAL COMPONENT IMPORTS (15 MINUTES)

The full Replit ShadowMode.tsx imports 5 external components. Each must exist in your codebase.

### Required files:

**1. `/client/src/components/LocalAudioCapture.tsx`**
Used in: Live Intelligence tab (browser microphone capture)
If missing, create stub:
```tsx
export default function LocalAudioCapture(props: any) {
  return (
    <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Local Audio Capture — stub component</p>
      <p style={{ color: "#64748b", fontSize: 12 }}>Full implementation captures browser microphone and sends to Whisper AI for transcription.</p>
    </div>
  );
}
```

**2. `/client/src/components/AIDashboard.tsx`** (or `/client/src/pages/AIDashboard.tsx`)
Used in: AI Dashboard tab
If missing, create stub:
```tsx
export default function AIDashboard(props: any) {
  return (
    <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>AI Dashboard — stub component</p>
      <p style={{ color: "#64748b", fontSize: 12 }}>Shows AI analysis results across all sessions.</p>
    </div>
  );
}
```

**3. `/client/src/components/SystemDiagnostics.tsx`**
Used in: System Test tab
If missing, create stub:
```tsx
export default function SystemDiagnostics(props: any) {
  return (
    <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>System Diagnostics — stub component</p>
      <p style={{ color: "#64748b", fontSize: 12 }}>Runs full system health check: database, Recall.ai, Ably, Whisper.</p>
    </div>
  );
}
```

**4. `/client/src/components/LiveQaDashboard.tsx`**
Used in: Live Q&A tab
If missing, create stub:
```tsx
export default function LiveQaDashboard(props: any) {
  return (
    <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Live Q&A Dashboard — stub component</p>
      <p style={{ color: "#64748b", fontSize: 12 }}>Manages investor questions during live events.</p>
    </div>
  );
}
```

**5. `/client/src/components/LiveSessionPanel.tsx`**
Used in: Live session overlay (appears when a session is active)
If missing, create stub:
```tsx
export default function LiveSessionPanel(props: any) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ padding: 24, background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, maxWidth: 600, width: "100%" }}>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Live Session Panel — stub component</p>
        <button onClick={props.onClose} style={{ marginTop: 16, padding: "8px 16px", background: "#374151", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}
```

---

## STEP 5: SWAP IN THE FULL REPLIT SHADOWMODE.TSX

Once Steps 1-4 are confirmed working:

1. Get the full 4,221-line `ShadowMode.tsx` from the Replit codebase
2. Make sure line 1 is `// @ts-nocheck`
3. Check that line 3 (`import { useLocation } from "wouter"`) matches your router library
4. If you use react-router-dom, change line 3 to `import { useNavigate } from "react-router-dom"` and change line 475 from `const [, navigate] = useLocation()` to `const navigate = useNavigate()`
5. Remove the `useEffect` at lines 477-486 (the pushState block) — it's only needed when ShadowMode is embedded inside Dashboard
6. Save and refresh

---

## APPENDIX A: COMPLETE SELF-CONTAINED SHADOWMODE.TSX (ALL 8 TABS)

```tsx
// @ts-nocheck
import { useState } from "react";

const TABS = [
  { id: "live", label: "Live Intelligence", color: "#34d399" },
  { id: "archive", label: "Archive Upload", color: "#a78bfa" },
  { id: "reports", label: "Archives & Reports", color: "#22d3ee" },
  { id: "aidashboard", label: "AI Dashboard", color: "#fbbf24" },
  { id: "ailearning", label: "AI Learning", color: "#c084fc" },
  { id: "advisory", label: "AI Advisory", color: "#fb7185" },
  { id: "liveqa", label: "Live Q&A", color: "#2dd4bf" },
  { id: "diagnostics", label: "System Test", color: "#818cf8" },
];

const EVENT_TYPES = [
  ["earnings_call", "Earnings Call"],
  ["interim_results", "Interim Results"],
  ["annual_results", "Annual Results"],
  ["agm", "AGM"],
  ["capital_markets_day", "Capital Markets Day"],
  ["webcast", "Webcast"],
  ["other", "Other"],
];

const PLATFORMS = [
  ["zoom", "Zoom"],
  ["teams", "Microsoft Teams"],
  ["meet", "Google Meet"],
  ["webex", "Cisco Webex"],
  ["choruscall", "Chorus Call"],
  ["other", "Other"],
];

export default function ShadowMode({ embedded }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState("live");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "", eventName: "", eventType: "earnings_call",
    platform: "zoom", meetingUrl: "", notes: "",
  });
  const [archiveForm, setArchiveForm] = useState({
    clientName: "", eventName: "", eventType: "", eventDate: "",
    platform: "", notes: "", transcriptText: "",
  });
  const [archiveInputMode, setArchiveInputMode] = useState("paste");
  const [advisoryMessage, setAdvisoryMessage] = useState("");
  const [advisoryHistory, setAdvisoryHistory] = useState([]);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
    padding: "10px 12px", fontSize: 14, color: "#e2e8f0",
    boxSizing: "border-box", outline: "none",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: 24,
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: "#0a0a0f", color: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {!embedded && (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", background: "#0d0d14" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }}></div>
                <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Shadow Mode</h1>
                <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
                  Background Intelligence
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "4px 0 0" }}>
                CuraLive runs silently — clients see nothing
              </p>
            </div>
            <button
              onClick={() => { setActiveTab("live"); setShowForm(true); }}
              style={{ background: "#059669", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              New Live Event
            </button>
          </div>
        </div>
      )}

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "#0d0d14" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px", fontSize: 13, fontWeight: 500,
                background: "none", border: "none", whiteSpace: "nowrap",
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                color: activeTab === tab.id ? tab.color : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>

        {/* ═══ LIVE INTELLIGENCE ═══ */}
        {activeTab === "live" && (
          <>
            {!showForm ? (
              <div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.03)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 8 }}>
                  How do you want to capture this event?
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Choose your intelligence capture method</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <button onClick={() => setShowForm(true)} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>📡</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Join Live Event</div>
                    <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Free — no call charges</div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Paste a Zoom, Teams, or Meet link. An AI bot joins silently, transcribes in real time, and runs the full intelligence pipeline.</p>
                  </button>
                  <button onClick={() => setActiveTab("archive")} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>🎙️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload Recording</div>
                    <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Audio or video file</div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Upload an MP3, WAV, M4A, MP4, or MOV recording. Whisper AI transcribes, then the full 20-module AI report runs.</p>
                  </button>
                  <button onClick={() => { setActiveTab("archive"); setArchiveInputMode("paste"); }} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Paste Transcript</div>
                    <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Text or .txt file</div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Paste raw transcript text or upload a .txt file. Runs sentiment analysis, compliance scanning, and the full AI report.</p>
                  </button>
                </div>
                <p style={{ color: "#475569", fontSize: 12, textAlign: "center", marginTop: 20, marginBottom: 0 }}>
                  Every input path runs all 20 AI modules and stores the intelligence in your database — building your data asset for every event.
                </p>
              </div>
            ) : (
              <div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.25)", border: "2px solid rgba(16,185,129,0.25)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 24, color: "#e2e8f0" }}>
                  Start a New Shadow Intelligence Session
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Client Name *</label>
                    <input style={inputStyle} placeholder="e.g. Anglo American Platinum" value={formData.clientName}
                      onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Event Name *</label>
                    <input style={inputStyle} placeholder="e.g. Q4 2025 Earnings Call" value={formData.eventName}
                      onChange={e => setFormData(f => ({ ...f, eventName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Event Type *</label>
                    <select style={{ ...inputStyle, background: "#15151f" }} value={formData.eventType}
                      onChange={e => setFormData(f => ({ ...f, eventType: e.target.value }))}>
                      {EVENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div></div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 8 }}>Platform *</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {PLATFORMS.map(([val, lab]) => (
                        <button key={val} type="button" onClick={() => setFormData(f => ({ ...f, platform: val }))}
                          style={{
                            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                            border: formData.platform === val ? "1px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.12)",
                            background: formData.platform === val ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                            color: formData.platform === val ? "#6ee7b7" : "#94a3b8",
                          }}>
                          {lab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Meeting URL *</label>
                    <input style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                      value={formData.meetingUrl} onChange={e => setFormData(f => ({ ...f, meetingUrl: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                    <textarea style={{ ...inputStyle, resize: "vertical" }} placeholder="Any context for the intelligence team..." rows={3}
                      value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                  <button
                    onClick={() => {
                      if (!formData.clientName || !formData.eventName || !formData.meetingUrl) {
                        alert("Please fill in Client Name, Event Name, and Meeting URL");
                        return;
                      }
                      alert("Form data ready for tRPC submission:\n\nClient: " + formData.clientName + "\nEvent: " + formData.eventName + "\nType: " + formData.eventType + "\nPlatform: " + formData.platform + "\nURL: " + formData.meetingUrl + "\n\nConnect trpc.shadowMode.startSession.useMutation() to submit.");
                    }}
                    style={{ background: "linear-gradient(135deg, #059669, #047857)", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Start Shadow Intelligence
                  </button>
                  <button onClick={() => setShowForm(false)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ ARCHIVE UPLOAD ═══ */}
        {activeTab === "archive" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>Archive Upload — build your database retroactively</div>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                Upload any past event — earnings calls, AGMs, town halls — and CuraLive processes it through the same intelligence pipeline as a live session. Paste a transcript, upload a .txt file, or upload an audio/video recording.
              </p>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              if (!archiveForm.clientName || !archiveForm.eventName || !archiveForm.eventType) {
                alert("Please fill in Client Name, Event Name, and Event Type"); return;
              }
              if (archiveInputMode === "paste" && !archiveForm.transcriptText.trim()) {
                alert("Please paste transcript text"); return;
              }
              alert("Archive ready for tRPC submission:\n\nClient: " + archiveForm.clientName + "\nEvent: " + archiveForm.eventName + "\nType: " + archiveForm.eventType + "\nWords: " + archiveForm.transcriptText.split(/\s+/).filter(Boolean).length + "\n\nConnect trpc.archiveUpload.processTranscript.useMutation() to submit.");
            }}>
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>Event Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Client Name *</label>
                    <input style={inputStyle} placeholder="e.g. Anglo American Platinum" value={archiveForm.clientName}
                      onChange={e => setArchiveForm(f => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Event Name *</label>
                    <input style={inputStyle} placeholder="e.g. Q4 2024 Earnings Call" value={archiveForm.eventName}
                      onChange={e => setArchiveForm(f => ({ ...f, eventName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Event Type *</label>
                    <select style={{ ...inputStyle, background: "#15151f" }} value={archiveForm.eventType}
                      onChange={e => setArchiveForm(f => ({ ...f, eventType: e.target.value }))}>
                      <option value="">Select type...</option>
                      {EVENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Event Date</label>
                    <input type="date" style={inputStyle} value={archiveForm.eventDate}
                      onChange={e => setArchiveForm(f => ({ ...f, eventDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Notes</label>
                    <input style={inputStyle} placeholder="Any context..." value={archiveForm.notes}
                      onChange={e => setArchiveForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>Transcript Source *</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[["paste", "Paste Text"], ["file", "Upload .txt"], ["recording", "Upload Recording"]].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setArchiveInputMode(key)}
                      style={{
                        padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                        background: archiveInputMode === key ? "#7c3aed" : "rgba(255,255,255,0.05)",
                        color: archiveInputMode === key ? "white" : "#94a3b8",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
                {archiveInputMode === "paste" && (
                  <div>
                    <textarea style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }} rows={12}
                      placeholder="Paste the full event transcript here. Speaker labels, timestamps, Q&A sections — paste it as-is."
                      value={archiveForm.transcriptText}
                      onChange={e => setArchiveForm(f => ({ ...f, transcriptText: e.target.value }))} />
                    {archiveForm.transcriptText && (
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{archiveForm.transcriptText.split(/\s+/).filter(Boolean).length.toLocaleString()} words detected</p>
                    )}
                  </div>
                )}
                {archiveInputMode === "file" && (
                  <div style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, textAlign: "center" }}>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>Click to upload a .txt file (connect file input when adding tRPC)</p>
                  </div>
                )}
                {archiveInputMode === "recording" && (
                  <div style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, textAlign: "center" }}>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>Click to upload audio/video (MP3, MP4, WAV, M4A, WebM)</p>
                    <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>CuraLive will transcribe via Whisper AI, then run the full intelligence pipeline</p>
                  </div>
                )}
              </div>
              <button type="submit" style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Process Archive & Generate Intelligence
              </button>
            </form>
          </div>
        )}

        {/* ═══ ARCHIVES & REPORTS ═══ */}
        {activeTab === "reports" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>Archives & Reports</div>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                Browse all events processed through CuraLive. Each event gets a comprehensive AI intelligence report with 20 analysis modules — executive summary, sentiment analysis, compliance review, key topics, speaker analysis, Q&A breakdown, action items, investor signals, communication scoring, risk factors, competitive intelligence, and strategic recommendations.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Past Events</div>
                <p style={{ color: "#475569", fontSize: 13 }}>No archive events yet. Process events via Archive Upload to see them here.</p>
                <p style={{ color: "#374151", fontSize: 12, marginTop: 8 }}>Connect trpc.archiveUpload.listArchives.useQuery() to populate this list.</p>
              </div>
              <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📊</div>
                  <p style={{ color: "#64748b", fontSize: 14 }}>Select an event to view its intelligence report</p>
                  <p style={{ color: "#475569", fontSize: 12 }}>Click any event on the left to see the full breakdown</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ AI DASHBOARD ═══ */}
        {activeTab === "aidashboard" && (
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>AI Dashboard</div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
              Overview of AI analysis across all Shadow Mode sessions. Shows aggregate sentiment, engagement trends, compliance patterns, and strategic insights.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Sessions Analyzed", value: "0", color: "#fbbf24" },
                { label: "Avg Sentiment", value: "—", color: "#34d399" },
                { label: "Compliance Flags", value: "0", color: "#f87171" },
                { label: "Words Processed", value: "0", color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "#374151", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Connect the AIDashboard component and trpc.shadowMode.listSessions to populate with real data.
            </p>
          </div>
        )}

        {/* ═══ AI LEARNING ═══ */}
        {activeTab === "ailearning" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>AI Learning Engine</div>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                CuraLive's AI improves with every operator correction. When you override a sentiment score, dismiss a false compliance flag, or add a new keyword, those corrections become training signals that calibrate future analysis.
              </p>
            </div>
            <div style={{ ...cardStyle, borderColor: "rgba(168,85,247,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>AI Maturity Level</div>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Based on 0 operator corrections</p>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)", color: "#94a3b8" }}>
                  Initialising
                </span>
              </div>
              <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 8, height: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "5%", borderRadius: 8, background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#475569" }}>
                <span>Initialising</span><span>Learning</span><span>Adapting</span><span>Calibrated</span><span>Self-Evolving</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
              {[
                { label: "Total Corrections", value: "0", color: "#c084fc" },
                { label: "Sentiment Overrides", value: "0", color: "#34d399" },
                { label: "Compliance Adjustments", value: "0", color: "#fbbf24" },
                { label: "Adapted Thresholds", value: "0", color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "#374151", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Connect trpc.adaptiveIntelligence and trpc.aiEvolution routers to populate with real learning data.
            </p>
          </div>
        )}

        {/* ═══ AI ADVISORY ═══ */}
        {activeTab === "advisory" && (
          <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(251,113,133,0.1)" }}>
                <span style={{ fontSize: 20 }}>🧠</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Private AI Advisory Bot</div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Query across all captured event intelligence</p>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>🧠</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>Ask anything about your events</h3>
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", maxWidth: 400, marginBottom: 20 }}>
                The advisory bot has access to all your captured event data, AI reports, sentiment analysis, and compliance reviews.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 500 }}>
                {[
                  "What are the top risks across all recent events?",
                  "Which client has the lowest sentiment trend?",
                  "Summarize compliance flags from the past month",
                  "What key topics were discussed most frequently?",
                ].map((q, i) => (
                  <button key={i} onClick={() => setAdvisoryMessage(q)}
                    style={{ ...cardStyle, padding: 12, fontSize: 12, color: "#94a3b8", textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", gap: 12 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Ask about events, sentiment, compliance, risks..."
                value={advisoryMessage} onChange={e => setAdvisoryMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && advisoryMessage.trim()) { alert("Connect trpc.advisoryBot.chat mutation to send: " + advisoryMessage); setAdvisoryMessage(""); }}} />
              <button onClick={() => { if (advisoryMessage.trim()) { alert("Connect trpc.advisoryBot.chat mutation"); setAdvisoryMessage(""); }}}
                style={{ background: "rgba(251,113,133,0.2)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: 12, padding: "0 16px", color: "#fb7185", cursor: "pointer", fontSize: 16 }}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* ═══ LIVE Q&A ═══ */}
        {activeTab === "liveqa" && (
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>Live Q&A Dashboard</div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
              Manage investor questions during live events. Triage, draft answers, send to speakers, and generate Q&A compliance certificates.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Total Questions", value: "0", color: "#2dd4bf" },
                { label: "Answered", value: "0", color: "#34d399" },
                { label: "Pending", value: "0", color: "#fbbf24" },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "#374151", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Connect the LiveQaDashboard component and trpc.liveQa router to enable full Q&A management.
            </p>
          </div>
        )}

        {/* ═══ SYSTEM TEST ═══ */}
        {activeTab === "diagnostics" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>System Diagnostics</div>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Run a comprehensive health check across all CuraLive subsystems.</p>
              </div>
              <button onClick={() => {
                setDiagnosticRunning(true);
                setTimeout(() => {
                  setDiagnosticResult({
                    database: true, trpc: true, recall: false, ably: false, whisper: false,
                  });
                  setDiagnosticRunning(false);
                }, 1500);
              }}
                disabled={diagnosticRunning}
                style={{ background: diagnosticRunning ? "#374151" : "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: diagnosticRunning ? "not-allowed" : "pointer" }}>
                {diagnosticRunning ? "Running..." : "Run Full Diagnostic"}
              </button>
            </div>
            {diagnosticResult && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {Object.entries(diagnosticResult).map(([key, ok]) => (
                  <div key={key} style={{ ...cardStyle, textAlign: "center", borderColor: ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{ok ? "✅" : "❌"}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: ok ? "#34d399" : "#f87171", textTransform: "capitalize" }}>{key}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ok ? "Connected" : "Not configured"}</div>
                  </div>
                ))}
              </div>
            )}
            {!diagnosticResult && !diagnosticRunning && (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center" }}>Click "Run Full Diagnostic" to test all connections.</p>
            )}
            <p style={{ color: "#374151", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Connect the SystemDiagnostics component and trpc.systemDiagnostics.runFullDiagnostic to run real checks.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
```

---

## EXECUTION CHECKLIST

```
[ ] Step 1: Paste render test → see "SHADOW MODE RENDER TEST" → confirms routing works
[ ] Step 2: Paste APPENDIX A → see all 8 tabs with content → confirms UI renders
[ ] Step 3: Register all 8 tRPC routers on server (stub any missing ones)
[ ] Step 4: Create stub files for 5 imported components (if missing)
[ ] Step 5: Swap in full Replit ShadowMode.tsx (4,221 lines)
```

**Do Steps 1 and 2 RIGHT NOW. They take 5 minutes. If Step 2 renders, the problem is solved and you just need to incrementally add back the tRPC connections.**

**Do not write another status report. Paste the code. Save. Refresh. Report what you see.**
