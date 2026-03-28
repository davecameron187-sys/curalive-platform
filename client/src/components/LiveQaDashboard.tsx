import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  MessageCircle, Shield, Brain, ChevronDown, ChevronUp,
  Copy, Check, Pause, Play, StopCircle, AlertTriangle,
  ThumbsUp, ThumbsDown, Zap, Send, ExternalLink, Bot,
  Scale, TrendingUp, Eye, Clock, Users, BarChart3,
  Share2, Code2, FileText, Download, Radio, Hash,
  Megaphone, Lock, Wrench,
} from "lucide-react";

interface Props {
  shadowSessionId?: number;
  eventName?: string;
  clientName?: string;
}

type StatusFilter = "all" | "pending" | "triaged" | "approved" | "answered" | "rejected" | "flagged";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  pending: { color: "#94a3b8", bg: "#94a3b822", label: "Pending", icon: "⏳" },
  triaged: { color: "#818cf8", bg: "#818cf822", label: "Triaged", icon: "🔍" },
  approved: { color: "#22c55e", bg: "#22c55e22", label: "Approved", icon: "✓" },
  answered: { color: "#3b82f6", bg: "#3b82f622", label: "Answered", icon: "💬" },
  rejected: { color: "#ef4444", bg: "#ef444422", label: "Rejected", icon: "✗" },
  flagged: { color: "#f59e0b", bg: "#f59e0b22", label: "Flagged", icon: "⚠" },
  active: { color: "#22c55e", bg: "#22c55e22", label: "Active", icon: "●" },
  paused: { color: "#f59e0b", bg: "#f59e0b22", label: "Paused", icon: "⏸" },
  closed: { color: "#ef4444", bg: "#ef444422", label: "Closed", icon: "■" },
};

const CATEGORY_COLORS: Record<string, string> = {
  financial: "#3b82f6", operational: "#8b5cf6", esg: "#10b981",
  governance: "#f59e0b", strategy: "#ec4899", general: "#6b7280",
};

const TRIAGE_LABELS: Record<string, { label: string; color: string }> = {
  high_priority: { label: "HIGH", color: "#ef4444" },
  standard: { label: "MED", color: "#f59e0b" },
  low_priority: { label: "LOW", color: "#22c55e" },
  duplicate: { label: "DUP", color: "#6b7280" },
  hostile: { label: "HOSTILE", color: "#dc2626" },
};

function ComplianceIndicator({ score }: { score: number }) {
  const color = score > 70 ? "#ef4444" : score > 40 ? "#f59e0b" : "#22c55e";
  const label = score > 70 ? "HIGH RISK" : score > 40 ? "MEDIUM" : "CLEAR";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold" style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
      <Shield className="w-3 h-3" /> {label}
    </span>
  );
}

