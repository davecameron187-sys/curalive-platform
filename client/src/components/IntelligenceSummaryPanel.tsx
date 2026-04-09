import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, MessageSquare, Brain, Activity,
  Target, BarChart3, ChevronDown, Loader2, RefreshCw, Download, Clock,
  CheckCircle2, XCircle, SkipForward, Zap, WifiOff, FileText
} from "lucide-react";
import { useState } from "react";

interface Props {
  sessionId?: number;
  organisationId?: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/15 border-red-500/30",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  elevated: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  medium: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  low: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  minimal: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  unknown: "text-slate-400 bg-slate-500/15 border-slate-500/30",
};

const RISK_BG: Record<string, string> = {
  critical: "from-red-500/10 to-transparent",
  high: "from-orange-500/10 to-transparent",
  medium: "from-amber-500/8 to-transparent",
  elevated: "from-amber-500/8 to-transparent",
  low: "from-emerald-500/5 to-transparent",
  minimal: "from-emerald-500/5 to-transparent",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const POSITION_COLORS: Record<string, string> = {
  above_benchmark: "text-emerald-400",
  at_benchmark: "text-slate-400",
  below_benchmark: "text-red-400",
};

export function IntelligenceSummaryPanel({ sessionId, organisationId }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showTrace, setShowTrace] = useState(false);

  const sessionQuery = trpc.unifiedIntelligence.getSessionIntelligence.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, retry: false, staleTime: 60_000 },
  );
  const orgQuery = trpc.unifiedIntelligence.getOrgIntelligence.useQuery(
    { organisationId: organisationId! },
    { enabled: !!organisationId && !sessionId, retry: false, staleTime: 60_000 },
  );

  const query = sessionId ? sessionQuery : orgQuery;
  const data = query.data;

  if (query.isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin mx-auto mb-2" />
        <div className="text-sm text-slate-500">Loading intelligence summary...</div>
      </div>
    );
  }

  if (query.isError || !data) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Brain className="w-4 h-4" />
          <span>Intelligence summary unavailable</span>
        </div>
      </div>
    );
  }

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const riskColor = RISK_COLORS[data.overall_risk.level] ?? RISK_COLORS.unknown;
  const riskBg = RISK_BG[data.overall_risk.level] ?? "";

  const downloadSummary = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intelligence_summary_${data.session_id ?? data.organisation_id ?? "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      key: "risk",
      label: "Overall Risk",
      icon: AlertTriangle,
      badge: data.overall_risk.level.toUpperCase(),
      badgeColor: riskColor,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-2.5 py-1 rounded border ${riskColor}`}>
              {data.overall_risk.level.toUpperCase()}
            </span>
            <span className="text-sm text-slate-400">{(data.overall_risk.score * 100).toFixed(0)}% risk score</span>
          </div>
          <div className="text-xs text-slate-600">Primary source: {data.overall_risk.source}</div>
        </div>
      ),
    },
    {
      key: "sentiment",
      label: "Sentiment",
      icon: Activity,
      badge: `${data.sentiment_summary.overall} (${(data.sentiment_summary.score * 100).toFixed(0)}%)`,
      badgeColor: data.sentiment_summary.score < -0.15
        ? "text-red-400 bg-red-500/15 border-red-500/30"
        : data.sentiment_summary.score > 0.15
        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
        : "text-slate-400 bg-slate-500/15 border-slate-500/30",
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-emerald-400 font-medium">+{data.sentiment_summary.positive_signals} positive</span>
            <span className="text-red-400 font-medium">-{data.sentiment_summary.negative_signals} negative</span>
            <span className="text-slate-500">{data.sentiment_summary.neutral_signals} neutral</span>
          </div>
          {data.sentiment_summary.key_themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.sentiment_summary.key_themes.slice(0, 6).map((t, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">{t}</span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "commitments",
      label: `Key Commitments (${data.key_commitments.length})`,
      icon: Target,
      content: data.key_commitments.length === 0 ? (
        <div className="text-xs text-slate-600">No commitments detected</div>
      ) : (
        <div className="space-y-2">
          {data.key_commitments.slice(0, 5).map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.drift_detected ? "bg-red-500" : "bg-emerald-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-slate-300 leading-relaxed">{c.text}</div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                  {c.speaker && <span>{c.speaker}</span>}
                  <span className="text-slate-700">|</span>
                  <span>{(c.confidence * 100).toFixed(0)}% confidence</span>
                  {c.drift_detected && <span className="text-red-400 font-medium">DRIFT</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "drift",
      label: `Drift Status (${data.drift_status.events_created})`,
      icon: TrendingUp,
      badge: data.drift_status.events_created > 0 ? `${data.drift_status.events_created} detected` : "clear",
      badgeColor: data.drift_status.events_created > 0 ? "text-red-400 bg-red-500/15 border-red-500/30" : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      content: (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            {data.drift_status.commitments_evaluated} commitments evaluated
          </div>
          {data.drift_status.top_drifts.length > 0 && (
            <div className="space-y-2">
              {data.drift_status.top_drifts.map((d, i) => (
                <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[d.severity] ?? "bg-slate-500"}`} />
                    <span className="text-sm text-slate-300 font-medium capitalize">{d.drift_type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${d.severity === "high" || d.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {d.severity}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 leading-relaxed">{d.explanation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "compliance",
      label: `Compliance Issues (${data.top_compliance_issues.length})`,
      icon: Shield,
      badge: data.top_compliance_issues.length > 0
        ? `${data.top_compliance_issues.filter(f => f.severity === "critical" || f.severity === "high").length} high+`
        : "clear",
      badgeColor: data.top_compliance_issues.some(f => f.severity === "critical")
        ? "text-red-400 bg-red-500/15 border-red-500/30"
        : data.top_compliance_issues.some(f => f.severity === "high")
        ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
        : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      content: data.top_compliance_issues.length === 0 ? (
        <div className="text-xs text-slate-600">No compliance issues detected</div>
      ) : (
        <div className="space-y-2">
          {data.top_compliance_issues.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[f.severity] ?? "bg-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium capitalize">{f.flag_type.replace(/_/g, " ")}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${f.severity === "critical" ? "bg-red-500/20 text-red-400" : f.severity === "high" ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {f.severity}
                  </span>
                </div>
                {f.speaker && <div className="text-xs text-slate-600 mt-0.5">{f.speaker}</div>}
                {f.matched_pattern && <div className="text-sm text-slate-500 mt-1 leading-relaxed italic">"{f.matched_pattern}"</div>}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "questions",
      label: `Predicted Questions (${data.top_predicted_questions.length})`,
      icon: MessageSquare,
      content: data.top_predicted_questions.length === 0 ? (
        <div className="text-xs text-slate-600">No predicted questions</div>
      ) : (
        <div className="space-y-2">
          {data.top_predicted_questions.map((q, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
              <div className="text-sm text-slate-300 font-medium leading-relaxed">{q.question}</div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="capitalize">{q.likelihood} likelihood</span>
                <span className="text-slate-700">|</span>
                <span>{q.theme}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "pressure",
      label: `Pressure Points (${data.key_pressure_points.length})`,
      icon: Zap,
      content: data.key_pressure_points.length === 0 ? (
        <div className="text-xs text-slate-600">No pressure points identified</div>
      ) : (
        <div className="space-y-2">
          {data.key_pressure_points.map((p, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[p.severity] ?? "bg-amber-500"}`} />
              <div>
                <span className="text-slate-300 font-medium">{p.area}</span>
                <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">{p.detail}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "governance",
      label: "Governance Summary",
      icon: Shield,
      badge: data.governance_summary.overall_risk_level,
      badgeColor: RISK_COLORS[data.governance_summary.overall_risk_level],
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
              <div className="text-xs text-slate-600 mb-0.5">Commitments</div>
              <div className="text-lg text-slate-300 font-semibold">{data.governance_summary.total_commitments}</div>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
              <div className="text-xs text-slate-600 mb-0.5">Flags</div>
              <div className="text-lg text-slate-300 font-semibold">{data.governance_summary.total_flags}</div>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
              <div className="text-xs text-slate-600 mb-0.5">Matters Arising</div>
              <div className="text-lg text-slate-300 font-semibold">{data.governance_summary.matters_arising}</div>
            </div>
          </div>
          {data.governance_summary.executive_summary && (
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Executive Summary
              </div>
              <div className="text-sm text-slate-400 leading-relaxed">{data.governance_summary.executive_summary}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "profile",
      label: `Profile (v${data.profile_summary.version})`,
      icon: Brain,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Risk Level", value: data.profile_summary.overall_risk_level, color: RISK_COLORS[data.profile_summary.overall_risk_level] },
              { label: "Delivery", value: data.profile_summary.delivery_reliability },
              { label: "Relationships", value: data.profile_summary.relationship_health },
              { label: "Governance", value: data.profile_summary.governance_quality },
            ].map(item => (
              <div key={item.label} className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="text-xs text-slate-600 mb-0.5">{item.label}</div>
                <div className={`text-sm font-medium capitalize ${item.color ? item.color.split(" ")[0] : "text-slate-300"}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            {data.profile_summary.events_incorporated} events incorporated · {(data.profile_summary.confidence * 100).toFixed(0)}% confidence
          </div>
          {data.profile_summary.key_concerns.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Key Concerns</div>
              {data.profile_summary.key_concerns.slice(0, 4).map((c, i) => (
                <div key={i} className="text-sm text-red-400/80 flex items-start gap-2 mb-1">
                  <span className="text-red-500 mt-0.5 shrink-0">•</span><span>{c}</span>
                </div>
              ))}
            </div>
          )}
          {data.profile_summary.key_strengths.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Key Strengths</div>
              {data.profile_summary.key_strengths.slice(0, 4).map((s, i) => (
                <div key={i} className="text-sm text-emerald-400/80 flex items-start gap-2 mb-1">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span><span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "benchmark",
      label: "Benchmark Context",
      icon: BarChart3,
      content: (
        <div className="space-y-2">
          {data.benchmark_context.segment ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Segment:</span>
                <span className="text-slate-300 font-medium">{data.benchmark_context.segment}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{data.benchmark_context.event_count} events</span>
                <span className="text-slate-600">·</span>
                <span className={`capitalize ${data.benchmark_context.quality === "reliable" ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.benchmark_context.quality}
                </span>
              </div>
              {Object.keys(data.benchmark_context.positions).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.benchmark_context.positions).map(([dim, pos]) => (
                    <span key={dim} className={`text-xs px-2 py-0.5 rounded-full border border-white/10 ${POSITION_COLORS[pos as string] ?? "text-slate-400"}`}>
                      {dim}: {(pos as string).replace("_benchmark", "")}
                    </span>
                  ))}
                </div>
              )}
              {data.benchmark_context.concerns.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Benchmark Concerns</div>
                  {data.benchmark_context.concerns.map((c, i) => (
                    <div key={i} className="text-sm text-amber-400/80">• {c}</div>
                  ))}
                </div>
              )}
              {data.benchmark_context.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Benchmark Strengths</div>
                  {data.benchmark_context.strengths.map((s, i) => (
                    <div key={i} className="text-sm text-emerald-400/80">• {s}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-600">No benchmark data available</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <div className={`px-5 py-4 border-b border-white/10 bg-gradient-to-r ${riskBg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <Brain className="w-4.5 h-4.5 text-violet-400" />
            <span className="text-sm text-slate-200 font-semibold">AI Intelligence Summary</span>
            {data.data_sources && !data.data_sources.partial && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Complete
              </span>
            )}
            {data.data_sources?.partial && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/20">
                Partial
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data.generated_in_ms > 0 && (
              <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> {data.generated_in_ms}ms
              </span>
            )}
            <button onClick={() => query.refetch()}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
            <button onClick={downloadSummary}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors">
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {!data.data_sources?.ai_core_available && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>AI Core is currently unavailable. Showing cached and local data only.</span>
          </div>
        )}

        {(data as any).executive_takeaway && (
          <div className="text-sm text-slate-400 leading-relaxed mt-1">
            {(data as any).executive_takeaway}
          </div>
        )}
      </div>

      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
        {sections.map(section => {
          const Icon = section.icon;
          const isOpen = expanded[section.key] ?? false;
          return (
            <div key={section.key}>
              <button
                onClick={() => toggle(section.key)}
                className="w-full px-5 py-3 flex items-center gap-2 hover:bg-white/[0.02] transition-colors text-left"
              >
                <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{section.label}</span>
                {section.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${section.badgeColor ?? "bg-white/5 text-slate-400 border-white/10"}`}>
                    {section.badge}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-4">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/5">
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="w-full px-5 py-2 flex items-center gap-2 text-[10px] text-slate-600 hover:bg-white/[0.02] transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span className="flex-1 text-left">
            {["analysis", "drift", "governance", "profile", "benchmark", "briefing"].filter(src => (data.data_sources as any)[`${src}_loaded`]).length}/6 sources loaded
          </span>
          {data.pipeline_trace && (
            <span className={`px-1.5 py-0.5 rounded border ${
              data.pipeline_trace.overall_status === "complete"
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                : data.pipeline_trace.overall_status === "partial"
                ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                : "bg-red-500/15 text-red-500 border-red-500/30"
            }`}>
              pipeline: {data.pipeline_trace.overall_status}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${showTrace ? "rotate-180" : ""}`} />
        </button>

        {showTrace && (
          <div className="px-5 pb-3 space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-600 mb-2">
              <span className="flex items-center gap-1">
                {data.data_sources.ai_core_available ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                ) : (
                  <XCircle className="w-2.5 h-2.5 text-red-500" />
                )}
                AI Core
              </span>
              {["analysis", "drift", "governance", "profile", "benchmark", "briefing"].map(src => {
                const loaded = (data.data_sources as any)[`${src}_loaded`];
                return (
                  <span key={src} className={`${loaded ? "text-slate-500" : "text-slate-700"}`}>
                    {loaded ? "\u2713" : "\u2717"} {src}
                  </span>
                );
              })}
            </div>

            {data.pipeline_trace && data.pipeline_trace.steps.map((step: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {step.status === "ok" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : step.status === "skipped" ? (
                  <SkipForward className="w-3 h-3 text-slate-500 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span className="text-slate-400 w-36 truncate">{step.step.replace(/_/g, " ")}</span>
                <span className={`${step.status === "ok" ? "text-slate-500" : step.status === "skipped" ? "text-slate-600" : "text-red-400"}`}>
                  {step.status === "skipped" ? (step.detail?.reason ?? "skipped") : `${step.duration_ms}ms`}
                </span>
                {step.error && (
                  <span className="text-red-400/60 truncate max-w-[200px]" title={step.error}>{step.error.slice(0, 50)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
