// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Activity, AlertTriangle, CheckCircle2,
  Clock, Loader2, Eye, BarChart3, MessageSquare, Zap,
  TrendingUp, TrendingDown, Minus, Play, Square,
  Building2, Lock, FileText, Users, Radio,
  Layers, ChevronRight, Star, Award, Handshake,
  Brain, Scale, Target, LineChart, Briefcase,
} from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "meet", label: "Google Meet" },
  { value: "webex", label: "Cisco Webex" },
  { value: "webphone", label: "Webphone" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "agm", label: "AGM" },
  { value: "investor_day", label: "Investor Day" },
  { value: "roadshow", label: "Roadshow" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "special_call", label: "Special Call" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", agm: "AGM", investor_day: "Investor Day",
  roadshow: "Roadshow", capital_markets_day: "Capital Markets Day",
  special_call: "Special Call", other: "Other",
};

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", webphone: "Webphone", other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",    color: "text-slate-400 bg-slate-400/10 border-slate-400/20",  dot: "bg-slate-400",                icon: Clock },
  bot_joining: { label: "Joining",    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",  dot: "bg-amber-400 animate-pulse",  icon: Loader2 },
  live:        { label: "Live",       color: "text-amber-400 bg-amber-400/10 border-amber-400/20",  dot: "bg-amber-400 animate-pulse",  icon: Radio },
  processing:  { label: "Processing", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",     dot: "bg-blue-400 animate-pulse",   icon: Loader2 },
  completed:   { label: "Completed",  color: "text-violet-400 bg-violet-400/10 border-violet-400/20", dot: "bg-violet-400",             icon: CheckCircle2 },
  failed:      { label: "Failed",     color: "text-red-400 bg-red-400/10 border-red-400/20",        dot: "bg-red-400",                  icon: AlertTriangle },
};

const PACKAGE_FEATURES = [
  {
    icon: Activity,
    title: "Earnings Sentiment Decoder",
    desc: "Detects management spin by comparing tone vs substance. Identifies disconnect between optimistic framing and actual results.",
    tag: "AI",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: LineChart,
    title: "Forward Guidance Tracker",
    desc: "Captures every forward-looking statement, scores confidence, and cross-references against prior quarter guidance. Tracks raised, lowered, and missed targets.",
    tag: "Tracking",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: MessageSquare,
    title: "Analyst Question Intelligence",
    desc: "Identifies analysts by name and firm, categorises questions by theme, and flags hostile or confrontational questioning patterns.",
    tag: "Real-time",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: Shield,
    title: "Management Credibility Scorer",
    desc: "Cross-quarter consistency analysis. Detects moved goalposts, contradictions, and systematic patterns of unreliable guidance.",
    tag: "Risk",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    icon: Zap,
    title: "Market-Moving Statement Detector",
    desc: "Real-time flagging of statements likely to impact share price — earnings surprises, M&A, restructuring, leadership changes.",
    tag: "Critical",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Briefcase,
    title: "Investment Brief Generator",
    desc: "Autonomous post-event report for portfolio managers: executive summary, thesis update, key takeaways, recommendation, and risk factors.",
    tag: "Automated",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: BarChart3,
    title: "Cross-Quarter Benchmarks",
    desc: "Track management credibility, sentiment, and guidance accuracy across multiple events for the same company.",
    tag: "Data",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
  },
  {
    icon: FileText,
    title: "Post-Event Intelligence Report",
    desc: "Board-ready 12-section intelligence report generated automatically after each event — ready within minutes of close.",
    tag: "Report",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    border: "border-teal-400/20",
  },
  {
    icon: Brain,
    title: "Self-Evolving AI Engine",
    desc: "Every event makes the system smarter. Algorithms feed observations into Module M — CuraLive's self-evolving intelligence core.",
    tag: "Module M",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
  {
    icon: Target,
    title: "Client Live Dashboard",
    desc: "Shareable real-time dashboard for IR teams — no login required. Shows sentiment, guidance tracking, and analyst activity.",
    tag: "Live",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
];

function SentimentBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-600 text-sm">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-red-500";
  const textColor = pct >= 70 ? "text-emerald-400" : pct >= 45 ? "text-amber-400" : "text-red-400";
  const Icon = pct >= 70 ? TrendingUp : pct >= 45 ? Minus : TrendingDown;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${textColor}`}>
        <Icon className="w-3 h-3" />{pct}%
      </span>
    </div>
  );
}

export default function BastionPartner() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"package" | "sessions" | "bookings">("package");
  const [form, setForm] = useState({
    clientName: "Bastion Capital",
    eventName: "",
    eventType: "earnings_call" as const,
    platform: "zoom" as const,
    meetingUrl: "",
    notes: "",
  });

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    eventTitle: "",
    eventType: "earnings_call" as const,
    eventDate: "",
    eventTime: "",
    sector: "",
    ticker: "",
    expectedAttendees: "",
    meetingUrl: "",
    platform: "zoom" as const,
    contactName: "",
    contactEmail: "" as string,
    bastionReference: "",
    confirmationRecipients: "",
    notes: "",
  });

  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 5000 });
  const activeSession = trpc.shadowMode.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: activeSessionId != null, refetchInterval: 3000 }
  );

  const [deployingBookingId, setDeployingBookingId] = useState<number | null>(null);

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success("Investor Intelligence deployed — 6 algorithms activated");
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      setActiveTab("sessions");
      sessions.refetch();

      if (deployingBookingId) {
        linkSessionsMut.mutate({
          bookingId: deployingBookingId,
          shadowSessionId: data.sessionId,
          bastionSessionId: null,
        });
        setDeployingBookingId(null);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: () => {
      toast.success("Session ended — intelligence records written");
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.eventName.trim() || !form.meetingUrl.trim()) {
      toast.error("Event name and meeting URL are required");
      return;
    }
    startSession.mutate({
      ...form,
      webhookBaseUrl: window.location.origin,
    });
  };

  const session = activeSession.data;
  const isSessionLive = session?.status === "live" || session?.status === "bot_joining";

  const bookings = trpc.bastionBooking.list.useQuery(undefined, { refetchInterval: 8000 });
  const selectedBooking = trpc.bastionBooking.getById.useQuery(
    { id: selectedBookingId! },
    { enabled: selectedBookingId != null, refetchInterval: 5000 }
  );

  const createBookingMut = trpc.bastionBooking.create.useMutation({
    onSuccess: (data) => {
      toast.success("Booking created — dashboard link generated");
      setShowBookingForm(false);
      setSelectedBookingId(data.bookingId);
      bookings.refetch();
      setBookingForm({ clientName: "", eventTitle: "", eventType: "earnings_call", eventDate: "", eventTime: "", sector: "", ticker: "", expectedAttendees: "", meetingUrl: "", platform: "zoom", contactName: "", contactEmail: "", bastionReference: "", confirmationRecipients: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateBookingMut = trpc.bastionBooking.update.useMutation({
    onSuccess: () => { toast.success("Booking updated"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const runChecklistMut = trpc.bastionBooking.runChecklist.useMutation({
    onSuccess: () => { toast.success("Checklist evaluated"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const linkSessionsMut = trpc.bastionBooking.linkSessions.useMutation({
    onSuccess: () => { toast.success("Sessions linked — booking is live"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const completeBookingMut = trpc.bastionBooking.complete.useMutation({
    onSuccess: () => { toast.success("Booking completed"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sendConfirmationMut = trpc.bastionBooking.sendConfirmation.useMutation({
    onSuccess: (data) => {
      toast.success(`Booking confirmation sent to ${data.recipientCount} recipient(s)`);
      bookings.refetch();
      selectedBooking.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.clientName.trim() || !bookingForm.eventTitle.trim()) {
      toast.error("Client name and event title are required");
      return;
    }
    createBookingMut.mutate({
      ...bookingForm,
      expectedAttendees: bookingForm.expectedAttendees ? parseInt(bookingForm.expectedAttendees) : undefined,
      contactEmail: bookingForm.contactEmail || undefined,
    } as any);
  };

  const handleDeployFromBooking = () => {
    const bk = selectedBooking.data;
    if (!bk?.meetingUrl) { toast.error("Set a meeting URL before deploying"); return; }
    setDeployingBookingId(bk.id);
    const platformMap: Record<string, string> = { zoom: "zoom", teams: "teams", meet: "meet", webex: "webex", webphone: "other", other: "other" };
    startSession.mutate({
      clientName: bk.clientName,
      eventName: bk.eventTitle,
      eventType: bk.eventType ?? "earnings_call",
      platform: (platformMap[bk.platform] ?? "other") as any,
      meetingUrl: bk.meetingUrl,
      notes: bk.notes ?? "",
      webhookBaseUrl: window.location.origin,
    });
  };

  const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    booked: { label: "Booked", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", icon: Clock },
    setup: { label: "Setup", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Layers },
    ready: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
    live: { label: "Live", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: Radio },
    completed: { label: "Completed", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/20", icon: Square },
  };

  const getDashboardUrl = (token: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/live/${token}`;
  };

  const copyDashboardLink = (token: string) => {
    navigator.clipboard.writeText(getDashboardUrl(token));
    toast.success("Dashboard link copied to clipboard");
  };

  const allSessions = sessions.data ?? [];
  const liveSessions = allSessions.filter(s => s.status === "live" || s.status === "bot_joining").length;
  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter(s => s.status === "completed").length;
  const avgSentiment = allSessions.filter(s => s.sentimentAvg != null).length > 0
    ? allSessions.reduce((sum, s) => sum + (s.sentimentAvg ?? 0), 0) / allSessions.filter(s => s.sentimentAvg != null).length
    : null;

  return (
    <div className="min-h-screen bg-[#060a10] text-white">

      <div className="border-b border-white/[0.06] bg-[#060a10]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">Bastion Capital Partners</h1>
                  <span className="text-[10px] font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase">Partner Integration</span>
                </div>
                <p className="text-xs text-slate-500">CuraLive investor intelligence for institutional investor events</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveSessions > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {liveSessions} active
              </div>
            )}
            <Button
              onClick={() => { setShowForm(true); setActiveTab("sessions"); }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm h-9 px-4 gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Run Intelligence
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-white/[0.04]">
          {[
            { id: "package", label: "Integration Package" },
            { id: "bookings", label: "Booking Pipeline" },
            { id: "sessions", label: "Live Sessions" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/[0.02] border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Bastion Capital Partners</h2>
                  <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Strategic Partner
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Institutional investment intelligence for earnings calls, investor days, roadshows, and capital markets events. CuraLive provides the AI intelligence layer — management tone analysis, forward guidance tracking, analyst question intelligence, credibility scoring, and autonomous investment briefs — directly on top of every Bastion-managed investor event.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Focus", value: "Investor Events" },
                    { label: "Algorithms", value: "6 Active" },
                    { label: "Coverage", value: "All Sectors" },
                    { label: "Intelligence", value: "Self-Evolving" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-medium mb-1">{label}</div>
                      <div className="text-sm font-bold text-slate-200">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {[
              { icon: Radio, label: "Sessions Run", value: totalSessions, color: "text-amber-400" },
              { icon: Activity, label: "Avg Sentiment", value: avgSentiment != null ? `${Math.round(avgSentiment * 100)}%` : "—", color: "text-emerald-400" },
              { icon: CheckCircle2, label: "Completed", value: completedSessions, color: "text-violet-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {activeTab === "package" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Handshake className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-white">CuraLive × Bastion Capital — Investor Intelligence Package</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PACKAGE_FEATURES.map(({ icon: Icon, title, desc, tag, color, bg, border }) => (
                <div key={title} className={`bg-white/[0.02] border ${border} rounded-2xl p-5 flex flex-col gap-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${color}`} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide uppercase ${color} ${bg} border ${border} px-2 py-0.5 rounded-full`}>{tag}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                How the integration works
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {[
                  {
                    step: "1",
                    title: "Bastion coordinates the event",
                    desc: "Earnings call, investor day, roadshow, or capital markets event managed by Bastion Capital Partners for their institutional clients.",
                    color: "border-amber-400/30",
                    dot: "bg-amber-400",
                  },
                  {
                    step: "2",
                    title: "CuraLive joins silently",
                    desc: "CuraLive Intelligence bot joins via Recall.ai as a silent observer. 6 investor-focused algorithms begin processing in real time.",
                    color: "border-violet-400/30",
                    dot: "bg-violet-400",
                  },
                  {
                    step: "3",
                    title: "Intelligence delivered",
                    desc: "Management tone, guidance tracking, analyst Q&A analysis, credibility scoring, market-moving alerts, and investment briefs — all delivered automatically.",
                    color: "border-emerald-400/30",
                    dot: "bg-emerald-400",
                  },
                ].map(({ step, title, desc, color, dot }, i) => (
                  <div key={step} className="flex items-start gap-0">
                    <div className={`flex-1 border ${color} rounded-2xl p-5 bg-white/[0.015]`}>
                      <div className={`w-6 h-6 rounded-full ${dot} text-black text-xs font-bold flex items-center justify-center mb-3`}>{step}</div>
                      <h5 className="text-sm font-semibold text-white mb-1">{title}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                    {i < 2 && (
                      <div className="flex items-center px-2 pt-8">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Investor Intelligence AI</h4>
                    <p className="text-[11px] text-slate-500">6 Self-Evolving Algorithms — Institutional Grade</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Purpose-built for institutional investor events: autonomous algorithms that decode management sentiment, track forward guidance, analyse analyst questioning patterns, score management credibility, detect market-moving statements, and generate portfolio-manager-ready investment briefs. Every event makes the system smarter through self-evolving intelligence fed into CuraLive's AI Evolution Engine (Module M).
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Activity, name: "Earnings Sentiment", desc: "Tone vs substance analysis — detects management spin and overpromising", color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/10" },
                  { icon: LineChart, name: "Guidance Tracker", desc: "Cross-quarter guidance monitoring with raised/lowered/missed tracking", color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
                  { icon: MessageSquare, name: "Analyst Q&A Intel", desc: "Analyst identification, question categorisation, hostility detection", color: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/10" },
                  { icon: Shield, name: "Credibility Scorer", desc: "Cross-quarter management consistency and moved goalpost detection", color: "text-red-400", border: "border-red-400/20", bg: "bg-red-400/10" },
                  { icon: Zap, name: "Market-Moving Detector", desc: "Flags statements likely to impact share price with impact severity", color: "text-amber-400", border: "border-amber-400/20", bg: "bg-amber-400/10" },
                  { icon: Briefcase, name: "Investment Brief", desc: "Autonomous PM-ready post-event reports with recommendation and risks", color: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/10" },
                ].map(({ icon: Icon, name, desc, color, border, bg }) => (
                  <div key={name} className={`bg-white/[0.015] border ${border} rounded-xl p-3.5`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${color}`} />
                      </div>
                      <span className="text-xs font-semibold text-white">{name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <Brain className="w-3 h-3 text-amber-400" />
                <span>Self-evolving: all 6 algorithms feed observations into the AI Evolution Engine (Module M) after every event</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => { setShowForm(true); setActiveTab("sessions"); }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 px-6"
              >
                <Play className="w-4 h-4" />
                Run Intelligence on an Investor Event
              </Button>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Booking Pipeline
              </h3>
              <Button
                onClick={() => setShowBookingForm(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 text-xs"
                size="sm"
              >
                <Play className="w-3.5 h-3.5" />
                New Booking
              </Button>
            </div>

            {(() => {
              const allBookings = bookings.data ?? [];
              const stages = ["booked", "setup", "ready", "live", "completed"];
              return (
                <div className="grid grid-cols-5 gap-2">
                  {stages.map(stage => {
                    const cfg = BOOKING_STATUS_CONFIG[stage];
                    const count = allBookings.filter(b => b.status === stage).length;
                    const StageIcon = cfg?.icon ?? Clock;
                    return (
                      <div key={stage} className={`bg-white/[0.02] border ${cfg?.bg ?? ""} rounded-xl p-3 text-center`}>
                        <StageIcon className={`w-4 h-4 ${cfg?.color ?? "text-slate-400"} mx-auto mb-1`} />
                        <div className={`text-lg font-bold ${cfg?.color ?? "text-slate-400"}`}>{count}</div>
                        <div className="text-[10px] text-slate-500">{cfg?.label ?? stage}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {showBookingForm && (
              <div className="bg-white/[0.02] border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">New Bastion Investor Event Booking</h3>
                  </div>
                  <button onClick={() => setShowBookingForm(false)} className="text-slate-500 hover:text-slate-300 text-xs">Cancel</button>
                </div>
                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Client / Company *</label>
                      <input value={bookingForm.clientName} onChange={e => setBookingForm(f => ({ ...f, clientName: e.target.value }))} placeholder="e.g. Anglo American" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Title *</label>
                      <input value={bookingForm.eventTitle} onChange={e => setBookingForm(f => ({ ...f, eventTitle: e.target.value }))} placeholder="e.g. Anglo American Q1 2026 Earnings" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Type</label>
                      <select value={bookingForm.eventType} onChange={e => setBookingForm(f => ({ ...f, eventType: e.target.value as any }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
                        {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Sector</label>
                      <input value={bookingForm.sector} onChange={e => setBookingForm(f => ({ ...f, sector: e.target.value }))} placeholder="e.g. Mining & Resources" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Ticker</label>
                      <input value={bookingForm.ticker} onChange={e => setBookingForm(f => ({ ...f, ticker: e.target.value }))} placeholder="e.g. AGL" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Date</label>
                      <input type="date" value={bookingForm.eventDate} onChange={e => setBookingForm(f => ({ ...f, eventDate: e.target.value }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Time</label>
                      <input type="time" value={bookingForm.eventTime} onChange={e => setBookingForm(f => ({ ...f, eventTime: e.target.value }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Expected Attendees</label>
                      <input type="number" value={bookingForm.expectedAttendees} onChange={e => setBookingForm(f => ({ ...f, expectedAttendees: e.target.value }))} placeholder="e.g. 150" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Platform</label>
                      <select value={bookingForm.platform} onChange={e => setBookingForm(f => ({ ...f, platform: e.target.value as any }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
                        {PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Meeting URL</label>
                      <input value={bookingForm.meetingUrl} onChange={e => setBookingForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://zoom.us/j/..." className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Bastion Reference</label>
                      <input value={bookingForm.bastionReference} onChange={e => setBookingForm(f => ({ ...f, bastionReference: e.target.value }))} placeholder="e.g. BCP-2026-0042" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Contact Name</label>
                      <input value={bookingForm.contactName} onChange={e => setBookingForm(f => ({ ...f, contactName: e.target.value }))} placeholder="IR contact name" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Confirmation Recipients</label>
                    <textarea value={bookingForm.confirmationRecipients} onChange={e => setBookingForm(f => ({ ...f, confirmationRecipients: e.target.value }))} placeholder="ir@anglo.co.za, analyst@bastion.co.za, pm@bastion.co.za" rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none" />
                    <p className="text-[10px] text-slate-600 mt-1">Everyone who should receive the booking confirmation — IR contacts, Bastion team, portfolio managers. Comma-separated.</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes</label>
                    <input value={bookingForm.notes} onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special requirements or context" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createBookingMut.isPending} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2">
                      {createBookingMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Handshake className="w-4 h-4" />Create Booking</>}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">All Bookings</div>
                {(bookings.data ?? []).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No bookings yet. Create one to get started.
                  </div>
                )}
                {(bookings.data ?? []).map(bk => {
                  const cfg = BOOKING_STATUS_CONFIG[bk.status] ?? BOOKING_STATUS_CONFIG.booked;
                  const BkIcon = cfg.icon;
                  return (
                    <div
                      key={bk.id}
                      onClick={() => setSelectedBookingId(bk.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        selectedBookingId === bk.id
                          ? "bg-amber-400/5 border-amber-400/30"
                          : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">{bk.eventTitle}</span>
                        <span className={`text-[10px] ${cfg.color} ${cfg.bg} border px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <BkIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{bk.clientName}{bk.ticker ? ` · ${bk.ticker}` : ""}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {bk.eventDate && <span className="text-[10px] text-slate-600">{bk.eventDate}</span>}
                        {bk.eventType && <span className="text-[10px] text-amber-400/60">{EVENT_TYPE_LABELS[bk.eventType]}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-2">
                {selectedBookingId && selectedBooking.data ? (() => {
                  const bk = selectedBooking.data;
                  const cfg = BOOKING_STATUS_CONFIG[bk.status] ?? BOOKING_STATUS_CONFIG.booked;
                  const BkIcon = cfg.icon;
                  const checklist = (bk.checklist as any[]) ?? [];
                  const stages = ["booked", "setup", "ready", "live", "completed"];
                  const currentStageIdx = stages.indexOf(bk.status);

                  return (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{bk.eventTitle}</h3>
                          <p className="text-sm text-slate-400">{bk.clientName}{bk.ticker ? ` (${bk.ticker})` : ""}</p>
                        </div>
                        <span className={`text-xs ${cfg.color} ${cfg.bg} border px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold`}>
                          <BkIcon className="w-3.5 h-3.5" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {stages.map((stage, i) => {
                          const sCfg = BOOKING_STATUS_CONFIG[stage];
                          const isActive = i <= currentStageIdx;
                          return (
                            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                              <div className={`h-1.5 w-full rounded-full transition-all ${isActive ? (i === currentStageIdx ? "bg-amber-400" : "bg-amber-400/40") : "bg-white/[0.06]"}`} />
                              <span className={`text-[9px] ${isActive ? sCfg?.color ?? "text-slate-400" : "text-slate-600"}`}>{sCfg?.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-500">Date:</span> <span className="text-white">{bk.eventDate || "Not set"}</span></div>
                        <div><span className="text-slate-500">Time:</span> <span className="text-white">{bk.eventTime || "Not set"}</span></div>
                        <div><span className="text-slate-500">Event Type:</span> <span className="text-white">{EVENT_TYPE_LABELS[bk.eventType] ?? bk.eventType}</span></div>
                        <div><span className="text-slate-500">Platform:</span> <span className="text-white">{PLATFORM_LABELS[bk.platform] ?? bk.platform}</span></div>
                        <div><span className="text-slate-500">Sector:</span> <span className="text-white">{bk.sector || "—"}</span></div>
                        <div><span className="text-slate-500">Ticker:</span> <span className="text-white">{bk.ticker || "—"}</span></div>
                        <div><span className="text-slate-500">Attendees:</span> <span className="text-white">{bk.expectedAttendees ?? "—"}</span></div>
                        <div><span className="text-slate-500">Bastion Ref:</span> <span className="text-white">{bk.bastionReference || "—"}</span></div>
                        {bk.contactName && <div><span className="text-slate-500">Contact:</span> <span className="text-white">{bk.contactName}</span></div>}
                        {bk.contactEmail && <div><span className="text-slate-500">Email:</span> <span className="text-white">{bk.contactEmail}</span></div>}
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-400 font-medium mb-1">Client Live Dashboard</div>
                            <div className="text-xs text-amber-300 font-mono break-all">{getDashboardUrl(bk.dashboardToken)}</div>
                          </div>
                          <Button onClick={() => copyDashboardLink(bk.dashboardToken)} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs gap-1.5" size="sm">
                            <FileText className="w-3.5 h-3.5" /> Copy Link
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Share with the IR team or Bastion. No login required — live sentiment, guidance tracking, and analyst intelligence visible during the event.</p>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Handshake className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">Booking Confirmation</span>
                          </div>
                          {bk.confirmationSentAt && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sent {new Date(bk.confirmationSentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          Send a branded confirmation email with event details, live dashboard link, and the full Bastion investor intelligence package summary.
                        </p>
                        {(bk.confirmationRecipients || bk.contactEmail) && (
                          <div className="mb-3">
                            <div className="text-[10px] text-slate-500 font-medium mb-1">Recipients</div>
                            <div className="text-xs text-slate-300">{[bk.contactEmail, bk.confirmationRecipients].filter(Boolean).join(", ")}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => sendConfirmationMut.mutate({ id: bk.id })}
                            disabled={sendConfirmationMut.isPending || (!bk.contactEmail && !bk.confirmationRecipients)}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs gap-1.5"
                            size="sm"
                          >
                            {sendConfirmationMut.isPending
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                              : <><Building2 className="w-3.5 h-3.5" /> {bk.confirmationSentAt ? "Resend Confirmation" : "Send Confirmation"}</>
                            }
                          </Button>
                          {!bk.contactEmail && !bk.confirmationRecipients && (
                            <span className="text-[10px] text-amber-400">Add confirmation recipients first</span>
                          )}
                        </div>
                      </div>

                      {(bk.status === "booked" || bk.status === "setup" || bk.status === "ready") && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pre-Event Checklist
                            </h4>
                            <Button onClick={() => {
                              if (bk.status === "booked") updateBookingMut.mutate({ id: bk.id, status: "setup" });
                              runChecklistMut.mutate({ id: bk.id });
                            }} disabled={runChecklistMut.isPending} className="text-xs bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/10" size="sm">
                              {runChecklistMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run Checklist"}
                            </Button>
                          </div>
                          {checklist.length > 0 ? (
                            <div className="space-y-2">
                              {checklist.map((c: any) => (
                                <div key={c.key} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2">
                                  <span className={`w-2 h-2 rounded-full ${c.status === "pass" ? "bg-emerald-400" : c.status === "warn" ? "bg-amber-400" : "bg-red-400"}`} />
                                  <span className="text-sm text-white flex-1">{c.label}</span>
                                  <span className={`text-xs ${c.status === "pass" ? "text-emerald-400" : c.status === "warn" ? "text-amber-400" : "text-red-400"}`}>{c.detail}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">Run the checklist to evaluate readiness.</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                        {(bk.status === "ready" || bk.status === "setup") && (
                          <Button onClick={handleDeployFromBooking} disabled={startSession.isPending || !bk.meetingUrl} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 text-xs">
                            {startSession.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deploying...</> : <><Building2 className="w-3.5 h-3.5" />Deploy Intelligence</>}
                          </Button>
                        )}
                        {bk.status === "live" && (
                          <Button onClick={() => completeBookingMut.mutate({ id: bk.id })} disabled={completeBookingMut.isPending} className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </Button>
                        )}
                        {bk.status === "booked" && (
                          <Button onClick={() => updateBookingMut.mutate({ id: bk.id, status: "setup" })} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Begin Setup
                          </Button>
                        )}
                        {bk.shadowSessionId && (
                          <Button onClick={() => { setActiveSessionId(bk.shadowSessionId); setActiveTab("sessions"); }} className="bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/10 text-xs gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> View Session
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Select a booking to view details and manage the pipeline.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-4">

            {showForm && (
              <div className="bg-white/[0.02] border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Deploy CuraLive Intelligence to Investor Event</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xs">Cancel</button>
                </div>
                <form onSubmit={handleDeploy} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Client / Company</label>
                      <input
                        value={form.clientName}
                        onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="e.g. Bastion Capital"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Name</label>
                      <input
                        value={form.eventName}
                        onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                        placeholder="e.g. Anglo American Q1 2026 Earnings"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Type</label>
                      <select
                        value={form.eventType}
                        onChange={e => setForm(f => ({ ...f, eventType: e.target.value as any }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      >
                        {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Platform</label>
                      <select
                        value={form.platform}
                        onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      >
                        {PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Meeting URL</label>
                    <input
                      value={form.meetingUrl}
                      onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                      placeholder="https://zoom.us/j/..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes <span className="text-slate-600">(optional)</span></label>
                    <input
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="What are you tracking in this event?"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={startSession.isPending}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2"
                    >
                      {startSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deploying...</> : <><Building2 className="w-4 h-4" />Deploy Intelligence</>}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session History</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    + New Session
                  </button>
                </div>

                {sessions.isLoading && (
                  <div className="flex items-center justify-center py-12 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading...
                  </div>
                )}

                {!sessions.isLoading && allSessions.length === 0 && !showForm && (
                  <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">No sessions yet</p>
                    <p className="text-xs text-slate-700 mb-4">Deploy intelligence on a Bastion investor event to start</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Deploy now
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {allSessions.map(s => {
                    const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                    const isSelected = s.id === activeSessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isSelected
                            ? "border-amber-500/40 bg-amber-500/[0.06]"
                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-200 truncate">{s.eventName}</div>
                            <div className="text-xs text-slate-500 truncate">{s.clientName}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>{EVENT_TYPE_LABELS[s.eventType] ?? s.eventType}</span>
                          <span>·</span>
                          <span>{PLATFORM_LABELS[s.platform] ?? s.platform}</span>
                        </div>
                        {s.sentimentAvg != null && (
                          <div className="mt-2">
                            <SentimentBar value={s.sentimentAvg} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-3">
                {!activeSessionId && (
                  <div className="h-full border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                    <Eye className="w-10 h-10 text-slate-700 mb-4" />
                    <p className="text-sm text-slate-500 mb-1">Select a session to view intelligence</p>
                    <p className="text-xs text-slate-700">Or deploy intelligence on a new investor event</p>
                  </div>
                )}

                {activeSessionId && activeSession.isLoading && (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                  </div>
                )}

                {activeSessionId && session && (
                  <div className="space-y-4">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-semibold text-white">{session.eventName}</h3>
                            {(() => {
                              const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
                              return (
                                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {session.clientName} · {EVENT_TYPE_LABELS[session.eventType] ?? session.eventType} · {PLATFORM_LABELS[session.platform] ?? session.platform}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {isSessionLive && (
                            <Button
                              onClick={() => endSession.mutate({ sessionId: session.id })}
                              disabled={endSession.isPending}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs gap-1.5"
                              size="sm"
                            >
                              <Square className="w-3 h-3" /> End Session
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Sentiment</div>
                          <div className="text-lg font-bold text-emerald-400">{session.sentimentAvg != null ? `${Math.round(session.sentimentAvg * 100)}%` : "—"}</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Segments</div>
                          <div className="text-lg font-bold text-blue-400">{session.transcriptCount ?? 0}</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Duration</div>
                          <div className="text-lg font-bold text-slate-300">
                            {session.startedAt ? `${Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)}m` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {session.sentimentSummary && (
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-amber-400" /> AI Intelligence Summary
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{session.sentimentSummary}</p>
                      </div>
                    )}

                    {session.transcript && session.transcript.length > 0 && (
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" /> Recent Transcript
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {session.transcript.slice(-15).map((seg: any, i: number) => (
                            <div key={i} className="text-xs">
                              <span className="text-amber-400 font-medium">{seg.speaker}:</span>{" "}
                              <span className="text-slate-400">{seg.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
