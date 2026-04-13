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
import BroadcastControl from "@/components/BroadcastControl";
// WP1 & WP2: Import the ShadowModeShell structural components
import {
  ShadowModeShell,
  ShadowModeWorkstreamNav,
  ShadowModePageHeader,
  ShadowModeMainContentFrame,
  ShadowModeQueueRail,
  ShadowModeLandingState,
} from "@/components/operator-shell/ShadowModeShell";
import type { ShadowModeWorkstream } from "@/components/operator-shell/ShadowModeShell";

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
  earnings_call: "Earnings Call", interim_results: "Interim Results", annual_results: "Annual Results", results_call: "Results Call", media_call: "Media Call", analyst_call: "Analyst Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast",
  investor_day: "Investor Day", roadshow: "Roadshow", special_call: "Special Call",
  ipo_roadshow: "IPO Roadshow", ipo_listing: "IPO Listing", pre_ipo: "Pre-IPO",
  manda_call: "M&A Deal Call", takeover_announcement: "Takeover Announcement", merger_announcement: "Merger Announcement", scheme_of_arrangement: "Scheme of Arrangement",
  credit_rating_call: "Credit Rating Call", bondholder_meeting: "Bondholder Meeting", debt_restructuring: "Debt Restructuring",
  proxy_contest: "Proxy Contest", activist_meeting: "Activist Meeting", extraordinary_general_meeting: "Extraordinary General Meeting",
  other: "Other",
};

const ARCHIVE_PLATFORMS = ["Zoom", "Microsoft Teams", "Google Meet", "Webex", "In-Person", "Audio", "Other"];

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

  // WP1: Workstream navigation state (Prepare | Capture | Understand | Deliver)
  const [activeWorkstream, setActiveWorkstream] = useState<ShadowModeWorkstream>("capture");
  // Tab state (internal — preserved, not removed)
  const [activeTab, setActiveTab] = useState<"live" | "archive" | "reports" | "ailearning" | "aidashboard" | "advisory" | "diagnostics" | "liveqa" | "broadcast">("live");

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

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
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

  // WP2: Compute active session context
  const hasActiveContext = (groupedSessions.active?.length ?? 0) > 0 || activeSessionId != null;

  const mainContent = (
    <div className="space-y-8">
      {/* Header and internal tab bar preserved for Capture workstream */}
      <div className="border-b border-white/10 bg-[#0d0d14] -mx-6 -mt-8 px-6 py-4 mb-8">
        {!embedded && (
          <div className="flex items-center justify-between mb-4">
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

        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "live" ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <Radio className="w-4 h-4" /> Live Intelligence
          </button>
          <button onClick={() => setActiveTab("archive")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "archive" ? "border-violet-400 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <Upload className="w-4 h-4" /> Archive Upload
          </button>
          <button onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "reports" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <BarChart3 className="w-4 h-4" /> Archives & Reports
          </button>
        </div>
      </div>

      {activeTab === "live" && (
        <>
          {showForm && (
            <div className="bg-white/[0.03] border border-emerald-500/20 rounded-xl p-6 mb-8">
              <h2 className="text-sm font-semibold text-slate-200 mb-5 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" /> Start a New Shadow Intelligence Session
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. Anglo American Platinum" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. Q4 2025 Earnings Call" value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500 block mb-1.5">Meeting URL *</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    placeholder="https://zoom.us/j/..." value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Button onClick={() => startSession.mutate(form)} disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl} className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                  {startSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Shadow Intelligence
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              </div>
            </div>
          )}

          {activeSessionId ? (
            <div className="space-y-6">
              {activeSession.isLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600" /></div>
              ) : liveSession ? (
                <div className="space-y-6">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-200">{liveSession.eventName}</h2>
                      <p className="text-xs text-slate-500">{liveSession.clientName} · {EVENT_TYPE_LABELS[liveSession.eventType]}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => endSession.mutate({ sessionId: liveSession.id })} disabled={endSession.isPending}>
                      End Session
                    </Button>
                  </div>
                  
                  <LocalAudioCapture
                    sessionId={liveSession.id}
                    isActive={liveSession.status === "live" || liveSession.status === "bot_joining"}
                    onSegment={(seg) => setRealtimeSegments(prev => [...prev, seg])}
                  />

                  <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                      <span className="text-sm font-medium text-slate-300">Live Transcript</span>
                      <span className="text-xs text-slate-500">{transcript.length} segments</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                      {transcript.length === 0 ? (
                        <div className="text-center text-slate-600 py-8 text-sm italic">Waiting for speech...</div>
                      ) : (
                        transcript.slice().reverse().map((seg, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="text-[10px] font-mono text-slate-600 w-12 shrink-0">{seg.timeLabel || "--:--"}</span>
                            <div className="flex-1">
                              <span className="text-xs font-bold text-emerald-400 mr-2">{seg.speaker}</span>
                              <p className="text-sm text-slate-300 leading-relaxed">{seg.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
              <Radio className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Active Session</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Select a session from the queue on the right or start a new live event to begin capturing intelligence.</p>
              <Button onClick={() => setShowForm(true)} className="mt-6 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30">
                <Play className="w-4 h-4 mr-2" /> Start New Session
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "archive" && (
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
              <Upload className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200 mb-1">Archive Upload</div>
              <p className="text-sm text-slate-400 leading-relaxed">Build your database retroactively by uploading past event transcripts or recordings.</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-5">Upload Archive Event</h2>
            <p className="text-xs text-slate-500 italic">Archive upload interface active...</p>
          </div>
        </div>
      )}
    </div>
  );

  const railContent = (
    <ShadowModeQueueRail>
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Active Sessions</h3>
          <div className="space-y-2">
            {groupedSessions.active.length === 0 ? (
              <div className="px-3 py-4 border border-dashed border-white/5 rounded-xl text-center">
                <p className="text-[11px] text-slate-600">No active sessions</p>
              </div>
            ) : (
              groupedSessions.active.map(s => (
                <SessionCard key={s.id} session={s} onSelect={() => setActiveSessionId(s.id)} isSelected={activeSessionId === s.id} />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Recent Completed</h3>
          <div className="space-y-2">
            {groupedSessions.completed.slice(0, 5).map(s => (
              <SessionCard key={s.id} session={s} onSelect={() => setActiveSessionId(s.id)} isSelected={activeSessionId === s.id} />
            ))}
          </div>
        </div>
      </div>
    </ShadowModeQueueRail>
  );

  return (
    <ShadowModeShell
      activeWorkstream={activeWorkstream}
      onWorkstreamChange={setActiveWorkstream}
      embedded={embedded}
    >
      {activeWorkstream === "capture" ? (
        <ShadowModeMainContentFrame
          hasActiveContext={hasActiveContext}
          mainContent={mainContent}
          railContent={railContent}
        />
      ) : (
        <ShadowModeLandingState
          workstream={activeWorkstream}
          onStart={() => setActiveWorkstream("capture")}
        />
      )}
    </ShadowModeShell>
  );
}
