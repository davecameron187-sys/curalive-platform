// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Activity, Shield,
  MessageSquare, Globe, BarChart3, Target, Zap, Database,
  AlertTriangle, Brain, Users, Building2, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight, ChevronRight,
  LineChart as LineChartIcon, Loader2,
} from "lucide-react";

const TOPIC_LABELS: Record<string, string> = {
  revenue_guidance: "Revenue Guidance", margin_pressure: "Margin Pressure",
  supply_chain: "Supply Chain", ai_infrastructure: "AI Infrastructure",
  capital_allocation: "Capital Allocation", esg: "ESG", governance: "Governance",
  debt_leverage: "Debt & Leverage", growth_strategy: "Growth Strategy",
  market_conditions: "Market Conditions", management: "Management",
  competition: "Competition", regulatory: "Regulatory", other: "Other",
};

const TOPIC_COLORS: Record<string, string> = {
  revenue_guidance: "#818cf8", margin_pressure: "#f87171", supply_chain: "#fb923c",
  ai_infrastructure: "#a78bfa", capital_allocation: "#60a5fa", esg: "#34d399",
  governance: "#f59e0b", debt_leverage: "#94a3b8", growth_strategy: "#2dd4bf",
  market_conditions: "#e879f9", management: "#facc15", competition: "#f472b6",
  regulatory: "#c084fc", other: "#475569",
};

const SECTION_TABS = [
  { id: "concerns", label: "Concern Intelligence", icon: MessageSquare },
  { id: "signals", label: "Market Signals", icon: TrendingUp },
  { id: "benchmarks", label: "Exec Benchmarks", icon: BarChart3 },
  { id: "cici", label: "CICI Index", icon: Activity },
];

function Tick({ val, suffix = "" }: { val: number | null | undefined; suffix?: string }) {
  if (val == null) return <span className="text-slate-700">—</span>;
  return <span>{Math.round(Number(val))}{suffix}</span>;
}

