import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Users, Clock, Mic, MicOff, Settings,
  ThumbsUp, Send, ChevronUp, Globe, BarChart3, MessageSquare,
  FileText, Volume2, VolumeX
} from "lucide-react";

// ─── Simulated Data ───────────────────────────────────────────────────────────

const EVENT_META: Record<string, { title: string; company: string; platform: string; speakers: string[] }> = {
  "q4-earnings-2026": {
    title: "Q4 2025 Earnings Call",
    company: "Chorus Call Inc.",
    platform: "Zoom",
    speakers: ["Sarah Chen (CFO)", "James Mitchell (CEO)", "Operator"],
  },
  "investor-day-2026": {
    title: "Annual Investor Day",
    company: "Chorus Call Inc.",
    platform: "Microsoft Teams",
    speakers: ["James Mitchell (CEO)", "Sarah Chen (CFO)", "Dr. Priya Nair (CTO)"],
  },
  "board-briefing": {
    title: "Board Strategy Briefing",
    company: "Chorus Call Inc.",
    platform: "Webex",
    speakers: ["James Mitchell (CEO)", "Board Chair"],
  },
};

const TRANSCRIPT_LINES = [
  { speaker: "Operator", time: "00:00:05", text: "Good morning and welcome to the Chorus Call Q4 2025 Earnings Call. All participants will be in listen-only mode." },
  { speaker: "James Mitchell (CEO)", time: "00:01:12", text: "Thank you, Operator. Good morning everyone. I'm delighted to share that Q4 has been an exceptional quarter for Chorus Call." },
  { speaker: "James Mitchell (CEO)", time: "00:02:30", text: "Our AI-powered platform, Chorus.AI, has seen remarkable adoption across our enterprise client base, with a 40% increase in engagement metrics." },
  { speaker: "Sarah Chen (CFO)", time: "00:04:15", text: "Thank you James. From a financial perspective, Q4 revenue came in at $47.2 million, representing 28% year-over-year growth." },
  { speaker: "Sarah Chen (CFO)", time: "00:05:40", text: "Our gross margins expanded to 72%, driven primarily by the efficiency gains from our new Chorus.AI intelligence layer." },
  { speaker: "James Mitchell (CEO)", time: "00:07:22", text: "Looking ahead to 2026, we're particularly excited about our Teams and Zoom native integrations, which will open significant new enterprise opportunities." },
  { speaker: "Sarah Chen (CFO)", time: "00:09:05", text: "We're guiding to full-year 2026 revenue of $195 to $210 million, with adjusted EBITDA margins of 18 to 22 percent." },
  { speaker: "Operator", time: "00:10:30", text: "We will now open the line for questions. Please press star one to join the queue." },
  { speaker: "James Mitchell (CEO)", time: "00:12:15", text: "The Chorus.AI platform represents a fundamental shift in how we deliver value to our clients. We're not just a conferencing provider anymore." },
  { speaker: "Sarah Chen (CFO)", time: "00:14:00", text: "Capital expenditure for the year was $8.3 million, primarily invested in our AI infrastructure and the Ably real-time messaging integration." },
  { speaker: "James Mitchell (CEO)", time: "00:16:45", text: "Our partnership with Recall.ai has been transformative. It allows us to deploy the Chorus.AI intelligence layer on any platform within days, not months." },
  { speaker: "Sarah Chen (CFO)", time: "00:18:20", text: "We ended the quarter with $124 million in cash and equivalents, providing significant runway to execute on our strategic roadmap." },
];

const QA_ITEMS_INITIAL = [
  { id: 1, question: "Can you provide more detail on the Chorus.AI revenue contribution in Q4?", author: "Goldman Sachs", votes: 47, answered: false },
  { id: 2, question: "What is the timeline for the native Microsoft Teams integration?", author: "JP Morgan", votes: 31, answered: false },
  { id: 3, question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Morgan Stanley", votes: 28, answered: false },
  { id: 4, question: "Can you elaborate on the 40% engagement increase metric?", author: "Barclays", votes: 19, answered: true },
  { id: 5, question: "What is the competitive moat against Zoom and Teams building similar features?", author: "UBS", votes: 15, answered: false },
];

const SENTIMENT_HISTORY = [72, 68, 75, 71, 78, 82, 79, 85, 81, 88, 84, 87];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
      <span className="live-badge-dot inline-block w-2 h-2 rounded-full bg-red-400" />
      Live
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    "Zoom": "bg-blue-600",
    "Microsoft Teams": "bg-purple-600",
    "Webex": "bg-slate-600",
  };
  return (
    <span className={`text-[10px] font-bold text-white px-2 py-1 rounded ${colors[platform] ?? "bg-slate-600"}`}>
      {platform}
    </span>
  );
}

