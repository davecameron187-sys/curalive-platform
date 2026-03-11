import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { BarChart2, Shield, Activity, Database, ChevronLeft, AlertCircle } from "lucide-react";

const SENTIMENT_COLOR = (score: number | null) => {
  if (score == null) return "bg-gray-600";
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const RISK_COLOR: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  earnings_call: "Earnings Call",
  agm: "AGM",
  capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall",
  board_meeting: "Board Meeting",
  webcast: "Webcast",
  other: "Other",
};

function BarRow({ label, value, maxValue, color, suffix = "" }: {
  label: string; value: number; maxValue: number; color: string; suffix?: string;
}) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-40 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-white w-16 text-right shrink-0">{value}{suffix}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: any; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-widest mb-1">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function Benchmarks() {
  const goBack = useSmartBack("/operator-links");
  const { data, isLoading, error } = trpc.benchmarks.getStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const total = data?.totals.total ?? 0;
  const maxEventTypeCount = Math.max(...(data?.byEventType.map(r => r.count) ?? [1]), 1);
  const maxEngagementCount = Math.max(...(data?.byEngagement.map(r => r.count) ?? [1]), 1);
  const maxComplianceCount = Math.max(...(data?.byCompliance.map(r => r.count) ?? [1]), 1);
  const maxSentimentBandCount = Math.max(...(data?.bySentimentBand.map(r => r.count) ?? [1]), 1);
  const maxQuarterCount = Math.max(...(data?.byQuarter.map(r => r.count) ?? [1]), 1);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={goBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-primary" />
          <span className="font-semibold text-lg">Industry Intelligence</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Anonymized Dataset</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        <div className="flex items-start gap-3 bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <Shield size={16} className="text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-gray-400 leading-relaxed">
            All data in this dashboard has been fully anonymized. No client names, company names, speaker names, event titles, specific financial figures, or identifiable information of any kind is stored here. Data is contributed automatically whenever a Shadow Mode session ends or an archive transcript is processed, and is aggregated across all events on the platform.
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-20 text-gray-500">Loading anonymized dataset...</div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
            <AlertCircle size={16} /> Failed to load benchmarks. The dataset table may still be initializing.
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Database} label="Events in Dataset" value={total} sub="anonymized records" />
              <StatCard
                icon={Activity}
                label="Avg Sentiment"
                value={data.totals.avgSentiment != null ? `${data.totals.avgSentiment}/100` : "—"}
                sub="across all event types"
              />
              <StatCard icon={BarChart2} label="Live Sessions" value={data.totals.liveCount} sub="from Shadow Mode" />
              <StatCard icon={BarChart2} label="Archive Uploads" value={data.totals.archiveCount} sub="from transcript uploads" />
            </div>

            {total === 0 ? (
              <div className="text-center py-16 text-gray-500 border border-gray-800 rounded-xl">
                <Database size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-gray-400">No data yet</p>
                <p className="text-sm mt-1">
                  The dataset grows automatically. Process your first archive upload or complete a Shadow Mode session to contribute the first anonymized record.
                </p>
              </div>
            ) : (
              <>
                {data.byEventType.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <div>
                      <h2 className="font-semibold text-white">Events by Type</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Distribution of event types across anonymized dataset</p>
                    </div>
                    <div className="space-y-3">
                      {data.byEventType.map(r => (
                        <div key={r.eventType} className="space-y-1">
                          <BarRow
                            label={EVENT_TYPE_LABEL[r.eventType] ?? r.eventType}
                            value={r.count}
                            maxValue={maxEventTypeCount}
                            color="bg-primary"
                          />
                          {r.avgSentiment != null && (
                            <div className="flex items-center gap-2 pl-40 ml-3">
                              <div className={`h-1.5 rounded-full ${SENTIMENT_COLOR(r.avgSentiment)}`} style={{ width: `${r.avgSentiment}%`, maxWidth: "160px" }} />
                              <span className="text-xs text-gray-500">avg sentiment {r.avgSentiment}/100</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.bySentimentBand.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                      <div>
                        <h2 className="font-semibold text-white">Sentiment Distribution</h2>
                        <p className="text-xs text-gray-500 mt-0.5">AI-scored investor sentiment across all events</p>
                      </div>
                      <div className="space-y-3">
                        {data.bySentimentBand.map(r => (
                          <BarRow
                            key={r.band}
                            label={r.band}
                            value={r.count}
                            maxValue={maxSentimentBandCount}
                            color={r.band.startsWith("Pos") ? "bg-green-500" : r.band.startsWith("Neu") ? "bg-yellow-500" : r.band === "Unknown" ? "bg-gray-600" : "bg-red-500"}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.byCompliance.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                      <div>
                        <h2 className="font-semibold text-white">Compliance Risk Profile</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Distribution of compliance keyword density</p>
                      </div>
                      <div className="space-y-3">
                        {data.byCompliance.map(r => (
                          <BarRow
                            key={r.risk}
                            label={r.risk.charAt(0).toUpperCase() + r.risk.slice(1)}
                            value={r.count}
                            maxValue={maxComplianceCount}
                            color={RISK_COLOR[r.risk] ?? "bg-gray-500"}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.byEngagement.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                      <div>
                        <h2 className="font-semibold text-white">Engagement Level</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Based on transcript segment density per event</p>
                      </div>
                      <div className="space-y-3">
                        {data.byEngagement.map(r => (
                          <BarRow
                            key={r.level}
                            label={r.level.charAt(0).toUpperCase() + r.level.slice(1)}
                            value={r.count}
                            maxValue={maxEngagementCount}
                            color={r.level === "high" ? "bg-green-500" : r.level === "medium" ? "bg-yellow-500" : "bg-gray-500"}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.byQuarter.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                      <div>
                        <h2 className="font-semibold text-white">Coverage by Quarter</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Event periods represented in the dataset</p>
                      </div>
                      <div className="space-y-3">
                        {data.byQuarter.map(r => (
                          <BarRow
                            key={r.quarter}
                            label={r.quarter ?? "Unknown"}
                            value={r.count}
                            maxValue={maxQuarterCount}
                            color="bg-blue-500"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
