import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, Plus, Brain, Target, AlertTriangle, MessageSquare,
  Shield, Lightbulb, ChevronRight, Trash2, Sparkles, Zap,
  BookOpen, Building2, Calendar, Activity, ArrowRight,
  CheckCircle2, TrendingUp, Users, FileText, RefreshCw,
  Mic, BarChart3, Clock,
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
const PERF_OPTIONS = [
  { value: "strong", label: "Strong Beat", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { value: "positive", label: "In-Line / Positive", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { value: "mixed", label: "Mixed Results", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "challenging", label: "Challenging Quarter", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { value: "difficult", label: "Difficult / Miss", color: "text-red-400 border-red-500/30 bg-red-500/10" },
];

const RISK_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

function DifficultyOrb({ score }: { score: number }) {
  const color = score >= 7 ? "#f87171" : score >= 4.5 ? "#f59e0b" : "#34d399";
  const label = score >= 7 ? "High Pressure" : score >= 4.5 ? "Moderate" : "Manageable";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(score / 10) * 201} 201`} opacity="0.9" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
      <span className="text-[10px] text-slate-700">Q&A Difficulty</span>
    </div>
  );
}

function parse(v: any): any {
  if (!v) return v;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return v; } }
  return v;
}

function BriefingView({ briefing, onBack }: { briefing: any; onBack: () => void }) {
  const isFlat = !briefing.meta;
  const meta = isFlat ? {
    eventName: briefing.event_name, companyName: briefing.company_name,
    sector: briefing.sector, eventType: briefing.event_type,
    eventQuarter: briefing.event_quarter, financialPerformance: briefing.financial_performance,
    keyAnnouncements: briefing.key_announcements, knownSensitivities: briefing.known_sensitivities,
  } : briefing.meta;

  // Resolve AI data — might be nested (from mutation) or flat+JSON (from DB)
  const fullJson = isFlat ? parse(briefing.full_briefing_json) : null;
  const ai = isFlat ? (fullJson?.ai ?? {}) : (briefing.ai ?? {});

  const execBriefing = ai.executive_briefing ?? briefing.executive_briefing ?? "";
  const diffForecast = Number(ai.difficulty_forecast ?? briefing.difficulty_forecast ?? 5);
  const predictedQs: any[] = ai.predicted_questions ?? parse(briefing.predicted_questions) ?? [];
  const topConcerns: string[] = ai.top_concerns ?? parse(briefing.top_concerns) ?? [];
  const riskAreas: any[] = ai.risk_areas ?? parse(briefing.risk_areas) ?? [];
  const commTips: string[] = ai.communication_tips ?? parse(briefing.communication_tips) ?? [];

  const perfLabel = PERF_OPTIONS.find(p => p.value === meta?.financialPerformance)?.label ?? meta?.financialPerformance;
  const perfColor = PERF_OPTIONS.find(p => p.value === meta?.financialPerformance)?.color ?? "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
          ← All Briefings
        </button>
        <div className="flex-1" />
        <span className="text-xs text-slate-700">Briefing #{briefing.id}</span>
      </div>

      {/* Masthead */}
      <div className="bg-gradient-to-br from-sky-500/[0.08] via-blue-500/[0.05] to-transparent border border-sky-500/20 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500/12 to-blue-500/8 border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-[0.15em] text-sky-400/70 uppercase">CuraLive Pre-Event Intelligence</span>
                <span className="text-[10px] text-slate-700">·</span>
                <span className="text-[10px] text-slate-600">{meta?.eventQuarter ?? "Upcoming"}</span>
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">{meta?.eventName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {meta?.companyName && <span className="text-sm text-slate-400">{meta.companyName}</span>}
                {meta?.sector && <span className="text-xs text-slate-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">{meta.sector}</span>}
                {meta?.eventType && <span className="text-xs text-slate-600">{meta.eventType.replace(/_/g," ")}</span>}
                {perfLabel && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${perfColor}`}>{perfLabel}</span>}
              </div>
            </div>
            <div className="shrink-0">
              <DifficultyOrb score={diffForecast} />
            </div>
          </div>
          {execBriefing && (
            <p className="text-sm text-slate-300 leading-relaxed mt-4 border-t border-white/[0.05] pt-4">{execBriefing}</p>
          )}
        </div>

        {/* Context strip */}
        {(meta?.keyAnnouncements || meta?.knownSensitivities) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
            {meta.keyAnnouncements && (
              <div className="bg-[#060810] px-5 py-3">
                <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wider">Key Announcements</p>
                <p className="text-xs text-slate-400 leading-relaxed">{meta.keyAnnouncements}</p>
              </div>
            )}
            {meta.knownSensitivities && (
              <div className="bg-[#060810] px-5 py-3">
                <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wider">Known Sensitivities</p>
                <p className="text-xs text-slate-400 leading-relaxed">{meta.knownSensitivities}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Concerns + Communication Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Predicted Investor Concern Areas</h3>
          </div>
          {topConcerns.length === 0 ? (
            <p className="text-slate-700 text-sm">No concerns predicted</p>
          ) : (
            <div className="space-y-2">
              {topConcerns.map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-amber-500/[0.04] border border-amber-500/10 rounded-xl">
                  <span className="text-xs font-bold text-amber-500/50 tabular-nums w-5 shrink-0 text-center">#{i+1}</span>
                  <span className="text-sm text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Communication Preparation Tips</h3>
          </div>
          {commTips.length === 0 ? (
            <p className="text-slate-700 text-sm">No tips generated</p>
          ) : (
            <div className="space-y-2">
              {commTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-sky-500/[0.04] border border-sky-500/10 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Predicted Questions */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Predicted Investor Questions</h3>
          <span className="text-xs text-slate-600 ml-auto">Based on sector patterns and financial context</span>
        </div>
        {predictedQs.length === 0 ? (
          <p className="text-slate-700 text-sm text-center py-8">No questions predicted</p>
        ) : (
          <div className="space-y-3">
            {predictedQs.map((q: any, i: number) => {
              const d = Number(q.difficulty ?? 5);
              const dColor = d >= 7 ? "text-red-400 bg-red-400/10 border-red-400/20" :
                d >= 4.5 ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
              return (
                <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${dColor}`}>{d.toFixed(1)}</span>
                      <span className="text-[9px] text-slate-700">difficulty</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed font-medium">"{q.question}"</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {q.topic && <span className="text-[10px] text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">{q.topic}</span>}
                        {q.rationale && <span className="text-[10px] text-slate-600 italic">{q.rationale}</span>}
                      </div>
                      {q.suggested_response_approach && (
                        <div className="mt-2 flex items-start gap-2 p-2 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-lg">
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-emerald-300/80 leading-relaxed">{q.suggested_response_approach}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Risk Areas */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">High-Risk Disclosure Areas</h3>
          <span className="text-xs text-slate-600 ml-auto">Topics requiring careful preparation</span>
        </div>
        {riskAreas.length === 0 ? (
          <p className="text-slate-700 text-sm text-center py-8">No risk areas identified</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {riskAreas.map((r: any, i: number) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{r.topic}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_COLORS[r.risk_level] ?? RISK_COLORS.medium}`}>{r.risk_level}</span>
                </div>
                {r.description && <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>}
                {(r.talking_points ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">Talking Points</p>
                    {r.talking_points.map((tp: string, j: number) => (
                      <div key={j} className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-sky-400/60 shrink-0 mt-1.5" />
                        <p className="text-xs text-slate-400 leading-relaxed">{tp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Zap className="w-3 h-3 text-sky-400" />
          </div>
          <span className="text-xs text-slate-700 font-medium">Powered by CuraLive Pre-Event Intelligence</span>
        </div>
        <span className="text-xs text-slate-800 font-mono">CONFIDENTIAL — INTERNAL USE ONLY</span>
      </div>
    </div>
  );
}

function GenerateForm({ onGenerated }: { onGenerated: (r: any) => void }) {
  const [form, setForm] = useState({
    eventName: "", companyName: "", sector: "", eventType: "earnings_call",
    eventQuarter: "", financialPerformance: "mixed" as any,
    keyAnnouncements: "", knownSensitivities: "",
  });
  const generate = trpc.callPrep.generate.useMutation({
    onSuccess: (data) => onGenerated(data),
    onError: (e) => toast.error(e.message),
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Generate Pre-Event Intelligence Briefing</h3>
        </div>

        {/* Core fields */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Event Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Event Name <span className="text-red-400">*</span></label>
              <input value={form.eventName} onChange={e => set("eventName", e.target.value)} placeholder="e.g. Q1 2026 Earnings Call" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-sky-400/40" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Company (optional)</label>
              <input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="e.g. Acme Corp" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-sky-400/40" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sector</label>
              <select value={form.sector} onChange={e => set("sector", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400/40">
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
              <select value={form.eventType} onChange={e => set("eventType", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400/40">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quarter</label>
              <select value={form.eventQuarter} onChange={e => set("eventQuarter", e.target.value)} className="w-full bg-[#0e1119] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400/40">
                <option value="">Select quarter</option>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Financial performance */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Financial Performance Context</p>
          <div className="flex flex-wrap gap-2">
            {PERF_OPTIONS.map(p => (
              <button
                key={p.value}
                onClick={() => set("financialPerformance", p.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  form.financialPerformance === p.value ? p.color : "text-slate-600 border-white/10 hover:border-white/20"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context fields */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Context <span className="text-slate-700 font-normal normal-case">(optional — improves prediction quality significantly)</span></p>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Key Announcements</label>
            <textarea value={form.keyAnnouncements} onChange={e => set("keyAnnouncements", e.target.value)} rows={2} placeholder="e.g. Q1 revenue up 12% YoY; new product line launch; headcount reduction of 8%..." className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-sky-400/40 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Known Sensitive Topics</label>
            <textarea value={form.knownSensitivities} onChange={e => set("knownSensitivities", e.target.value)} rows={2} placeholder="e.g. recent CFO departure; ongoing litigation; below-guidance gross margins..." className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-sky-400/40 resize-none" />
          </div>
        </div>

        <Button onClick={() => { if (!form.eventName.trim()) return toast.error("Event name is required"); generate.mutate({ ...form, eventType: form.eventType as any, financialPerformance: form.financialPerformance as any, companyName: form.companyName || undefined, sector: form.sector || undefined, eventQuarter: form.eventQuarter || undefined, keyAnnouncements: form.keyAnnouncements || undefined, knownSensitivities: form.knownSensitivities || undefined }); }} disabled={generate.isPending} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm h-11 gap-2">
          {generate.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Intelligence Briefing…</> : <><Brain className="w-4 h-4" /> Generate Pre-Event Briefing</>}
        </Button>
      </div>

      {/* What you get */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Target, label: "6 Predicted Questions", desc: "With difficulty score and response guidance", color: "text-violet-400" },
          { icon: AlertTriangle, label: "3 Risk Areas", desc: "High-risk disclosure topics with talking points", color: "text-orange-400" },
          { icon: MessageSquare, label: "Concern Forecast", desc: "Top 5 investor concern areas ranked", color: "text-amber-400" },
          { icon: Lightbulb, label: "Comm. Tips", desc: "Specific preparation guidance for the team", color: "text-sky-400" },
          { icon: Activity, label: "Difficulty Score", desc: "Predicted Q&A pressure level for this event", color: "text-red-400" },
          { icon: BookOpen, label: "Executive Brief", desc: "CEO/CFO-ready pre-event intelligence summary", color: "text-emerald-400" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="flex items-start gap-2.5 p-3 bg-white/[0.015] border border-white/[0.05] rounded-xl">
            <Icon className={`w-3.5 h-3.5 ${color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-xs font-semibold text-slate-300">{label}</p>
              <p className="text-[10px] text-slate-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CallPreparation() {
  const [view, setView] = useState<"list" | "generate" | "briefing">("list");
  const [selected, setSelected] = useState<any>(null);

  const list = trpc.callPrep.list.useQuery();
  const deleteB = trpc.callPrep.delete.useMutation({
    onSuccess: () => { toast.success("Briefing deleted"); list.refetch(); },
    onError: e => toast.error(e.message),
  });

  const handleGenerated = (r: any) => { setSelected(r); setView("briefing"); list.refetch(); };
  const handleOpen = (r: any) => { setSelected(r); setView("briefing"); };

  return (
    <div className="min-h-screen bg-[#060810] text-white">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#060810]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
              <Mic className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">Earnings Call Preparation Intelligence</h1>
                <span className="text-[10px] font-bold tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full uppercase">ECPI</span>
              </div>
              <p className="text-xs text-slate-500">AI-generated pre-event briefings — predicted questions, risk areas, and executive preparation guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view === "list" && (
              <Button onClick={() => setView("generate")} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm h-9 px-4 gap-2">
                <Plus className="w-3.5 h-3.5" /> New Briefing
              </Button>
            )}
            {view !== "list" && (
              <Button variant="outline" onClick={() => setView("list")} className="border-white/10 text-slate-400 hover:text-white text-sm h-9 px-4">
                ← All Briefings
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {view === "generate" && <GenerateForm onGenerated={handleGenerated} />}

        {view === "briefing" && selected && (
          <BriefingView briefing={selected} onBack={() => setView("list")} />
        )}

        {view === "list" && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Briefings Generated", value: list.data?.length ?? 0, icon: FileText, color: "text-sky-400" },
                { label: "Sectors Covered", value: new Set(list.data?.filter((r: any) => r.sector).map((r: any) => r.sector)).size, icon: Building2, color: "text-violet-400" },
                { label: "Avg Difficulty Forecast", value: list.data?.length ? (list.data.reduce((s: number, r: any) => s + Number(r.difficulty_forecast ?? 5), 0) / list.data.length).toFixed(1) : "—", icon: Target, color: "text-amber-400" },
                { label: "High-Risk Events", value: list.data?.filter((r: any) => Number(r.difficulty_forecast) >= 7).length ?? 0, icon: AlertTriangle, color: "text-red-400" },
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

            {/* The 5-feature lock-in context */}
            <div className="bg-gradient-to-r from-sky-500/[0.06] via-violet-500/[0.04] to-transparent border border-sky-500/15 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">The Full Investor Communication Lifecycle</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {[
                      { label: "Prepare", active: true, path: "/call-preparation" },
                      { label: "→", sep: true },
                      { label: "Monitor Live", path: "/shadow-mode" },
                      { label: "→", sep: true },
                      { label: "Post-Event Report", path: "/intelligence-report" },
                      { label: "→", sep: true },
                      { label: "Question Database", path: "/investor-questions" },
                      { label: "→", sep: true },
                      { label: "Benchmark", path: "/benchmarks" },
                    ].map((s, i) => s.sep ? (
                      <span key={i} className="text-slate-700">→</span>
                    ) : (
                      <span key={i} className={`px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-500 bg-white/[0.03] border border-white/[0.06]"}`}>{s.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Briefing cards */}
            {list.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              </div>
            ) : (list.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-white/[0.06] rounded-2xl">
                <Mic className="w-12 h-12 text-slate-800" />
                <div className="text-center">
                  <p className="text-slate-600 font-medium">No briefings generated yet</p>
                  <p className="text-xs text-slate-800 mt-1 max-w-sm">Generate your first pre-event briefing to start the preparation workflow — CuraLive predicts the questions before investors ask them</p>
                </div>
                <Button onClick={() => setView("generate")} className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm h-9 px-5 gap-2">
                  <Brain className="w-4 h-4" /> Generate First Briefing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(list.data ?? []).map((r: any) => {
                  const diff = Number(r.difficulty_forecast ?? 5);
                  const dColor = diff >= 7 ? "text-red-400" : diff >= 4.5 ? "text-amber-400" : "text-emerald-400";
                  const concerns: string[] = (() => { try { return typeof r.top_concerns === "string" ? JSON.parse(r.top_concerns) : r.top_concerns ?? []; } catch { return []; } })();
                  const perfObj = PERF_OPTIONS.find(p => p.value === r.financial_performance);
                  return (
                    <div key={r.id} onClick={() => handleOpen(r)} className="bg-white/[0.02] border border-white/[0.06] hover:border-sky-500/20 transition-colors rounded-2xl overflow-hidden group cursor-pointer">
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start gap-3 justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-slate-700 font-mono">{(r.event_type ?? "").replace(/_/g," ")}</span>
                              {r.event_quarter && <span className="text-[10px] text-slate-700">{r.event_quarter}</span>}
                            </div>
                            <h3 className="text-sm font-semibold text-white leading-tight group-hover:text-sky-300 transition-colors line-clamp-1">{r.event_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {r.company_name && <span className="text-xs text-slate-500">{r.company_name}</span>}
                              {r.sector && <span className="text-xs text-slate-700">{r.sector}</span>}
                              {perfObj && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${perfObj.color}`}>{perfObj.label}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`text-2xl font-black tabular-nums ${dColor}`}>{diff.toFixed(1)}</div>
                            <div className="text-[9px] text-slate-700">difficulty</div>
                          </div>
                        </div>
                      </div>

                      {concerns.length > 0 && (
                        <div className="px-5 pb-3">
                          <p className="text-[10px] text-slate-700 mb-1.5">Top predicted concerns</p>
                          <div className="flex flex-wrap gap-1.5">
                            {concerns.slice(0,4).map((c: string, i: number) => (
                              <span key={i} className="text-[10px] text-amber-400/70 bg-amber-400/[0.06] border border-amber-400/15 px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.executive_briefing && (
                        <p className="text-xs text-slate-600 leading-relaxed px-5 pb-3 line-clamp-2">{r.executive_briefing}</p>
                      )}

                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-sky-500/40" />
                          <span className="text-[10px] text-slate-800">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); deleteB.mutate({ id: r.id }); }} className="text-slate-700 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-sky-400 transition-colors" />
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
