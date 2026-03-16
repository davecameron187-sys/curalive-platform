/**
 * Network Analytics Dashboard
 * Visualize failover patterns, connection stability, and performance metrics
 * Round 61 Features
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Wifi,
  Signal,
} from "lucide-react";

interface DateRange {
  startTime: Date;
  endTime: Date;
}

export default function NetworkAnalyticsDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endTime: new Date(),
  });
  const [selectedKiosk, setSelectedKiosk] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Fetch analytics data
  const { data: failoverStats, isLoading: failoverLoading } =
    trpc.networkAnalytics.getFailoverStats.useQuery(
      selectedKiosk && selectedEvent
        ? {
            kioskId: selectedKiosk,
            eventId: selectedEvent,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
          }
        : undefined,
      { enabled: !!selectedKiosk && !!selectedEvent }
    );

  const { data: averageMetrics, isLoading: metricsLoading } =
    trpc.networkAnalytics.getAverageMetrics.useQuery(
      selectedKiosk && selectedEvent
        ? {
            kioskId: selectedKiosk,
            eventId: selectedEvent,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
          }
        : undefined,
      { enabled: !!selectedKiosk && !!selectedEvent }
    );

  const { data: networkDistribution } =
    trpc.networkAnalytics.getNetworkTypeDistribution.useQuery(
      selectedKiosk && selectedEvent
        ? {
            kioskId: selectedKiosk,
            eventId: selectedEvent,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
          }
        : undefined,
      { enabled: !!selectedKiosk && !!selectedEvent }
    );

  const { data: qualityDistribution } =
    trpc.networkAnalytics.getConnectionQualityDistribution.useQuery(
      selectedKiosk && selectedEvent
        ? {
            kioskId: selectedKiosk,
            eventId: selectedEvent,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
          }
        : undefined,
      { enabled: !!selectedKiosk && !!selectedEvent }
    );

  const { data: anomalies } =
    trpc.networkAnalytics.getActiveAnomalies.useQuery(
      selectedKiosk && selectedEvent
        ? {
            kioskId: selectedKiosk,
            eventId: selectedEvent,
          }
        : undefined,
      { enabled: !!selectedKiosk && !!selectedEvent }
    );

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleDateRangeChange = (days: number) => {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({ startTime, endTime });
  };

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    console.log("Exporting analytics data...");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Network Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor failover patterns and connection stability across kiosks
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={
                  dateRange.startTime.getTime() ===
                  new Date(Date.now() - 24 * 60 * 60 * 1000).getTime()
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleDateRangeChange(1)}
              >
                24h
              </Button>
              <Button
                variant={
                  dateRange.startTime.getTime() ===
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleDateRangeChange(7)}
              >
                7d
              </Button>
              <Button
                variant={
                  dateRange.startTime.getTime() ===
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime()
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleDateRangeChange(30)}
              >
                30d
              </Button>
            </div>

            <div className="flex-1 flex gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.startTime.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      startTime: new Date(e.target.value),
                    })
                  }
                  className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateRange.endTime.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      endTime: new Date(e.target.value),
                    })
                  }
                  className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>

            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Key Metrics */}
        {averageMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-2xl font-bold">
                    {Math.round(Number(averageMetrics.avgLatency))}ms
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Bandwidth</p>
                  <p className="text-2xl font-bold">
                    {Number(averageMetrics.avgBandwidth).toFixed(1)} Mbps
                  </p>
                </div>
                <Signal className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Signal Strength
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(Number(averageMetrics.avgSignalStrength))}%
                  </p>
                </div>
                <Wifi className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online %</p>
                  <p className="text-2xl font-bold">
                    {averageMetrics.onlineCount &&
                    averageMetrics.totalCount
                      ? Math.round(
                          (Number(averageMetrics.onlineCount) /
                            Number(averageMetrics.totalCount)) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Failover Statistics */}
          {failoverStats && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Failover Events</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Failovers
                  </span>
                  <span className="font-semibold">
                    {failoverStats.totalFailovers || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    WiFi → Cellular
                  </span>
                  <span className="font-semibold">
                    {failoverStats.wifiToCellular || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cellular → WiFi
                  </span>
                  <span className="font-semibold">
                    {failoverStats.cellularToWifi || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Avg Improvement
                  </span>
                  <span className="font-semibold">
                    {failoverStats.avgLatencyImprovement
                      ? Math.round(
                          Number(failoverStats.avgLatencyImprovement)
                        )
                      : 0}
                    ms
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Network Type Distribution */}
          {networkDistribution && networkDistribution.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Network Type Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={networkDistribution.map((d: any) => ({
                      name: d.networkType,
                      value: Number(d.count),
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {networkDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Connection Quality Distribution */}
        {qualityDistribution && qualityDistribution.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Connection Quality</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={qualityDistribution.map((d: any) => ({
                  quality: d.quality,
                  count: Number(d.count),
                  percentage: Number(d.percentage),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quality" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Active Anomalies */}
        {anomalies && anomalies.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Active Anomalies</h3>
            </div>
            <div className="space-y-2">
              {anomalies.map((anomaly: any) => (
                <div
                  key={anomaly.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded border border-border"
                >
                  <div>
                    <p className="font-semibold text-sm">{anomaly.anomalyType}</p>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        anomaly.severity === "critical"
                          ? "bg-red-500/20 text-red-500"
                          : anomaly.severity === "high"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!selectedKiosk || !selectedEvent ? (
          <Card className="p-8 text-center">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a kiosk and event to view analytics
            </p>
          </Card>
        ) : failoverLoading || metricsLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-muted-foreground border-t-foreground rounded-full" />
            <p className="text-muted-foreground mt-4">Loading analytics...</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
