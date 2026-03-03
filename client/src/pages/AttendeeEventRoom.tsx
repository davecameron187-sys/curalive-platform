/**
 * AttendeeEventRoom.tsx — Token-gated attendee view for registered webcast participants.
 *
 * Route: /live-video/webcast/:slug/attend?token=<attendeeToken>
 *
 * Validates the attendee token, marks the attendee as joined, then renders:
 *   - Live stream player (Mux HLS) or on-demand recording
 *   - Real-time transcript (via Ably)
 *   - Q&A submission panel
 *   - Live polls
 *   - Language selector (12 languages)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import {
  Zap, Globe, MessageSquare, BarChart3, FileText,
  Send, ChevronUp, ChevronDown, Loader2, AlertCircle, CheckCircle2,
  Play, Pause, Volume2, VolumeX, Maximize2, Clock,
  Users, Subtitles, ArrowLeft, Radio, Sparkles
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AblyProvider, useAbly, type QAItem } from "@/contexts/AblyContext";
import MuxPlayer from "@mux/mux-player-react";

// ─── Language configuration ───────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🌍" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🌍" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇦🇪", rtl: true },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🌍" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", flag: "🌍" },
  { code: "zu", label: "Zulu", nativeLabel: "isiZulu", flag: "🇿🇦" },
  { code: "af", label: "Afrikaans", nativeLabel: "Afrikaans", flag: "🇿🇦" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa", flag: "🌍" },
  { code: "am", label: "Amharic", nativeLabel: "አማርኛ", flag: "🇪🇹" },
  { code: "zh", label: "Mandarin", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "mfe", label: "Creole", nativeLabel: "Kreol Morisyen", flag: "🇲🇺" },
];

const POLL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

// ─── Token validation gate ────────────────────────────────────────────────────
function TokenGate({ children, slug, token }: { children: React.ReactNode; slug: string; token: string }) {
  const { data, isLoading, error } = trpc.webcast.verifyAttendeeToken.useQuery(
    { slug, token },
    { retry: false, refetchOnWindowFocus: false }
  );
  const markJoined = trpc.webcast.markAttendeeJoined.useMutation();
  const hasMarked = useRef(false);

  useEffect(() => {
    if (data?.valid && !hasMarked.current) {
      hasMarked.current = true;
      markJoined.mutate({ slug, token });
    }
  }, [data?.valid, slug, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verifying your registration…</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This join link is invalid or has expired. Please register again to receive a new link.
          </p>
          <a
            href={`/live-video/webcast/${slug}/register`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Register for this Event
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Main inner component (uses AblyContext) ──────────────────────────────────
function AttendeeRoomInner({
  slug,
  token,
  attendeeName,
  eventTitle,
  eventStatus,
  recordingUrl,
}: {
  slug: string;
  token: string;
  attendeeName: string;
  eventTitle: string;
  eventStatus: string;
  recordingUrl: string | null | undefined;
}) {
  const [, navigate] = useLocation();
  const { transcript, qaItems, polls, presenceCount, publish, rollingSummary } = useAbly();
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [summaryPulse, setSummaryPulse] = useState(false);
  const prevSummaryRef = useRef<string | null>(null);

  // Pulse indicator when a new summary arrives while panel is collapsed
  useEffect(() => {
    if (!rollingSummary) return;
    if (rollingSummary.text !== prevSummaryRef.current) {
      prevSummaryRef.current = rollingSummary.text;
      if (!summaryOpen) setSummaryPulse(true);
    }
  }, [rollingSummary, summaryOpen]);
  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "polls">("transcript");
  const [language, setLanguage] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [autoScroll, setAutoScroll] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Fetch Mux stream for the event
  const { data: eventData } = trpc.webcast.getEvent.useQuery({ slug }, { retry: false });
  const { data: streams } = trpc.mux.listStreams.useQuery(
    { eventId: eventData?.id, meetingId: undefined },
    { enabled: !!eventData?.id, refetchInterval: 15000 }
  );
  const activeStream = streams?.find((s) => s.status === "active" || s.status === "idle");

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  const handleSubmitQuestion = useCallback(() => {
    if (!newQuestion.trim()) return;
    publish({
      type: "qa.submitted",
      data: {
        id: `q-${Date.now()}`,
        question: newQuestion.trim(),
        author: attendeeName,
        votes: 0,
        status: "pending",
        submittedAt: Date.now(),
      },
    });
    setNewQuestion("");
    setQuestionSubmitted(true);
    setTimeout(() => setQuestionSubmitted(false), 3000);
  }, [newQuestion, attendeeName, publish]);

  const handleVotePoll = useCallback((pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;
    publish({ type: "poll.vote", data: { pollId, optionId } });
    setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
  }, [votedPolls, publish]);

  const activeLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isLive = eventStatus === "live";
  const isOnDemand = eventStatus === "ended" || eventStatus === "on_demand";

  const approvedQA = qaItems.filter((q) => q.status === "approved" || q.status === "answered");
  const activePolls = polls.filter((p) => p.status === "live");

  return (
    <div className="min-h-screen bg-[#0a0d14] text-foreground flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-[#0a0d14]/90 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/live-video/webcast/${slug}`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm truncate max-w-[180px] sm:max-w-xs">{eventTitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{presenceCount.toLocaleString()}</span>
          </div>
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{activeLang.flag} {activeLang.label}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 w-52 max-h-72 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 ${language === lang.code ? "text-primary font-semibold" : "text-foreground"}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                    {language === lang.code && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video + info */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video player */}
          <div className="relative bg-black" style={{ aspectRatio: "16/9", maxHeight: "calc(100vh - 14rem)" }}>
            {/* Live stream via Mux */}
            {activeStream?.muxPlaybackId && isLive ? (
              <MuxPlayer
                playbackId={activeStream.muxPlaybackId}
                streamType="live"
                autoPlay
                muted={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : isOnDemand && recordingUrl ? (
              // On-demand: use MuxPlayer for Mux HLS URLs, native <video> for others
              recordingUrl.includes("stream.mux.com") ? (() => {
                const muxMatch = recordingUrl.match(/stream\.mux\.com\/([^.]+)/);
                const playbackId = muxMatch?.[1];
                return playbackId ? (
                  <MuxPlayer
                    playbackId={playbackId}
                    streamType="on-demand"
                    autoPlay={false}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <video src={recordingUrl} controls className="w-full h-full object-contain" />
                );
              })() : (
                <video
                  src={recordingUrl}
                  controls
                  autoPlay={false}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                    {isLive ? (
                      <Radio className="w-7 h-7 text-red-400 animate-pulse" />
                    ) : (
                      <Play className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isLive ? "Stream starting soon…" : "Recording will be available after the event."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Event info bar */}
          <div className="px-4 py-3 border-b border-border bg-card/30 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{isLive ? "Live now" : isOnDemand ? "On demand" : "Scheduled"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Subtitles className="w-3.5 h-3.5" />
              <span>Live captions: {activeLang.nativeLabel}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-primary font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registered as {attendeeName}</span>
            </div>
          </div>

          {/* ── Collapsible AI Summary Panel ── */}
          {rollingSummary && (
            <div className="shrink-0 border-b border-border bg-[#0d1020]">
              <button
                onClick={() => {
                  setSummaryOpen((v) => !v);
                  setSummaryPulse(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    {summaryPulse && !summaryOpen && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">AI Summary</span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>What you missed</span>
                  {summaryPulse && !summaryOpen && (
                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Updated {new Date(rollingSummary.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {summaryOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  }
                </div>
              </button>
              {summaryOpen && (
                <div className="px-4 pb-3 pt-0">
                  <div
                    className="text-sm leading-relaxed text-slate-300 bg-violet-500/5 border border-violet-500/15 rounded-lg px-4 py-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {rollingSummary.text}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI-generated from live transcript · {rollingSummary.segmentCount} segments analysed</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transcript area (desktop) */}
          <div className="hidden lg:flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Transcript</span>
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className={`text-xs px-2 py-1 rounded ${autoScroll ? "text-primary" : "text-muted-foreground"} hover:text-foreground transition-colors`}
              >
                {autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
              </button>
            </div>
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
              onScroll={(e) => {
                const el = e.currentTarget;
                const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                setAutoScroll(atBottom);
              }}
            >
              {transcript.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Transcript will appear here when the event begins.
                </div>
              ) : (
                transcript.map((seg) => (
                  <div key={seg.id} className="flex gap-3 text-sm">
                    <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 pt-0.5 w-10">
                      {Math.floor(seg.timestamp / 60).toString().padStart(2, "0")}:{(seg.timestamp % 60).toString().padStart(2, "0")}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-primary mr-2">{seg.speaker}</span>
                      <span className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {seg.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Engagement panel */}
        <div className="w-80 xl:w-96 border-l border-border flex flex-col shrink-0 bg-[#0a0d14]">
          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {[
              { id: "transcript" as const, icon: FileText, label: "Transcript" },
              { id: "qa" as const, icon: MessageSquare, label: `Q&A${approvedQA.length > 0 ? ` (${approvedQA.length})` : ""}` },
              { id: "polls" as const, icon: BarChart3, label: `Polls${activePolls.length > 0 ? ` (${activePolls.length})` : ""}` },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* Transcript tab (mobile/right panel) */}
            {activeTab === "transcript" && (
              <div className="p-3 space-y-2">
                {transcript.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Transcript will appear here when the event begins.
                  </div>
                ) : (
                  transcript.map((seg) => (
                    <div key={seg.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {Math.floor(seg.timestamp / 60).toString().padStart(2, "0")}:{(seg.timestamp % 60).toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs font-semibold text-primary">{seg.speaker}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed pl-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {seg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Q&A tab */}
            {activeTab === "qa" && (
              <div className="flex flex-col h-full">
                {/* Approved questions */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {approvedQA.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No questions yet. Be the first to ask!
                    </div>
                  ) : (
                    approvedQA.map((q) => (
                      <div key={q.id} className="bg-card border border-border rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-foreground">{q.author}</span>
                          {q.status === "answered" && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">Answered</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{q.votes}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Submit question */}
                <div className="p-3 border-t border-border shrink-0">
                  {questionSubmitted ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm py-2 justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                      Question submitted for review
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
                        placeholder="Ask a question…"
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                      <button
                        onClick={handleSubmitQuestion}
                        disabled={!newQuestion.trim()}
                        className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Polls tab */}
            {activeTab === "polls" && (
              <div className="p-3 space-y-4">
                {activePolls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No active polls right now. Check back during the event.
                  </div>
                ) : (
                  activePolls.map((poll) => {
                    const myVote = votedPolls[poll.id];
                    const totalVotes = poll.options.reduce((s, o) => s + (o.votes || 0), 0);
                    return (
                      <div key={poll.id} className="bg-card border border-border rounded-xl p-4">
                        <p className="text-sm font-semibold mb-3">{poll.question}</p>
                        <div className="space-y-2">
                          {poll.options.map((opt, idx) => {
                            const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                            const isSelected = myVote === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleVotePoll(poll.id, opt.id)}
                                disabled={!!myVote}
                                className={`w-full text-left relative rounded-lg overflow-hidden border transition-all ${
                                  isSelected ? "border-primary" : "border-border hover:border-primary/40"
                                } ${myVote ? "cursor-default" : "cursor-pointer"}`}
                              >
                                {myVote && (
                                  <div
                                    className="absolute inset-0 opacity-20 rounded-lg"
                                    style={{ width: `${pct}%`, background: POLL_COLORS[idx % POLL_COLORS.length] }}
                                  />
                                )}
                                <div className="relative flex items-center justify-between px-3 py-2">
                                  <span className="text-xs font-medium">{opt.label}</span>
                                  {myVote && (
                                    <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {myVote && (
                          <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · Your response recorded
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function AttendeeEventRoom() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  const { data: tokenData } = trpc.webcast.verifyAttendeeToken.useQuery(
    { slug: slug || "", token },
    { enabled: !!slug && !!token, retry: false, refetchOnWindowFocus: false }
  );

  if (!slug || !token) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Missing Join Link</h2>
          <p className="text-sm text-muted-foreground">
            Please use the join link from your registration confirmation email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TokenGate slug={slug} token={token}>
      <AblyProvider eventId={slug}>
        <AttendeeRoomInner
          slug={slug}
          token={token}
          attendeeName={
            tokenData?.registration
              ? `${tokenData.registration.firstName} ${tokenData.registration.lastName}`
              : "Attendee"
          }
          eventTitle={tokenData?.event?.title || "Event"}
          eventStatus={tokenData?.event?.status || "scheduled"}
          recordingUrl={tokenData?.event?.recordingUrl}
        />
      </AblyProvider>
    </TokenGate>
  );
}
