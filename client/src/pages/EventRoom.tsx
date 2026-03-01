import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Users, Clock, Settings,
  ChevronUp, Send, Globe, BarChart3, MessageSquare,
  FileText, Radio, Mic, Hand, MicOff, Share2, Check
} from "lucide-react";
import { AblyProvider, useAbly, type QAItem, type RaisedHand } from "@/contexts/AblyContext";

// ─── Event Metadata ───────────────────────────────────────────────────────────

const EVENT_META: Record<string, { title: string; company: string; platform: string }> = {
  "q4-earnings-2026": { title: "Q4 2025 Earnings Call", company: "Chorus Call Inc.", platform: "Zoom" },
  "investor-day-2026": { title: "Annual Investor Day", company: "Chorus Call Inc.", platform: "Microsoft Teams" },
  "board-briefing": { title: "Board Strategy Briefing", company: "Chorus Call Inc.", platform: "Webex" },
};

const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Mandarin", "Portuguese", "Arabic"];

const POLL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = { "Zoom": "bg-blue-600", "Microsoft Teams": "bg-purple-600", "Webex": "bg-slate-600" };
  return <span className={`text-[10px] font-bold text-white px-2 py-1 rounded ${colors[platform] ?? "bg-slate-600"}`}>{platform}</span>;
}

