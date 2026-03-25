// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Globe, Activity, AlertTriangle, CheckCircle2,
  Clock, Loader2, Eye, BarChart3, MessageSquare, Zap,
  TrendingUp, TrendingDown, Minus, Play, Square,
  Building2, Lock, FileText, Users, Radio,
  Layers, ChevronRight, Star, Award, Handshake,
  Brain, Vote, Scale,
} from "lucide-react";
import { Link } from "wouter";

const PLATFORM_OPTIONS = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "meet", label: "Google Meet" },
  { value: "webex", label: "Cisco Webex" },
  { value: "webphone", label: "Webphone" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "agm", label: "AGM (Annual General Meeting)" },
  { value: "earnings_call", label: "Earnings Call" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "ceo_town_hall", label: "CEO / Investor Town Hall" },
  { value: "webcast", label: "Webcast" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  agm: "AGM", earnings_call: "Earnings Call", capital_markets_day: "Capital Markets Day",
  board_meeting: "Board Meeting", ceo_town_hall: "CEO / Investor Town Hall",
  webcast: "Webcast", other: "Other",
};

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", webphone: "Webphone", other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",    color: "text-slate-400 bg-slate-400/10 border-slate-400/20",  dot: "bg-slate-400",                icon: Clock },
  bot_joining: { label: "Joining",    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",     dot: "bg-cyan-400 animate-pulse",   icon: Loader2 },
  live:        { label: "Live",       color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",     dot: "bg-cyan-400 animate-pulse",   icon: Radio },
  processing:  { label: "Processing", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",     dot: "bg-blue-400 animate-pulse",   icon: Loader2 },
  completed:   { label: "Completed",  color: "text-violet-400 bg-violet-400/10 border-violet-400/20", dot: "bg-violet-400",             icon: CheckCircle2 },
  failed:      { label: "Failed",     color: "text-red-400 bg-red-400/10 border-red-400/20",        dot: "bg-red-400",                  icon: AlertTriangle },
};

const PACKAGE_FEATURES = [
  {
    icon: Activity,
    title: "Live Sentiment Intelligence",
    desc: "Real-time investor mood tracking throughout AGMs and shareholder meetings. Sentiment scored every 5 transcript segments.",
    tag: "Real-time",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: Shield,
    title: "Compliance Co-Monitoring",
    desc: "Flags material statements, forward-looking language, and insider risk keywords alongside Lumi's existing governance compliance layer.",
    tag: "Governance",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    icon: MessageSquare,
    title: "Q&A Auto-Triage",
    desc: "Prioritises shareholder questions by investor tier before they reach the floor. Reduces friction and ensures key voices are heard.",
    tag: "AI",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: FileText,
    title: "Post-Event Intelligence Report",
    desc: "AI-generated summary delivered after every meeting: engagement arc, sentiment delta, compliance summary, and key moments.",
    tag: "Automated",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: Zap,
    title: "Event Echo",
    desc: "Instant content generation from the meeting transcript — press releases, investor summaries, and social posts ready within minutes of close.",
    tag: "Content",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: BarChart3,
    title: "AGM Industry Benchmarks",
    desc: "Anonymised intelligence from AGM and shareholder meetings across Lumi's 40+ markets. Compare your event against sector norms.",
    tag: "Data",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
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

export default function LumiPartner() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"package" | "sessions" | "bookings">("package");
  const [form, setForm] = useState({
    clientName: "Lumi Global",
    eventName: "",
    eventType: "agm" as const,
    platform: "zoom" as const,
    meetingUrl: "",
    notes: "",
  });

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    agmTitle: "",
    agmDate: "",
    agmTime: "",
    jurisdiction: "south_africa" as const,
    expectedAttendees: "",
    meetingUrl: "",
    platform: "zoom" as const,
    contactName: "",
    contactEmail: "" as string,
    lumiReference: "",
    lumiRecipients: "",
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
      const isAgm = form.eventType === "agm";
      toast.success(isAgm
        ? "AGM Intelligence deployed — 6 governance algorithms activated"
        : "CuraLive Intelligence deployed to Lumi meeting");
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      setActiveTab("sessions");
      sessions.refetch();

      if (deployingBookingId) {
        linkSessionsMut.mutate({
          bookingId: deployingBookingId,
          shadowSessionId: data.sessionId,
          agmSessionId: data.agmSessionId ?? null,
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
  const agmSessionId = session?.agmSessionId ?? null;
  const isAgmSession = session?.eventType === "agm";

  const agmDashboard = trpc.agmGovernance.dashboard.useQuery(
    { sessionId: agmSessionId! },
    { enabled: agmSessionId != null, refetchInterval: 5000 }
  );

  const addResolutionMut = trpc.agmGovernance.addResolution.useMutation({
    onSuccess: () => { toast.success("Resolution added"); agmDashboard.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const predictMut = trpc.agmGovernance.predictApproval.useMutation();
  const dissentMut = trpc.agmGovernance.analyzeDissentPatterns.useMutation();
  const quorumMut = trpc.agmGovernance.analyzeQuorum.useMutation();
  const triageMut = trpc.agmGovernance.triageQuestions.useMutation();
  const complianceMut = trpc.agmGovernance.scanCompliance.useMutation();
  const reportMut = trpc.agmGovernance.generateReport.useMutation({
    onSuccess: () => { toast.success("Governance report generated"); agmDashboard.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const bookings = trpc.lumiBooking.list.useQuery(undefined, { refetchInterval: 8000 });
  const selectedBooking = trpc.lumiBooking.getById.useQuery(
    { id: selectedBookingId! },
    { enabled: selectedBookingId != null, refetchInterval: 5000 }
  );

  const createBookingMut = trpc.lumiBooking.create.useMutation({
    onSuccess: (data) => {
      toast.success("Booking created — dashboard link generated");
      setShowBookingForm(false);
      setSelectedBookingId(data.bookingId);
      bookings.refetch();
      setBookingForm({ clientName: "", agmTitle: "", agmDate: "", agmTime: "", jurisdiction: "south_africa", expectedAttendees: "", meetingUrl: "", platform: "zoom", contactName: "", contactEmail: "", lumiReference: "", lumiRecipients: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateBookingMut = trpc.lumiBooking.update.useMutation({
    onSuccess: () => { toast.success("Booking updated"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const runChecklistMut = trpc.lumiBooking.runChecklist.useMutation({
    onSuccess: () => { toast.success("Checklist evaluated"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const linkSessionsMut = trpc.lumiBooking.linkSessions.useMutation({
    onSuccess: () => { toast.success("Sessions linked — booking is live"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const completeBookingMut = trpc.lumiBooking.complete.useMutation({
    onSuccess: () => { toast.success("Booking completed"); bookings.refetch(); selectedBooking.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sendConfirmationMut = trpc.lumiBooking.sendConfirmation.useMutation({
    onSuccess: (data) => {
      toast.success(`Booking confirmation sent to ${data.recipientCount} recipient(s)`);
      bookings.refetch();
      selectedBooking.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.clientName.trim() || !bookingForm.agmTitle.trim()) {
      toast.error("Client name and AGM title are required");
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
      eventName: bk.agmTitle,
      eventType: "agm",
      platform: (platformMap[bk.platform] ?? "other") as any,
      meetingUrl: bk.meetingUrl,
      notes: bk.notes ?? "",
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

  const JURISDICTION_LABELS: Record<string, string> = {
    south_africa: "South Africa", united_kingdom: "United Kingdom",
    united_states: "United States", australia: "Australia", other: "Other",
  };

  const getDashboardUrl = (token: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/live/${token}`;
  };

  const copyDashboardLink = (token: string) => {
    navigator.clipboard.writeText(getDashboardUrl(token));
    toast.success("Dashboard link copied to clipboard");
  };

  const [agmTab, setAgmTab] = useState<"resolutions" | "algorithms" | "report">("resolutions");
  const [newRes, setNewRes] = useState({ number: "", title: "", category: "ordinary" });
  const [quorumForm, setQuorumForm] = useState({ attendance: "", proxies: "", totalShares: "", represented: "" });
  const [qaText, setQaText] = useState("");

  const allSessions = sessions.data ?? [];
  const liveSessions = allSessions.filter(s => s.status === "live" || s.status === "bot_joining").length;
  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter(s => s.status === "completed").length;
  const avgSentiment = allSessions.filter(s => s.sentimentAvg != null).length > 0
    ? allSessions.reduce((sum, s) => sum + (s.sentimentAvg ?? 0), 0) / allSessions.filter(s => s.sentimentAvg != null).length
    : null;

  return (
    <div className="min-h-screen bg-[#060a10] text-white">

      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#060a10]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">Lumi Global</h1>
                  <span className="text-[10px] font-bold tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full uppercase">Partner Integration</span>
                </div>
                <p className="text-xs text-slate-500">CuraLive intelligence layer for Lumi-hosted governance meetings</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveSessions > 0 && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {liveSessions} active
              </div>
            )}
            <Button
              onClick={() => { setShowForm(true); setActiveTab("sessions"); }}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm h-9 px-4 gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Run Intelligence
            </Button>
          </div>
        </div>

        {/* Tabs */}
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
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Partner header card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/[0.02] border border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Lumi Global</h2>
                  <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Strategic Partner
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  35+ years of governance technology. Lumi powers AGMs, shareholder meetings, electronic voting, and hybrid participation for the world's most respected organizations across 40+ markets. CuraLive adds the AI intelligence layer — sentiment, compliance, Q&A triage, and post-event analytics — directly on top of every Lumi-hosted meeting.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Markets", value: "40+" },
                    { label: "Founded", value: "1990" },
                    { label: "Focus", value: "Governance" },
                    { label: "Compliance", value: "ISO/GDPR" },
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

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {[
              { icon: Radio, label: "Sessions Run", value: totalSessions, color: "text-cyan-400" },
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

        {/* Package tab */}
        {activeTab === "package" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Handshake className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-white">CuraLive × Lumi Global — Integration Package</h3>
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

            {/* Integration diagram */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                How the integration works
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {[
                  {
                    step: "1",
                    title: "Lumi runs the meeting",
                    desc: "AGM, shareholder meeting, or hybrid governance event managed entirely by Lumi's platform — voting, participation, compliance.",
                    color: "border-cyan-400/30",
                    dot: "bg-cyan-400",
                  },
                  {
                    step: "2",
                    title: "CuraLive joins silently",
                    desc: "CuraLive Intelligence bot joins via Recall.ai as a silent observer — invisible to participants. Begins transcribing and scoring in real time.",
                    color: "border-violet-400/30",
                    dot: "bg-violet-400",
                  },
                  {
                    step: "3",
                    title: "Intelligence delivered",
                    desc: "Live sentiment, compliance flags, Q&A triage, and post-event report delivered to the operator. Anonymised record added to benchmarks.",
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

            <div className="bg-white/[0.02] border border-violet-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">AGM Governance AI</h4>
                    <p className="text-[11px] text-slate-500">6 Self-Evolving Algorithms — Companies Act 71 · JSE · King IV</p>
                  </div>
                </div>
                <Link href="/agm-governance">
                  <span className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors">
                    Open Dashboard <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Purpose-built for Lumi-hosted AGMs: autonomous algorithms that predict resolution outcomes, detect shareholder dissent patterns, triage governance questions, monitor quorum thresholds, scan for regulatory compliance breaches, and generate board-ready reports. Every AGM makes the system smarter through self-evolving intelligence fed into CuraLive's AI Evolution Engine.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Vote, name: "Resolution Predictor", desc: "Predicts approval % from live debate sentiment + historical baselines", color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/10" },
                  { icon: Eye, name: "Dissent Pattern Engine", desc: "Cross-AGM institutional memory of shareholder opposition patterns", color: "text-amber-400", border: "border-amber-400/20", bg: "bg-amber-400/10" },
                  { icon: MessageSquare, name: "Q&A Governance Triage", desc: "Classifies questions by regulatory significance under Companies Act 71", color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
                  { icon: Users, name: "Quorum Intelligence", desc: "Real-time quorum monitoring with jurisdiction-specific thresholds", color: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/10" },
                  { icon: Shield, name: "Regulatory Guardian", desc: "8 rule categories: Companies Act 71, JSE Listings, King IV, forward-looking", color: "text-red-400", border: "border-red-400/20", bg: "bg-red-400/10" },
                  { icon: FileText, name: "Governance Report", desc: "12-section board-ready reports generated autonomously post-AGM", color: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/10" },
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
                <Brain className="w-3 h-3 text-violet-400" />
                <span>Self-evolving: all 6 algorithms feed observations into the AI Evolution Engine (Module M) after every AGM</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => { setShowForm(true); setActiveTab("sessions"); }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2 px-6"
              >
                <Play className="w-4 h-4" />
                Run Intelligence on a Lumi Event
              </Button>
            </div>
          </div>
        )}

        {/* Bookings tab */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Booking Pipeline
              </h3>
              <Button
                onClick={() => setShowBookingForm(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2 text-xs"
                size="sm"
              >
                <Play className="w-3.5 h-3.5" />
                New Booking
              </Button>
            </div>

            {/* Pipeline stage overview */}
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

            {/* New booking form */}
            {showBookingForm && (
              <div className="bg-white/[0.02] border border-cyan-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">New Lumi AGM Booking</h3>
                  </div>
                  <button onClick={() => setShowBookingForm(false)} className="text-slate-500 hover:text-slate-300 text-xs">Cancel</button>
                </div>
                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Client / Company *</label>
                      <input value={bookingForm.clientName} onChange={e => setBookingForm(f => ({ ...f, clientName: e.target.value }))} placeholder="e.g. Sasol Limited" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">AGM Title *</label>
                      <input value={bookingForm.agmTitle} onChange={e => setBookingForm(f => ({ ...f, agmTitle: e.target.value }))} placeholder="e.g. Sasol AGM 2026" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">AGM Date</label>
                      <input type="date" value={bookingForm.agmDate} onChange={e => setBookingForm(f => ({ ...f, agmDate: e.target.value }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">AGM Time</label>
                      <input type="time" value={bookingForm.agmTime} onChange={e => setBookingForm(f => ({ ...f, agmTime: e.target.value }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Jurisdiction</label>
                      <select value={bookingForm.jurisdiction} onChange={e => setBookingForm(f => ({ ...f, jurisdiction: e.target.value as any }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                        <option value="south_africa">South Africa</option>
                        <option value="united_kingdom">United Kingdom</option>
                        <option value="united_states">United States</option>
                        <option value="australia">Australia</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Expected Attendees</label>
                      <input type="number" value={bookingForm.expectedAttendees} onChange={e => setBookingForm(f => ({ ...f, expectedAttendees: e.target.value }))} placeholder="e.g. 250" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Platform</label>
                      <select value={bookingForm.platform} onChange={e => setBookingForm(f => ({ ...f, platform: e.target.value as any }))} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                        {PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Meeting URL</label>
                      <input value={bookingForm.meetingUrl} onChange={e => setBookingForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://zoom.us/j/..." className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Lumi Reference</label>
                      <input value={bookingForm.lumiReference} onChange={e => setBookingForm(f => ({ ...f, lumiReference: e.target.value }))} placeholder="e.g. LUMI-2026-0042" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Contact Name</label>
                      <input value={bookingForm.contactName} onChange={e => setBookingForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Company Secretary name" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Confirmation Recipients</label>
                    <textarea value={bookingForm.lumiRecipients} onChange={e => setBookingForm(f => ({ ...f, lumiRecipients: e.target.value }))} placeholder="secretary@sasol.co.za, john@lumiglobal.com, sarah@lumiglobal.com" rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none" />
                    <p className="text-[10px] text-slate-600 mt-1">Everyone who should receive the booking confirmation — client contacts, Lumi team, company secretary. Comma-separated.</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes</label>
                    <input value={bookingForm.notes} onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special requirements or context" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createBookingMut.isPending} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2">
                      {createBookingMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Handshake className="w-4 h-4" />Create Booking</>}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Booking list */}
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
                          ? "bg-cyan-400/5 border-cyan-400/30"
                          : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">{bk.agmTitle}</span>
                        <span className={`text-[10px] ${cfg.color} ${cfg.bg} border px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <BkIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{bk.clientName}</div>
                      {bk.agmDate && <div className="text-[10px] text-slate-600 mt-1">{bk.agmDate}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Booking detail */}
              <div className="lg:col-span-2">
                {selectedBookingId && selectedBooking.data ? (() => {
                  const bk = selectedBooking.data;
                  const cfg = BOOKING_STATUS_CONFIG[bk.status] ?? BOOKING_STATUS_CONFIG.booked;
                  const BkIcon = cfg.icon;
                  const checklist = (bk.checklist as any[]) ?? [];
                  const allChecksPassed = checklist.length > 0 && checklist.every((c: any) => c.status !== "fail");
                  const stages = ["booked", "setup", "ready", "live", "completed"];
                  const currentStageIdx = stages.indexOf(bk.status);

                  return (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{bk.agmTitle}</h3>
                          <p className="text-sm text-slate-400">{bk.clientName}</p>
                        </div>
                        <span className={`text-xs ${cfg.color} ${cfg.bg} border px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold`}>
                          <BkIcon className="w-3.5 h-3.5" /> {cfg.label}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-1">
                        {stages.map((stage, i) => {
                          const sCfg = BOOKING_STATUS_CONFIG[stage];
                          const isActive = i <= currentStageIdx;
                          return (
                            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                              <div className={`h-1.5 w-full rounded-full transition-all ${isActive ? (i === currentStageIdx ? "bg-cyan-400" : "bg-cyan-400/40") : "bg-white/[0.06]"}`} />
                              <span className={`text-[9px] ${isActive ? sCfg?.color ?? "text-slate-400" : "text-slate-600"}`}>{sCfg?.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-500">Date:</span> <span className="text-white">{bk.agmDate || "Not set"}</span></div>
                        <div><span className="text-slate-500">Time:</span> <span className="text-white">{bk.agmTime || "Not set"}</span></div>
                        <div><span className="text-slate-500">Jurisdiction:</span> <span className="text-white capitalize">{JURISDICTION_LABELS[bk.jurisdiction] ?? bk.jurisdiction}</span></div>
                        <div><span className="text-slate-500">Platform:</span> <span className="text-white">{PLATFORM_LABELS[bk.platform] ?? bk.platform}</span></div>
                        <div><span className="text-slate-500">Attendees:</span> <span className="text-white">{bk.expectedAttendees ?? "—"}</span></div>
                        <div><span className="text-slate-500">Lumi Ref:</span> <span className="text-white">{bk.lumiReference || "—"}</span></div>
                        {bk.contactName && <div><span className="text-slate-500">Contact:</span> <span className="text-white">{bk.contactName}</span></div>}
                        {bk.contactEmail && <div><span className="text-slate-500">Email:</span> <span className="text-white">{bk.contactEmail}</span></div>}
                      </div>

                      {/* Client dashboard link */}
                      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-400 font-medium mb-1">Client Live Dashboard</div>
                            <div className="text-xs text-violet-300 font-mono break-all">{getDashboardUrl(bk.dashboardToken)}</div>
                          </div>
                          <Button onClick={() => copyDashboardLink(bk.dashboardToken)} className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs gap-1.5" size="sm">
                            <FileText className="w-3.5 h-3.5" /> Copy Link
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Share this link with the client or Lumi. No login required — live sentiment, quorum, and resolution data visible during the AGM.</p>
                      </div>

                      {/* Booking confirmation email */}
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
                          Send a branded confirmation email with event details, the live dashboard link, and what CuraLive intelligence is included.
                        </p>
                        {(bk.lumiRecipients || bk.contactEmail) && (
                          <div className="mb-3">
                            <div className="text-[10px] text-slate-500 font-medium mb-1">Recipients</div>
                            <div className="text-xs text-slate-300">{[bk.contactEmail, bk.lumiRecipients].filter(Boolean).join(", ")}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => sendConfirmationMut.mutate({ id: bk.id })}
                            disabled={sendConfirmationMut.isPending || (!bk.contactEmail && !bk.lumiRecipients)}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs gap-1.5"
                            size="sm"
                          >
                            {sendConfirmationMut.isPending
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                              : <><Globe className="w-3.5 h-3.5" /> {bk.confirmationSentAt ? "Resend Confirmation" : "Send Confirmation"}</>
                            }
                          </Button>
                          {!bk.contactEmail && !bk.lumiRecipients && (
                            <span className="text-[10px] text-amber-400">Add confirmation recipients first</span>
                          )}
                        </div>
                      </div>

                      {/* Pre-event checklist */}
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

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                        {(bk.status === "ready" || bk.status === "setup") && (
                          <Button onClick={handleDeployFromBooking} disabled={startSession.isPending || !bk.meetingUrl} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2 text-xs">
                            {startSession.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deploying...</> : <><Globe className="w-3.5 h-3.5" />Deploy Intelligence</>}
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

        {/* Sessions tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">

            {/* Deploy form */}
            {showForm && (
              <div className="bg-white/[0.02] border border-cyan-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Deploy CuraLive Intelligence to Lumi Meeting</h3>
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
                        placeholder="e.g. Lumi Global"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Name</label>
                      <input
                        value={form.eventName}
                        onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                        placeholder="e.g. Shell AGM 2025"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Type</label>
                      <select
                        value={form.eventType}
                        onChange={e => setForm(f => ({ ...f, eventType: e.target.value as any }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Platform</label>
                      <select
                        value={form.platform}
                        onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
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
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes <span className="text-slate-600">(optional)</span></label>
                    <input
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="What are you validating in this session?"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={startSession.isPending}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
                    >
                      {startSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deploying...</> : <><Globe className="w-4 h-4" />Deploy Intelligence</>}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

              {/* Session list */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session History</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
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
                    <Globe className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">No sessions yet</p>
                    <p className="text-xs text-slate-700 mb-4">Run intelligence on a Lumi-hosted meeting to start</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Deploy now →
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
                            ? "border-cyan-500/40 bg-cyan-500/[0.06]"
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
                          {s.eventType === "agm" && (
                            <span className="text-[9px] text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded font-semibold">AI</span>
                          )}
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

              {/* Intelligence panel */}
              <div className="lg:col-span-3">
                {!activeSessionId && (
                  <div className="h-full border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                    <Eye className="w-10 h-10 text-slate-700 mb-4" />
                    <p className="text-sm text-slate-500 mb-1">Select a session to view intelligence</p>
                    <p className="text-xs text-slate-700">Or run intelligence on a new Lumi meeting</p>
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
                          <p className="text-sm text-slate-400">{session.clientName} · {EVENT_TYPE_LABELS[session.eventType] ?? session.eventType} · {PLATFORM_LABELS[session.platform] ?? session.platform}</p>
                        </div>
                        {isSessionLive && (
                          <Button
                            onClick={() => endSession.mutate({ sessionId: session.id })}
                            disabled={endSession.isPending}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 gap-1.5 text-sm shrink-0"
                          >
                            {endSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                            End Session
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs text-slate-500">Sentiment</span>
                        </div>
                        {session.sentimentAvg != null
                          ? <div className="text-2xl font-bold text-emerald-400">{Math.round(session.sentimentAvg * 100)}%</div>
                          : <div className="text-2xl font-bold text-slate-600">—</div>}
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-slate-500">Segments</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{session.transcriptSegments ?? 0}</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs text-slate-500">Flags</span>
                        </div>
                        <div className={`text-2xl font-bold ${(session.complianceFlags ?? 0) > 0 ? "text-red-400" : "text-slate-600"}`}>
                          {session.complianceFlags ?? 0}
                        </div>
                      </div>
                    </div>

                    {(session.complianceFlags ?? 0) > 0 && (
                      <div className="bg-red-500/[0.05] border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-semibold text-red-400">Compliance Flags Detected</span>
                        </div>
                        <p className="text-xs text-red-300/70">
                          {session.complianceFlags} compliance keyword{(session.complianceFlags ?? 0) > 1 ? "s" : ""} detected. Review for material statements or forward-looking language — particularly important for AGM governance compliance.
                        </p>
                      </div>
                    )}

                    {isSessionLive && (
                      <div className="bg-cyan-500/[0.05] border border-cyan-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-cyan-400">Intelligence active on Lumi meeting</p>
                          <p className="text-xs text-cyan-300/60">Joined as "CuraLive Intelligence" — transcribing and scoring in real time</p>
                        </div>
                      </div>
                    )}

                    {session.status === "completed" && (
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-violet-400" />
                          <span className="text-sm font-semibold text-white">Session Complete</span>
                        </div>
                        <SentimentBar value={session.sentimentAvg} />
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-3">
                          <span>{session.transcriptSegments ?? 0} transcript segments</span>
                          <span>{session.complianceFlags ?? 0} compliance flags</span>
                          <span>{session.taggedMetricsGenerated ?? 0} intelligence records</span>
                          <span>1 anonymised benchmark record</span>
                        </div>
                      </div>
                    )}

                    {isAgmSession && agmSessionId && (
                      <div className="bg-white/[0.02] border border-violet-500/20 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-violet-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                              <Brain className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-white">AGM Governance AI</h4>
                              <p className="text-[10px] text-slate-500">6 algorithms active · auto-linked to this session</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            Active
                          </div>
                        </div>

                        <div className="flex border-b border-white/[0.04]">
                          {[
                            { id: "resolutions", label: "Resolutions" },
                            { id: "algorithms", label: "Run Algorithms" },
                            { id: "report", label: "Report" },
                          ].map(tab => (
                            <button key={tab.id} onClick={() => setAgmTab(tab.id as any)}
                              className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                                agmTab === tab.id ? "border-violet-400 text-violet-400" : "border-transparent text-slate-500 hover:text-slate-300"
                              }`}>
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="p-4">
                          {agmDashboard.error && (
                            <div className="bg-red-500/[0.05] border border-red-500/20 rounded-xl p-3 mb-3">
                              <p className="text-xs text-red-400">AGM Intelligence unavailable — please sign in to access governance algorithms.</p>
                            </div>
                          )}
                          {agmTab === "resolutions" && !agmDashboard.error && (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input value={newRes.number} onChange={e => setNewRes(r => ({...r, number: e.target.value}))}
                                  placeholder="#" type="number" className="w-14 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                                <input value={newRes.title} onChange={e => setNewRes(r => ({...r, title: e.target.value}))}
                                  placeholder="Resolution title" className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600" />
                                <select value={newRes.category} onChange={e => setNewRes(r => ({...r, category: e.target.value}))}
                                  className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                  {["ordinary","special","advisory","remuneration","board_election","auditor_appointment","share_repurchase","dividend","esg","other"].map(c =>
                                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                                  )}
                                </select>
                                <button onClick={() => {
                                  if (!newRes.title.trim()) return;
                                  addResolutionMut.mutate({ sessionId: agmSessionId, resolutionNumber: parseInt(newRes.number) || 1, title: newRes.title, category: newRes.category as any });
                                  setNewRes({ number: "", title: "", category: "ordinary" });
                                }} disabled={addResolutionMut.isPending}
                                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                  {addResolutionMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                                </button>
                              </div>

                              {agmDashboard.data?.resolutions?.length ? (
                                <div className="space-y-2">
                                  {agmDashboard.data.resolutions.map((res: any) => (
                                    <div key={res.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                                      <div className="min-w-0">
                                        <div className="text-xs font-medium text-white">#{res.resolutionNumber} {res.title}</div>
                                        <div className="text-[10px] text-slate-500">{res.category?.replace(/_/g, " ")} · {res.status ?? "pending"}</div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {res.predictedApprovalPct != null && (
                                          <span className={`text-xs font-mono font-bold ${res.predictedApprovalPct >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                                            {Math.round(res.predictedApprovalPct)}%
                                          </span>
                                        )}
                                        <button onClick={async () => {
                                          try {
                                            const r = await predictMut.mutateAsync({ sessionId: agmSessionId, resolutionId: res.id });
                                            toast.success(`Predicted: ${Math.round(r.predictedApprovalPct)}% approval`);
                                            agmDashboard.refetch();
                                          } catch (err: any) { toast.error(err.message); }
                                        }} disabled={predictMut.isPending}
                                          className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] font-semibold transition disabled:opacity-50">
                                          {predictMut.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "Predict"}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 text-center py-3">Add resolutions to start predictions</p>
                              )}
                            </div>
                          )}

                          {agmTab === "algorithms" && !agmDashboard.error && (
                            <div className="space-y-3">
                              <div className="bg-white/[0.03] border border-amber-500/20 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-semibold text-white">Dissent Pattern Engine</span>
                                  </div>
                                  <button onClick={async () => {
                                    try {
                                      const r = await dissentMut.mutateAsync({ sessionId: agmSessionId, clientName: session.clientName });
                                      toast.success(`${r.patternsFound} patterns found, risk: ${r.riskLevel}`);
                                    } catch (err: any) { toast.error(err.message); }
                                  }} disabled={dissentMut.isPending}
                                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-[10px] font-semibold transition disabled:opacity-50 flex items-center gap-1">
                                    {dissentMut.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                                    Run
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-500">Scans resolution outcomes for opposition patterns</p>
                              </div>

                              <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="text-xs font-semibold text-white">Quorum Intelligence</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input value={quorumForm.attendance} onChange={e => setQuorumForm(f => ({...f, attendance: e.target.value}))}
                                    placeholder="Attendance" type="number" className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white" />
                                  <input value={quorumForm.proxies} onChange={e => setQuorumForm(f => ({...f, proxies: e.target.value}))}
                                    placeholder="Proxies" type="number" className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white" />
                                  <input value={quorumForm.totalShares} onChange={e => setQuorumForm(f => ({...f, totalShares: e.target.value}))}
                                    placeholder="Total eligible shares" type="number" className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white" />
                                  <input value={quorumForm.represented} onChange={e => setQuorumForm(f => ({...f, represented: e.target.value}))}
                                    placeholder="Shares represented" type="number" className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white" />
                                </div>
                                <button onClick={async () => {
                                  const a = parseInt(quorumForm.attendance), p = parseInt(quorumForm.proxies),
                                    t = parseInt(quorumForm.totalShares), r = parseInt(quorumForm.represented);
                                  if ([a,p,t,r].some(isNaN)) { toast.error("Fill all quorum fields"); return; }
                                  try {
                                    const res = await quorumMut.mutateAsync({ sessionId: agmSessionId, attendanceCount: a, proxyCount: p, totalEligibleShares: t, sharesRepresented: r });
                                    toast.success(`Quorum ${res.quorumMet ? "MET" : "NOT MET"}: ${res.quorumPercentage}%`);
                                    agmDashboard.refetch();
                                  } catch (err: any) { toast.error(err.message); }
                                }} disabled={quorumMut.isPending}
                                  className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-[10px] font-semibold transition disabled:opacity-50 flex items-center gap-1">
                                  {quorumMut.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                                  Analyze Quorum
                                </button>
                              </div>

                              <div className="bg-white/[0.03] border border-blue-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-xs font-semibold text-white">Q&A Governance Triage</span>
                                </div>
                                <textarea value={qaText} onChange={e => setQaText(e.target.value)} rows={2}
                                  placeholder={"[Speaker]: What is the board's position on executive pay?"}
                                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-mono resize-y placeholder:text-slate-600 mb-2" />
                                <button onClick={async () => {
                                  const questions = qaText.split("\n").filter(l => l.trim()).map(line => {
                                    const m = line.match(/^\[?(.+?)\]?:\s*(.+)$/);
                                    return m ? { speaker: m[1].trim(), question: m[2].trim() } : { speaker: "Shareholder", question: line.trim() };
                                  });
                                  if (!questions.length) { toast.error("Paste at least one question"); return; }
                                  try {
                                    const r = await triageMut.mutateAsync({ sessionId: agmSessionId, questions });
                                    toast.success(`${r.triaged.length} triaged, ${r.governanceQuestionCount} governance-related`);
                                  } catch (err: any) { toast.error(err.message); }
                                }} disabled={triageMut.isPending}
                                  className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded text-[10px] font-semibold transition disabled:opacity-50 flex items-center gap-1">
                                  {triageMut.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                                  Triage Questions
                                </button>
                              </div>

                              <div className="bg-white/[0.03] border border-red-500/20 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-xs font-semibold text-white">Regulatory Compliance Scan</span>
                                  </div>
                                  <button onClick={async () => {
                                    const segments = (session.transcriptSegments as any[])?.map?.((s: any, i: number) => ({
                                      speaker: s.speaker ?? "Speaker", text: s.text ?? "", timestamp: s.timestamp ?? i,
                                    })) ?? [];
                                    if (!segments.length) { toast.error("No transcript data available yet"); return; }
                                    try {
                                      const r = await complianceMut.mutateAsync({ sessionId: agmSessionId, transcriptSegments: segments });
                                      toast.success(`${r.alerts.length} compliance alerts, score: ${r.complianceScore}/100`);
                                    } catch (err: any) { toast.error(err.message); }
                                  }} disabled={complianceMut.isPending}
                                    className="px-2.5 py-1 bg-red-700 hover:bg-red-600 rounded text-[10px] font-semibold transition disabled:opacity-50 flex items-center gap-1">
                                    {complianceMut.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                                    Scan Transcript
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-500">Scans live transcript for Companies Act 71, JSE, King IV breaches</p>
                              </div>
                            </div>
                          )}

                          {agmTab === "report" && !agmDashboard.error && (
                            <div className="space-y-3">
                              {agmDashboard.data?.session?.aiGovernanceReport ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                                    <span className="text-xs font-semibold text-white">Board Governance Report</span>
                                  </div>
                                  {Object.entries(agmDashboard.data.session.aiGovernanceReport as Record<string, any>).map(([key, val]) => (
                                    <div key={key} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                                      <div className="text-xs text-slate-300 whitespace-pre-wrap">{typeof val === "string" ? val : JSON.stringify(val, null, 2)}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                  <p className="text-xs text-slate-500 mb-3">Generate a board-ready governance report from this AGM session</p>
                                  <button onClick={() => reportMut.mutate({ sessionId: agmSessionId })} disabled={reportMut.isPending}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 mx-auto">
                                    {reportMut.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><FileText className="w-3.5 h-3.5" />Generate Report</>}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {agmDashboard.data && (
                          <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-slate-500">
                            <span>{agmDashboard.data.resolutions?.length ?? 0} resolutions</span>
                            <span>{agmDashboard.data.session?.quorumMet ? "Quorum met" : "Quorum pending"}</span>
                            <span>{agmDashboard.data.observations?.length ?? 0} observations</span>
                            <Link href="/agm-governance">
                              <span className="text-violet-400 hover:text-violet-300 cursor-pointer ml-auto">Full dashboard →</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Partnership model</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lumi Global manages meeting infrastructure, voting, and governance compliance. CuraLive provides the AI intelligence overlay — sentiment tracking, compliance monitoring, Q&A triage, and post-event analytics. The two platforms are complementary and non-competitive. CuraLive joins Lumi-hosted meetings silently via Recall.ai and writes anonymised records to the industry benchmarks dataset upon session end.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
