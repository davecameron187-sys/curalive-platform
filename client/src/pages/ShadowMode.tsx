import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Radio, Play, Square, Eye, EyeOff,
  Activity, Shield, Users, MessageSquare, Tag,
  CheckCircle2, AlertTriangle, Clock, Loader2,
  Building2, RefreshCw, BarChart3, FileText,
  Upload, Database, ChevronRight, BarChart2,
  Mic, FileAudio,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", other: "Other",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast", other: "Other",
};

const ARCHIVE_PLATFORMS = ["Zoom", "Microsoft Teams", "Google Meet", "Webex", "In-Person", "Other"];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",     color: "text-slate-400 bg-slate-400/10 border-slate-400/20",      dot: "bg-slate-400",                      icon: Clock },
  bot_joining: { label: "Bot Joining", color: "text-amber-400 bg-amber-400/10 border-amber-400/20",      dot: "bg-amber-400 animate-pulse",        icon: Loader2 },
  live:        { label: "Live",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400 animate-pulse",      icon: Radio },
  processing:  { label: "Processing",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",         dot: "bg-blue-400 animate-pulse",          icon: Loader2 },
  completed:   { label: "Completed",   color: "text-violet-400 bg-violet-400/10 border-violet-400/20",   dot: "bg-violet-400",                     icon: CheckCircle2 },
  failed:      { label: "Failed",      color: "text-red-400 bg-red-400/10 border-red-400/20",            dot: "bg-red-400",                        icon: AlertTriangle },
};

type SessionStatus = "pending" | "bot_joining" | "live" | "processing" | "completed" | "failed";

function SessionCard({ session, onSelect, isSelected }: {
  session: { id: number; clientName: string; eventName: string; eventType: string; platform: string; status: string; transcriptSegments: number | null; taggedMetricsGenerated: number | null; sentimentAvg: number | null; createdAt: Date };
  onSelect: () => void;
  isSelected: boolean;
}) {
  const s = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
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

type ArchiveResult = {
  archiveId: number;
  eventId: string;
  eventTitle: string;
  wordCount: number;
  segmentCount: number;
  sentimentAvg: number;
  complianceFlags: number;
  metricsGenerated: number;
  message: string;
};

export default function ShadowMode() {
  const goBack = useSmartBack("/operator-links");

  // Tab state
  const [activeTab, setActiveTab] = useState<"live" | "archive" | "recording">("live");

  // ── Live Intelligence state ────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
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

  // ── Archive Upload state ───────────────────────────────────────────────────
  const [archiveForm, setArchiveForm] = useState({
    clientName: "", eventName: "", eventType: "", eventDate: "",
    platform: "", notes: "", transcriptText: "",
  });
  const [archiveInputMode, setArchiveInputMode] = useState<"paste" | "file">("paste");
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processTranscript = trpc.archiveUpload.processTranscript.useMutation({
    onSuccess: (data) => {
      setArchiveResult(data);
      toast.success(data.message);
      archives.refetch();
    },
    onError: (err) => toast.error(err.message ?? "Processing failed. Please try again."),
  });

  const archives = trpc.archiveUpload.listArchives.useQuery();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchiveFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setArchiveForm(f => ({ ...f, transcriptText: (ev.target?.result as string) ?? "" }));
    };
    reader.readAsText(file);
  }

  function handleArchiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!archiveForm.clientName.trim() || !archiveForm.eventName.trim() || !archiveForm.eventType || !archiveForm.transcriptText.trim()) {
      toast.error("Please fill in Client Name, Event Name, Event Type, and the transcript.");
      return;
    }
    processTranscript.mutate({
      clientName: archiveForm.clientName.trim(),
      eventName: archiveForm.eventName.trim(),
      eventType: archiveForm.eventType as any,
      eventDate: archiveForm.eventDate || undefined,
      platform: archiveForm.platform || undefined,
      transcriptText: archiveForm.transcriptText.trim(),
      notes: archiveForm.notes || undefined,
    });
  }

  function resetArchive() {
    setArchiveResult(null);
    setArchiveForm({ clientName: "", eventName: "", eventType: "", eventDate: "", platform: "", notes: "", transcriptText: "" });
    setArchiveFileName(null);
  }

  const archiveWordCount = archiveForm.transcriptText.trim().split(/\s+/).filter(Boolean).length;

  // ── Event Recording state ──────────────────────────────────────────────────
  const [recForm, setRecForm] = useState({
    clientName: "", eventName: "",
    eventType: "earnings_call",
    eventDate: "", notes: "",
  });
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recStatus, setRecStatus] = useState<"idle" | "transcribing" | "processing" | "done" | "error">("idle");
  const [recResult, setRecResult] = useState<ArchiveResult | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setRecFile(f);
  }

  async function handleRecordingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recForm.clientName.trim() || !recForm.eventName.trim() || !recForm.eventType || !recFile) {
      toast.error("Please fill in all required fields and select an audio file.");
      return;
    }
    setRecStatus("transcribing");
    setRecError(null);
    try {
      const fd = new FormData();
      fd.append("file", recFile);
      const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Transcription failed" }));
        throw new Error(data.error ?? "Transcription failed");
      }
      const { transcript } = await res.json();
      setRecStatus("processing");
      processTranscript.mutate({
        clientName: recForm.clientName.trim(),
        eventName: recForm.eventName.trim(),
        eventType: recForm.eventType as any,
        eventDate: recForm.eventDate || undefined,
        transcriptText: transcript,
        notes: recForm.notes || undefined,
      }, {
        onSuccess: (data) => {
          setRecResult(data);
          setRecStatus("done");
          toast.success("Recording transcribed and processed successfully");
          archives.refetch();
        },
        onError: (err) => {
          setRecError(err.message ?? "Processing failed");
          setRecStatus("error");
          toast.error(err.message ?? "Processing failed");
        },
      });
    } catch (err: any) {
      setRecError(err.message ?? "Transcription failed");
      setRecStatus("error");
      toast.error(err.message ?? "Transcription failed");
    }
  }

  function resetRecording() {
    setRecResult(null);
    setRecStatus("idle");
    setRecError(null);
    setRecFile(null);
    setRecForm({ clientName: "", eventName: "", eventType: "earnings_call", eventDate: "", notes: "" });
  }

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
          {activeTab === "live" && (
            <Button onClick={() => setShowForm(!showForm)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              <Play className="w-4 h-4" />
              New Session
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "live"
                  ? "border-emerald-400 text-emerald-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Radio className="w-4 h-4" />
              Live Intelligence
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "archive"
                  ? "border-violet-400 text-violet-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Upload className="w-4 h-4" />
              Archive Upload
              {archives.data && archives.data.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                  {archives.data.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("recording")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "recording"
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Mic className="w-4 h-4" />
              Event Recording
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════
            LIVE INTELLIGENCE TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "live" && (
          <>
            {/* How it works banner */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <EyeOff className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">How Shadow Mode works</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Paste any Zoom, Teams, or Meet link from a live event. CuraLive deploys an invisible intelligence bot that joins as{" "}
                  <span className="text-slate-200 font-medium">"CuraLive Intelligence"</span> — it transcribes the entire event in real time, scores sentiment every 5 segments, detects compliance keywords, and automatically stores everything in your Tagged Metrics database when the session ends. Your clients see a regular participant name. You get a full intelligence record of every event you run.
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
                    <label className="text-xs text-slate-500 block mb-1.5">Meeting URL * (Zoom / Teams / Meet invite link)</label>
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
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Session list */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Sessions ({sessions.data?.length ?? 0})
                </h2>
                {sessions.isLoading && <div className="text-slate-500 text-sm">Loading sessions...</div>}
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
                              <Button size="sm"
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

                      {liveSession.status === "bot_joining" && (
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-amber-300">CuraLive Intelligence is joining the meeting</div>
                            <div className="text-xs text-slate-500 mt-0.5">The bot will appear as a participant within 30–60 seconds. Transcription starts automatically once it joins.</div>
                          </div>
                        </div>
                      )}

                      {liveSession.status === "completed" && liveSession.taggedMetricsGenerated != null && liveSession.taggedMetricsGenerated > 0 && (
                        <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-violet-300">Intelligence collection complete</div>
                            <div className="text-xs text-slate-500 mt-0.5">{liveSession.taggedMetricsGenerated} records added to your Tagged Metrics database.</div>
                          </div>
                        </div>
                      )}

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
                { icon: EyeOff, color: "text-emerald-400", title: "Invisible to clients", desc: "The bot joins as 'CuraLive Intelligence' — a standard named participant. Your clients see a normal event with a regular participant name." },
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
          </>
        )}

        {/* ══════════════════════════════════════════════════
            ARCHIVE UPLOAD TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "archive" && (
          <>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
                <Upload className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">Archive Upload — build your database retroactively</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Upload any past event transcript — earnings calls, AGMs, town halls — and CuraLive will process it through the same intelligence pipeline as a live Shadow Mode session. Paste text directly or upload a .txt file. Each archive generates 4 tagged intelligence records in your database.
                </p>
              </div>
            </div>

            {archiveResult ? (
              /* ── Results ── */
              <div className="space-y-6">
                <div className="bg-white/[0.03] border border-violet-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-violet-400" />
                    <div>
                      <h2 className="font-semibold text-slate-200">Archive Processed Successfully</h2>
                      <p className="text-sm text-slate-500">{archiveResult.eventTitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Words Processed", value: archiveResult.wordCount.toLocaleString(), color: "text-violet-400" },
                      { label: "Segments", value: archiveResult.segmentCount, color: "text-blue-400" },
                      {
                        label: "Sentiment Score",
                        value: archiveResult.sentimentAvg,
                        color: archiveResult.sentimentAvg >= 70 ? "text-emerald-400" : archiveResult.sentimentAvg >= 50 ? "text-amber-400" : "text-red-400",
                      },
                      {
                        label: "Compliance Flags",
                        value: archiveResult.complianceFlags,
                        color: archiveResult.complianceFlags > 3 ? "text-red-400" : archiveResult.complianceFlags > 1 ? "text-amber-400" : "text-emerald-400",
                      },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className="text-xs text-slate-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-slate-200">{archiveResult.metricsGenerated} intelligence records added to database</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      {["Sentiment score tagged", "Engagement score tagged", "Compliance risk tagged", "Archive session confirmed"].map(l => (
                        <div key={l} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-violet-400" />
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="/tagged-metrics"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors">
                      <Database className="w-4 h-4" />
                      View Tagged Metrics Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </a>
                    <button onClick={resetArchive}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Another Archive
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleArchiveSubmit} className="space-y-5">

                {/* Event details */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Event Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="e.g. Anglo American Platinum"
                        value={archiveForm.clientName}
                        onChange={e => setArchiveForm(f => ({ ...f, clientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="e.g. Q4 2024 Earnings Call"
                        value={archiveForm.eventName}
                        onChange={e => setArchiveForm(f => ({ ...f, eventName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.eventType}
                        onChange={e => setArchiveForm(f => ({ ...f, eventType: e.target.value }))}
                        required>
                        <option value="">Select type...</option>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Date</label>
                      <input
                        type="date"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.eventDate}
                        onChange={e => setArchiveForm(f => ({ ...f, eventDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Platform</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.platform}
                        onChange={e => setArchiveForm(f => ({ ...f, platform: e.target.value }))}>
                        <option value="">Select platform...</option>
                        {ARCHIVE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Notes</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="Any context about this event..."
                        value={archiveForm.notes}
                        onChange={e => setArchiveForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Transcript input */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4">
                    Transcript <span className="text-red-400">*</span>
                  </h2>
                  <div className="flex gap-2 mb-4">
                    {(["paste", "file"] as const).map(mode => (
                      <button key={mode} type="button"
                        onClick={() => setArchiveInputMode(mode)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          archiveInputMode === mode
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}>
                        {mode === "paste" ? "Paste Text" : "Upload .txt File"}
                      </button>
                    ))}
                  </div>

                  {archiveInputMode === "paste" ? (
                    <div>
                      <textarea
                        value={archiveForm.transcriptText}
                        onChange={e => setArchiveForm(f => ({ ...f, transcriptText: e.target.value }))}
                        placeholder="Paste the full event transcript here. Speaker labels, timestamps, Q&A sections — paste it as-is."
                        rows={14}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-y"
                        required
                      />
                      {archiveForm.transcriptText && (
                        <p className="text-xs text-slate-600 mt-2">{archiveWordCount.toLocaleString()} words detected</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        onClick={() => fileRef.current?.click()}>
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        {archiveFileName ? (
                          <div>
                            <p className="font-medium text-sm text-slate-200">{archiveFileName}</p>
                            <p className="text-xs text-slate-500 mt-1">{archiveWordCount.toLocaleString()} words loaded</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-slate-300 mb-1">Click to upload a .txt file</p>
                            <p className="text-xs text-slate-600">Plain text transcripts only. Up to 500,000 characters.</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept=".txt,text/plain" onChange={handleFileChange} className="hidden" />
                      {archiveForm.transcriptText && (
                        <div className="mt-3 p-3 bg-white/[0.02] rounded-lg border border-white/10">
                          <p className="text-xs text-slate-600 font-mono line-clamp-2">{archiveForm.transcriptText.slice(0, 200)}...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* What happens */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">What CuraLive will do with this transcript</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: BarChart2, label: "Score sentiment", desc: "AI scores 0–100" },
                      { icon: Users, label: "Measure engagement", desc: "Segment & word count" },
                      { icon: Shield, label: "Scan compliance", desc: "10 keyword checks" },
                      { icon: Database, label: "Tag 4 records", desc: "Added to database" },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="text-center">
                        <div className="p-2 rounded-lg bg-violet-500/10 w-fit mx-auto mb-2">
                          <Icon className="w-4 h-4 text-violet-400" />
                        </div>
                        <p className="text-xs font-medium text-slate-300">{label}</p>
                        <p className="text-xs text-slate-600">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={processTranscript.isPending}
                  className="w-full bg-violet-600 hover:bg-violet-500 gap-2 py-5">
                  {processTranscript.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing archive...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Process Archive &amp; Generate Intelligence</>
                  )}
                </Button>
              </form>
            )}

            {/* Previous archives */}
            {archives.data && archives.data.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Previously Uploaded Archives ({archives.data.length})
                </h3>
                <div className="space-y-3">
                  {archives.data.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{a.client_name} — {a.event_name}</div>
                        <div className="text-xs text-slate-600">
                          {a.event_date ?? "No date"} &nbsp;·&nbsp;
                          {a.word_count.toLocaleString()} words &nbsp;·&nbsp;
                          {a.tagged_metrics_generated} intelligence records
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.status === "completed"
                          ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
                          : "text-slate-500 bg-white/5 border-white/10"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            EVENT RECORDING TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "recording" && (
          <>
            {/* How it works banner */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                <Mic className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">How Event Recording works</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Upload any audio or video recording of an event — from a screen recording, phone capture, or downloaded replay. CuraLive sends the audio to OpenAI Whisper for transcription, then runs the full intelligence pipeline automatically: sentiment scoring, compliance scanning, 4 tagged records added to your database, and one anonymized record added to the industry benchmarks dataset. No manual transcription needed.
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Supported formats: MP3, MP4, WAV, M4A, WebM, OGG &nbsp;·&nbsp; Max 25MB per file &nbsp;·&nbsp; Tip: record audio-only at 64kbps for best compression
                </p>
              </div>
            </div>

            {/* Done state */}
            {recStatus === "done" && recResult && (
              <div className="bg-white/[0.03] border border-blue-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Recording processed successfully</div>
                    <div className="text-xs text-slate-500">{recResult.eventTitle}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Words transcribed", value: recResult.wordCount.toLocaleString() },
                    { label: "Segments", value: recResult.segmentCount },
                    { label: "Sentiment score", value: `${recResult.sentimentAvg}/100` },
                    { label: "Intelligence records", value: recResult.metricsGenerated },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.02] border border-white/10 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-400">{value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={resetRecording} variant="outline"
                    className="border-white/10 text-slate-400 hover:text-white">
                    Process Another Recording
                  </Button>
                  <Button onClick={() => window.location.href = "/tagged-metrics"}
                    className="bg-blue-600 hover:bg-blue-500 gap-2">
                    <Database className="w-4 h-4" /> View Intelligence Database
                  </Button>
                </div>
              </div>
            )}

            {/* Error state */}
            {recStatus === "error" && recError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-red-300 mb-1">Transcription failed</div>
                  <p className="text-sm text-slate-400">{recError}</p>
                  <Button onClick={resetRecording} size="sm" variant="outline"
                    className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Transcribing / processing spinner */}
            {(recStatus === "transcribing" || recStatus === "processing") && (
              <div className="bg-white/[0.02] border border-blue-500/20 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {recStatus === "transcribing" ? "Transcribing audio..." : "Processing intelligence..."}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {recStatus === "transcribing"
                      ? "Sending to Whisper AI. This takes 30 seconds to 3 minutes depending on file length."
                      : "Scoring sentiment, scanning compliance, writing intelligence records..."}
                  </p>
                </div>
              </div>
            )}

            {/* Upload form */}
            {recStatus === "idle" && (
              <form onSubmit={handleRecordingSubmit} className="space-y-6">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-blue-400" /> Event Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="e.g. Anglo American Platinum"
                        value={recForm.clientName}
                        onChange={e => setRecForm(f => ({ ...f, clientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="e.g. Q4 2025 Earnings Webcast"
                        value={recForm.eventName}
                        onChange={e => setRecForm(f => ({ ...f, eventName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                        value={recForm.eventType}
                        onChange={e => setRecForm(f => ({ ...f, eventType: e.target.value }))}>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Date (optional)</label>
                      <input type="date"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                        value={recForm.eventDate}
                        onChange={e => setRecForm(f => ({ ...f, eventDate: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-500 block mb-1.5">Notes (optional)</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="Any context about this recording..."
                        value={recForm.notes}
                        onChange={e => setRecForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* File upload */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-400" /> Audio / Video File *
                  </h2>
                  <div
                    className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors"
                    onClick={() => audioFileRef.current?.click()}>
                    <Mic className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    {recFile ? (
                      <div>
                        <p className="font-medium text-sm text-slate-200">{recFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(recFile.size / 1024 / 1024).toFixed(1)} MB
                          {recFile.size > 20 * 1024 * 1024 && (
                            <span className="text-amber-400 ml-2">· Large file — transcription may take 2–3 minutes</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm text-slate-300 mb-1">Click to select an audio or video file</p>
                        <p className="text-xs text-slate-600">MP3, MP4, WAV, M4A, WebM, OGG &nbsp;·&nbsp; Max 25MB</p>
                        <p className="text-xs text-slate-700 mt-1">For files over 25MB, convert to MP3 at 64kbps first</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept=".mp3,.mp4,.wav,.m4a,.webm,.ogg,.flac,.aac,audio/*,video/mp4,video/webm"
                    onChange={handleAudioFileChange}
                    className="hidden"
                  />
                </div>

                {/* What happens next */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">What CuraLive does with this recording</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: Mic, label: "Transcribe audio", desc: "OpenAI Whisper AI" },
                      { icon: BarChart2, label: "Score sentiment", desc: "AI scores 0–100" },
                      { icon: Shield, label: "Scan compliance", desc: "10 keyword checks" },
                      { icon: Database, label: "Tag 4 records", desc: "Added to database" },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="text-center">
                        <div className="p-2 rounded-lg bg-blue-500/10 w-fit mx-auto mb-2">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-slate-300">{label}</p>
                        <p className="text-xs text-slate-600">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={!recFile}
                  className="w-full bg-blue-600 hover:bg-blue-500 gap-2 py-5">
                  <Mic className="w-4 h-4" /> Transcribe &amp; Process Intelligence
                </Button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
