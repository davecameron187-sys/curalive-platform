import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Mic, MicOff, Users, Clock, Settings,
  Radio, Link2, Copy, CheckCheck, Trash2,
  Play, Square, Phone, Globe, BarChart3, MessageSquare,
  AlertCircle, CheckCircle, Loader2, Volume2, VolumeX,
  ExternalLink, Key, Webhook, RefreshCw, Lock, Unlock,
  Palette, Monitor, Smartphone, Save, ImageIcon,
  Activity, Wifi, WifiOff, Shield, Zap, ChevronRight,
  Eye, EyeOff, Bell, BellOff, TrendingUp, Signal,
  Layers, Terminal, Database, Hash, Check, X, MoreVertical,
  Headphones, Video, VideoOff, Maximize2, AlertTriangle,
  FileText, Download, RotateCcw, Info, Mail, LayoutDashboard
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import CustomisationPortal from "@/components/CustomisationPortal";

const EVENT_META: Record<string, { title: string; company: string; platform: string; date: string; time: string }> = {
  "q4-earnings-2026": { title: "Q4 2025 Earnings Call", company: "CuraLive Inc.", platform: "Zoom", date: "1 Mar 2026", time: "10:00 SAST" },
  "investor-day-2026": { title: "Annual Investor Day", company: "CuraLive Inc.", platform: "Microsoft Teams", date: "15 Mar 2026", time: "09:00 SAST" },
  "board-briefing": { title: "Board Strategy Briefing", company: "CuraLive Inc.", platform: "Webex", date: "28 Feb 2026", time: "14:00 SAST" },
};

type BotStatus = "disconnected" | "connecting" | "live" | "ended";
type Tab = "overview" | "connect" | "qa" | "dialin" | "rtmp" | "settings" | "attendees" | "customise";

type QAItem = { id: number; question: string; author: string; firm: string; votes: number; approved: boolean; dismissed: boolean; answered: boolean; flagged?: boolean };

const INITIAL_QA: QAItem[] = [
  { id: 1, question: "Can you provide more detail on the CuraLive revenue contribution in Q4?", author: "Sarah Chen", firm: "Goldman Sachs", votes: 47, approved: true, dismissed: false, answered: false },
  { id: 2, question: "What is the timeline for the native Microsoft Teams integration?", author: "James Okafor", firm: "JP Morgan", votes: 31, approved: true, dismissed: false, answered: false },
  { id: 3, question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Priya Naidoo", firm: "Morgan Stanley", votes: 28, approved: false, dismissed: false, answered: false },
  { id: 4, question: "Can you elaborate on the 40% engagement increase metric?", author: "Tom Barker", firm: "Barclays", votes: 19, approved: true, dismissed: false, answered: true },
  { id: 5, question: "What is the competitive moat against Zoom and Teams building similar features?", author: "Lena Fischer", firm: "UBS", votes: 15, approved: false, dismissed: false, answered: false },
  { id: 6, question: "What is your cash runway and expected burn rate for 2026?", author: "Anonymous", firm: "", votes: 3, approved: false, dismissed: false, answered: false, flagged: true },
];

const DIAL_IN_NUMBERS = [
  { country: "South Africa", flag: "🇿🇦", number: "+27 800 555 019", passcode: "847291#", region: "Southern Africa" },
  { country: "Nigeria", flag: "🇳🇬", number: "+234 800 555 019", passcode: "847291#", region: "West Africa" },
  { country: "Kenya", flag: "🇰🇪", number: "+254 800 555 019", passcode: "847291#", region: "East Africa" },
  { country: "Ghana", flag: "🇬🇭", number: "+233 800 555 019", passcode: "847291#", region: "West Africa" },
  { country: "Mauritius", flag: "🇲🇺", number: "+230 800 555 019", passcode: "847291#", region: "Mauritius" },
  { country: "UAE / Dubai", flag: "🇦🇪", number: "+971 800 555 019", passcode: "847291#", region: "Middle East" },
  { country: "Egypt", flag: "🇪🇬", number: "+20 800 555 019", passcode: "847291#", region: "North Africa" },
  { country: "United Kingdom", flag: "🇬🇧", number: "+44 800 555 0192", passcode: "847291#", region: "Europe" },
  { country: "United States", flag: "🇺🇸", number: "+1 (800) 555-0192", passcode: "847291#", region: "Americas" },
  { country: "China", flag: "🇨🇳", number: "+86 800 555 019", passcode: "847291#", region: "Asia" },
  { country: "India", flag: "🇮🇳", number: "+91 800 555 019", passcode: "847291#", region: "Asia" },
  { country: "Morocco", flag: "🇲🇦", number: "+212 800 555 019", passcode: "847291#", region: "North Africa" },
];

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "connect", label: "Connect Webcast", icon: Wifi },
  { id: "qa", label: "Q&A Queue", icon: MessageSquare, badge: 3 },
  { id: "attendees", label: "Attendees", icon: Users },
  { id: "dialin", label: "Dial-In Numbers", icon: Phone },
  { id: "rtmp", label: "RTMP / Stream Key", icon: Video },
  { id: "settings", label: "Event Settings", icon: Settings },
  { id: "customise", label: "Customise", icon: Palette },
];

