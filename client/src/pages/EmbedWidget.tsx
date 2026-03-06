import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Zap, Copy, CheckCheck, ChevronUp, Send, BarChart3, MessageSquare, FileText } from "lucide-react";

const TRANSCRIPT_LINES = [
  { speaker: "James Mitchell (CEO)", text: "Our AI-powered platform, CuraLive, has seen remarkable adoption across our enterprise client base." },
  { speaker: "Sarah Chen (CFO)", text: "Q4 revenue came in at $47.2 million, representing 28% year-over-year growth." },
  { speaker: "James Mitchell (CEO)", text: "Looking ahead to 2026, we're particularly excited about our Teams and Zoom native integrations." },
  { speaker: "Sarah Chen (CFO)", text: "Gross margins expanded to 72%, driven by efficiency gains from our new CuraLive intelligence layer." },
];

const QA_ITEMS = [
  { id: 1, question: "Can you provide more detail on the CuraLive revenue contribution in Q4?", author: "Goldman Sachs", votes: 47 },
  { id: 2, question: "What is the timeline for the native Microsoft Teams integration?", author: "JP Morgan", votes: 31 },
  { id: 3, question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Morgan Stanley", votes: 28 },
];

const speakerColor: Record<string, string> = {
  "James Mitchell (CEO)": "#60a5fa",
  "Sarah Chen (CFO)": "#34d399",
};

// The actual embeddable widget component
function ChorusWidget({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "sentiment">("transcript");
  const [visibleLines, setVisibleLines] = useState<typeof TRANSCRIPT_LINES>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [sentiment, setSentiment] = useState(82);
  const [qaItems, setQaItems] = useState(QA_ITEMS);
  const [newQ, setNewQ] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lineIdx >= TRANSCRIPT_LINES.length) return;
    const t = setTimeout(() => {
      setVisibleLines((p) => [...p, TRANSCRIPT_LINES[lineIdx]]);
      setLineIdx((i) => i + 1);
    }, lineIdx === 0 ? 600 : 3500);
    return () => clearTimeout(t);
  }, [lineIdx]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [visibleLines]);

  useEffect(() => {
    const t = setInterval(() => setSentiment((s) => Math.min(99, Math.max(60, s + (Math.random() > 0.5 ? 2 : -1)))), 4000);
    return () => clearInterval(t);
  }, []);

  const handleVote = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, votes: q.votes + 1 } : q));
  const handleSubmit = () => {
    if (!newQ.trim()) return;
    setQaItems((items) => [{ id: Date.now(), question: newQ.trim(), author: "You", votes: 1 }, ...items]);
    setNewQ("");
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0f1117", color: "#e2e8f0", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Widget Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#161b27" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: "10px", height: "10px", color: "white" }} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>Chorus<span style={{ color: "#ef4444" }}>.AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {[{ key: "transcript", label: "Transcript", icon: FileText }, { key: "qa", label: "Q&A", icon: MessageSquare }, { key: "sentiment", label: "Sentiment", icon: BarChart3 }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
            style={{ flex: 1, padding: "8px 4px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${activeTab === key ? "#ef4444" : "transparent"}`, color: activeTab === key ? "#ef4444" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Icon style={{ width: "10px", height: "10px" }} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "transcript" && (
          <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {visibleLines.map((line, i) => (
              <div key={i} style={{ fontSize: "11px", lineHeight: "1.5" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: speakerColor[line.speaker] ?? "#94a3b8", marginBottom: "2px" }}>{line.speaker}</div>
                <div style={{ color: "rgba(255,255,255,0.8)" }}>{line.text}</div>
              </div>
            ))}
            {lineIdx < TRANSCRIPT_LINES.length && (
              <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                {[0, 150, 300].map((d) => (
                  <span key={d} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#ef4444", animation: `bounce 1s ${d}ms infinite` }} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "qa" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {qaItems.sort((a, b) => b.votes - a.votes).map((item) => (
                <div key={item.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <button onClick={() => handleVote(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}>
                      <ChevronUp style={{ width: "12px", height: "12px" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700 }}>{item.votes}</span>
                    </button>
                    <div>
                      <div style={{ fontSize: "11px", lineHeight: "1.4", color: "rgba(255,255,255,0.85)" }}>{item.question}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>{item.author}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "6px" }}>
              <input value={newQ} onChange={(e) => setNewQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Ask a question…"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 8px", fontSize: "11px", color: "#e2e8f0", outline: "none" }} />
              <button onClick={handleSubmit} style={{ background: "#ef4444", border: "none", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Send style={{ width: "12px", height: "12px", color: "white" }} />
              </button>
            </div>
          </>
        )}

        {activeTab === "sentiment" && (
          <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "80px", height: "80px" }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={sentiment >= 75 ? "#10b981" : "#f59e0b"} strokeWidth="10"
                  strokeDasharray={`${(sentiment / 100) * 251.2} 251.2`} strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1.2s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: sentiment >= 75 ? "#10b981" : "#f59e0b" }}>{sentiment}</span>
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>/ 100</span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: sentiment >= 75 ? "#10b981" : "#f59e0b" }}>{sentiment >= 75 ? "Positive" : "Neutral"}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Live audience sentiment</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "6px 10px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>Powered by CuraLive</span>
      </div>
    </div>
  );
}

// The page that shows the widget + embed code
export default function EmbedWidget() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const eventId = params.id ?? "q4-earnings-2026";
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- CuraLive Embedded Widget -->
<script
  src="https://cdn.pulselive.events/widget.js"
  data-event-id="${eventId}"
  data-api-key="ck_live_your_api_key"
  data-theme="dark"
  data-width="320"
  data-height="480">
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <Zap className="w-4 h-4 text-primary" /> CuraLive
        </button>
        <span className="text-muted-foreground text-sm">/ Embedded Widget</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Embedded Partner Widget</h1>
          <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Drop the CuraLive intelligence widget into any partner website with a single script tag. Attendees get live transcription, Q&A, and sentiment — without leaving the partner's page.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Live Preview */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Live Widget Preview</div>
            <div style={{ height: "480px" }}>
              <ChorusWidget eventId={eventId} />
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Embed Code</div>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <pre className="bg-card border border-border rounded-xl p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {embedCode}
              </pre>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="font-semibold text-sm">Widget Attributes</div>
              <div className="space-y-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                {[
                  ["data-event-id", "Your CuraLive event ID", "Required"],
                  ["data-api-key", "Your partner API key", "Required"],
                  ["data-theme", "dark | light", "Optional"],
                  ["data-width", "Widget width in px (default: 320)", "Optional"],
                  ["data-height", "Widget height in px (default: 480)", "Optional"],
                  ["data-lang", "Default language code (default: en)", "Optional"],
                  ["data-tabs", "transcript,qa,sentiment (comma-separated)", "Optional"],
                ].map(([attr, desc, req]) => (
                  <div key={attr} className="flex items-start gap-2 border-b border-border pb-2">
                    <code className="font-mono text-primary shrink-0">{attr}</code>
                    <span className="text-muted-foreground flex-1">{desc}</span>
                    <span className={`shrink-0 text-[10px] font-semibold ${req === "Required" ? "text-primary" : "text-muted-foreground"}`}>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="font-semibold text-sm mb-3">What's Included</div>
              <div className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                {["Real-time transcript with speaker labels", "Q&A submission and upvoting", "Live sentiment gauge", "Auto-translation (8 languages)", "Zero dependencies — pure vanilla JS", "CSP-compliant — no eval()"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
