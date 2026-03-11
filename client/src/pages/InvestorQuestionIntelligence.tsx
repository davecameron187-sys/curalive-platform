import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area,
} from "recharts";
import {
  MessageSquare, TrendingUp, Shield, AlertTriangle, Brain, Search,
  Loader2, Plus, ChevronRight, HelpCircle, RefreshCw, Zap,
  Users, Globe, Activity, Target, Database, BarChart3,
  ArrowUpRight, Sparkles, Building2, Layers, BookOpen,
} from "lucide-react";

const SECTORS = ["Technology","Healthcare","Energy","Financials","Consumer","Industrials","Materials","Utilities","Real Estate","Other"];
const EVENT_TYPES = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "agm", label: "AGM" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "ceo_town_hall", label: "CEO Town Hall" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "webcast", label: "Webcast" },
  { value: "other", label: "Other" },
];
const TOPIC_LABELS: Record<string, string> = {
  revenue_guidance: "Revenue Guidance", margin_pressure: "Margin Pressure",
  supply_chain: "Supply Chain", ai_infrastructure: "AI Infrastructure",
  capital_allocation: "Capital Allocation", esg: "ESG",
  governance: "Governance", debt_leverage: "Debt & Leverage",
  growth_strategy: "Growth Strategy", market_conditions: "Market Conditions",
  management: "Management", competition: "Competition",
  regulatory: "Regulatory", other: "Other",
};
const TOPIC_COLORS: Record<string, string> = {
  revenue_guidance: "#818cf8", margin_pressure: "#f87171", supply_chain: "#fb923c",
  ai_infrastructure: "#a78bfa", capital_allocation: "#60a5fa", esg: "#34d399",
  governance: "#f59e0b", debt_leverage: "#94a3b8", growth_strategy: "#2dd4bf",
  market_conditions: "#e879f9", management: "#facc15", competition: "#f472b6",
  regulatory: "#c084fc", other: "#475569",
};

const QUARTERS = ["Q1 2024","Q2 2024","Q3 2024","Q4 2024","Q1 2025","Q2 2025","Q3 2025","Q4 2025","Q1 2026","Q2 2026"];

