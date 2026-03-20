// @ts-nocheck
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import {
  Radio, Play, Square, Eye, EyeOff,
  Activity, Shield, Users, MessageSquare, Tag,
  CheckCircle2, AlertTriangle, Clock, Loader2,
  Building2, RefreshCw, BarChart3, FileText,
  Upload, Database, ChevronRight, BarChart2,
  Mic, FileAudio, Globe, Copy,
  Info,
  Sparkles, Target, UserCheck, HelpCircle, ListChecks,
  TrendingUp, Swords, Lightbulb, ChevronDown, ChevronUp,
  Brain, Gauge, ShieldAlert, LineChart, Banknote, Leaf,
  Newspaper, Share2, Briefcase, Send,
  Zap, Network, Download, Video, ExternalLink, Trash2,
  FolderOpen, FolderClosed, CheckSquare, MessageCircle,
} from "lucide-react";
import LocalAudioCapture from "@/components/LocalAudioCapture";
import AIDashboard from "@/components/AIDashboard";
import SystemDiagnostics from "@/components/SystemDiagnostics";
import LiveQaDashboard from "@/components/LiveQaDashboard";

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", choruscall: "Chorus Call", other: "Other",
};

const RECALL_SUPPORTED_PLATFORMS = new Set(["zoom", "teams", "meet", "webex"]);

function detectPlatformFromUrl(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("choruscall.com")) return "choruscall";
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) return "zoom";
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) return "teams";
  if (lower.includes("meet.google.com")) return "meet";
  if (lower.includes("webex.com")) return "webex";
  return null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", interim_results: "Interim Results", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast",
  investor_day: "Investor Day", roadshow: "Roadshow", special_call: "Special Call", other: "Other",
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

