import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Mic, MicOff, Users, Clock, Settings,
  Radio, Link2, Copy, CheckCheck, ChevronUp, Trash2,
  Play, Square, Phone, Globe, BarChart3, MessageSquare,
  AlertCircle, CheckCircle, Loader2, Volume2, VolumeX,
  ExternalLink, Key, Webhook, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const EVENT_META: Record<string, { title: string; company: string; platform: string }> = {
  "q4-earnings-2026": { title: "Q4 2025 Earnings Call", company: "Chorus Call Inc.", platform: "Zoom" },
  "investor-day-2026": { title: "Annual Investor Day", company: "Chorus Call Inc.", platform: "Microsoft Teams" },
  "board-briefing": { title: "Board Strategy Briefing", company: "Chorus Call Inc.", platform: "Webex" },
};

type BotStatus = "disconnected" | "connecting" | "live" | "ended";
type QAItem = { id: number; question: string; author: string; votes: number; approved: boolean; dismissed: boolean; answered: boolean };

const INITIAL_QA: QAItem[] = [
  { id: 1, question: "Can you provide more detail on the Chorus.AI revenue contribution in Q4?", author: "Goldman Sachs", votes: 47, approved: true, dismissed: false, answered: false },
  { id: 2, question: "What is the timeline for the native Microsoft Teams integration?", author: "JP Morgan", votes: 31, approved: true, dismissed: false, answered: false },
  { id: 3, question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Morgan Stanley", votes: 28, approved: false, dismissed: false, answered: false },
  { id: 4, question: "Can you elaborate on the 40% engagement increase metric?", author: "Barclays", votes: 19, approved: true, dismissed: false, answered: true },
  { id: 5, question: "What is the competitive moat against Zoom and Teams building similar features?", author: "UBS", votes: 15, approved: false, dismissed: false, answered: false },
  { id: 6, question: "What is your cash runway and expected burn rate for 2026?", author: "Anonymous", votes: 3, approved: false, dismissed: false, answered: false },
];

const DIAL_IN_NUMBERS = [
  { country: "United States", flag: "🇺🇸", number: "+1 (800) 555-0192", passcode: "847291#" },
  { country: "United Kingdom", flag: "🇬🇧", number: "+44 800 555 0192", passcode: "847291#" },
  { country: "South Africa", flag: "🇿🇦", number: "+27 800 555 019", passcode: "847291#" },
  { country: "Australia", flag: "🇦🇺", number: "+61 800 555 019", passcode: "847291#" },
  { country: "Germany", flag: "🇩🇪", number: "+49 800 555 0192", passcode: "847291#" },
  { country: "Singapore", flag: "🇸🇬", number: "+65 800 555 019", passcode: "847291#" },
];

function StatusDot({ status }: { status: BotStatus }) {
  const map = {
    disconnected: { color: "bg-muted-foreground", label: "Disconnected" },
    connecting: { color: "bg-amber-400 animate-pulse", label: "Connecting…" },
    live: { color: "bg-emerald-400", label: "Live" },
    ended: { color: "bg-muted-foreground", label: "Ended" },
  };
  const { color, label } = map[status];
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export default function OperatorConsole() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const eventId = params.id ?? "q4-earnings-2026";
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];

  const [activeTab, setActiveTab] = useState<"connect" | "qa" | "dialin" | "rtmp" | "settings">("connect");
  const [botStatus, setBotStatus] = useState<BotStatus>("disconnected");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [qaItems, setQaItems] = useState<QAItem[]>(INITIAL_QA);
  const [attendees] = useState(1247);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [eventStarted, setEventStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const rtmpKey = "evt_q4_2026_xK9mNpQ3";
  const rtmpUrl = `rtmp://ingest.chorus.ai/live/${rtmpKey}`;
  const webhookUrl = `https://chorus.ai/api/webhooks/recall`;

  useEffect(() => {
    if (!eventStarted) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [eventStarted]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConnect = () => {
    if (!meetingUrl.trim()) { toast.error("Please enter a meeting URL"); return; }
    setBotStatus("connecting");
    toast.info("Dispatching Chorus.AI bot to meeting…");
    setTimeout(() => {
      setBotStatus("live");
      setEventStarted(true);
      toast.success("Bot joined! Live transcription active.");
    }, 3000);
  };

  const handleDisconnect = () => {
    setBotStatus("ended");
    toast.info("Bot disconnected. Generating AI summary…");
  };

  const handleStartEvent = () => {
    setEventStarted(true);
    toast.success("Event started — attendees can now join.");
  };

  const approveQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, approved: true } : q));
  const dismissQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, dismissed: true } : q));
  const answerQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, answered: true } : q));

  const pendingQ = qaItems.filter((q) => !q.approved && !q.dismissed && !q.answered);
  const approvedQ = qaItems.filter((q) => q.approved && !q.answered);
  const answeredQ = qaItems.filter((q) => q.answered);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Events
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">Chorus<span className="text-primary">.AI</span></span>
          <span className="text-muted-foreground text-sm">/ Operator Console</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <StatusDot status={botStatus} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> {attendees.toLocaleString()}
          </div>
          {eventStarted && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
              <Clock className="w-3.5 h-3.5" /> {formatTime(elapsedSeconds)}
            </div>
          )}
          <button onClick={() => navigate(`/event/${eventId}`)} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ExternalLink className="w-3 h-3" /> Event Room
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar Nav */}
        <nav className="w-56 shrink-0 border-r border-border bg-card/40 p-3 flex flex-col gap-1">
          {[
            { key: "connect", label: "Connect Webcast", icon: Radio },
            { key: "qa", label: "Q&A Moderation", icon: MessageSquare, badge: pendingQ.length },
            { key: "dialin", label: "Dial-In Numbers", icon: Phone },
            { key: "rtmp", label: "RTMP / Stream Key", icon: Link2 },
            { key: "settings", label: "Event Settings", icon: Settings },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span> : null}
            </button>
          ))}

          <div className="mt-auto pt-3 border-t border-border space-y-2">
            {!eventStarted ? (
              <button onClick={handleStartEvent} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Play className="w-4 h-4" /> Start Event
              </button>
            ) : (
              <button onClick={() => { setEventStarted(false); setBotStatus("ended"); }} className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-destructive/20 transition-colors">
                <Square className="w-4 h-4" /> End Event
              </button>
            )}
          </div>
        </nav>

        {/* Main Panel */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Connect Webcast ── */}
          {activeTab === "connect" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Connect Webcast</h2>
                <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Paste the meeting URL from Zoom, Teams, Webex, or Google Meet. Chorus.AI will dispatch a bot to join as a silent participant and begin live transcription.
                </p>
              </div>

              {/* Status Card */}
              <div className={`border rounded-xl p-5 ${botStatus === "live" ? "border-emerald-500/30 bg-emerald-500/5" : botStatus === "connecting" ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-5 h-5 ${botStatus === "live" ? "text-emerald-400" : botStatus === "connecting" ? "text-amber-400" : "text-muted-foreground"}`} />
                    <span className="font-semibold">Recall.ai Universal Connector</span>
                  </div>
                  <StatusDot status={botStatus} />
                </div>

                {botStatus === "disconnected" || botStatus === "ended" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Meeting URL</label>
                      <input
                        type="url"
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        placeholder="https://zoom.us/j/123456789 or https://teams.microsoft.com/l/meetup-join/..."
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {["Zoom", "Teams", "Webex", "Google Meet", "Slack Huddles", "GoTo Meeting"].map((p) => (
                        <span key={p} className="bg-secondary px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                    <button onClick={handleConnect} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" /> Connect AI Bot
                    </button>
                  </div>
                ) : botStatus === "connecting" ? (
                  <div className="flex items-center gap-3 text-amber-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Bot dispatched — joining meeting…</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <CheckCircle className="w-4 h-4" />
                      Bot is live — real-time transcription active
                    </div>
                    <div className="bg-background/60 border border-border rounded-lg p-3 text-xs font-mono text-muted-foreground break-all">
                      {meetingUrl || "https://zoom.us/j/123456789"}
                    </div>
                    <button onClick={handleDisconnect} className="w-full border border-destructive/30 text-destructive py-2.5 rounded-lg font-semibold text-sm hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
                      <MicOff className="w-4 h-4" /> Disconnect Bot
                    </button>
                  </div>
                )}
              </div>

              {/* Webhook Info */}
              <div className="border border-border rounded-xl p-5 bg-card space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Webhook className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Webhook Endpoint</span>
                </div>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Recall.ai posts real-time transcript events to this URL. Responds 200 within 5s.
                </p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                  <span className="flex-1 text-xs font-mono text-muted-foreground">{webhookUrl}</span>
                  <button onClick={() => handleCopy(webhookUrl, "webhook")} className="text-muted-foreground hover:text-foreground transition-colors">
                    {copied === "webhook" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {["bot.joining_call", "bot.in_call_recording", "transcript.data", "bot.call_ended"].map((e) => (
                    <div key={e} className="bg-secondary/50 px-2 py-1 rounded font-mono text-muted-foreground">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Q&A Moderation ── */}
          {activeTab === "qa" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Q&A Moderation</h2>
                <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Review, approve, dismiss, and mark questions as answered. Approved questions are visible to all attendees.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Pending Review", value: pendingQ.length, color: "text-amber-400" },
                  { label: "Approved", value: approvedQ.length, color: "text-emerald-400" },
                  { label: "Answered", value: answeredQ.length, color: "text-muted-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <div className={`text-3xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Pending */}
              {pendingQ.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-sm">Pending Review ({pendingQ.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pendingQ.map((q) => (
                      <div key={q.id} className="bg-card border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{q.author}</span>
                              <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" />{q.votes} votes</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => approveQ(q.id)} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors">Approve</button>
                            <button onClick={() => dismissQ(q.id)} className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors">Dismiss</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              {approvedQ.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm">Approved — Visible to Attendees ({approvedQ.length})</span>
                  </div>
                  <div className="space-y-2">
                    {approvedQ.map((q) => (
                      <div key={q.id} className="bg-card border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{q.author}</span>
                              <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" />{q.votes} votes</span>
                            </div>
                          </div>
                          <button onClick={() => answerQ(q.id)} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0">Mark Answered</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answered */}
              {answeredQ.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm text-muted-foreground">Answered ({answeredQ.length})</span>
                  </div>
                  <div className="space-y-2">
                    {answeredQ.map((q) => (
                      <div key={q.id} className="bg-card/50 border border-border rounded-xl p-4 opacity-60">
                        <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{q.author}</span>
                          <span className="text-emerald-400 font-semibold">✓ Answered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Dial-In Numbers ── */}
          {activeTab === "dialin" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Dial-In Numbers</h2>
                <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  PSTN dial-in via Twilio Voice — essential for emerging markets where mobile data costs make browser-based audio unreliable.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <strong>Africa / Emerging Markets:</strong> Always include PSTN dial-in as a fallback. Chorus.AI routes Twilio audio through the same AI pipeline for transcription and sentiment.
                </p>
              </div>
              <div className="space-y-2">
                {DIAL_IN_NUMBERS.map((d) => (
                  <div key={d.country} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <span className="text-2xl">{d.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{d.country}</div>
                      <div className="text-muted-foreground text-sm font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.number}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Passcode</div>
                      <div className="font-mono text-sm font-bold">{d.passcode}</div>
                    </div>
                    <button onClick={() => handleCopy(`${d.number} Passcode: ${d.passcode}`, d.country)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied === d.country ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-sm font-semibold mb-2">Powered by Twilio Voice</div>
                <div className="grid grid-cols-2 gap-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div className="text-muted-foreground">Cost per minute</div><div className="font-semibold">~$0.0085 / min</div>
                  <div className="text-muted-foreground">90-min event cost</div><div className="font-semibold">~$0.50 / caller</div>
                  <div className="text-muted-foreground">Transcription</div><div className="font-semibold text-emerald-400">✓ Included via Whisper</div>
                  <div className="text-muted-foreground">Countries covered</div><div className="font-semibold">180+</div>
                </div>
              </div>
            </div>
          )}

          {/* ── RTMP / Stream Key ── */}
          {activeTab === "rtmp" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">RTMP Ingest</h2>
                <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  For professional studio productions using OBS, vMix, Wirecast, or hardware encoders. Push your stream to Chorus.AI and we handle transcription, sentiment, and Q&A.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">RTMP Ingest URL</label>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
                    <span className="flex-1 text-sm font-mono text-muted-foreground">{rtmpUrl}</span>
                    <button onClick={() => handleCopy(rtmpUrl, "rtmp")} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied === "rtmp" ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Stream Key</label>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
                    <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-mono">{rtmpKey}</span>
                    <button onClick={() => handleCopy(rtmpKey, "key")} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied === "key" ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toast.info("Stream key regenerated")} className="text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-3">OBS Studio Setup</div>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[
                    ["Service", "Custom…"],
                    ["Server", "rtmp://ingest.chorus.ai/live"],
                    ["Stream Key", rtmpKey],
                    ["Audio Bitrate", "128 kbps (mono recommended)"],
                    ["Video Bitrate", "2500–4000 kbps"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-2">Supported Encoders</div>
                <div className="flex flex-wrap gap-2">
                  {["OBS Studio", "vMix", "Wirecast", "Livestream Studio", "XSplit", "Hardware Encoders (Teradek, LiveU)"].map((e) => (
                    <span key={e} className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Event Settings ── */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Event Settings</h2>
                <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Configure AI features, languages, and access controls for this event.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="font-semibold text-sm border-b border-border pb-3">AI Features</div>
                {[
                  { label: "Live Transcription", desc: "Real-time speech-to-text via Whisper", enabled: true },
                  { label: "Sentiment Analysis", desc: "AI monitors tone every 30 seconds", enabled: true },
                  { label: "Auto-Translation", desc: "Participants choose their language", enabled: true },
                  { label: "Smart Q&A Prioritization", desc: "AI ranks questions by relevance", enabled: true },
                  { label: "Executive Summary", desc: "AI summary generated after event ends", enabled: true },
                  { label: "Live Chat", desc: "Real-time chat between attendees", enabled: false },
                ].map(({ label, desc, enabled }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${enabled ? "bg-primary" : "bg-muted"}`} onClick={() => toast.info("Toggle saved")}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="font-semibold text-sm border-b border-border pb-3">Transcription Languages</div>
                <div className="flex flex-wrap gap-2">
                  {["English", "Spanish", "French", "German", "Japanese", "Mandarin", "Portuguese", "Arabic"].map((lang) => (
                    <span key={lang} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors">{lang}</span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="font-semibold text-sm border-b border-border pb-3">Access & Security</div>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[
                    ["Registration Required", "Yes — email + name"],
                    ["Q&A Moderation", "Operator approval required"],
                    ["Recording", "Enabled — stored 90 days"],
                    ["Replay Access", "Registered attendees only"],
                    ["Data Retention", "Ephemeral processing — no disk storage"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
