# Shadow Mode Live Intelligence — Rendering Fix Brief for Manus

**Problem:** The Live Intelligence form is not rendering when clicking the "Live Intelligence" tab.  
**Root Cause:** The `TabContent` component pattern Manus is using is structurally different from the working Replit implementation. The issue is almost certainly the `TabContent` function not being called or returned correctly.  
**Solution:** Replace the `TabContent` switch-case pattern with inline conditional rendering, matching the working Replit codebase.

---

## The Working Pattern (from Replit Production Code)

The Replit `ShadowMode.tsx` (4,221 lines, fully working) does **NOT** use a `TabContent` function or a `switch` statement. It uses **inline conditional rendering** directly in the JSX return.

### Architecture Difference

**Manus approach (broken):**
```tsx
function TabContent({ tabId, liveSession }) {
  switch(tabId) {
    case "live":
      return <div>...form...</div>;
    case "nervecenter":
      return <div>...</div>;
    // etc.
  }
}

// In the main component return:
<TabContent tabId={subNav} liveSession={liveSession} />
```

**Replit approach (working):**
```tsx
export default function ShadowMode() {
  const [activeTab, setActiveTab] = useState("live");
  // All state lives in the main component — NOT in a child

  return (
    <div>
      {/* Tabs */}
      {/* Content — inline conditionals, no child component */}
      {activeTab === "live" && (
        <>
          {/* Form and session list rendered here */}
        </>
      )}
      {activeTab === "archive" && (
        <>
          {/* Archive tab content here */}
        </>
      )}
      {/* etc. */}
    </div>
  );
}
```

### Why This Matters

1. **All state (form fields, mutations, queries) live in the main `ShadowMode` component** — not passed down to a child. The tRPC hooks (`useMutation`, `useQuery`) must be called in the same component that renders them.
2. **No child component wrapping** — eliminates the risk of the child not mounting, not returning, or losing React hook context.
3. **The `&&` pattern** is simpler and cannot silently fail the way a `switch` statement can (e.g., missing `return`, wrong `case` value, or the function not being invoked at all).

---

## Exact Working Code for the Live Intelligence Tab

### Step 1: State Setup (in the main ShadowMode component)

```tsx
export default function ShadowMode() {
  // Tab state
  const [activeTab, setActiveTab] = useState("live");

  // Live Intelligence state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    eventName: "",
    eventType: "earnings_call",
    platform: "zoom",
    meetingUrl: "",
    notes: "",
  });
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // tRPC queries and mutations — MUST be in the main component
  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 5000 });
  const activeSession = trpc.shadowMode.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: activeSessionId != null, refetchInterval: 3000 }
  );

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const retrySession = trpc.shadowMode.retrySession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSession = trpc.shadowMode.deleteSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveSessionId(null);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
```

### Step 2: Constants (outside the component)

```tsx
const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  meet: "Google Meet",
  webex: "Cisco Webex",
  choruscall: "Chorus Call",
  other: "Other",
};

const RECALL_SUPPORTED_PLATFORMS = new Set(["zoom", "teams", "meet", "webex"]);

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call",
  interim_results: "Interim Results",
  annual_results: "Annual Results",
  results_call: "Results Call",
  media_call: "Media Call",
  analyst_call: "Analyst Call",
  agm: "AGM",
  capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall",
  board_meeting: "Board Meeting",
  webcast: "Webcast",
  investor_day: "Investor Day",
  roadshow: "Roadshow",
  special_call: "Special Call",
  ipo_roadshow: "IPO Roadshow",
  ipo_listing: "IPO Listing",
  pre_ipo: "Pre-IPO",
  manda_call: "M&A Deal Call",
  takeover_announcement: "Takeover Announcement",
  merger_announcement: "Merger Announcement",
  scheme_of_arrangement: "Scheme of Arrangement",
  credit_rating_call: "Credit Rating Call",
  bondholder_meeting: "Bondholder Meeting",
  debt_restructuring: "Debt Restructuring",
  proxy_contest: "Proxy Contest",
  activist_meeting: "Activist Meeting",
  extraordinary_general_meeting: "Extraordinary General Meeting",
  other: "Other",
};

function detectPlatformFromUrl(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("choruscall.com")) return "choruscall";
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) return "zoom";
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) return "teams";
  if (lower.includes("meet.google.com")) return "meet";
  if (lower.includes("webex.com")) return "webex";
  return null;
}
```

### Step 3: Tab Buttons (in the return JSX)

```tsx
<div className="flex gap-1">
  <button
    onClick={() => setActiveTab("live")}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
      activeTab === "live"
        ? "border-emerald-400 text-emerald-300"
        : "border-transparent text-slate-500 hover:text-slate-300"
    }`}>
    <Radio className="w-4 h-4" />
    Live Intelligence
  </button>
  {/* ... other tab buttons ... */}
