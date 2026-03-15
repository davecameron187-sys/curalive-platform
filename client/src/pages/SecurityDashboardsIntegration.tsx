import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  Settings,
  RefreshCw,
  Filter,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface ModuleMetric {
  module: string;
  category: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  alerts: number;
  lastUpdated: number;
  trend: "improving" | "stable" | "declining";
}

interface ExecutiveSummary {
  title: string;
  value: string | number;
  change: number;
  status: "positive" | "neutral" | "negative";
  icon: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "list" | "gauge";
  dataSource: string;
  position: number;
  isVisible: boolean;
}

interface SecurityScore {
  category: string;
  score: number;
  benchmark: number;
  gap: number;
  trend: "improving" | "stable" | "declining";
}

export default function SecurityDashboardsIntegration() {
  const [moduleMetrics] = useState<ModuleMetric[]>([
    {
      module: "CI/CD Security",
      category: "Scanning",
      status: "healthy",
      score: 94,
      alerts: 2,
      lastUpdated: Date.now() - 300000,
      trend: "improving",
    },
    {
      module: "Policy Management",
      category: "Compliance",
      status: "healthy",
      score: 92,
      alerts: 1,
      lastUpdated: Date.now() - 600000,
      trend: "stable",
    },
    {
      module: "Vendor Risk",
      category: "Third-Party",
      status: "warning",
      score: 85,
      alerts: 5,
      lastUpdated: Date.now() - 900000,
      trend: "declining",
    },
    {
      module: "Real-Time Alerting",
      category: "Detection",
      status: "healthy",
      score: 96,
      alerts: 0,
      lastUpdated: Date.now() - 180000,
      trend: "stable",
    },
    {
      module: "Anomaly Detection",
      category: "Detection",
      status: "healthy",
      score: 91,
      alerts: 3,
      lastUpdated: Date.now() - 450000,
      trend: "improving",
    },
    {
      module: "Threat Hunting",
      category: "Proactive",
      status: "healthy",
      score: 88,
      alerts: 4,
      lastUpdated: Date.now() - 1200000,
      trend: "stable",
    },
  ]);

  const [executiveSummary] = useState<ExecutiveSummary[]>([
    {
      title: "Overall Security Score",
      value: "91/100",
      change: 3,
      status: "positive",
      icon: "shield",
    },
    {
      title: "Active Incidents",
      value: 8,
      change: -2,
      status: "positive",
      icon: "alert",
    },
    {
      title: "Critical Vulnerabilities",
      value: 2,
      change: -1,
      status: "positive",
      icon: "bug",
    },
    {
      title: "Compliance Score",
      value: "94%",
      change: 2,
      status: "positive",
      icon: "check",
    },
    {
      title: "Mean Time to Response",
      value: "12m",
      change: -3,
      status: "positive",
      icon: "clock",
    },
    {
      title: "Threat Detection Rate",
      value: "98%",
      change: 1,
      status: "positive",
      icon: "target",
    },
  ]);

  const [widgets] = useState<DashboardWidget[]>([
    {
      id: "w-001",
      title: "Security Score Trend",
      type: "chart",
      dataSource: "metrics",
      position: 1,
      isVisible: true,
    },
    {
      id: "w-002",
      title: "Active Alerts",
      type: "list",
      dataSource: "alerts",
      position: 2,
      isVisible: true,
    },
    {
      id: "w-003",
      title: "Compliance Status",
      type: "gauge",
      dataSource: "compliance",
      position: 3,
      isVisible: true,
    },
    {
      id: "w-004",
      title: "Vulnerability Trend",
      type: "chart",
      dataSource: "vulnerabilities",
      position: 4,
      isVisible: true,
    },
  ]);

  const [securityScores] = useState<SecurityScore[]>([
    {
      category: "Detection & Response",
      score: 94,
      benchmark: 85,
      gap: 9,
      trend: "improving",
    },
    {
      category: "Compliance & Governance",
      score: 92,
      benchmark: 88,
      gap: 4,
      trend: "stable",
    },
    {
      category: "Vulnerability Management",
      score: 87,
      benchmark: 80,
      gap: 7,
      trend: "improving",
    },
    {
      category: "Identity & Access",
      score: 89,
      benchmark: 82,
      gap: 7,
      trend: "stable",
    },
    {
      category: "Third-Party Risk",
      score: 85,
      benchmark: 75,
      gap: 10,
      trend: "declining",
    },
  ]);

  const handleRefreshData = () => {
    toast.success("Dashboard data refreshed");
  };

  const handleExportDashboard = () => {
    toast.success("Dashboard exported as PDF");
  };

  const handleCustomizeDashboard = () => {
    toast.success("Dashboard customization opened");
  };

  const handleDrillDown = (module: string) => {
    toast.success(`Drilling down into ${module}`);
  };

  const overallScore = Math.round(
    moduleMetrics.reduce((sum, m) => sum + m.score, 0) / moduleMetrics.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Dashboards Integration</h1>
        <p className="text-muted-foreground mt-1">
          Unified security dashboard with drill-down capabilities and executive-level view
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
          <p className="text-3xl font-bold text-green-600">{overallScore}/100</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Modules Monitored</p>
          <p className="text-3xl font-bold">{moduleMetrics.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Alerts</p>
          <p className="text-3xl font-bold text-orange-600">
            {moduleMetrics.reduce((sum, m) => sum + m.alerts, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Executive Summary
          </h2>
          <div className="flex gap-2">
            <Button onClick={handleRefreshData} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button onClick={handleExportDashboard} size="sm" variant="outline">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {executiveSummary.map((item, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-2">{item.title}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">{item.value}</p>
                <span
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    item.status === "positive"
                      ? "text-green-600"
                      : item.status === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {item.change > 0 ? "+" : ""}{item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Security Module Overview
          </h2>
          <Button onClick={handleCustomizeDashboard} size="sm" variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            Customize
          </Button>
        </div>

        <div className="space-y-3">
          {moduleMetrics.map((metric) => (
            <div
              key={metric.module}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => handleDrillDown(metric.module)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{metric.module}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{metric.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      metric.status === "healthy"
                        ? "bg-green-500/20 text-green-600"
                        : metric.status === "warning"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {metric.status}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      metric.trend === "improving"
                        ? "bg-green-500/20 text-green-600"
                        : metric.trend === "stable"
                          ? "bg-blue-500/20 text-blue-600"
                          : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {metric.trend}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-semibold">{metric.score}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alerts</p>
                  <p className="font-semibold">{metric.alerts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - metric.lastUpdated) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Drill Down
                  </Button>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.score >= 90
                      ? "bg-green-600"
                      : metric.score >= 80
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Security Score Benchmarking
        </h2>

        <div className="space-y-3">
          {securityScores.map((score, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{score.category}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Score: {score.score} | Industry Benchmark: {score.benchmark}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    score.gap >= 10
                      ? "bg-green-500/20 text-green-600"
                      : score.gap >= 5
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-yellow-500/20 text-yellow-600"
                  }`}
                >
                  +{score.gap} above
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <div className="w-full bg-secondary rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground">Your Score</p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full bg-gray-400"
                      style={{ width: `${score.benchmark}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground">Benchmark</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trend</p>
                  <p className="font-semibold">{score.trend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Dashboard Widgets
          </h2>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Add Widget
          </Button>
        </div>

        <div className="space-y-2">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm">{widget.title}</p>
                <p className="text-xs text-muted-foreground">
                  Type: {widget.type} • Source: {widget.dataSource}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {widget.isVisible ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
                <Button size="sm" variant="outline">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
