import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Brain,
  Activity, AlertTriangle, Loader2, Plus, CheckCircle2,
  Zap, LineChart, Target, Database, Eye, Trash2,
  ChevronUp, ChevronDown, ArrowRight, Sparkles, Shield,
  Clock, FileText, Building2,
} from "lucide-react";

const REACTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  strongly_positive: { label: "Strongly Positive", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: ChevronUp },
  positive:          { label: "Positive",          color: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/30",   icon: TrendingUp },
  neutral:           { label: "Neutral",            color: "text-slate-400",   bg: "bg-slate-400/10",   border: "border-slate-400/30",   icon: Minus },
  negative:          { label: "Negative",           color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/30",     icon: TrendingDown },
  strongly_negative: { label: "Strongly Negative",  color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/30",    icon: ChevronDown },
};

const EVENT_TYPE_OPTIONS = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "agm", label: "AGM" },
  { value: "capital_markets_day", label: "Capital Markets Day" },
  { value: "ceo_town_hall", label: "CEO Town Hall" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "webcast", label: "Webcast" },
  { value: "other", label: "Other" },
];

const REACTION_OPTIONS = [
  { value: "strongly_positive", label: "Strongly Positive (+5%+)" },
  { value: "positive", label: "Positive (+1% to +5%)" },
  { value: "neutral", label: "Neutral (±1%)" },
  { value: "negative", label: "Negative (-1% to -5%)" },
  { value: "strongly_negative", label: "Strongly Negative (-5%+)" },
];

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function CorrelationBar({ label, positiveVal, negativeVal, colorPos = "bg-emerald-500", colorNeg = "bg-red-500" }: {
  label: string; positiveVal: number | null; negativeVal: number | null; colorPos?: string; colorNeg?: string;
}) {
  const pPos = positiveVal != null ? Math.min(100, Math.round(positiveVal)) : null;
  const pNeg = negativeVal != null ? Math.min(100, Math.round(negativeVal)) : null;
  return (
    <div className="space-y-1">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
            <span>Positive events</span><span>{pPos != null ? pPos : "—"}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            {pPos != null && <div className={`h-full ${colorPos}`} style={{ width: `${pPos}%` }} />}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
            <span>Negative events</span><span>{pNeg != null ? pNeg : "—"}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            {pNeg != null && <div className={`h-full ${colorNeg}`} style={{ width: `${pNeg}%` }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  companyName: "", ticker: "", eventType: "earnings_call" as const,
  eventDate: "", sentimentScore: "", executiveConfidenceScore: "",
  qaDifficultyScore: "", complianceFlags: "0",
  keyTopics: "", guidanceDiscussed: false, revenueDiscussed: false, marginDiscussed: false,
  pricePreEvent: "", pricePost24h: "", pricePost48h: "", pricePost7d: "",
  marketReaction: "" as any, notes: "",
};

export default function MarketReaction() {
  const [activeTab, setActiveTab] = useState<"insights" | "add" | "records">("insights");
  const [form, setForm] = useState(EMPTY_FORM);
  const [prediction, setPrediction] = useState<{ direction: string; confidence: number; insight: string; dataPoints: number } | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const records = trpc.marketReaction.listRecords.useQuery();
  const stats = trpc.marketReaction.getStats.useQuery();

  const addRecord = trpc.marketReaction.addRecord.useMutation({
    onSuccess: () => {
      toast.success("Event record added — AI insight generated");
      setForm(EMPTY_FORM);
      records.refetch();
      stats.refetch();
      setActiveTab("records");
    },
    onError: (e) => toast.error(e.message),
  });

  const generatePrediction = trpc.marketReaction.generatePrediction.useMutation({
    onSuccess: (data) => {
      setPrediction(data);
      setShowPrediction(true);
    },
    onError: () => toast.error("Could not generate prediction"),
  });

  const deleteRecord = trpc.marketReaction.deleteRecord.useMutation({
    onSuccess: () => {
      toast.success("Record deleted");
      setDeleteId(null);
      records.refetch();
      stats.refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { toast.error("Company name is required"); return; }
    addRecord.mutate({
      companyName: form.companyName,
      ticker: form.ticker || undefined,
      eventType: form.eventType,
      eventDate: form.eventDate || undefined,
      sentimentScore: form.sentimentScore ? Number(form.sentimentScore) : undefined,
      executiveConfidenceScore: form.executiveConfidenceScore ? Number(form.executiveConfidenceScore) : undefined,
      qaDifficultyScore: form.qaDifficultyScore ? Number(form.qaDifficultyScore) : undefined,
      complianceFlags: Number(form.complianceFlags) || 0,
      keyTopics: form.keyTopics || undefined,
      guidanceDiscussed: form.guidanceDiscussed,
      revenueDiscussed: form.revenueDiscussed,
      marginDiscussed: form.marginDiscussed,
      pricePreEvent: form.pricePreEvent ? Number(form.pricePreEvent) : undefined,
      pricePost24h: form.pricePost24h ? Number(form.pricePost24h) : undefined,
      pricePost48h: form.pricePost48h ? Number(form.pricePost48h) : undefined,
      pricePost7d: form.pricePost7d ? Number(form.pricePost7d) : undefined,
      marketReaction: form.marketReaction || undefined,
      notes: form.notes || undefined,
    });
  };

  const handlePredict = () => {
    generatePrediction.mutate({
      sentimentScore: form.sentimentScore ? Number(form.sentimentScore) : undefined,
      executiveConfidenceScore: form.executiveConfidenceScore ? Number(form.executiveConfidenceScore) : undefined,
      qaDifficultyScore: form.qaDifficultyScore ? Number(form.qaDifficultyScore) : undefined,
      complianceFlags: Number(form.complianceFlags) || 0,
      guidanceDiscussed: form.guidanceDiscussed,
      revenueDiscussed: form.revenueDiscussed,
      marginDiscussed: form.marginDiscussed,
      eventType: form.eventType,
      companyName: form.companyName || undefined,
    });
  };

  const s = stats.data;
  const totalEvents = Number(s?.totals?.total_events ?? 0);
  const positiveOutcomes = Number(s?.totals?.positive_outcomes ?? 0);
  const negativeOutcomes = Number(s?.totals?.negative_outcomes ?? 0);
  const positiveRate = totalEvents > 0 ? Math.round((positiveOutcomes / totalEvents) * 100) : 0;

  const predDir = prediction?.direction;
  const predCfg = REACTION_CONFIG[predDir === 'positive' ? 'positive' : predDir === 'negative' ? 'negative' : 'neutral'];

  const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50";
  const labelCls = "text-xs text-slate-400 mb-1.5 block font-medium";

  return (
    <div className="min-h-screen bg-[#07080f] text-white">

      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#07080f]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">Market Reaction Intelligence</h1>
                <span className="text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full uppercase">AI Correlation</span>
              </div>
              <p className="text-xs text-slate-500">Connecting investor event communication signals to market outcomes</p>
            </div>
          </div>
          <Button
            onClick={() => setActiveTab("add")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm h-9 px-4 gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
          {([
            { key: "insights", label: "Correlation Insights", icon: BarChart3 },
            { key: "add", label: "Add Event", icon: Plus },
            { key: "records", label: "Dataset", icon: Database },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === "records" && totalEvents > 0 && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">{totalEvents}</span>
              )}
            </button>
          ))}
        </div>

        {/* Hero stats — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Database} label="Events Analysed" value={totalEvents} sub="in correlation dataset" color="text-indigo-400" />
          <StatCard icon={TrendingUp} label="Positive Outcome Rate" value={totalEvents > 0 ? `${positiveRate}%` : "—"} sub={`${positiveOutcomes} of ${totalEvents} events`} color="text-emerald-400" />
          <StatCard icon={TrendingDown} label="Negative Outcome Rate" value={totalEvents > 0 ? `${Math.round((negativeOutcomes / totalEvents) * 100)}%` : "—"} sub={`${negativeOutcomes} of ${totalEvents} events`} color="text-red-400" />
          <StatCard icon={Activity} label="Avg Sentiment" value={s?.totals?.avg_sentiment != null ? `${Math.round(Number(s.totals.avg_sentiment))}` : "—"} sub="across all events" color="text-amber-400" />
        </div>

        {/* ─── Insights Tab ─── */}
        {activeTab === "insights" && (
          <div className="space-y-4">

            {totalEvents === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
                <LineChart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium mb-1">No correlation data yet</p>
                <p className="text-sm text-slate-600 mb-4">Add investor events with market outcomes to start building the correlation model.</p>
                <Button onClick={() => setActiveTab("add")} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-sm">
                  <Plus className="w-3.5 h-3.5" /> Add First Event
                </Button>
              </div>
            ) : (
              <>
                {/* Correlation signals */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Communication Signal Correlations</h3>
                    <span className="text-xs text-slate-600 ml-auto">{totalEvents} events</span>
                  </div>
                  <div className="space-y-5">
                    <CorrelationBar
                      label="Average Investor Sentiment Score"
                      positiveVal={s?.correlations?.positive_avg_sentiment}
                      negativeVal={s?.correlations?.negative_avg_sentiment}
                    />
                    <CorrelationBar
                      label="Executive Confidence Score"
                      positiveVal={s?.correlations?.positive_avg_confidence}
                      negativeVal={s?.correlations?.negative_avg_confidence}
                    />
                    <CorrelationBar
                      label="Avg Compliance Flags (×10 scaled)"
                      positiveVal={s?.correlations?.positive_avg_flags != null ? Number(s.correlations.positive_avg_flags) * 10 : null}
                      negativeVal={s?.correlations?.negative_avg_flags != null ? Number(s.correlations.negative_avg_flags) * 10 : null}
                      colorPos="bg-amber-500"
                      colorNeg="bg-orange-500"
                    />
                  </div>
                </div>

                {/* Reaction breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">Market Outcome Distribution</h3>
                    </div>
                    <div className="space-y-2">
                      {(s?.byReaction ?? []).map((r: any) => {
                        const cfg = REACTION_CONFIG[r.market_reaction];
                        if (!cfg) return null;
                        const pct = totalEvents > 0 ? Math.round((r.count / totalEvents) * 100) : 0;
                        const Icon = cfg.icon;
                        return (
                          <div key={r.market_reaction} className="flex items-center gap-3">
                            <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                            <span className="text-xs text-slate-400 w-36 shrink-0">{cfg.label}</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${cfg.bg.replace('/10', '')} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${cfg.color} w-8 text-right`}>{r.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">Outcomes by Event Type</h3>
                    </div>
                    <div className="space-y-2">
                      {(s?.byEventType ?? []).slice(0, 6).map((r: any) => {
                        const positiveRate = r.count > 0 ? Math.round((r.positive_count / r.count) * 100) : 0;
                        return (
                          <div key={r.event_type} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-36 shrink-0 capitalize">{r.event_type.replace(/_/g, " ")}</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${positiveRate}%` }} />
                            </div>
                            <span className="text-xs text-indigo-400 tabular-nums w-12 text-right">{positiveRate}% pos</span>
                          </div>
                        );
                      })}
                      {(s?.byEventType ?? []).length === 0 && (
                        <p className="text-xs text-slate-600 py-4 text-center">No data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI insight on dataset */}
                <div className="bg-gradient-to-br from-indigo-500/[0.06] to-indigo-600/[0.03] border border-indigo-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Dataset Intelligence</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This dataset is building CuraLive's proprietary Market Reaction Intelligence model. Each event added improves prediction accuracy. The correlation engine learns which communication signals — sentiment trajectory, executive confidence, compliance risk, and topic patterns — are most predictive of post-event market movement. As the dataset grows, this becomes one of the most defensible assets in the platform.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Add Event Tab ─── */}
        {activeTab === "add" && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Add Investor Event</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Company info */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Company & Event</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className={labelCls}>Ticker Symbol</label>
                      <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                        placeholder="e.g. DANGOTE" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Company Name <span className="text-indigo-400">*</span></label>
                      <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="e.g. Dangote Industries" className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Event Type</label>
                      <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value as any }))} className={inputCls}>
                        {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Event Date</label>
                      <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Key Topics</label>
                      <input value={form.keyTopics} onChange={e => setForm(f => ({ ...f, keyTopics: e.target.value }))}
                        placeholder="e.g. Revenue, Margins, Guidance" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Communication signals */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Communication Signals</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={labelCls}>Sentiment Score <span className="text-slate-600">(0–100)</span></label>
                      <input type="number" min="0" max="100" value={form.sentimentScore}
                        onChange={e => setForm(f => ({ ...f, sentimentScore: e.target.value }))}
                        placeholder="e.g. 72" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Exec Confidence <span className="text-slate-600">(0–100)</span></label>
                      <input type="number" min="0" max="100" value={form.executiveConfidenceScore}
                        onChange={e => setForm(f => ({ ...f, executiveConfidenceScore: e.target.value }))}
                        placeholder="e.g. 68" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Q&A Difficulty <span className="text-slate-600">(0–100)</span></label>
                      <input type="number" min="0" max="100" value={form.qaDifficultyScore}
                        onChange={e => setForm(f => ({ ...f, qaDifficultyScore: e.target.value }))}
                        placeholder="e.g. 55" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Compliance Flags</label>
                      <input type="number" min="0" value={form.complianceFlags}
                        onChange={e => setForm(f => ({ ...f, complianceFlags: e.target.value }))}
                        placeholder="0" className={inputCls} />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 flex-wrap">
                    {([
                      { key: "guidanceDiscussed", label: "Guidance Discussed" },
                      { key: "revenueDiscussed", label: "Revenue Discussed" },
                      { key: "marginDiscussed", label: "Margin Discussed" },
                    ] as const).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded accent-indigo-500" />
                        <span className="text-xs text-slate-400">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Market data */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Market Data <span className="text-slate-700 normal-case font-normal">(optional — add post-event)</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={labelCls}>Pre-Event Price</label>
                      <input type="number" step="0.01" value={form.pricePreEvent}
                        onChange={e => setForm(f => ({ ...f, pricePreEvent: e.target.value }))}
                        placeholder="e.g. 24.50" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Price +24h</label>
                      <input type="number" step="0.01" value={form.pricePost24h}
                        onChange={e => setForm(f => ({ ...f, pricePost24h: e.target.value }))}
                        placeholder="e.g. 25.80" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Price +48h</label>
                      <input type="number" step="0.01" value={form.pricePost48h}
                        onChange={e => setForm(f => ({ ...f, pricePost48h: e.target.value }))}
                        placeholder="e.g. 26.10" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Price +7d</label>
                      <input type="number" step="0.01" value={form.pricePost7d}
                        onChange={e => setForm(f => ({ ...f, pricePost7d: e.target.value }))}
                        placeholder="e.g. 25.40" className={inputCls} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Market Reaction (manual classification)</label>
                    <select value={form.marketReaction} onChange={e => setForm(f => ({ ...f, marketReaction: e.target.value }))} className={`${inputCls} w-64`}>
                      <option value="">— select outcome —</option>
                      {REACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notes <span className="text-slate-600">(optional)</span></label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional context about the event or market reaction" className={inputCls} />
                </div>

                {/* AI Prediction panel */}
                {showPrediction && prediction && (
                  <div className={`border rounded-2xl p-5 ${predCfg?.border} ${predCfg?.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-4 h-4 ${predCfg?.color}`} />
                      <span className="text-sm font-semibold text-white">Market Reaction Prediction</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${predCfg?.border} ${predCfg?.color} ${predCfg?.bg} ml-auto`}>
                        {predCfg?.label} · {prediction.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{prediction.insight}</p>
                    {prediction.dataPoints < 5 && (
                      <p className="text-[10px] text-slate-600 mt-2">Based on {prediction.dataPoints} events — prediction accuracy improves with more data.</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <Button type="submit" disabled={addRecord.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2">
                    {addRecord.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><CheckCircle2 className="w-4 h-4" />Save Event Record</>}
                  </Button>
                  <Button type="button" variant="outline" disabled={generatePrediction.isPending}
                    onClick={handlePredict}
                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2">
                    {generatePrediction.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Predicting...</> : <><Brain className="w-3.5 h-3.5" />Predict Reaction</>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Records Tab ─── */}
        {activeTab === "records" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Correlation Dataset</h3>
              <span className="text-xs text-slate-600">{records.data?.length ?? 0} records</span>
            </div>

            {records.isLoading && (
              <div className="flex items-center justify-center py-16 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading records...
              </div>
            )}

            {!records.isLoading && (records.data ?? []).length === 0 && (
              <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 mb-1">No records yet</p>
                <p className="text-xs text-slate-700 mb-4">Add investor events to start building the correlation model.</p>
                <Button onClick={() => setActiveTab("add")} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-sm">
                  <Plus className="w-3.5 h-3.5" /> Add First Event
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {(records.data ?? []).map((r: any) => {
                const reactionCfg = r.market_reaction ? REACTION_CONFIG[r.market_reaction] : null;
                const ReactionIcon = reactionCfg?.icon ?? Minus;
                const priceDelta = r.price_pre_event && r.price_post_24h
                  ? (((r.price_post_24h - r.price_pre_event) / r.price_pre_event) * 100).toFixed(2)
                  : null;

                return (
                  <div key={r.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {r.ticker && (
                            <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-md">{r.ticker}</span>
                          )}
                          <span className="text-sm font-semibold text-white">{r.company_name}</span>
                          <span className="text-xs text-slate-600 capitalize">{r.event_type?.replace(/_/g, " ")}</span>
                          {r.event_date && <span className="text-xs text-slate-700">{new Date(r.event_date).toLocaleDateString()}</span>}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-xs mt-2">
                          {r.sentiment_score != null && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Activity className="w-3 h-3" /> Sentiment: {Math.round(r.sentiment_score)}
                            </span>
                          )}
                          {r.executive_confidence_score != null && (
                            <span className="flex items-center gap-1 text-violet-400">
                              <Brain className="w-3 h-3" /> Exec: {Math.round(r.executive_confidence_score)}
                            </span>
                          )}
                          {r.compliance_flags > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                              <Shield className="w-3 h-3" /> {r.compliance_flags} flags
                            </span>
                          )}
                          {priceDelta && (
                            <span className={`flex items-center gap-1 font-semibold ${Number(priceDelta) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {Number(priceDelta) >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {priceDelta}% (24h)
                            </span>
                          )}
                        </div>

                        {r.ai_insight && (
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{r.ai_insight}</p>
                        )}
                      </div>

                      <div className="flex items-start gap-2 shrink-0">
                        {reactionCfg && (
                          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${reactionCfg.border} ${reactionCfg.color} ${reactionCfg.bg}`}>
                            <ReactionIcon className="w-3 h-3" />
                            {reactionCfg.label}
                          </span>
                        )}
                        {!reactionCfg && (
                          <span className="text-xs text-slate-600 bg-slate-400/10 border border-slate-400/20 px-2.5 py-1 rounded-full">No outcome yet</span>
                        )}
                        <button
                          onClick={() => deleteId === r.id ? deleteRecord.mutate({ id: r.id }) : setDeleteId(r.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-700 hover:text-red-400 transition-colors"
                          title={deleteId === r.id ? "Click again to confirm" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-indigo-400/60 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">How Market Reaction Intelligence works</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every investor event generates communication signals: sentiment score, executive confidence, compliance risk, Q&A difficulty, and topic patterns. This engine correlates those signals with subsequent stock price movements and market reactions. Over time, the dataset trains a prediction model that can forecast probable market direction before an event ends — giving IR teams, boards, and institutional investors an intelligence edge no other platform offers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
