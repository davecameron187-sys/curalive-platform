# Shadow Mode V3 — Complete Rebuild Brief
**For:** Replit
**Date:** 19 April 2026
**Branch:** RenderMigration

---

## OVERVIEW

Three things need to be added/modified. Do them in order.

---

## TASK 1 — Add `intelligence_feed` table to schema

**File:** `drizzle/gaps.schema.ts`

Add this block at the end of the file, before the final closing:

```typescript
export const intelligenceFeed = pgTable("intelligence_feed", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  feedType: text("feed_type").notNull(),
  severity: text("severity").notNull().default("info"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  pipeline: text("pipeline").notNull(),
  speaker: text("speaker").notNull(),
  timestampInEvent: integer("timestamp_in_event"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## TASK 2 — Add `getIntelligenceFeed` to shadow mode router

**File:** `server/routers/shadowModeRouter.ts`

Find the section where `pushTranscriptSegment` is defined. After that procedure, add this new procedure:

```typescript
getIntelligenceFeed: protectedProcedure
  .input(z.object({
    sessionId: z.string(),
    since: z.number().optional(),
  }))
  .query(async ({ input }) => {
    const rows = await rawSql(
      `SELECT id, session_id, feed_type, severity, title, body, metadata, pipeline, speaker, timestamp_in_event, created_at
       FROM intelligence_feed
       WHERE session_id = $1
       ${input.since ? "AND id > $2" : ""}
       ORDER BY created_at ASC
       LIMIT 100`,
      input.since ? [input.sessionId, input.since] : [input.sessionId]
    );
    return rows.rows ?? [];
  }),
```

---

## TASK 3 — Replace ShadowMode.tsx with V3

**File:** `client/src/pages/ShadowMode.tsx`

Replace the entire file with this content:

```tsx
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

type Tab = "console" | "qa" | "participants" | "pre-event" | "history";

type FeedItem = {
  id: number;
  feedType: string;
  severity: "info" | "watch" | "high" | "critical";
  title: string;
  body: string;
  pipeline: string;
  speaker: string;
  createdAt: string;
};

type Session = {
  id: string;
  eventName: string;
  status: string;
  startedAt: string | null;
};

const SEVERITY_COLOURS: Record<string, string> = {
  info: "#4ade80",
  watch: "#facc15",
  high: "#fb923c",
  critical: "#f87171",
};

const PSIL_LABELS: Record<string, string> = {
  clear: "CLEAR",
  constrain: "CONSTRAIN",
  redirect: "REDIRECT",
  escalate: "ESCALATE",
};

const PSIL_COLOURS: Record<string, string> = {
  clear: "#4ade80",
  constrain: "#facc15",
  redirect: "#fb923c",
  escalate: "#f87171",
};