function SentimentGauge({ value }: { value: number }) {
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";
  const label = value >= 75 ? "Positive" : value >= 50 ? "Neutral" : "Negative";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
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

// ─── Inner Component (uses AblyContext) ───────────────────────────────────────

function EventRoomInner({ eventId }: { eventId: string }) {
  const [, navigate] = useLocation();
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];
  const { transcript, sentiment, qaItems, polls, raisedHands, presenceCount, publish } = useAbly();

  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "polls" | "analytics">("transcript");
  const [newQuestion, setNewQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [myHandId] = useState(() => `hand-${Date.now()}`);
  const [unmutedNotice, setUnmutedNotice] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const handleShareLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/register/${eventId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [eventId]);

  // Elapsed time
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleVote = useCallback((id: string, currentVotes: number) => {
    publish({ type: "qa.vote", data: { id, votes: currentVotes + 1 } });
  }, [publish]);

  const handleSubmitQuestion = useCallback(() => {
    if (!newQuestion.trim()) return;
    const newItem: QAItem = {
      id: `qa-${Date.now()}`,
      question: newQuestion.trim(),
      author: "You",
      votes: 1,
      status: "pending",
      submittedAt: Date.now(),
    };
    publish({ type: "qa.submitted", data: newItem });
    setNewQuestion("");
  }, [newQuestion, publish]);

  const handlePollVote = useCallback((pollId: string, optionId: string) => {
    publish({ type: "poll.vote", data: { pollId, optionId } });
  }, [publish]);

  const handleRaiseHand = useCallback(() => {
    if (handRaised) {
      publish({ type: "hand.lower", data: { id: myHandId } });
      setHandRaised(false);
      setUnmutedNotice(false);
    } else {
      const hand: RaisedHand = { id: myHandId, name: "You (Attendee)", raisedAt: Date.now(), status: "waiting" };
      publish({ type: "hand.raise", data: hand });
      setHandRaised(true);
    }
  }, [handRaised, myHandId, publish]);

  // Watch for unmute signal from moderator
  useEffect(() => {
    const myHand = raisedHands.find((h) => h.id === myHandId);
    if (myHand?.status === "unmuted") setUnmutedNotice(true);
  }, [raisedHands, myHandId]);

  const speakerColor: Record<string, string> = {
    "Operator": "text-muted-foreground",
    "James Mitchell (CEO)": "text-blue-400",
    "Sarah Chen (CFO)": "text-emerald-400",
    "Dr. Priya Nair (CTO)": "text-violet-400",
    "Board Chair": "text-amber-400",
  };

  const visibleQA = qaItems.filter((q) => q.status !== "rejected").sort((a, b) => b.votes - a.votes);
  const livePolls = polls.filter((p) => p.status === "live");

  // Poll overlay state — shows full-screen when a new poll is pushed
  const [activePollOverlay, setActivePollOverlay] = useState<typeof livePolls[0] | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const prevPollCount = useRef(0);

  // Auto-show overlay when a new live poll arrives
  useEffect(() => {
    if (livePolls.length > prevPollCount.current) {
      const newest = livePolls[livePolls.length - 1];
      if (newest && !votedPolls.has(newest.id)) {
        setActivePollOverlay(newest);
        setSelectedOption(null);
      }
    }
    prevPollCount.current = livePolls.length;
  }, [livePolls, votedPolls]);

  const handlePollOverlayVote = useCallback(() => {
    if (!activePollOverlay || !selectedOption) return;
    publish({ type: "poll.vote", data: { pollId: activePollOverlay.id, optionId: selectedOption } });
    setVotedPolls((prev) => new Set(Array.from(prev).concat(activePollOverlay.id)));
    setActivePollOverlay(null);
  }, [activePollOverlay, selectedOption, publish]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Full-Screen Poll Overlay ── */}
      {activePollOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">Live Poll</div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>From the Moderator</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                <span className="live-badge-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Live
              </div>
            </div>

            {/* Question */}
            <p className="text-lg font-semibold mb-6 leading-snug">{activePollOverlay.question}</p>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {activePollOverlay.options.map((opt, i) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedOption === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedOption === opt.id ? "border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selectedOption === opt.id && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{opt.label}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: POLL_COLORS[i % POLL_COLORS.length] }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setActivePollOverlay(null)}
                className="flex-1 border border-border text-muted-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handlePollOverlayVote}
                disabled={!selectedOption}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur-md px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Events</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm hidden sm:inline">Chorus<span className="text-primary">.AI</span></span>
        <div className="w-px h-5 bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{meta.title}</h1>
          <p className="text-[10px] text-muted-foreground truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{meta.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            <span className="live-badge-dot inline-block w-1.5 h-1.5 rounded-full bg-red-400" /> Live
          </div>
          <PlatformBadge platform={meta.platform} />
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{presenceCount.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        {/* Operator / Moderator / Presenter links */}
        <div className="hidden md:flex items-center gap-1 ml-2">
          <button onClick={() => navigate(`/moderator/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Radio className="w-3 h-3" /> Mod
          </button>
          <button onClick={() => navigate(`/presenter/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Mic className="w-3 h-3" /> Presenter
          </button>
          <button onClick={() => navigate(`/operator/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-3 h-3" /> Operator
          </button>
          <button
            onClick={handleShareLink}
            className={`flex items-center gap-1 text-xs font-semibold border px-2.5 py-1.5 rounded-lg transition-all ${
              shareCopied
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
            }`}
          >
            {shareCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {shareCopied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player (left) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video */}
          <div className="shrink-0 bg-black/80 relative" style={{ aspectRatio: "16/9", maxHeight: "45vh" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Live stream via {meta.platform}</p>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/30">
                <span className="live-badge-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Live
              </div>
              <PlatformBadge platform={meta.platform} />
            </div>
            <div className="absolute bottom-3 right-3 text-xs font-mono text-white/60 bg-black/50 px-2 py-1 rounded">
              {formatTime(elapsedSeconds)}
            </div>
            {/* Raise Hand button */}
            <button
              onClick={handleRaiseHand}
              className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                handRaised
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-black/50 border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              {handRaised ? "Hand Raised" : "Raise Hand"}
            </button>
          </div>

          {/* Unmuted by moderator banner */}
          {unmutedNotice && (
            <div className="shrink-0 bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">You have been unmuted by the moderator</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>You may now speak verbally on the call.</span>
              </div>
              <button onClick={() => { setUnmutedNotice(false); handleRaiseHand(); }} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-secondary transition-colors">
                <MicOff className="w-3 h-3" /> Lower Hand
              </button>
            </div>
          )}

          {/* Live Poll Banner (if any polls are live) */}
          {livePolls.length > 0 && (
            <div className="shrink-0 border-b border-border bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Live Poll</span>
                <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Active</span>
              </div>
              {livePolls.slice(0, 1).map((poll) => {
                const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                return (
                  <div key={poll.id}>
                    <p className="text-sm mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{poll.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {poll.options.map((opt, i) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        return (
                          <button key={opt.id} onClick={() => handlePollVote(poll.id, opt.id)}
                            className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span style={{ color: POLL_COLORS[i % POLL_COLORS.length] }}>●</span>
                            {opt.label}
                            {totalVotes > 0 && <span className="text-muted-foreground">({pct}%)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-border overflow-x-auto">
            {[
              { key: "transcript", label: "Transcript", icon: FileText },
              { key: "qa", label: `Q&A (${visibleQA.length})`, icon: MessageSquare },
              { key: "polls", label: `Polls${livePolls.length > 0 ? ` (${livePolls.length})` : ""}`, icon: BarChart3 },
              { key: "analytics", label: "Analytics", icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ── Transcript ── */}
            {activeTab === "transcript" && (
              <>
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer">
                      {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setAutoScroll((v) => !v)} className={`text-xs px-2 py-1 rounded border transition-colors ${autoScroll ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                    {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                  </button>
                </div>
                <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                      <FileText className="w-8 h-8 mb-2 opacity-30" />
                      Transcription starting…
                    </div>
                  )}
                  {transcript.map((seg, i) => (
                    <div key={seg.id} className="transcript-line-enter">
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${speakerColor[seg.speaker] ?? "text-muted-foreground"}`}>
                        {seg.speaker} · {seg.timeLabel}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", opacity: i === transcript.length - 1 ? 1 : 0.75 }}>{seg.text}</p>
                    </div>
                  ))}
                  {transcript.length > 0 && (
                    <div className="flex items-center gap-2">
                      {[0, 150, 300].map((d) => (
                        <span key={d} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgb(239 68 68)", display: "inline-block", animation: `bounce 1s ${d}ms infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Q&A ── */}
            {activeTab === "qa" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {visibleQA.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                      No questions yet. Be the first!
                    </div>
                  )}
                  {visibleQA.map((q) => (
                    <div key={q.id} className="flex gap-3 bg-card border border-border rounded-xl p-3">
                      <button onClick={() => handleVote(q.id, q.votes)} className="flex flex-col items-center gap-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronUp className="w-4 h-4" />
                        <span className="text-xs font-bold">{q.votes}</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{q.author}</span>
                          {q.status === "approved" && <span className="text-emerald-400 font-semibold">● Approved</span>}
                          {q.status === "answered" && <span className="text-muted-foreground font-semibold">✓ Answered</span>}
                          {q.status === "pending" && <span className="text-amber-400 font-semibold">○ Pending</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 border-t border-border p-3 flex gap-2">
                  <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
                    placeholder="Ask a question…"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                    style={{ fontFamily: "'Inter', sans-serif" }} />
                  <button onClick={handleSubmitQuestion} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Polls ── */}
            {activeTab === "polls" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {polls.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                    No polls yet. The moderator will push one soon.
                  </div>
                )}
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                  return (
                    <div key={poll.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-sm">{poll.question}</p>
                        <span className={`text-xs font-semibold ${poll.status === "live" ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {poll.status === "live" ? "● Live" : "Closed"} · {totalVotes} votes
                        </span>
                      </div>
                      <div className="space-y-2">
                        {poll.options.map((opt, i) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          return (
                            <div key={opt.id}>
                              <div className="flex justify-between text-xs mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <span>{opt.label}</span>
                                <span className="font-semibold">{pct}%</span>
                              </div>
                              <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div className="h-full rounded-full sentiment-bar-fill" style={{ width: `${pct}%`, backgroundColor: POLL_COLORS[i % POLL_COLORS.length] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {poll.status === "live" && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                          {poll.options.map((opt, i) => (
                            <button key={opt.id} onClick={() => handlePollVote(poll.id, opt.id)}
                              className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                              style={{ fontFamily: "'Inter', sans-serif" }}>
                              Vote: {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Analytics ── */}
            {activeTab === "analytics" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Attendees", value: presenceCount.toLocaleString() },
                    { label: "Transcript Lines", value: transcript.length.toString() },
                    { label: "Q&A Submitted", value: qaItems.length.toString() },
                    { label: "Active Polls", value: livePolls.length.toString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-primary">{value}</div>
                      <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Key Topics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Q4 Revenue", "AI Strategy", "Chorus.AI", "Gross Margin", "Teams Integration", "2026 Guidance", "Recall.ai", "EBITDA"].map((tag) => (
                      <span key={tag} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Sentiment */}
        <div className="w-48 shrink-0 border-l border-border bg-card/30 flex-col items-center p-4 gap-6 hidden lg:flex">
          <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Live Sentiment</div>
          <SentimentGauge value={sentiment.score} />
          <div className="w-full space-y-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Attendees</span>
              <span className="font-semibold">{presenceCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Q&A</span>
              <span className="font-semibold">{qaItems.length}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Polls</span>
              <span className="font-semibold">{livePolls.length}</span>
            </div>
          </div>
          <div className="w-full">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ably Channels</div>
            <div className="space-y-1">
              {["transcript", "sentiment", "qa", "polls", "presence"].map((ch) => (
                <div key={ch} className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-muted-foreground">{ch}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page (wraps with AblyProvider) ─────────────────────────────────

export default function EventRoom() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "q4-earnings-2026";
  return (
    <AblyProvider eventId={eventId}>
      <EventRoomInner eventId={eventId} />
    </AblyProvider>
  );
}
