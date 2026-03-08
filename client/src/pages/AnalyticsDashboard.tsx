import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AnalyticsDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Fetch all content type performance
  const { data: contentTypePerformance, isLoading: isLoadingTypes } =
    trpc.analytics.getAllContentTypePerformance.useQuery();

  // Fetch event analytics
  const { data: eventAnalytics, isLoading: isLoadingEvent } =
    trpc.analytics.getEventAnalytics.useQuery(
      { eventId: selectedEventId || 0 },
      { enabled: !!selectedEventId }
    );

  // Fetch event report
  const { data: eventReport, isLoading: isLoadingReport } =
    trpc.analytics.generateEventReport.useQuery(
      { eventId: selectedEventId || 0 },
      { enabled: !!selectedEventId }
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Please log in to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Content Performance Analytics</h1>
          <p className="text-muted-foreground">
            Track approval rates, engagement metrics, and content effectiveness
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6 flex gap-2">
          {(["week", "month", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
            >
              {range === "week" ? "Last 7 Days" : range === "month" ? "Last 30 Days" : "All Time"}
            </Button>
          ))}
        </div>

        {/* Content Type Performance Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Content Type Performance</h2>

          {isLoadingTypes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !contentTypePerformance || contentTypePerformance.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No content type data available yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentTypePerformance.map((type) => (
                <Card key={type.contentType} className="p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg capitalize">
                        {type.contentType.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Rank #{type.performanceRank}
                      </p>
                    </div>
                    {type.trendDirection === "improving" ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : type.trendDirection === "declining" ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 text-yellow-500">→</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Approval Rate</span>
                        <span className="font-semibold">
                          {(type.approvalRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${type.approvalRate * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Avg Open Rate</span>
                        <span className="font-semibold">
                          {(type.avgOpenRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${type.avgOpenRate * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Avg Click Rate</span>
                        <span className="font-semibold">
                          {(type.avgClickThroughRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${type.avgClickThroughRate * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Quality Score: </span>
                        <span className="font-semibold">
                          {(type.avgQualityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Generated: </span>
                        <span className="font-semibold">{type.totalGenerated}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Event Analytics Section */}
        {selectedEventId && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Event Performance Report</h2>

            {isLoadingEvent || isLoadingReport ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !eventAnalytics ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No event analytics available</p>
              </Card>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Content Generated</p>
                    <p className="text-3xl font-bold">{eventAnalytics.contentItemsGenerated}</p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                    <p className="text-3xl font-bold">
                      {(eventAnalytics.overallApprovalRate * 100).toFixed(0)}%
                    </p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Engagements</p>
                    <p className="text-3xl font-bold">{eventAnalytics.totalEngagements}</p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Avg Quality</p>
                    <p className="text-3xl font-bold">
                      {(eventAnalytics.avgContentQuality * 100).toFixed(0)}%
                    </p>
                  </Card>
                </div>

                {/* Best and Worst Performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-6 border-green-500/20 bg-green-500/5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Best Performing
                    </h3>
                    <p className="text-2xl font-bold capitalize mb-2">
                      {eventAnalytics.bestPerformingType?.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Highest engagement and approval rates
                    </p>
                  </Card>

                  <Card className="p-6 border-red-500/20 bg-red-500/5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      Needs Improvement
                    </h3>
                    <p className="text-2xl font-bold capitalize mb-2">
                      {eventAnalytics.worstPerformingType?.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Consider optimizing this content type
                    </p>
                  </Card>
                </div>

                {/* Improvement Areas */}
                {eventReport?.improvementAreas && eventReport.improvementAreas.length > 0 && (
                  <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                    <h3 className="font-semibold mb-4">Improvement Opportunities</h3>
                    <ul className="space-y-2">
                      {eventReport.improvementAreas.map((area, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Export Analytics */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline">Export as CSV</Button>
          <Button variant="outline">Export as PDF</Button>
        </div>
      </div>
    </div>
  );
}
