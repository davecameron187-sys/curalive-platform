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
} from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "meet", label: "Google Meet" },
  { value: "webex", label: "Cisco Webex" },
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
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", other: "Other",
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
  const [activeTab, setActiveTab] = useState<"package" | "sessions">("package");
  const [form, setForm] = useState({
    clientName: "Lumi Global",
    eventName: "",
    eventType: "agm" as const,
    platform: "zoom" as const,
    meetingUrl: "",
    notes: "",
  });

  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 5000 });
  const activeSession = trpc.shadowMode.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: activeSessionId != null, refetchInterval: 3000 }
  );

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success("CuraLive Intelligence deployed to Lumi meeting");
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      setActiveTab("sessions");
      sessions.refetch();
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
    startSession.mutate(form);
  };

  const session = activeSession.data;
  const isSessionLive = session?.status === "live" || session?.status === "bot_joining";
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
