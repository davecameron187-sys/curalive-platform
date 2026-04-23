// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import LiveQaDashboard from "@/components/LiveQaDashboard";
import Ably from "ably";


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
  clientName: string | null;
  eventName: string;
  status: string;
  startedAt: string | null;
  ablyChannel: string | null;
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

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call",
  investor_day: "Investor Day",
  agm: "AGM",
  roadshow: "Roadshow",
  board_meeting: "Board Meeting",
  other: "Other",
};

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom",
  teams: "Teams",
  meet: "Google Meet",
  webex: "Webex",
  choruscall: "Phone/Dial-in",
  other: "Other",
};

const RECALL_SUPPORTED_PLATFORMS = new Set(["zoom", "teams", "meet", "webex"]);

const detectPlatformFromUrl = (url: string): string | null => {
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("teams.microsoft")) return "teams";
  if (url.includes("webex.com")) return "webex";
  if (url.includes("meet.google")) return "meet";
  if (url.includes("choruscall.com")) return "choruscall";
  return null;
};

export default function ShadowMode() {
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [psil, setPsil] = useState<string>("clear");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<{ role: string; text: string }[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    eventName: "",
    eventType: "earnings_call" as const,
    platform: "zoom" as const,
    meetingUrl: "",
    notes: "",
  });

  const sessionsQuery = trpc.shadowMode.listSessions.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({ clientName: "", eventName: "", eventType: "earnings_call", platform: "zoom", meetingUrl: "", notes: "" });
      sessionsQuery.refetch();
    },
    onError: (e: any) => console.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: () => sessionsQuery.refetch(),
  });

  const intelligenceFeedQuery = trpc.shadowMode.getIntelligenceFeed.useQuery(
    { sessionId: selectedSessionId ?? "" },
    {
      enabled: !!selectedSessionId,
      refetchInterval: 3000,
      select: (data: any[]) => data.map((r: any) => ({
        id: r.id,
        feedType: r.feed_type ?? r.feedType,
        severity: r.severity,
        title: r.title,
        body: r.body,
        pipeline: r.pipeline,
        speaker: r.speaker ?? "",
        createdAt: r.created_at ?? r.createdAt ?? "",
      })),
    }
  );

  const rawSessions = sessionsQuery.data ?? [];
  const sessions: Session[] = rawSessions.map((s: any) => ({
    id: String(s.id),
    clientName: s.clientName ?? s.client_name ?? null,
    eventName: s.eventName ?? s.event_name ?? "Untitled",
    status: s.status ?? "pending",
    startedAt: s.startedAt ?? s.started_at ?? null,
    ablyChannel: s.ablyChannel ?? s.ably_channel ?? null,
  }));