</div>
```

### Step 4: Live Intelligence Content (inline, NOT in a child component)

```tsx
<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

  {activeTab === "live" && (
    <>
      {/* Entry mode selector — shows when form is hidden */}
      {!showForm && (
        <div className="bg-gradient-to-br from-emerald-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <EyeOff className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-200">
              How do you want to capture this event?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="group bg-white/[0.02] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 text-left transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Radio className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">Join Live Event</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Free — no call charges
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Paste a Zoom, Teams, or Meet link. An AI bot joins the meeting silently,
                transcribes in real time, and runs the full intelligence pipeline.
              </p>
            </button>
            {/* Upload Recording and Paste Transcript buttons follow same pattern */}
          </div>
        </div>
      )}

      {/* New session form — shows when showForm is true */}
      {showForm && (
        <div className="bg-white/[0.03] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-200 mb-5 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            Start a New Shadow Intelligence Session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Client Name */}
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g. Anglo American Platinum"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g. Q4 2025 Earnings Call"
                value={form.eventName}
                onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                value={form.eventType}
                onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
                {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {/* Platform Selector */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1.5">Platform *</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_LABELS).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, platform: v }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      form.platform === v
                        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting URL */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1.5">
                Meeting URL * (Zoom / Teams / Meet / Webex / Chorus Call)
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                value={form.meetingUrl}
                onChange={e => {
                  const url = e.target.value;
                  const detected = detectPlatformFromUrl(url);
                  setForm(f => ({
                    ...f,
                    meetingUrl: url,
                    ...(detected ? { platform: detected } : {}),
                  }));
                }}
              />
              {form.platform && !RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? (
                <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-[11px] text-cyan-300">
                    CuraLive will use <strong>Local Audio Capture</strong> — once the session starts,
                    click "Start Local Audio Capture" and share the tab with the call.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 mt-1.5">
                  The bot joins this meeting link as "CuraLive Intelligence" — a regular participant.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1.5">Notes (optional)</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder="Any context about this event..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Submit + Cancel */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => startSession.mutate({
                ...form,
                webhookBaseUrl: window.location.origin,
              })}
              disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {startSession.isPending ? "Deploying..." : "Start Shadow Intelligence"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session list and detail panel below the form */}
      {/* ... sessions grid ... */}
    </>
  )}

  {activeTab === "archive" && (
    <>
      {/* Archive tab content */}
    </>
  )}

  {/* ... other tabs ... */}
</div>
```

---

## Debugging Checklist for Manus

If you want to keep the `TabContent` pattern instead of refactoring, check these:

### 1. Is `TabContent` being called as a component?

```tsx
// CORRECT — called as JSX component:
<TabContent tabId={subNav} liveSession={liveSession} />

// WRONG — called as a function (won't work with hooks):
{TabContent({ tabId: subNav, liveSession: liveSession })}
```

### 2. Does TabContent have a default return?

```tsx
function TabContent({ tabId }) {
  switch(tabId) {
    case "live":
      return <div>Form here</div>;
    case "nervecenter":
      return <div>...</div>;
    default:
      return null;  // ← MUST have a default, otherwise returns undefined
  }
}
```

### 3. Are tRPC hooks inside TabContent?

If `TabContent` uses `trpc.shadowMode.startSession.useMutation()` or any hooks, and `TabContent` is defined as a regular function (not a component), React hooks rules are violated and **nothing renders with no error**.

**Fix:** Either:
- Move all hooks to the parent component and pass as props
- OR ensure `TabContent` is a proper React component (PascalCase name, called as JSX)

### 4. Is the Vite HMR error the real problem?

The brief mentions: *"Vite HMR error: Failed to reload /src/App.tsx"*

This is likely the **actual root cause**. There may be a syntax error or circular import in `App.tsx` or `ShadowMode.tsx` that prevents the module from loading entirely.

**To debug:**
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Or check the Vite build
npx vite build 2>&1 | head -50
```

### 5. Is the content div height zero?

The brief mentions the parent div has `flex: 1, overflowY: "auto"`. If the parent has no explicit height, `flex: 1` does nothing.

**Fix:** Ensure the outer container has `min-height: 100vh`:
```tsx
<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
  {/* header */}
  <div style={{ flex: 1, overflowY: "auto" }}>
    <TabContent ... />
  </div>
</div>
```

---

## Quick Fix (Minimum Change)

If Manus wants the fastest fix, replace the entire `TabContent` pattern with this:

```tsx
// DELETE the TabContent function entirely

// In the main component's return, replace:
//   <TabContent tabId={subNav} liveSession={liveSession} />
// With:
{subNav === "live" && (
  <div style={{ width: "100%", padding: 40, background: "#0f0f0f", minHeight: 700 }}>
    {/* Paste the form JSX directly here */}
  </div>
)}
{subNav === "nervecenter" && (
  <div>{/* nerve center content */}</div>
)}
{/* etc. for other tabs */}
```

This eliminates the component boundary entirely and guarantees rendering.

---

## Key Differences: Manus vs Working Replit Code

| Aspect | Manus (Broken) | Replit (Working) |
|--------|---------------|-----------------|
| Tab state variable | `subNav` | `activeTab` |
| Content rendering | `TabContent` child component with `switch` | Inline `{activeTab === "live" && (...)}` |
| Form state location | Inside `TabContent`? | In main `ShadowMode` component |
| tRPC hooks location | Unclear (possibly in `TabContent`) | In main `ShadowMode` component |
| Form visibility | Always shown in "live" case | Toggled by `showForm` state |
| Initial view | Form immediately | Mode selector ("Join Live Event" / "Upload Recording" / "Paste Transcript") |
| File length | ~345 lines | 4,221 lines |
| Styling | Inline styles | Tailwind CSS classes |

---

*End of Live Intelligence Fix Brief*
