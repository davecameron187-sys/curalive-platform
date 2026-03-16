/**
 * Multi-Location Analytics Dashboard
 * Compare network performance across event locations
 * Round 62 Features
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
} from "lucide-react";

interface LocationMetrics {
  kioskId: string;
  location: string;
  avgLatency: number;
  avgBandwidth: number;
  avgSignalStrength: number;
  onlinePercentage: number;
  failoverCount: number;
  connectionStability: number;
  rank: number;
}

interface LocationComparison {
  metric: string;
  best: LocationMetrics;
  worst: LocationMetrics;
  average: number;
}

export default function MultiLocationAnalytics() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const [locations, setLocations] = useState<LocationMetrics[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("avgLatency");
  const [dateRange, setDateRange] = useState({
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(),
  });

  // Fetch event metrics
  const { data: eventMetrics, isLoading } =
    trpc.networkAnalytics.getEventMetrics.useQuery(
      eventId
        ? {
            eventId,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
          }
        : undefined,
      { enabled: !!eventId }
    );

  // Process metrics into location data
  useEffect(() => {
    if (eventMetrics && Array.isArray(eventMetrics)) {
      const processed = eventMetrics
        .map((metric: any, index: number) => ({
          kioskId: metric.kioskId,
          location: `Location ${index + 1}`,
          avgLatency: Number(metric.avgLatency) || 0,
          avgBandwidth: Number(metric.avgBandwidth) || 0,
          avgSignalStrength: Number(metric.avgSignalStrength) || 0,
          onlinePercentage: Number(metric.onlinePercentage) || 0,
          failoverCount: 0,
          connectionStability: 85,
          rank: 0,
        }))
        .sort((a: any, b: any) => {
          if (selectedMetric === "avgLatency") {
            return a.avgLatency - b.avgLatency;
          } else if (selectedMetric === "avgBandwidth") {
            return b.avgBandwidth - a.avgBandwidth;
          }
          return 0;
        })
        .map((loc: any, index: number) => ({
          ...loc,
          rank: index + 1,
        }));

      setLocations(processed);
    }
  }, [eventMetrics, selectedMetric]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const metrics = [
    { key: "avgLatency", label: "Avg Latency (ms)", unit: "ms" },
    { key: "avgBandwidth", label: "Avg Bandwidth (Mbps)", unit: "Mbps" },
    { key: "avgSignalStrength", label: "Signal Strength (%)", unit: "%" },
    { key: "onlinePercentage", label: "Online Time (%)", unit: "%" },
    { key: "connectionStability", label: "Stability Score", unit: "pts" },
  ];

  const handleExport = () => {
    const csv = [
      "Location,Avg Latency (ms),Avg Bandwidth (Mbps),Signal Strength (%),Online (%),Rank",
      ...locations.map(
        (loc) =>
          `${loc.location},${loc.avgLatency.toFixed(2)},${loc.avgBandwidth.toFixed(2)},${loc.avgSignalStrength.toFixed(2)},${loc.onlinePercentage.toFixed(2)},${loc.rank}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multi-location-analytics-${new Date().toISOString()}.csv`;
    a.click();
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
            <h1 className="text-3xl font-bold">Multi-Location Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Compare network performance across event locations
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Enter Event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            />

            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            >
              {metrics.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Performance Ranking */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Performance Ranking
          </h3>
          <div className="space-y-2">
            {locations.map((loc, index) => (
              <div
                key={loc.kioskId}
                className="flex items-center justify-between p-3 bg-secondary rounded border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">
                    #{loc.rank}
                  </span>
                  <div>
                    <p className="font-semibold">{loc.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {loc.kioskId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {selectedMetric === "avgLatency"
                      ? `${loc.avgLatency.toFixed(0)}ms`
                      : selectedMetric === "avgBandwidth"
                        ? `${loc.avgBandwidth.toFixed(1)}Mbps`
                        : selectedMetric === "avgSignalStrength"
                          ? `${loc.avgSignalStrength.toFixed(0)}%`
                          : selectedMetric === "onlinePercentage"
                            ? `${loc.onlinePercentage.toFixed(1)}%`
                            : `${loc.connectionStability}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Best
                      </span>
                    ) : index === locations.length - 1 ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Needs attention
                      </span>
                    ) : (
                      "Average"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart Comparison */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Metric Comparison</h3>
            {locations.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey={selectedMetric}
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  >
                    {locations.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Scatter Plot: Latency vs Bandwidth */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Latency vs Bandwidth</h3>
            {locations.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="avgLatency" name="Latency (ms)" />
                  <YAxis dataKey="avgBandwidth" name="Bandwidth (Mbps)" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    name="Locations"
                    data={locations}
                    fill="#3b82f6"
                    shape="circle"
                  >
                    {locations.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.length > 0 && (
              <>
                <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Best Performer</p>
                  <p className="font-semibold text-green-500">
                    {locations[0].location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMetric === "avgLatency"
                      ? `${locations[0].avgLatency.toFixed(0)}ms latency`
                      : `${locations[0].avgBandwidth.toFixed(1)}Mbps bandwidth`}
                  </p>
                </div>

                <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="font-semibold text-red-500">
                    {locations[locations.length - 1].location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMetric === "avgLatency"
                      ? `${locations[locations.length - 1].avgLatency.toFixed(0)}ms latency`
                      : `${locations[locations.length - 1].avgBandwidth.toFixed(1)}Mbps bandwidth`}
                  </p>
                </div>

                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="font-semibold text-blue-500">
                    {(
                      locations.reduce(
                        (sum, loc) =>
                          sum +
                          (selectedMetric === "avgLatency"
                            ? loc.avgLatency
                            : loc.avgBandwidth),
                        0
                      ) / locations.length
                    ).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMetric === "avgLatency" ? "ms" : "Mbps"}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Empty State */}
        {!eventId ? (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Enter an event ID to view multi-location analytics
            </p>
          </Card>
        ) : isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-muted-foreground border-t-foreground rounded-full" />
            <p className="text-muted-foreground mt-4">Loading analytics...</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
