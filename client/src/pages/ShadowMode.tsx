// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Radio, Play, Square, Eye, EyeOff,
  Activity, Shield, Users, MessageSquare, Tag,
  CheckCircle2, AlertTriangle, Clock, Loader2,
  Building2, RefreshCw, BarChart3, FileText,
  Upload, Database, ChevronRight, BarChart2,
  Mic, FileAudio, Globe, Phone, Copy, Hash,
  KeyRound, CalendarClock, Info,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", webphone: "Webphone", other: "Other",
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
  const [, navigate] = useLocation();

  useEffect(() => {
    window.history.pushState(null, "", "/shadow-mode");
    const handlePopState = () => {
      navigate("/shadow-mode");
      window.history.pushState(null, "", "/shadow-mode");
    };
    window.addEventListener("popstate", handlePopState, true);
    return () => window.removeEventListener("popstate", handlePopState, true);
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState<"live" | "archive" | "reports" | "recording" | "ccaudio" | "ailearning">("live");

  // ── CC Audio Only state ────────────────────────────────────────────────────
  const [ccForm, setCcForm] = useState({
    clientName: "", eventName: "",
    eventType: "earnings_call",
    dialInNumber: "", conferenceId: "",
    accessCode: "", hostPin: "",
    scheduledAt: "", notes: "",
  });
  const [ccSessions, setCcSessions] = useState<Array<{
    id: number; clientName: string; eventName: string; eventType: string;
    dialInNumber: string; conferenceId: string; accessCode: string;
    hostPin: string; scheduledAt: string; notes: string; loggedAt: string;
  }>>([]);
  const [ccNextId, setCcNextId] = useState(1);
  const [ccShowForm, setCcShowForm] = useState(false);
  const [ccPlatformMode, setCcPlatformMode] = useState<"dialin" | "webphone">("dialin");

  // ── Bridge Dial-Out state ──────────────────────────────────────────────────
  type BridgeEntry = { callSid: string; status: string; dialing: boolean };
  const [bridgeCalls, setBridgeCalls] = useState<Record<number, BridgeEntry>>({});

  const dialOutMutation = trpc.shadowMode.dialOutToBridge.useMutation({
    onSuccess: (data, vars) => {
      setBridgeCalls(prev => ({
        ...prev,
        [vars.sessionId as any]: { callSid: data.callSid, status: data.status, dialing: false },
      }));
      toast.success("Dialling bridge — DTMF codes will be sent automatically after answer");
    },
    onError: (e) => {
      toast.error(e.message);
      // clear dialing flag
      setBridgeCalls(prev => {
        const next = { ...prev };
        for (const k in next) if (next[k].dialing) next[k] = { ...next[k], dialing: false };
        return next;
      });
    },
  });

  const hangupMutation = trpc.shadowMode.hangupBridgeCall.useMutation({
    onSuccess: (_data, vars) => {
      setBridgeCalls(prev => {
        const next = { ...prev };
        for (const k in next) if (next[k].callSid === vars.callSid) next[k] = { ...next[k], status: "completed" };
        return next;
      });
      toast.success("Bridge call disconnected");
    },
    onError: (e) => toast.error(e.message),
  });

  // Poll status for active bridge calls every 4 seconds
  useEffect(() => {
    const active = Object.values(bridgeCalls).filter(b => ["queued","ringing","in-progress","initiated"].includes(b.status));
    if (active.length === 0) return;
    const timer = setInterval(async () => {
      for (const entry of active) {
        try {
          const res = await fetch(`/api/shadow/bridge-poll?callSid=${entry.callSid}`).then(r => r.json());
          if (res.status) {
            setBridgeCalls(prev => {
              const next = { ...prev };
              for (const k in next) if (next[k].callSid === entry.callSid) next[k] = { ...next[k], status: res.status };
              return next;
            });
          }
        } catch (_) {}
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [bridgeCalls]);

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

  // ── Archives & Reports state ─────────────────────────────────────────────────
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(null);
  const [emailModalArchiveId, setEmailModalArchiveId] = useState<number | null>(null);
  const [emailForm, setEmailForm] = useState({ recipientEmail: "", recipientName: "" });

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: selectedArchiveId! },
    { enabled: selectedArchiveId != null }
  );

  const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setEmailModalArchiveId(null);
        setEmailForm({ recipientEmail: "", recipientName: "" });
      } else {
        toast.error(data.message);
      }
    },
    onError: (e) => toast.error(e.message),
  });

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
          <div className="flex items-center gap-3">
            <a href="/lumi"
              className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-full hover:bg-cyan-400/20 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              Lumi Integration
            </a>
            <a href="/bastion"
              className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full hover:bg-amber-400/20 transition-colors">
              <Shield className="w-3.5 h-3.5" />
              Bastion Testing
            </a>
            {activeTab === "live" && (
              <Button onClick={() => setShowForm(!showForm)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                <Play className="w-4 h-4" />
                New Session
              </Button>
            )}
          </div>
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
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "reports"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <BarChart3 className="w-4 h-4" />
              Archives &amp; Reports
              {archives.data && archives.data.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
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
            <button
              onClick={() => setActiveTab("ccaudio")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "ccaudio"
                  ? "border-orange-400 text-orange-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Phone className="w-4 h-4" />
              CCAudioOnly
              {ccSessions.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  {ccSessions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("ailearning")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "ailearning"
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Activity className="w-4 h-4" />
              AI Learning
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
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Platform *</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PLATFORM_LABELS).map(([v, l]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, platform: v as typeof form.platform }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            form.platform === v
                              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200 hover:border-white/20"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.platform !== "webphone" && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Meeting URL * (Zoom / Teams / Meet invite link)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                      placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                      value={form.meetingUrl}
                      onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                    />
                  </div>
                  )}
                  {form.platform === "webphone" && (
                  <div className="sm:col-span-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-300">Webphone Mode</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">$0.00/min</span>
                    </div>
                    <p className="text-xs text-slate-400">CuraLive will use the built-in browser Webphone to join this event. No meeting URL needed — audio is captured directly and sent to the intelligence pipeline in real time.</p>
                  </div>
                  )}
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
                          { label: "Transcript Segments", value: Array.isArray(liveSession.transcriptSegments) ? liveSession.transcriptSegments.length : ((liveSession.transcriptSegments as unknown as number) ?? 0), icon: MessageSquare, color: "text-blue-400" },
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
            ARCHIVES & REPORTS TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">Archives &amp; Reports</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Browse all past events processed through CuraLive. View stats for any event and email a professional intelligence report directly to your customers.
                </p>
              </div>
            </div>

            {/* Email Modal */}
            {emailModalArchiveId != null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Email Intelligence Report
                  </h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!emailForm.recipientEmail.trim() || !emailForm.recipientName.trim()) {
                      toast.error("Please fill in both fields");
                      return;
                    }
                    emailReport.mutate({
                      archiveId: emailModalArchiveId,
                      recipientEmail: emailForm.recipientEmail.trim(),
                      recipientName: emailForm.recipientName.trim(),
                    });
                  }} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Recipient Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. John Smith"
                        value={emailForm.recipientName}
                        onChange={e => setEmailForm(f => ({ ...f, recipientName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. john@company.com"
                        value={emailForm.recipientEmail}
                        onChange={e => setEmailForm(f => ({ ...f, recipientEmail: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => { setEmailModalArchiveId(null); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                        className="flex-1 border-white/10 text-slate-400 hover:text-white">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={emailReport.isPending}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 gap-2">
                        {emailReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Send Report
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Archive list */}
              <div className="lg:col-span-1 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300">Past Events</h3>
                  <Button size="sm" variant="outline" onClick={() => archives.refetch()}
                    className="border-white/10 text-slate-400 hover:text-white gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
                {(!archives.data || archives.data.length === 0) ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
                    <Database className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No archive events yet</p>
                    <p className="text-xs text-slate-600 mt-1">Process events via Archive Upload or Event Recording</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {archives.data.map((a: any) => {
                      const isSelected = selectedArchiveId === a.id;
                      const sentColor = (a.sentiment_avg ?? 50) >= 70 ? "text-emerald-400" : (a.sentiment_avg ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                      return (
                        <button key={a.id} onClick={() => setSelectedArchiveId(a.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-200 truncate">{a.event_name}</div>
                              <div className="text-xs text-slate-500 truncate">{a.client_name}</div>
                            </div>
                            <span className={`text-xs font-bold ${sentColor}`}>{a.sentiment_avg ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>{EVENT_TYPE_LABELS[a.event_type] ?? a.event_type}</span>
                            {a.event_date && <><span>·</span><span>{a.event_date}</span></>}
                            <span>·</span>
                            <span>{a.word_count?.toLocaleString()} words</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Detail panel */}
              <div className="lg:col-span-2">
                {selectedArchiveId == null ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Select an event to view stats</p>
                    <p className="text-xs text-slate-600 mt-1">Click any event on the left to see the full breakdown</p>
                  </div>
                ) : archiveDetail.isLoading ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  </div>
                ) : archiveDetail.data ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-200">{archiveDetail.data.event_name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{archiveDetail.data.client_name} · {EVENT_TYPE_LABELS[archiveDetail.data.event_type] ?? archiveDetail.data.event_type}{archiveDetail.data.event_date ? ` · ${archiveDetail.data.event_date}` : ""}</p>
                        </div>
                        <Button size="sm" onClick={() => { setEmailModalArchiveId(selectedArchiveId); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                          className="bg-cyan-600 hover:bg-cyan-500 gap-2 shrink-0">
                          <FileText className="w-3.5 h-3.5" /> Email Report
                        </Button>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const d = archiveDetail.data;
                        const sentColor = (d.sentiment_avg ?? 50) >= 70 ? "text-emerald-400" : (d.sentiment_avg ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                        const compColor = d.compliance_flags > 3 ? "text-red-400" : d.compliance_flags > 1 ? "text-amber-400" : "text-emerald-400";
                        return [
                          { label: "Sentiment Score", value: `${d.sentiment_avg ?? "N/A"}`, sub: "/100", color: sentColor },
                          { label: "Compliance Flags", value: `${d.compliance_flags}`, sub: d.compliance_flags > 3 ? "High Risk" : d.compliance_flags > 1 ? "Moderate" : "Low Risk", color: compColor },
                          { label: "Words Analysed", value: d.word_count?.toLocaleString(), sub: "", color: "text-blue-400" },
                          { label: "Segments", value: `${d.segment_count}`, sub: "", color: "text-blue-400" },
                        ].map(({ label, value, sub, color }) => (
                          <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
                            <div className={`text-2xl font-bold ${color}`}>{value}<span className="text-xs text-slate-600 ml-0.5">{sub}</span></div>
                            <div className="text-xs text-slate-500 mt-1">{label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Detail rows */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl divide-y divide-white/5">
                      {[
                        { label: "Intelligence Records Generated", value: `${archiveDetail.data.tagged_metrics_generated} tagged records` },
                        { label: "Platform", value: archiveDetail.data.platform ?? "Not specified" },
                        { label: "Status", value: archiveDetail.data.status },
                        { label: "Processed On", value: new Date(archiveDetail.data.created_at).toLocaleString() },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-5 py-3">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className="text-sm text-slate-300 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {archiveDetail.data.notes && (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{archiveDetail.data.notes}</p>
                      </div>
                    )}

                    {/* Operator Correction Panel */}
                    <OperatorCorrectionPanel
                      eventId={`archive-${archiveDetail.data.id}`}
                      eventTitle={`${archiveDetail.data.client_name} — ${archiveDetail.data.event_name}`}
                      eventType={archiveDetail.data.event_type}
                      clientName={archiveDetail.data.client_name}
                      sentimentAvg={archiveDetail.data.sentiment_avg}
                      complianceFlags={archiveDetail.data.compliance_flags}
                    />

                    {/* Quick actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => window.location.href = "/tagged-metrics"}
                        className="border-white/10 text-slate-400 hover:text-white gap-2">
                        <Database className="w-4 h-4" /> View Intelligence Database
                      </Button>
                      <Button onClick={() => { setEmailModalArchiveId(selectedArchiveId); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                        className="bg-cyan-600 hover:bg-cyan-500 gap-2">
                        <FileText className="w-4 h-4" /> Email Report to Customer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">Failed to load archive details</p>
                  </div>
                )}
              </div>
            </div>
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
                  Supported formats: MP3, MP4, WAV, M4A, WebM, OGG &nbsp;·&nbsp; Up to 500MB &nbsp;·&nbsp; Large files are automatically compressed server-side before transcription
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
                      ? "Compressing audio and sending to Whisper AI. Large files are chunked automatically — allow 3–10 minutes."
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
                            <span className="text-amber-400 ml-2">· Large file — server will auto-compress, allow 5–10 min</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm text-slate-300 mb-1">Click to select an audio or video file</p>
                        <p className="text-xs text-slate-600">MP3, MP4, WAV, M4A, WebM, OGG &nbsp;·&nbsp; Up to 500MB</p>
                        <p className="text-xs text-slate-700 mt-1">Large files auto-compressed server-side — no pre-processing needed</p>
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

        {/* ══════════════════════════════════════════════════
            CC AUDIO ONLY TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "ccaudio" && (
          <>
            {/* How it works */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shrink-0">
                <Phone className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">CCAudioOnly — telephone conference call intelligence</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {ccPlatformMode === "dialin"
                    ? <>For events where participants dial in by telephone — earnings calls, AGMs, board briefings — with no video platform involved. Log the dial-in details here before the call, then record the audio on your end. After the call, upload the recording via <button onClick={() => setActiveTab("recording")} className="text-blue-400 underline hover:text-blue-300">Event Recording</button> to run the full intelligence pipeline: transcription, sentiment, compliance scanning, and database tagging.</>
                    : <>Use CuraLive's built-in Webphone to join conference calls directly from your browser — zero cost, no external software needed. The Webphone captures audio in real-time, transcribes via Whisper AI, scores sentiment, and detects compliance keywords — all automatically.</>
                  }
                </p>
              </div>
            </div>

            {/* Platform toggle — Dial-In vs Webphone */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCcPlatformMode("dialin")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  ccPlatformMode === "dialin"
                    ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <Phone className="w-4 h-4" /> Dial-In Number
              </button>
              <button
                onClick={() => setCcPlatformMode("webphone")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  ccPlatformMode === "webphone"
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <Globe className="w-4 h-4" /> Webphone
              </button>
              {ccPlatformMode === "webphone" && (
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ml-1">
                  $0.00/min
                </span>
              )}
            </div>

            {/* Workflow steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {(ccPlatformMode === "dialin" ? [
                { step: "1", icon: Hash, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", title: "Log dial-in details", desc: "Enter the conference number, ID, and access code below before the call." },
                { step: "2", icon: Phone, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", title: "Dial in & record", desc: "Call the conference number, enter credentials, and start your recording software." },
                { step: "3", icon: Upload, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", title: "Upload recording", desc: "After the call, go to Event Recording and upload the audio file for processing." },
                { step: "4", icon: Database, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20", title: "Intelligence delivered", desc: "Transcript, sentiment, compliance flags, and 4 tagged records added to your database." },
              ] : [
                { step: "1", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", title: "Open Webphone", desc: "Launch the browser-based Webphone below — no software to install." },
                { step: "2", icon: Phone, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", title: "Dial the conference", desc: "Enter the conference number and connect. Audio is captured automatically." },
                { step: "3", icon: Mic, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", title: "Live transcription", desc: "Real-time Whisper AI transcription, sentiment scoring, and compliance scanning." },
                { step: "4", icon: Database, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20", title: "Intelligence delivered", desc: "Full transcript, sentiment scores, compliance flags, and tagged records — all automatic." },
              ]).map(({ step, icon: Icon, color, bg, border, title, desc }) => (
                <div key={step} className={`bg-white/[0.02] border ${border} rounded-xl p-4`}>
                  <div className={`w-6 h-6 rounded-full ${bg} border ${border} text-[11px] font-bold ${color} flex items-center justify-center mb-3`}>{step}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs font-semibold text-slate-200">{title}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Webphone interface — shown when webphone mode selected */}
            {ccPlatformMode === "webphone" && (
              <div className="bg-white/[0.02] border border-emerald-500/20 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Browser Webphone</h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">Zero Cost</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Client / Company</label>
                    <input
                      value={ccForm.clientName}
                      onChange={e => setCcForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Name *</label>
                    <input
                      value={ccForm.eventName}
                      onChange={e => setCcForm(f => ({ ...f, eventName: e.target.value }))}
                      placeholder="e.g. Q3 2025 Earnings Call"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Type</label>
                    <select
                      value={ccForm.eventType}
                      onChange={e => setCcForm(f => ({ ...f, eventType: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="earnings_call">Earnings Call</option>
                      <option value="agm">AGM (Annual General Meeting)</option>
                      <option value="capital_markets_day">Capital Markets Day</option>
                      <option value="board_meeting">Board Meeting</option>
                      <option value="ceo_town_hall">CEO / Investor Town Hall</option>
                      <option value="analyst_briefing">Analyst Briefing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Conference Number to Dial
                    </label>
                    <input
                      value={ccForm.dialInNumber}
                      onChange={e => setCcForm(f => ({ ...f, dialInNumber: e.target.value }))}
                      placeholder="+1 800 555 0100"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Conference ID / DTMF Code
                    </label>
                    <input
                      value={ccForm.conferenceId}
                      onChange={e => setCcForm(f => ({ ...f, conferenceId: e.target.value }))}
                      placeholder="e.g. 123 456 789#"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                      <KeyRound className="w-3 h-3" /> Access Code / PIN
                    </label>
                    <input
                      value={ccForm.accessCode}
                      onChange={e => setCcForm(f => ({ ...f, accessCode: e.target.value }))}
                      placeholder="e.g. 4892#"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-emerald-500/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Dial Path</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><span className="text-slate-300 font-medium">1.</span> CuraLive calls your conference number via Twilio (or Telnyx fallback)</p>
                    <p><span className="text-slate-300 font-medium">2.</span> After the bridge answers, DTMF tones are sent automatically: Conference ID → Access Code → Host PIN</p>
                    <p><span className="text-slate-300 font-medium">3.</span> Audio is recorded silently (up to 2 hours) and sent to Whisper AI for transcription</p>
                    <p><span className="text-slate-300 font-medium">4.</span> Sentiment scoring, compliance scanning, and database tagging run on the transcript</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Webphone Ready
                    </div>
                    <span className="text-[10px] text-slate-600">Twilio/Telnyx carrier · DTMF auto-entry · Silent recording</span>
                  </div>
                  <Button
                    onClick={() => {
                      if (!ccForm.eventName.trim() || !ccForm.dialInNumber.trim()) {
                        toast.error("Event name and conference number are required");
                        return;
                      }
                      const sessionId = ccNextId;
                      const newSession = {
                        id: sessionId,
                        ...ccForm,
                        loggedAt: new Date().toLocaleString(),
                      };
                      setCcSessions(prev => [newSession, ...prev]);
                      setCcNextId(n => n + 1);

                      setBridgeCalls(prev => ({ ...prev, [sessionId]: { callSid: "", status: "initiating", dialing: true } }));
                      dialOutMutation.mutate({
                        sessionId: String(sessionId),
                        eventName: ccForm.eventName,
                        dialInNumber: ccForm.dialInNumber,
                        conferenceId: ccForm.conferenceId || undefined,
                        accessCode: ccForm.accessCode || undefined,
                        hostPin: ccForm.hostPin || undefined,
                      });

                      setCcForm({
                        clientName: "", eventName: "", eventType: "earnings_call",
                        dialInNumber: "", conferenceId: "", accessCode: "",
                        hostPin: "", scheduledAt: "", notes: "",
                      });
                    }}
                    disabled={dialOutMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
                  >
                    <Phone className="w-4 h-4" /> Dial with Webphone
                  </Button>
                </div>
              </div>
            )}

            {/* Log a call form — shown when dial-in mode selected */}
            {ccPlatformMode === "dialin" && (
            <div className="bg-white/[0.02] border border-orange-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Log Conference Call Details</h3>
                </div>
                {!ccShowForm && (
                  <Button
                    onClick={() => setCcShowForm(true)}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> New Call
                  </Button>
                )}
              </div>

              {ccShowForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!ccForm.eventName.trim() || !ccForm.dialInNumber.trim()) {
                      toast.error("Event name and dial-in number are required");
                      return;
                    }
                    const newSession = {
                      id: ccNextId,
                      ...ccForm,
                      loggedAt: new Date().toLocaleString(),
                    };
                    setCcSessions(prev => [newSession, ...prev]);
                    setCcNextId(n => n + 1);
                    setCcForm({
                      clientName: "", eventName: "", eventType: "earnings_call",
                      dialInNumber: "", conferenceId: "", accessCode: "",
                      hostPin: "", scheduledAt: "", notes: "",
                    });
                    setCcShowForm(false);
                    toast.success("Dial-in details logged");
                  }}
                  className="space-y-5"
                >
                  {/* Event info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Client / Company</label>
                      <input
                        value={ccForm.clientName}
                        onChange={e => setCcForm(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Name *</label>
                      <input
                        value={ccForm.eventName}
                        onChange={e => setCcForm(f => ({ ...f, eventName: e.target.value }))}
                        placeholder="e.g. Q3 2025 Earnings Call"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Event Type</label>
                      <select
                        value={ccForm.eventType}
                        onChange={e => setCcForm(f => ({ ...f, eventType: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="earnings_call">Earnings Call</option>
                        <option value="agm">AGM (Annual General Meeting)</option>
                        <option value="capital_markets_day">Capital Markets Day</option>
                        <option value="board_meeting">Board Meeting</option>
                        <option value="ceo_town_hall">CEO / Investor Town Hall</option>
                        <option value="analyst_briefing">Analyst Briefing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={ccForm.scheduledAt}
                        onChange={e => setCcForm(f => ({ ...f, scheduledAt: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  {/* Dial-in details */}
                  <div className="bg-white/[0.015] border border-orange-500/10 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Telephone Dial-In Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Dial-In Number *
                        </label>
                        <input
                          value={ccForm.dialInNumber}
                          onChange={e => setCcForm(f => ({ ...f, dialInNumber: e.target.value }))}
                          placeholder="+1 800 555 0100"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Include country code. Multiple numbers? List the primary one here.</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Conference ID / Meeting ID
                        </label>
                        <input
                          value={ccForm.conferenceId}
                          onChange={e => setCcForm(f => ({ ...f, conferenceId: e.target.value }))}
                          placeholder="e.g. 123 456 789"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Enter when prompted after dialling.</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                          <KeyRound className="w-3 h-3" /> Participant Access Code / PIN
                        </label>
                        <input
                          value={ccForm.accessCode}
                          onChange={e => setCcForm(f => ({ ...f, accessCode: e.target.value }))}
                          placeholder="e.g. 4892#"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                          <KeyRound className="w-3 h-3" /> Host PIN <span className="text-slate-600 font-normal">(optional)</span>
                        </label>
                        <input
                          value={ccForm.hostPin}
                          onChange={e => setCcForm(f => ({ ...f, hostPin: e.target.value }))}
                          placeholder="e.g. 7731#"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Only if joining as host/presenter.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes <span className="text-slate-600">(optional)</span></label>
                    <input
                      value={ccForm.notes}
                      onChange={e => setCcForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Q&A opens after 30 mins, multiple dial-in regions available"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCcShowForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-black font-semibold gap-2">
                      <Phone className="w-4 h-4" /> Log Call Details
                    </Button>
                  </div>
                </form>
              )}

              {!ccShowForm && ccSessions.length === 0 && (
                <div className="text-center py-8 text-slate-600">
                  <Phone className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-slate-500 mb-1">No calls logged yet</p>
                  <p className="text-xs">Click "New Call" to log dial-in details before your next telephone conference</p>
                </div>
              )}
            </div>
            )}

            {/* Logged sessions — dial-in mode */}
            {ccPlatformMode === "dialin" && ccSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
                  Logged Calls ({ccSessions.length})
                </h3>
                {ccSessions.map(s => {
                  const bridge = bridgeCalls[s.id];
                  const bridgeStatus = bridge?.status ?? null;
                  const isConnected = bridgeStatus === "in-progress";
                  const isRinging = bridgeStatus === "queued" || bridgeStatus === "ringing" || bridgeStatus === "initiated";
                  const isDone = bridgeStatus === "completed" || bridgeStatus === "failed" || bridgeStatus === "busy" || bridgeStatus === "no-answer";

                  return (
                  <div key={s.id} className={`bg-white/[0.02] border rounded-xl p-5 transition-all ${isConnected ? "border-emerald-500/40" : bridge?.dialing ? "border-orange-500/30" : "border-white/[0.06]"}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-white">{s.eventName}</span>
                          <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                            {s.eventType.replace(/_/g, " ")}
                          </span>
                          {isConnected && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              BRIDGE LIVE
                            </span>
                          )}
                          {isRinging && (
                            <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                              CONNECTING
                            </span>
                          )}
                        </div>
                        {s.clientName && <p className="text-xs text-slate-500">{s.clientName}</p>}
                        <p className="text-[10px] text-slate-700 mt-0.5">Logged {s.loggedAt}{s.scheduledAt ? ` · Scheduled ${new Date(s.scheduledAt).toLocaleString()}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!bridge && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setBridgeCalls(prev => ({ ...prev, [s.id]: { callSid: "", status: "initiating", dialing: true } }));
                              dialOutMutation.mutate({
                                sessionId: String(s.id),
                                eventName: s.eventName,
                                dialInNumber: s.dialInNumber,
                                conferenceId: s.conferenceId || undefined,
                                accessCode: s.accessCode || undefined,
                                hostPin: s.hostPin || undefined,
                              });
                            }}
                            disabled={bridge?.dialing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                          >
                            <Phone className="w-3 h-3" /> Connect to Bridge
                          </Button>
                        )}
                        {bridge && !isDone && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => bridge.callSid && hangupMutation.mutate({ callSid: bridge.callSid })}
                            disabled={!bridge.callSid}
                            className="text-xs gap-1.5"
                          >
                            <Square className="w-3 h-3" /> Disconnect
                          </Button>
                        )}
                        {isDone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBridgeCalls(prev => { const n = { ...prev }; delete n[s.id]; return n; })}
                            className="text-xs gap-1.5 border-white/10 text-slate-400"
                          >
                            <RefreshCw className="w-3 h-3" /> Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => setActiveTab("recording")}
                          className="bg-blue-600/80 hover:bg-blue-500 text-white text-xs gap-1.5"
                        >
                          <Upload className="w-3 h-3" /> Upload Recording
                        </Button>
                      </div>
                    </div>

                    {/* Dial-in card */}
                    <div className="bg-orange-500/[0.04] border border-orange-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Dial-In Details</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Dial-In Number", value: s.dialInNumber, icon: Phone, mono: true },
                          { label: "Conference ID", value: s.conferenceId || "—", icon: Hash, mono: true },
                          { label: "Access Code", value: s.accessCode || "—", icon: KeyRound, mono: true },
                          { label: "Host PIN", value: s.hostPin || "—", icon: KeyRound, mono: true },
                        ].map(({ label, value, icon: Icon, mono }) => (
                          <div key={label} className="bg-black/20 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="w-3 h-3 text-slate-600" />
                              <span className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-sm text-slate-200 ${mono ? "font-mono" : ""} break-all`}>{value}</span>
                              {value !== "—" && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied"); }}
                                  className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {s.notes && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                          <Info className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                          {s.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Webphone sessions */}
            {ccPlatformMode === "webphone" && ccSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Webphone Sessions ({ccSessions.length})
                </h3>
                {ccSessions.map(s => {
                  const bridge = bridgeCalls[s.id];
                  const bridgeStatus = bridge?.status ?? null;
                  const isConnected = bridgeStatus === "in-progress";
                  const isRinging = bridgeStatus === "queued" || bridgeStatus === "ringing" || bridgeStatus === "initiated" || bridgeStatus === "initiating";
                  const isDone = bridgeStatus === "completed" || bridgeStatus === "failed" || bridgeStatus === "busy" || bridgeStatus === "no-answer";

                  return (
                  <div key={s.id} className={`bg-white/[0.02] border rounded-xl p-5 transition-all ${isConnected ? "border-emerald-500/40" : bridge?.dialing ? "border-amber-500/30" : isDone ? "border-white/[0.06]" : "border-emerald-500/10"}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-white">{s.eventName}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                            Webphone
                          </span>
                          <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                            {s.eventType.replace(/_/g, " ")}
                          </span>
                          {isConnected && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              LIVE — RECORDING
                            </span>
                          )}
                          {isRinging && (
                            <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                              {bridge?.dialing ? "DIALLING..." : "CONNECTING"}
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] text-slate-400 bg-slate-400/10 border border-slate-400/20 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">
                              {bridgeStatus}
                            </span>
                          )}
                        </div>
                        {s.clientName && <p className="text-xs text-slate-500">{s.clientName}</p>}
                        <p className="text-[10px] text-slate-700 mt-0.5">Started {s.loggedAt}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {bridge && !isDone && !bridge.dialing && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => bridge.callSid && hangupMutation.mutate({ callSid: bridge.callSid })}
                            disabled={!bridge.callSid}
                            className="text-xs gap-1.5"
                          >
                            <Square className="w-3 h-3" /> Disconnect
                          </Button>
                        )}
                        {isDone && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setBridgeCalls(prev => { const n = { ...prev }; delete n[s.id]; return n; });
                                setBridgeCalls(prev => ({ ...prev, [s.id]: { callSid: "", status: "initiating", dialing: true } }));
                                dialOutMutation.mutate({
                                  sessionId: String(s.id),
                                  eventName: s.eventName,
                                  dialInNumber: s.dialInNumber,
                                  conferenceId: s.conferenceId || undefined,
                                  accessCode: s.accessCode || undefined,
                                  hostPin: s.hostPin || undefined,
                                });
                              }}
                              className="text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <RefreshCw className="w-3 h-3" /> Redial
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setActiveTab("recording")}
                              className="bg-blue-600/80 hover:bg-blue-500 text-white text-xs gap-1.5"
                            >
                              <Upload className="w-3 h-3" /> Upload Recording
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dial path details */}
                    <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Dial Path</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Conference Number", value: s.dialInNumber, icon: Phone },
                          { label: "Conference ID", value: s.conferenceId || "—", icon: Hash },
                          { label: "Access Code", value: s.accessCode || "—", icon: KeyRound },
                          { label: "Call SID", value: bridge?.callSid ? bridge.callSid.slice(0, 16) + "..." : "Pending", icon: Globe },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="bg-black/20 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="w-3 h-3 text-slate-600" />
                              <span className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</span>
                            </div>
                            <span className="text-sm text-slate-200 font-mono break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                      {isConnected && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                          <Mic className="w-3 h-3" />
                          <span>Audio being recorded silently — Whisper transcription will run when call ends</span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recording tips for telephone calls</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
                {[
                  { title: "Speaker mode", desc: "Place your phone on speaker and use a screen recorder or audio capture tool like Audacity to record the full call." },
                  { title: "Conference bridge recording", desc: "Many enterprise bridge providers (Arkadin, Intercall, West) offer built-in call recording. Ask your provider to enable it." },
                  { title: "Supported formats", desc: "CuraLive Event Recording accepts MP3, WAV, M4A, MP4, MOV, and other common audio/video formats up to 500 MB." },
                ].map(({ title, desc }) => (
                  <div key={title}>
                    <p className="text-slate-300 font-medium mb-1">{title}</p>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            AI LEARNING TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "ailearning" && (
          <AILearningDashboard />
        )}

      </div>
    </div>
  );
}

function OperatorCorrectionPanel({ eventId, eventTitle, eventType, clientName, sentimentAvg, complianceFlags }: {
  eventId: string; eventTitle: string; eventType: string; clientName: string;
  sentimentAvg: number | null; complianceFlags: number;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [sentimentOverride, setSentimentOverride] = useState(sentimentAvg ?? 50);
  const [correctionReason, setCorrectionReason] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const submitCorrection = trpc.adaptiveIntelligence.submitCorrection.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCorrectionReason("");
      setNewKeyword("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="bg-white/[0.02] border border-purple-500/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setShowCorrection(!showCorrection)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-200">Correct AI Analysis</div>
            <div className="text-xs text-slate-500">Your corrections train the AI to be more accurate</div>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showCorrection ? "rotate-90" : ""}`} />
      </button>

      {showCorrection && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Sentiment Score Override</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0" max="100"
                  value={sentimentOverride}
                  onChange={(e) => setSentimentOverride(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className={`text-lg font-bold min-w-[3ch] text-right ${
                  sentimentOverride >= 70 ? "text-emerald-400" : sentimentOverride >= 50 ? "text-amber-400" : "text-red-400"
                }`}>{sentimentOverride}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-600">AI scored: {sentimentAvg ?? "N/A"}</span>
                <span className="text-xs text-slate-600">Your correction: {sentimentOverride}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Reason for correction</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                placeholder="e.g. Mining sector calls are naturally more cautious"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              disabled={submitCorrection.isPending || sentimentOverride === (sentimentAvg ?? 50)}
              onClick={() => submitCorrection.mutate({
                eventId,
                eventTitle,
                correctionType: "sentiment_override",
                originalValue: sentimentAvg ?? 50,
                correctedValue: sentimentOverride,
                originalLabel: `AI Score: ${sentimentAvg ?? 50}`,
                correctedLabel: `Operator Override: ${sentimentOverride}`,
                reason: correctionReason || undefined,
                eventType,
                clientName,
              })}
              className="bg-purple-600 hover:bg-purple-500 gap-2"
            >
              {submitCorrection.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Submit Sentiment Correction
            </Button>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Compliance Actions</label>
              <div className="flex gap-2">
                {complianceFlags > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitCorrection.isPending}
                    onClick={() => submitCorrection.mutate({
                      eventId,
                      eventTitle,
                      correctionType: "compliance_dismiss",
                      originalValue: complianceFlags,
                      correctedValue: 0,
                      originalLabel: `${complianceFlags} flags`,
                      correctedLabel: "Dismissed by operator",
                      reason: correctionReason || "False positive — operator reviewed",
                      eventType,
                      clientName,
                      dismissedKeywords: ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"].slice(0, complianceFlags),
                    })}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" /> Dismiss {complianceFlags} Flag{complianceFlags !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Add Compliance Keyword</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. restructuring, dividend cut"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!newKeyword.trim() || submitCorrection.isPending}
                  onClick={() => submitCorrection.mutate({
                    eventId,
                    eventTitle,
                    correctionType: "compliance_add",
                    correctedLabel: newKeyword.trim(),
                    reason: `Operator added keyword: ${newKeyword.trim()}`,
                    eventType,
                    clientName,
                  })}
                  className="bg-purple-600 hover:bg-purple-500 gap-1.5 shrink-0"
                >
                  <Tag className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Every correction you submit trains CuraLive's AI. Over time, sentiment thresholds adapt to your sector, compliance scanning learns which keywords matter, and false positives decrease. This is the self-improving feedback loop described in the patent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function AILearningDashboard() {
  const learningStats = trpc.adaptiveIntelligence.getLearningStats.useQuery();
  const thresholds = trpc.adaptiveIntelligence.getAdaptiveThresholds.useQuery();
  const vocabulary = trpc.adaptiveIntelligence.getComplianceVocabulary.useQuery();
  const corrections = trpc.adaptiveIntelligence.getCorrections.useQuery({ limit: 20 });

  const [newKeyword, setNewKeyword] = useState("");
  const addKeyword = trpc.adaptiveIntelligence.addComplianceKeyword.useMutation({
    onSuccess: (data) => { toast.success(data.message); setNewKeyword(""); vocabulary.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const toggleKeyword = trpc.adaptiveIntelligence.toggleComplianceKeyword.useMutation({
    onSuccess: () => vocabulary.refetch(),
  });

  const stats = learningStats.data;

  const maturityColors: Record<string, string> = {
    "Initialising": "text-slate-400 bg-slate-400/10 border-slate-400/20",
    "Learning": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    "Adapting": "text-blue-400 bg-blue-400/10 border-blue-400/20",
    "Calibrated": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    "Self-Evolving": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };

  return (
    <>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200 mb-1">AI Learning Engine</div>
          <p className="text-sm text-slate-400 leading-relaxed">
            CuraLive's AI improves with every operator correction. When you override a sentiment score, dismiss a false compliance flag, or add a new keyword, those corrections become training signals that calibrate future analysis. This dashboard shows how the AI is learning and evolving.
          </p>
        </div>
      </div>

      {stats && (
        <>
          {/* Maturity header */}
          <div className="bg-white/[0.03] border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-slate-200">AI Maturity Level</div>
                <p className="text-sm text-slate-500 mt-0.5">Based on {stats.totalCorrections} operator corrections</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${maturityColors[stats.maturityLevel] ?? maturityColors["Initialising"]}`}>
                {stats.maturityLevel}
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700"
                style={{ width: `${stats.maturityScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-600">
              <span>Initialising</span>
              <span>Learning</span>
              <span>Adapting</span>
              <span>Calibrated</span>
              <span>Self-Evolving</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Corrections", value: stats.totalCorrections, color: "text-purple-400" },
              { label: "Sentiment Overrides", value: stats.correctionsByType?.sentiment_override ?? 0, color: "text-emerald-400" },
              { label: "Compliance Adjustments", value: (stats.correctionsByType?.compliance_dismiss ?? 0) + (stats.correctionsByType?.compliance_add ?? 0), color: "text-amber-400" },
              { label: "Adapted Thresholds", value: stats.adaptedThresholds, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adaptive Thresholds */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Adaptive Thresholds
          </h3>
          {thresholds.data?.learned && thresholds.data.learned.length > 0 ? (
            <div className="space-y-3">
              {thresholds.data.summary.map((t: any) => (
                <div key={t.key} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-medium">{t.key.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-600">{t.samples} samples</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Default:</span>
                      <span className="text-slate-400 font-medium">{t.default}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Learned:</span>
                      <span className="text-purple-400 font-bold">{t.learned}</span>
                    </div>
                    <span className={`text-xs font-medium ml-auto ${Number(t.driftPercent) > 0 ? "text-emerald-400" : Number(t.driftPercent) < 0 ? "text-red-400" : "text-slate-500"}`}>
                      {t.driftPercent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No thresholds adapted yet</p>
              <p className="text-xs text-slate-600 mt-1">Submit sentiment corrections from event reports to begin threshold learning</p>
            </div>
          )}
        </div>

        {/* Compliance Vocabulary */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Compliance Vocabulary
            {stats && <span className="text-xs text-slate-600 ml-auto">{stats.vocabularyStats.totalKeywords} keywords</span>}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
              placeholder="Add new compliance keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newKeyword.trim()) addKeyword.mutate({ keyword: newKeyword.trim() }); }}
            />
            <Button size="sm" disabled={!newKeyword.trim() || addKeyword.isPending}
              onClick={() => addKeyword.mutate({ keyword: newKeyword.trim() })}
              className="bg-purple-600 hover:bg-purple-500 gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          {vocabulary.data && vocabulary.data.length > 0 ? (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {vocabulary.data.map((kw: any) => (
                <div key={kw.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${kw.active ? "border-white/5 bg-white/[0.01]" : "border-white/5 bg-white/[0.005] opacity-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => toggleKeyword.mutate({ id: kw.id, active: !kw.active })}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${kw.active ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "border-white/20"}`}>
                      {kw.active && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <span className="text-sm text-slate-300 truncate">{kw.keyword}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${kw.source === "operator" ? "bg-purple-500/20 text-purple-400" : kw.source === "learned" ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400"}`}>
                      {kw.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-600" title="Effective weight">
                      w:{(kw.effective_weight ?? kw.effectiveWeight ?? 1).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-600">
                      {kw.times_flagged ?? kw.timesFlagged ?? 0}F / {kw.times_dismissed ?? kw.timesDismissed ?? 0}D
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading vocabulary...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Corrections */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Recent Corrections (Training Signals)
        </h3>
        {corrections.data && corrections.data.length > 0 ? (
          <div className="space-y-2">
            {corrections.data.map((c: any) => {
              const typeColors: Record<string, string> = {
                sentiment_override: "text-emerald-400 bg-emerald-500/10",
                compliance_dismiss: "text-amber-400 bg-amber-500/10",
                compliance_add: "text-purple-400 bg-purple-500/10",
                severity_change: "text-blue-400 bg-blue-500/10",
                threshold_adjust: "text-cyan-400 bg-cyan-500/10",
              };
              const typeLabels: Record<string, string> = {
                sentiment_override: "Sentiment Override",
                compliance_dismiss: "Compliance Dismissed",
                compliance_add: "Keyword Added",
                severity_change: "Severity Changed",
                threshold_adjust: "Threshold Adjusted",
              };
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3 bg-white/[0.01] border border-white/5 rounded-lg">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 mt-0.5 ${typeColors[c.correctionType ?? c.correction_type] ?? "text-slate-400 bg-slate-500/10"}`}>
                    {typeLabels[c.correctionType ?? c.correction_type] ?? c.correctionType ?? c.correction_type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-300 truncate">{c.eventTitle ?? c.event_title ?? c.eventId ?? c.event_id}</div>
                    {(c.originalValue != null || c.original_value != null) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {c.originalValue ?? c.original_value} → {c.correctedValue ?? c.corrected_value}
                        {(c.reason || c.correctedLabel || c.corrected_label) && (
                          <span className="text-slate-600"> · {c.reason ?? c.correctedLabel ?? c.corrected_label}</span>
                        )}
                      </div>
                    )}
                    {!(c.originalValue != null || c.original_value != null) && (c.reason || c.correctedLabel || c.corrected_label) && (
                      <div className="text-xs text-slate-500 mt-0.5">{c.reason ?? c.correctedLabel ?? c.corrected_label}</div>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{new Date(c.createdAt ?? c.created_at).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No corrections recorded yet</p>
            <p className="text-xs text-slate-600 mt-1">Go to Archives & Reports, select an event, and use "Correct AI Analysis" to submit your first training signal</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-purple-300 mb-3">How the Self-Improving Loop Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-slate-400">
          {[
            { step: "1", title: "Operator Corrects", desc: "You override a sentiment score or dismiss a false compliance flag on any event." },
            { step: "2", title: "Correction Stored", desc: "The correction is saved as a training signal with full context (event type, sector, reason)." },
            { step: "3", title: "Thresholds Adapt", desc: "The system recalculates thresholds using a weighted blend of defaults and operator corrections." },
            { step: "4", title: "Future Events Improve", desc: "New events of the same type are scored against the adapted thresholds, producing more accurate results." },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold mb-2">{step}</div>
              <p className="text-slate-300 font-medium mb-1">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
