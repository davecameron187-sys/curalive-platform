import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Mail,
  Zap,
  LineChart,
} from "lucide-react";
import { toast } from "sonner";

interface MetricReport {
  id: string;
  period: string;
  date: number;
  metrics: {
    securityScore: number;
    complianceScore: number;
    vulnerabilities: number;
    incidents: number;
    remediationRate: number;
  };
  trend: "up" | "down" | "stable";
}

export default function SecurityMetricsReportingDashboard() {
  const [reports, setReports] = useState<MetricReport[]>([
    {
      id: "report-2026-q1",
      period: "Q1 2026",
      date: Date.now(),
      metrics: {
        securityScore: 87,
        complianceScore: 94,
        vulnerabilities: 12,
        incidents: 2,
        remediationRate: 89,
      },
      trend: "up",
    },
    {
      id: "report-2025-q4",
      period: "Q4 2025",
      date: Date.now() - 7776000000,
      metrics: {
        securityScore: 84,
        complianceScore: 91,
        vulnerabilities: 18,
        incidents: 3,
        remediationRate: 82,
      },
      trend: "up",
    },
    {
      id: "report-2025-q3",
      period: "Q3 2025",
      date: Date.now() - 15552000000,
      metrics: {
        securityScore: 81,
        complianceScore: 88,
        vulnerabilities: 24,
        incidents: 4,
        remediationRate: 76,
      },
      trend: "up",
    },
  ]);

  const [selectedReport, setSelectedReport] = useState(reports[0]);

  const handleExportReport = (reportId: string) => {
    toast.success("Report exported as PDF");
  };

  const handleEmailReport = (reportId: string) => {
    toast.success("Report sent to stakeholders");
  };

  const handleScheduleReport = () => {
    toast.success("Automated reporting scheduled");
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Metrics Reporting</h1>
        <p className="text-muted-foreground mt-1">
          Monthly/quarterly reports with KPI dashboards and trend analysis
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Report History</h2>

          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  selectedReport.id === report.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{report.period}</p>
                  <span className="text-lg">{getTrendIcon(report.trend)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {report.metrics.securityScore}/100
                </p>
              </button>
            ))}
          </div>

          <Button
            className="w-full mt-4"
            onClick={handleScheduleReport}
            variant="outline"
          >
            Schedule Automated Reports
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">
            {selectedReport.period} Metrics
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Security Score
              </p>
              <p className="text-2xl font-bold">
                {selectedReport.metrics.securityScore}
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${selectedReport.metrics.securityScore}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Compliance Score
              </p>
              <p className="text-2xl font-bold">
                {selectedReport.metrics.complianceScore}%
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${selectedReport.metrics.complianceScore}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground">Vulnerabilities</p>
                <p className="font-semibold">
                  {selectedReport.metrics.vulnerabilities}
                </p>
              </div>
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground">Incidents</p>
                <p className="font-semibold">
                  {selectedReport.metrics.incidents}
                </p>
              </div>
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground">Remediation</p>
                <p className="font-semibold">
                  {selectedReport.metrics.remediationRate}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          KPI Trend Analysis
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Security Score Trend</p>
            <div className="flex items-end gap-1 h-24">
              {reports.reverse().map((report, idx) => (
                <div
                  key={report.id}
                  className="flex-1 bg-primary rounded-t"
                  style={{
                    height: `${(report.metrics.securityScore / 100) * 100}%`,
                  }}
                  title={`${report.period}: ${report.metrics.securityScore}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ↑ 6 point improvement over 2 quarters
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Vulnerability Trend</p>
            <div className="flex items-end gap-1 h-24">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex-1 bg-red-600 rounded-t"
                  style={{
                    height: `${(report.metrics.vulnerabilities / 30) * 100}%`,
                  }}
                  title={`${report.period}: ${report.metrics.vulnerabilities}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ↓ 50% reduction in vulnerabilities
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Executive Summary
        </h2>

        <div className="space-y-3 text-sm">
          <p>
            <strong>{selectedReport.period} Security Performance:</strong> Your
            organization achieved a security score of{" "}
            <strong>{selectedReport.metrics.securityScore}/100</strong>, with a{" "}
            <strong>{selectedReport.metrics.complianceScore}%</strong> compliance
            rating. Key improvements include a{" "}
            <strong>50% reduction in vulnerabilities</strong> and{" "}
            <strong>89% remediation rate</strong>.
          </p>

          <p>
            <strong>Key Metrics:</strong>
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>
              Security Score: {selectedReport.metrics.securityScore}/100 (↑ 6
              points)
            </li>
            <li>
              Compliance Score: {selectedReport.metrics.complianceScore}% (↑ 3
              points)
            </li>
            <li>
              Vulnerabilities: {selectedReport.metrics.vulnerabilities} (↓ 50%)
            </li>
            <li>Incidents: {selectedReport.metrics.incidents} (↓ 33%)</li>
            <li>
              Remediation Rate: {selectedReport.metrics.remediationRate}% (↑ 7%)
            </li>
          </ul>

          <p>
            <strong>Recommendations:</strong> Continue focus on data protection
            enhancements and threat detection improvements. Schedule Q2 2026
            penetration testing and complete SOC 2 audit.
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => handleExportReport(selectedReport.id)}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleEmailReport(selectedReport.id)}
            variant="outline"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email to Stakeholders
          </Button>
        </div>
      </Card>
    </div>
  );
}
