import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Mic, MicOff, Users, Clock, Settings,
  Radio, Link2, Copy, CheckCheck, ChevronUp, Trash2,
  Play, Square, Phone, Globe, BarChart3, MessageSquare,
  AlertCircle, CheckCircle, Loader2, Volume2, VolumeX,
  ExternalLink, Key, Webhook, RefreshCw, Lock, Unlock, Eye, EyeOff,
  Palette, Monitor, Smartphone, Save, RotateCcw, ImageIcon
} from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  // Core markets
  { country: "South Africa",   flag: "🇿🇦", number: "+27 800 555 019",   passcode: "847291#", region: "Southern Africa" },
  { country: "Nigeria",        flag: "🇳🇬", number: "+234 800 555 019",  passcode: "847291#", region: "West Africa" },
  { country: "Kenya",          flag: "🇰🇪", number: "+254 800 555 019",  passcode: "847291#", region: "East Africa" },
  { country: "Ghana",          flag: "🇬🇭", number: "+233 800 555 019",  passcode: "847291#", region: "West Africa" },
  { country: "Mauritius",      flag: "🇲🇺", number: "+230 800 555 019",  passcode: "847291#", region: "Mauritius" },
  { country: "UAE / Dubai",    flag: "🇦🇪", number: "+971 800 555 019",  passcode: "847291#", region: "Middle East" },
  { country: "Egypt",          flag: "🇪🇬", number: "+20 800 555 019",   passcode: "847291#", region: "North Africa" },
  { country: "Ethiopia",       flag: "🇪🇹", number: "+251 800 555 019",  passcode: "847291#", region: "East Africa" },
  { country: "Morocco",        flag: "🇲🇦", number: "+212 800 555 019",  passcode: "847291#", region: "North Africa" },
  { country: "Angola",         flag: "🇦🇴", number: "+244 800 555 019",  passcode: "847291#", region: "Southern Africa" },
  { country: "Mozambique",     flag: "🇲🇿", number: "+258 800 555 019",  passcode: "847291#", region: "Southern Africa" },
  { country: "Namibia",        flag: "🇳🇦", number: "+264 800 555 019",  passcode: "847291#", region: "Southern Africa" },
  { country: "Tanzania",       flag: "🇹🇿", number: "+255 800 555 019",  passcode: "847291#", region: "East Africa" },
  { country: "Zambia",         flag: "🇿🇲", number: "+260 800 555 019",  passcode: "847291#", region: "Southern Africa" },
  // Global investor hubs
  { country: "United Kingdom", flag: "🇬🇧", number: "+44 800 555 0192",  passcode: "847291#", region: "Europe" },
  { country: "United States",  flag: "🇺🇸", number: "+1 (800) 555-0192", passcode: "847291#", region: "Americas" },
  { country: "China",          flag: "🇨🇳", number: "+86 800 555 019",   passcode: "847291#", region: "Asia" },
  { country: "India",          flag: "🇮🇳", number: "+91 800 555 019",   passcode: "847291#", region: "Asia" },
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

  const [activeTab, setActiveTab] = useState<"connect" | "qa" | "dialin" | "rtmp" | "settings" | "attendees" | "whitelabel">("connect");

  // White-label config state
  const [wlConfig, setWlConfig] = useState({
    brandName: "Chorus.AI",
    subdomain: "chorus",
    primaryColor: "#e63946",
    accentColor: "#ffffff",
    logoUrl: "",
    tagline: "The Intelligence Layer for Every Meeting",
    footerText: "Powered by Chorus.AI",
    showPoweredBy: true,
  });
  const [wlSaved, setWlSaved] = useState(false);
  const [wlPreviewMode, setWlPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Real attendee list from database
  const { data: attendeeList, isLoading: attendeesLoading, refetch: refetchAttendees } = trpc.registrations.listByEvent.useQuery({ eventId });
  const [botStatus, setBotStatus] = useState<BotStatus>("disconnected");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [qaItems, setQaItems] = useState<QAItem[]>(INITIAL_QA);
  const [attendees] = useState(1247);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [eventStarted, setEventStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Access code management
  const { data: accessData, refetch: refetchAccess } = trpc.events.verifyAccess.useQuery({ eventId });
  const setAccessCodeMutation = trpc.events.setAccessCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message ?? "Access code updated!");
        refetchAccess();
        setAccessCodeInput("");
      } else {
        toast.error(data.error ?? "Failed to update access code");
      }
    },
    onError: () => toast.error("Failed to update access code"),
  });
  const rtmpKey = "evt_q4_2026_xK9mNpQ3";
  const rtmpUrl = `rtmp://ingest.chorus.ai/live/${rtmpKey}`;
  const webhookUrl = `https://chorus.ai/api/webhooks/recall`;

  // ── Feature #15: Silence / Anomaly Detector ───────────────────────────────────
  const [silenceAlert, setSilenceAlert] = useState<{ seconds: number; dismissedAt: number | null } | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  // Simulate transcript activity ticks when bot is live
  useEffect(() => {
    if (botStatus !== "live") { setSilenceAlert(null); return; }
    // Simulate activity: reset every 15-45s randomly
    const activityInterval = setInterval(() => {
      const roll = Math.random();
      if (roll > 0.3) lastActivityRef.current = Date.now(); // 70% chance of activity
    }, 5000);
    // Check for silence every second
    const silenceCheck = setInterval(() => {
      const silenceSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (silenceSec >= 10) {
        setSilenceAlert((prev) => {
          if (prev?.dismissedAt) return prev; // already dismissed
          return { seconds: silenceSec, dismissedAt: null };
        });
      } else {
        setSilenceAlert(null);
      }
    }, 1000);
    return () => { clearInterval(activityInterval); clearInterval(silenceCheck); };
  }, [botStatus]);

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
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png" alt="Chorus Call" className="h-6 w-auto object-contain" />
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
            { key: "attendees", label: "Attendees", icon: Users, badge: attendeeList?.length || 0 },
            { key: "dialin", label: "Dial-In Numbers", icon: Phone },
            { key: "rtmp", label: "RTMP / Stream Key", icon: Link2 },
            { key: "settings", label: "Event Settings", icon: Settings },
            { key: "whitelabel", label: "White-Label", icon: Palette },
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
          {/* ── Feature #15: Silence / Anomaly Alert Banner ── */}
          {silenceAlert && !silenceAlert.dismissedAt && (
            <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-400">Audio Silence Detected</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  No transcript activity for {silenceAlert.seconds}s — the bot may have dropped or the speaker is muted.
                </p>
              </div>
              <button
                onClick={() => setSilenceAlert((a) => a ? { ...a, dismissedAt: Date.now() } : null)}
                className="text-xs font-semibold text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => { lastActivityRef.current = Date.now(); setSilenceAlert(null); toast.success("Bot reconnection triggered."); }}
                className="text-xs font-semibold text-white bg-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Reconnect Bot
              </button>
            </div>
          )}
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
              {/* Group by region */}
              {Array.from(new Set(DIAL_IN_NUMBERS.map(d => d.region))).map(region => (
                <div key={region}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">{region}</div>
                  <div className="space-y-2">
                    {DIAL_IN_NUMBERS.filter(d => d.region === region).map((d) => (
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
                </div>
              ))}
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
                  {[
                    { label: "English",    region: "Pan-Africa · UAE" },
                    { label: "French",     region: "West Africa · Mauritius" },
                    { label: "Arabic",     region: "North Africa · UAE" },
                    { label: "Portuguese", region: "Angola · Mozambique" },
                    { label: "Swahili",    region: "East Africa" },
                    { label: "Zulu",       region: "South Africa" },
                    { label: "Afrikaans",  region: "South Africa · Namibia" },
                    { label: "Hausa",      region: "Nigeria · West Africa" },
                    { label: "Amharic",    region: "Ethiopia" },
                    { label: "Mandarin",   region: "China · Pan-Africa" },
                    { label: "Hindi",      region: "Mauritius · UAE" },
                    { label: "Creole",     region: "Mauritius" },
                  ].map(({ label, region }) => (
                    <span key={label} title={region} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors">{label}</span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="font-semibold text-sm border-b border-border pb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Access & Security
                </div>

                {/* Current access code status */}
                <div className="flex items-center justify-between bg-background/60 border border-border rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Event Access Code</div>
                    <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {accessData?.requiresCode
                        ? <span className="text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Protected — attendees must enter a code to register</span>
                        : <span className="text-emerald-400 flex items-center gap-1"><Unlock className="w-3 h-3" /> Open — no access code required</span>
                      }
                    </div>
                  </div>
                  {accessData?.requiresCode && (
                    <button
                      onClick={() => setAccessCodeMutation.mutate({ eventId, accessCode: null })}
                      className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Remove Code
                    </button>
                  )}
                </div>

                {/* Set / update access code */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Set New Access Code</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showAccessCode ? "text" : "password"}
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value)}
                        placeholder="e.g. BOARD2026"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50 font-mono pr-10"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                      <button onClick={() => setShowAccessCode(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showAccessCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => setAccessCodeMutation.mutate({ eventId, accessCode: accessCodeInput })}
                      disabled={!accessCodeInput || setAccessCodeMutation.isPending}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {setAccessCodeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />} Set Code
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Attendees will be required to enter this code on the Registration page.</p>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-3" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          {/* ── Attendees ── */}
          {activeTab === "attendees" && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Registered Attendees</h2>
                  <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>All attendees who have registered for this event.</p>
                </div>
                <button onClick={() => refetchAttendees()} className="flex items-center gap-1.5 text-xs border border-border px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {attendeesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !attendeeList || attendeeList.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <div className="font-semibold mb-1">No registrations yet</div>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Attendees who register via the Registration page will appear here.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3 border-b border-border bg-background/40">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Language</span>
                    <span>Registered</span>
                  </div>
                  {attendeeList.map((a: { id: number; name: string; email: string; language: string; createdAt: Date }) => (
                    <div key={a.id} className="grid grid-cols-4 text-sm px-5 py-3.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <span className="font-medium truncate">{a.name}</span>
                      <span className="text-muted-foreground truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{a.email}</span>
                      <span className="text-muted-foreground">{a.language}</span>
                      <span className="text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-3">Registration Summary</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{attendeeList?.length ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Registered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">{attendeeList?.filter((a: { language: string }) => a.language === "English").length ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">English</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-400">{attendeeList ? attendeeList.length - attendeeList.filter((a: { language: string }) => a.language === "English").length : 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Other Languages</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ── White-Label Configuration ── */}
          {activeTab === "whitelabel" && (
            <div className="max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">White-Label Configuration</h2>
                  <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Customise the platform with your brand identity. Changes apply to all attendee-facing pages for this account.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWlPreviewMode("desktop")} className={`p-2 rounded-lg border transition-colors ${wlPreviewMode === "desktop" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button onClick={() => setWlPreviewMode("mobile")} className={`p-2 rounded-lg border transition-colors ${wlPreviewMode === "mobile" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* ── Left: Config Form ── */}
                <div className="space-y-5">
                  {/* Brand Identity */}
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="font-semibold text-sm border-b border-border pb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" /> Brand Identity
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Brand Name</label>
                      <input value={wlConfig.brandName} onChange={(e) => setWlConfig({ ...wlConfig, brandName: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                        style={{ fontFamily: "'Inter', sans-serif" }} placeholder="Investec Live" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Tagline</label>
                      <input value={wlConfig.tagline} onChange={(e) => setWlConfig({ ...wlConfig, tagline: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                        style={{ fontFamily: "'Inter', sans-serif" }} placeholder="Investor Intelligence, Live." />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Logo URL</label>
                      <input value={wlConfig.logoUrl} onChange={(e) => setWlConfig({ ...wlConfig, logoUrl: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50 font-mono"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} placeholder="https://cdn.example.com/logo.svg" />
                      <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>SVG or PNG, min 200×60px, transparent background recommended.</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Footer Text</label>
                      <input value={wlConfig.footerText} onChange={(e) => setWlConfig({ ...wlConfig, footerText: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                        style={{ fontFamily: "'Inter', sans-serif" }} placeholder="© 2026 Investec Group" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Show \"Powered by Chorus.AI\"</div>
                        <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Displayed in footer on all attendee pages</div>
                      </div>
                      <button onClick={() => setWlConfig({ ...wlConfig, showPoweredBy: !wlConfig.showPoweredBy })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${wlConfig.showPoweredBy ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${wlConfig.showPoweredBy ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Colour Palette */}
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="font-semibold text-sm border-b border-border pb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" /> Colour Palette
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Primary Colour</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={wlConfig.primaryColor} onChange={(e) => setWlConfig({ ...wlConfig, primaryColor: e.target.value })}
                            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                          <input value={wlConfig.primaryColor} onChange={(e) => setWlConfig({ ...wlConfig, primaryColor: e.target.value })}
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Accent Colour</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={wlConfig.accentColor} onChange={(e) => setWlConfig({ ...wlConfig, accentColor: e.target.value })}
                            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                          <input value={wlConfig.accentColor} onChange={(e) => setWlConfig({ ...wlConfig, accentColor: e.target.value })}
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { name: "Investec",       primary: "#004B87", accent: "#00A651" },
                        { name: "Standard Bank",  primary: "#1a1a2e", accent: "#0066cc" },
                        { name: "Nedbank",        primary: "#007A4D", accent: "#ffffff" },
                        { name: "Absa",           primary: "#DC143C", accent: "#ffffff" },
                        { name: "FirstRand",      primary: "#003087", accent: "#FFD700" },
                        { name: "JSE",            primary: "#1B2A4A", accent: "#E8B84B" },
                      ].map(preset => (
                        <button key={preset.name} onClick={() => setWlConfig({ ...wlConfig, primaryColor: preset.primary, accentColor: preset.accent })}
                          className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 text-xs hover:bg-secondary transition-colors">
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.primary }} />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom URL */}
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="font-semibold text-sm border-b border-border pb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> Custom URL
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Subdomain</label>
                      <div className="flex items-center gap-0">
                        <input value={wlConfig.subdomain} onChange={(e) => setWlConfig({ ...wlConfig, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                          className="flex-1 bg-background border border-border rounded-l-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }} placeholder="investec" />
                        <span className="bg-muted border border-l-0 border-border rounded-r-lg px-3 py-2.5 text-sm text-muted-foreground font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>.chorus.ai</span>
                      </div>
                      <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <CheckCircle className="w-3 h-3" /> {wlConfig.subdomain || "chorus"}.chorus.ai — available
                      </p>
                    </div>
                    <div className="bg-background/60 border border-border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Example URLs for this account:</div>
                      {["event/q4-earnings-2026", "register/investor-day-2026", "post-event/board-briefing"].map(path => (
                        <div key={path} className="text-xs font-mono text-primary mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          https://{wlConfig.subdomain || "chorus"}.chorus.ai/{path}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={() => { setWlSaved(true); toast.success("White-label configuration saved!"); setTimeout(() => setWlSaved(false), 3000); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                      {wlSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {wlSaved ? "Saved!" : "Save Configuration"}
                    </button>
                    <button onClick={() => setWlConfig({ brandName: "Chorus.AI", subdomain: "chorus", primaryColor: "#e63946", accentColor: "#ffffff", logoUrl: "", tagline: "The Intelligence Layer for Every Meeting", footerText: "Powered by Chorus.AI", showPoweredBy: true })}
                      className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>
                </div>

                {/* ── Right: Live Preview ── */}
                <div className="space-y-4">
                  <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview — {wlPreviewMode === "desktop" ? "Desktop" : "Mobile"}</div>
                  <div className={`border-2 border-border rounded-2xl overflow-hidden bg-zinc-950 transition-all ${wlPreviewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"}`}>
                    {/* Preview Header */}
                    <div className="border-b border-zinc-800 px-4 h-12 flex items-center justify-between" style={{ background: "#0a0a0a" }}>
                      <div className="flex items-center gap-2">
                        {wlConfig.logoUrl ? (
                          <img src={wlConfig.logoUrl} alt="Logo" className="h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: wlConfig.primaryColor }}>
                            {wlConfig.brandName.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-sm text-white">{wlConfig.brandName}</span>
                      </div>
                      <div className="w-20 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: wlConfig.primaryColor }}>
                        Live Event
                      </div>
                    </div>
                    {/* Preview Hero */}
                    <div className="px-4 py-6 text-center" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)" }}>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ color: wlConfig.primaryColor, borderColor: wlConfig.primaryColor + "40", background: wlConfig.primaryColor + "15" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: wlConfig.primaryColor }} /> Live Now
                      </div>
                      <div className="text-white font-bold text-sm mb-1">{wlConfig.brandName}</div>
                      <div className="text-zinc-400 text-xs mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{wlConfig.tagline}</div>
                      <button className="text-white text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: wlConfig.primaryColor }}>
                        Enter Event Room
                      </button>
                    </div>
                    {/* Preview Sentiment Bar */}
                    <div className="px-4 py-3 border-t border-zinc-800" style={{ background: "#0d0d0d" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Audience Sentiment</span>
                        <span className="text-[10px] font-bold" style={{ color: wlConfig.primaryColor }}>84%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: "84%", background: wlConfig.primaryColor }} />
                      </div>
                    </div>
                    {/* Preview Footer */}
                    <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between" style={{ background: "#080808" }}>
                      <span className="text-[10px] text-zinc-600" style={{ fontFamily: "'Inter', sans-serif" }}>{wlConfig.footerText}</span>
                      {wlConfig.showPoweredBy && (
                        <span className="text-[10px] text-zinc-600" style={{ fontFamily: "'Inter', sans-serif" }}>Powered by Chorus.AI</span>
                      )}
                    </div>
                  </div>
                  {/* URL Preview */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Your branded URL</div>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm font-mono text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>https://{wlConfig.subdomain || "chorus"}.chorus.ai</span>
                      <button onClick={() => handleCopy(`https://${wlConfig.subdomain || "chorus"}.chorus.ai`, "url")} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                        {copied === "url" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
