import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Tag, TrendingUp, TrendingDown, AlertTriangle,
  Shield, Zap, Users, MessageSquare, Activity, BarChart3,
  ChevronDown, ChevronUp, RefreshCw, Filter
} from "lucide-react";

const TAG_ICONS: Record<string, React.ElementType> = {
  sentiment: TrendingUp,
  compliance: Shield,
  scaling: Activity,
  engagement: Users,
  qa: MessageSquare,
  intervention: Zap,
};

const TAG_COLORS: Record<string, string> = {
  sentiment: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  compliance: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  scaling: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  engagement: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  qa: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  intervention: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  neutral: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  negative: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

const SEVERITY_DOT: Record<string, string> = {
  positive: "bg-emerald-400",
  neutral: "bg-slate-400",
  negative: "bg-rose-400",
  critical: "bg-red-500 animate-pulse",
};

export default function TaggedMetricsDashboard() {
  const goBack = useSmartBack("/operator-links");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const stats = trpc.taggedMetrics.getStats.useQuery();
  const events = trpc.taggedMetrics.getEvents.useQuery();
  const recent = trpc.taggedMetrics.getRecent.useQuery({ limit: 100 });
  const byEvent = trpc.taggedMetrics.getByEvent.useQuery(
    { eventId: selectedEvent },
    { enabled: selectedEvent !== "all" }
  );

  const rows = selectedEvent === "all"
    ? (recent.data ?? [])
    : (byEvent.data ?? []);

  const filtered = selectedTag === "all"
    ? rows
    : rows.filter(r => r.tagType === selectedTag);

  const s = stats.data;
  const isLoading = stats.isLoading || recent.isLoading;

  const statCards = [
    { label: "Total Tags", value: s?.total ?? 0, icon: Tag, color: "text-violet-400" },
    { label: "Events Tracked", value: s?.uniqueEvents ?? 0, icon: BarChart3, color: "text-blue-400" },
    { label: "Avg Sentiment", value: s?.avgSentiment != null ? `${s.avgSentiment}%` : "—", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Critical Flags", value: s?.criticalCount ?? 0, icon: AlertTriangle, color: "text-red-400" },
  ];

  const tagBreakdown = Object.entries(s?.byType ?? {}).sort((a, b) => b[1] - a[1]);
  const total = s?.total ?? 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={goBack}
              className="text-slate-400 hover:text-white gap-2 px-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-violet-400" />
                <h1 className="text-lg font-semibold">Tagged Metrics Dashboard</h1>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                Live Intelligence Database
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">Data Asset</div>
              <div className="text-xs font-mono text-violet-300">{s?.total ?? 0} tagged events stored</div>
            </div>
            <Button variant="ghost" size="sm"
              onClick={() => { stats.refetch(); recent.refetch(); events.refetch(); toast.success("Dashboard refreshed"); }}
              className="text-slate-400 hover:text-white gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
                <div className="text-xs text-slate-500 mt-1">{c.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tag Breakdown + Severity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Tag type breakdown */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Tag Type Distribution
            </h2>
            <div className="space-y-3">
              {tagBreakdown.length === 0 && <div className="text-slate-500 text-sm">No data yet</div>}
              {tagBreakdown.map(([type, count]) => {
                const pct = Math.round((count / total) * 100);
                const Icon = TAG_ICONS[type] ?? Tag;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm capitalize text-slate-300">{type}</span>
                      </div>
                      <span className="text-xs text-slate-500">{count} tags · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" /> Severity Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(["positive", "neutral", "negative", "critical"] as const).map(sev => {
                const count = s?.bySeverity?.[sev] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={sev} className={`rounded-xl border p-4 ${SEVERITY_COLORS[sev]}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide capitalize">{sev}</span>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs opacity-70">{pct}% of total</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events per-event summary */}
        {s && Object.keys(s.byEvent).length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Events in Database
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(s.byEvent).map(([id, ev]) => (
                <button
                  key={id}
                  onClick={() => { setSelectedEvent(id === selectedEvent ? "all" : id); }}
                  className={`text-left p-4 rounded-xl border transition-all ${selectedEvent === id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                >
                  <div className="text-sm font-medium text-slate-200 mb-1">{ev.title}</div>
                  <div className="text-xs text-slate-500 font-mono">{id}</div>
                  <div className="mt-2 text-xs text-violet-300 font-semibold">{ev.count} tags recorded</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tagged Metrics Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-400" />
              Tagged Intelligence Records
              <span className="ml-1 text-slate-500 font-normal">({filtered.length})</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              {["all", "sentiment", "compliance", "scaling", "engagement", "qa", "intervention"].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all capitalize ${selectedTag === t
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                >
                  {t}
                </button>
              ))}
              {selectedEvent !== "all" && (
                <button
                  onClick={() => setSelectedEvent("all")}
                  className="px-3 py-1 rounded-full text-xs border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
                >
                  ✕ {selectedEvent}
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading intelligence data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No records match your filters</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(row => {
                const Icon = TAG_ICONS[row.tagType] ?? Tag;
                const isExpanded = expandedRow === row.id;
                return (
                  <div key={row.id}
                    className="px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border shrink-0 ${TAG_COLORS[row.tagType]}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-200">{row.label ?? row.tagType}</span>
                            <Badge className={`text-xs border ${SEVERITY_COLORS[row.severity]} px-1.5 py-0`}>
                              {row.severity}
                            </Badge>
                            <span className="text-xs text-slate-600 capitalize border border-white/10 rounded px-1.5 py-0.5">{row.tagType}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{row.eventTitle ?? row.eventId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-lg font-bold text-slate-200">{row.metricValue}</div>
                          <div className="text-xs text-slate-600">value</div>
                        </div>
                        <div className="text-xs text-slate-600 hidden md:block">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 ml-11 space-y-2 text-sm">
                        {row.detail && (
                          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 text-slate-400">
                            {row.detail}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          {row.bundle && <span><span className="text-slate-600">Bundle:</span> {row.bundle}</span>}
                          {row.source && <span><span className="text-slate-600">Source:</span> {row.source}</span>}
                          <span><span className="text-slate-600">Event ID:</span> {row.eventId}</span>
                          <span><span className="text-slate-600">Recorded:</span> {new Date(row.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data asset note */}
        <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-5 flex items-start gap-3">
          <Tag className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-violet-300 mb-1">This is your data moat</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every tag stored here is a structured intelligence record that no competitor can replicate. As you run more live events, this database compounds — building a proprietary dataset of investor sentiment patterns, compliance signals, and engagement dynamics that becomes more valuable with every row added.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