function ReactTag({ reaction }: { reaction: string }) {
  if (reaction === "positive") return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full"><TrendingUp className="w-2.5 h-2.5" />Positive</span>;
  if (reaction === "negative") return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full"><TrendingDown className="w-2.5 h-2.5" />Negative</span>;
  return <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-full"><Minus className="w-2.5 h-2.5" />Neutral</span>;
}

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0d13] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function IntelligenceTerminal() {
  const [section, setSection] = useState("concerns");
  const [filterQuarter, setFilterQuarter] = useState("");
  const [filterSector, setFilterSector] = useState("");

  const overview = trpc.intelligenceTerminal.getOverview.useQuery();
  const concerns = trpc.intelligenceTerminal.getGlobalConcerns.useQuery({ quarter: filterQuarter || undefined, sector: filterSector || undefined });
  const signals = trpc.intelligenceTerminal.getMarketSignals.useQuery();
  const benchmarks = trpc.intelligenceTerminal.getExecBenchmarks.useQuery();
  const sectors = trpc.intelligenceTerminal.getSectors.useQuery();
  const quarters = trpc.intelligenceTerminal.getQuarters.useQuery();

  const ov = overview.data;
  const gc = concerns.data;
  const ms = signals.data;
  const bm = benchmarks.data;

  const topConcerns = (gc?.global ?? []).slice(0, 10);
  const concernBarData = topConcerns.map((r: any) => ({
    name: r.label?.split(" ").slice(0, 2).join(" ") ?? r.topic_category,
    full: r.label,
    category: r.topic_category,
    frequency: Number(r.frequency),
    difficulty: Number(r.avg_difficulty ?? 0),
    avoidance: Number(r.avoidance_rate ?? 0),
  }));

  const mrByTopic = (ms?.byTopic ?? []).map((r: any) => ({
    name: (r.topic_tag ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 18),
    positive_rate: Number(r.positive_rate ?? 0),
    events: Number(r.events ?? 0),
    confidence: Number(r.avg_confidence ?? 0),
  })).filter(r => r.events > 0);

  const mrBySector = (ms?.bySector ?? []).map((r: any) => ({
    name: r.sector,
    positive_rate: Number(r.positive_rate ?? 0),
    events: Number(r.events ?? 0),
    sentiment: Number(r.avg_sentiment ?? 0),
  }));

  const ciciHistory = (bm?.ciciHistory ?? []).map((r: any) => ({
    quarter: r.quarter,
    cici: Math.round(Number(r.cici_score ?? 0)),
    communication: Math.round(Number(r.communication_quality_score ?? 0)),
    engagement: Math.round(Number(r.investor_engagement_score ?? 0)),
    compliance: Math.round(Number(r.compliance_quality_score ?? 0)),
  }));

  const diffBySector = (bm?.diffBySector ?? []).map((r: any) => ({
    name: r.sector,
    difficulty: Number(r.avg_difficulty ?? 0),
    avoidance: Number(r.avoidance_rate ?? 0),
    questions: Number(r.questions ?? 0),
  }));

  const execBySector = (bm?.bySector ?? []).map((r: any) => ({
    name: r.sector,
    sentiment: Number(r.avg_sentiment ?? 0),
    compliance: Number(r.avg_compliance_score ?? 0),
    engagement: Number(r.high_engagement_rate ?? 0),
    events: Number(r.events ?? 0),
  }));

  const noData = !overview.isLoading && Number(ov?.total_questions ?? 0) === 0 && Number(ov?.mr_events ?? 0) === 0;

  return (
    <div className="min-h-screen bg-[#040608] text-white font-mono">

      {/* Terminal header */}
      <div className="border-b border-emerald-500/20 bg-[#040608]/98 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">LIVE</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">CuraLive Intelligence Terminal</span>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-sm uppercase">CIT</span>
              </div>
              <p className="text-[10px] text-slate-600">Investor Communication Intelligence · Financial Professional Edition</p>
            </div>
          </div>

          {/* Platform scale ticker */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2">
            {[
              { label: "QUESTIONS", value: Number(ov?.total_questions ?? 0).toLocaleString() },
              { label: "MR EVENTS", value: Number(ov?.mr_events ?? 0) },
              { label: "REPORTS", value: Number(ov?.reports_generated ?? 0) },
              { label: "BRIEFINGS", value: Number(ov?.briefings_generated ?? 0) },
              { label: "CICI SNAPS", value: Number(ov?.cici_snapshots ?? 0) },
            ].map(({ label, value }, i) => (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <div className="w-px h-3 bg-white/10" />}
                <div className="text-center">
                  <div className="text-[9px] text-slate-700 tracking-widest">{label}</div>
                  <div className="text-emerald-400 font-bold text-xs tabular-nums">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section tabs + filters */}
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 pb-0">
          <div className="flex gap-0">
            {SECTION_TABS.map(t => {
              const Icon = t.icon;
              const active = section === t.id;
              return (
                <button key={t.id} onClick={() => setSection(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold tracking-wide border-b-2 transition-colors uppercase ${
                    active ? "text-emerald-400 border-emerald-400 bg-emerald-400/[0.04]" : "text-slate-600 border-transparent hover:text-slate-400"
                  }`}>
                  <Icon className="w-3 h-3" />{t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-emerald-400/30 font-mono">
              <option value="">ALL QUARTERS</option>
              {(quarters.data ?? []).map((q: string) => <option key={q} value={q}>{q}</option>)}
            </select>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-emerald-400/30 font-mono">
              <option value="">ALL SECTORS</option>
              {(sectors.data ?? []).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-5 space-y-4">

        {/* Empty state */}
        {noData && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-emerald-500/15 rounded-xl">
            <Database className="w-10 h-10 text-slate-800" />
            <div className="text-center">
              <p className="text-slate-600 text-sm font-mono">DATASET INITIALISING</p>
              <p className="text-xs text-slate-800 mt-1">Log investor questions, market reactions, and events to populate the intelligence terminal</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-700">
              <span>→ /investor-questions</span>
              <span>→ /market-reaction</span>
              <span>→ /shadow-mode</span>
            </div>
          </div>
        )}

        {/* ── CONCERN INTELLIGENCE ── */}
        {section === "concerns" && (
          <div className="space-y-4">

            {/* Top concern bar chart */}
            <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">Global Investor Concern Frequency</span>
                <span className="text-[10px] text-slate-700 ml-auto">{filterQuarter || "All quarters"} · {filterSector || "All sectors"}</span>
              </div>
              <p className="text-[10px] text-slate-700 mb-4">Topics investors have raised most frequently across all captured events</p>
              {concernBarData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-800 text-xs">NO DATA · LOG QUESTIONS TO POPULATE</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={concernBarData} margin={{ top: 4, right: 4, bottom: 30, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="frequency" name="Frequency" radius={[2, 2, 0, 0]}>
                      {concernBarData.map((entry: any, i: number) => (
                        <Cell key={i} fill={TOPIC_COLORS[entry.category] ?? "#475569"} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Concern intelligence table */}
            <div className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-amber-400 uppercase">Topic Intelligence Matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["RANK","CONCERN TOPIC","FREQUENCY","AVG DIFFICULTY","AVOIDANCE RATE","NEGATIVE SENTIMENT"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-[9px] text-slate-700 tracking-wider font-bold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topConcerns.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-800">NO DATA</td></tr>
                    ) : topConcerns.map((r: any, i: number) => {
                      const dColor = Number(r.avg_difficulty) >= 7 ? "text-red-400" : Number(r.avg_difficulty) >= 4.5 ? "text-amber-400" : "text-emerald-400";
                      const aColor = Number(r.avoidance_rate) >= 30 ? "text-red-400" : Number(r.avoidance_rate) >= 15 ? "text-amber-400" : "text-slate-500";
                      return (
                        <tr key={r.topic_category} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 text-slate-700">#{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: TOPIC_COLORS[r.topic_category] ?? "#475569" }} />
                              <span className="text-slate-300 font-bold">{r.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-white font-bold tabular-nums">{r.frequency}</td>
                          <td className={`px-4 py-2.5 font-bold tabular-nums ${dColor}`}>{Number(r.avg_difficulty).toFixed(1)}</td>
                          <td className={`px-4 py-2.5 font-bold tabular-nums ${aColor}`}>{Number(r.avoidance_rate).toFixed(1)}%</td>
                          <td className="px-4 py-2.5 text-slate-400 tabular-nums">{Number(r.negative_sentiment_pct).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MARKET SIGNALS ── */}
        {section === "signals" && (
          <div className="space-y-4">

            {/* Avoidance signal */}
            {ms?.avoidanceSignal && Number(ms.avoidanceSignal.total_avoidance_events) > 0 && (
              <div className="bg-gradient-to-r from-red-500/[0.06] to-transparent border border-red-500/15 rounded-xl p-4 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400 mb-0.5">AVOIDANCE → NEGATIVE REACTION SIGNAL</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When executives avoided investor questions, negative post-event market reactions occurred in{" "}
                    <span className="text-red-300 font-bold">{Number(ms.avoidanceSignal.avoidance_negative_rate ?? 0).toFixed(1)}%</span> of correlated events.
                    Dataset: <span className="text-slate-300">{ms.avoidanceSignal.total_avoidance_events} avoidance events</span> captured.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Market reaction by communication topic */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">Positive Reaction Rate by Topic</span>
                </div>
                <p className="text-[10px] text-slate-700 mb-4">Communication topics correlated with positive post-event market outcomes</p>
                {mrByTopic.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-800 text-xs">NO DATA · ADD MARKET REACTION EVENTS</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mrByTopic} layout="vertical" margin={{ top: 0, right: 50, bottom: 0, left: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="positive_rate" name="Positive Rate %" radius={[0, 2, 2, 0]}>
                        {mrByTopic.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.positive_rate >= 60 ? "#34d399" : entry.positive_rate >= 40 ? "#f59e0b" : "#f87171"} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Sector market reaction */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-blue-400 uppercase">Positive Outcome Rate by Sector</span>
                </div>
                <p className="text-[10px] text-slate-700 mb-4">Sectors ranked by historical post-event positive market reaction rate</p>
                {mrBySector.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-800 text-xs">NO DATA</div>
                ) : (
                  <div className="space-y-2">
                    {mrBySector.map((r: any) => {
                      const color = r.positive_rate >= 60 ? "#34d399" : r.positive_rate >= 40 ? "#f59e0b" : "#f87171";
                      return (
                        <div key={r.name}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400 font-mono">{r.name}</span>
                            <span className="font-bold tabular-nums" style={{ color }}>{r.positive_rate.toFixed(1)}% <span className="text-slate-700 font-normal">({r.events} events)</span></span>
                          </div>
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.positive_rate}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent events feed */}
            <div className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-violet-400 uppercase">Recent Market Reaction Events</span>
              </div>
              {(ms?.recent ?? []).length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-800 text-xs">NO EVENTS CAPTURED</div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {(ms?.recent ?? []).map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.015] transition-colors">
                      <ReactTag reaction={r.post_event_reaction} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-mono truncate">{r.event_name ?? r.event_type?.replace(/_/g," ")}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.sector && <span className="text-[10px] text-slate-700">{r.sector}</span>}
                          {r.event_quarter && <span className="text-[10px] text-slate-700">{r.event_quarter}</span>}
                          {r.topic_tag && <span className="text-[10px] text-violet-400/60">{r.topic_tag.replace(/_/g," ")}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-300 tabular-nums">{Number(r.prediction_confidence ?? 0).toFixed(0)}%</div>
                        <div className="text-[9px] text-slate-700">confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXEC BENCHMARKS ── */}
        {section === "benchmarks" && (
          <div className="space-y-4">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Q&A difficulty by sector */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-amber-400 uppercase">Q&A Difficulty by Sector</span>
                </div>
                <p className="text-[10px] text-slate-700 mb-4">Average investor question difficulty score and avoidance rate by industry</p>
                {diffBySector.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-800 text-xs">NO DATA</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={diffBySector.slice(0, 8)} margin={{ top: 4, right: 4, bottom: 24, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="difficulty" name="Avg Difficulty" fill="#f59e0b" radius={[2, 2, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Comm quality by sector */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-violet-400 uppercase">Communication Quality by Sector</span>
                </div>
                <p className="text-[10px] text-slate-700 mb-4">Sentiment, compliance, and high-engagement rate benchmarks across industries</p>
                {execBySector.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-800 text-xs">NO DATA</div>
                ) : (
                  <div className="space-y-3">
                    {execBySector.slice(0, 6).map((r: any) => (
                      <div key={r.name} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-300 font-bold">{r.name}</span>
                          <span className="text-[10px] text-slate-700">{r.events} events</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: "SENTIMENT", value: r.sentiment, color: "#34d399" },
                            { label: "COMPLIANCE", value: r.compliance, color: "#60a5fa" },
                            { label: "ENGAGEMENT", value: r.engagement, color: "#a78bfa" },
                          ].map(({ label, value, color }) => (
                            <div key={label}>
                              <div className="text-base font-black tabular-nums" style={{ color }}>{Math.round(value)}</div>
                              <div className="text-[8px] text-slate-700 tracking-wider">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Diff table */}
            {diffBySector.length > 0 && (
              <div className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-amber-400 uppercase">Sector Pressure Index</span>
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["SECTOR","QUESTIONS","AVG DIFFICULTY","AVOIDANCE RATE","PRESSURE LEVEL"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-[9px] text-slate-700 tracking-wider font-bold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diffBySector.map((r: any) => {
                      const d = Number(r.difficulty);
                      const dColor = d >= 7 ? "text-red-400" : d >= 4.5 ? "text-amber-400" : "text-emerald-400";
                      const level = d >= 7 ? "HIGH PRESSURE" : d >= 4.5 ? "MODERATE" : "MANAGEABLE";
                      const lvlColor = d >= 7 ? "text-red-400 border-red-400/20 bg-red-400/10" : d >= 4.5 ? "text-amber-400 border-amber-400/20 bg-amber-400/10" : "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";
                      return (
                        <tr key={r.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-slate-300 font-bold">{r.name}</td>
                          <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.questions}</td>
                          <td className={`px-4 py-2.5 font-bold tabular-nums ${dColor}`}>{d.toFixed(1)}/10</td>
                          <td className="px-4 py-2.5 text-slate-400 tabular-nums">{Number(r.avoidance).toFixed(1)}%</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider ${lvlColor}`}>{level}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CICI INDEX ── */}
        {section === "cici" && (
          <div className="space-y-4">

            {ciciHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-emerald-500/15 rounded-xl">
                <Activity className="w-8 h-8 text-slate-800" />
                <p className="text-slate-700 text-xs font-mono">NO CICI SNAPSHOTS PUBLISHED · VISIT /COMMUNICATION-INDEX TO PUBLISH</p>
              </div>
            ) : (
              <>
                {/* CICI trend */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">CICI — CuraLive Investor Communication Index</span>
                    <span className="text-[10px] text-slate-700 ml-auto">Historical quarterly trend</span>
                  </div>
                  <p className="text-[10px] text-slate-700 mb-4">Composite index tracking global investor communication quality across four weighted sub-indices</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={ciciHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="ciciGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="quarter" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TT />} />
                      <Area type="monotone" dataKey="cici" name="CICI" stroke="#34d399" fill="url(#ciciGrad)" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} />
                      <Line type="monotone" dataKey="communication" name="Communication" stroke="#818cf8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#60a5fa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* CICI history table */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">Published CICI Snapshots</span>
                  </div>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["QUARTER","CICI SCORE","COMMUNICATION","ENGAGEMENT","COMPLIANCE","EVENTS"].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-[9px] text-slate-700 tracking-wider font-bold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ciciHistory.slice().reverse().map((r: any) => {
                        const s = Number(r.cici);
                        const color = s >= 70 ? "text-emerald-400" : s >= 55 ? "text-amber-400" : "text-red-400";
                        return (
                          <tr key={r.quarter} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-slate-300 font-bold">{r.quarter}</td>
                            <td className={`px-4 py-2.5 font-black tabular-nums text-base ${color}`}>{r.cici}</td>
                            <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.communication}</td>
                            <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.engagement}</td>
                            <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.compliance}</td>
                            <td className="px-4 py-2.5 text-slate-600 tabular-nums">—</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Terminal footer */}
        <div className="flex items-center justify-between pt-2 pb-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-emerald-400/40" />
            <span className="text-[10px] text-slate-800 font-mono tracking-wider">CURALIVE INTELLIGENCE TERMINAL · FINANCIAL PROFESSIONAL EDITION</span>
          </div>
          <span className="text-[10px] text-slate-900 font-mono">NOT INVESTMENT ADVICE · FOR ANALYTICAL USE ONLY</span>
        </div>
      </div>
    </div>
  );
}
