// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Radio, Square, Activity,
  AlertTriangle, CheckCircle2, Clock, Loader2,
  Eye, BarChart3, MessageSquare, Zap,
  TrendingUp, TrendingDown, Minus, Play,
  Building2, Target, Brain, Lock,
  FileText, Layers, Search, UserCheck, Mic,
  ChevronRight, Sparkles, GitMerge, LineChart,
} from "lucide-react";

const PACKAGE_FEATURES = [
  {
    icon: Activity,
    title: "Live Sentiment Intelligence",
    desc: "Real-time investor mood tracking throughout earnings calls and corporate events. Sentiment scored every 5 transcript segments and surfaced as a live timeline.",
    tag: "Real-time",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: Shield,
    title: "Compliance Risk Detection",
    desc: "Flags material statements, forward-looking language, insider risk keywords, and Reg FD violations as they occur — before they leave the call.",
    tag: "Governance",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    icon: Mic,
    title: "AI Transcript Intelligence",
    desc: "Full real-time transcription with speaker identification, topic segmentation, and key moment tagging. Persisted for searchable post-event review.",
    tag: "AI",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: MessageSquare,
    title: "Q&A Deep Analysis",
    desc: "Classifies and prioritises analyst questions by investor tier and topic cluster. Surfaces recurring themes and unanswered questions automatically.",
    tag: "Intelligence",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: UserCheck,
    title: "Investor Profiling",
    desc: "Identifies known institutional investors and analysts on the call. Profiles their historical question patterns and sentiment benchmarks.",
    tag: "Profiling",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: Search,
    title: "Market Signal Detection",
    desc: "Scans executive language for hesitation markers, unusual phrasing, and linguistic patterns that may indicate undisclosed material events.",
    tag: "AI",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  {
    icon: LineChart,
    title: "Executive Tone Analysis",
    desc: "Tracks confidence markers, hedging language, and coaching opportunities across calls. Compare CEO tone across quarters to detect drift.",
    tag: "Analytics",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20",
  },
  {
    icon: FileText,
    title: "Post-Event Intelligence Report",
    desc: "AI-generated briefing delivered after every session: engagement arc, sentiment delta, compliance summary, key moments, and executive coaching notes.",
    tag: "Automated",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Zap,
    title: "Event Echo — Content Generation",
    desc: "Instant content from the meeting transcript — press releases, investor summaries, analyst briefings, and social posts ready within minutes of close.",
    tag: "Content",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  {
    icon: BarChart3,
    title: "Industry Benchmark Analytics",
    desc: "Anonymised intelligence from earnings calls and investor events across CuraLive's full client network. Compare your metrics against sector and peer norms.",
    tag: "Data",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
  },
];

const PLATFORM_OPTIONS = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "meet", label: "Google Meet" },
  { value: "webex", label: "Cisco Webex" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "agm", label: "AGM" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "ceo_town_hall", label: "CEO Town Hall" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "webcast", label: "Webcast" },
  { value: "other", label: "Other" },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast", other: "Other",
};

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",     color: "text-slate-400 bg-slate-400/10 border-slate-400/20", dot: "bg-slate-400",                  icon: Clock },
  bot_joining: { label: "Joining",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400 animate-pulse",    icon: Loader2 },
  live:        { label: "Live",        color: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400 animate-pulse",    icon: Radio },
  processing:  { label: "Processing",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",    dot: "bg-blue-400 animate-pulse",     icon: Loader2 },
  completed:   { label: "Completed",   color: "text-violet-400 bg-violet-400/10 border-violet-400/20", dot: "bg-violet-400",             icon: CheckCircle2 },
  failed:      { label: "Failed",      color: "text-red-400 bg-red-400/10 border-red-400/20",       dot: "bg-red-400",                   icon: AlertTriangle },
};

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

export default function Bastion() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"package" | "sessions">("package");
  const [form, setForm] = useState({
    clientName: "", eventName: "",
    eventType: "earnings_call" as const,
    platform: "zoom" as const,
    meetingUrl: "", notes: "",
  });

  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 5000 });
  const activeSession = trpc.shadowMode.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: activeSessionId != null, refetchInterval: 3000 }
  );
  const interventions = trpc.autonomousIntervention.getActive.useQuery(undefined, { refetchInterval: 10000 });

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success("Bastion deployed — joining meeting as CuraLive Intelligence");
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      setActiveTab("sessions");
      setForm({ clientName: "", eventName: "", eventType: "earnings_call", platform: "zoom", meetingUrl: "", notes: "" });
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: () => {
      toast.success("Bastion session ended — intelligence records written");
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.eventName.trim() || !form.meetingUrl.trim()) {
      toast.error("Client name, event name, and meeting URL are required");
      return;
    }
    startSession.mutate(form);
  };

  const session = activeSession.data;
  const isSessionLive = session?.status === "live" || session?.status === "bot_joining";
  const bastionSessions = sessions.data ?? [];
  const totalSessions = bastionSessions.length;
  const liveSessions = bastionSessions.filter(s => s.status === "live" || s.status === "bot_joining").length;
  const avgSentiment = bastionSessions.filter(s => s.sentimentAvg != null).length > 0
    ? bastionSessions.reduce((sum, s) => sum + (s.sentimentAvg ?? 0), 0) / bastionSessions.filter(s => s.sentimentAvg != null).length
    : null;
  const totalFlags = bastionSessions.reduce((sum, s) => sum + (s.complianceFlags ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#080b12] text-white">

      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#080b12]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">Bastion</h1>
                  <span className="text-[10px] font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase">Shadow Testing</span>
                </div>
                <p className="text-xs text-slate-500">Silent intelligence deployment for pre-production validation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveSessions > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {liveSessions} active session{liveSessions > 1 ? "s" : ""}
              </div>
            )}
            <Button
              onClick={() => setShowForm(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm h-9 px-4 gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Deploy Bastion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
          {([
            { key: "package", label: "Integration Package", icon: Layers },
            { key: "sessions", label: "Live Intelligence", icon: Brain },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Bastion persona card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/[0.02] border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Bastion Capital Partners</h2>
                  <span className="text-xs text-slate-400 bg-slate-400/10 border border-slate-400/20 px-2 py-0.5 rounded-full">Simulated Persona</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Institutional investor shadow identity used to validate CuraLive intelligence features against live event environments. Bastion joins as <span className="text-amber-400 font-medium">CuraLive Intelligence</span> — invisible to hosts.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Target, label: "Focus", value: "Large-cap equities" },
                    { icon: Building2, label: "Type", value: "Institutional" },
                    { icon: Lock, label: "Visibility", value: "Silent observer" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</span>
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {[
              { icon: Brain, label: "Total Sessions", value: totalSessions, color: "text-violet-400" },
              { icon: Activity, label: "Avg Sentiment", value: avgSentiment != null ? `${Math.round(avgSentiment * 100)}%` : "—", color: "text-emerald-400" },
              { icon: AlertTriangle, label: "Compliance Flags", value: totalFlags, color: "text-red-400" },
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

        {/* Integration Package tab */}
        {activeTab === "package" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Full Intelligence Suite</h2>
                <p className="text-sm text-slate-400">Every CuraLive AI service available to Bastion Capital Partners across all investor events and corporate calls.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 px-3 py-1.5 rounded-full shrink-0">
                <Sparkles className="w-3 h-3" />
                {PACKAGE_FEATURES.length} services included
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PACKAGE_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 rounded-2xl p-5 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${f.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white">{f.title}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${f.bg} ${f.color} border ${f.border}`}>
                            {f.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-amber-500/[0.06] to-amber-600/[0.03] border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <GitMerge className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">Deploy Intelligence to Any Event</h3>
                  <p className="text-xs text-slate-400 mb-4">Bastion joins investor events as a silent observer — all 10 intelligence services activate the moment the call begins.</p>
                  <Button
                    onClick={() => { setActiveTab("sessions"); setShowForm(true); }}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm h-9 px-4 gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Deploy Bastion
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === "sessions" && <>

        {/* Deploy form */}
        {showForm && (
          <div className="bg-white/[0.02] border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Deploy Bastion to Event</h3>
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
                    placeholder="e.g. Dangote Industries"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Name</label>
                  <input
                    value={form.eventName}
                    onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                    placeholder="e.g. Q4 2025 Earnings Call"
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
                  placeholder="What specifically are you testing?"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={startSession.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2"
                >
                  {startSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deploying...</> : <><Shield className="w-4 h-4" />Deploy Bastion</>}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Main content: session list + live view */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Session list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session History</h3>
              <span className="text-xs text-slate-600">{bastionSessions.length} session{bastionSessions.length !== 1 ? "s" : ""}</span>
            </div>

            {sessions.isLoading && (
              <div className="flex items-center justify-center py-12 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading sessions...
              </div>
            )}

            {!sessions.isLoading && bastionSessions.length === 0 && (
              <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
                <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">No sessions yet</p>
                <p className="text-xs text-slate-700">Deploy Bastion to start shadow testing</p>
              </div>
            )}

            <div className="space-y-2">
              {bastionSessions.map(s => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
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
                      {(s.transcriptSegments ?? 0) > 0 && (
                        <><span>·</span><span className="text-amber-400/70">{s.transcriptSegments} segments</span></>
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

          {/* Intelligence view */}
          <div className="lg:col-span-3">
            {!activeSessionId && (
              <div className="h-full border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                <Eye className="w-10 h-10 text-slate-700 mb-4" />
                <p className="text-sm text-slate-500 mb-1">Select a session to view intelligence</p>
                <p className="text-xs text-slate-700">Or deploy Bastion to start a new shadow session</p>
              </div>
            )}

            {activeSessionId && activeSession.isLoading && (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            )}

            {activeSessionId && session && (
              <div className="space-y-4">
                {/* Session header */}
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

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-500">Sentiment</span>
                    </div>
                    {session.sentimentAvg != null
                      ? <div className="text-2xl font-bold text-emerald-400">{Math.round(session.sentimentAvg * 100)}%</div>
                      : <div className="text-2xl font-bold text-slate-600">—</div>
                    }
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

                {/* Compliance flags */}
                {(session.complianceFlags ?? 0) > 0 && (
                  <div className="bg-red-500/[0.05] border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">Compliance Flags Detected</span>
                    </div>
                    <p className="text-xs text-red-300/70">
                      {session.complianceFlags} compliance keyword{(session.complianceFlags ?? 0) > 1 ? "s" : ""} detected during this session. Review transcript for material statements or forward-looking language.
                    </p>
                  </div>
                )}

                {/* Tagged metrics */}
                {(session.taggedMetricsGenerated ?? 0) > 0 && (
                  <div className="bg-violet-500/[0.05] border border-violet-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-semibold text-violet-400">Intelligence Records Written</span>
                    </div>
                    <p className="text-xs text-violet-300/70">
                      {session.taggedMetricsGenerated} tagged metric record{(session.taggedMetricsGenerated ?? 0) > 1 ? "s" : ""} generated. 1 anonymized record added to industry benchmarks.
                    </p>
                  </div>
                )}

                {/* Live status */}
                {isSessionLive && (
                  <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Bastion is active</p>
                      <p className="text-xs text-amber-300/60">Joined as "CuraLive Intelligence" — collecting transcript and scoring in real time</p>
                    </div>
                  </div>
                )}

                {/* Completed summary */}
                {session.status === "completed" && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-semibold text-white">Session Summary</span>
                    </div>
                    <div className="space-y-2">
                      <SentimentBar value={session.sentimentAvg} />
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                        <span>{session.transcriptSegments ?? 0} transcript segments captured</span>
                        <span>{session.complianceFlags ?? 0} compliance keywords detected</span>
                        <span>{session.taggedMetricsGenerated ?? 0} intelligence records written</span>
                        <span>1 anonymized benchmark record</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Autonomous interventions */}
        {(interventions.data?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Active Interventions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(interventions.data ?? []).slice(0, 6).map((inv: any) => (
                <div key={inv.id} className="bg-white/[0.02] border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-400">{inv.type?.replace(/_/g, " ").toUpperCase()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      inv.status === "completed" ? "text-violet-400 bg-violet-400/10" :
                      inv.status === "active" ? "text-amber-400 bg-amber-400/10" :
                      "text-slate-400 bg-slate-400/10"
                    }`}>{inv.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{inv.description ?? inv.action ?? "Intervention triggered"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        </>}

        {/* Info footer */}
        <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">How Bastion works</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bastion deploys a silent bot named "CuraLive Intelligence" into any Zoom, Teams, Google Meet, or Webex meeting via Recall.ai. It collects the live transcript, scores sentiment every 5 segments, scans for compliance keywords, and writes tagged intelligence records on session end. All data is logged and an anonymized record is added to the industry benchmarks dataset. The host and participants cannot see the bot's intelligence activity.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