const TABS = [
  { id: "concerns", label: "Global Concern Tracker", icon: Globe },
  { id: "difficulty", label: "Difficulty Index", icon: Target },
  { id: "avoidance", label: "Avoidance Detection", icon: AlertTriangle },
  { id: "add", label: "Log Question", icon: Plus },
  { id: "dataset", label: "Full Dataset", icon: Database },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0e1119] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? Number(p.value).toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function DifficultyBadge({ score }: { score: number }) {
  const color = score >= 7 ? "bg-red-400/15 text-red-400 border-red-400/25" :
    score >= 4 ? "bg-amber-400/15 text-amber-400 border-amber-400/25" :
    "bg-emerald-400/15 text-emerald-400 border-emerald-400/25";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color} tabular-nums`}>{Number(score).toFixed(1)}</span>;
}

function TopicChip({ category }: { category: string }) {
  const label = TOPIC_LABELS[category] ?? category;
  const color = TOPIC_COLORS[category] ?? "#475569";
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
      {label}
    </span>
  );
}

export default function InvestorQuestionIntelligence() {
  const [tab, setTab] = useState("concerns");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    companyName: "", sector: "", eventType: "earnings_call", eventQuarter: "",
    investorName: "", investorFirm: "", questionText: "", responseText: "",
  });
  const [aiResult, setAiResult] = useState<any>(null);

  const stats = trpc.investorQuestions.getStats.useQuery();
  const concerns = trpc.investorQuestions.getGlobalConcerns.useQuery();
  const avoidance = trpc.investorQuestions.getAvoidanceInsights.useQuery();
  const questions = trpc.investorQuestions.listQuestions.useQuery({ limit: 50 });
  const analyzeQ = trpc.investorQuestions.analyzeQuestion.useMutation({
    onSuccess: (data) => { setAiResult(data); setAnalyzing(false); },
    onError: (e) => { toast.error(e.message); setAnalyzing(false); },
  });
  const addQ = trpc.investorQuestions.addQuestion.useMutation({
    onSuccess: () => {
      toast.success("Question logged to the intelligence dataset");
      setForm({ companyName: "", sector: "", eventType: "earnings_call", eventQuarter: "", investorName: "", investorFirm: "", questionText: "", responseText: "" });
      setAiResult(null);
      setSubmitting(false);
      stats.refetch(); concerns.refetch(); avoidance.refetch(); questions.refetch();
    },
    onError: (e) => { toast.error(e.message); setSubmitting(false); },
  });

  const handleAnalyze = () => {
    if (!form.questionText.trim()) return toast.error("Enter a question first");
    setAnalyzing(true);
    analyzeQ.mutate({ questionText: form.questionText, responseText: form.responseText });
  };

  const handleSubmit = () => {
    if (!form.questionText.trim()) return toast.error("Question text is required");
    setSubmitting(true);
    addQ.mutate({
      ...form,
      eventType: form.eventType as any,
      questionTopic: aiResult?.question_topic,
      topicCategory: aiResult?.topic_category,
      questionSentiment: aiResult?.question_sentiment,
      difficultySCore: aiResult?.difficulty_score,
      responseSentiment: aiResult?.response_sentiment,
      avoidanceDetected: aiResult?.avoidance_detected ?? false,
      avoidanceScore: aiResult?.avoidance_score,
      avoidanceReason: aiResult?.avoidance_reason,
      aiAnalysis: aiResult?.analysis_summary,
    });
  };

  const d = stats.data;
  const g = concerns.data;
  const av = avoidance.data;

  const topicBarData = (g?.byTopic ?? []).map((r: any) => ({
    name: TOPIC_LABELS[r.topic_category] ?? r.topic_category,
    category: r.topic_category,
    count: Number(r.count),
    difficulty: Number(r.avg_difficulty ?? 0),
    avoided: Number(r.avoided_count ?? 0),
  })).filter(r => r.count > 0);

  const avoidanceByTopicData = (av?.byTopic ?? []).map((r: any) => ({
    name: TOPIC_LABELS[r.topic_category] ?? r.topic_category,
    total: Number(r.total),
    avoided: Number(r.avoided ?? 0),
    rate: r.total > 0 ? Math.round((Number(r.avoided) / Number(r.total)) * 100) : 0,
  })).filter(r => r.total > 0).sort((a, b) => b.rate - a.rate).slice(0, 8);

  return (
    <div className="min-h-screen bg-[#060810] text-white">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#060810]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">Investor Question Intelligence</h1>
                <span className="text-[10px] font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase">IQI</span>
              </div>
              <p className="text-xs text-slate-500">Structured behavior and intent behind investor questions — the global map of investor concerns</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2">
              <span><span className="text-white font-semibold">{Number(d?.total ?? 0).toLocaleString()}</span> questions</span>
              <span><span className="text-white font-semibold">{Number(d?.companies ?? 0)}</span> companies</span>
              <span><span className="text-white font-semibold">{Number(d?.investor_firms ?? 0)}</span> investor firms</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                  active
                    ? "text-amber-400 border-amber-400 bg-amber-400/[0.05]"
                    : "text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── GLOBAL CONCERN TRACKER ── */}
        {tab === "concerns" && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Database, label: "Questions Captured", value: Number(d?.total ?? 0).toLocaleString(), color: "text-amber-400" },
                { icon: Target, label: "Avg Difficulty Score", value: d?.avg_difficulty != null ? `${Number(d.avg_difficulty).toFixed(1)} / 10` : "—", color: "text-red-400" },
                { icon: AlertTriangle, label: "Avoidance Events", value: Number(d?.total_avoided ?? 0), color: "text-orange-400" },
                { icon: Globe, label: "Sectors Covered", value: Number(d?.sectors ?? 0), color: "text-emerald-400" },
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

            {/* Topic frequency chart */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Top Investor Concerns — by Topic Frequency</h3>
                <span className="text-xs text-slate-600 ml-auto">All events</span>
              </div>
              {topicBarData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 gap-2">
                  <Globe className="w-8 h-8 text-slate-800" />
                  <p className="text-slate-700 text-sm">No data yet — log your first question to start tracking</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topicBarData} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Questions" radius={[4, 4, 0, 0]}>
                      {topicBarData.map((entry: any, i: number) => (
                        <rect key={i} fill={TOPIC_COLORS[entry.category] ?? "#818cf8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top hardest questions */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-white">Hardest Questions in Dataset</h3>
              </div>
              {(g?.topQuestions ?? []).length === 0 ? (
                <p className="text-slate-700 text-sm text-center py-8">No questions logged yet</p>
              ) : (
                <div className="space-y-2">
                  {(g?.topQuestions ?? []).map((q: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="text-xs font-bold text-slate-600 tabular-nums pt-0.5 w-5 shrink-0">#{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{q.question_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {q.topic_category && <TopicChip category={q.topic_category} />}
                          {q.sector && <span className="text-[10px] text-slate-600">{q.sector}</span>}
                          {q.event_quarter && <span className="text-[10px] text-slate-700">{q.event_quarter}</span>}
                          {q.investor_firm && <span className="text-[10px] text-slate-600">{q.investor_firm}</span>}
                        </div>
                      </div>
                      {q.difficulty_score != null && <DifficultyBadge score={q.difficulty_score} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── DIFFICULTY INDEX ── */}
        {tab === "difficulty" && (
          <>
            <div className="bg-gradient-to-br from-red-500/[0.06] via-orange-500/[0.03] to-transparent border border-red-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-white">Question Difficulty Index</h3>
                <span className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full ml-auto">0 = Routine · 10 = High-Pressure Challenge</span>
              </div>
              <p className="text-xs text-slate-600">AI scores every investor question on a 10-point difficulty scale based on specificity, pressure tactics, scope of challenge, and whether it targets management credibility.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Difficulty by topic */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Average Difficulty by Topic</h3>
                </div>
                {topicBarData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topicBarData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="difficulty" name="Avg Difficulty" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Scoring methodology */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-amber-400/60" />
                  <h3 className="text-sm font-semibold text-white">Difficulty Scoring Factors</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { score: "8–10", label: "High-Pressure Challenge", desc: "Questions targeting management credibility, contradicting prior statements, or demanding specific numerical commitments", color: "text-red-400 bg-red-400/10 border-red-400/20" },
                    { score: "5–7", label: "Substantive Challenge", desc: "Detailed questions on guidance, strategy, or financials requiring thoughtful, well-prepared responses", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
                    { score: "2–4", label: "Standard Inquiry", desc: "Routine questions on business performance, market conditions, or strategic direction with clear answers available", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                    { score: "0–1", label: "Routine / Clarification", desc: "Simple clarification requests or positive confirmation questions with little analytical pressure", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  ].map(r => (
                    <div key={r.score} className="flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${r.color}`}>{r.score}</span>
                      <div>
                        <p className="text-xs font-medium text-slate-300">{r.label}</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* All questions sorted by difficulty */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">All Questions — Sorted by Difficulty</h3>
              </div>
              {(questions.data ?? []).filter((q: any) => q.difficulty_score != null).length === 0 ? (
                <p className="text-slate-700 text-sm text-center py-8">No scored questions yet — log a question and run AI analysis</p>
              ) : (
                <div className="space-y-2">
                  {[...(questions.data ?? [])].filter((q: any) => q.difficulty_score != null).sort((a: any, b: any) => Number(b.difficulty_score) - Number(a.difficulty_score)).slice(0, 20).map((q: any, i: number) => (
                    <div key={q.id} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <DifficultyBadge score={q.difficulty_score} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{q.question_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {q.topic_category && <TopicChip category={q.topic_category} />}
                          {q.sector && <span className="text-[10px] text-slate-600">{q.sector}</span>}
                          {q.investor_firm && <span className="text-[10px] text-slate-600">{q.investor_firm}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── AVOIDANCE DETECTION ── */}
        {tab === "avoidance" && (
          <>
            <div className="bg-gradient-to-br from-orange-500/[0.06] via-red-500/[0.03] to-transparent border border-orange-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Executive Avoidance Detection</h3>
                <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full ml-auto">Proprietary AI Algorithm</span>
              </div>
              <p className="text-xs text-slate-600">Detects when executives deflect, pivot, or fail to answer investor questions directly. Captures patterns boards and IR teams cannot see from transcripts alone.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Avoidance by topic */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Avoidance Rate by Topic</h3>
                </div>
                {avoidanceByTopicData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={avoidanceByTopicData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" name="Avoidance Rate %" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Avoidance by sector */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Avoidance Rate by Sector</h3>
                </div>
                {(av?.bySector ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No sector data yet</div>
                ) : (
                  <div className="space-y-3">
                    {(av?.bySector ?? []).map((r: any) => (
                      <div key={r.sector} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{r.sector}</span>
                          <span className="text-orange-400 font-semibold">{Number(r.avoidance_rate).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(Number(r.avoidance_rate), 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-700">{r.avoided} avoided of {r.total} total</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Flagged questions */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Flagged Avoidance Events</h3>
                <span className="text-xs text-slate-600 ml-auto">{(av?.flagged ?? []).length} events</span>
              </div>
              {(av?.flagged ?? []).length === 0 ? (
                <p className="text-slate-700 text-sm text-center py-8">No avoidance events flagged yet</p>
              ) : (
                <div className="space-y-3">
                  {(av?.flagged ?? []).map((q: any, i: number) => (
                    <div key={i} className="p-4 bg-orange-500/[0.04] border border-orange-500/15 rounded-xl">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.topic_category && <TopicChip category={q.topic_category} />}
                          {q.sector && <span className="text-[10px] text-slate-600">{q.sector}</span>}
                          {q.event_quarter && <span className="text-[10px] text-slate-700">{q.event_quarter}</span>}
                        </div>
                        <div className="shrink-0">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full">Avoidance {Number(q.avoidance_score).toFixed(1)}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-2">"{q.question_text}"</p>
                      {q.avoidance_reason && (
                        <p className="text-xs text-orange-300/70 italic">⚠ {q.avoidance_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── LOG QUESTION ── */}
        {tab === "add" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Form */}
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Log Investor Question</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Company (optional)</label>
                      <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="e.g. Microsoft Corp" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-400/40" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Sector</label>
                      <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/40">
                        <option value="">Select sector</option>
                        {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
                      <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/40">
                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Quarter</label>
                      <select value={form.eventQuarter} onChange={e => setForm(f => ({ ...f, eventQuarter: e.target.value }))} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/40">
                        <option value="">Select quarter</option>
                        {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Investor Name (optional)</label>
                      <input value={form.investorName} onChange={e => setForm(f => ({ ...f, investorName: e.target.value }))} placeholder="e.g. John Smith" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-400/40" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Investor Firm (optional)</label>
                      <input value={form.investorFirm} onChange={e => setForm(f => ({ ...f, investorFirm: e.target.value }))} placeholder="e.g. Goldman Sachs" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-400/40" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Investor Question <span className="text-red-400">*</span></label>
                    <textarea value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} rows={4} placeholder="Paste or type the full investor question here..." className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-400/40 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Executive Response (optional — improves avoidance detection)</label>
                    <textarea value={form.responseText} onChange={e => setForm(f => ({ ...f, responseText: e.target.value }))} rows={4} placeholder="Paste the executive's response here..." className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-400/40 resize-none" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button onClick={handleAnalyze} disabled={analyzing} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm h-10 px-4 gap-2 flex-1">
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {analyzing ? "Analysing…" : "Run AI Analysis"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm h-10 px-5 gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      Log to Dataset
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI result panel */}
            <div>
              {aiResult ? (
                <div className="bg-gradient-to-br from-amber-500/[0.06] to-transparent border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">AI Intelligence Analysis</h3>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Difficulty Score</p>
                      <div className="text-2xl font-bold text-red-400">{Number(aiResult.difficulty_score ?? 0).toFixed(1)}<span className="text-sm text-slate-600">/10</span></div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Avoidance Score</p>
                      <div className="text-2xl font-bold text-orange-400">{Number(aiResult.avoidance_score ?? 0).toFixed(1)}<span className="text-sm text-slate-600">/10</span></div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Question Sentiment</p>
                      <div className={`text-sm font-bold capitalize ${aiResult.question_sentiment === "negative" ? "text-red-400" : aiResult.question_sentiment === "positive" ? "text-emerald-400" : "text-slate-400"}`}>{aiResult.question_sentiment}</div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Response Quality</p>
                      <div className={`text-sm font-bold capitalize ${aiResult.response_sentiment === "deflected" ? "text-red-400" : aiResult.response_sentiment === "strong" ? "text-emerald-400" : "text-slate-400"}`}>{aiResult.response_sentiment ?? "—"}</div>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="flex flex-wrap gap-2">
                    {aiResult.topic_category && <TopicChip category={aiResult.topic_category} />}
                    {aiResult.question_topic && <span className="text-xs text-slate-400">{aiResult.question_topic}</span>}
                  </div>

                  {/* Avoidance warning */}
                  {aiResult.avoidance_detected && (
                    <div className="flex items-start gap-2 p-3 bg-orange-500/[0.08] border border-orange-500/20 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-300/80">{aiResult.avoidance_reason}</p>
                    </div>
                  )}

                  {/* Analysis */}
                  {aiResult.analysis_summary && (
                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                      <p className="text-[10px] text-slate-500 mb-1">Expert Commentary</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{aiResult.analysis_summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white/[0.01] border border-dashed border-white/[0.06] rounded-2xl gap-3">
                  <Brain className="w-10 h-10 text-slate-800" />
                  <p className="text-slate-700 text-sm">Run AI Analysis to see intelligence output</p>
                  <p className="text-xs text-slate-800">Difficulty score, avoidance detection, topic classification, and expert commentary</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FULL DATASET ── */}
        {tab === "dataset" && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Full Question Dataset</h3>
              <span className="text-xs text-slate-600 ml-auto">{(questions.data ?? []).length} records</span>
            </div>
            {(questions.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Database className="w-10 h-10 text-slate-800" />
                <p className="text-slate-700 text-sm">No questions logged yet</p>
                <p className="text-xs text-slate-800">Go to "Log Question" to start building the dataset</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(questions.data ?? []).map((q: any) => (
                  <div key={q.id} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">{q.question_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {q.topic_category && <TopicChip category={q.topic_category} />}
                          {q.event_type && <span className="text-[10px] text-slate-600">{q.event_type.replace(/_/g, " ")}</span>}
                          {q.sector && <span className="text-[10px] text-slate-700">{q.sector}</span>}
                          {q.event_quarter && <span className="text-[10px] text-slate-700">{q.event_quarter}</span>}
                          {q.company_name && <span className="text-[10px] text-slate-600">{q.company_name}</span>}
                          {q.investor_firm && <span className="text-[10px] text-slate-600">{q.investor_firm}</span>}
                          {q.avoidance_detected ? <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-full">⚠ Avoidance</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {q.difficulty_score != null && <DifficultyBadge score={q.difficulty_score} />}
                        {q.ai_analysis && <span className="text-[10px] text-violet-400/60 bg-violet-400/[0.06] border border-violet-400/10 px-1.5 py-0.5 rounded-full">AI scored</span>}
                      </div>
                    </div>
                    {q.ai_analysis && (
                      <p className="text-[10px] text-slate-600 leading-relaxed mt-2 line-clamp-2 italic">{q.ai_analysis}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
