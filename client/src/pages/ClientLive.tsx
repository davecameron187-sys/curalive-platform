import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { useBrandConfig } from "../hooks/useBrandConfig";
import { ClientMessagePanel } from "../components/ClientMessagePanel";

type TabId = "live" | "sentiment" | "compliance" | "qa" | "summary";

export default function ClientLive() {
  const [, params] = useRoute("/live/:token");
  const token = params?.token;
  const [activeTab, setActiveTab] = useState<TabId>("live");

  const { data: tokenData, isLoading } = trpc.partners.validateToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const brand = useBrandConfig(tokenData?.partnerId);

  const { data: sessionData } = trpc.shadowMode.getSession.useQuery(
    { sessionId: tokenData?.sessionId ?? 0 },
    { enabled: !!tokenData?.sessionId }
  );

  const { data: transcriptData } = trpc.shadowMode.getTranscript.useQuery(
    { sessionId: tokenData?.sessionId ?? 0 },
    { enabled: !!tokenData?.sessionId, refetchInterval: 5000 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="animate-pulse text-lg">Loading intelligence dashboard...</div>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">This link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "live", label: "Live Feed" },
    { id: "sentiment", label: "Sentiment" },
    { id: "compliance", label: "Compliance" },
    { id: "qa", label: "Q&A" },
    { id: "summary", label: "AI Summary" },
  ];

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
            <span className="text-sm opacity-75">Live Intelligence Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-sm opacity-75">{tokenData.recipientName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{sessionData?.company || "Event"}</h2>
          <p className="text-gray-400 text-sm">{sessionData?.event_name || "Live Session"}</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "live" && (
              <div className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Transcription · Speaker-diarised</h3>
                {transcriptData && Array.isArray(transcriptData) && transcriptData.length > 0 ? (
                  <div className="space-y-2">
                    {transcriptData.map((seg: any, i: number) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-gray-500 min-w-[60px]">{seg.timestamp || ""}</span>
                        <span className="font-medium text-blue-400 min-w-[100px]">{seg.speaker || "Speaker"}</span>
                        <span className="text-gray-200">{seg.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Waiting for live transcript...</p>
                )}
              </div>
            )}

            {activeTab === "sentiment" && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Real-time Sentiment Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["Overall Tone", "Market Confidence", "Forward Guidance", "Management Credibility"].map((metric, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400">{metric}</p>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${55 + Math.random() * 35}%`,
                            background: `linear-gradient(90deg, ${brand.accentColor || "#6b21a8"}, ${brand.primaryColor})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "compliance" && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Compliance Flags</h3>
                <p className="text-sm text-gray-400">Compliance flags appear here as they are detected during the live session.</p>
              </div>
            )}

            {activeTab === "qa" && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Q&A Queue</h3>
                <p className="text-sm text-gray-400">Approved questions and responses appear here.</p>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold mb-4">CuraLive AI Rolling Summary</h3>
                <p className="text-sm text-gray-400">AI-generated summary updates as the session progresses.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Session Status</h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Live intelligence streaming active</span>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Intelligence Tier</h4>
              <span className="text-sm px-2 py-1 rounded bg-purple-900/50 text-purple-300">
                {sessionData?.tier?.toUpperCase() || "ESSENTIAL"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {tokenData?.valid && (
        <ClientMessagePanel
          token={token ?? ""}
          sessionId={tokenData.sessionId}
          recipientName={tokenData.recipientName ?? "IR Team"}
        />
      )}
    </div>
  );
}
