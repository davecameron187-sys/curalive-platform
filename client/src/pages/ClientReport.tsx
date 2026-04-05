import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { useBrandConfig } from "../hooks/useBrandConfig";

type TabId = "summary" | "financials" | "compliance" | "tone" | "qa" | "transcript" | "actions" | "social" | "sens" | "certificate";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Executive Summary" },
  { id: "financials", label: "Financial Metrics" },
  { id: "compliance", label: "Compliance Flags" },
  { id: "tone", label: "Management Tone" },
  { id: "qa", label: "Q&A Log" },
  { id: "transcript", label: "Full Transcript" },
  { id: "actions", label: "Action Items" },
  { id: "social", label: "Social Media Pack" },
  { id: "sens", label: "SENS/RNS Draft" },
  { id: "certificate", label: "Certificate" },
];

export default function ClientReport() {
  const [, params] = useRoute("/report/:token");
  const token = params?.token;
  const [activeTab, setActiveTab] = useState<TabId>("summary");

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
        <div className="animate-pulse text-lg">Loading intelligence report...</div>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">This report link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const report = reportData && typeof reportData === "object" ? reportData : null;
  const r = report as any;

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: brand.fontFamily || "Inter, system-ui, sans-serif" }}>
      <header className="border-b border-gray-800 px-6 py-4" style={{ background: brand.primaryColor }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.displayName} className="h-8" />
            ) : (
              <h1 className="text-lg font-bold">{brand.displayName}</h1>
            )}
            <span className="text-sm opacity-75">Post-Event Intelligence Report</span>
          </div>
          <span className="text-sm opacity-75">{tokenData.recipientName}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex overflow-x-auto gap-1 mb-6 border-b border-gray-800 pb-1">
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
            </button>
          ))}
        </div>

        <div className="bg-gray-900 rounded-lg p-6 min-h-[400px]">
          {activeTab === "summary" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
              {r?.executiveSummary ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {typeof r.executiveSummary === "string"
                      ? r.executiveSummary
                      : r.executiveSummary.verdict ?? ""}
                  </p>
                  {r.executiveSummary.metrics && Array.isArray(r.executiveSummary.metrics) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {r.executiveSummary.metrics.map((m: any, i: number) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold" style={{ color: brand.accentColor || "#a78bfa" }}>{m.value}</div>
                          <div className="text-xs text-gray-400 mt-1">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.generatedAt && (
                    <p className="text-xs text-gray-500 mt-4">Generated: {new Date(r.generatedAt).toLocaleString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Report data not yet available.</p>
              )}
            </div>
          )}

          {activeTab === "financials" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Financial Metrics</h2>
              {r?.financialMetrics ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.financialMetrics === "string" ? r.financialMetrics : JSON.stringify(r.financialMetrics, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">Financial metrics not yet available.</p>
              )}
            </div>
          )}

          {activeTab === "compliance" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Compliance Flags</h2>
              {r?.complianceFlags && Array.isArray(r.complianceFlags) && r.complianceFlags.length > 0 ? (
                <div className="space-y-3">
                  {r.complianceFlags.map((flag: any, i: number) => (
                    <div key={i} className={`border rounded-lg p-4 ${
                      flag.severity === "critical" ? "border-red-500 bg-red-950/30" :
                      flag.severity === "warning" ? "border-yellow-500 bg-yellow-950/30" :
                      "border-gray-700 bg-gray-800/50"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          flag.severity === "critical" ? "bg-red-900 text-red-300" :
                          flag.severity === "warning" ? "bg-yellow-900 text-yellow-300" :
                          "bg-gray-700 text-gray-300"
                        }`}>{flag.severity}</span>
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
              ) : r?.complianceFlags && typeof r.complianceFlags === "string" ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.complianceFlags}</div>
              ) : (
                <p className="text-gray-500">No compliance flags detected.</p>
              )}
            </div>
          )}

          {activeTab === "tone" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Management Tone Analysis</h2>
              {r?.managementTone ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.managementTone === "string" ? r.managementTone : JSON.stringify(r.managementTone, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">Tone analysis not yet available.</p>
              )}
            </div>
          )}

          {activeTab === "qa" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Q&A Analysis</h2>
              {r?.qaQuality ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.qaQuality === "string" ? r.qaQuality : JSON.stringify(r.qaQuality, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">Q&A analysis not yet available.</p>
              )}
            </div>
          )}

          {activeTab === "transcript" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Full Transcript</h2>
              <p className="text-gray-500 text-sm">Transcript available in the operator console export.</p>
            </div>
          )}

          {activeTab === "actions" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Action Items</h2>
              {r?.criticalActions && Array.isArray(r.criticalActions) && r.criticalActions.length > 0 ? (
                <div className="space-y-3">
                  {r.criticalActions.map((action: any, i: number) => (
                    <div key={i} className={`border rounded-lg p-4 ${
                      action.priority === "urgent" ? "border-red-500 bg-red-950/20" : "border-orange-500 bg-orange-950/20"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          action.priority === "urgent" ? "bg-red-900 text-red-300" : "bg-orange-900 text-orange-300"
                        }`}>{action.priority}</span>
                        <span className="font-semibold text-sm">{action.title}</span>
                      </div>
                      <p className="text-sm text-gray-300">{action.detail}</p>
                    </div>
                  ))}
                </div>
              ) : r?.criticalActions && typeof r.criticalActions === "string" ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.criticalActions}</div>
              ) : r?.boardActions ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.boardActions === "string" ? r.boardActions : JSON.stringify(r.boardActions, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">No action items identified.</p>
              )}
            </div>
          )}

          {activeTab === "social" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Social Media Pack</h2>
              {r?.socialMediaPack ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {typeof r.socialMediaPack === "string" ? r.socialMediaPack : JSON.stringify(r.socialMediaPack, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">Social media pack not yet generated.</p>
              )}
            </div>
          )}

          {activeTab === "sens" && (
            <div>
              <h2 className="text-xl font-bold mb-4">SENS/RNS Draft</h2>
              {r?.sensRnsDraft ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {typeof r.sensRnsDraft === "string" ? r.sensRnsDraft : JSON.stringify(r.sensRnsDraft, null, 2)}
                </div>
              ) : (
                <p className="text-gray-500">SENS/RNS draft not yet generated.</p>
              )}
            </div>
          )}

          {activeTab === "certificate" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Board Intelligence</h2>
              {r?.boardIntelligence && typeof r.boardIntelligence === "object" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 text-center min-w-[120px]">
                      <div className="text-2xl font-bold" style={{ color: brand.accentColor || "#a78bfa" }}>
                        {r.boardIntelligence.governanceScore ?? "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Governance Score</div>
                    </div>
                    <p className="text-sm text-gray-300">{r.boardIntelligence.scoreSummary}</p>
                  </div>
                  {r.boardIntelligence.commitments?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-200">Commitments Tracked</h3>
                      <div className="space-y-2">
                        {r.boardIntelligence.commitments.map((c: any, i: number) => (
                          <div key={i} className="bg-gray-800 rounded p-3 text-sm">
                            <p className="text-gray-200 font-medium">"{c.commitment}"</p>
                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                              <span>By: {c.committedBy}</span>
                              {c.deadline && <span>Deadline: {c.deadline}</span>}
                              <span className="uppercase">{c.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.boardIntelligence.riskAreas?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-200">Risk Areas</h3>
                      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        {r.boardIntelligence.riskAreas.map((risk: string, i: number) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.boardIntelligence.boardReadiness && (
                    <p className="text-sm text-gray-400 italic">{r.boardIntelligence.boardReadiness}</p>
                  )}
                </div>
              ) : r?.boardIntelligence && typeof r.boardIntelligence === "string" ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{r.boardIntelligence}</div>
              ) : (
                <p className="text-gray-500">Board intelligence not yet available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
