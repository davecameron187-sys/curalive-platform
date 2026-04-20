// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import LiveQaDashboard from "@/components/LiveQaDashboard";
import LocalAudioCapture from "../components/LocalAudioCapture";

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
  const [lastFeedId, setLastFeedId] = useState<number>(0);
  const [psil, setPsil] = useState<string>("clear");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<{ role: string; text: string }[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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

  const rawSessions = sessionsQuery.data ?? [];
  const sessions: Session[] = rawSessions.map((s: any) => ({
    id: String(s.id),
    eventName: s.eventName ?? s.event_name ?? "Untitled",
    status: s.status ?? "pending",
    startedAt: s.startedAt ?? s.started_at ?? null,
  }));

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
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "6px" }}>PLATFORM *</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Object.entries(PLATFORM_LABELS).map(([v, l]) => (
                          <button key={v} onClick={() => setForm(f => ({ ...f, platform: v as any }))}
                            style={{ background: form.platform === v ? "#1e40af" : "#1e293b", border: `1px solid ${form.platform === v ? "#3b82f6" : "#334155"}`, color: form.platform === v ? "white" : "#475569", padding: "3px 8px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>MEETING URL *</div>
                      <input value={form.meetingUrl}
                        onChange={e => {
                          const url = e.target.value;
                          const detected = detectPlatformFromUrl(url);
                          setForm(f => ({ ...f, meetingUrl: url, ...(detected ? { platform: detected as any } : {}) }));
                        }}
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
                        onClick={() => startSession.mutate({ ...form, webhookBaseUrl: window.location.origin })}
                        disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
                        style={{ background: form.clientName && form.eventName && form.meetingUrl ? "#166534" : "#1e293b", border: "none", color: form.clientName && form.eventName && form.meetingUrl ? "white" : "#475569", padding: "6px 12px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}>
                        {startSession.isPending ? "STARTING..." : RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? "START SHADOW INTELLIGENCE" : "START LOCAL CAPTURE"}
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
                  style={{ padding: "10px 12px", marginBottom: "6px", background: selectedSessionId === s.id ? "#1e293b" : "#111", border: `1px solid ${selectedSessionId === s.id ? "#3b82f6" : "#1e293b"}`, borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                  <div style={{ color: "#e2e8f0" }}>{s.eventName}</div>
                  <div style={{ color: "#4ade80", fontSize: "10px", marginTop: "4px" }}>● {s.status.toUpperCase()}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); endSession.mutate({ sessionId: Number(s.id) }); }}
                    style={{ background: "#7f1d1d", border: "none", color: "#fca5a5", padding: "3px 8px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace", marginTop: "6px", letterSpacing: "1px" }}
                  >
                    END SESSION
                  </button>
                  {!RECALL_SUPPORTED_PLATFORMS.has(s.platform) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <LocalAudioCapture sessionId={Number(s.id)} isActive={true} />
                    </div>
                  )}
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
              <div ref={feedRef} style={{ height: "calc(100vh - 220px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {feedItems.length === 0 && (
                  <div style={{ color: "#334155", fontSize: "12px" }}>
                    {selectedSessionId ? "Waiting for intelligence signals..." : "Select a session to begin monitoring"}
                  </div>
                )}
                {feedItems.map((item) => (
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
