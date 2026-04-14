import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { useBrandConfig } from "../hooks/useBrandConfig";

type TabId = "summary" | "compliance" | "risks" | "tone" | "qa" | "actions" | "board" | "social" | "sens";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Executive Summary" },
  { id: "compliance", label: "Compliance" },
  { id: "risks", label: "Risk Factors" },
  { id: "tone", label: "Sentiment & Tone" },
  { id: "qa", label: "Q&A Analysis" },
  { id: "actions", label: "Action Items" },
  { id: "board", label: "Board Intelligence" },
  { id: "social", label: "Social Media Pack" },
  { id: "sens", label: "SENS/RNS Draft" },
];

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#ef4444", negative: "#ef4444",
  warning: "#f59e0b", medium: "#f59e0b", moderate: "#f59e0b", neutral: "#f59e0b",
  low: "#10b981", positive: "#10b981", info: "#60a5fa",
};
const sevCol = (s: string) => SEV_COLOR[(s || "").toLowerCase()] || "#94a3b8";

function MetricCard({ label, value, sublabel, color }: { label: string; value: string | number; sublabel?: string; color?: string }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 text-center">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color: color || "#a78bfa" }}>{value}</p>
      {sublabel && <p className="text-[11px] text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return <p className="text-gray-500 text-sm py-4">{text}</p>;
}

function SeverityPill({ severity }: { severity: string }) {
  const labels: Record<string, string> = { critical: "Critical", high: "High", warning: "Warning", medium: "Moderate", low: "Low", info: "Info" };
  const bg: Record<string, string> = { critical: "bg-red-900/60 text-red-300", high: "bg-red-900/50 text-red-300", warning: "bg-yellow-900/50 text-yellow-300", medium: "bg-yellow-900/40 text-yellow-300", low: "bg-emerald-900/40 text-emerald-300", info: "bg-blue-900/40 text-blue-300" };
  const key = (severity || "").toLowerCase();
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${bg[key] || "bg-gray-700 text-gray-300"}`}>
      {labels[key] || severity}
    </span>
  );
}

export default function ClientReport() {
  const [, params] = useRoute("/report/:token");
  const token = params?.token;
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: tokenData, isLoading } = trpc.partners.validateToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const brand = useBrandConfig(tokenData?.partnerId);
  const logView = trpc.operations.logClientView.useMutation();

  const { data: reportData } = trpc.partners.getReportByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token && !!tokenData?.valid }
  );

  useEffect(() => {
    if (token) {
      logView.mutate({ token, tabViewed: "summary", timeSpentSecs: 0 });
    }
  }, [token]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0 });
    logView.mutate({ token: token ?? "", tabViewed: tabId, timeSpentSecs: 0 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading intelligence report...</p>
        </div>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm">This report link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const report = reportData && typeof reportData === "object" ? reportData : null;
  const r = report as any;

  const execSummaryText = !r?.executiveSummary ? null
    : typeof r.executiveSummary === "string" ? r.executiveSummary
    : r.executiveSummary.verdict ?? JSON.stringify(r.executiveSummary);

  const execMetrics = r?.executiveSummary?.metrics && Array.isArray(r.executiveSummary.metrics) ? r.executiveSummary.metrics : [];

  const sentimentScore = r?.sentimentAnalysis?.score;
  const sentimentLabel = sentimentScore >= 70 ? "Positive" : sentimentScore >= 50 ? "Neutral" : sentimentScore != null ? "Negative" : null;
  const sentimentColor = sentimentScore >= 70 ? "#10b981" : sentimentScore >= 50 ? "#f59e0b" : "#ef4444";

  const compFlagCount = r?.complianceReview?.flaggedPhrases?.length || 0;
  const compRiskLevel = r?.complianceReview?.riskLevel;
  const compColor = compFlagCount > 3 ? "#ef4444" : compFlagCount > 0 ? "#f59e0b" : "#10b981";

  const riskCount = r?.riskFactors?.length || 0;
  const actionCount = (r?.criticalActions?.length || 0) + (r?.actionItems?.length || 0);

  return (
    <div ref={printRef} className="min-h-screen bg-gray-950 text-white print:bg-white print:text-gray-900" style={{ fontFamily: brand.fontFamily || "Inter, system-ui, sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <header className="border-b border-gray-800 px-6 py-5 print:border-gray-300" style={{ background: brand.primaryColor }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.displayName} className="h-8" />
            ) : (
              <h1 className="text-lg font-bold tracking-tight">{brand.displayName}</h1>
            )}
            <div className="h-5 w-px bg-white/20" />
            <span className="text-sm opacity-80 font-medium">Post-Event Intelligence Report</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-75">{tokenData.recipientName}</span>
            <button
              onClick={() => window.print()}
              className="no-print text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
            >
              Print / Export
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="no-print flex overflow-x-auto gap-1 mb-6 border-b border-gray-800 pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t transition-colors ${
                activeTab === tab.id
                  ? "text-white border-b-2"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              style={activeTab === tab.id ? { borderBottomColor: brand.accentColor || "#6b21a8" } : {}}
            >
              {tab.label}
              {tab.id === "compliance" && compFlagCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{compFlagCount}</span>
              )}
              {tab.id === "risks" && riskCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{riskCount}</span>
              )}
              {tab.id === "actions" && actionCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{actionCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 min-h-[400px] print:bg-white print:border-gray-200">

          {activeTab === "summary" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Executive Summary</h2>

              {(sentimentScore != null || compRiskLevel || riskCount > 0 || actionCount > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sentimentScore != null && (
                    <MetricCard label="Sentiment" value={`${sentimentScore}/100`} sublabel={sentimentLabel!} color={sentimentColor} />
                  )}
                  <MetricCard label="Compliance" value={compFlagCount > 0 ? `${compFlagCount} flags` : "Clear"} sublabel={compRiskLevel || "N/A"} color={compColor} />
                  <MetricCard label="Risk Factors" value={riskCount} sublabel={riskCount > 3 ? "Elevated" : riskCount > 0 ? "Manageable" : "None identified"} color={riskCount > 3 ? "#ef4444" : riskCount > 0 ? "#f59e0b" : "#10b981"} />
                  <MetricCard label="Action Items" value={actionCount} sublabel={actionCount > 0 ? "requiring attention" : "none raised"} color="#a78bfa" />
                </div>
              )}

              {execMetrics.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {execMetrics.map((m: any, i: number) => (
                    <MetricCard key={i} label={m.label} value={m.value} color={brand.accentColor || "#a78bfa"} />
                  ))}
                </div>
              )}

              {execSummaryText ? (
                <div className="bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-xl p-5">
                  <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-2">AI Intelligence Verdict</p>
                  <p className="text-sm text-gray-300 leading-relaxed print:text-gray-700">{execSummaryText}</p>
                </div>
              ) : (
                <SectionEmpty text="Report data not yet available." />
              )}

              {r?.sentimentAnalysis?.keyDrivers?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Key Sentiment Drivers</p>
                  <div className="flex flex-wrap gap-2">
                    {r.sentimentAnalysis.keyDrivers.map((d: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-gray-300">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {r?.generatedAt && (
                <p className="text-xs text-gray-600 mt-2">Generated: {new Date(r.generatedAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Compliance Review</h2>
                {compRiskLevel && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: compColor }} />
                    <span className="text-sm font-semibold" style={{ color: compColor }}>Risk Level: {compRiskLevel}</span>
                  </div>
                )}
              </div>

              {r?.complianceReview?.flaggedPhrases?.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Flagged Phrases ({r.complianceReview.flaggedPhrases.length})</p>
                  {r.complianceReview.flaggedPhrases.map((phrase: string, i: number) => (
                    <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] text-amber-400 font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{phrase}</p>
                    </div>
                  ))}
                  {r.complianceReview.recommendations?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Recommendations</p>
                      <ul className="space-y-1.5">
                        {r.complianceReview.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">→</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : r?.complianceFlags && Array.isArray(r.complianceFlags) && r.complianceFlags.length > 0 ? (
                <div className="space-y-3">
                  {r.complianceFlags.map((flag: any, i: number) => (
                    <div key={i} className={`border rounded-lg p-4 ${
                      flag.severity === "critical" ? "border-red-500/40 bg-red-950/20" :
                      flag.severity === "warning" ? "border-yellow-500/40 bg-yellow-950/20" :
                      "border-gray-700 bg-gray-800/30"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityPill severity={flag.severity} />
                        <span className="font-semibold text-sm">{flag.title}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{flag.description}</p>
                      {flag.action && <p className="text-sm text-gray-400"><span className="font-medium text-gray-200">Action:</span> {flag.action}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {flag.ruleRef && <span>Rule: {flag.ruleRef}</span>}
                        {flag.deadline && <span>Deadline: {flag.deadline}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                r?.complianceFlags && typeof r.complianceFlags === "string" ? (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.complianceFlags}</div>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm text-emerald-400 font-medium">No compliance flags detected</p>
                  <p className="text-xs text-gray-500 mt-1">No regulatory concerns were identified during this event.</p>
                </div>
              )
              )}
            </div>
          )}

          {activeTab === "risks" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Risk Factors</h2>
              {r?.riskFactors && Array.isArray(r.riskFactors) && r.riskFactors.length > 0 ? (
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800/50">
                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Factor</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Impact</th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Likelihood</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.riskFactors.map((f: any, i: number) => (
                        <tr key={i} className="border-t border-gray-800/50">
                          <td className="px-4 py-3 text-gray-200 font-medium">{f.factor}</td>
                          <td className="px-4 py-3"><span className="font-semibold" style={{ color: sevCol(f.impact) }}>{f.impact}</span></td>
                          <td className="px-4 py-3 text-gray-400">{f.likelihood}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <SectionEmpty text="No risk factors identified." />
              )}
            </div>
          )}

          {activeTab === "tone" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Sentiment & Tone Analysis</h2>

              {r?.sentimentAnalysis ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-6">
                    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 text-center min-w-[120px]">
                      <p className="text-3xl font-extrabold" style={{ color: sentimentColor }}>{sentimentScore}</p>
                      <p className="text-xs text-gray-500 mt-1">{sentimentLabel} · /100</p>
                    </div>
                    {r.sentimentAnalysis.narrative && (
                      <p className="text-sm text-gray-300 leading-relaxed flex-1">{r.sentimentAnalysis.narrative}</p>
                    )}
                  </div>
                  {r.sentimentAnalysis.keyDrivers?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Key Drivers</p>
                      <ul className="space-y-1.5">
                        {r.sentimentAnalysis.keyDrivers.map((d: string, i: number) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : r?.managementTone ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.managementTone === "string" ? r.managementTone : JSON.stringify(r.managementTone, null, 2)}
                </div>
              ) : (
                <SectionEmpty text="Sentiment and tone analysis not yet available." />
              )}

              {r?.communicationScore && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Communication Quality</p>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Overall" value={`${r.communicationScore.score}/100`} color={r.communicationScore.score >= 70 ? "#10b981" : r.communicationScore.score >= 50 ? "#f59e0b" : "#ef4444"} />
                    <MetricCard label="Clarity" value={`${r.communicationScore.clarity}/100`} color="#60a5fa" />
                    <MetricCard label="Transparency" value={`${r.communicationScore.transparency}/100`} color="#60a5fa" />
                  </div>
                  {r.communicationScore.narrative && (
                    <p className="text-sm text-gray-400 leading-relaxed">{r.communicationScore.narrative}</p>
                  )}
                </div>
              )}

              {r?.sentimentArc && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sentiment Arc</p>
                  <div className="grid grid-cols-4 gap-3">
                    <MetricCard label="Opening" value={r.sentimentArc.opening} color="#22d3ee" />
                    <MetricCard label="Midpoint" value={r.sentimentArc.midpoint} color="#22d3ee" />
                    <MetricCard label="Closing" value={r.sentimentArc.closing} color="#22d3ee" />
                    <MetricCard label="Trend" value={r.sentimentArc.trend} color="#22d3ee" />
                  </div>
                  {r.sentimentArc.narrative && (
                    <p className="text-sm text-gray-400 leading-relaxed">{r.sentimentArc.narrative}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "qa" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Q&A Analysis</h2>
              {r?.questionsAsked?.length > 0 ? (
                <div className="space-y-3">
                  {r.questionsAsked.map((q: any, i: number) => (
                    <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
                      <p className="text-sm text-gray-200 font-medium mb-1">{q.question}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Asked by: {q.askedBy}</span>
                        <span>Quality: <span className="font-semibold" style={{ color: sevCol(q.quality) }}>{q.quality}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : r?.qaQuality ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.qaQuality === "string" ? r.qaQuality : JSON.stringify(r.qaQuality, null, 2)}
                </div>
              ) : (
                <SectionEmpty text="Q&A analysis not yet available." />
              )}
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Action Items & Follow-Ups</h2>

              {r?.criticalActions?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Critical Actions</p>
                  {r.criticalActions.map((action: any, i: number) => (
                    <div key={i} className={`border rounded-lg p-4 ${
                      action.priority === "urgent" ? "border-red-500/40 bg-red-950/15" : "border-orange-500/30 bg-orange-950/15"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityPill severity={action.priority === "urgent" ? "critical" : "warning"} />
                        <span className="font-semibold text-sm">{action.title}</span>
                      </div>
                      <p className="text-sm text-gray-300">{action.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {r?.actionItems?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Action Items</p>
                  <div className="border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/50">
                          <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Item</th>
                          <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Owner</th>
                          <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.actionItems.map((a: any, i: number) => (
                          <tr key={i} className="border-t border-gray-800/50">
                            <td className="px-4 py-3 text-gray-200">{a.item}</td>
                            <td className="px-4 py-3 text-gray-400">{a.owner}</td>
                            <td className="px-4 py-3 text-gray-400">{a.deadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!r?.criticalActions?.length && !r?.actionItems?.length && (
                r?.boardActions ? (
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {typeof r.boardActions === "string" ? r.boardActions : JSON.stringify(r.boardActions, null, 2)}
                  </div>
                ) : (
                  <SectionEmpty text="No action items identified." />
                )
              )}
            </div>
          )}

          {activeTab === "board" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Board Intelligence</h2>
              {r?.boardIntelligence && typeof r.boardIntelligence === "object" ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    <MetricCard label="Governance Score" value={r.boardIntelligence.governanceScore ?? "—"} color={brand.accentColor || "#a78bfa"} />
                    {r.boardIntelligence.scoreSummary && (
                      <p className="text-sm text-gray-300 flex-1 leading-relaxed">{r.boardIntelligence.scoreSummary}</p>
                    )}
                  </div>

                  {r.boardIntelligence.commitments?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Commitments Tracked ({r.boardIntelligence.commitments.length})</p>
                      <div className="space-y-2">
                        {r.boardIntelligence.commitments.map((c: any, i: number) => (
                          <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-lg p-4">
                            <p className="text-sm text-gray-200 font-medium">"{c.commitment}"</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                              <span>By: <span className="text-gray-300">{c.committedBy}</span></span>
                              {c.deadline && <span>Deadline: <span className="text-gray-300">{c.deadline}</span></span>}
                              <span className="uppercase text-gray-400">{c.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.boardIntelligence.riskAreas?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Risk Areas</p>
                      <ul className="space-y-1.5">
                        {r.boardIntelligence.riskAreas.map((risk: string, i: number) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span> {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.boardIntelligence.boardReadiness && (
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Board Readiness</p>
                      <p className="text-sm text-gray-400 italic">{r.boardIntelligence.boardReadiness}</p>
                    </div>
                  )}
                </div>
              ) : r?.boardIntelligence && typeof r.boardIntelligence === "string" ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.boardIntelligence}</div>
              ) : (
                <SectionEmpty text="Board intelligence not yet available." />
              )}
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Social Media Pack</h2>
              {r?.socialMediaPack ? (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {typeof r.socialMediaPack === "string" ? r.socialMediaPack : JSON.stringify(r.socialMediaPack, null, 2)}
                  </div>
                </div>
              ) : (
                <SectionEmpty text="Social media pack not yet generated." />
              )}
            </div>
          )}

          {activeTab === "sens" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">SENS/RNS Draft</h2>
              {r?.sensRnsDraft ? (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {typeof r.sensRnsDraft === "string" ? r.sensRnsDraft : JSON.stringify(r.sensRnsDraft, null, 2)}
                  </div>
                </div>
              ) : (
                <SectionEmpty text="SENS/RNS draft not yet generated." />
              )}
            </div>
          )}
        </div>

        <footer className="mt-8 pb-8 text-center">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} {brand.displayName}. All rights reserved.</p>
          <p className="text-[10px] text-gray-700 mt-1">This report was generated by AI and should be reviewed alongside primary source materials.</p>
        </footer>
      </div>
    </div>
  );
}