export default function ShadowMode() {
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [lastFeedId, setLastFeedId] = useState<number>(0);
  const [psil, setPsil] = useState<string>("clear");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<{ role: string; text: string }[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const sessionsQuery = trpc.shadowMode.listSessions.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const sessions: Session[] = sessionsQuery.data ?? [];
  const liveSessions = sessions.filter((s) => s.status === "live" || s.status === "bot_joining");
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Auto-select first live session
  useEffect(() => {
    if (!selectedSessionId && liveSessions.length > 0) {
      setSelectedSessionId(liveSessions[0].id);
    }
  }, [liveSessions, selectedSessionId]);

  // Poll intelligence feed
  useEffect(() => {
    if (!selectedSessionId) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/trpc/shadowMode.getIntelligenceFeed?batch=1&input=${encodeURIComponent(
            JSON.stringify({ "0": { json: { sessionId: selectedSessionId, since: lastFeedId } } })
          )}`
        );
        const data = await res.json();
        const items: FeedItem[] = data?.[0]?.result?.data?.json ?? [];
        if (items.length > 0) {
          setFeedItems((prev) => [...prev, ...items].slice(-200));
          setLastFeedId(items[items.length - 1].id);

          // Update PSIL from latest escalation signal
          const psilItem = [...items].reverse().find((i) => i.pipeline === "psil");
          if (psilItem) {
            if (psilItem.feedType === "psil") {
              const raw = psilItem.title.toLowerCase();
              if (raw.includes("escalat")) setPsil("escalate");
              else if (raw.includes("redirect")) setPsil("redirect");
              else setPsil("clear");
            }
          }
        }
      } catch {
        // silent
      }
    };

    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedSessionId, lastFeedId]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feedItems]);

  // Session duration timer
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    if (!selectedSession?.startedAt) return;
    const start = new Date(selectedSession.startedAt).getTime();
    const tick = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(tick);
  }, [selectedSession]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "console", label: "Live Console" },
    { id: "qa", label: "Live Q&A" },
    { id: "participants", label: "Participants" },
    { id: "pre-event", label: "Pre-Event" },
    { id: "history", label: "History" },
  ];

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0a", minHeight: "100vh", color: "#e2e8f0", padding: "0" }}>

      {/* Header */}
      <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "14px", letterSpacing: "2px" }}>CURALIVE</span>
          <span style={{ color: "#334155", fontSize: "12px" }}>SHADOW MODE V3</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {selectedSession && (
            <>
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>{selectedSession.eventName}</span>
              <span style={{ color: "#4ade80", fontSize: "11px" }}>{elapsed}</span>
            </>
          )}
          <div style={{
            background: PSIL_COLOURS[psil] + "22",
            border: `1px solid ${PSIL_COLOURS[psil]}`,
            color: PSIL_COLOURS[psil],
            padding: "3px 10px",
            fontSize: "11px",
            letterSpacing: "1px",
            borderRadius: "3px",
          }}>
            PSIL: {PSIL_LABELS[psil] ?? "CLEAR"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e293b", display: "flex", padding: "0 24px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #60a5fa" : "2px solid transparent",
              color: activeTab === tab.id ? "#60a5fa" : "#475569",
              padding: "12px 16px",
              fontSize: "12px",
              letterSpacing: "1px",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px", display: "flex", gap: "24px" }}>

        {activeTab === "console" && (
          <>
            {/* Session list */}
            <div style={{ width: "260px", flexShrink: 0 }}>
              <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>SESSIONS</div>
              {liveSessions.length === 0 && (
                <div style={{ color: "#334155", fontSize: "12px" }}>No live sessions</div>
              )}
              {liveSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "6px",
                    background: selectedSessionId === s.id ? "#1e293b" : "#111",
                    border: `1px solid ${selectedSessionId === s.id ? "#3b82f6" : "#1e293b"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ color: "#e2e8f0" }}>{s.eventName}</div>
                  <div style={{ color: "#4ade80", fontSize: "10px", marginTop: "4px" }}>● {s.status.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Intelligence Feed */}
            <div style={{ flex: 1 }}>
              <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>INTELLIGENCE FEED</div>
              <div
                ref={feedRef}
                style={{ height: "calc(100vh - 220px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {feedItems.length === 0 && (
                  <div style={{ color: "#334155", fontSize: "12px" }}>
                    {selectedSessionId ? "Waiting for intelligence signals..." : "Select a session to begin monitoring"}
                  </div>
                )}
                {feedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#111",
                      border: `1px solid ${SEVERITY_COLOURS[item.severity]}44`,
                      borderLeft: `3px solid ${SEVERITY_COLOURS[item.severity]}`,
                      borderRadius: "4px",
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: SEVERITY_COLOURS[item.severity], fontSize: "11px", letterSpacing: "1px" }}>
                        {item.severity.toUpperCase()} · {item.pipeline.toUpperCase()}
                      </span>
                      <span style={{ color: "#334155", fontSize: "10px" }}>{item.speaker}</span>
                    </div>
                    <div style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", lineHeight: "1.5" }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "qa" && (
          <div style={{ color: "#475569", fontSize: "13px" }}>Live Q&A — coming next build phase</div>
        )}

        {activeTab === "participants" && (
          <div style={{ color: "#475569", fontSize: "13px" }}>Participants — coming next build phase</div>
        )}

        {activeTab === "pre-event" && (
          <div style={{ color: "#475569", fontSize: "13px" }}>Pre-Event — coming next build phase</div>
        )}

        {activeTab === "history" && (
          <div style={{ flex: 1 }}>
            <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>COMPLETED SESSIONS</div>
            {sessions.filter((s) => s.status === "ended" || s.status === "archived").length === 0 && (
              <div style={{ color: "#334155", fontSize: "12px" }}>No completed sessions yet</div>
            )}
            {sessions
              .filter((s) => s.status === "ended" || s.status === "archived")
              .map((s) => (
                <div key={s.id} style={{ padding: "10px 12px", marginBottom: "6px", background: "#111", border: "1px solid #1e293b", borderRadius: "4px", fontSize: "12px" }}>
                  <div style={{ color: "#e2e8f0" }}>{s.eventName}</div>
                  <div style={{ color: "#475569", fontSize: "10px", marginTop: "4px" }}>{s.startedAt}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* CuraLive Assistant */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999 }}>
        {assistantOpen && (
          <div style={{ width: "340px", background: "#111", border: "1px solid #1e293b", borderRadius: "8px", marginBottom: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", color: "#60a5fa", fontSize: "12px", letterSpacing: "1px" }}>
              CURALIVE ASSISTANT
            </div>
            <div style={{ height: "240px", overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {assistantMessages.length === 0 && (
                <div style={{ color: "#334155", fontSize: "12px" }}>Ask me anything about this session...</div>
              )}
              {assistantMessages.map((m, i) => (
                <div key={i} style={{ color: m.role === "user" ? "#60a5fa" : "#e2e8f0", fontSize: "12px", lineHeight: "1.5" }}>
                  <span style={{ color: "#475569" }}>{m.role === "user" ? "YOU: " : "AI: "}</span>
                  {m.text}
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 12px", borderTop: "1px solid #1e293b", display: "flex", gap: "8px" }}>
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && assistantInput.trim()) {
                    setAssistantMessages((prev) => [...prev, { role: "user", text: assistantInput }]);
                    setAssistantInput("");
                  }
                }}
                placeholder="Ask..."
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "4px", padding: "6px 10px", color: "#e2e8f0", fontSize: "12px", fontFamily: "monospace", outline: "none" }}
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setAssistantOpen((o) => !o)}
          style={{ background: "#1e40af", border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px #00000066" }}
        >
          {assistantOpen ? "×" : "✦"}
        </button>
      </div>
    </div>
  );
}
```

---

## AFTER ALL THREE TASKS ARE DONE

Run these in the Shell:
```
git add client/src/pages/ShadowMode.tsx server/routers/shadowModeRouter.ts drizzle/gaps.schema.ts
git commit -m "Rebuild: Shadow Mode V3 with intelligence feed and PSIL indicator"
git push github RenderMigration
```

Confirm the commit hash when done.
