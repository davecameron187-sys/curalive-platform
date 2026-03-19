// @ts-nocheck
import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brain, ChevronDown, ChevronRight, Search, Download, FileText,
  Activity, Shield, Users, MessageSquare, Target, Zap, Lightbulb,
  BarChart3, AlertTriangle, Swords, Gauge, Mic, TrendingUp,
  Banknote, Leaf, Newspaper, Share2, Briefcase, CheckCircle2,
  Loader2, Eye, EyeOff, Volume2, Clock, Tag, Play,
  Settings, Package, Crown, Star, Mail, Save, Upload,
  ChevronUp, Cpu, FileAudio, SquareCheck, Square, PlayCircle,
} from "lucide-react";

const AI_SERVICES = [
  { key: "recording", label: "Audio / Video Recording", icon: Volume2, color: "text-cyan-400", category: "capture", description: "Upload and store event recordings with playback" },
  { key: "transcription", label: "AI Transcription (Whisper)", icon: FileText, color: "text-violet-400", category: "capture", description: "Convert audio/video to searchable text via OpenAI Whisper" },
  { key: "executiveSummary", label: "Executive Summary", icon: FileText, color: "text-blue-400", category: "essential", description: "3-5 sentence high-level overview of the event" },
  { key: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity, color: "text-emerald-400", category: "essential", description: "0-100 score with narrative and key sentiment drivers" },
  { key: "complianceReview", label: "Compliance Review", icon: Shield, color: "text-amber-400", category: "essential", description: "Risk level assessment with flagged phrases" },
  { key: "keyTopics", label: "Key Topics", icon: Tag, color: "text-violet-400", category: "essential", description: "Categorized topics with sentiment and detail" },
  { key: "speakerAnalysis", label: "Speaker Analysis", icon: Users, color: "text-cyan-400", category: "professional", description: "Breakdown by speaker with role and key points" },
  { key: "questionsAsked", label: "Q&A Analysis", icon: MessageSquare, color: "text-blue-300", category: "professional", description: "Questions asked, who asked them, and quality rating" },
  { key: "actionItems", label: "Action Items", icon: Target, color: "text-orange-400", category: "professional", description: "Tasks identified with owners and deadlines" },
  { key: "investorSignals", label: "Investor Signals", icon: Zap, color: "text-yellow-400", category: "professional", description: "Commitment or concern signals with interpretation" },
  { key: "communicationScore", label: "Communication Score", icon: Gauge, color: "text-teal-400", category: "professional", description: "Clarity, transparency, and quality assessment" },
  { key: "riskFactors", label: "Risk Factors", icon: AlertTriangle, color: "text-red-400", category: "professional", description: "Identified risks with impact and likelihood" },
  { key: "competitiveIntelligence", label: "Competitive Intelligence", icon: Swords, color: "text-pink-400", category: "enterprise", description: "Competitor mentions and market references" },
  { key: "recommendations", label: "Strategic Recommendations", icon: Lightbulb, color: "text-amber-300", category: "enterprise", description: "Actionable advice based on event outcomes" },
  { key: "speakingPaceAnalysis", label: "Speaking Pace Coaching", icon: Mic, color: "text-indigo-400", category: "enterprise", description: "WPM analysis, filler words, delivery score" },
  { key: "toxicityScreen", label: "Toxicity & Language Risk", icon: Shield, color: "text-rose-400", category: "enterprise", description: "Inappropriate content, price-sensitive info detection" },
  { key: "sentimentArc", label: "Sentiment Arc", icon: TrendingUp, color: "text-green-400", category: "enterprise", description: "Sentiment trajectory from opening to closing" },
  { key: "financialHighlights", label: "Financial Highlights", icon: Banknote, color: "text-emerald-300", category: "enterprise", description: "Key metrics with YoY change analysis" },
  { key: "esgMentions", label: "ESG & Sustainability", icon: Leaf, color: "text-lime-400", category: "enterprise", description: "Environmental, social, governance commitments" },
  { key: "pressReleaseDraft", label: "Press Release Draft", icon: Newspaper, color: "text-sky-400", category: "enterprise", description: "Auto-generated SENS/RNS-style summary" },
  { key: "socialMediaContent", label: "Social Media Content", icon: Share2, color: "text-fuchsia-400", category: "enterprise", description: "Ready-to-post content for LinkedIn/Twitter" },
  { key: "boardReadySummary", label: "Board-Ready Summary", icon: Briefcase, color: "text-purple-400", category: "enterprise", description: "High-level verdict with risks and opportunities" },
];

