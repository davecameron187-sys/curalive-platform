// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Activity,
  BarChart3,
  MessageSquare,
  Zap,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MutingControlPanel } from "@/components/MutingControlPanel";
import { useState, useEffect } from "react";

interface DashboardMetrics {
  totalViolations: number;
  criticalViolations: number;
  highViolations: number;
  averageConfidence: number;
  topSpeaker: { name: string; violations: number };
  topViolationType: { type: string; count: number };
  violationTrend: { time: string; count: number }[];
  sentimentTrend: { time: string; score: number }[];
  speakerEngagement: { speaker: string; engagement: number }[];
}

interface LiveAlert {
  id: number;
  violationType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidenceScore: number;
  speakerName: string;
  transcriptExcerpt: string;
  detectedAt: string;
  acknowledged: boolean;
}

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

const VIOLATION_TYPE_ICONS: Record<string, React.ReactNode> = {
  abuse: "🚫",
  forward_looking: "📈",
  price_sensitive: "💰",
  insider_info: "🔒",
  policy_breach: "⚠️",
  profanity: "🤐",
  harassment: "😠",
  misinformation: "❌",
};

export function OperatorDashboard() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch live violations
  const { data: violations, refetch: refetchViolations } = trpc.aiAm.getEventViolations.useQuery(
    { eventId, limit: 100 },
    { enabled: !!eventId && isLive, refetchInterval }
  );

  // Fetch dashboard metrics
  const { data: dashboardMetrics } = trpc.aiAm.getEventMetrics.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  // Auto-refresh metrics
  useEffect(() => {
    if (!eventId || !isLive) return;

    const interval = setInterval(() => {
      refetchViolations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [eventId, isLive, refreshInterval, refetchViolations]);

  // Update local state when data changes
  useEffect(() => {
    if (violations) {
      setLiveAlerts(violations);
    }
  }, [violations]);

  useEffect(() => {
    if (dashboardMetrics) {
      setMetrics(dashboardMetrics);
    }
  }, [dashboardMetrics]);

  const unacknowledgedCount = liveAlerts.filter((a) => !a.acknowledged).length;
  const criticalCount = liveAlerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Operator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time compliance monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchViolations()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Badge variant={isLive ? "default" : "secondary"} className="gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {isLive ? "LIVE" : "PAUSED"}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.totalViolations || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.violationTrend?.[metrics.violationTrend.length - 1]?.count || 0} in last
                minute
              </p>
            </CardContent>
          </Card>

          <Card className={criticalCount > 0 ? "border-red-500 bg-red-50" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${criticalCount > 0 ? "text-red-600" : ""}`}>
                {criticalCount}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {unacknowledgedCount} unacknowledged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics?.averageConfidence ? `${(metrics.averageConfidence * 100).toFixed(0)}%` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Detection accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Speaker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{metrics?.topSpeaker?.name || "—"}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.topSpeaker?.violations || 0} violations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Live Alerts
            </TabsTrigger>
            <TabsTrigger value="muting" className="gap-2">
              <Zap className="w-4 h-4" />
              Muting Control
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="speakers" className="gap-2">
              <Users className="w-4 h-4" />
              Speakers
            </TabsTrigger>
          </TabsList>

          {/* Muting Control Tab */}
          <TabsContent value="muting" className="space-y-4">
            {eventId ? (
              <MutingControlPanel eventId={eventId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Muting Control</CardTitle>
                  <CardDescription>Select an event to manage speaker muting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No event selected</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Live Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Violation Feed</CardTitle>
                <CardDescription>Real-time compliance violations detected during event</CardDescription>
              </CardHeader>
              <CardContent>
                {liveAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No violations detected yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveAlerts.slice(0, 20).map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${SEVERITY_COLORS[alert.severity]}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {VIOLATION_TYPE_ICONS[alert.violationType] || "⚠️"}
                              </span>
                              <span className="font-semibold capitalize">
                                {alert.violationType.replace(/_/g, " ")}
                              </span>
                              <Badge variant="outline" className="ml-auto">
                                {(alert.confidenceScore * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-2">{alert.speakerName}</p>
                            <p className="text-sm opacity-90 italic">"{alert.transcriptExcerpt}"</p>
                            <p className="text-xs opacity-75 mt-2">
                              {new Date(alert.detectedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Acknowledge violation
                              console.log("Acknowledged violation:", alert.id);
                            }}
                            disabled={alert.acknowledged}
                          >
                            {alert.acknowledged ? "✓ Seen" : "Acknowledge"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Violation Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Violation Trend</CardTitle>
                  <CardDescription>Violations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.violationTrend?.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-12">{point.time}</span>
                        <div className="flex-1 bg-secondary rounded h-6 relative">
                          <div
                            className="bg-primary rounded h-full transition-all"
                            style={{
                              width: `${Math.min((point.count / 10) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{point.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Violation Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Violation Types</CardTitle>
                  <CardDescription>Distribution of violation categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: "forward_looking", count: 12 },
                      { type: "price_sensitive", count: 8 },
                      { type: "abuse", count: 3 },
                      { type: "profanity", count: 2 },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center gap-3">
                        <span className="text-lg">
                          {VIOLATION_TYPE_ICONS[item.type] || "⚠️"}
                        </span>
                        <span className="text-sm capitalize flex-1">
                          {item.type.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Trend</CardTitle>
                  <CardDescription>Audience sentiment over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.sentimentTrend?.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-12">{point.time}</span>
                        <div className="flex-1 bg-secondary rounded h-6 relative">
                          <div
                            className={`rounded h-full transition-all ${
                              point.score > 0.5 ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.abs(point.score) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12">
                          {(point.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                  <CardDescription>Event summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Response Time</span>
                    <span className="font-semibold">2.3 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Operator Actions</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mute Events</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compliance Score</span>
                    <span className="font-semibold text-green-600">92%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Speakers Tab */}
          <TabsContent value="speakers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Speaker Engagement & Violations</CardTitle>
                <CardDescription>Per-speaker metrics and violation history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.speakerEngagement?.map((speaker) => (
                    <div key={speaker.speaker} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{speaker.speaker}</h4>
                        <Badge variant="outline">
                          {(speaker.engagement * 100).toFixed(0)}% engaged
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${speaker.engagement * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                        <span>Violations: {liveAlerts.filter((a) => a.speakerName === speaker.speaker).length}</span>
                        <span>Speaking Time: 12:34</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default OperatorDashboard;
