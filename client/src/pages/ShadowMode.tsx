import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Radio, Play, Square, Eye, EyeOff,
  Activity, Shield, Users, MessageSquare, Tag,
  CheckCircle2, AlertTriangle, Clock, Loader2,
  Building2, ChevronDown, ChevronUp, RefreshCw,
  Wifi, WifiOff, BarChart3, FileText
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", other: "Other"
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast", other: "Other"
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",     color: "text-slate-400 bg-slate-400/10 border-slate-400/20",   dot: "bg-slate-400",                          icon: Clock },
  bot_joining: { label: "Bot Joining", color: "text-amber-400 bg-amber-400/10 border-amber-400/20",   dot: "bg-amber-400 animate-pulse",            icon: Loader2 },
  live:        { label: "Live",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400 animate-pulse",      icon: Radio },
  processing:  { label: "Processing",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",      dot: "bg-blue-400 animate-pulse",             icon: Loader2 },
  completed:   { label: "Completed",   color: "text-violet-400 bg-violet-400/10 border-violet-400/20",dot: "bg-violet-400",                         icon: CheckCircle2 },
  failed:      { label: "Failed",      color: "text-red-400 bg-red-400/10 border-red-400/20",         dot: "bg-red-400",                            icon: AlertTriangle },
};

type SessionStatus = "pending" | "bot_joining" | "live" | "processing" | "completed" | "failed";

function SessionCard({ session, onSelect, isSelected }: {
  session: { id: number; clientName: string; eventName: string; eventType: string; platform: string; status: string; transcriptSegments: number | null; taggedMetricsGenerated: number | null; sentimentAvg: number | null; createdAt: Date };
  onSelect: () => void;
  isSelected: boolean;
}) {
  const s = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
  const Icon = s.icon;
  return (
    <button onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
        ? "border-violet-500/50 bg-violet-500/10"
        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{session.eventName}</div>
          <div className="text-xs text-slate-500 truncate">{session.clientName}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${s.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span>{EVENT_TYPE_LABELS[session.eventType] ?? session.eventType}</span>
        <span>·</span>
        <span>{PLATFORM_LABELS[session.platform] ?? session.platform}</span>
        {session.taggedMetricsGenerated != null && session.taggedMetricsGenerated > 0 && (
          <><span>·</span><span className="text-violet-400">{session.taggedMetricsGenerated} metrics</span></>
        )}
      </div>
    </button>
  );
}

export default function ShadowMode() {
  const goBack = useSmartBack("/operator-links");
  const [showForm, setShowForm] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

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

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success("CuraLive Intelligence bot is joining the meeting");
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const webhookBase = typeof window !== "undefined"
    ? window.location.origin
    : "https://localhost:5000";

  const liveSession = activeSession.data;
  const transcript = liveSession?.transcriptSegments ?? [];
  const isLive = liveSession?.status === "live" || liveSession?.status === "bot_joining";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={goBack}
              className="text-slate-400 hover:text-white gap-2 px-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h1 className="text-lg font-semibold">Shadow Mode</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Background Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                CuraLive runs silently — clients see nothing
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
            <Play className="w-4 h-4" />
            New Session
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* How it works banner */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <EyeOff className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-1">How Shadow Mode works with Bastion Group events</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paste any Zoom, Teams, or Meet link from a Bastion webcast. CuraLive deploys an invisible intelligence bot that joins as <span className="text-slate-200 font-medium">"CuraLive Intelligence"</span> — it transcribes the entire event in real time, scores sentiment every 5 segments, detects compliance keywords, and automatically stores everything in your Tagged Metrics database when the session ends. Your clients see a regular participant name. You get a full intelligence record of every event you run.
            </p>
          </div>
        </div>

        {/* New session form */}
        {showForm && (
          <div className="bg-white/[0.03] border border-emerald-500/20 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-5 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" /> Start a New Shadow Intelligence Session
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. Anglo American Platinum"
                  value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. Q4 2025 Earnings Call"
                  value={form.eventName}
                  onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  value={form.eventType}
                  onChange={e => setForm(f => ({ ...f, eventType: e.target.value as typeof form.eventType }))}>
                  {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Platform *</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value as typeof form.platform }))}>
                  {Object.entries(PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 block mb-1.5">Meeting URL * (Zoom/Teams/Meet invite link)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                  value={form.meetingUrl}
                  onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 block mb-1.5">Notes (optional)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Any context about this event..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Button
                onClick={() => startSession.mutate({ ...form, webhookBaseUrl: webhookBase })}
                disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
                className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                {startSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {startSession.isPending ? "Deploying bot..." : "Start Shadow Intelligence"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Session list */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Sessions ({sessions.data?.length ?? 0})
            </h2>
            {sessions.isLoading && (
              <div className="text-slate-500 text-sm">Loading sessions...</div>
            )}
            {sessions.data?.length === 0 && !sessions.isLoading && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center">
                <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No sessions yet</div>
                <div className="text-xs text-slate-600 mt-1">Start your first shadow session above</div>
              </div>
            )}
            {sessions.data?.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onSelect={() => setActiveSessionId(session.id)}
                isSelected={activeSessionId === session.id}
              />
            ))}
          </div>

          {/* Active session detail */}
          <div className="lg:col-span-2">
            {activeSessionId == null ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <div className="text-slate-500 text-sm">Select a session to view live intelligence</div>
                <div className="text-slate-600 text-xs mt-1">Or start a new session to begin collecting data</div>
              </div>
            ) : activeSession.isLoading ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-spin" />
                <div className="text-slate-500 text-sm">Loading session...</div>
              </div>
            ) : liveSession ? (() => {
              const s = STATUS_CONFIG[liveSession.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = s.icon;
              const isActive = liveSession.status === "live" || liveSession.status === "bot_joining";
              const duration = liveSession.startedAt
                ? Math.floor((Date.now() - liveSession.startedAt) / 1000 / 60)
                : 0;

              return (
                <div className="space-y-4">
                  {/* Session header */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="text-base font-semibold text-slate-200">{liveSession.eventName}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${s.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{liveSession.clientName}</span>
                          <span>·</span>
                          <span>{EVENT_TYPE_LABELS[liveSession.eventType]}</span>
                          <span>·</span>
                          <span>{PLATFORM_LABELS[liveSession.platform]}</span>
                          {liveSession.startedAt && (
                            <><span>·</span><span>{duration}m elapsed</span></>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm"
                          onClick={() => activeSession.refetch()}
                          className="text-slate-400 hover:text-white">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => endSession.mutate({ sessionId: liveSession.id })}
                            disabled={endSession.isPending}
                            className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/20 gap-1.5">
                            {endSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                            End Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Transcript Segments", value: liveSession.transcriptSegments ?? 0, icon: MessageSquare, color: "text-blue-400" },
                      { label: "Avg Sentiment", value: liveSession.sentimentAvg != null ? `${Math.round(liveSession.sentimentAvg)}%` : "—", icon: Activity, color: "text-emerald-400" },
                      { label: "Compliance Flags", value: liveSession.complianceFlags ?? 0, icon: Shield, color: "text-amber-400" },
                      { label: "Metrics Generated", value: liveSession.taggedMetricsGenerated ?? 0, icon: Tag, color: "text-violet-400" },
                    ].map(stat => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                          <Icon className={`w-4 h-4 ${stat.color} mb-2`} />
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-xs text-slate-600 mt-0.5">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bot joining state */}
                  {liveSession.status === "bot_joining" && (
                    <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-amber-300">CuraLive Intelligence is joining the meeting</div>
                        <div className="text-xs text-slate-500 mt-0.5">The bot will appear as a participant within 30–60 seconds. Transcription starts automatically once it joins.</div>
                      </div>
                    </div>
                  )}

                  {/* Completed state */}
                  {liveSession.status === "completed" && liveSession.taggedMetricsGenerated != null && liveSession.taggedMetricsGenerated > 0 && (
                    <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-violet-300">Intelligence collection complete</div>
                        <div className="text-xs text-slate-500 mt-0.5">{liveSession.taggedMetricsGenerated} records added to your Tagged Metrics database. View them in the Tagged Metrics Dashboard.</div>
                      </div>
                    </div>
                  )}

                  {/* Transcript feed */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300 font-medium">Live Transcript</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <span className="text-xs text-slate-600">{transcript.length} segments</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {transcript.length === 0 ? (
                        <div className="p-8 text-center text-slate-600 text-sm">
                          {isActive ? "Waiting for speech..." : "No transcript captured"}
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {[...transcript].reverse().slice(0, 30).map((seg, i) => (
                            <div key={i} className="px-5 py-3 flex items-start gap-3">
                              <div className="text-xs text-slate-600 font-mono shrink-0 pt-0.5 w-10">
                                {(seg as { timeLabel?: string }).timeLabel ?? "—"}
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-violet-300 mr-2">{seg.speaker}</span>
                                <span className="text-sm text-slate-300">{seg.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {liveSession.notes && (
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-sm text-slate-500">
                      <span className="text-slate-600 text-xs uppercase tracking-wider mr-2">Notes:</span>
                      {liveSession.notes}
                    </div>
                  )}
                </div>
              );
            })() : null}
          </div>
        </div>

        {/* Bottom explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: EyeOff, color: "text-emerald-400", title: "Invisible to clients", desc: "The bot joins as 'CuraLive Intelligence' — a standard named participant. Bastion's clients see a normal meeting." },
            { icon: Activity, color: "text-blue-400", title: "Real-time analysis", desc: "Sentiment scored every 5 transcript segments. Compliance keywords flagged automatically. All data flows into your database." },
            { icon: Tag, color: "text-violet-400", title: "Database compounds", desc: "Every session adds structured intelligence records. After 10 events, you have baselines. After 50, you have investor profiles." },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <Icon className={`w-5 h-5 ${card.color} mb-3`} />
                <div className="text-sm font-semibold text-slate-300 mb-1">{card.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
