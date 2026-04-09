import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, MessageSquare, Brain, Activity,
  Target, BarChart3, ChevronDown, Loader2, RefreshCw, Download
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
      badge: data.overall_risk.level,
      badgeColor: riskColor,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${riskColor}`}>{data.overall_risk.level}</span>
            <span className="text-xs text-slate-500">Score: {(data.overall_risk.score * 100).toFixed(0)}%</span>
            <span className="text-xs text-slate-600">Source: {data.overall_risk.source}</span>
          </div>
        </div>
      ),
    },
    {
      key: "sentiment",
      label: "Sentiment Summary",
      icon: Activity,
      badge: data.sentiment_summary.overall,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400">+{data.sentiment_summary.positive_signals}</span>
            <span className="text-red-400">-{data.sentiment_summary.negative_signals}</span>
            <span className="text-slate-500">{data.sentiment_summary.neutral_signals} neutral</span>
            <span className="text-slate-600">Score: {(data.sentiment_summary.score * 100).toFixed(0)}%</span>
          </div>
          {data.sentiment_summary.key_themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.sentiment_summary.key_themes.slice(0, 6).map((t, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">{t}</span>
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
        <div className="space-y-1.5">
          {data.key_commitments.slice(0, 5).map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${c.drift_detected ? "bg-red-500" : "bg-emerald-500"}`} />
              <div>
                <span className="text-slate-300">{c.text}</span>
                {c.speaker && <span className="text-slate-600 ml-1">— {c.speaker}</span>}
                {c.drift_detected && <span className="text-red-400 ml-1">[DRIFT]</span>}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "drift",
      label: "Drift Status",
      icon: TrendingUp,
      badge: data.drift_status.status,
      badgeColor: data.drift_status.events_created > 0 ? "text-red-400 bg-red-500/15 border-red-500/30" : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      content: (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            {data.drift_status.commitments_evaluated} commitments evaluated · {data.drift_status.events_created} drift events
          </div>
          {data.drift_status.top_drifts.length > 0 && (
            <div className="space-y-1.5">
              {data.drift_status.top_drifts.map((d, i) => (
                <div key={i} className="text-xs bg-red-500/5 border border-red-500/10 rounded p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[d.severity] ?? "bg-slate-500"}`} />
                    <span className="text-slate-400 font-medium">{d.drift_type}</span>
                    <span className="text-slate-600">·</span>
                    <span className={`${d.severity === "high" ? "text-red-400" : "text-amber-400"}`}>{d.severity}</span>
                  </div>
                  <div className="text-slate-500">{d.explanation}</div>
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
      content: data.top_compliance_issues.length === 0 ? (
        <div className="text-xs text-slate-600">No compliance issues detected</div>
      ) : (
        <div className="space-y-1">
          {data.top_compliance_issues.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${SEVERITY_DOT[f.severity] ?? "bg-slate-500"}`} />
              <div>
                <span className="text-slate-400 font-medium">{f.flag_type}</span>
                {f.speaker && <span className="text-slate-600 ml-1">({f.speaker})</span>}
                {f.matched_pattern && <div className="text-slate-500 mt-0.5">{f.matched_pattern}</div>}
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
        <div className="space-y-1.5">
          {data.top_predicted_questions.map((q, i) => (
            <div key={i} className="text-xs bg-white/[0.02] border border-white/5 rounded p-2">
              <div className="text-slate-300 font-medium">{q.question}</div>
              <div className="flex items-center gap-2 mt-1 text-slate-600">
                <span>{q.likelihood}</span>
                <span>·</span>
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
      icon: AlertTriangle,
      content: data.key_pressure_points.length === 0 ? (
        <div className="text-xs text-slate-600">No pressure points identified</div>
      ) : (
        <div className="space-y-1.5">
          {data.key_pressure_points.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${SEVERITY_DOT[p.severity] ?? "bg-amber-500"}`} />
              <div>
                <span className="text-slate-300 font-medium">{p.area}</span>
                <div className="text-slate-500 mt-0.5">{p.detail}</div>
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
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/[0.02] rounded p-2">
              <div className="text-slate-600 mb-0.5">Commitments</div>
              <div className="text-slate-300 font-medium">{data.governance_summary.total_commitments}</div>
            </div>
            <div className="bg-white/[0.02] rounded p-2">
              <div className="text-slate-600 mb-0.5">Flags</div>
              <div className="text-slate-300 font-medium">{data.governance_summary.total_flags}</div>
            </div>
            <div className="bg-white/[0.02] rounded p-2">
              <div className="text-slate-600 mb-0.5">Matters Arising</div>
              <div className="text-slate-300 font-medium">{data.governance_summary.matters_arising}</div>
            </div>
          </div>
          {data.governance_summary.executive_summary && (
            <div className="text-xs text-slate-500 leading-relaxed">{data.governance_summary.executive_summary}</div>
          )}
        </div>
      ),
    },
    {
      key: "profile",
      label: `Profile (v${data.profile_summary.version})`,
      icon: Brain,
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Risk Level", value: data.profile_summary.overall_risk_level },
              { label: "Delivery", value: data.profile_summary.delivery_reliability },
              { label: "Relationships", value: data.profile_summary.relationship_health },
              { label: "Governance", value: data.profile_summary.governance_quality },
            ].map(item => (
              <div key={item.label} className="bg-white/[0.02] rounded p-2">
                <div className="text-slate-600 mb-0.5">{item.label}</div>
                <div className="text-slate-300 font-medium capitalize">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            {data.profile_summary.events_incorporated} events · {(data.profile_summary.confidence * 100).toFixed(0)}% confidence
          </div>
          {data.profile_summary.key_concerns.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Concerns</div>
              {data.profile_summary.key_concerns.slice(0, 3).map((c, i) => (
                <div key={i} className="text-xs text-red-400/80 flex items-start gap-1.5 mb-0.5">
                  <span className="text-red-500 mt-0.5">•</span>{c}
                </div>
              ))}
            </div>
          )}
          {data.profile_summary.key_strengths.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Strengths</div>
              {data.profile_summary.key_strengths.slice(0, 3).map((s, i) => (
                <div key={i} className="text-xs text-emerald-400/80 flex items-start gap-1.5 mb-0.5">
                  <span className="text-emerald-500 mt-0.5">•</span>{s}
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
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Segment:</span>
                <span className="text-slate-300">{data.benchmark_context.segment}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{data.benchmark_context.event_count} events</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{data.benchmark_context.quality}</span>
              </div>
              {Object.keys(data.benchmark_context.positions).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.benchmark_context.positions).map(([dim, pos]) => (
                    <span key={dim} className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${POSITION_COLORS[pos] ?? "text-slate-400"}`}>
                      {dim}: {(pos as string).replace("_benchmark", "")}
                    </span>
                  ))}
                </div>
              )}
              {data.benchmark_context.concerns.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Benchmark Concerns</div>
                  {data.benchmark_context.concerns.map((c, i) => (
                    <div key={i} className="text-xs text-amber-400/80">• {c}</div>
                  ))}
                </div>
              )}
              {data.benchmark_context.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Benchmark Strengths</div>
                  {data.benchmark_context.strengths.map((s, i) => (
                    <div key={i} className="text-xs text-emerald-400/80">• {s}</div>
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
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-slate-300 font-medium">AI Intelligence Summary</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
            Phase 9
          </span>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
