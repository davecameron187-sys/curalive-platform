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

  const { data: reportData } = trpc.shadowMode.getReport.useQuery(
    { sessionId: tokenData?.sessionId ?? 0 },
    { enabled: !!tokenData?.sessionId }
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
              {report ? (
                <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                  <p>{typeof report === "object" && "executiveSummary" in (report as any) ? (report as any).executiveSummary : "Report data loading..."}</p>
                </div>
              ) : (
                <p className="text-gray-500">Report data not yet available.</p>
              )}
            </div>
          )}

          {activeTab === "financials" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Financial Metrics</h2>
              <p className="text-gray-400 text-sm">Key financial metrics extracted from the session.</p>
            </div>
          )}

          {activeTab === "compliance" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Compliance Flags</h2>
              <p className="text-gray-400 text-sm">Regulatory compliance flags detected during the session.</p>
            </div>
          )}

          {activeTab === "tone" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Management Tone Analysis</h2>
              <p className="text-gray-400 text-sm">AI-powered analysis of management tone and communication patterns.</p>
            </div>
          )}

          {activeTab === "qa" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Q&A Log</h2>
              <p className="text-gray-400 text-sm">Complete record of questions and responses.</p>
            </div>
          )}

          {activeTab === "transcript" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Full Transcript</h2>
              <p className="text-gray-400 text-sm">AI-transcribed, speaker-diarised transcript.</p>
            </div>
          )}

          {activeTab === "actions" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Action Items</h2>
              <p className="text-gray-400 text-sm">Commitments and follow-up actions identified.</p>
            </div>
          )}

          {activeTab === "social" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Social Media Pack</h2>
              <p className="text-gray-400 text-sm">Pre-drafted social media posts for key announcements.</p>
            </div>
          )}

          {activeTab === "sens" && (
            <div>
              <h2 className="text-xl font-bold mb-4">SENS/RNS Draft</h2>
              <p className="text-gray-400 text-sm">AI-drafted regulatory announcement for review.</p>
            </div>
          )}

          {activeTab === "certificate" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Blockchain Disclosure Certificate</h2>
              <p className="text-gray-400 text-sm">SHA-256 hash-chained audit certificate for this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
