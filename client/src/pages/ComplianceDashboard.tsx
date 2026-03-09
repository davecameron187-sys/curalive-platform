import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface ComplianceMetrics {
  totalRedactions: number;
  approvedRedactions: number;
  pendingRedactions: number;
  rejectedRedactions: number;
  approvalRate: number;
  averageReviewTime: number;
  redactionsByType: Record<string, number>;
  redactionsTrend: Array<{ date: string; count: number }>;
  topOperators: Array<{ name: string; count: number }>;
  riskDistribution: Array<{ risk: string; count: number }>;
}

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [conferenceId, setConferenceId] = useState<number>(1);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // In production, call tRPC endpoint to fetch compliance metrics
      const mockMetrics: ComplianceMetrics = {
        totalRedactions: 156,
        approvedRedactions: 142,
        pendingRedactions: 8,
        rejectedRedactions: 6,
        approvalRate: 91,
        averageReviewTime: 4.2,
        redactionsByType: {
          financial: 52,
          personal: 38,
          confidential: 35,
          legal: 22,
          medical: 9,
        },
        redactionsTrend: [
          { date: "Mon", count: 12 },
          { date: "Tue", count: 19 },
          { date: "Wed", count: 15 },
          { date: "Thu", count: 25 },
          { date: "Fri", count: 22 },
          { date: "Sat", count: 18 },
          { date: "Sun", count: 14 },
        ],
        topOperators: [
          { name: "Alice Johnson", count: 45 },
          { name: "Bob Smith", count: 38 },
          { name: "Carol Davis", count: 32 },
          { name: "David Wilson", count: 28 },
          { name: "Eve Martinez", count: 13 },
        ],
        riskDistribution: [
          { risk: "High", count: 28 },
          { risk: "Medium", count: 85 },
          { risk: "Low", count: 43 },
        ],
      };
      setMetrics(mockMetrics);
      toast.success("Metrics loaded successfully");
    } catch (error) {
      toast.error("Failed to load compliance metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [conferenceId]);

  const handleExportReport = async () => {
    try {
      const report = {
        conferenceId,
        generatedAt: new Date().toISOString(),
        metrics,
        dateRange,
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${conferenceId}-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Compliance Dashboard</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading compliance metrics...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Compliance Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and audit trail for content redactions
            </p>
          </div>
          <Button onClick={handleExportReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Conference Selection & Date Range */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Conference ID</label>
              <Input
                type="number"
                value={conferenceId}
                onChange={(e) => setConferenceId(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadMetrics} className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Redactions</p>
                <p className="text-3xl font-bold">{metrics.totalRedactions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{metrics.approvedRedactions}</p>
                <p className="text-xs text-green-600 mt-1">{metrics.approvalRate}% approval rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-amber-600">{metrics.pendingRedactions}</p>
                <p className="text-xs text-amber-600 mt-1">Avg {metrics.averageReviewTime}h review time</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{metrics.rejectedRedactions}</p>
                <p className="text-xs text-red-600 mt-1">{((metrics.rejectedRedactions / metrics.totalRedactions) * 100).toFixed(1)}% rejection rate</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="types">By Type</TabsTrigger>
            <TabsTrigger value="operators">Top Operators</TabsTrigger>
            <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
          </TabsList>

          {/* Trends Chart */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Redactions Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.redactionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    name="Redactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* By Type Chart */}
          <TabsContent value="types" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Redactions by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(metrics.redactionsByType).map(([type, count]) => ({
                    type: type.charAt(0).toUpperCase() + type.slice(1),
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Top Operators */}
          <TabsContent value="operators" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Operators</h3>
              <div className="space-y-3">
                {metrics.topOperators.map((operator, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{operator.name}</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(operator.count / metrics.topOperators[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Badge className="ml-4">{operator.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Risk Distribution */}
          <TabsContent value="risk" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ risk, count }) => `${risk}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.riskDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Compliance Alerts */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Compliance Alerts</h3>
          <div className="space-y-3">
            {metrics.pendingRedactions > 5 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {metrics.pendingRedactions} redactions pending review. Review time may exceed SLA.
                </AlertDescription>
              </Alert>
            )}
            {metrics.approvalRate < 85 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Approval rate is {metrics.approvalRate}%. Consider reviewing rejection reasons.
                </AlertDescription>
              </Alert>
            )}
            {metrics.rejectedRedactions > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {metrics.rejectedRedactions} redactions were rejected. Review audit trail for details.
                </AlertDescription>
              </Alert>
            )}
            {metrics.approvalRate >= 85 && metrics.pendingRedactions <= 5 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All compliance metrics are within acceptable ranges.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
