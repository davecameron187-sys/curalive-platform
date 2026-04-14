import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceMetric {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  lastUpdated: number;
  status: "compliant" | "at-risk" | "non-compliant";
}

export default function ComplianceMonitoringDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([
    {
      name: "ISO 27001 Score",
      score: 94,
      trend: "up",
      lastUpdated: Date.now() - 86400000,
      status: "compliant",
    },
    {
      name: "SOC 2 Compliance",
      score: 91,
      trend: "stable",
      lastUpdated: Date.now() - 172800000,
      status: "compliant",
    },
    {
      name: "GDPR Compliance",
      score: 96,
      trend: "up",
      lastUpdated: Date.now() - 604800000,
      status: "compliant",
    },
    {
      name: "Data Protection",
      score: 88,
      trend: "down",
      lastUpdated: Date.now() - 259200000,
      status: "at-risk",
    },
    {
      name: "Access Control",
      score: 92,
      trend: "stable",
      lastUpdated: Date.now() - 86400000,
      status: "compliant",
    },
    {
      name: "Incident Response",
      score: 89,
      trend: "up",
      lastUpdated: Date.now() - 172800000,
      status: "compliant",
    },
  ]);

  const [dateRange, setDateRange] = useState("30d");

  const averageScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
  );

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      averageScore,
      metrics,
      dateRange,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `compliance-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Compliance report exported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Monitoring Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time compliance metrics and automated control testing
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Average Score</p>
          <p className="text-3xl font-bold text-green-600">{averageScore}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant</p>
          <p className="text-3xl font-bold">
            {metrics.filter((m) => m.status === "compliant").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">At Risk</p>
          <p className="text-3xl font-bold text-yellow-600">
            {metrics.filter((m) => m.status === "at-risk").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Metrics</p>
          <p className="text-3xl font-bold">{metrics.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Compliance Metrics</h2>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-border rounded text-sm bg-background"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button onClick={handleExportReport} size="sm">
              Export Report
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{metric.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated:{" "}
                    {Math.round((Date.now() - metric.lastUpdated) / 86400000)}d ago
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-2xl font-bold">{metric.score}%</p>
                    {metric.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {metric.trend === "down" && (
                      <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      metric.status === "compliant"
                        ? "bg-green-500/20 text-green-600"
                        : metric.status === "at-risk"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {metric.status}
                  </p>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metric.score >= 90
                      ? "bg-green-600"
                      : metric.score >= 75
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Automated Controls
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Real-Time Monitoring</p>
                <p className="text-muted-foreground">
                  Continuous system health and security monitoring
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Automated Testing</p>
                <p className="text-muted-foreground">
                  Daily control effectiveness validation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Evidence Collection</p>
                <p className="text-muted-foreground">
                  Automatic evidence gathering for audits
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Remediation Tracking</p>
                <p className="text-muted-foreground">
                  SLA management and gap closure tracking
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Audits
          </h2>

          <div className="space-y-3">
            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">ISO 27001 Audit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled: Q2 2026
              </p>
              <p className="text-xs text-muted-foreground">
                Auditor: Big Four Firm
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">SOC 2 Type II Audit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled: Q3 2026
              </p>
              <p className="text-xs text-muted-foreground">
                12-month testing period
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">Internal Audit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled: Q1 2026
              </p>
              <p className="text-xs text-muted-foreground">
                Quarterly compliance review
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