function LiveDot({ pulse = true }: { pulse?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  );
}

function StatusPill({ status }: { status: BotStatus }) {
  const map = {
    disconnected: { bg: "bg-slate-800", text: "text-slate-400", dot: "bg-slate-500", label: "Disconnected" },
    connecting: { bg: "bg-amber-950/60", text: "text-amber-400", dot: "bg-amber-400 animate-pulse", label: "Connecting…" },
    live: { bg: "bg-emerald-950/60", text: "text-emerald-400", dot: "bg-emerald-400", label: "LIVE" },
    ended: { bg: "bg-slate-800", text: "text-slate-400", dot: "bg-slate-500", label: "Ended" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function MetricCard({ label, value, sub, accent = false, icon: Icon }: { label: string; value: string | number; sub?: string; accent?: boolean; icon: React.ElementType }) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${accent ? "bg-primary/5 border-primary/20" : "bg-[#0f1629] border-white/8"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-primary/15" : "bg-white/5"}`}>
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-slate-400"}`} />
      </div>
      <div className="min-w-0">
        <div className={`text-xl font-bold leading-none mb-0.5 ${accent ? "text-primary" : "text-white"}`}>{value}</div>
        <div className="text-[11px] text-slate-500 font-medium">{label}</div>
        {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function OperatorConsole() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const eventId = params.id ?? "q4-earnings-2026";
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [botStatus, setBotStatus] = useState<BotStatus>("disconnected");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [qaItems, setQaItems] = useState<QAItem[]>(INITIAL_QA);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [eventStarted, setEventStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [silenceAlert, setSilenceAlert] = useState<{ seconds: number } | null>(null);
  const [audioLevel] = useState(72);
  const [sentimentScore] = useState(78);
  const lastActivityRef = useRef<number>(Date.now());

  // White-label config
  const [wlConfig, setWlConfig] = useState({
    brandName: "CuraLive",
    subdomain: "curalive",
    primaryColor: "#e63946",
    logoUrl: "",
    tagline: "The Intelligence Layer for Every Meeting",
    showPoweredBy: true,
  });

  const { data: attendeeList, isLoading: attendeesLoading, refetch: refetchAttendees } = trpc.registrations.listByEvent.useQuery({ eventId });
  const { data: accessData, refetch: refetchAccess } = trpc.events.verifyAccess.useQuery({ eventId });
  const setAccessCodeMutation = trpc.events.setAccessCode.useMutation({
    onSuccess: (data: { success: boolean; message?: string; error?: string }) => {
      if (data.success) { toast.success("Access code updated!"); refetchAccess(); setAccessCodeInput(""); }
      else toast.error(data.error ?? "Failed");
    },
  });

  const rtmpKey = "evt_q4_2026_xK9mNpQ3";
  const rtmpUrl = `rtmp://ingest.curalive.cc/live/${rtmpKey}`;
  const webhookUrl = `https://curalive.cc/api/webhooks/recall`;

  // Silence detector
  useEffect(() => {
    if (botStatus !== "live") { setSilenceAlert(null); return; }
    const activityInterval = setInterval(() => {
      if (Math.random() > 0.3) lastActivityRef.current = Date.now();
    }, 5000);
    const silenceCheck = setInterval(() => {
      const silenceSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setSilenceAlert(silenceSec >= 10 ? { seconds: silenceSec } : null);
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
    toast.info("Dispatching CuraLive bot to meeting…");
    setTimeout(() => {
      setBotStatus("live");
      setEventStarted(true);
      toast.success("Bot joined — live transcription active.");
    }, 3000);
  };

  const handleDisconnect = () => {
    setBotStatus("ended");
    setEventStarted(false);
    toast.info("Bot disconnected. Generating AI summary…");
  };

  const pendingQ = qaItems.filter((q) => !q.approved && !q.dismissed && !q.answered);
  const approvedQ = qaItems.filter((q) => q.approved && !q.answered);
  const answeredQ = qaItems.filter((q) => q.answered);

  const approveQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, approved: true } : q));
  const dismissQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, dismissed: true } : q));
  const answerQ = (id: number) => setQaItems((items) => items.map((q) => q.id === id ? { ...q, answered: true } : q));

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Top Command Bar ── */}
      <header className="h-12 border-b border-white/8 bg-[#06080f]/95 backdrop-blur-md flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-30">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-xs font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Events
        </button>
        <span className="text-white/20">|</span>

        {/* Event identity */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white truncate">{meta.title}</span>
          <span className="text-slate-600 text-xs hidden sm:block">{meta.company}</span>
          <span className="text-slate-700 text-xs hidden md:block">·</span>
          <span className="text-slate-600 text-xs hidden md:block">{meta.date} · {meta.time}</span>
        </div>

        {/* Status cluster */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {botStatus === "live" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3 h-3" />
              {formatTime(elapsedSeconds)}
            </div>
          )}
          <StatusPill status={botStatus} />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{attendeeList?.length ?? 1247}</span>
          </div>
          <button onClick={() => navigate("/operator/dashboard")} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/8">
            <LayoutDashboard className="w-3 h-3" /> Dashboard
          </button>
          <button onClick={() => navigate(`/event/${eventId}`)} className="flex items-center gap-1.5 text-xs font-semibold bg-white/8 hover:bg-white/12 border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors">
            <ExternalLink className="w-3 h-3" /> Event Room
          </button>
        </div>
      </header>

      {/* ── Silence Alert Banner ── */}
      {silenceAlert && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-amber-300 font-semibold">Audio silence detected — {silenceAlert.seconds}s with no transcript activity.</span>
          <button onClick={() => setSilenceAlert(null)} className="ml-auto text-amber-500 hover:text-amber-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <nav className="w-52 flex-shrink-0 border-r border-white/8 bg-[#080c18] flex flex-col">
          <div className="flex-1 py-3 space-y-0.5 px-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === id
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge !== undefined && (
                  <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Sidebar footer — quick actions */}
          <div className="border-t border-white/8 p-3 space-y-2">
            {botStatus === "disconnected" || botStatus === "ended" ? (
              <button
                onClick={() => setActiveTab("connect")}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Wifi className="w-3.5 h-3.5" /> Connect Bot
              </button>
            ) : botStatus === "connecting" ? (
              <button disabled className="w-full flex items-center justify-center gap-2 bg-amber-600/30 text-amber-400 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 bg-red-950/60 text-red-400 border border-red-500/20 text-xs font-bold py-2 rounded-lg hover:bg-red-950 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> End Event
              </button>
            )}
            <button
              onClick={() => { setIsMuted(!isMuted); toast.info(isMuted ? "Audio monitoring on" : "Audio monitoring muted"); }}
              className={`w-full flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                isMuted ? "border-red-500/30 text-red-400 bg-red-950/30" : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isMuted ? <><VolumeX className="w-3.5 h-3.5" /> Muted</> : <><Volume2 className="w-3.5 h-3.5" /> Monitor On</>}
            </button>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="p-6 space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Event Overview</h2>
                <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Real-time health and status for <span className="text-slate-300 font-medium">{meta.title}</span>.
                </p>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard icon={Users} label="Live Attendees" value={attendeeList?.length ?? 1247} sub="Registered & joined" accent />
                <MetricCard icon={MessageSquare} label="Q&A Pending" value={pendingQ.length} sub={`${approvedQ.length} approved`} />
                <MetricCard icon={TrendingUp} label="Sentiment Score" value={`${sentimentScore}%`} sub="Positive tone" />
                <MetricCard icon={Clock} label="Duration" value={eventStarted ? formatTime(elapsedSeconds) : "—"} sub={eventStarted ? "Elapsed" : "Not started"} />
              </div>

              {/* Signal health */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Signal Health</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Bot Connection", value: botStatus === "live" ? "Connected" : "Offline", ok: botStatus === "live", icon: Wifi },
                    { label: "Audio Feed", value: botStatus === "live" ? `${audioLevel}% level` : "No signal", ok: botStatus === "live" && !isMuted, icon: Mic },
                    { label: "Transcription", value: botStatus === "live" ? "Active" : "Idle", ok: botStatus === "live", icon: FileText },
                    { label: "AI Analysis", value: botStatus === "live" ? "Running" : "Standby", ok: botStatus === "live", icon: Activity },
                  ].map(({ label, value, ok, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-950/60" : "bg-white/5"}`}>
                        <Icon className={`w-4 h-4 ${ok ? "text-emerald-400" : "text-slate-600"}`} />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${ok ? "text-emerald-400" : "text-slate-500"}`}>{value}</div>
                        <div className="text-[10px] text-slate-600">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Q&A preview */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Top Pending Questions</div>
                  <button onClick={() => setActiveTab("qa")} className="text-xs text-primary hover:opacity-80 transition-opacity font-semibold">
                    Manage Q&A →
                  </button>
                </div>
                {pendingQ.length === 0 ? (
                  <div className="text-sm text-slate-600 py-4 text-center">No pending questions</div>
                ) : (
                  <div className="space-y-2">
                    {pendingQ.slice(0, 3).map((q) => (
                      <div key={q.id} className="flex items-start gap-3 bg-white/[0.03] rounded-lg px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 leading-snug truncate">{q.question}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{q.author} · {q.firm} · {q.votes} votes</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => approveQ(q.id)} className="text-emerald-400 hover:bg-emerald-950/60 p-1.5 rounded transition-colors" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => dismissQ(q.id)} className="text-red-400 hover:bg-red-950/60 p-1.5 rounded transition-colors" title="Dismiss">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Event Details</div>
                  <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {[
                      ["Platform", meta.platform],
                      ["Date", meta.date],
                      ["Time", meta.time],
                      ["Event ID", eventId],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-slate-300 font-medium font-mono text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Actions</div>
                  <div className="space-y-2">
                    {[
                      { label: "Open Event Room", action: () => navigate(`/event/${eventId}`), icon: ExternalLink },
                      { label: "Open Moderator Console", action: () => navigate(`/moderator/${eventId}`), icon: Radio },
                      { label: "Open Presenter View", action: () => navigate(`/presenter/${eventId}`), icon: Monitor },
                      { label: "View Post-Event Report", action: () => navigate(`/post-event/${eventId}`), icon: FileText },
                      { label: "Mailing List Manager", action: () => navigate("/mailing-lists"), icon: Mail },
                    ].map(({ label, action, icon: Icon }) => (
                      <button key={label} onClick={action} className="w-full flex items-center gap-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-all text-left">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONNECT WEBCAST ── */}
          {activeTab === "connect" && (
            <div className="p-6 max-w-2xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Connect Webcast</h2>
                <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Paste the meeting URL. CuraLive dispatches a silent bot that joins as a participant and begins live transcription.
                </p>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold">Recall.ai Universal Connector</span>
                  </div>
                  <StatusPill status={botStatus} />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Meeting URL</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://zoom.us/j/123456789 or https://teams.microsoft.com/…"
                    disabled={botStatus === "live" || botStatus === "connecting"}
                    className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 disabled:opacity-50 font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {["Zoom", "Teams", "Webex", "Google Meet", "Slack Huddles", "GoTo Meeting"].map((p) => (
                    <span key={p} className="text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded">{p}</span>
                  ))}
                </div>

                {botStatus === "disconnected" || botStatus === "ended" ? (
                  <button onClick={handleConnect} className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                    <Zap className="w-4 h-4" /> Connect AI Bot
                  </button>
                ) : botStatus === "connecting" ? (
                  <button disabled className="w-full flex items-center justify-center gap-2 bg-amber-600/20 text-amber-400 font-bold py-2.5 rounded-lg cursor-not-allowed">
                    <Loader2 className="w-4 h-4 animate-spin" /> Joining meeting…
                  </button>
                ) : (
                  <button onClick={handleDisconnect} className="w-full flex items-center justify-center gap-2 bg-red-950/50 border border-red-500/20 text-red-400 font-bold py-2.5 rounded-lg hover:bg-red-950 transition-colors">
                    <Square className="w-4 h-4" /> Disconnect Bot
                  </button>
                )}
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Webhook className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold">Webhook Endpoint</span>
                </div>
                <p className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>Recall.ai posts real-time transcript events to this URL. Must respond 200 within 5s.</p>
                <div className="flex items-center gap-2 bg-[#06080f] border border-white/10 rounded-lg px-3 py-2">
                  <span className="flex-1 font-mono text-xs text-slate-400">{webhookUrl}</span>
                  <button onClick={() => handleCopy(webhookUrl, "webhook")} className="text-slate-500 hover:text-white transition-colors">
                    {copied === "webhook" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["bot.joining_call", "bot.in_call_recording", "transcript.data", "bot.call_ended"].map((e) => (
                    <div key={e} className="text-[11px] font-mono text-slate-500 bg-white/[0.03] rounded px-2.5 py-1.5">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Q&A QUEUE ── */}
          {activeTab === "qa" && (
            <div className="p-6 space-y-5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Q&A Queue</h2>
                  <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Review, approve, or dismiss questions before they appear in the moderator queue.
                  </p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="bg-amber-950/60 text-amber-400 px-2.5 py-1 rounded-full">{pendingQ.length} pending</span>
                  <span className="bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-full">{approvedQ.length} approved</span>
                  <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">{answeredQ.length} answered</span>
                </div>
              </div>

              {/* Pending */}
              {pendingQ.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Pending Review</div>
                  <div className="space-y-2">
                    {pendingQ.map((q) => (
                      <div key={q.id} className={`bg-[#0f1629] border rounded-xl px-4 py-3.5 ${q.flagged ? "border-red-500/30" : "border-white/8"}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {q.flagged && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 mb-1.5">
                                <AlertTriangle className="w-3 h-3" /> Flagged — potentially price-sensitive
                              </div>
                            )}
                            <p className="text-sm text-slate-200 leading-snug mb-1.5">{q.question}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-400">{q.author}</span>
                              {q.firm && <span>{q.firm}</span>}
                              <span>↑ {q.votes} votes</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => approveQ(q.id)} className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950 transition-colors">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => dismissQ(q.id)} className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-950/50 border border-red-500/20 px-2.5 py-1.5 rounded-lg hover:bg-red-950 transition-colors">
                              <X className="w-3 h-3" /> Dismiss
                            </button>
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
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Approved — In Moderator Queue</div>
                  <div className="space-y-2">
                    {approvedQ.map((q) => (
                      <div key={q.id} className="bg-emerald-950/10 border border-emerald-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 leading-snug">{q.question}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{q.author} · {q.firm}</p>
                        </div>
                        <button onClick={() => answerQ(q.id)} className="text-xs font-semibold text-slate-400 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
                          Mark Answered
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answered */}
              {answeredQ.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Answered</div>
                  <div className="space-y-1.5">
                    {answeredQ.map((q) => (
                      <div key={q.id} className="bg-white/[0.02] border border-white/5 rounded-lg px-4 py-2.5 flex items-center gap-3">
                        <Hash className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                        <p className="text-xs text-slate-600 flex-1 truncate">{q.question}</p>
                        <span className="text-[10px] text-slate-700 flex-shrink-0">{q.author}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ATTENDEES ── */}
          {activeTab === "attendees" && (
            <div className="p-6 max-w-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Attendees</h2>
                  <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Registered participants from the database.</p>
                </div>
                <button onClick={() => refetchAttendees()} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {attendeesLoading ? (
                <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading attendees…
                </div>
              ) : !attendeeList || attendeeList.length === 0 ? (
                <div className="bg-[#0f1629] border border-white/8 rounded-xl p-10 text-center">
                  <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No registered attendees yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Share the event link to start collecting registrations.</p>
                </div>
              ) : (
                <div className="bg-[#0f1629] border border-white/8 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 px-4 py-2 border-b border-white/8 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    <span>Name</span><span>Company</span><span>Email</span><span>Joined</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {attendeeList.map((a: { id: number; name: string; company?: string | null; email: string; joinedAt?: string | Date | null }) => (
                      <div key={a.id} className="grid grid-cols-4 px-4 py-3 text-sm hover:bg-white/[0.02] transition-colors">
                        <span className="text-slate-300 font-medium truncate">{a.name}</span>
                        <span className="text-slate-500 truncate">{a.company ?? "—"}</span>
                        <span className="text-slate-500 font-mono text-xs truncate">{a.email}</span>
                        <span className="text-slate-600 text-xs">{a.joinedAt ? new Date(a.joinedAt).toLocaleTimeString() : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DIAL-IN ── */}
          {activeTab === "dialin" && (
            <div className="p-6 max-w-3xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Dial-In Numbers</h2>
                <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  PSTN dial-in via Twilio Voice. All numbers share passcode <span className="font-mono text-slate-300">847291#</span>.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {DIAL_IN_NUMBERS.map((d) => (
                  <div key={d.country} className="bg-[#0f1629] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{d.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200">{d.country}</div>
                      <div className="font-mono text-xs text-slate-400">{d.number}</div>
                    </div>
                    <button onClick={() => handleCopy(`${d.number} Passcode: ${d.passcode}`, d.country)} className="text-slate-600 hover:text-white transition-colors flex-shrink-0">
                      {copied === d.country ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="text-slate-500">Transcription</div><div className="text-emerald-400 font-semibold">✓ Included via Whisper</div>
                <div className="text-slate-500">Countries covered</div><div className="text-slate-300 font-semibold">180+</div>
              </div>
            </div>
          )}

          {/* ── RTMP ── */}
          {activeTab === "rtmp" && (
            <div className="p-6 max-w-2xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">RTMP Ingest</h2>
                <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  For professional studio productions using OBS, vMix, Wirecast, or hardware encoders.
                </p>
              </div>
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5 space-y-4">
                {[
                  { label: "RTMP Ingest URL", value: rtmpUrl, key: "rtmp" },
                  { label: "Stream Key", value: rtmpKey, key: "key" },
                ].map(({ label, value, key }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">{label}</label>
                    <div className="flex items-center gap-2 bg-[#06080f] border border-white/10 rounded-lg px-3 py-2.5">
                      <span className="flex-1 font-mono text-xs text-slate-400 truncate">{value}</span>
                      <button onClick={() => handleCopy(value, key)} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                        {copied === key ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {key === "key" && (
                        <button onClick={() => toast.info("Stream key regenerated")} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">OBS Studio Setup</div>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[["Service", "Custom…"], ["Server", "rtmp://ingest.curalive.cc/live"], ["Stream Key", rtmpKey], ["Audio Bitrate", "128 kbps (mono)"], ["Video Bitrate", "2500–4000 kbps"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-xs text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Supported Encoders</div>
                <div className="flex flex-wrap gap-2">
                  {["OBS Studio", "vMix", "Wirecast", "Livestream Studio", "XSplit", "Teradek", "LiveU"].map((e) => (
                    <span key={e} className="bg-white/5 border border-white/10 text-slate-400 text-xs px-2.5 py-1 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="p-6 max-w-2xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Event Settings</h2>
                <p className="text-slate-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Configure AI features, languages, and access controls.</p>
              </div>

              {/* AI Toggles */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/8 pb-3 mb-1">AI Features</div>
                {[
                  { label: "Live Transcription", desc: "Real-time speech-to-text via Whisper", on: true },
                  { label: "Sentiment Analysis", desc: "AI monitors tone every 30 seconds", on: true },
                  { label: "Auto-Translation", desc: "Participants choose their language", on: true },
                  { label: "Smart Q&A Prioritization", desc: "AI ranks questions by relevance", on: true },
                  { label: "Executive Summary", desc: "AI summary generated after event ends", on: true },
                  { label: "Live Chat", desc: "Real-time chat between attendees", on: false },
                ].map(({ label, desc, on }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-sm font-medium text-slate-300">{label}</div>
                      <div className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                    </div>
                    <button
                      onClick={() => toast.info(`${label} ${on ? "disabled" : "enabled"}`)}
                      className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-white/10"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Languages */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Transcription Languages</div>
                <div className="flex flex-wrap gap-2">
                  {["English", "French", "Arabic", "Portuguese", "Swahili", "Zulu", "Afrikaans", "Hausa", "Amharic", "Mandarin", "Hindi", "Creole"].map((lang) => (
                    <span key={lang} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors">{lang}</span>
                  ))}
                </div>
              </div>

              {/* Access Code */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/8 pb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Access & Security
                </div>
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/8 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-300">Event Access Code</div>
                    <div className="text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {accessData?.requiresCode
                        ? <span className="text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Protected</span>
                        : <span className="text-emerald-400 flex items-center gap-1"><Unlock className="w-3 h-3" /> Open — no code required</span>}
                    </div>
                  </div>
                  {accessData?.requiresCode && (
                    <button onClick={() => setAccessCodeMutation.mutate({ eventId, accessCode: null })} className="text-xs text-red-400 border border-red-500/20 bg-red-950/30 px-3 py-1.5 rounded-lg hover:bg-red-950/60 transition-colors">
                      Remove Code
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showAccessCode ? "text" : "password"}
                      value={accessCodeInput}
                      onChange={(e) => setAccessCodeInput(e.target.value)}
                      placeholder="Set new access code…"
                      className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 pr-9"
                    />
                    <button onClick={() => setShowAccessCode(!showAccessCode)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                      {showAccessCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => { if (accessCodeInput.trim()) setAccessCodeMutation.mutate({ eventId, accessCode: accessCodeInput.trim() }); }}
                    disabled={!accessCodeInput.trim() || setAccessCodeMutation.isPending}
                    className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {setAccessCodeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── WHITE-LABEL ── */}
          {activeTab === "customise" && (
            <CustomisationPortal eventId={eventId} />
          )}

        </main>
      </div>
    </div>
  );
}