function SentimentGauge({ value }: { value: number }) {
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";
  const label = value >= 75 ? "Positive" : value >= 50 ? "Neutral" : "Negative";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{value}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventRoom() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const eventId = params.id ?? "q4-earnings-2026";
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];

  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "polls">("transcript");
  const [visibleLines, setVisibleLines] = useState<typeof TRANSCRIPT_LINES>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [sentiment, setSentiment] = useState(72);
  const [sentimentIdx, setSentimentIdx] = useState(0);
  const [qaItems, setQaItems] = useState(QA_ITEMS_INITIAL);
  const [newQuestion, setNewQuestion] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attendees] = useState(1247);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Simulate transcript lines appearing
  useEffect(() => {
    if (!isPlaying) return;
    if (currentLineIdx >= TRANSCRIPT_LINES.length) return;
    const delay = currentLineIdx === 0 ? 800 : 4500;
    const timer = setTimeout(() => {
      setVisibleLines((prev) => [...prev, TRANSCRIPT_LINES[currentLineIdx]]);
      setCurrentLineIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentLineIdx, isPlaying]);

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [visibleLines, autoScroll]);

  // Simulate elapsed time
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Simulate sentiment changes
  useEffect(() => {
    const timer = setInterval(() => {
      setSentimentIdx((i) => {
        const next = (i + 1) % SENTIMENT_HISTORY.length;
        setSentiment(SENTIMENT_HISTORY[next]);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleVote = useCallback((id: number) => {
    setQaItems((items) => items.map((q) => q.id === id ? { ...q, votes: q.votes + 1 } : q));
  }, []);

  const handleSubmitQuestion = useCallback(() => {
    if (!newQuestion.trim()) return;
    setQaItems((items) => [
      { id: Date.now(), question: newQuestion.trim(), author: "You", votes: 1, answered: false },
      ...items,
    ]);
    setNewQuestion("");
  }, [newQuestion]);

  const speakerColor: Record<string, string> = {
    "Operator": "text-muted-foreground",
    "James Mitchell (CEO)": "text-blue-400",
    "Sarah Chen (CFO)": "text-emerald-400",
    "Dr. Priya Nair (CTO)": "text-violet-400",
    "Board Chair": "text-amber-400",
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Top Header */}
      <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur-md px-4 h-14 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Events</span>
        </button>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm hidden sm:inline">Chorus<span className="text-primary">.AI</span></span>
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{meta.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{meta.company}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <LiveBadge />
          <PlatformBadge platform={meta.platform} />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{attendees.toLocaleString()}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Player */}
        <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
          {/* Video placeholder */}
          <div className="flex-1 relative flex items-center justify-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-hero-bg-bFr44AaNNWKkv4uMRbTXe8.webp"
              alt="Live stream"
              className="w-full h-full object-cover opacity-90"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Speaker label */}
            {visibleLines.length > 0 && (
              <div className="absolute bottom-16 left-4 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                <div className={`text-xs font-semibold ${speakerColor[visibleLines[visibleLines.length - 1]?.speaker] ?? "text-white"}`}>
                  {visibleLines[visibleLines.length - 1]?.speaker}
                </div>
                <div className="text-white text-sm mt-0.5 max-w-xs leading-snug" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {visibleLines[visibleLines.length - 1]?.text.slice(0, 80)}
                  {(visibleLines[visibleLines.length - 1]?.text.length ?? 0) > 80 ? "…" : ""}
                </div>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="shrink-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-2 text-white text-sm hover:text-primary transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
              )}
              <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full sentiment-bar-fill"
                style={{ width: `${Math.min((elapsedSeconds / 1080) * 100, 100)}%` }}
              />
            </div>

            <span className="text-white/60 text-xs font-mono shrink-0">{formatTime(elapsedSeconds)} / 18:00</span>

            <button
              onClick={() => setIsMuted((m) => !m)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button className="text-white/60 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Intelligence Sidebar */}
        <div className="w-96 shrink-0 flex flex-col border-l border-border bg-card overflow-hidden">
          {/* Sentiment Strip */}
          <div className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-4 bg-card/80">
            <SentimentGauge value={sentiment} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Live Sentiment</div>
              <div className="flex gap-1 flex-wrap">
                {SENTIMENT_HISTORY.slice(Math.max(0, sentimentIdx - 5), sentimentIdx + 1).map((v, i) => (
                  <div
                    key={i}
                    className="w-5 h-8 rounded-sm"
                    style={{
                      backgroundColor: v >= 75 ? "rgb(16 185 129 / 0.6)" : v >= 50 ? "rgb(245 158 11 / 0.6)" : "rgb(239 68 68 / 0.6)",
                      height: `${(v / 100) * 32}px`,
                      alignSelf: "flex-end",
                    }}
                  />
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Last 6 readings</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-border">
            {[
              { key: "transcript", label: "Transcript", icon: FileText },
              { key: "qa", label: "Q&A", icon: MessageSquare },
              { key: "polls", label: "Analytics", icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ── Transcript Tab ── */}
            {activeTab === "transcript" && (
              <>
                <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mic className="w-3 h-3 text-primary" />
                    <span style={{ fontFamily: "'Inter', sans-serif" }}>Auto-transcribed · Whisper AI</span>
                  </div>
                  <button
                    onClick={() => setAutoScroll((a) => !a)}
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${autoScroll ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                  >
                    {autoScroll ? "Auto" : "Manual"}
                  </button>
                </div>
                <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {visibleLines.map((line, i) => (
                    <div
                      key={i}
                      className={`transcript-line-enter ${i === visibleLines.length - 1 ? "bg-primary/5 border border-primary/10 rounded-lg p-2" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold ${speakerColor[line.speaker] ?? "text-muted-foreground"}`}>
                          {line.speaker}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{line.time}</span>
                        {i === visibleLines.length - 1 && (
                          <span className="ml-auto text-[9px] text-primary font-bold uppercase tracking-wider">Now</span>
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed text-foreground/90"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {line.text}
                      </p>
                    </div>
                  ))}
                  {currentLineIdx < TRANSCRIPT_LINES.length && isPlaying && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      Transcribing…
                    </div>
                  )}
                </div>
                <div className="shrink-0 border-t border-border px-3 py-2 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <select className="flex-1 bg-transparent text-xs text-muted-foreground outline-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <option>English (Original)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Japanese</option>
                    <option>Mandarin</option>
                  </select>
                </div>
              </>
            )}

            {/* ── Q&A Tab ── */}
            {activeTab === "qa" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {qaItems
                    .sort((a, b) => b.votes - a.votes)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg p-3 border ${item.answered ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-background/40"}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleVote(item.id)}
                            className="shrink-0 flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors mt-0.5"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">{item.votes}</span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed text-foreground/90" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {item.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground">{item.author}</span>
                              {item.answered && (
                                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Answered</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="shrink-0 border-t border-border p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
                      placeholder="Ask a question…"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                    <button
                      onClick={handleSubmitQuestion}
                      disabled={!newQuestion.trim()}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Analytics Tab ── */}
            {activeTab === "polls" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Speaker Time Distribution</div>
                  {[
                    { name: "James Mitchell (CEO)", pct: 52, color: "bg-blue-400" },
                    { name: "Sarah Chen (CFO)", pct: 35, color: "bg-emerald-400" },
                    { name: "Operator", pct: 13, color: "bg-muted-foreground" },
                  ].map((s) => (
                    <div key={s.name} className="mb-2">
                      <div className="flex justify-between text-[11px] mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="font-semibold">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color} sentiment-bar-fill`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Audience Engagement</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Attendees", value: "1,247", icon: Users },
                      { label: "Questions", value: qaItems.length.toString(), icon: MessageSquare },
                      { label: "Avg. Sentiment", value: `${Math.round(SENTIMENT_HISTORY.reduce((a, b) => a + b) / SENTIMENT_HISTORY.length)}`, icon: BarChart3 },
                      { label: "Languages", value: "6", icon: Globe },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-background/60 border border-border rounded-lg p-3 text-center">
                        <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Key Topics Detected</div>
                  <div className="flex flex-wrap gap-2">
                    {["Q4 Revenue", "AI Strategy", "Chorus.AI", "Gross Margin", "Teams Integration", "2026 Guidance", "Recall.ai", "EBITDA"].map((tag) => (
                      <span key={tag} className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
