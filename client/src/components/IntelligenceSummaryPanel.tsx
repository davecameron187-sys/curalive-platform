import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, TrendingUp, MessageSquare, Brain, Activity,
  Target, BarChart3, ChevronDown, Loader2, RefreshCw, Download, Clock,
  CheckCircle2, XCircle, SkipForward, Zap, WifiOff, FileText
} from "lucide-react";
import { useState, useMemo } from "react";

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

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Moderate",
  low: "Low",
};

const POSITION_COLORS: Record<string, string> = {
  above_benchmark: "text-emerald-400",
  at_benchmark: "text-slate-400",
  below_benchmark: "text-red-400",
};

const POSITION_LABELS: Record<string, string> = {
  above_benchmark: "Above",
  at_benchmark: "At",
  below_benchmark: "Below",
};

function riskPriority(level: string): number {
  const map: Record<string, number> = { critical: 0, high: 1, elevated: 2, medium: 3, low: 4, minimal: 5, unknown: 6 };
  return map[level] ?? 6;
}

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

  const sections = useMemo(() => {
    if (!data) return [];
    return buildSections(data);
  }, [data]);

  if (query.isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin mx-auto mb-2" />
        <div className="text-sm text-slate-500">Assembling intelligence summary...</div>
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
    a.download = `intelligence_${data.session_id ?? data.organisation_id ?? "unknown"}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadedCount = ["analysis", "drift", "governance", "profile", "benchmark", "briefing"]
    .filter(src => (data.data_sources as any)[`${src}_loaded`]).length;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <div className={`px-5 py-4 border-b border-white/10 bg-gradient-to-r ${riskBg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <Brain className="w-4.5 h-4.5 text-violet-400" />
            <span className="text-sm text-slate-200 font-semibold">Intelligence Summary</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${riskColor}`}>
              {data.overall_risk.level.toUpperCase()}
            </span>
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mt-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>AI Core unavailable — showing cached and local data only.</span>
          </div>
        )}

        {(data as any).executive_takeaway && (
          <p className="text-[13px] text-slate-300 leading-relaxed mt-2">
            {(data as any).executive_takeaway}
          </p>
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
                <Icon className={`w-3.5 h-3.5 shrink-0 ${section.iconColor ?? "text-violet-400"}`} />
                <span className="text-sm text-slate-300 flex-1">{section.label}</span>
                {section.preview && !isOpen && (
                  <span className="text-[11px] text-slate-500 max-w-[200px] truncate hidden sm:inline">{section.preview}</span>
                )}
                {section.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${section.badgeColor ?? "bg-white/5 text-slate-400 border-white/10"}`}>
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
          <span className="flex-1 text-left">{loadedCount}/6 data sources loaded</span>
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

interface SectionDef {
  key: string;
  label: string;
  icon: any;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  preview?: string;
  priority: number;
  content: React.ReactNode;
}

function buildSections(data: any): SectionDef[] {
  const hasCriticalCompliance = data.top_compliance_issues.some((f: any) => f.severity === "critical");
  const hasHighCompliance = data.top_compliance_issues.some((f: any) => f.severity === "high");
  const hasDrift = data.drift_status.events_created > 0;
  const hasHighDrift = data.drift_status.top_drifts.some((d: any) => d.severity === "high" || d.severity === "critical");

  const riskColor = RISK_COLORS[data.overall_risk.level] ?? RISK_COLORS.unknown;

  const sections: SectionDef[] = [
    {
      key: "risk",
      label: "Overall Risk Assessment",
      icon: AlertTriangle,
      iconColor: riskPriority(data.overall_risk.level) <= 1 ? "text-red-400" : riskPriority(data.overall_risk.level) <= 3 ? "text-amber-400" : "text-emerald-400",
      badge: data.overall_risk.level.toUpperCase(),
      badgeColor: riskColor,
      preview: `${(data.overall_risk.score * 100).toFixed(0)}% — ${data.overall_risk.source}`,
      priority: 0,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-2.5 py-1 rounded border ${riskColor}`}>
              {data.overall_risk.level.toUpperCase()}
            </span>
            <span className="text-sm text-slate-400">{(data.overall_risk.score * 100).toFixed(0)}% risk score</span>
          </div>
          <div className="text-xs text-slate-500">
            Primary assessment source: <span className="text-slate-400 capitalize">{data.overall_risk.source}</span>
          </div>
        </div>
      ),
    },
    {
      key: "compliance",
      label: `Compliance Flags (${data.top_compliance_issues.length})`,
      icon: Shield,
      iconColor: hasCriticalCompliance ? "text-red-400" : hasHighCompliance ? "text-orange-400" : "text-emerald-400",
      badge: data.top_compliance_issues.length > 0
        ? (() => {
            const crit = data.top_compliance_issues.filter((f: any) => f.severity === "critical").length;
            const high = data.top_compliance_issues.filter((f: any) => f.severity === "high").length;
            if (crit > 0) return `${crit} critical`;
            if (high > 0) return `${high} high`;
            return `${data.top_compliance_issues.length} flagged`;
          })()
        : "Clear",
      badgeColor: hasCriticalCompliance
        ? "text-red-400 bg-red-500/15 border-red-500/30"
        : hasHighCompliance
        ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
        : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      preview: data.top_compliance_issues.length > 0
        ? data.top_compliance_issues[0].flag_type.replace(/_/g, " ")
        : undefined,
      priority: hasCriticalCompliance ? 1 : hasHighCompliance ? 2 : 8,
      content: data.top_compliance_issues.length === 0 ? (
        <div className="text-sm text-slate-500">No compliance issues detected in this session.</div>
      ) : (
        <div className="space-y-2.5">
          {[...data.top_compliance_issues].sort((a: any, b: any) => riskPriority(a.severity) - riskPriority(b.severity)).slice(0, 5).map((f: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[f.severity] ?? "bg-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium capitalize">{f.flag_type.replace(/_/g, " ")}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${f.severity === "critical" ? "bg-red-500/20 text-red-400" : f.severity === "high" ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {SEVERITY_LABEL[f.severity] ?? f.severity}
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
      key: "drift",
      label: `Commitment Drift (${data.drift_status.events_created})`,
      icon: TrendingUp,
      iconColor: hasHighDrift ? "text-red-400" : hasDrift ? "text-amber-400" : "text-emerald-400",
      badge: hasDrift ? `${data.drift_status.events_created} detected` : "No drift",
      badgeColor: hasDrift ? "text-red-400 bg-red-500/15 border-red-500/30" : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      preview: hasDrift
        ? data.drift_status.top_drifts[0]?.drift_type
        : undefined,
      priority: hasHighDrift ? 1.5 : hasDrift ? 3 : 9,
      content: (
        <div className="space-y-2">
          <div className="text-sm text-slate-500">
            {data.drift_status.commitments_evaluated} prior commitments evaluated against current statements
          </div>
          {data.drift_status.top_drifts.length > 0 && (
            <div className="space-y-2">
              {data.drift_status.top_drifts.map((d: any, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[d.severity] ?? "bg-slate-500"}`} />
                    <span className="text-sm text-slate-300 font-medium capitalize">{d.drift_type} drift</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.severity === "high" || d.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {SEVERITY_LABEL[d.severity] ?? d.severity}
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
      key: "sentiment",
      label: "Sentiment Analysis",
      icon: Activity,
      iconColor: data.sentiment_summary.score < -0.15 ? "text-red-400" : data.sentiment_summary.score > 0.15 ? "text-emerald-400" : "text-slate-400",
      badge: `${data.sentiment_summary.overall} (${(data.sentiment_summary.score * 100).toFixed(0)}%)`,
      badgeColor: data.sentiment_summary.score < -0.15
        ? "text-red-400 bg-red-500/15 border-red-500/30"
        : data.sentiment_summary.score > 0.15
        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
        : "text-slate-400 bg-slate-500/15 border-slate-500/30",
      preview: data.sentiment_summary.key_themes.slice(0, 2).join(", ") || undefined,
      priority: 4,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-emerald-400 font-medium">+{data.sentiment_summary.positive_signals} positive</span>
            <span className="text-red-400 font-medium">-{data.sentiment_summary.negative_signals} negative</span>
            <span className="text-slate-500">{data.sentiment_summary.neutral_signals} neutral</span>
          </div>
          {data.sentiment_summary.key_themes.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Key Themes</div>
              <div className="flex flex-wrap gap-1.5">
                {data.sentiment_summary.key_themes.slice(0, 6).map((t: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "commitments",
      label: `Commitments Tracked (${data.key_commitments.length})`,
      icon: Target,
      iconColor: "text-violet-400",
      preview: data.key_commitments.length > 0
        ? `${data.key_commitments.filter((c: any) => c.confidence >= 0.8).length} high-confidence`
        : undefined,
      priority: 5,
      content: data.key_commitments.length === 0 ? (
        <div className="text-sm text-slate-500">No explicit commitments detected in this session.</div>
      ) : (
        <div className="space-y-2">
          {data.key_commitments.slice(0, 6).map((c: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.drift_detected ? "bg-red-500" : c.confidence >= 0.8 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-slate-300 leading-relaxed">{c.text}</div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                  {c.speaker && <span>{c.speaker}</span>}
                  <span className="text-slate-700">|</span>
                  <span>{(c.confidence * 100).toFixed(0)}% confidence</span>
                  {c.drift_detected && <span className="text-red-400 font-semibold">DRIFT DETECTED</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "governance",
      label: "Governance Overview",
      icon: Shield,
      iconColor: "text-blue-400",
      badge: data.governance_summary.overall_risk_level !== "unknown" ? data.governance_summary.overall_risk_level : undefined,
      badgeColor: RISK_COLORS[data.governance_summary.overall_risk_level],
      preview: data.governance_summary.total_commitments > 0
        ? `${data.governance_summary.total_commitments} commitments, ${data.governance_summary.total_flags} flags`
        : undefined,
      priority: 6,
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
      label: `Organisation Profile (v${data.profile_summary.version})`,
      icon: Brain,
      iconColor: "text-cyan-400",
      preview: data.profile_summary.overall_risk_level !== "unknown"
        ? `${data.profile_summary.delivery_reliability} delivery, ${data.profile_summary.relationship_health} relationship`
        : undefined,
      priority: 7,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Risk Level", value: data.profile_summary.overall_risk_level, color: RISK_COLORS[data.profile_summary.overall_risk_level] },
              { label: "Delivery Reliability", value: data.profile_summary.delivery_reliability },
              { label: "Relationship Health", value: data.profile_summary.relationship_health },
              { label: "Governance Quality", value: data.profile_summary.governance_quality },
            ].map(item => (
              <div key={item.label} className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="text-xs text-slate-600 mb-0.5">{item.label}</div>
                <div className={`text-sm font-medium capitalize ${item.color ? item.color.split(" ")[0] : "text-slate-300"}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            Based on {data.profile_summary.events_incorporated} events · {(data.profile_summary.confidence * 100).toFixed(0)}% confidence
          </div>
          {data.profile_summary.key_concerns.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Key Concerns</div>
              {data.profile_summary.key_concerns.slice(0, 4).map((c: string, i: number) => (
                <div key={i} className="text-sm text-red-400/80 flex items-start gap-2 mb-1">
                  <span className="text-red-500 mt-0.5 shrink-0">•</span><span>{c}</span>
                </div>
              ))}
            </div>
          )}
          {data.profile_summary.key_strengths.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Key Strengths</div>
              {data.profile_summary.key_strengths.slice(0, 4).map((s: string, i: number) => (
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
      key: "questions",
      label: `Predicted Questions (${data.top_predicted_questions.length})`,
      icon: MessageSquare,
      iconColor: "text-cyan-400",
      priority: data.top_predicted_questions.length > 0 ? 5.5 : 10,
      content: data.top_predicted_questions.length === 0 ? (
        <div className="text-sm text-slate-500">No predicted questions generated for this session.</div>
      ) : (
        <div className="space-y-2">
          {data.top_predicted_questions.map((q: any, i: number) => (
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
      iconColor: data.key_pressure_points.length > 0 ? "text-amber-400" : "text-slate-500",
      priority: data.key_pressure_points.length > 0 ? 5.5 : 10,
      content: data.key_pressure_points.length === 0 ? (
        <div className="text-sm text-slate-500">No pressure points identified in this session.</div>
      ) : (
        <div className="space-y-2">
          {data.key_pressure_points.map((p: any, i: number) => (
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
      key: "benchmark",
      label: "Benchmark Comparison",
      icon: BarChart3,
      iconColor: "text-indigo-400",
      preview: data.benchmark_context.segment
        ? `${data.benchmark_context.segment} (${data.benchmark_context.event_count} events)`
        : undefined,
      priority: 10,
      content: (
        <div className="space-y-2">
          {data.benchmark_context.segment ? (
            <>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-slate-500">Segment:</span>
                <span className="text-slate-300 font-medium">{data.benchmark_context.segment}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{data.benchmark_context.event_count} events</span>
                <span className="text-slate-600">·</span>
                <span className={`capitalize ${data.benchmark_context.quality === "reliable" ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.benchmark_context.quality === "reliable" ? "Reliable sample" : "Limited sample"}
                </span>
              </div>
              {Object.keys(data.benchmark_context.positions).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.benchmark_context.positions).map(([dim, pos]) => (
                    <span key={dim} className={`text-xs px-2 py-0.5 rounded-full border border-white/10 ${POSITION_COLORS[pos as string] ?? "text-slate-400"}`}>
                      {dim}: {POSITION_LABELS[pos as string] ?? (pos as string).replace("_benchmark", "")}
                    </span>
                  ))}
                </div>
              )}
              {data.benchmark_context.concerns.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Areas of Concern vs. Benchmark</div>
                  {data.benchmark_context.concerns.map((c: string, i: number) => (
                    <div key={i} className="text-sm text-amber-400/80">• {c}</div>
                  ))}
                </div>
              )}
              {data.benchmark_context.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Strengths vs. Benchmark</div>
                  {data.benchmark_context.strengths.map((s: string, i: number) => (
                    <div key={i} className="text-sm text-emerald-400/80">• {s}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500">No benchmark data available for this organisation.</div>
          )}
        </div>
      ),
    },
  ];

  return sections.sort((a, b) => a.priority - b.priority);
}
