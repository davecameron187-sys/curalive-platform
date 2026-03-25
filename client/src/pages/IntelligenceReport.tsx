import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText, Brain, Sparkles, Loader2, Plus, ChevronRight,
  TrendingUp, TrendingDown, Minus, Shield, Users, Activity,
  AlertTriangle, Award, BarChart3, Target, MessageSquare,
  Globe, BookOpen, Building2, RefreshCw, Trash2, Download,
  Calendar, ArrowUpRight, Zap, CheckCircle2, XCircle,
  LineChart, Star,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "agm", label: "AGM" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "ceo_town_hall", label: "CEO Town Hall" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "webcast", label: "Webcast" },
  { value: "other", label: "Other" },
];
const SECTORS = ["Technology","Healthcare","Energy","Financials","Consumer","Industrials","Materials","Utilities","Real Estate","Other"];
const QUARTERS = ["Q1 2024","Q2 2024","Q3 2024","Q4 2024","Q1 2025","Q2 2025","Q3 2025","Q4 2025","Q1 2026","Q2 2026"];

function ScoreMeter({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color = score >= 70 ? "#34d399" : score >= 55 ? "#f59e0b" : "#f87171";
  const sizes = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl" };
  return (
    <div className="flex flex-col items-center">
      <div className={`${sizes[size]} font-black tabular-nums`} style={{ color }}>{Math.round(score)}</div>
      <div className="text-[10px] text-slate-600 font-medium">/ 100</div>
      <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function GradeTag({ grade }: { grade: string }) {
  const g = (grade ?? "B").charAt(0);
  const color = g === "A" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" :
    g === "B" ? "text-blue-400 bg-blue-400/10 border-blue-400/25" :
    g === "C" ? "text-amber-400 bg-amber-400/10 border-amber-400/25" :
    "text-red-400 bg-red-400/10 border-red-400/25";
  return <span className={`text-lg font-black px-3 py-1 rounded-xl border ${color}`}>{grade}</span>;
}

function MarketTag({ reaction }: { reaction: string }) {
  const map: Record<string, { icon: any; color: string; label: string }> = {
    positive: { icon: TrendingUp, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Positive" },
    neutral: { icon: Minus, color: "text-slate-400 bg-white/[0.04] border-white/10", label: "Neutral" },
    negative: { icon: TrendingDown, color: "text-red-400 bg-red-400/10 border-red-400/20", label: "Negative" },
  };
  const m = map[reaction] ?? map.neutral;
  const Icon = m.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${m.color}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

type ReportData = {
  id?: number;
  meta?: any;
  scores?: any;
  questions?: any;
  executives?: Record<string, number>;
  concerns?: string[];
  ai?: {
    executive_summary?: string;
    key_insights?: string[];
    recommendations?: string;
    risk_flags?: string[];
    narrative_sentiment?: string;
    communication_grade?: string;
  };
  event_name?: string;
  company_name?: string;
  sector?: string;
  event_type?: string;
  event_quarter?: string;
  report_date?: string;
  sentiment_score?: number;
  communication_score?: number;
  cici_score?: number;
  question_difficulty_avg?: number;
  total_questions?: number;
  high_difficulty_count?: number;
  avoidance_events?: number;
  market_reaction?: string;
  top_concerns?: any;
  executive_scores?: any;
  key_insights?: any;
  risk_flags?: any;
  executive_summary?: string;
  recommendations?: string;
  full_report_json?: string;
};

function parseField(field: any): any {
  if (!field) return field;
  if (typeof field === "string") { try { return JSON.parse(field); } catch { return field; } }
  return field;
}

function FullReport({ report, onBack }: { report: ReportData; onBack: () => void }) {
  // Normalise: might be from DB (flat) or from mutation result (nested)
  const isFlat = !report.meta;
  const meta = isFlat ? {
    eventName: report.event_name, companyName: report.company_name,
    sector: report.sector, eventType: report.event_type, eventQuarter: report.event_quarter,
    reportDate: report.report_date,
  } : report.meta;
  const scores = isFlat ? {
    sentiment: Number(report.sentiment_score),
    communicationScore: Number(report.communication_score),
    ciciScore: Number(report.cici_score),
    questionDifficultyAvg: Number(report.question_difficulty_avg),
    marketReaction: report.market_reaction,
  } : report.scores;
  const questions = isFlat ? {
    total: report.total_questions,
    highDifficulty: report.high_difficulty_count,
    avoidanceEvents: report.avoidance_events,
  } : report.questions;
  const executives = isFlat ? parseField(report.executive_scores) : report.executives;
  const concerns = isFlat ? parseField(report.top_concerns) : report.concerns;

  // AI fields may be nested (mutation) or flat (DB)
  const aiRaw = isFlat ? null : report.ai;
  const execSummary = aiRaw?.executive_summary ?? report.executive_summary ?? "";
  const keyInsights: string[] = aiRaw?.key_insights ?? parseField(report.key_insights) ?? [];
  const recommendations = aiRaw?.recommendations ?? report.recommendations ?? "";
  const riskFlags: string[] = aiRaw?.risk_flags ?? parseField(report.risk_flags) ?? [];
  const grade = aiRaw?.communication_grade ?? "";
  const narrativeSentiment = aiRaw?.narrative_sentiment ?? "";

  const fullJson = isFlat ? parseField(report.full_report_json) : null;
  const finalGrade = grade || fullJson?.ai?.communication_grade || "B";
  const finalNarrative = narrativeSentiment || fullJson?.ai?.narrative_sentiment || "";

  const eventTypeLabel = (meta?.eventType ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
          ← Back to reports
        </button>
        <div className="flex-1" />
        <span className="text-xs text-slate-600">Report #{report.id}</span>
      </div>

      {/* Report masthead */}
      <div className="bg-gradient-to-br from-indigo-500/[0.08] via-violet-500/[0.05] to-transparent border border-indigo-500/20 rounded-2xl overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-indigo-500/15 to-violet-500/10 border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-[0.15em] text-indigo-400/70 uppercase">CuraLive Intelligence</span>
                <span className="text-[10px] text-slate-700">·</span>
                <span className="text-[10px] text-slate-600 font-mono">{meta?.reportDate}</span>
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">{meta?.eventName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {meta?.companyName && <span className="text-sm text-slate-400">{meta.companyName}</span>}
                {meta?.sector && <span className="text-xs text-slate-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">{meta.sector}</span>}
                {meta?.eventQuarter && <span className="text-xs text-slate-600">{meta.eventQuarter}</span>}
                <MarketTag reaction={scores?.marketReaction ?? "neutral"} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-600 mb-1">Communication Grade</div>
              <GradeTag grade={finalGrade} />
            </div>
          </div>
          {finalNarrative && (
            <p className="text-xs text-indigo-300/60 italic mt-3 border-t border-white/[0.04] pt-3">{finalNarrative}</p>
          )}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04]">
          {[
            { label: "Investor Sentiment", value: scores?.sentiment, icon: Activity, color: "text-emerald-400" },
            { label: "Communication Score", value: scores?.communicationScore, icon: Brain, color: "text-violet-400" },
            { label: "CICI Index Reading", value: scores?.ciciScore, icon: BarChart3, color: "text-indigo-400" },
            { label: "Q&A Difficulty Avg", value: scores?.questionDifficultyAvg != null ? Math.round(scores.questionDifficultyAvg * 10) : null, icon: Target, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#060810] px-5 py-4 flex flex-col items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <div className={`text-2xl font-black ${color}`}>{value != null ? Math.round(Number(value)) : "—"}</div>
              <div className="text-[10px] text-slate-600 text-center leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      {execSummary && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{execSummary}</p>
        </div>
      )}

      {/* Two-col: Key Insights + Risk Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Insights */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Key Intelligence Findings</h3>
          </div>
          {keyInsights.length === 0 ? (
            <p className="text-slate-700 text-sm">No insights available</p>
          ) : (
            <div className="space-y-2">
              {keyInsights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-violet-500/[0.04] border border-violet-500/10 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Flags */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Risk Flags & Attention Areas</h3>
          </div>
          {riskFlags.length === 0 ? (
            <p className="text-slate-700 text-sm">No risk flags</p>
          ) : (
            <div className="space-y-2">
              {riskFlags.map((flag: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-amber-500/[0.04] border border-amber-500/10 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{flag}</p>
                </div>
              ))}
            </div>
          )}

          {/* Q&A stats */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-3 gap-3">
            {[
              { label: "Total Questions", value: questions?.total ?? 0 },
              { label: "High Difficulty", value: questions?.highDifficulty ?? 0 },
              { label: "Avoidance Events", value: questions?.avoidanceEvents ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-[10px] text-slate-600 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-col: Top Concerns + Executive Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top concerns */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Top Investor Concerns</h3>
          </div>
          {(concerns ?? []).length === 0 ? (
            <p className="text-slate-700 text-sm">No concerns recorded</p>
          ) : (
            <div className="space-y-2">
              {(concerns ?? []).slice(0, 6).map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                  <span className="text-xs font-bold text-amber-500/60 tabular-nums w-4 shrink-0">#{i + 1}</span>
                  <span className="text-sm text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Executive scores */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Executive Communication Scores</h3>
          </div>
          {!executives || Object.keys(executives).length === 0 ? (
            <p className="text-slate-700 text-sm">No executive data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(executives).map(([exec, score]) => {
                const s = Number(score);
                const color = s >= 80 ? "#34d399" : s >= 65 ? "#60a5fa" : "#f59e0b";
                return (
                  <div key={exec}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 font-medium">{exec}</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{Math.round(s)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Market reaction */}
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Post-Event Market Reaction</span>
              <MarketTag reaction={scores?.marketReaction ?? "neutral"} />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-gradient-to-br from-emerald-500/[0.05] to-transparent border border-emerald-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">IR Team Recommendations</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{recommendations}</p>
        </div>
      )}

      {/* Footer branding */}
      <div className="flex items-center justify-between py-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Zap className="w-3 h-3 text-violet-400" />
          </div>
          <span className="text-xs text-slate-700 font-medium">Powered by CuraLive Intelligence</span>
        </div>
        <span className="text-xs text-slate-800 font-mono">CONFIDENTIAL — NOT FOR EXTERNAL DISTRIBUTION</span>
      </div>
    </div>
  );
}

function GenerateForm({ onGenerated }: { onGenerated: (r: any) => void }) {
  const [form, setForm] = useState({
    eventName: "", companyName: "", sector: "", eventType: "earnings_call",
    eventQuarter: "", sentimentScore: "", communicationScore: "",
    totalQuestions: "", highDifficultyCount: "", avoidanceEvents: "",
    marketReaction: "neutral" as "positive" | "neutral" | "negative",
    concerns: ["", "", "", "", ""],
    executives: [{ role: "CEO", score: "" }, { role: "CFO", score: "" }],
  });
  const generate = trpc.intelligenceReport.generate.useMutation({
    onSuccess: (data) => { onGenerated(data); },
    onError: (e) => { toast.error(e.message); },
  });

  const updateConcern = (i: number, v: string) => setForm(f => { const c = [...f.concerns]; c[i] = v; return { ...f, concerns: c }; });
  const updateExec = (i: number, field: "role" | "score", v: string) => setForm(f => { const e = [...f.executives]; e[i] = { ...e[i], [field]: v }; return { ...f, executives: e }; });

  const handleSubmit = () => {
    if (!form.eventName.trim()) return toast.error("Event name is required");
    const execScores: Record<string, number> = {};
    form.executives.forEach(e => { if (e.role && e.score) execScores[e.role] = Number(e.score); });
    const topConcerns = form.concerns.filter(Boolean);
    generate.mutate({
      eventName: form.eventName,
      companyName: form.companyName || undefined,
      sector: form.sector || undefined,
      eventType: form.eventType as any,
      eventQuarter: form.eventQuarter || undefined,
      sentimentScore: form.sentimentScore ? Number(form.sentimentScore) : undefined,
      communicationScore: form.communicationScore ? Number(form.communicationScore) : undefined,
      totalQuestions: form.totalQuestions ? Number(form.totalQuestions) : undefined,
      highDifficultyCount: form.highDifficultyCount ? Number(form.highDifficultyCount) : undefined,
      avoidanceEvents: form.avoidanceEvents ? Number(form.avoidanceEvents) : undefined,
      marketReaction: form.marketReaction,
      executiveScores: Object.keys(execScores).length ? execScores : undefined,
      topConcerns: topConcerns.length ? topConcerns : undefined,
    });
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Generate Intelligence Report</h3>
        <p className="text-xs text-slate-600 ml-2">Leave signal fields blank to use platform data automatically</p>
      </div>

      {/* Event details */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Event Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">Event Name <span className="text-red-400">*</span></label>
            <input value={form.eventName} onChange={e => set("eventName", e.target.value)} placeholder="e.g. Q1 2026 Earnings Call — Technology Sector" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company (optional)</label>
            <input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="e.g. Acme Corp" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Sector</label>
            <select value={form.sector} onChange={e => set("sector", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/40">
              <option value="">Select sector</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
            <select value={form.eventType} onChange={e => set("eventType", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/40">
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Quarter</label>
            <select value={form.eventQuarter} onChange={e => set("eventQuarter", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/40">
              <option value="">Select quarter</option>
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Intelligence Signals <span className="text-slate-700 font-normal normal-case">(optional — pulls from platform if blank)</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: "sentimentScore", label: "Investor Sentiment", placeholder: "0–100" },
            { key: "communicationScore", label: "Communication Score", placeholder: "0–100" },
            { key: "totalQuestions", label: "Total Questions", placeholder: "e.g. 12" },
            { key: "highDifficultyCount", label: "High-Difficulty Qs", placeholder: "e.g. 3" },
            { key: "avoidanceEvents", label: "Avoidance Events", placeholder: "e.g. 1" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-500 mb-1 block">{label}</label>
              <input type="number" value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Market Reaction</label>
            <select value={form.marketReaction} onChange={e => set("marketReaction", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/40">
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>
      </div>

      {/* Executive scores */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Scores <span className="text-slate-700 font-normal normal-case">(optional)</span></p>
        <div className="grid grid-cols-2 gap-3">
          {form.executives.map((e, i) => (
            <div key={i} className="flex gap-2">
              <input value={e.role} onChange={ev => updateExec(i, "role", ev.target.value)} placeholder="Role (CEO)" className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
              <input type="number" value={e.score} onChange={ev => updateExec(i, "score", ev.target.value)} placeholder="0–100" className="w-20 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
            </div>
          ))}
        </div>
      </div>

      {/* Top concerns */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Top Investor Concerns <span className="text-slate-700 font-normal normal-case">(optional — up to 5)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {form.concerns.map((c, i) => (
            <input key={i} value={c} onChange={e => updateConcern(i, e.target.value)} placeholder={`Concern ${i + 1} (e.g. Revenue guidance)`} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-400/40" />
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={generate.isPending} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm h-11 gap-2">
        {generate.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Intelligence Report…</> : <><Brain className="w-4 h-4" /> Generate Report</>}
      </Button>
    </div>
  );
}

export default function IntelligenceReportPage() {
  const [view, setView] = useState<"list" | "generate" | "report">("list");
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  const list = trpc.intelligenceReport.list.useQuery();
  const deleteReport = trpc.intelligenceReport.delete.useMutation({
    onSuccess: () => { toast.success("Report deleted"); list.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerated = (r: any) => { setSelectedReport(r); setView("report"); list.refetch(); };
  const handleOpen = (r: any) => { setSelectedReport(r); setView("report"); };

  return (
    <div className="min-h-screen bg-[#060810] text-white">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#060810]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">Investor Intelligence Reports</h1>
                <span className="text-[10px] font-bold tracking-widest text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full uppercase">IIR</span>
              </div>
              <p className="text-xs text-slate-500">AI-generated post-event intelligence reports — the "Powered by CuraLive" artifact</p>
            </div>
          </div>
          {view === "list" && (
            <Button onClick={() => setView("generate")} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm h-9 px-4 gap-2">
              <Plus className="w-3.5 h-3.5" /> Generate Report
            </Button>
          )}
          {view !== "list" && (
            <Button variant="outline" onClick={() => setView("list")} className="border-white/10 text-slate-400 hover:text-white text-sm h-9 px-4">
              ← All Reports
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Generate form */}
        {view === "generate" && (
          <GenerateForm onGenerated={handleGenerated} />
        )}

        {/* Report view */}
        {view === "report" && selectedReport && (
          <FullReport report={selectedReport} onBack={() => setView("list")} />
        )}

        {/* List view */}
        {view === "list" && (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Reports Generated", value: list.data?.length ?? 0, icon: FileText, color: "text-violet-400" },
                { label: "Events Covered", value: new Set(list.data?.map((r: any) => r.event_name)).size, icon: Calendar, color: "text-indigo-400" },
                { label: "Companies Analysed", value: new Set(list.data?.filter((r: any) => r.company_name).map((r: any) => r.company_name)).size, icon: Building2, color: "text-blue-400" },
                { label: "Avg Sentiment Score", value: list.data?.length ? Math.round(list.data.reduce((s: number, r: any) => s + Number(r.sentiment_score ?? 0), 0) / list.data.length) : "—", icon: Activity, color: "text-emerald-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Report cards */}
            {list.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : (list.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-white/[0.06] rounded-2xl">
                <FileText className="w-12 h-12 text-slate-800" />
                <div className="text-center">
                  <p className="text-slate-600 font-medium">No reports generated yet</p>
                  <p className="text-xs text-slate-800 mt-1 max-w-sm">Generate your first Investor Intelligence Report — the branded artifact that circulates internally and drives CuraLive adoption</p>
                </div>
                <Button onClick={() => setView("generate")} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm h-9 px-5 gap-2">
                  <Brain className="w-4 h-4" /> Generate First Report
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(list.data ?? []).map((r: any) => {
                  const s = Number(r.sentiment_score ?? 0);
                  const sc = s >= 70 ? "text-emerald-400" : s >= 55 ? "text-amber-400" : "text-red-400";
                  const insights: string[] = (() => { try { return typeof r.key_insights === "string" ? JSON.parse(r.key_insights) : r.key_insights ?? []; } catch { return []; } })();
                  const risks: string[] = (() => { try { return typeof r.risk_flags === "string" ? JSON.parse(r.risk_flags) : r.risk_flags ?? []; } catch { return []; } })();
                  return (
                    <div key={r.id} className="bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/20 transition-colors rounded-2xl overflow-hidden group cursor-pointer" onClick={() => handleOpen(r)}>
                      {/* Card header */}
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start gap-3 justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-slate-700 font-mono">{r.event_type?.replace(/_/g," ")}</span>
                              {r.event_quarter && <span className="text-[10px] text-slate-700">{r.event_quarter}</span>}
                            </div>
                            <h3 className="text-sm font-semibold text-white leading-tight group-hover:text-violet-300 transition-colors line-clamp-1">{r.event_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {r.company_name && <span className="text-xs text-slate-500">{r.company_name}</span>}
                              {r.sector && <span className="text-xs text-slate-700">{r.sector}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <MarketTag reaction={r.market_reaction ?? "neutral"} />
                            <span className="text-[10px] text-slate-700">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="grid grid-cols-3 gap-px bg-white/[0.04] mx-5 rounded-xl overflow-hidden mb-4">
                        {[
                          { label: "Sentiment", value: Number(r.sentiment_score ?? 0), color: "#34d399" },
                          { label: "Communication", value: Number(r.communication_score ?? 0), color: "#818cf8" },
                          { label: "CICI", value: Number(r.cici_score ?? 0), color: "#60a5fa" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-[#060810] px-3 py-2 text-center">
                            <div className="text-base font-bold tabular-nums" style={{ color }}>{Math.round(value)}</div>
                            <div className="text-[9px] text-slate-700">{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* First insight */}
                      {r.executive_summary && (
                        <p className="text-xs text-slate-600 leading-relaxed px-5 pb-3 line-clamp-2">{r.executive_summary}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-violet-500/40" />
                          <span className="text-[10px] text-slate-800">Powered by CuraLive Intelligence</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); deleteReport.mutate({ id: r.id }); }} className="text-slate-700 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-violet-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