export default function ShadowMode({ embedded }: { embedded?: boolean } = {}) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (embedded) return;
    window.history.pushState(null, "", "/shadow-mode");
    const handlePopState = () => {
      navigate("/shadow-mode");
      window.history.pushState(null, "", "/shadow-mode");
    };
    window.addEventListener("popstate", handlePopState, true);
    return () => window.removeEventListener("popstate", handlePopState, true);
  }, [embedded]);

  // Tab state
  const [activeTab, setActiveTab] = useState<"live" | "archive" | "reports" | "ailearning" | "aidashboard" | "advisory" | "diagnostics" | "liveqa">("live");


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
      toast.success(data.message);
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

  const retrySession = trpc.shadowMode.retrySession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSession = trpc.shadowMode.deleteSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveSessionId(null);
      setConfirmDeleteId(null);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const deleteSessions = trpc.shadowMode.deleteSessions.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedSessionIds(new Set());
      setConfirmBulkDelete(false);
      if (activeSessionId && selectedSessionIds.has(activeSessionId)) {
        setActiveSessionId(null);
      }
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleSessionSelect = useCallback((id: number) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const groupedSessions = useMemo(() => {
    if (!sessions.data) return { active: [], completed: [], failed: [] };
    const active: typeof sessions.data = [];
    const completed: typeof sessions.data = [];
    const failed: typeof sessions.data = [];
    for (const s of sessions.data) {
      if (s.status === "live" || s.status === "bot_joining" || s.status === "pending" || s.status === "processing") {
        active.push(s);
      } else if (s.status === "completed") {
        completed.push(s);
      } else {
        failed.push(s);
      }
    }
    return { active, completed, failed };
  }, [sessions.data]);

  const liveSession = activeSession.data;
  const isLive = liveSession?.status === "live" || liveSession?.status === "bot_joining";

  const [realtimeSegments, setRealtimeSegments] = useState<Array<{ id?: string; speaker: string; text: string; timestamp: number; timeLabel?: string }>>([]);
  const ablyChannel = liveSession?.ablyChannel ?? "";

  useEffect(() => {
    setRealtimeSegments([]);
  }, [activeSessionId]);

  useEffect(() => {
    if (!ablyChannel || !isLive) return;
    let cancelled = false;
    let ablyClient: any = null;

    const connectAbly = async () => {
      try {
        const tokenRes = await fetch("/api/ably-token");
        if (!tokenRes.ok || cancelled) return;
        const tokenRequest = await tokenRes.json();
        if (cancelled) return;

        const { Realtime } = await import("ably");
        if (cancelled) return;

        ablyClient = new Realtime({ authCallback: (_data, cb) => cb(null, tokenRequest), autoConnect: true });
        const channel = ablyClient.channels.get(ablyChannel);
        channel.subscribe("curalive", (msg: any) => {
          try {
            const parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
            if (parsed.type === "transcript.segment" && parsed.data) {
              setRealtimeSegments(prev => [...prev, parsed.data]);
            }
          } catch {}
        });
      } catch (err) {
        console.warn("[Shadow] Ably subscription failed (falling back to polling):", err);
      }
    };

    connectAbly();
    return () => {
      cancelled = true;
      if (ablyClient) {
        try { ablyClient.close(); } catch {}
      }
    };
  }, [ablyChannel, isLive]);

  const polledSegments = liveSession?.transcriptSegments ?? [];
  const transcript = (() => {
    if (!Array.isArray(polledSegments)) return realtimeSegments;
    if (realtimeSegments.length > polledSegments.length) return realtimeSegments;
    return polledSegments;
  })();

  // ── Archive Upload state ───────────────────────────────────────────────────
  const [archiveForm, setArchiveForm] = useState({
    clientName: "", eventName: "", eventType: "", eventDate: "",
    platform: "", notes: "", transcriptText: "",
  });
  const [archiveInputMode, setArchiveInputMode] = useState<"paste" | "file" | "recording">("paste");
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);
  const [archiveRecFile, setArchiveRecFile] = useState<File | null>(null);
  const [archiveTranscribing, setArchiveTranscribing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const archiveAudioRef = useRef<HTMLInputElement>(null);

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

  function handleArchiveAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setArchiveRecFile(f);
      setArchiveFileName(f.name);
    }
  }

  async function handleArchiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!archiveForm.clientName.trim() || !archiveForm.eventName.trim() || !archiveForm.eventType) {
      toast.error("Please fill in Client Name, Event Name, and Event Type.");
      return;
    }

    let transcript = archiveForm.transcriptText.trim();

    if (archiveInputMode === "recording") {
      if (!archiveRecFile) {
        toast.error("Please select an audio or video recording to upload.");
        return;
      }
      setArchiveTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("file", archiveRecFile);
        toast.success("Uploading recording to Whisper AI for transcription...");
        const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Transcription failed" }));
          throw new Error(data.error ?? "Transcription failed");
        }
        const { transcript: t } = await res.json();
        transcript = t;
        setArchiveForm(f => ({ ...f, transcriptText: t }));
        toast.success(`Transcription complete — ${t.split(/\s+/).filter(Boolean).length.toLocaleString()} words`);
      } catch (err: any) {
        toast.error(err.message ?? "Transcription failed");
        setArchiveTranscribing(false);
        return;
      }
      setArchiveTranscribing(false);
    }

    if (!transcript) {
      toast.error("No transcript available. Please paste text, upload a .txt file, or upload a recording.");
      return;
    }

    processTranscript.mutate({
      clientName: archiveForm.clientName.trim(),
      eventName: archiveForm.eventName.trim(),
      eventType: archiveForm.eventType as any,
      eventDate: archiveForm.eventDate || undefined,
      platform: archiveForm.platform || undefined,
      transcriptText: transcript,
      notes: archiveForm.notes || undefined,
    });
  }

  function resetArchive() {
    setArchiveResult(null);
    setArchiveForm({ clientName: "", eventName: "", eventType: "", eventDate: "", platform: "", notes: "", transcriptText: "" });
    setArchiveFileName(null);
    setArchiveRecFile(null);
    setArchiveTranscribing(false);
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

  const generateReport = trpc.archiveUpload.generateReport.useMutation({
    onSuccess: () => {
      toast.success("AI report generated successfully");
      archiveDetail.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const ALL_REPORT_MODULES = [
    { id: "executiveSummary", label: "Executive Summary", icon: Sparkles },
    { id: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity },
    { id: "complianceReview", label: "Compliance Review", icon: Shield },
    { id: "keyTopics", label: "Key Topics", icon: Tag },
    { id: "speakerAnalysis", label: "Speaker Analysis", icon: UserCheck },
    { id: "questionsAsked", label: "Q&A Analysis", icon: HelpCircle },
    { id: "actionItems", label: "Action Items", icon: ListChecks },
    { id: "investorSignals", label: "Investor Signals", icon: Target },
    { id: "communicationScore", label: "Communication Score", icon: MessageSquare },
    { id: "riskFactors", label: "Risk Factors", icon: AlertTriangle },
    { id: "competitiveIntelligence", label: "Competitive Intel", icon: Swords },
    { id: "recommendations", label: "AI Recommendations", icon: Lightbulb },
    { id: "speakingPaceAnalysis", label: "Speaking Pace Coach", icon: Gauge },
    { id: "toxicityScreen", label: "Toxicity & Language Risk", icon: ShieldAlert },
    { id: "sentimentArc", label: "Sentiment Arc", icon: LineChart },
    { id: "financialHighlights", label: "Financial Highlights", icon: Banknote },
    { id: "esgMentions", label: "ESG & Sustainability", icon: Leaf },
    { id: "pressReleaseDraft", label: "Press Release Draft", icon: Newspaper },
    { id: "socialMediaContent", label: "Social Media Content", icon: Share2 },
    { id: "boardReadySummary", label: "Board-Ready Summary", icon: Briefcase },
  ];

  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set(ALL_REPORT_MODULES.map(m => m.id)));
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const toggleModule = (id: string) => setSelectedModules(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
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

  function handleAudioDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setRecFile(f);
  }

  const [dragOver, setDragOver] = useState(false);

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
    <div className={embedded ? "bg-[#0a0a0f] text-white" : "min-h-screen bg-[#0a0a0f] text-white"}>

      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        {!embedded && (
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
            <Button onClick={() => {
              if (activeTab !== "live") setActiveTab("live");
              setShowForm(true);
            }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-sm font-semibold px-5">
              <Play className="w-4 h-4" />
              New Live Event
            </Button>
          </div>
        </div>
        )}

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
              onClick={() => setActiveTab("aidashboard")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "aidashboard"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Brain className="w-4 h-4" />
              AI Dashboard
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
            <button
              onClick={() => setActiveTab("advisory")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "advisory"
                  ? "border-rose-400 text-rose-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <MessageCircle className="w-4 h-4" />
              AI Advisory
            </button>
            <button
              onClick={() => setActiveTab("liveqa")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "liveqa"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <MessageCircle className="w-4 h-4" />
              Live Q&A
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "diagnostics"
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Shield className="w-4 h-4" />
              System Test
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
            {!showForm && (
              <div className="bg-gradient-to-br from-emerald-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <EyeOff className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-slate-200">How do you want to capture this event?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setShowForm(true); }}
                    className="group bg-white/[0.02] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                        <Radio className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Join Live Event</div>
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Free — no call charges</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Paste a Zoom, Teams, or Meet link. An AI bot joins the meeting silently, transcribes in real time, and runs the full intelligence pipeline.
                    </p>
                    <div className="text-xs text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center gap-1">
                      <Play className="w-3 h-3" /> Start a new live session
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("recording")}
                    className="group bg-white/[0.02] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20">
                        <Mic className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Upload Recording</div>
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Audio or video file</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Upload an MP3, WAV, M4A, MP4, or MOV recording of a past event. Whisper AI transcribes, then the full 20-module AI report runs.
                    </p>
                    <div className="text-xs text-blue-400 font-medium group-hover:text-blue-300 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload a recording
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("archive")}
                    className="group bg-white/[0.02] hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/20">
                        <FileText className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Paste Transcript</div>
                        <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Text or .txt file</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Paste raw transcript text or upload a .txt file from any source. Runs sentiment analysis, compliance scanning, and the full AI report.
                    </p>
                    <div className="text-xs text-violet-400 font-medium group-hover:text-violet-300 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Submit a transcript
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-4 text-center">
                  Every input path runs all 20 AI modules and stores the intelligence in your database — building your data asset for every event.
                </p>
              </div>
            )}

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
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Meeting URL * (Zoom / Teams / Meet / Webex / Chorus Call)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                      placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                      value={form.meetingUrl}
                      onChange={e => {
                        const url = e.target.value;
                        const detected = detectPlatformFromUrl(url);
                        setForm(f => ({
                          ...f,
                          meetingUrl: url,
                          ...(detected ? { platform: detected as typeof f.platform } : {}),
                        }));
                      }}
                    />
                    {form.platform && !RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <p className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>CuraLive will use <strong>Local Audio Capture</strong> — once the session starts, click "Start Local Audio Capture" and share the tab with the call. CuraLive transcribes and records everything in real-time.</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-1.5">The bot joins this meeting link as "CuraLive Intelligence" — a regular participant. No software needed on the client's side.</p>
                    )}
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
                    onClick={() => startSession.mutate(form)}
                    disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
                    className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                    {startSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {startSession.isPending
                      ? (RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? "Deploying bot..." : "Starting session...")
                      : (RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? "Start Shadow Intelligence" : "Start Local Capture Session")}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Session list — grouped into folders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Sessions ({sessions.data?.length ?? 0})
                  </h2>
                  {selectedSessionIds.size > 0 && (
                    <div className="flex items-center gap-1.5">
                      {confirmBulkDelete ? (
                        <>
                          <Button size="sm"
                            onClick={() => deleteSessions.mutate({ sessionIds: Array.from(selectedSessionIds) })}
                            disabled={deleteSessions.isPending}
                            className="bg-red-600 hover:bg-red-500 text-white gap-1 text-xs h-7 px-2">
                            {deleteSessions.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete {selectedSessionIds.size}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmBulkDelete(false)} className="text-slate-400 text-xs h-7 px-2">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost"
                            onClick={() => setConfirmBulkDelete(true)}
                            className="text-red-400 hover:text-red-300 gap-1 text-xs h-7 px-2">
                            <Trash2 className="w-3 h-3" />
                            Delete ({selectedSessionIds.size})
                          </Button>
                          <Button size="sm" variant="ghost"
                            onClick={() => setSelectedSessionIds(new Set())}
                            className="text-slate-500 text-xs h-7 px-2">
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {sessions.isLoading && <div className="text-slate-500 text-sm">Loading sessions...</div>}
                {sessions.data?.length === 0 && !sessions.isLoading && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center">
                    <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-sm text-slate-500">No sessions yet</div>
                    <div className="text-xs text-slate-600 mt-1">Start your first shadow session above</div>
                  </div>
                )}

                {[
                  { key: "active", label: "Active", sessions: groupedSessions.active, color: "text-emerald-400", dotColor: "bg-emerald-400", icon: Radio, canSelect: false },
                  { key: "completed", label: "Completed", sessions: groupedSessions.completed, color: "text-violet-400", dotColor: "bg-violet-400", icon: CheckCircle2, canSelect: true },
                  { key: "failed", label: "Failed", sessions: groupedSessions.failed, color: "text-red-400", dotColor: "bg-red-400", icon: AlertTriangle, canSelect: true },
                ].map(group => {
                  if (group.sessions.length === 0) return null;
                  const isCollapsed = collapsedGroups.has(group.key);
                  const GroupIcon = group.icon;
                  const allSelected = group.canSelect && group.sessions.every(s => selectedSessionIds.has(s.id));
                  const someSelected = group.canSelect && group.sessions.some(s => selectedSessionIds.has(s.id));

                  return (
                    <div key={group.key} className="space-y-1.5">
                      <button
                        onClick={() => toggleGroup(group.key)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                      >
                        {isCollapsed
                          ? <FolderClosed className={`w-4 h-4 ${group.color}`} />
                          : <FolderOpen className={`w-4 h-4 ${group.color}`} />
                        }
                        <span className={`text-xs font-semibold uppercase tracking-wider ${group.color}`}>
                          {group.label}
                        </span>
                        <span className="text-xs text-slate-600">({group.sessions.length})</span>
                        <div className="flex-1" />
                        {group.canSelect && !isCollapsed && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionIds(prev => {
                                const next = new Set(prev);
                                if (allSelected) {
                                  group.sessions.forEach(s => next.delete(s.id));
                                } else {
                                  group.sessions.forEach(s => next.add(s.id));
                                }
                                return next;
                              });
                            }}
                            className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                            title={allSelected ? "Deselect all" : "Select all"}
                          >
                            {allSelected
                              ? <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                              : someSelected
                                ? <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                                : <Square className="w-3.5 h-3.5" />
                            }
                          </span>
                        )}
                        {isCollapsed
                          ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                        }
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1.5 pl-1">
                          {group.sessions.map(session => (
                            <div key={session.id} className="flex items-start gap-1.5">
                              {group.canSelect && (
                                <button
                                  onClick={() => toggleSessionSelect(session.id)}
                                  className="mt-4 shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                  {selectedSessionIds.has(session.id)
                                    ? <CheckSquare className="w-4 h-4 text-violet-400" />
                                    : <Square className="w-4 h-4" />
                                  }
                                </button>
                              )}
                              <div className="flex-1">
                                <SessionCard
                                  session={session}
                                  onSelect={() => setActiveSessionId(session.id)}
                                  isSelected={activeSessionId === session.id}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                            {liveSession.status === "failed" && RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) && (
                              <Button size="sm"
                                onClick={() => retrySession.mutate({ sessionId: liveSession.id })}
                                disabled={retrySession.isPending}
                                className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/20 gap-1.5">
                                {retrySession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                                {retrySession.isPending ? "Retrying..." : "Retry Bot Join"}
                              </Button>
                            )}
                            {(liveSession.status === "completed" || liveSession.status === "failed") && (
                              confirmDeleteId === liveSession.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm"
                                    onClick={() => deleteSession.mutate({ sessionId: liveSession.id })}
                                    disabled={deleteSession.isPending}
                                    className="bg-red-600 hover:bg-red-500 text-white gap-1.5">
                                    {deleteSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Confirm Delete
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="text-slate-400">
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost"
                                  onClick={() => setConfirmDeleteId(liveSession.id)}
                                  className="text-slate-500 hover:text-red-400 gap-1.5">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )
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

                      {liveSession.status === "failed" && (
                        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-red-300">
                              {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) ? "Bot failed to join the meeting" : "Session failed to start"}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform)
                                ? "The meeting may have ended, the URL may be invalid, or the bot was blocked. You can retry if the meeting is still active."
                                : "Something went wrong starting this session. Please create a new session to try again."}
                            </div>
                          </div>
                          {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) && (
                            <Button size="sm"
                              onClick={() => retrySession.mutate({ sessionId: liveSession.id })}
                              disabled={retrySession.isPending}
                              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/20 gap-1.5 shrink-0">
                              {retrySession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                              {retrySession.isPending ? "Retrying..." : "Retry"}
                            </Button>
                          )}
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

                      {(() => {
                        const recUrl = (liveSession as any).recordingUrl;
                        const bStatus = (liveSession as any).botStatus;
                        const isCompleted = liveSession.status === "completed" || liveSession.status === "processing";
                        const isRecording = bStatus === "in_call" || liveSession.status === "live";
                        const isLocalRecording = recUrl && recUrl.startsWith("/api/shadow/recording/");

                        if (!recUrl && !isRecording && !isCompleted) return null;

                        return (
                          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-slate-300 font-medium">Event Recording</span>
                                {isRecording && !recUrl && (
                                  <span className="flex items-center gap-1 text-xs text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Recording
                                  </span>
                                )}
                              </div>
                              {recUrl && (
                                <div className="flex items-center gap-2">
                                  {!isLocalRecording && (
                                    <a href={recUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 transition-colors">
                                      <ExternalLink className="w-3 h-3" />
                                      Open
                                    </a>
                                  )}
                                  <a href={recUrl} download
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 transition-colors">
                                    <Download className="w-3 h-3" />
                                    {isLocalRecording ? "Download Recording" : "Download MP4"}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              {recUrl ? (
                                <div className="space-y-3">
                                  {isLocalRecording ? (
                                    <audio
                                      src={recUrl}
                                      controls
                                      preload="metadata"
                                      className="w-full"
                                    />
                                  ) : (
                                    <video
                                      src={recUrl}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="w-full rounded-lg bg-black/50 max-h-[400px]"
                                    >
                                      Your browser does not support video playback.
                                    </video>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>{isLocalRecording
                                      ? "Recording captured via Local Audio Capture — available for download and replay"
                                      : "Recording captured by Recall AI — available for download and replay"
                                    }</span>
                                  </div>
                                </div>
                              ) : isRecording ? (
                                <div className="flex items-center gap-3 py-4">
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                      <Video className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-300">Recording in progress</div>
                                    <div className="text-xs text-slate-500 mt-0.5">The meeting is being recorded. The recording will be available once the session ends.</div>
                                  </div>
                                </div>
                              ) : liveSession.status === "processing" ? (
                                <div className="flex items-center gap-3 py-4">
                                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin shrink-0" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-400">Saving recording...</div>
                                    <div className="text-xs text-slate-600 mt-0.5">The recording is being saved. This usually takes a few seconds.</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 py-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-400">No recording available</div>
                                    <div className="text-xs text-slate-600 mt-0.5">Start Local Audio Capture before the session to record the event.</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <LocalAudioCapture
                        sessionId={liveSession.id}
                        isActive={isActive}
                        onSegment={(seg) => {
                          setRealtimeSegments(prev => [...prev, seg]);
                        }}
                      />

                      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300 font-medium">Live Transcript</span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">{transcript.length} segments</span>
                            {transcript.length > 0 && (
                              <button
                                onClick={() => {
                                  const text = transcript.map(s =>
                                    `${(s as any).timeLabel ?? ""} ${s.speaker}: ${s.text}`
                                  ).join("\n\n");
                                  const blob = new Blob([text], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${liveSession.clientName}_${liveSession.eventName}_transcript.txt`.replace(/\s+/g, "_");
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  toast.success("Transcript downloaded");
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Export .txt
                              </button>
                            )}
                          </div>
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
                  Upload any past event — earnings calls, AGMs, town halls — and CuraLive will process it through the same intelligence pipeline as a live Shadow Mode session. Paste a transcript, upload a .txt file, or upload an audio/video recording (CuraLive transcribes it automatically via Whisper AI). Each archive generates 4 tagged intelligence records in your database.
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
                    Transcript Source <span className="text-red-400">*</span>
                  </h2>
                  <div className="flex gap-2 mb-4">
                    {([
                      { key: "paste", label: "Paste Text" },
                      { key: "file", label: "Upload .txt File" },
                      { key: "recording", label: "Upload Recording" },
                    ] as const).map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => setArchiveInputMode(key as any)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          archiveInputMode === key
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}>
                        {label}
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
                  ) : archiveInputMode === "file" ? (
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
                  ) : (
                    <div>
                      <div
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        onClick={() => archiveAudioRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const f = e.dataTransfer.files?.[0];
                          if (f) {
                            setArchiveRecFile(f);
                            setArchiveFileName(f.name);
                          }
                        }}>
                        <Mic className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        {archiveRecFile ? (
                          <div>
                            <p className="font-medium text-sm text-slate-200">{archiveRecFile.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {(archiveRecFile.size / 1024 / 1024).toFixed(1)} MB
                              {archiveRecFile.size > 20 * 1024 * 1024 && (
                                <span className="text-amber-400 ml-2">· Large file — auto-compressed on server, allow 5–10 min</span>
                              )}
                            </p>
                            {archiveForm.transcriptText && (
                              <p className="text-xs text-emerald-400 mt-1">{archiveWordCount.toLocaleString()} words transcribed</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-slate-300 mb-1">Click to select or drag & drop a recording</p>
                            <p className="text-xs text-slate-600">MP3, MP4, WAV, M4A, WebM, MOV, AVI &nbsp;·&nbsp; Up to 500MB</p>
                            <p className="text-xs text-slate-700 mt-1">CuraLive will transcribe the audio first, then run the full intelligence pipeline</p>
                          </div>
                        )}
                      </div>
                      <input ref={archiveAudioRef} type="file" accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm,.mov,.avi,.ogg,.flac" onChange={handleArchiveAudioChange} className="hidden" />
                      {archiveTranscribing && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-violet-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Transcribing audio with Whisper AI — this may take a few minutes for large files...
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

                <Button type="submit" disabled={processTranscript.isPending || archiveTranscribing}
                  className="w-full bg-violet-600 hover:bg-violet-500 gap-2 py-5">
                  {archiveTranscribing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing recording with Whisper AI...</>
                  ) : processTranscript.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing archive...</>
                  ) : archiveInputMode === "recording" ? (
                    <><Mic className="w-4 h-4" /> Transcribe Recording &amp; Generate Intelligence</>
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
                  Browse all events processed through CuraLive. Each event gets a comprehensive AI intelligence report with 12 analysis modules — executive summary, sentiment analysis, compliance review, key topics, speaker analysis, Q&A breakdown, action items, investor signals, communication scoring, risk factors, competitive intelligence, and strategic recommendations.
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
                        <div className="flex gap-2 shrink-0">
                          {!archiveDetail.data.ai_report && (
                            <Button size="sm" onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                              disabled={generateReport.isPending}
                              className="bg-violet-600 hover:bg-violet-500 gap-2">
                              {generateReport.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                              Generate AI Report
                            </Button>
                          )}
                          <Button size="sm" onClick={() => { setEmailModalArchiveId(selectedArchiveId); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                            className="bg-cyan-600 hover:bg-cyan-500 gap-2">
                            <FileText className="w-3.5 h-3.5" /> Email Report
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {(() => {
                        const d = archiveDetail.data;
                        const r = d.ai_report;
                        const sentColor = (d.sentiment_avg ?? 50) >= 70 ? "text-emerald-400" : (d.sentiment_avg ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                        const compColor = d.compliance_flags > 3 ? "text-red-400" : d.compliance_flags > 1 ? "text-amber-400" : "text-emerald-400";
                        const commScore = r?.communicationScore?.score;
                        const commColor = (commScore ?? 50) >= 70 ? "text-emerald-400" : (commScore ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                        return [
                          { label: "Sentiment", value: `${d.sentiment_avg ?? "N/A"}`, sub: "/100", color: sentColor },
                          { label: "Compliance", value: `${d.compliance_flags}`, sub: d.compliance_flags > 3 ? "High Risk" : d.compliance_flags > 1 ? "Moderate" : "Low Risk", color: compColor },
                          { label: "Comm. Score", value: commScore != null ? `${commScore}` : "—", sub: commScore != null ? "/100" : "", color: commColor },
                          { label: "Words", value: d.word_count?.toLocaleString(), sub: "", color: "text-blue-400" },
                          { label: "Segments", value: `${d.segment_count}`, sub: "", color: "text-blue-400" },
                        ].map(({ label, value, sub, color }) => (
                          <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center">
                            <div className={`text-xl font-bold ${color}`}>{value}<span className="text-xs text-slate-600 ml-0.5">{sub}</span></div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {archiveDetail.data.ai_report ? (() => {
                      const r = archiveDetail.data.ai_report;
                      const severityColor = (s: string) =>
                        s === "Positive" || s === "Low" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        s === "Neutral" || s === "Medium" || s === "Routine" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        "text-red-400 bg-red-500/10 border-red-500/20";

                      const ReportSection = ({ id, icon: Icon, title, iconColor, count, children }: any) => {
                        const isOpen = expandedSections[id] !== false;
                        return (
                          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                            <button onClick={() => toggleSection(id)}
                              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${iconColor.replace("text-", "bg-").replace("400", "500/10")} border ${iconColor.replace("text-", "border-").replace("400", "500/20")}`}>
                                  <Icon className={`w-4 h-4 ${iconColor}`} />
                                </div>
                                <span className="text-sm font-semibold text-slate-200">{title}</span>
                                {count != null && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">{count}</span>}
                              </div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                            </button>
                            {isOpen && <div className="px-5 pb-4 border-t border-white/5 pt-3">{children}</div>}
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-3">
                          {r.executiveSummary && (
                            <div className="bg-gradient-to-r from-cyan-500/5 to-violet-500/5 border border-cyan-500/20 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Executive Summary</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{r.executiveSummary}</p>
                            </div>
                          )}

                          <ReportSection id="sentiment" icon={Activity} title="Sentiment Analysis" iconColor="text-emerald-400">
                            <p className="text-sm text-slate-400 leading-relaxed mb-3">{r.sentimentAnalysis?.narrative}</p>
                            {r.sentimentAnalysis?.keyDrivers?.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Key Drivers</p>
                                {r.sentimentAnalysis.keyDrivers.map((d: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                    <span>{d}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ReportSection>

                          <ReportSection id="compliance" icon={Shield} title="Compliance Review" iconColor="text-amber-400"
                            count={r.complianceReview?.flaggedPhrases?.length || 0}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-slate-500">Risk Level:</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityColor(r.complianceReview?.riskLevel === "Low" ? "Positive" : r.complianceReview?.riskLevel === "High" || r.complianceReview?.riskLevel === "Critical" ? "Critical" : "Neutral")}`}>
                                {r.complianceReview?.riskLevel}
                              </span>
                            </div>
                            {r.complianceReview?.flaggedPhrases?.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Flagged Phrases</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {r.complianceReview.flaggedPhrases.map((p: string, i: number) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">{p}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {r.complianceReview?.recommendations?.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Recommendations</p>
                                {r.complianceReview.recommendations.map((rec: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ReportSection>

                          <ReportSection id="topics" icon={Tag} title="Key Topics Discussed" iconColor="text-violet-400"
                            count={r.keyTopics?.length || 0}>
                            <div className="space-y-2">
                              {(r.keyTopics || []).map((t: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-200">{t.topic}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(t.sentiment)}`}>{t.sentiment}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed">{t.detail}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="speakers" icon={UserCheck} title="Speaker Analysis" iconColor="text-blue-400"
                            count={r.speakerAnalysis?.length || 0}>
                            <div className="space-y-3">
                              {(r.speakerAnalysis || []).map((s: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-200">{s.speaker}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{s.role}</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {(s.keyPoints || []).map((p: string, j: number) => (
                                      <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                        <ChevronRight className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="questions" icon={HelpCircle} title="Q&A Analysis" iconColor="text-cyan-400"
                            count={r.questionsAsked?.length || 0}>
                            <div className="space-y-2">
                              {(r.questionsAsked || []).map((q: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <p className="text-sm text-slate-200 mb-1.5">"{q.question}"</p>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>Asked by: <span className="text-slate-400">{q.askedBy}</span></span>
                                    <span className={`px-2 py-0.5 rounded-full border ${severityColor(q.quality)}`}>{q.quality}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="signals" icon={Target} title="Investor Signals" iconColor="text-orange-400"
                            count={r.investorSignals?.length || 0}>
                            <div className="space-y-2">
                              {(r.investorSignals || []).map((s: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-200">{s.signal}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(s.severity)}`}>{s.severity}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{s.interpretation}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="actions" icon={ListChecks} title="Action Items" iconColor="text-green-400"
                            count={r.actionItems?.length || 0}>
                            <div className="space-y-2">
                              {(r.actionItems || []).map((a: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-slate-200">{a.item}</p>
                                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                      <span>Owner: <span className="text-slate-400">{a.owner}</span></span>
                                      {a.deadline && a.deadline !== "Not mentioned" && <span>Deadline: <span className="text-slate-400">{a.deadline}</span></span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="communication" icon={MessageSquare} title="Communication Assessment" iconColor="text-indigo-400">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              {[
                                { label: "Overall", value: r.communicationScore?.score },
                                { label: "Clarity", value: r.communicationScore?.clarity },
                                { label: "Transparency", value: r.communicationScore?.transparency },
                              ].map(({ label, value }) => {
                                const c = (value ?? 50) >= 70 ? "text-emerald-400" : (value ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                                return (
                                  <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                    <div className={`text-lg font-bold ${c}`}>{value ?? "—"}<span className="text-xs text-slate-600">/100</span></div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{r.communicationScore?.narrative}</p>
                          </ReportSection>

                          <ReportSection id="risks" icon={AlertTriangle} title="Risk Factors" iconColor="text-red-400"
                            count={r.riskFactors?.length || 0}>
                            <div className="space-y-2">
                              {(r.riskFactors || []).map((rf: any, i: number) => (
                                <div key={i} className="flex items-start justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <span className="text-sm text-slate-200">{rf.factor}</span>
                                  <div className="flex gap-2 shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(rf.impact === "High" ? "Critical" : rf.impact === "Low" ? "Positive" : "Neutral")}`}>
                                      Impact: {rf.impact}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(rf.likelihood === "High" ? "Critical" : rf.likelihood === "Low" ? "Positive" : "Neutral")}`}>
                                      Likelihood: {rf.likelihood}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="competitive" icon={Swords} title="Competitive Intelligence" iconColor="text-pink-400"
                            count={r.competitiveIntelligence?.length || 0}>
                            <div className="space-y-2">
                              {(r.competitiveIntelligence || []).map((c: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <p className="text-sm font-medium text-slate-200 mb-1">{c.mention}</p>
                                  <p className="text-xs text-slate-400">{c.context}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          {r.recommendations?.length > 0 && (
                            <ReportSection id="recommendations" icon={Lightbulb} title="AI Recommendations" iconColor="text-yellow-400"
                              count={r.recommendations.length}>
                              <div className="space-y-2">
                                {r.recommendations.map((rec: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.speakingPaceAnalysis && (
                            <ReportSection id="speakingPace" icon={Gauge} title="Speaking Pace Coach" iconColor="text-teal-400">
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                {[
                                  { label: "WPM", value: r.speakingPaceAnalysis.overallWpm, color: r.speakingPaceAnalysis.overallWpm >= 130 && r.speakingPaceAnalysis.overallWpm <= 160 ? "text-emerald-400" : "text-amber-400" },
                                  { label: "Pace", value: r.speakingPaceAnalysis.paceLabel, color: r.speakingPaceAnalysis.paceLabel === "Normal" ? "text-emerald-400" : "text-amber-400" },
                                  { label: "Delivery", value: `${r.speakingPaceAnalysis.deliveryScore}/100`, color: r.speakingPaceAnalysis.deliveryScore >= 70 ? "text-emerald-400" : "text-amber-400" },
                                ].map(({ label, value, color }) => (
                                  <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                  </div>
                                ))}
                              </div>
                              {r.speakingPaceAnalysis.fillerWords?.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Filler Words Detected</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {r.speakingPaceAnalysis.fillerWords.map((fw: any, i: number) => (
                                      <span key={i} className="text-xs px-2 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">"{fw.word}" x{fw.count}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {r.speakingPaceAnalysis.coachingTips?.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Coaching Tips</p>
                                  {r.speakingPaceAnalysis.coachingTips.map((tip: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                                      <Lightbulb className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                                      <span>{tip}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ReportSection>
                          )}

                          {r.toxicityScreen && (
                            <ReportSection id="toxicity" icon={ShieldAlert} title="Toxicity & Language Risk" iconColor="text-rose-400"
                              count={r.toxicityScreen.flaggedContent?.length || 0}>
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-medium text-slate-500">Overall Risk:</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  r.toxicityScreen.overallRisk === "Clean" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.toxicityScreen.overallRisk === "Low" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.toxicityScreen.overallRisk}</span>
                                {r.toxicityScreen.priceSensitive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">Price Sensitive</span>}
                                {r.toxicityScreen.legalRisk && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">Legal Risk</span>}
                              </div>
                              {r.toxicityScreen.flaggedContent?.length > 0 && (
                                <div className="space-y-2">
                                  {r.toxicityScreen.flaggedContent.map((fc: any, i: number) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                      <p className="text-sm text-slate-200 mb-1">"{fc.phrase}"</p>
                                      <div className="flex gap-2 text-xs text-slate-500">
                                        <span>{fc.issue}</span>
                                        <span className={`px-2 py-0.5 rounded-full border ${severityColor(fc.severity === "Low" ? "Positive" : fc.severity === "High" ? "Critical" : "Neutral")}`}>{fc.severity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ReportSection>
                          )}

                          {r.sentimentArc && (
                            <ReportSection id="sentimentArc" icon={LineChart} title="Sentiment Arc" iconColor="text-purple-400">
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                {[
                                  { label: "Opening", value: r.sentimentArc.opening },
                                  { label: "Midpoint", value: r.sentimentArc.midpoint },
                                  { label: "Closing", value: r.sentimentArc.closing },
                                ].map(({ label, value }) => {
                                  const c = value >= 70 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400";
                                  return (
                                    <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                      <div className={`text-lg font-bold ${c}`}>{value}<span className="text-xs text-slate-600">/100</span></div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-slate-500">Trend:</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  r.sentimentArc.trend === "Improving" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.sentimentArc.trend === "Stable" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.sentimentArc.trend}</span>
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed">{r.sentimentArc.narrative}</p>
                            </ReportSection>
                          )}

                          {r.financialHighlights?.length > 0 && (
                            <ReportSection id="financials" icon={Banknote} title="Financial Highlights" iconColor="text-green-400"
                              count={r.financialHighlights.length}>
                              <div className="space-y-2">
                                {r.financialHighlights.map((fh: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-200">{fh.metric}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-400">{fh.value}</span>
                                        {fh.yoyChange && <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                          fh.yoyChange.startsWith("+") ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                          fh.yoyChange.startsWith("-") ? "text-red-400 bg-red-500/10 border-red-500/20" :
                                          "text-slate-400 bg-white/5 border-white/10"
                                        }`}>{fh.yoyChange}</span>}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-400">{fh.context}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.esgMentions?.length > 0 && (
                            <ReportSection id="esg" icon={Leaf} title="ESG & Sustainability" iconColor="text-lime-400"
                              count={r.esgMentions.length}>
                              <div className="space-y-2">
                                {r.esgMentions.map((e: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-200">{e.topic}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(e.sentiment)}`}>{e.sentiment}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{e.commitment}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.pressReleaseDraft && (
                            <ReportSection id="pressRelease" icon={Newspaper} title="Press Release Draft" iconColor="text-sky-400">
                              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{r.pressReleaseDraft}</p>
                              </div>
                              <Button size="sm" variant="outline" className="mt-3 border-white/10 text-slate-400 hover:text-white gap-2"
                                onClick={() => { navigator.clipboard.writeText(r.pressReleaseDraft); toast.success("Press release copied to clipboard"); }}>
                                <Copy className="w-3.5 h-3.5" /> Copy to Clipboard
                              </Button>
                            </ReportSection>
                          )}

                          {r.socialMediaContent?.length > 0 && (
                            <ReportSection id="social" icon={Share2} title="Social Media Content" iconColor="text-blue-400"
                              count={r.socialMediaContent.length}>
                              <div className="space-y-3">
                                {r.socialMediaContent.map((sc: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{sc.platform}</span>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-500 hover:text-white gap-1"
                                        onClick={() => { navigator.clipboard.writeText(sc.content); toast.success(`${sc.platform} post copied`); }}>
                                        <Copy className="w-3 h-3" /> Copy
                                      </Button>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{sc.content}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.boardReadySummary && (
                            <ReportSection id="board" icon={Briefcase} title="Board-Ready Summary" iconColor="text-amber-400">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-medium text-slate-500">Board Verdict:</span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                                  r.boardReadySummary.verdict === "Strong" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.boardReadySummary.verdict === "Satisfactory" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                  r.boardReadySummary.verdict === "Concerning" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.boardReadySummary.verdict}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Key Risks</p>
                                  {(r.boardReadySummary.keyRisks || []).map((risk: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-red-300 mb-1">
                                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{risk}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Opportunities</p>
                                  {(r.boardReadySummary.keyOpportunities || []).map((opp: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-300 mb-1">
                                      <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{opp}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Recommended Actions</p>
                                  {(r.boardReadySummary.recommendedActions || []).map((act: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-blue-300 mb-1">
                                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </ReportSection>
                          )}

                          {r.modulesGenerated && (
                            <div className="bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-violet-400" />
                                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">{r.modulesGenerated} AI Modules Processed</span>
                              </div>
                              <span className="text-xs text-slate-500">All modules run on every event — select which to include in reports</span>
                            </div>
                          )}

                          {(archiveDetail.data as any).specialised_algorithms_run > 0 && (() => {
                            const sa = (archiveDetail.data as any).specialised_analysis;
                            const sessionType = (archiveDetail.data as any).specialised_session_type;
                            const algCount = (archiveDetail.data as any).specialised_algorithms_run;
                            if (!sa) return null;

                            const isBastion = sessionType === "bastion";
                            const gradientClass = isBastion
                              ? "from-amber-500/5 to-orange-500/5 border-amber-500/20"
                              : "from-emerald-500/5 to-cyan-500/5 border-emerald-500/20";
                            const accentColor = isBastion ? "text-amber-400" : "text-emerald-400";
                            const labelColor = isBastion ? "text-amber-300" : "text-emerald-300";

                            return (
                              <div className="space-y-3 mt-2">
                                <div className={`bg-gradient-to-r ${gradientClass} border rounded-xl p-4`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Brain className={`w-4 h-4 ${accentColor}`} />
                                    <span className={`text-xs font-semibold ${labelColor} uppercase tracking-wider`}>
                                      {algCount} Specialised {isBastion ? "Investor Intelligence" : "Governance"} Algorithms Run
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {isBastion && sa.earningsSentiment && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Spin Index</div>
                                        <div className={`text-lg font-bold ${sa.earningsSentiment.spinIndex > 30 ? "text-red-400" : "text-emerald-400"}`}>
                                          {sa.earningsSentiment.spinIndex}<span className="text-xs text-slate-600">/100</span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">Tone: {sa.earningsSentiment.managementToneScore} | Substance: {sa.earningsSentiment.substanceScore}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.forwardGuidance && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Forward Guidance</div>
                                        <div className="text-lg font-bold text-blue-400">{sa.forwardGuidance.guidanceItems}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                          {sa.forwardGuidance.raised > 0 && <span className="text-emerald-400">{sa.forwardGuidance.raised} raised </span>}
                                          {sa.forwardGuidance.lowered > 0 && <span className="text-red-400">{sa.forwardGuidance.lowered} lowered </span>}
                                          {sa.forwardGuidance.newGuidance > 0 && <span className="text-cyan-400">{sa.forwardGuidance.newGuidance} new</span>}
                                        </div>
                                      </div>
                                    )}
                                    {isBastion && sa.analystQuestions && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Analyst Q&A</div>
                                        <div className="text-lg font-bold text-violet-400">{sa.analystQuestions.totalQuestions}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                          {sa.analystQuestions.hostileCount > 0 && <span className="text-red-400">{sa.analystQuestions.hostileCount} hostile </span>}
                                          {(sa.analystQuestions.topThemes || []).slice(0, 2).join(", ")}
                                        </div>
                                      </div>
                                    )}
                                    {isBastion && sa.credibility && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Credibility</div>
                                        <div className={`text-lg font-bold ${sa.credibility.credibilityScore >= 70 ? "text-emerald-400" : sa.credibility.credibilityScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                                          {sa.credibility.credibilityScore}<span className="text-xs text-slate-600">/100</span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.credibility.consistencyRating}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.marketMoving && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Market-Moving</div>
                                        <div className={`text-lg font-bold ${sa.marketMoving.marketMovingCount > 0 ? "text-orange-400" : "text-slate-500"}`}>
                                          {sa.marketMoving.marketMovingCount}
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">Impact: {sa.marketMoving.overallImpact}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.investmentBrief && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recommendation</div>
                                        <div className={`text-sm font-bold ${
                                          sa.investmentBrief.overallRating === "overweight" ? "text-emerald-400" :
                                          sa.investmentBrief.overallRating === "underweight" ? "text-red-400" : "text-blue-400"
                                        }`}>
                                          {(sa.investmentBrief.overallRating ?? "").replace(/_/g, " ").toUpperCase()}
                                        </div>
                                      </div>
                                    )}
                                    {!isBastion && sa.regulatoryCompliance && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Regulatory Alerts</div>
                                        <div className={`text-lg font-bold ${(sa.regulatoryCompliance.alerts?.length ?? 0) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                          {sa.regulatoryCompliance.alerts?.length ?? 0}
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.regulatoryCompliance.overallRisk ?? "N/A"} risk</div>
                                      </div>
                                    )}
                                    {!isBastion && sa.dissentPatterns && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Dissent Patterns</div>
                                        <div className="text-lg font-bold text-amber-400">{sa.dissentPatterns.patternsFound}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.dissentPatterns.riskLevel ?? "N/A"} risk</div>
                                      </div>
                                    )}
                                    {!isBastion && sa.governanceQuestions && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Governance Q&A</div>
                                        <div className="text-lg font-bold text-cyan-400">{sa.governanceQuestions.governanceQuestionCount ?? 0}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })() : (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
                        <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 mb-1">No AI report generated yet</p>
                        <p className="text-xs text-slate-600 mb-4">This archive was processed before the AI report feature was added.</p>
                        <Button onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                          disabled={generateReport.isPending}
                          className="bg-violet-600 hover:bg-violet-500 gap-2">
                          {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                          {generateReport.isPending ? "Generating AI Report..." : "Generate Full AI Report"}
                        </Button>
                      </div>
                    )}

                    {archiveDetail.data.ai_report && (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setShowModuleSelector(!showModuleSelector)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Send className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold text-slate-200">Select Modules for Client Report</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                              {selectedModules.size}/{ALL_REPORT_MODULES.length} selected
                            </span>
                          </div>
                          {showModuleSelector ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </button>
                        {showModuleSelector && (
                          <div className="px-5 pb-4 border-t border-white/5">
                            <div className="flex items-center justify-between py-3 mb-2">
                              <p className="text-xs text-slate-500">Choose which AI modules to include when sending this report to the client. All modules are always processed and stored.</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 hover:text-white h-7 px-2"
                                  onClick={() => setSelectedModules(new Set(ALL_REPORT_MODULES.map(m => m.id)))}>Select All</Button>
                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 hover:text-white h-7 px-2"
                                  onClick={() => setSelectedModules(new Set())}>Clear All</Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {ALL_REPORT_MODULES.map(({ id, label, icon: ModIcon }) => {
                                const checked = selectedModules.has(id);
                                return (
                                  <button key={id} onClick={() => toggleModule(id)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                                      checked ? "bg-violet-500/10 border border-violet-500/20" : "bg-white/[0.01] border border-white/5 hover:border-white/10"
                                    }`}>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                      checked ? "bg-violet-500 text-white" : "bg-white/5 border border-white/20"
                                    }`}>
                                      {checked && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <ModIcon className={`w-3.5 h-3.5 ${checked ? "text-violet-300" : "text-slate-600"}`} />
                                    <span className={`text-xs font-medium ${checked ? "text-slate-200" : "text-slate-500"}`}>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-xs text-slate-600">Selected modules will be included when emailing this report to clients</span>
                              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 gap-2 h-8">
                                <Send className="w-3.5 h-3.5" />
                                Preview Client Report ({selectedModules.size} modules)
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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

                    <OperatorCorrectionPanel
                      eventId={`archive-${archiveDetail.data.id}`}
                      eventTitle={`${archiveDetail.data.client_name} — ${archiveDetail.data.event_name}`}
                      eventType={archiveDetail.data.event_type}
                      clientName={archiveDetail.data.client_name}
                      sentimentAvg={archiveDetail.data.sentiment_avg}
                      complianceFlags={archiveDetail.data.compliance_flags}
                    />

                    <div className="flex gap-3 flex-wrap">
                      {archiveDetail.data.ai_report && (
                        <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                          disabled={generateReport.isPending}
                          className="border-white/10 text-slate-400 hover:text-white gap-2">
                          {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Regenerate Report
                        </Button>
                      )}
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
            AI DASHBOARD TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "aidashboard" && (
          <AIDashboard sessions={sessions.data ?? []} />
        )}

        {/* ══════════════════════════════════════════════════
            AI LEARNING TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "ailearning" && (
          <AILearningDashboard />
        )}

        {/* ══════════════════════════════════════════════════
            AI ADVISORY BOT TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "advisory" && (
          <AdvisoryBotPanel />
        )}

        {/* ══════════════════════════════════════════════════
            LIVE Q&A TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "liveqa" && (
          <LiveQaDashboard
            shadowSessionId={activeSessionId || undefined}
            eventName={sessions.data?.find((s: any) => s.id === activeSessionId)?.eventName || "Live Event"}
            clientName={sessions.data?.find((s: any) => s.id === activeSessionId)?.clientName || ""}
          />
        )}

        {/* ══════════════════════════════════════════════════
            SYSTEM DIAGNOSTICS TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "diagnostics" && (
          <SystemDiagnostics />
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
  const evolution = trpc.aiEvolution.getDashboard.useQuery(undefined, { refetchInterval: 30000 });
  const runAccumulation = trpc.aiEvolution.runAccumulation.useMutation({
    onSuccess: (data) => {
      toast.success(`Accumulation: ${data.proposalsCreated} new, ${data.proposalsUpdated} updated, ${data.promoted.length} promoted`);
      evolution.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateProposalStatus = trpc.aiEvolution.updateProposalStatus.useMutation({
    onSuccess: () => { toast.success("Proposal updated"); evolution.refetch(); },
    onError: (err) => toast.error(err.message),
  });

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

      {/* ═══ Autonomous Evolution Dashboard ═══ */}
      <div className="border-t border-purple-500/20 pt-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Autonomous Evolution Engine</h2>
              <p className="text-xs text-slate-500">Self-observing AI that detects gaps, proposes new tools, and auto-promotes based on evidence</p>
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={runAccumulation.isPending}
            onClick={() => runAccumulation.mutate()}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${runAccumulation.isPending ? "animate-spin" : ""}`} />
            Run Accumulation
          </Button>
        </div>

        {evolution.data && (
          <>
            {/* Evolution velocity stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {[
                { label: "Events Analyzed", value: evolution.data.eventsAnalyzed, color: "text-indigo-400" },
                { label: "Observations", value: evolution.data.totalObservations, color: "text-purple-400" },
                { label: "Tool Proposals", value: evolution.data.proposals?.length ?? 0, color: "text-cyan-400" },
                { label: "Last 7 Days", value: evolution.data.velocity?.last7days ?? 0, color: "text-emerald-400" },
                { label: "Last 30 Days", value: evolution.data.velocity?.last30days ?? 0, color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Observation type breakdown */}
            {evolution.data.observationsByType && Object.keys(evolution.data.observationsByType).length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Observation Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(evolution.data.observationsByType).map(([type, count]) => {
                    const typeColors: Record<string, string> = {
                      weak_module: "bg-red-500/10 text-red-400 border-red-500/20",
                      missing_capability: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      repeated_pattern: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      data_gap: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      cross_event_trend: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      operator_friction: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    };
                    return (
                      <span key={type} className={`px-3 py-1.5 rounded-full border text-xs font-medium ${typeColors[type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {type.replace(/_/g, " ")}: {count as number}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Gap Detection Matrix */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-400" /> Module Gap Matrix
                </h3>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {(evolution.data.gapMatrix ?? []).slice(0, 10).map((g: any) => (
                    <div key={g.module} className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.01] rounded-lg">
                      <span className="text-xs text-slate-400 w-36 truncate">{g.module}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${Math.min(100, g.gapScore * 200)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{(g.failRate * 100).toFixed(0)}% fail</span>
                    </div>
                  ))}
                  {(evolution.data.gapMatrix ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No gap data yet — process events to build the matrix</p>
                  )}
                </div>
              </div>

              {/* Cross-Event Patterns */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" /> Cross-Event Patterns
                </h3>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {(evolution.data.crossEventPatterns ?? []).map((p: any, i: number) => (
                    <div key={i} className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                      <div className="text-xs text-slate-300 font-medium mb-1 truncate">{p.pattern}</div>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>{p.frequency}x seen</span>
                        <span>{p.clientCount} clients</span>
                        <span>{p.eventTypeCount} event types</span>
                        <span className="ml-auto text-cyan-400 font-medium">{(p.breadthScore * 100).toFixed(0)}% breadth</span>
                      </div>
                    </div>
                  ))}
                  {(evolution.data.crossEventPatterns ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Patterns emerge after analyzing multiple events across different clients</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tool Proposals */}
            <div className="bg-white/[0.02] border border-indigo-500/20 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Autonomous Tool Proposals
                </h3>
                {evolution.data.proposalsByStatus && (
                  <div className="flex gap-2">
                    {Object.entries(evolution.data.proposalsByStatus).map(([status, ct]) => {
                      const sColors: Record<string, string> = {
                        emerging: "text-slate-400 bg-slate-500/10",
                        proposed: "text-amber-400 bg-amber-500/10",
                        approved: "text-emerald-400 bg-emerald-500/10",
                        building: "text-blue-400 bg-blue-500/10",
                        live: "text-purple-400 bg-purple-500/10",
                        rejected: "text-red-400 bg-red-500/10",
                      };
                      return (
                        <span key={status} className={`text-xs px-2 py-0.5 rounded-full ${sColors[status] ?? "text-slate-400 bg-slate-500/10"}`}>
                          {status}: {ct as number}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {(evolution.data.proposals ?? []).map((p: any) => {
                  const statusColors: Record<string, string> = {
                    emerging: "border-slate-500/30 bg-white/[0.01]",
                    proposed: "border-amber-500/30 bg-amber-500/[0.03]",
                    approved: "border-emerald-500/30 bg-emerald-500/[0.03]",
                    building: "border-blue-500/30 bg-blue-500/[0.03]",
                    live: "border-purple-500/30 bg-purple-500/[0.03]",
                    rejected: "border-red-500/20 bg-red-500/[0.02] opacity-50",
                  };
                  const impactColors: Record<string, string> = {
                    low: "text-slate-400", medium: "text-amber-400", high: "text-orange-400", transformative: "text-red-400",
                  };
                  return (
                    <div key={p.id} className={`border rounded-lg p-3 ${statusColors[p.status] ?? "border-white/10"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-200">{p.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              p.status === "emerging" ? "bg-slate-500/20 text-slate-400" :
                              p.status === "proposed" ? "bg-amber-500/20 text-amber-400" :
                              p.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                              p.status === "building" ? "bg-blue-500/20 text-blue-400" :
                              p.status === "live" ? "bg-purple-500/20 text-purple-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {p.status}
                            </span>
                            {p.estimatedImpact && (
                              <span className={`text-xs font-medium ${impactColors[p.estimatedImpact] ?? "text-slate-400"}`}>
                                {p.estimatedImpact} impact
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                          <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                            <span>{p.evidenceCount} evidence</span>
                            <span>Confidence: {((p.avgConfidence ?? 0) * 100).toFixed(0)}%</span>
                            <span className="text-slate-600">{p.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {p.status === "emerging" && (
                            <Button size="sm" variant="ghost" className="text-xs h-7 text-amber-400 hover:bg-amber-500/10"
                              onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "proposed" })}>
                              Propose
                            </Button>
                          )}
                          {p.status === "proposed" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "approved" })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:bg-red-500/10"
                                onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "rejected" })}>
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(evolution.data.proposals ?? []).length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No tool proposals yet</p>
                    <p className="text-xs text-slate-600 mt-1">Process events through Shadow Mode — the AI will observe its own outputs and propose new tools</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Observations */}
            {(evolution.data.recentObservations ?? []).length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" /> Recent Observations
                </h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {(evolution.data.recentObservations ?? []).slice(0, 15).map((o: any) => {
                    const tColors: Record<string, string> = {
                      weak_module: "text-red-400 bg-red-500/10",
                      missing_capability: "text-amber-400 bg-amber-500/10",
                      repeated_pattern: "text-blue-400 bg-blue-500/10",
                      data_gap: "text-purple-400 bg-purple-500/10",
                      cross_event_trend: "text-emerald-400 bg-emerald-500/10",
                    };
                    return (
                      <div key={o.id} className="flex items-start gap-2 px-3 py-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${tColors[o.observationType] ?? "text-slate-400 bg-slate-500/10"}`}>
                          {(o.observationType ?? "").replace(/_/g, " ")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-300 line-clamp-1">{o.observation}</p>
                          <div className="flex gap-2 mt-0.5 text-xs text-slate-600">
                            {o.clientName && <span>{o.clientName}</span>}
                            {o.eventType && <span>{o.eventType}</span>}
                            <span>Conf: {((o.confidence ?? 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Algorithm stats card */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">Autonomous Evolution Algorithms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                <div>
                  <p className="text-slate-300 font-medium mb-1">Module Quality Scoring</p>
                  <p>Weighted depth/breadth/specificity analysis per module. Detects generic output vs transcript-specific intelligence.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Evidence Decay (14-day half-life)</p>
                  <p>Recent observations weighted exponentially higher. Proposals must sustain evidence to promote — stale gaps decay away.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Cross-Event Correlation</p>
                  <p>Detects patterns spanning multiple clients and event types. High-breadth gaps auto-promote to proposed tools.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 mt-4">
                <div>
                  <p className="text-slate-300 font-medium mb-1">Autonomous Promotion</p>
                  <p>Tools auto-promote: emerging (5+ evidence, 55%+ score) → proposed → approved (12+ evidence, 70%+ score).</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Gap Detection Matrix</p>
                  <p>Importance × failure_rate × (1-quality) × breadth. Systematically identifies blind spots across the 20-module grid.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Impact Estimation</p>
                  <p>Frequency × breadth × severity × urgency composite. Each proposed tool gets a live impact score that evolves with data.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!evolution.data && !evolution.isLoading && (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Evolution engine not initialized</p>
            <p className="text-xs text-slate-600 mt-1">Process events through Shadow Mode to start the autonomous evolution cycle</p>
          </div>
        )}

        {evolution.isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-slate-500">Loading evolution data...</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-purple-300 mb-3">How the Self-Improving Loop Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs text-slate-400">
          {[
            { step: "1", title: "AI Observes", desc: "Every report is auto-scored for depth, breadth, and specificity across all 20 modules." },
            { step: "2", title: "Gaps Detected", desc: "Weak modules and missing capabilities are logged as observations with confidence scores." },
            { step: "3", title: "Patterns Cluster", desc: "The accumulation engine groups observations into tool proposals using cross-event correlation." },
            { step: "4", title: "Evidence Builds", desc: "Proposals gain evidence over time. Recent data weighted higher (14-day half-life decay)." },
            { step: "5", title: "Auto-Promote", desc: "Tools with sufficient evidence auto-promote: emerging → proposed → approved → built → live." },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mb-2">{step}</div>
              <p className="text-slate-300 font-medium mb-1">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdvisoryBotPanel() {
  const [sessionKey] = useState(() => `advisory-${Date.now()}`);
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const history = trpc.advisoryBot.getHistory.useQuery({ sessionKey }, {
    refetchInterval: false,
  });

  const chatMutation = trpc.advisoryBot.chat.useMutation({
    onSuccess: () => {
      history.refetch();
      setIsStreaming(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsStreaming(false);
    },
  });

  const clearMutation = trpc.advisoryBot.clearHistory.useMutation({
    onSuccess: () => {
      history.refetch();
      toast.success("Chat history cleared");
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;
    setIsStreaming(true);
    setMessage("");
    chatMutation.mutate({ sessionKey, message: trimmed });
  }, [message, isStreaming, sessionKey, chatMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.data]);

  const messages = history.data ?? [];

  const suggestedQuestions = [
    "What are the top risks across all recent events?",
    "Which client has the lowest sentiment trend?",
    "Summarize compliance flags from the past month",
    "What key topics were discussed most frequently?",
    "Are there any early warning signs of crisis?",
  ];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10">
            <MessageCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Private AI Advisory Bot</h2>
            <p className="text-xs text-slate-500">Query across all captured event intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate({ sessionKey })}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 mb-4">
              <Brain className="w-10 h-10 text-rose-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Ask anything about your events</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              The advisory bot has access to all your captured event data, AI reports,
              sentiment analysis, and compliance reviews. Ask strategic questions to get actionable insights.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(q);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-xs px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-rose-500/10 border border-rose-500/20 text-slate-200"
                : "bg-white/[0.03] border border-white/10 text-slate-300"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-medium text-rose-400/70">CuraLive Advisory</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="text-[10px] text-slate-600 mt-1.5">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-medium text-rose-400/70">CuraLive Advisory</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                <span className="text-sm text-slate-400">Analyzing your event data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about events, sentiment, compliance, risks..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/30 focus:ring-1 focus:ring-rose-500/20 transition-colors"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isStreaming}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 rounded-xl px-4 py-3 h-auto"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