function QuestionCard({
  q, onApprove, onReject, onFlag, onRouteBot, onLegalReview, onDraft, onAnswer, onSendToSpeaker,
  expanded, onToggle, draftText, onDraftChange,
}: {
  q: any; onApprove: () => void; onReject: () => void; onFlag: () => void;
  onRouteBot: () => void; onLegalReview: () => void;
  onDraft: () => void; onAnswer: () => void; onSendToSpeaker: () => void;
  expanded: boolean; onToggle: () => void;
  draftText: string; onDraftChange: (t: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[q.question_status] || STATUS_CONFIG.pending;
  const triageCfg = TRIAGE_LABELS[q.triage_classification] || TRIAGE_LABELS.standard;
  const catColor = CATEGORY_COLORS[q.question_category] || "#6b7280";
  const complianceScore = q.compliance_risk_score || 0;

  return (
    <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl overflow-hidden transition-all hover:border-[#2a2a5a]">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: triageCfg.color + "22", color: triageCfg.color, border: `1px solid ${triageCfg.color}44` }}>
              {triageCfg.label}
            </span>
            <span className="text-[0.65rem] text-slate-500">{Math.round(q.priority_score || 0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[0.92rem] text-slate-200 leading-relaxed mb-2">{q.question_text}</p>

            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}44` }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-semibold" style={{ background: catColor + "22", color: catColor }}>
                {q.question_category}
              </span>
              <ComplianceIndicator score={complianceScore} />
              {q.upvotes > 0 && (
                <span className="inline-flex items-center gap-1 text-[0.65rem] text-slate-500">
                  <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                </span>
              )}
              {q.unresolved_flags > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> {q.unresolved_flags} flag{q.unresolved_flags > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {q.submitter_name && (
              <div className="flex items-center gap-2 text-[0.7rem] text-slate-500">
                <Users className="w-3 h-3" />
                <span>{q.submitter_name}</span>
                {q.submitter_company && <span className="text-slate-600">· {q.submitter_company}</span>}
              </div>
            )}
            {q.triage_reason && (
              <p className="text-[0.7rem] text-indigo-400/70 mt-1 italic flex items-center gap-1">
                <Brain className="w-3 h-3 flex-shrink-0" /> {q.triage_reason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {q.question_status !== "approved" && q.question_status !== "answered" && (
              <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            )}
            <button onClick={onSendToSpeaker} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
              <Radio className="w-3.5 h-3.5" /> Send to Speaker
            </button>
            <button onClick={onRouteBot} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors">
              <Bot className="w-3.5 h-3.5" /> Route to Bot
            </button>
            <button onClick={onLegalReview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
              <Scale className="w-3.5 h-3.5" /> Legal Review
            </button>
            {q.question_status !== "rejected" && (
              <button onClick={onReject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" /> Reject
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e1e3a] px-4 py-2 flex items-center justify-between bg-[#0a0a18]">
        <button onClick={onDraft} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
          <Zap className="w-3.5 h-3.5" /> Generate AI Draft
        </button>
        <button onClick={onToggle} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Collapse" : "Respond"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#1e1e3a] p-4 bg-[#080816]">
          <textarea
            value={draftText}
            onChange={e => onDraftChange(e.target.value)}
            placeholder="Type or edit the response to forward to the speaker..."
            className="w-full min-h-[80px] bg-[#0d0d20] border border-[#1e1e3a] rounded-lg text-slate-200 text-sm p-3 outline-none resize-y placeholder:text-slate-600 focus:border-indigo-500/50"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onToggle} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 border border-[#2a2a4a] hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button onClick={onAnswer} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
              <Send className="w-3.5 h-3.5" /> Submit & Mark Answered
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PredictiveSidebar({ questions, sessionId }: { questions: any[]; sessionId: number }) {
  const anticipatedQuestions = useMemo(() => [
    "What is your forward guidance for next quarter?",
    "Can you comment on the margin compression trend?",
    "What ESG targets are you committing to this year?",
    "How will recent regulatory changes impact operations?",
    "What's the capital allocation strategy going forward?",
  ], []);

  const totalQs = questions.length;
  const approved = questions.filter((q: any) => q.question_status === "approved").length;
  const flagged = questions.filter((q: any) => q.question_status === "flagged").length;
  const avgCompliance = totalQs > 0 ? Math.round(questions.reduce((s: number, q: any) => s + (q.compliance_risk_score || 0), 0) / totalQs) : 0;
  const avgTriage = totalQs > 0 ? Math.round(questions.reduce((s: number, q: any) => s + (q.triage_score || 50), 0) / totalQs) : 0;

  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    questions.forEach((q: any) => { dist[q.question_category] = (dist[q.question_category] || 0) + 1; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  const sentimentLevel = avgCompliance > 50 ? "Cautious" : avgCompliance > 25 ? "Neutral" : "Positive";
  const sentimentColor = avgCompliance > 50 ? "#ef4444" : avgCompliance > 25 ? "#f59e0b" : "#22c55e";

  return (
    <div className="space-y-4">
      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Session Analytics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalQs}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Total</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{approved}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Approved</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{flagged}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Flagged</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: sentimentColor }}>{avgTriage}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Avg Triage</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Live Sentiment
        </h4>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: sentimentColor }} />
          <span className="text-sm font-semibold" style={{ color: sentimentColor }}>{sentimentLevel}</span>
          <span className="text-xs text-slate-500">Compliance Risk: {avgCompliance}%</span>
        </div>
        <div className="mt-3 h-2 bg-[#1e1e3a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, avgCompliance)}%`, background: sentimentColor }} />
        </div>
      </div>

      {categoryDistribution.length > 0 && (
        <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-violet-400" /> Materiality Heatmap
          </h4>
          <div className="space-y-2">
            {categoryDistribution.map(([cat, count]) => {
              const pct = Math.round((count / totalQs) * 100);
              const color = CATEGORY_COLORS[cat] || "#6b7280";
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-[0.7rem] text-slate-400 w-20 truncate capitalize">{cat}</span>
                  <div className="flex-1 h-2 bg-[#1e1e3a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[0.65rem] text-slate-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-amber-400" /> Anticipated Questions
        </h4>
        <div className="space-y-2">
          {anticipatedQuestions.map((q, i) => {
            const matched = questions.some((asked: any) =>
              asked.question_text?.toLowerCase().includes(q.split(" ").slice(2, 5).join(" ").toLowerCase())
            );
            return (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${matched ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#0a0a18]"}`}>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${matched ? "bg-emerald-500/30 text-emerald-400" : "bg-[#1e1e3a] text-slate-500"}`}>
                  {matched ? "✓" : i + 1}
                </span>
                <span className={matched ? "text-emerald-400/80 line-through" : "text-slate-400"}>{q}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LiveQaDashboard({ shadowSessionId, eventName, clientName }: Props) {
  const [qaSessionId, setQaSessionId] = useState<number | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<"active" | "paused" | "closed">("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<Record<number, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPlatformPanel, setShowPlatformPanel] = useState(false);
  const [showEmbedPanel, setShowEmbedPanel] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [embedWhiteLabel, setEmbedWhiteLabel] = useState(false);
  const [embedBrandName, setEmbedBrandName] = useState("");
  const [embedBrandColor, setEmbedBrandColor] = useState("#6366f1");
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showIrChat, setShowIrChat] = useState(false);
  const [irChatMessage, setIrChatMessage] = useState("");
  const [irChatMessages, setIrChatMessages] = useState<Array<{ message: string; senderRole: string; timestamp: number }>>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showCertPanel, setShowCertPanel] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [certGenerating, setCertGenerating] = useState(false);

  const logQaAction = trpc.shadowMode.qaAction.useMutation();

  const sessionByShadow = trpc.liveQa.getSessionByShadow.useQuery(
    { shadowSessionId: shadowSessionId || 0 },
    { enabled: !!shadowSessionId }
  );

  const sessionsList = trpc.liveQa.listSessions.useQuery();

  const questionsQuery = trpc.liveQa.listQuestions.useQuery(
    { sessionId: qaSessionId || 0, statusFilter },
    { enabled: !!qaSessionId, refetchInterval: 3000 }
  );

  const createSession = trpc.liveQa.createSession.useMutation();
  const updateStatus = trpc.liveQa.updateQuestionStatus.useMutation();
  const submitAnswer = trpc.liveQa.submitAnswer.useMutation();
  const generateDraftMut = trpc.liveQa.generateDraft.useMutation();
  const updateSessionStatus = trpc.liveQa.updateSessionStatus.useMutation();
  const generateShareLinkMut = trpc.platformEmbed.generateShareLink.useMutation();
  const sendToSpeakerMut = trpc.liveQa.sendToSpeaker.useMutation();
  const broadcastToTeamMut = trpc.liveQa.broadcastToTeam.useMutation();
  const postIrChatMut = trpc.liveQa.postIrChatMessage.useMutation();
  const generateCertMut = trpc.liveQa.generateQaCertificate.useMutation();
  const eventSummaryQuery = trpc.platformEmbed.getEventSummary.useQuery(
    { sessionId: qaSessionId || 0 },
    { enabled: !!qaSessionId && showReportPanel }
  );

  useEffect(() => {
    if (sessionByShadow.data) {
      setQaSessionId(sessionByShadow.data.id);
      setSessionCode(sessionByShadow.data.sessionCode);
      setSessionStatus(sessionByShadow.data.status as any);
    }
  }, [sessionByShadow.data]);

  const handleCreateSession = useCallback(async () => {
    if (!eventName) { toast.error("Event name required"); return; }
    setCreating(true);
    try {
      const s = await createSession.mutateAsync({
        eventName: eventName || "Live Event",
        clientName: clientName || undefined,
        shadowSessionId: shadowSessionId || undefined,
      });
      setQaSessionId(s.id);
      setSessionCode(s.sessionCode);
      setSessionStatus("active");
      toast.success("Live Q&A session created!");
      sessionsList.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  }, [eventName, clientName, shadowSessionId]);

  const handleStatusUpdate = useCallback(async (questionId: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ questionId, status: status as any });
      questionsQuery.refetch();
      const labels: Record<string, string> = {
        approved: "Question approved — ready for speaker",
        rejected: "Question rejected",
        flagged: "Question flagged for review",
      };
      toast.success(labels[status] || `Question ${status}`);
      if (shadowSessionId) {
        const actionMap: Record<string, string> = { approved: "approve", rejected: "reject", flagged: "hold" };
        logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: (actionMap[status] || status) as any });
      }
    } catch { toast.error("Failed to update status"); }
  }, [updateStatus, questionsQuery, shadowSessionId, logQaAction]);

  const handleRouteBot = useCallback(async (questionId: number) => {
    try {
      const draft = await generateDraftMut.mutateAsync({ questionId });
      setDraftAnswer(prev => ({ ...prev, [questionId]: draft.answerText }));
      await updateStatus.mutateAsync({ questionId, status: "approved", operatorNotes: "Routed to AI Bot — auto-draft generated" });
      questionsQuery.refetch();
      toast.success("AI Bot generated response — review in answer panel");
      setExpandedQ(questionId);
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "approve", questionText: "Routed to AI Bot" });
    } catch { toast.error("Failed to generate bot response"); }
  }, [updateStatus, questionsQuery, generateDraftMut, shadowSessionId, logQaAction]);

  const handleLegalReview = useCallback(async (questionId: number) => {
    try {
      await updateStatus.mutateAsync({ questionId, status: "flagged", operatorNotes: "Escalated for Legal Review" });
      questionsQuery.refetch();
      toast.success("Question escalated for legal review with full audit trail");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "legal_review" });
    } catch { toast.error("Failed to flag for review"); }
  }, [updateStatus, questionsQuery, shadowSessionId, logQaAction]);

  const handleGenerateDraft = useCallback(async (questionId: number) => {
    try {
      const draft = await generateDraftMut.mutateAsync({ questionId });
      setDraftAnswer(prev => ({ ...prev, [questionId]: draft.answerText }));
      setExpandedQ(questionId);
      toast.success("AI-compliant draft generated");
    } catch { toast.error("Failed to generate draft"); }
  }, [generateDraftMut]);

  const handleSubmitAnswer = useCallback(async (questionId: number) => {
    const text = draftAnswer[questionId];
    if (!text?.trim()) { toast.error("Please enter an answer"); return; }
    try {
      await submitAnswer.mutateAsync({ questionId, answerText: text.trim() });
      setDraftAnswer(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      setExpandedQ(null);
      questionsQuery.refetch();
      toast.success("Answer submitted & question marked answered");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "answered" });
    } catch { toast.error("Failed to submit answer"); }
  }, [draftAnswer, submitAnswer, questionsQuery, shadowSessionId, logQaAction]);

  const handleSessionStatusChange = useCallback(async (status: "active" | "paused" | "closed") => {
    if (!qaSessionId) return;
    try {
      await updateSessionStatus.mutateAsync({ sessionId: qaSessionId, status });
      setSessionStatus(status);
      sessionByShadow.refetch();
      const msgs: Record<string, string> = {
        active: "Q&A submissions resumed",
        paused: "Q&A submissions paused",
        closed: "Q&A session ended — no new submissions",
      };
      toast.success(msgs[status]);
    } catch { toast.error("Failed to update session"); }
  }, [qaSessionId, updateSessionStatus, sessionByShadow]);

  const copyShareLink = useCallback(() => {
    const link = `${window.location.origin}/qa/${sessionCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Webphone Q&A link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  }, [sessionCode]);

  const handlePlatformShare = useCallback(async (platform: "zoom" | "teams" | "webex" | "meet" | "generic") => {
    if (!qaSessionId) return;
    try {
      const result = await generateShareLinkMut.mutateAsync({ sessionId: qaSessionId, sessionCode, platform });
      navigator.clipboard.writeText(result.chatMessage);
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} message copied — paste into meeting chat`);
    } catch { toast.error("Failed to generate share link"); }
  }, [qaSessionId, sessionCode, generateShareLinkMut]);

  const handleSendToSpeaker = useCallback(async (questionId: number) => {
    try {
      const suggestedAnswer = draftAnswer[questionId] || undefined;
      await sendToSpeakerMut.mutateAsync({ questionId, suggestedAnswer });
      questionsQuery.refetch();
      toast.success("Question sent to speaker with AI-suggested response");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "send_to_speaker" });
    } catch { toast.error("Failed to send to speaker"); }
  }, [sendToSpeakerMut, questionsQuery, draftAnswer, shadowSessionId, logQaAction]);

  const handleBroadcast = useCallback(async () => {
    if (!qaSessionId || !broadcastMessage.trim()) return;
    try {
      await broadcastToTeamMut.mutateAsync({ sessionId: qaSessionId, message: broadcastMessage.trim(), priority: "urgent" });
      setBroadcastMessage("");
      toast.success("Broadcast sent to IR team & speaker");
    } catch { toast.error("Broadcast failed"); }
  }, [qaSessionId, broadcastMessage, broadcastToTeamMut]);

  const handlePostIrChat = useCallback(async () => {
    if (!qaSessionId || !irChatMessage.trim()) return;
    try {
      await postIrChatMut.mutateAsync({ sessionId: qaSessionId, message: irChatMessage.trim() });
      setIrChatMessages(prev => [...prev, { message: irChatMessage.trim(), senderRole: "operator", timestamp: Date.now() }]);
      setIrChatMessage("");
    } catch { toast.error("Failed to send message"); }
  }, [qaSessionId, irChatMessage, postIrChatMut]);

  const handleGenerateCertificate = useCallback(async () => {
    if (!qaSessionId) return;
    setCertGenerating(true);
    try {
      const cert = await generateCertMut.mutateAsync({ sessionId: qaSessionId });
      setCertificate(cert);
      setShowCertPanel(true);
      toast.success("Blockchain-certified Clean Disclosure Certificate generated");
    } catch { toast.error("Failed to generate certificate"); }
    finally { setCertGenerating(false); }
  }, [qaSessionId, generateCertMut]);

  const downloadCertificate = useCallback(() => {
    if (!certificate) return;
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificate.certificateId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded");
  }, [certificate]);

  const copyEmbedCode = useCallback(() => {
    const params = new URLSearchParams();
    if (embedWhiteLabel) params.set("theme", "platform");
    if (embedBrandName) params.set("brandName", embedBrandName);
    if (embedBrandColor && embedBrandColor !== "#6366f1") params.set("brandColor", embedBrandColor);
    const qs = params.toString();
    const url = `${window.location.origin}/embed/qa/${sessionCode}${qs ? `?${qs}` : ""}`;
    const code = `<iframe\n  src="${url}"\n  width="400"\n  height="640"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius: 12px; border: 1px solid #2a2a4a;"\n></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    toast.success("Embed code copied to clipboard");
    setTimeout(() => setCopiedEmbed(false), 2000);
  }, [sessionCode, embedWhiteLabel, embedBrandName, embedBrandColor]);

  const downloadReport = useCallback(() => {
    if (!eventSummaryQuery.data) return;
    const blob = new Blob([JSON.stringify(eventSummaryQuery.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curalive-qa-report-${sessionCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  }, [eventSummaryQuery.data, sessionCode]);

  const questions = questionsQuery.data || [];
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q: any) => { counts[q.question_status || "pending"] = (counts[q.question_status || "pending"] || 0) + 1; });
    return counts;
  }, [questions]);

  if (!qaSessionId) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Q&A Intelligence Engine</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Launch a Live Q&A session for attendees to submit questions in real-time.
              AI triage automatically categorises, scores compliance risks, and generates draft responses.
            </p>
            <button
              onClick={handleCreateSession}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {creating ? "Launching..." : "Launch Live Q&A Session"}
            </button>

            {(sessionsList.data?.length || 0) > 0 && (
              <div className="mt-8 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Previous Sessions</h4>
                <div className="space-y-2">
                  {sessionsList.data?.slice(0, 5).map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => { setQaSessionId(s.id); setSessionCode(s.sessionCode); setSessionStatus(s.status); }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a18] border border-[#1e1e3a] cursor-pointer hover:border-indigo-500/30 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-white">{s.eventName}</span>
                        <span className="text-xs text-slate-500 ml-3 font-mono">{s.sessionCode}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                        background: STATUS_CONFIG[s.status]?.bg || "#33333322",
                        color: STATUS_CONFIG[s.status]?.color || "#888",
                      }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-r from-[#0d0d20] to-[#111130] border border-[#1e1e3a] rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sessionStatus === "active" ? "bg-emerald-400 animate-pulse" : sessionStatus === "paused" ? "bg-amber-400" : "bg-red-400"}`} />
              <h3 className="text-lg font-bold text-white">Live Q&A Management</h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-[#0a0a18] px-2 py-1 rounded">{sessionCode}</span>
            <span className="text-xs text-slate-400">{eventName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2 bg-[#0a0a18] rounded-lg px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300 font-semibold">{questions.length}</span>
              <span className="text-xs text-slate-500">questions</span>
            </div>
            <button onClick={copyShareLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors">
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Webphone Link"}
            </button>
            {sessionStatus === "active" ? (
              <button onClick={() => handleSessionStatusChange("paused")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
                <Pause className="w-3.5 h-3.5" /> Pause Q&A
              </button>
            ) : sessionStatus === "paused" ? (
              <button onClick={() => handleSessionStatusChange("active")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                <Play className="w-3.5 h-3.5" /> Resume Q&A
              </button>
            ) : null}
            {sessionStatus !== "closed" && (
              <button onClick={() => handleSessionStatusChange("closed")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
                <StopCircle className="w-3.5 h-3.5" /> End Q&A
              </button>
            )}
            <button onClick={() => setShowPlatformPanel(!showPlatformPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Platform Share
            </button>
            <button onClick={() => setShowEmbedPanel(!showEmbedPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors">
              <Code2 className="w-3.5 h-3.5" /> Embed
            </button>
            <button onClick={() => setShowIrChat(!showIrChat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
              <Megaphone className="w-3.5 h-3.5" /> IR Chat
            </button>
            <button onClick={() => setShowReportPanel(!showReportPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Report
            </button>
            <button onClick={handleGenerateCertificate} disabled={certGenerating} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50">
              <Hash className="w-3.5 h-3.5" /> {certGenerating ? "Generating..." : "Certificate"}
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a0a18] text-slate-400 border border-[#1e1e3a] hover:text-slate-200 transition-colors">
              <BarChart3 className="w-3.5 h-3.5" /> {showSidebar ? "Hide" : "Show"} Insights
            </button>
          </div>
        </div>
      </div>

      {showPlatformPanel && (
        <div className="bg-[#0d0d20] border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400" /> Share to Platform Chat</h4>
            <button onClick={() => setShowPlatformPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Generate a platform-optimized share message. Click to copy, then paste into your meeting chat.</p>
          <div className="flex flex-wrap gap-2">
            {([
              { platform: "zoom" as const, label: "Zoom", color: "#2d8cff" },
              { platform: "teams" as const, label: "Teams", color: "#6264a7" },
              { platform: "webex" as const, label: "Webex", color: "#07c160" },
              { platform: "meet" as const, label: "Google Meet", color: "#00897b" },
              { platform: "generic" as const, label: "Other", color: "#6366f1" },
            ]).map(({ platform, label, color }) => (
              <button
                key={platform}
                onClick={() => handlePlatformShare(platform)}
                disabled={generateShareLinkMut.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ background: color }}
              >
                <ExternalLink className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showEmbedPanel && (
        <div className="bg-[#0d0d20] border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-violet-400" /> Embeddable Widget</h4>
            <button onClick={() => setShowEmbedPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Embed this Q&A widget directly inside any platform or website. One line of code.</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={embedWhiteLabel} onChange={e => setEmbedWhiteLabel(e.target.checked)} className="accent-violet-500" />
              White-label mode
            </label>
            {embedWhiteLabel && (
              <>
                <input value={embedBrandName} onChange={e => setEmbedBrandName(e.target.value)} placeholder="Brand name" className="bg-[#0a0a18] border border-[#2a2a4a] rounded-lg px-2 py-1 text-xs text-white w-32 outline-none" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Color:</span>
                  <input type="color" value={embedBrandColor} onChange={e => setEmbedBrandColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </>
            )}
          </div>
          <div className="bg-[#0a0a18] border border-[#1e1e3a] rounded-lg p-3 mb-3">
            <code className="text-xs text-emerald-400 whitespace-pre-wrap break-all">
              {`<iframe src="${window.location.origin}/embed/qa/${sessionCode}${embedWhiteLabel ? `?theme=platform${embedBrandName ? `&brandName=${encodeURIComponent(embedBrandName)}` : ""}${embedBrandColor !== "#6366f1" ? `&brandColor=${encodeURIComponent(embedBrandColor)}` : ""}` : ""}" width="400" height="640" frameborder="0"></iframe>`}
            </code>
          </div>
          <div className="flex gap-2">
            <button onClick={copyEmbedCode} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 transition-colors">
              {copiedEmbed ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedEmbed ? "Copied!" : "Copy Embed Code"}
            </button>
            <a href={`/embed/qa/${sessionCode}${embedWhiteLabel ? `?theme=platform${embedBrandName ? `&brandName=${encodeURIComponent(embedBrandName)}` : ""}${embedBrandColor !== "#6366f1" ? `&brandColor=${encodeURIComponent(embedBrandColor)}` : ""}` : ""}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e1e3a] text-slate-300 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Preview Widget
            </a>
          </div>
        </div>
      )}

      {showIrChat && (
        <div className="bg-[#0d0d20] border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-cyan-400" /> IR Team Chat & Broadcast</h4>
            <button onClick={() => setShowIrChat(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-bold text-slate-400 mb-2">Team Chat</h5>
              <div className="bg-[#0a0a18] border border-[#1e1e3a] rounded-lg p-3 h-40 overflow-y-auto mb-2 space-y-2">
                {irChatMessages.length === 0 && <p className="text-xs text-slate-600 text-center pt-6">No messages yet</p>}
                {irChatMessages.map((m, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-semibold text-cyan-400">{m.senderRole}:</span>{" "}
                    <span className="text-slate-300">{m.message}</span>
                    <span className="text-slate-600 ml-2 text-[0.6rem]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={irChatMessage}
                  onChange={e => setIrChatMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePostIrChat()}
                  placeholder="Message IR team..."
                  className="flex-1 bg-[#0a0a18] border border-[#2a2a4a] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <button onClick={handlePostIrChat} disabled={!irChatMessage.trim()} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-400 mb-2">Broadcast to All</h5>
              <p className="text-xs text-slate-500 mb-2">Send an urgent message to speaker, IR team, and legal via real-time channel.</p>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Type broadcast message..."
                className="w-full h-24 bg-[#0a0a18] border border-[#2a2a4a] rounded-lg text-xs text-white p-3 outline-none resize-none"
              />
              <button onClick={handleBroadcast} disabled={!broadcastMessage.trim() || broadcastToTeamMut.isPending} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-400 transition-colors disabled:opacity-50 w-full justify-center">
                <Megaphone className="w-3 h-3" /> Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertPanel && certificate && (
        <div className="bg-[#0d0d20] border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Hash className="w-4 h-4 text-amber-400" /> Clean Disclosure Certificate</h4>
            <div className="flex items-center gap-2">
              <button onClick={downloadCertificate} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
              <button onClick={() => setShowCertPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-400">{certificate.certificateGrade}</p>
              <p className="text-[0.65rem] text-slate-500">Grade</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold" style={{ color: certificate.complianceStatus === "CLEAN" ? "#22c55e" : "#f59e0b" }}>{certificate.complianceStatus === "CLEAN" ? "CLEAN" : "FLAGS"}</p>
              <p className="text-[0.65rem] text-slate-500">Status</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-indigo-400">{certificate.chainLength}</p>
              <p className="text-[0.65rem] text-slate-500">Chain Blocks</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{certificate.metrics.responseRate}%</p>
              <p className="text-[0.65rem] text-slate-500">Response Rate</p>
            </div>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 mb-3">
            <h5 className="text-xs font-bold text-slate-400 mb-1">Certificate ID</h5>
            <p className="text-xs text-amber-400 font-mono">{certificate.certificateId}</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 mb-3">
            <h5 className="text-xs font-bold text-slate-400 mb-1">Certificate Hash (SHA-256)</h5>
            <p className="text-[0.6rem] text-emerald-400 font-mono break-all">{certificate.certificateHash}</p>
          </div>
          <p className="text-[0.6rem] text-slate-600 italic">{certificate.disclaimer}</p>
          <p className="text-[0.6rem] text-slate-600 mt-1">{certificate.cipcPatent}</p>
        </div>
      )}

      {showReportPanel && (
        <div className="bg-[#0d0d20] border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /> Post-Event Intelligence Report</h4>
            <div className="flex items-center gap-2">
              <button onClick={downloadReport} disabled={!eventSummaryQuery.data} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
                <Download className="w-3 h-3" /> Export JSON
              </button>
              <button onClick={() => setShowReportPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
            </div>
          </div>
          {eventSummaryQuery.isLoading ? (
            <div className="text-center py-6"><p className="text-slate-400 text-sm">Generating report...</p></div>
          ) : eventSummaryQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Questions", value: eventSummaryQuery.data.metrics.totalQuestions, color: "#818cf8" },
                  { label: "Answered", value: eventSummaryQuery.data.metrics.totalAnswered, color: "#22c55e" },
                  { label: "Response Rate", value: `${eventSummaryQuery.data.metrics.responseRate}%`, color: "#3b82f6" },
                  { label: "Sentiment", value: eventSummaryQuery.data.metrics.overallSentiment, color: eventSummaryQuery.data.metrics.overallSentiment === "Positive" ? "#22c55e" : eventSummaryQuery.data.metrics.overallSentiment === "Cautious" ? "#f59e0b" : "#818cf8" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0a0a18] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                    <p className="text-[0.65rem] text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Category Breakdown</h5>
                  {Object.entries(eventSummaryQuery.data.categoryBreakdown).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 capitalize">{cat}</span>
                      <span className="text-slate-500">{count as number}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Compliance Summary</h5>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Total Flags</span><span className="text-slate-500">{eventSummaryQuery.data.compliance.totalFlags}</span></div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Unresolved</span><span className="text-amber-400">{eventSummaryQuery.data.compliance.unresolvedFlags}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-300">High Risk</span><span className="text-red-400">{eventSummaryQuery.data.compliance.highRiskFlags.length}</span></div>
                </div>
              </div>
              {eventSummaryQuery.data.topQuestions.length > 0 && (
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Top Questions by Upvotes</h5>
                  {eventSummaryQuery.data.topQuestions.slice(0, 5).map((q: any) => (
                    <div key={q.id} className="flex items-start gap-2 text-xs mb-2 last:mb-0">
                      <span className="text-indigo-400 font-mono min-w-[2rem] text-right">{q.upvotes}▲</span>
                      <span className="text-slate-300 flex-1">{q.text.length > 120 ? q.text.slice(0, 120) + "..." : q.text}</span>
                      <span className="text-slate-500 capitalize whitespace-nowrap">{q.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">No data available yet.</p>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "triaged", "approved", "answered", "rejected", "flagged"] as StatusFilter[]).map(f => {
          const cfg = f === "all" ? { color: "#818cf8", bg: "#818cf822" } : STATUS_CONFIG[f];
          const count = f === "all" ? questions.length : (statusCounts[f] || 0);
          const isActive = statusFilter === f;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "border-2 shadow-md"
                  : "border border-[#1e1e3a] text-slate-500 hover:text-slate-300 hover:border-[#2a2a5a]"
              }`}
              style={isActive ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + "66" } : undefined}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {count > 0 && <span className="text-[0.6rem] opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className={`flex gap-4 ${showSidebar ? "" : ""}`}>
        <div className={`flex-1 space-y-3 ${showSidebar ? "min-w-0" : ""}`}>
          {questions.length === 0 && (
            <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#1e1e3a] flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No questions yet.</p>
              <p className="text-slate-500 text-xs mt-1">Share the webphone link with attendees — they'll see the live transcript and submit questions from their browser. No dial-in required.</p>
            </div>
          )}

          {questions.map((q: any) => (
            <QuestionCard
              key={q.id}
              q={q}
              onApprove={() => handleStatusUpdate(q.id, "approved")}
              onReject={() => handleStatusUpdate(q.id, "rejected")}
              onFlag={() => handleStatusUpdate(q.id, "flagged")}
              onRouteBot={() => handleRouteBot(q.id)}
              onLegalReview={() => handleLegalReview(q.id)}
              onSendToSpeaker={() => handleSendToSpeaker(q.id)}
              onDraft={() => handleGenerateDraft(q.id)}
              onAnswer={() => handleSubmitAnswer(q.id)}
              expanded={expandedQ === q.id}
              onToggle={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
              draftText={draftAnswer[q.id] || ""}
              onDraftChange={(t) => setDraftAnswer(prev => ({ ...prev, [q.id]: t }))}
            />
          ))}
        </div>

        {showSidebar && (
          <div className="w-72 flex-shrink-0">
            <PredictiveSidebar questions={questions} sessionId={qaSessionId} />
          </div>
        )}
      </div>
    </div>
  );
}