const CATEGORIES = [
  { key: "capture", label: "Capture & Transcription", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "essential", label: "Essential Intelligence", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "professional", label: "Professional Analytics", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { key: "enterprise", label: "Enterprise Suite", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
];

const TIER_PRESETS = {
  essential: { label: "Essential", count: 6, icon: Star, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    keys: new Set(["recording", "transcription", "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics"]) },
  professional: { label: "Professional", count: 12, icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    keys: new Set(["recording", "transcription", "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics",
      "speakerAnalysis", "questionsAsked", "actionItems", "investorSignals", "communicationScore", "riskFactors"]) },
  enterprise: { label: "Enterprise", count: 22, icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
    keys: new Set(AI_SERVICES.map(s => s.key)) },
};

type Tier = keyof typeof TIER_PRESETS;

interface AIDashboardProps {
  sessions: Array<{
    id: number;
    clientName: string;
    eventName: string;
    eventType: string;
    platform: string;
    status: string;
    transcriptSegments: number | null;
    taggedMetricsGenerated: number | null;
    sentimentAvg: number | null;
    createdAt: Date;
  }>;
}

function ModuleDataRenderer({ moduleKey, data }: { moduleKey: string; data: any }) {
  if (!data) return <span className="text-slate-600 italic">No data available</span>;

  if (typeof data === "string") {
    return <p className="leading-relaxed whitespace-pre-wrap">{data}</p>;
  }

  if (moduleKey === "sentimentAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${data.score >= 70 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {data.score}/100
          </div>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{data.narrative}</p>
        {data.keyDrivers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.keyDrivers.map((d: string, i: number) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{d}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "complianceReview" && typeof data === "object") {
    const riskColors: Record<string, string> = { Low: "text-emerald-400", Moderate: "text-amber-400", High: "text-orange-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <span className={`text-sm font-semibold ${riskColors[data.riskLevel] || "text-slate-400"}`}>Risk Level: {data.riskLevel}</span>
        {data.flaggedPhrases?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Flagged Phrases:</div>
            <ul className="space-y-0.5">{data.flaggedPhrases.map((p: string, i: number) => <li key={i} className="text-xs text-red-300">• {p}</li>)}</ul>
          </div>
        )}
        {data.recommendations?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Recommendations:</div>
            <ul className="space-y-0.5">{data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "communicationScore" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Overall", value: data.score },
            { label: "Clarity", value: data.clarity },
            { label: "Transparency", value: data.transparency },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-lg p-2 text-center">
              <div className={`text-lg font-bold ${(s.value ?? 0) >= 70 ? "text-emerald-400" : (s.value ?? 0) >= 50 ? "text-amber-400" : "text-red-400"}`}>{s.value ?? "—"}</div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
        {data.narrative && <p className="text-xs text-slate-400 leading-relaxed">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "sentimentArc" && typeof data === "object") {
    const trendColors: Record<string, string> = { Improving: "text-emerald-400", Stable: "text-blue-400", Declining: "text-red-400", Volatile: "text-amber-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Opening</span><span>Midpoint</span><span>Closing</span>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[data.opening, data.midpoint, data.closing].map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium text-slate-300 mb-0.5">{v}</div>
                  <div className={`w-full rounded-t ${v >= 70 ? "bg-emerald-500/40" : v >= 50 ? "bg-amber-500/40" : "bg-red-500/40"}`} style={{ height: `${Math.max(4, (v / 100) * 48)}px` }} />
                </div>
              ))}
            </div>
          </div>
          <span className={`text-sm font-semibold ${trendColors[data.trend] || "text-slate-400"}`}>{data.trend}</span>
        </div>
        {data.narrative && <p className="text-xs text-slate-400">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "speakingPaceAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-indigo-400">{data.overallWpm ?? "—"}</div>
            <div className="text-[10px] text-slate-600">WPM</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-300">{data.paceLabel ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Pace</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{data.deliveryScore ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Delivery</div>
          </div>
        </div>
        {data.coachingTips?.length > 0 && (
          <ul className="space-y-0.5">{data.coachingTips.map((t: string, i: number) => <li key={i} className="text-xs text-slate-400">• {t}</li>)}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "toxicityScreen" && typeof data === "object") {
    const riskColors: Record<string, string> = { Clean: "text-emerald-400", Low: "text-blue-400", Moderate: "text-amber-400", High: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${riskColors[data.overallRisk] || "text-slate-400"}`}>{data.overallRisk}</span>
          {data.priceSensitive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Price Sensitive</span>}
          {data.legalRisk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Legal Risk</span>}
        </div>
        {data.flaggedContent?.length > 0 && (
          <ul className="space-y-1">{data.flaggedContent.map((f: any, i: number) => (
            <li key={i} className="text-xs"><span className="text-red-300">"{f.phrase}"</span> <span className="text-slate-600">— {f.issue} ({f.severity})</span></li>
          ))}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "boardReadySummary" && typeof data === "object") {
    const verdictColors: Record<string, string> = { Strong: "text-emerald-400", Satisfactory: "text-blue-400", Concerning: "text-amber-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className={`text-lg font-bold ${verdictColors[data.verdict] || "text-slate-400"}`}>{data.verdict}</div>
        {data.keyRisks?.length > 0 && (
          <div><div className="text-xs text-red-400/70 mb-0.5">Risks</div><ul>{data.keyRisks.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul></div>
        )}
        {data.keyOpportunities?.length > 0 && (
          <div><div className="text-xs text-emerald-400/70 mb-0.5">Opportunities</div><ul>{data.keyOpportunities.map((o: string, i: number) => <li key={i} className="text-xs text-slate-400">• {o}</li>)}</ul></div>
        )}
        {data.recommendedActions?.length > 0 && (
          <div><div className="text-xs text-blue-400/70 mb-0.5">Actions</div><ul>{data.recommendedActions.map((a: string, i: number) => <li key={i} className="text-xs text-slate-400">• {a}</li>)}</ul></div>
        )}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-600 italic text-xs">No items</span>;
    return (
      <div className="space-y-1.5">
        {data.slice(0, 10).map((item, i) => (
          <div key={i} className="bg-white/[0.02] rounded-lg px-3 py-2 text-xs">
            {typeof item === "string" ? (
              <span className="text-slate-300">• {item}</span>
            ) : typeof item === "object" ? (
              <div className="space-y-0.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}><span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}: </span><span className="text-slate-300">{String(v)}</span></div>
                ))}
              </div>
            ) : <span className="text-slate-300">{String(item)}</span>}
          </div>
        ))}
        {data.length > 10 && <div className="text-xs text-slate-600">+ {data.length - 10} more items</div>}
      </div>
    );
  }

  return <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
}

export default function AIDashboard({ sessions }: AIDashboardProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(() => new Set(AI_SERVICES.map(s => s.key)));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailName, setEmailName] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recDragOver, setRecDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "transcribing" | "done" | "error">("idle");
  const recFileRef = useRef<HTMLInputElement>(null);

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === "completed").sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [sessions]);

  const sessionDetail = trpc.shadowMode.getSession.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: selectedSessionId != null }
  );

  const archives = trpc.archiveUpload.listArchives.useQuery();
  const processTranscript = trpc.archiveUpload.processTranscript.useMutation();
  const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation();

  const selectedArchive = useMemo(() => {
    if (!selectedSessionId || !archives.data) return null;
    const eventId = `shadow-${selectedSessionId}`;
    return archives.data.find((a: any) => a.event_id === eventId) ?? null;
  }, [selectedSessionId, archives.data]);

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: selectedArchive?.id! },
    { enabled: selectedArchive?.id != null }
  );

  const aiReport = useMemo(() => {
    if (archiveDetail.data?.ai_report) return archiveDetail.data.ai_report;
    return null;
  }, [archiveDetail.data]);

  const session = sessionDetail.data;
  const hasReport = aiReport != null;

  const toggleService = useCallback((key: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const applyTier = useCallback((tier: Tier) => {
    setSelectedServices(new Set(TIER_PRESETS[tier].keys));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedServices(new Set(AI_SERVICES.map(s => s.key)));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedServices(new Set());
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return AI_SERVICES;
    const q = searchQuery.toLowerCase();
    return AI_SERVICES.filter(s => s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.includes(q));
  }, [searchQuery]);

  const runServices = useCallback(async () => {
    if (!session) return;
    if (selectedServices.size === 0) {
      toast.error("Select at least one service to run");
      return;
    }

    const transcript = Array.isArray(session.transcriptSegments) ? session.transcriptSegments : [];
    if (transcript.length === 0) {
      toast.error("No transcript available for this session — record or transcribe first");
      return;
    }

    setIsRunning(true);
    try {
      const transcriptText = transcript.map((s: any) => `${s.speaker}: ${s.text}`).join("\n");
      const sessionData = sessions.find(s => s.id === selectedSessionId);

      processTranscript.mutate({
        clientName: sessionData?.clientName ?? session.clientName ?? "Unknown",
        eventName: sessionData?.eventName ?? session.eventName ?? "Unknown",
        eventType: (sessionData?.eventType ?? session.eventType ?? "other") as any,
        transcriptText,
        notes: `Auto-processed from Shadow Mode session #${selectedSessionId}`,
      }, {
        onSuccess: () => {
          toast.success("All selected AI services completed successfully");
          archives.refetch();
          archiveDetail.refetch();
          setIsRunning(false);
        },
        onError: (err) => {
          toast.error(err.message ?? "Failed to run AI services");
          setIsRunning(false);
        },
      });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to run AI services");
      setIsRunning(false);
    }
  }, [session, selectedSessionId, selectedServices, sessions]);

  const uploadRecording = useCallback(async () => {
    if (!recFile || !selectedSessionId) return;
    setIsUploading(true);
    setUploadStatus("transcribing");
    try {
      const formData = new FormData();
      formData.append("recording", recFile);
      const uploadRes = await fetch(`/api/shadow/recording/${selectedSessionId}`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload recording");

      if (selectedServices.has("transcription")) {
        const fd2 = new FormData();
        fd2.append("file", recFile);
        const transRes = await fetch("/api/transcribe-audio", { method: "POST", body: fd2 });
        if (transRes.ok) {
          const { transcript } = await transRes.json();
          const sessionData = sessions.find(s => s.id === selectedSessionId);
          processTranscript.mutate({
            clientName: sessionData?.clientName ?? "Unknown",
            eventName: sessionData?.eventName ?? "Unknown",
            eventType: (sessionData?.eventType ?? "other") as any,
            transcriptText: transcript,
            notes: `Auto-processed from AI Dashboard — session #${selectedSessionId}`,
          }, {
            onSuccess: () => {
              toast.success("Recording uploaded and transcribed — AI report generated");
              archives.refetch();
              sessionDetail.refetch();
              setUploadStatus("done");
              setRecFile(null);
              setIsUploading(false);
            },
            onError: () => {
              toast.success("Recording uploaded but AI report failed — you can retry");
              sessionDetail.refetch();
              setUploadStatus("done");
              setRecFile(null);
              setIsUploading(false);
            },
          });
          return;
        }
      }

      toast.success("Recording uploaded successfully");
      sessionDetail.refetch();
      setUploadStatus("done");
      setRecFile(null);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  }, [recFile, selectedSessionId, selectedServices, sessions]);

  const exportReport = useCallback(() => {
    if (!session || !aiReport) return;
    const lines: string[] = [];
    lines.push(`CuraLive AI Intelligence Report`);
    lines.push(`${"=".repeat(50)}`);
    lines.push(`Client: ${session.clientName}`);
    lines.push(`Event: ${session.eventName}`);
    lines.push(`Date: ${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`Services Run: ${selectedServices.size} of ${AI_SERVICES.length}`);
    lines.push("");

    for (const svc of AI_SERVICES) {
      if (!selectedServices.has(svc.key)) continue;
      if (svc.key === "recording" || svc.key === "transcription") continue;
      const data = aiReport[svc.key];
      if (!data) continue;
      lines.push(`\n${"─".repeat(40)}`);
      lines.push(`${svc.label.toUpperCase()}`);
      lines.push(`${"─".repeat(40)}`);
      if (typeof data === "string") {
        lines.push(data);
      } else {
        lines.push(JSON.stringify(data, null, 2));
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.clientName}_${session.eventName}_AI_Report.txt`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report saved to file");
  }, [session, aiReport, selectedServices]);

  const sendEmail = useCallback(() => {
    if (!selectedArchive || !emailTo.trim() || !emailName.trim()) {
      toast.error("Enter recipient name and email");
      return;
    }
    emailReport.mutate({
      archiveId: selectedArchive.id,
      recipientEmail: emailTo.trim(),
      recipientName: emailName.trim(),
    }, {
      onSuccess: (res) => {
        toast.success(res.message);
        setShowEmailForm(false);
        setEmailTo("");
        setEmailName("");
      },
      onError: (err) => toast.error(err.message ?? "Failed to send email"),
    });
  }, [selectedArchive, emailTo, emailName]);

  const selectedCount = selectedServices.size;
  const aiModuleCount = AI_SERVICES.filter(s => s.category !== "capture").length;
  const selectedAiCount = AI_SERVICES.filter(s => s.category !== "capture" && selectedServices.has(s.key)).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-200">AI Services Dashboard</h2>
              <p className="text-xs text-slate-500">Select services, run analysis, save or email results</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{selectedCount} of {AI_SERVICES.length} selected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Select Session</label>
            <select
              value={selectedSessionId ?? ""}
              onChange={(e) => {
                setSelectedSessionId(e.target.value ? Number(e.target.value) : null);
                setExpandedResults(new Set());
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Choose a completed session...</option>
              {completedSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.eventName} — {s.clientName} ({new Date(s.createdAt).toLocaleDateString("en-GB")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Quick Tier Presets</label>
            <div className="flex gap-2">
              {(Object.entries(TIER_PRESETS) as [Tier, typeof TIER_PRESETS.essential][]).map(([tier, config]) => {
                const TierIcon = config.icon;
                const isActive = [...config.keys].every(k => selectedServices.has(k)) && selectedServices.size === config.keys.size;
                return (
                  <button
                    key={tier}
                    onClick={() => applyTier(tier)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex-1 justify-center ${
                      isActive
                        ? `${config.bg} ${config.color}`
                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                    }`}
                  >
                    <TierIcon className="w-3.5 h-3.5" />
                    {config.label}
                    <span className="text-[10px] opacity-60">({config.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200">AI Services</h3>
            <span className="text-xs text-slate-600">{selectedCount} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 w-44"
              />
            </div>
            <button onClick={selectAll} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              Select All
            </button>
            <button onClick={clearAll} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              Clear All
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {CATEGORIES.map(cat => {
            const catServices = filteredServices.filter(s => s.category === cat.key);
            if (catServices.length === 0) return null;
            const isCollapsed = collapsedCategories.has(cat.key);
            const selectedInCat = catServices.filter(s => selectedServices.has(s.key)).length;

            return (
              <div key={cat.key}>
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                    <span className="text-[10px] text-slate-600">{selectedInCat}/{catServices.length}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const allSelected = catServices.every(s => selectedServices.has(s.key));
                      setSelectedServices(prev => {
                        const next = new Set(prev);
                        catServices.forEach(s => allSelected ? next.delete(s.key) : next.add(s.key));
                        return next;
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-colors"
                  >
                    {catServices.every(s => selectedServices.has(s.key)) ? "Deselect" : "Select"} All
                  </button>
                </button>
                {!isCollapsed && (
                  <div className="px-3 pb-3 space-y-1">
                    {catServices.map(svc => {
                      const Icon = svc.icon;
                      const isSelected = selectedServices.has(svc.key);
                      const hasData = aiReport?.[svc.key] != null;
                      const isExpanded = expandedResults.has(svc.key);

                      return (
                        <div key={svc.key} className={`rounded-xl border transition-all ${
                          isSelected
                            ? "bg-white/[0.03] border-white/10"
                            : "bg-white/[0.01] border-white/5 opacity-60"
                        }`}>
                          <div className="px-4 py-3 flex items-center gap-3">
                            <button
                              onClick={() => toggleService(svc.key)}
                              className="shrink-0"
                            >
                              {isSelected
                                ? <SquareCheck className="w-5 h-5 text-amber-400" />
                                : <Square className="w-5 h-5 text-slate-600" />
                              }
                            </button>
                            <Icon className={`w-4 h-4 ${svc.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-200">{svc.label}</div>
                              <div className="text-[11px] text-slate-600 truncate">{svc.description}</div>
                            </div>
                            {hasData && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                Ready
                              </span>
                            )}
                            {hasData && isSelected && (
                              <button
                                onClick={() => {
                                  setExpandedResults(prev => {
                                    const next = new Set(prev);
                                    if (next.has(svc.key)) next.delete(svc.key); else next.add(svc.key);
                                    return next;
                                  });
                                }}
                                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          {isExpanded && hasData && isSelected && (
                            <div className="px-4 pb-4 border-t border-white/5">
                              <div className="mt-3 text-sm text-slate-300 space-y-2">
                                <ModuleDataRenderer moduleKey={svc.key} data={aiReport[svc.key]} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSessionId && session && (
        <div className="space-y-4">
          {hasReport && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-emerald-300">AI Report Available</div>
                <div className="text-xs text-slate-500">All 20 AI modules have been processed for this session. Expand any service above to view results.</div>
              </div>
            </div>
          )}

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {!hasReport && (
                  <Button
                    onClick={runServices}
                    disabled={isRunning || selectedCount === 0}
                    className="bg-amber-600 hover:bg-amber-500 gap-2 text-sm"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running {selectedCount} services...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Run {selectedCount} Selected Services
                      </>
                    )}
                  </Button>
                )}

                {hasReport && (
                  <>
                    <Button
                      onClick={exportReport}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Report
                    </Button>

                    <Button
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Email Report
                    </Button>

                    <Button
                      onClick={runServices}
                      disabled={isRunning}
                      variant="outline"
                      className="border-white/10 text-slate-400 hover:text-white gap-2 text-sm"
                    >
                      {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                      Regenerate
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>{selectedAiCount} AI modules</span>
                <span>•</span>
                <span>{selectedServices.has("recording") ? "Recording" : "No recording"}</span>
                <span>•</span>
                <span>{selectedServices.has("transcription") ? "Transcription" : "No transcription"}</span>
              </div>
            </div>

            {showEmailForm && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Recipient Name</label>
                  <input
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                  <input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="john@company.com"
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <Button
                  onClick={sendEmail}
                  disabled={emailReport.isPending}
                  className="bg-blue-600 hover:bg-blue-500 gap-2"
                >
                  {emailReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send
                </Button>
              </div>
            )}
          </div>

          {selectedServices.has("recording") && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-200">Recording</span>
                </div>
                {session.recordingUrl && (
                  <a href={session.recordingUrl} download
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 transition-colors">
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                )}
              </div>

              {session.recordingUrl ? (
                <>
                  {session.recordingUrl.startsWith("/api/shadow/recording/") ? (
                    <audio src={session.recordingUrl} controls preload="metadata" className="w-full" />
                  ) : (
                    <video src={session.recordingUrl} controls playsInline preload="metadata" className="w-full rounded-lg bg-black/50 max-h-[250px]" />
                  )}
                </>
              ) : isUploading ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-sm font-medium text-slate-300">
                    {uploadStatus === "transcribing" ? "Uploading & transcribing..." : "Processing..."}
                  </div>
                  <p className="text-xs text-slate-600">
                    {selectedServices.has("transcription")
                      ? "Uploading recording, transcribing with Whisper AI, then running full intelligence pipeline. Large files may take 3-10 minutes."
                      : "Uploading and saving recording to the session."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      recDragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    }`}
                    onClick={() => recFileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setRecDragOver(true); }}
                    onDragLeave={e => { e.preventDefault(); setRecDragOver(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRecDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) setRecFile(f);
                    }}
                  >
                    {recDragOver ? (
                      <div>
                        <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-medium text-cyan-300">Drop your recording here</p>
                      </div>
                    ) : recFile ? (
                      <div>
                        <FileAudio className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-200">{recFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(recFile.size / 1024 / 1024).toFixed(1)} MB
                          {recFile.size > 20 * 1024 * 1024 && (
                            <span className="text-amber-400 ml-2">· Large file — allow 5-10 min for processing</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-300">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-600 mt-1">MP3, MP4, WAV, M4A, WebM, OGG, MOV · Up to 500MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={recFileRef}
                    type="file"
                    accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm,.mov,.avi,.ogg,.flac"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setRecFile(f); }}
                    className="hidden"
                  />
                  {recFile && (
                    <Button
                      onClick={uploadRecording}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Recording{selectedServices.has("transcription") ? " & Transcribe" : ""}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedServices.has("transcription") && Array.isArray(session.transcriptSegments) && session.transcriptSegments.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-200">Transcript</span>
                  <span className="text-xs text-slate-600">({session.transcriptSegments.length} segments)</span>
                </div>
                <button
                  onClick={() => {
                    const text = session.transcriptSegments.map((s: any) =>
                      `${s.timeLabel ?? ""} ${s.speaker}: ${s.text}`
                    ).join("\n\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${session.clientName}_${session.eventName}_transcript.txt`.replace(/\s+/g, "_");
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Transcript exported");
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-0 divide-y divide-white/5 rounded-lg bg-white/[0.02]">
                {session.transcriptSegments.map((seg: any, i: number) => (
                  <div key={i} className="px-3 py-2 flex items-start gap-2">
                    <div className="text-[10px] text-slate-600 font-mono shrink-0 pt-0.5 w-10">
                      {seg.timeLabel ?? "—"}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-violet-300 mr-1.5">{seg.speaker}</span>
                      <span className="text-xs text-slate-300">{seg.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Session", value: session.eventName, sub: session.clientName, color: "text-slate-300" },
              { label: "Sentiment", value: session.sentimentAvg != null ? `${Math.round(session.sentimentAvg)}%` : "—", sub: "Average score", color: session.sentimentAvg != null && session.sentimentAvg >= 70 ? "text-emerald-400" : session.sentimentAvg != null && session.sentimentAvg >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "Metrics", value: session.taggedMetricsGenerated ?? 0, sub: "Tagged records", color: "text-violet-400" },
              { label: "AI Report", value: hasReport ? "Complete" : "Pending", sub: hasReport ? "20 modules" : "Run to generate", color: hasReport ? "text-emerald-400" : "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-600 mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color} truncate`}>{stat.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5 truncate">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedSessionId && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">Select a completed session above to get started</div>
          <div className="text-slate-600 text-xs mt-1">Choose your services, run the analysis, then save or email the results</div>
          {completedSessions.length === 0 && (
            <div className="mt-4 text-xs text-amber-400/70">No completed sessions yet — complete a live session first</div>
          )}
        </div>
      )}

      {selectedSessionId && sessionDetail.isLoading && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
          <div className="text-slate-400 text-sm">Loading session data...</div>
        </div>
      )}
    </div>
  );
}
