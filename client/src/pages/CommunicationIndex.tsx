import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Activity, Shield,
  Users, LineChart, Brain, Database, Loader2, Zap,
  ArrowUpRight, ArrowDownRight, BarChart3, Award,
  BookOpen, Sparkles, RefreshCw, Globe, CheckCircle2,
} from "lucide-react";

const COMPONENT_CONFIG = [
  {
    key: "communicationQuality",
    label: "Communication Quality",
    desc: "Executive sentiment + confidence scoring across all captured events",
    icon: Brain,
    color: "#818cf8",
    fill: "bg-indigo-400/10",
    border: "border-indigo-400/20",
    textColor: "text-indigo-400",
    weight: "35%",
  },
  {
    key: "investorEngagement",
    label: "Investor Engagement",
    desc: "Proportion of high and medium engagement events across the dataset",
    icon: Users,
    color: "#34d399",
    fill: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    textColor: "text-emerald-400",
    weight: "25%",
  },
  {
    key: "complianceQuality",
    label: "Compliance Quality",
    desc: "Inverse compliance risk score — higher means fewer regulatory flags",
    icon: Shield,
    color: "#f59e0b",
    fill: "bg-amber-400/10",
    border: "border-amber-400/20",
    textColor: "text-amber-400",
    weight: "20%",
  },
  {
    key: "marketConfidence",
    label: "Market Confidence",
    desc: "Proportion of events yielding positive post-event market reactions",
    icon: TrendingUp,
    color: "#60a5fa",
    fill: "bg-blue-400/10",
    border: "border-blue-400/20",
    textColor: "text-blue-400",
    weight: "20%",
  },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 55 ? "#f59e0b" : "#f87171";
  const label = score >= 70 ? "Strong" : score >= 55 ? "Moderate" : "Weak";
  const rotation = ((score / 100) * 180) - 90;

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-52 h-28">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
          opacity="0.9"
        />
        <g transform={`rotate(${rotation}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill={color} />
        </g>
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">{score}</text>
        <text x="100" y="108" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">{label}</text>
      </svg>
      <div className="flex items-center gap-3 text-xs text-slate-600 -mt-1">
        <span>0</span>
        <div className="flex-1 h-px bg-white/10" />
        <span>100</span>
      </div>
    </div>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold tabular-nums text-white w-8 text-right">{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0e1119] border border-white/10 rounded-xl p-3 text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? Math.round(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CommunicationIndex() {
  const [publishing, setPublishing] = useState(false);
  const index = trpc.communicationIndex.getCurrent.useQuery();
  const history = trpc.communicationIndex.getHistory.useQuery();
  const publishSnapshot = trpc.communicationIndex.publishSnapshot.useMutation({
    onSuccess: (data) => {
      toast.success(`CICI ${data.quarter} published — score: ${data.score}`);
      history.refetch();
      setPublishing(false);
    },
    onError: (e) => { toast.error(e.message); setPublishing(false); },
  });

  const d = index.data;
  const historyData = history.data ?? [];

  const cici = d?.ciciScore ?? 0;
  const ciColor = cici >= 70 ? "text-emerald-400" : cici >= 55 ? "text-amber-400" : "text-red-400";
  const CiIcon = cici >= 70 ? TrendingUp : cici >= 55 ? Minus : TrendingDown;

  const eventTypeData = (d?.byEventType ?? []).map((r: any) => ({
    name: r.event_type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "",
    events: Number(r.count ?? 0),
    sentiment: Math.round(Number(r.avg_sentiment ?? 0)),
  })).slice(0, 6);

  const mrByType = (d?.mrByEventType ?? []).map((r: any) => ({
    name: r.event_type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "",
    confidence: Math.round(Number(r.avg_confidence ?? 0)),
    positiveRate: r.count > 0 ? Math.round((Number(r.positive_count ?? 0) / Number(r.count)) * 100) : 0,
  })).slice(0, 5);

  const quarterlyData = (d?.quarterly ?? []).map((r: any) => ({
    quarter: r.event_quarter,
    sentiment: Math.round(Number(r.avg_sentiment ?? 0)),
    events: Number(r.count ?? 0),
  }));

  const historyChartData = historyData.map((s: any) => ({
    quarter: s.quarter,
    cici: Math.round(Number(s.cici_score ?? 0)),
    communication: Math.round(Number(s.communication_quality_score ?? 0)),
    engagement: Math.round(Number(s.investor_engagement_score ?? 0)),
  }));

  const radialData = COMPONENT_CONFIG.map(c => ({
    name: c.label,
    value: d?.[c.key as keyof typeof d] ? Math.round(Number(d[c.key as keyof typeof d])) : 0,
    fill: c.color,
  }));

  return (
    <div className="min-h-screen bg-[#060810] text-white">

      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#060810]/95 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">CuraLive Investor Communication Index</h1>
                <span className="text-[10px] font-bold tracking-widest text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full uppercase">CICI</span>
              </div>
              <p className="text-xs text-slate-500">Proprietary intelligence benchmark for global investor communication quality</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => index.refetch()}
              disabled={index.isFetching}
              className="border-white/10 text-slate-400 hover:text-white text-sm h-9 px-3 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${index.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => { setPublishing(true); publishSnapshot.mutate(); }}
              disabled={publishing || publishSnapshot.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm h-9 px-4 gap-2"
            >
              {publishSnapshot.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Publish Snapshot
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Index banner */}
        <div className="bg-gradient-to-br from-violet-500/[0.08] via-indigo-500/[0.05] to-transparent border border-violet-500/20 rounded-2xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">

            {/* Gauge + score */}
            <div className="flex flex-col items-center gap-2">
              {index.isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                </div>
              ) : (
                <ScoreGauge score={cici} />
              )}
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${ciColor}`}>
                  <CiIcon className="w-4 h-4" />
                  CICI {cici >= 70 ? "Above Average" : cici >= 55 ? "At Average" : "Below Average"}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Live reading · {d?.totalEvents ?? 0} events analysed</p>
              </div>
            </div>

            {/* Component scores */}
            <div className="space-y-3 lg:col-span-2">
              {COMPONENT_CONFIG.map(c => {
                const Icon = c.icon;
                const val = d ? Math.round(Number(d[c.key as keyof typeof d] ?? 0)) : 0;
                return (
                  <div key={c.key} className="grid grid-cols-[140px_1fr_60px] gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${c.fill} border ${c.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3 h-3 ${c.textColor}`} />
                      </div>
                      <span className="text-xs text-slate-400 leading-tight">{c.label}</span>
                    </div>
                    <ScoreBar value={val} color={c.color} />
                    <span className="text-[10px] text-slate-600 text-right">{c.weight}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dataset stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Database, label: "Events in Dataset", value: d?.totalEvents ?? "—", color: "text-violet-400" },
            { icon: Activity, label: "Avg Sentiment Score", value: d?.avgSentiment != null ? `${d.avgSentiment}` : "—", color: "text-emerald-400" },
            { icon: Users, label: "High Engagement Rate", value: d?.highEngPct != null ? `${d.highEngPct}%` : "—", color: "text-blue-400" },
            { icon: Shield, label: "Low Compliance Risk", value: d?.lowRiskPct != null ? `${d.lowRiskPct}%` : "—", color: "text-amber-400" },
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Event type sentiment bar chart */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Sentiment by Event Type</h3>
            </div>
            {eventTypeData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={eventTypeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sentiment" name="Sentiment" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="events" name="Events" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Historical CICI or quarterly sentiment */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">
                {historyChartData.length > 0 ? "CICI Historical Trend" : "Quarterly Sentiment Trend"}
              </h3>
              {historyChartData.length === 0 && <span className="text-xs text-slate-600 ml-auto">Publish a snapshot to start tracking</span>}
            </div>
            {historyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={historyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="ciciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cici" name="CICI" stroke="#818cf8" fill="url(#ciciGrad)" strokeWidth={2} dot={{ r: 3, fill: "#818cf8" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : quarterlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={quarterlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sentiment" name="Sentiment" stroke="#34d399" fill="url(#sentGrad)" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-700 text-sm">No quarterly data yet</div>
            )}
          </div>
        </div>

        {/* Market confidence by event type + Published snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Market confidence */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Market Confidence by Event Type</h3>
            </div>
            {mrByType.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-slate-700 text-sm">No market data yet</p>
                <p className="text-xs text-slate-800 mt-1">Add events in Market Reaction Intelligence to populate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mrByType.map((r: any) => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{r.name}</span>
                      <span className="text-blue-400 font-semibold">{r.positiveRate}% positive</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.positiveRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published snapshots */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Published Index History</h3>
            </div>
            {historyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Globe className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-slate-700 text-sm">No snapshots published yet</p>
                <p className="text-xs text-slate-800 mt-1">Click "Publish Snapshot" to record this quarter's reading</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historyData.slice(0, 6).map((s: any) => {
                  const score = Math.round(Number(s.cici_score));
                  const color = score >= 70 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";
                  const bg = score >= 70 ? "bg-emerald-400/10" : score >= 55 ? "bg-amber-400/10" : "bg-red-400/10";
                  return (
                    <div key={s.id} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <div className={`text-lg font-bold tabular-nums ${color} ${bg} px-2 py-1 rounded-lg min-w-[52px] text-center`}>{score}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{s.quarter}</span>
                          <CheckCircle2 className="w-3 h-3 text-violet-400" />
                        </div>
                        {s.ai_commentary ? (
                          <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2 mt-0.5">{s.ai_commentary}</p>
                        ) : (
                          <p className="text-[10px] text-slate-600 mt-0.5">{s.total_events} events · {Math.round(Number(s.high_engagement_pct ?? 0))}% high engagement</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-violet-400/60" />
            <h3 className="text-sm font-medium text-slate-400">Index Methodology</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                The <strong className="text-slate-300">CuraLive Investor Communication Index (CICI)</strong> is a composite score computed from four weighted sub-indices, each derived from real-time signals captured during and after investor events across the CuraLive platform.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                All input data is anonymized and aggregated. No individual company data is disclosed in the index. The CICI is updated in real time and published quarterly as a named snapshot.
              </p>
            </div>
            <div className="space-y-2">
              {COMPONENT_CONFIG.map(c => (
                <div key={c.key} className="flex items-start gap-2">
                  <span className={`text-[10px] font-bold ${c.textColor} ${c.fill} border ${c.border} px-1.5 py-0.5 rounded shrink-0 mt-0.5`}>{c.weight}</span>
                  <div>
                    <span className="text-xs text-slate-300 font-medium">{c.label}</span>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
