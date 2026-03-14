import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Download,
  Settings,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityTrend {
  date: number;
  vulnerabilities: number;
  threats: number;
  complianceScore: number;
  incidentCount: number;
}

interface PredictiveMetric {
  metric: string;
  current: number;
  predicted30Days: number;
  trend: "up" | "down" | "stable";
  confidence: number;
}

interface KPICard {
  title: string;
  value: number | string;
  unit: string;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  status: "good" | "warning" | "critical";
}

export default function DashboardAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetrics, setSelectedMetrics] = useState([
    "vulnerabilities",
    "threats",
    "compliance",
  ]);

  const [trends] = useState<SecurityTrend[]>([
    {
      date: Date.now() - 2592000000,
      vulnerabilities: 45,
      threats: 12,
      complianceScore: 88,
      incidentCount: 3,
    },
    {
      date: Date.now() - 2505600000,
      vulnerabilities: 42,
      threats: 14,
      complianceScore: 89,
      incidentCount: 2,
    },
    {
      date: Date.now() - 2419200000,
      vulnerabilities: 38,
      threats: 11,
      complianceScore: 91,
      incidentCount: 1,
    },
    {
      date: Date.now() - 2332800000,
      vulnerabilities: 35,
      threats: 9,
      complianceScore: 92,
      incidentCount: 2,
    },
    {
      date: Date.now() - 2246400000,
      vulnerabilities: 32,
      threats: 10,
      complianceScore: 93,
      incidentCount: 1,
    },
    {
      date: Date.now() - 2160000000,
      vulnerabilities: 28,
      threats: 8,
      complianceScore: 94,
      incidentCount: 0,
    },
    {
      date: Date.now() - 1814400000,
      vulnerabilities: 25,
      threats: 7,
      complianceScore: 95,
      incidentCount: 1,
    },
  ]);

  const [predictiveMetrics] = useState<PredictiveMetric[]>([
    {
      metric: "Vulnerability Count",
      current: 25,
      predicted30Days: 18,
      trend: "down",
      confidence: 94,
    },
    {
      metric: "Threat Detection Rate",
      current: 7,
      predicted30Days: 5,
      trend: "down",
      confidence: 87,
    },
    {
      metric: "Compliance Score",
      current: 95,
      predicted30Days: 97,
      trend: "up",
      confidence: 91,
    },
    {
      metric: "Incident Response Time",
      current: 2.5,
      predicted30Days: 1.8,
      trend: "down",
      confidence: 85,
    },
  ]);

  const [kpis] = useState<KPICard[]>([
    {
      title: "Overall Security Score",
      value: 92,
      unit: "/100",
      trend: "up",
      trendPercent: 5,
      status: "good",
    },
    {
      title: "Active Vulnerabilities",
      value: 25,
      unit: "total",
      trend: "down",
      trendPercent: 28,
      status: "good",
    },
    {
      title: "Compliance Status",
      value: 95,
      unit: "%",
      trend: "up",
      trendPercent: 3,
      status: "good",
    },
    {
      title: "Avg Response Time",
      value: "2.5h",
      unit: "hours",
      trend: "down",
      trendPercent: 15,
      status: "good",
    },
  ]);

  const handleExportReport = () => {
    toast.success("Exporting analytics report...");
  };

  const handleRefreshData = () => {
    toast.success("Refreshing analytics data...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "critical":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4" />
    ) : trend === "down" ? (
      <TrendingDown className="h-4 w-4" />
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Trends, predictions, and comprehensive security metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshData}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Time Range:</span>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className={`p-4 border ${getStatusColor(kpi.status)}`}
          >
            <p className="text-xs text-muted-foreground mb-2">{kpi.title}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {kpi.value}
                  <span className="text-xs ml-1">{kpi.unit}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold">
                {getTrendIcon(kpi.trend)}
                <span>{kpi.trendPercent}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Security Trends (30 Days)
        </h2>

        <div className="space-y-4">
          {[
            {
              label: "Vulnerabilities",
              color: "bg-red-500",
              data: trends.map((t) => t.vulnerabilities),
            },
            {
              label: "Threats Detected",
              color: "bg-orange-500",
              data: trends.map((t) => t.threats),
            },
            {
              label: "Compliance Score",
              color: "bg-green-500",
              data: trends.map((t) => t.complianceScore),
            },
          ].map((series) => (
            <div key={series.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{series.label}</span>
                <span className="text-xs text-muted-foreground">
                  {series.data[series.data.length - 1]}
                </span>
              </div>
              <div className="flex items-end gap-1 h-16 bg-secondary/50 p-2 rounded">
                {series.data.map((value, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 ${series.color} rounded-t opacity-70 hover:opacity-100 transition-opacity`}
                    style={{
                      height: `${(value / Math.max(...series.data)) * 100}%`,
                    }}
                    title={`${value}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Predictive Analytics (30-Day Forecast)
        </h2>

        <div className="space-y-3">
          {predictiveMetrics.map((metric) => (
            <div
              key={metric.metric}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{metric.metric}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {metric.confidence}%
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                    metric.trend === "down"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-orange-500/20 text-orange-600"
                  }`}
                >
                  {getTrendIcon(metric.trend)}
                  <span>{metric.trend}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current</p>
                  <p className="text-lg font-bold">{metric.current}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Predicted (30d)
                  </p>
                  <p className="text-lg font-bold">{metric.predicted30Days}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p
                    className={`text-lg font-bold ${
                      metric.trend === "down"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {metric.trend === "down" ? "-" : "+"}
                    {Math.abs(metric.predicted30Days - metric.current)}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    metric.trend === "down"
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                  style={{
                    width: `${metric.confidence}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Metric Distribution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Vulnerability Severity
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Critical</span>
                <span className="font-semibold text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>High</span>
                <span className="font-semibold text-orange-600">8</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Medium</span>
                <span className="font-semibold text-yellow-600">10</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Low</span>
                <span className="font-semibold text-green-600">4</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Incident Distribution
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Resolved</span>
                <span className="font-semibold text-green-600">18</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>In Progress</span>
                <span className="font-semibold text-blue-600">4</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Pending</span>
                <span className="font-semibold text-yellow-600">2</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Blocked</span>
                <span className="font-semibold text-red-600">1</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Compliance Frameworks
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>SOC 2</span>
                <span className="font-semibold text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>ISO 27001</span>
                <span className="font-semibold text-green-600">93%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>HIPAA</span>
                <span className="font-semibold text-green-600">94%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>GDPR</span>
                <span className="font-semibold text-yellow-600">91%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
