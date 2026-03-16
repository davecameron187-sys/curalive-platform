/**
 * Root Cause Analysis Dashboard
 * Round 63 Features
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
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
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Wrench,
} from "lucide-react";

interface RootCauseAnalysis {
  id: number;
  rootCause: string;
  confidence: number;
  remediation?: string;
  isVerified: boolean;
  createdAt: Date;
}

interface AlertStatistics {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: Record<string, number>;
  resolved: number;
  unresolved: number;
  resolutionRate: number;
}

export default function RootCauseAnalysisDashboard() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const [kioskId, setKioskId] = useState<string>("");
  const [analyses, setAnalyses] = useState<RootCauseAnalysis[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<RootCauseAnalysis | null>(null);

  // Fetch recent analyses
  const { data: fetchedAnalyses } =
    trpc.rootCauseAnalysis.getRecent.useQuery(
      eventId && kioskId ? { eventId, kioskId, limit: 20 } : undefined,
      { enabled: !!eventId && !!kioskId }
    );

  // Fetch statistics
  const { data: fetchedStats } =
    trpc.rootCauseAnalysis.getStatistics.useQuery(
      eventId && kioskId
        ? {
            eventId,
            kioskId,
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(),
          }
        : undefined,
      { enabled: !!eventId && !!kioskId }
    );

  // Verify analysis mutation
  const verifyMutation = trpc.rootCauseAnalysis.verifyAnalysis.useMutation({
    onSuccess: () => {
      // Refetch data
      if (fetchedAnalyses) {
        setAnalyses(fetchedAnalyses as RootCauseAnalysis[]);
      }
    },
  });

  useEffect(() => {
    if (fetchedAnalyses) {
      setAnalyses(fetchedAnalyses as RootCauseAnalysis[]);
    }
  }, [fetchedAnalyses]);

  useEffect(() => {
    if (fetchedStats) {
      setStatistics(fetchedStats as AlertStatistics);
    }
  }, [fetchedStats]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const severityData = statistics
    ? [
        { name: "Low", value: statistics.bySeverity.low },
        { name: "Medium", value: statistics.bySeverity.medium },
        { name: "High", value: statistics.bySeverity.high },
        { name: "Critical", value: statistics.bySeverity.critical },
      ]
    : [];

  const typeData = statistics
    ? Object.entries(statistics.byType).map(([type, count]) => ({
        name: type.replace(/_/g, " "),
        value: count,
      }))
    : [];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Root Cause Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Automated diagnosis and remediation suggestions
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            />
            <input
              type="text"
              placeholder="Kiosk ID"
              value={kioskId}
              onChange={(e) => setKioskId(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            />
          </div>
        </Card>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold mt-2">{statistics.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-500 mt-2">
                {statistics.resolved}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Unresolved</p>
              <p className="text-2xl font-bold text-red-500 mt-2">
                {statistics.unresolved}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
              <p className="text-2xl font-bold text-blue-500 mt-2">
                {statistics.resolutionRate.toFixed(1)}%
              </p>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Severity Distribution</h3>
            {severityData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Alert Types */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Alert Types</h3>
            {typeData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recent Root Cause Analyses
          </h3>

          {selectedAnalysis ? (
            <div className="space-y-4">
              <Button
                onClick={() => setSelectedAnalysis(null)}
                variant="outline"
                size="sm"
              >
                ← Back to List
              </Button>

              <div className="bg-secondary p-4 rounded border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedAnalysis.rootCause}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence:{" "}
                      <span className="font-semibold">
                        {(selectedAnalysis.confidence * 100).toFixed(0)}%
                      </span>
                    </p>
                  </div>
                  {selectedAnalysis.isVerified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {selectedAnalysis.remediation && (
                  <div className="mt-4 p-3 bg-background rounded border border-border">
                    <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4" />
                      Recommended Remediation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAnalysis.remediation}
                    </p>
                  </div>
                )}

                {!selectedAnalysis.isVerified && (
                  <Button
                    onClick={() =>
                      verifyMutation.mutate({ analysisId: selectedAnalysis.id })
                    }
                    size="sm"
                    className="mt-4"
                  >
                    Verify Analysis
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.length === 0 ? (
                <p className="text-muted-foreground">No analyses available</p>
              ) : (
                analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => setSelectedAnalysis(analysis)}
                    className="p-3 bg-secondary rounded border border-border cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {analysis.isVerified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <div>
                          <p className="font-semibold text-sm">
                            {analysis.rootCause}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confidence: {(analysis.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