const formatSessionTime = (ts: string | null) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

  const liveSessions = sessions.filter((s) => s.status === "live" || s.status === "bot_joining");
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Auto-select first live session
  useEffect(() => {
    if (!selectedSessionId && liveSessions.length > 0) {
      setSelectedSessionId(liveSessions[0].id);
    }
  }, [liveSessions, selectedSessionId]);

  // Ably real-time subscription
  useEffect(() => {
    if (!selectedSessionId) return;

    const connectAbly = async () => {
      try {
        const client = new Ably.Realtime({
          authUrl: `/api/ably-token?clientId=operator-${selectedSessionId}`,
          authMethod: "GET",
        });
        ablyRef.current = client;

        const activeSession = sessions.find(s => s.id === selectedSessionId);
        const channelName = activeSession?.ablyChannel ?? selectedSessionId;
        const channel = client.channels.get(channelName, { params: { rewind: "0" } });
        await channel.subscribe("curalive", (message) => {
          const payload = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
          if (payload.type === "transcript.segment") {
            setFeedItems((prev) => prev.filter(item => item.pipeline !== "watchdog"));
            return;
          }
          if (payload.type === "sentiment.update" || payload.type === "rolling.summary") {
            // These come from aiAnalysis — surface as feed items
            const newItem: FeedItem = {
              id: Date.now(),
              sessionId: selectedSessionId,
              feedType: payload.type === "sentiment.update" ? "sentiment" : "summary",
              severity: "info",
              title: payload.type === "sentiment.update" ? `Live Sentiment: ${payload.data?.label ?? ""}` : "Rolling Summary",
              body: payload.type === "sentiment.update"
                ? `Score: ${payload.data?.score ?? ""}. Keywords: ${payload.data?.keywords?.join(", ") ?? ""}`
                : payload.data?.summary ?? "",
              pipeline: payload.type === "sentiment.update" ? "sentiment" : "summary",
              speaker: "",
              timestamp_in_event: 0,
            };
            setFeedItems((prev) => [...prev, newItem].slice(-200));
          }
          if (payload.type === "transcript.warning") {
            const warnItem: FeedItem = {
              id: Date.now(),
              sessionId: selectedSessionId,
              feedType: "warning",
              severity: "high",
              title: "⚠️ Transcript Stream Interrupted",
              body: "No transcript received in 15 seconds. Check bot connection.",
              pipeline: "watchdog",
              speaker: "",
              timestamp_in_event: 0,
            };
            setFeedItems((prev) => [...prev, warnItem].slice(-200));
          }
        });
      } catch (err) {
        console.warn("[Ably] Connection failed:", err);
      }
    };

    connectAbly();

    return () => {
      ablyRef.current?.close();
      ablyRef.current = null;
    };
  }, [selectedSessionId]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [intelligenceFeedQuery.data]);

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

  const mergedFeed = [...(intelligenceFeedQuery.data ?? []), ...feedItems]
    .sort((a, b) => a.id - b.id)
    .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index);

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
      <div style={{ padding: "32px", display: "flex", gap: "24px" }}>

        {activeTab === "console" && (
          <>
            {/* Session list */}
            <div style={{ width: "320px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px" }}>SESSIONS</div>
                <button
                  onClick={() => setShowForm(f => !f)}
                  style={{ background: "#166534", border: "none", color: "white", padding: "4px 10px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}
                >
                  + NEW SESSION
                </button>
              </div>

              {/* Session creation form */}
              {showForm && (
                <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "6px", padding: "14px", marginBottom: "12px" }}>
                  <div style={{ color: "#60a5fa", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>NEW SHADOW INTELLIGENCE SESSION</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>CLIENT NAME *</div>
                      <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="e.g. Anglo American plc"
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "3px", padding: "6px 8px", color: "#e2e8f0", fontSize: "11px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>EVENT NAME *</div>
                      <input value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                        placeholder="e.g. Q2 2026 Earnings Call"
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "3px", padding: "6px 8px", color: "#e2e8f0", fontSize: "11px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>EVENT TYPE *</div>
                      <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value as any }))}
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "3px", padding: "6px 8px", color: "#e2e8f0", fontSize: "11px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>MEETING URL *</div>
                      <input value={form.meetingUrl}
                        onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                        placeholder="https://zoom.us/j/..."
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "3px", padding: "6px 8px", color: "#e2e8f0", fontSize: "11px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>NOTES</div>
                      <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Special instructions..."
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "3px", padding: "6px 8px", color: "#e2e8f0", fontSize: "11px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={() => startSession.mutate({ ...form, platform: "zoom", webhookBaseUrl: window.location.origin })}
                        disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
                        style={{ background: form.clientName && form.eventName && form.meetingUrl ? "#166534" : "#1e293b", border: "none", color: form.clientName && form.eventName && form.meetingUrl ? "white" : "#475569", padding: "6px 12px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}>
                        {startSession.isPending ? "STARTING..." : "START SHADOW INTELLIGENCE"}
                      </button>
                      <button onClick={() => setShowForm(false)}
                        style={{ background: "none", border: "1px solid #1e293b", color: "#475569", padding: "6px 12px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
                        CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Session list */}
              {liveSessions.length === 0 && !showForm && (
                <div style={{ color: "#334155", fontSize: "12px" }}>No live sessions</div>
              )}
              {liveSessions.map((s) => (
                <div key={s.id} onClick={() => setSelectedSessionId(s.id)}
                  style={{ padding: "14px 16px", marginBottom: "8px", background: selectedSessionId === s.id ? "#1e293b" : "#111", border: `1px solid ${selectedSessionId === s.id ? "#3b82f6" : "#1e293b"}`, borderRadius: "6px", cursor: "pointer" }}>
                  <div style={{ color: "#94a3b8", fontSize: "10px", letterSpacing: "1px", marginBottom: "2px" }}>{s.clientName?.toUpperCase() ?? "—"}</div>
                  <div style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 500 }}>{s.eventName}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <div style={{ color: "#4ade80", fontSize: "10px" }}>● {s.status.toUpperCase()}</div>
                    <div style={{ color: "#475569", fontSize: "10px" }}>{formatSessionTime(s.startedAt)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* End Session Button */}
              {selectedSessionId && (
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => endSession.mutate({ sessionId: Number(selectedSessionId) }, {
                      onSuccess: () => setSelectedSessionId(null)
                    })}
                    style={{ background: "#7f1d1d", border: "1px solid #991b1b", color: "#fca5a5", padding: "6px 16px", fontSize: "11px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}
                  >
                    ■ END SESSION
                  </button>
                </div>
              )}
            {/* Intelligence Feed */}
            <div style={{ flex: 1 }}>
              <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "12px" }}>INTELLIGENCE FEED</div>
              <div ref={feedRef} style={{ height: "calc(100vh - 180px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {mergedFeed.length === 0 && (
                  <div style={{ color: "#334155", fontSize: "12px" }}>
                    {selectedSessionId ? "Waiting for intelligence signals..." : "Select a session to begin monitoring"}
                  </div>
                )}
                {mergedFeed.map((item) => (
                  <div key={item.id} style={{ background: "#111", border: `1px solid ${SEVERITY_COLOURS[item.severity]}44`, borderLeft: `3px solid ${SEVERITY_COLOURS[item.severity]}`, borderRadius: "4px", padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: SEVERITY_COLOURS[item.severity], fontSize: "11px", letterSpacing: "1px" }}>{item.severity.toUpperCase()} · {item.pipeline.toUpperCase()}</span>
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
          <div style={{ flex: 1 }}>
            <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "16px" }}>LIVE Q&A</div>
            {selectedSessionId ? (
              <LiveQaDashboard sessionId={selectedSessionId} />
            ) : (
              <div style={{ color: "#334155", fontSize: "12px" }}>Select a session to view Q&A</div>
            )}
          </div>
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
            {sessions.filter((s) => s.status === "ended" || s.status === "archived" || s.status === "completed").length === 0 && (
              <div style={{ color: "#334155", fontSize: "12px" }}>No completed sessions yet</div>
            )}
            {sessions
              .filter((s) => s.status === "ended" || s.status === "archived" || s.status === "completed")
              .map((s) => (
                <div key={s.id} style={{ padding: "10px 12px", marginBottom: "6px", background: "#111", border: "1px solid #1e293b", borderRadius: "4px", fontSize: "12px" }}>
                  <div style={{ color: "#e2e8f0" }}>{s.eventName}</div>
                  <div style={{ color: "#475569", fontSize: "10px", marginTop: "4px" }}>{formatSessionTime(s.startedAt)}</div>
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
