import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp, Zap, AlertTriangle, BarChart3, DollarSign, MessageSquare,
  Loader2, FileText, ChevronLeft, RefreshCw, Building2, CheckCircle2,
  Circle, XCircle, Sparkles, Download, Activity
} from "lucide-react";

type SignalType = "soft_commit" | "interest" | "objection" | "question" | "pricing_discussion" | "size_discussion";

const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  soft_commit: { label: "Soft Commit", color: "text-emerald-400", bg: "bg-emerald-900/20", icon: TrendingUp },
  interest: { label: "Interest", color: "text-blue-400", bg: "bg-blue-900/20", icon: Zap },
  objection: { label: "Objection", color: "text-red-400", bg: "bg-red-900/20", icon: AlertTriangle },
  question: { label: "Question", color: "text-amber-400", bg: "bg-amber-900/20", icon: MessageSquare },
  pricing_discussion: { label: "Pricing", color: "text-violet-400", bg: "bg-violet-900/20", icon: DollarSign },
  size_discussion: { label: "Size", color: "text-cyan-400", bg: "bg-cyan-900/20", icon: BarChart3 },
};

const OUTLOOK_CONFIG = {
  strong: { label: "Strong Demand", color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/40", icon: CheckCircle2 },
  moderate: { label: "Moderate Demand", color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/40", icon: Circle },
  cautious: { label: "Cautious Demand", color: "text-red-400", bg: "bg-red-900/20", border: "border-red-700/40", icon: XCircle },
};

export default function RoadshowOrderBook() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"orderbook" | "heatmap" | "report">("orderbook");

  const { data: sentimentTimeline = [] } = trpc.roadshowAI.getSentimentTimeline.useQuery(
    { roadshowId: id! },
    { enabled: !!id, refetchInterval: 30000 }
  );

  const exportToCsv = () => {
    if (!orderBook || orderBook.orderBook.length === 0) {
      toast.error("No investor data to export");
      return;
    }
    const headers = ["Institution", "Investor Name", "Signal Strength", "Soft Commits", "Interest", "Objections", "Total Signals", "Indicated Amounts", "Max Confidence %", "Top Quote"];
    const dataRows = orderBook.orderBook.map((entry: any) => {
      const softCount = entry.signals.filter((s: any) => s.signalType === "soft_commit").length;
      const intCount = entry.signals.filter((s: any) => s.signalType === "interest").length;
      const objCount = entry.signals.filter((s: any) => s.signalType === "objection").length;
      const topQ = (entry.signals[0]?.quote ?? "").replace(/"/g, "'");
      const strength = entry.hasSoftCommit ? "strong" : intCount > 0 ? "moderate" : "weak";
      return [entry.institution ?? "", entry.investorName ?? "", strength, String(softCount), String(intCount), String(objCount), String(entry.signals.length), entry.indicatedAmounts.join("; "), String(entry.highestConfidence), topQ];
    });
    const csv = [headers, ...dataRows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadshow-crm-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CRM export downloaded");
  };
  const [report, setReport] = useState<any>(null);

  const { data: orderBook, isLoading, refetch } = trpc.roadshowAI.getOrderBook.useQuery(
    { roadshowId: id! },
    { enabled: !!id, refetchInterval: 30000 }
  );

  const { data: allSignals = [] } = trpc.roadshowAI.getRoadshowSignals.useQuery(
    { roadshowId: id! },
    { enabled: !!id }
  );

  const generateReport = trpc.roadshowAI.generateDebriefReport.useMutation({
    onSuccess: (data) => {
      setReport(data);
      setActiveTab("report");
      toast.success("Debrief report generated");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/live-video/roadshow/${id}`)} className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm">Order Book & Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={exportToCsv}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CRM CSV
            </button>
            <button
              onClick={() => generateReport.mutate({ roadshowId: id! })}
              disabled={generateReport.isPending}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              {generateReport.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generateReport.isPending ? "Generating…" : "Generate Debrief Report"}
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Stats bar */}
        {orderBook && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Soft Commits", value: orderBook.softCommitCount, color: "text-emerald-400" },
              { label: "Interest Signals", value: orderBook.interestCount, color: "text-blue-400" },
              { label: "Objections", value: orderBook.objectionCount, color: "text-red-400" },
              { label: "Total Signals", value: orderBook.totalSignals, color: "text-white" },
              { label: "Meetings Done", value: `${orderBook.completedMeetings}/${orderBook.totalMeetings}`, color: "text-slate-300" },
              { label: "Investors Met", value: orderBook.totalInvestors, color: "text-slate-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {[
            { id: "orderbook", label: "Order Book", icon: BarChart3 },
            { id: "heatmap", label: "Sentiment Heatmap", icon: Activity },
            { id: "report", label: "Debrief Report", icon: FileText },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tabId
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Order Book Tab */}
        {activeTab === "orderbook" && (
          <div className="space-y-4">
            {!orderBook || orderBook.orderBook.length === 0 ? (
              <div className="text-center py-20">
                <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Signals Yet</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Commitment signals will appear here as you analyse meeting transcripts. Use the Signal Detector panel in each meeting to capture investor intent.
                </p>
              </div>
            ) : (
              <>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {orderBook.orderBook.length} institution{orderBook.orderBook.length !== 1 ? "s" : ""} with signals — sorted by commitment strength
                </div>
                {orderBook.orderBook.map((entry: any, idx: number) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{entry.institution}</div>
                          {entry.investorName && (
                            <div className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>{entry.investorName}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.hasSoftCommit && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-700/40 px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" /> Soft Commit
                          </span>
                        )}
                        {entry.indicatedAmounts.length > 0 && (
                          <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                            {entry.indicatedAmounts.join(", ")}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {entry.highestConfidence}% max confidence
                        </span>
                      </div>
                    </div>

                    {/* Signal breakdown */}
                    <div className="flex flex-wrap gap-2">
                      {entry.signals.map((sig: any, si: number) => {
                        const cfg = SIGNAL_CONFIG[sig.signalType as SignalType] ?? SIGNAL_CONFIG.interest;
                        const Icon = cfg.icon;
                        return (
                          <div key={si} className={`flex items-center gap-1.5 ${cfg.bg} border border-slate-700/50 rounded-lg px-2.5 py-1.5 max-w-xs`}>
                            <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.color}`} />
                            <span className="text-xs text-slate-300 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                              "{sig.quote.slice(0, 60)}{sig.quote.length > 60 ? "…" : ""}"
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Sentiment Heatmap Tab */}
        {activeTab === "heatmap" && (
          <div className="space-y-4">
            {sentimentTimeline.length === 0 ? (
              <div className="text-center py-20">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Meeting Data Yet</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Sentiment data will appear here once meetings have been analysed. Use the Commitment Signal Detector in each meeting card to capture transcript signals.
                </p>
              </div>
            ) : (
              <>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Sentiment arc across {sentimentTimeline.length} meeting{sentimentTimeline.length !== 1 ? "s" : ""} — scored from commitment signals
                </div>

                {/* Visual bar chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
                  <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Meeting Sentiment Scores</div>
                  <div className="flex items-end gap-2 h-40">
                    {sentimentTimeline.map((m: any, i: number) => {
                      const barColor = m.sentimentLabel === "positive" ? "bg-emerald-500" : m.sentimentLabel === "neutral" ? "bg-amber-500" : "bg-red-500";
                      const barHeight = `${Math.max(8, m.sentimentScore)}%`;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                          <div className="text-[9px] text-slate-500 font-bold">{m.sentimentScore}</div>
                          <div
                            className={`w-full rounded-t-sm ${barColor} opacity-80 transition-all`}
                            style={{ height: barHeight }}
                            title={`${m.investorName ?? 'Unknown'} — ${m.sentimentScore}/100`}
                          />
                          <div className="text-[8px] text-slate-600 truncate w-full text-center">
                            {m.startTime ?? m.meetingDate}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-[10px] text-slate-400">Positive (≥70)</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /><span className="text-[10px] text-slate-400">Neutral (40–69)</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-[10px] text-slate-400">Negative (&lt;40)</span></div>
                  </div>
                </div>

                {/* Meeting-by-meeting breakdown */}
                {sentimentTimeline.map((m: any, i: number) => {
                  const sentColor = m.sentimentLabel === "positive" ? "text-emerald-400 bg-emerald-900/20 border-emerald-700/40"
                    : m.sentimentLabel === "neutral" ? "text-amber-400 bg-amber-900/20 border-amber-700/40"
                    : "text-red-400 bg-red-900/20 border-red-700/40";
                  return (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{m.investorName ?? 'Unassigned Meeting'}</div>
                            <div className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {m.meetingDate} {m.startTime ? `· ${m.startTime}` : ''} · {m.status.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${sentColor}`}>
                          <span className="text-lg font-bold">{m.sentimentScore}</span>
                          <span className="text-[10px] opacity-70">/100</span>
                          <span className="text-[10px] font-semibold uppercase opacity-80">{m.sentimentLabel}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center bg-emerald-900/10 border border-emerald-800/30 rounded-lg py-2">
                          <div className="text-lg font-bold text-emerald-400">{m.softCommitCount + m.interestCount}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Positive Signals</div>
                        </div>
                        <div className="text-center bg-red-900/10 border border-red-800/30 rounded-lg py-2">
                          <div className="text-lg font-bold text-red-400">{m.objectionCount}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Objections</div>
                        </div>
                        <div className="text-center bg-slate-800 border border-slate-700 rounded-lg py-2">
                          <div className="text-lg font-bold text-white">{m.signalCount}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Total Signals</div>
                        </div>
                      </div>

                      {m.topSignal && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                          <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Top Signal</div>
                          <p className="text-xs text-slate-300 italic" style={{ fontFamily: "'Inter', sans-serif" }}>"{m.topSignal.slice(0, 120)}{m.topSignal.length > 120 ? '…' : ''}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Debrief Report Tab */}
        {activeTab === "report" && (
          <div>
            {!report ? (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Report Generated Yet</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Click "Generate Debrief Report" to create a board-ready AI summary of the entire roadshow, including demand assessment, top investors, key themes, and allocation recommendations.
                </p>
                <button
                  onClick={() => generateReport.mutate({ roadshowId: id! })}
                  disabled={generateReport.isPending}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors mx-auto"
                >
                  {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generateReport.isPending ? "Generating Report…" : "Generate Debrief Report"}
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {/* Report header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{report.roadshowTitle}</h2>
                      <p className="text-slate-400 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Post-Roadshow Debrief Report · {report.issuer} · Generated {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    {report.overallOutlook && (() => {
                      const cfg = OUTLOOK_CONFIG[report.overallOutlook as keyof typeof OUTLOOK_CONFIG];
                      const Icon = cfg.icon;
                      return (
                        <div className={`flex items-center gap-2 ${cfg.bg} border ${cfg.border} rounded-xl px-4 py-2`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{report.completedMeetings}/{report.totalMeetings}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Meetings Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{report.softCommitCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Soft Commits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{report.totalSignals}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Total Signals</div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Executive Summary</h3>
                  <p className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {report.executiveSummary}
                  </p>
                </div>

                {/* Demand Assessment */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Demand Assessment</h3>
                  <p className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {report.demandAssessment}
                  </p>
                </div>

                {/* Top Investors */}
                {report.topInvestors?.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Top Investors by Signal Strength</h3>
                    <div className="space-y-3">
                      {report.topInvestors.map((inv: any, i: number) => {
                        const strengthColor = inv.signalStrength === "strong" ? "text-emerald-400 bg-emerald-900/20 border-emerald-700/40"
                          : inv.signalStrength === "moderate" ? "text-amber-400 bg-amber-900/20 border-amber-700/40"
                          : "text-slate-400 bg-slate-800 border-slate-700";
                        return (
                          <div key={i} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-400">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-white">{inv.institution}</span>
                                <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded capitalize ${strengthColor}`}>
                                  {inv.signalStrength}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>{inv.notes}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key Themes & Objections side by side */}
                <div className="grid md:grid-cols-2 gap-4">
                  {report.keyThemes?.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Key Themes</h3>
                      <ul className="space-y-2">
                        {report.keyThemes.map((theme: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">•</span>
                            <span className="text-xs text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Objection Analysis</h3>
                    <p className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {report.objectionAnalysis}
                    </p>
                  </div>
                </div>

                {/* Allocation Recommendation */}
                <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3">Allocation Recommendation</h3>
                  <p className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {report.allocationRecommendation}
                  </p>
                </div>

                {/* Next Steps */}
                {report.nextSteps?.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recommended Next Steps</h3>
                    <ol className="space-y-3">
                      {report.nextSteps.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
