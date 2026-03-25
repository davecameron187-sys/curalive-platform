import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceMetric {
  name: string;
  score: number;
  trend: number;
  status: "compliant" | "at-risk" | "non-compliant";
}

interface ComplianceReport {
  id: string;
  month: string;
  overallScore: number;
  cicdScore: number;
  policyScore: number;
  vendorScore: number;
  generatedAt: number;
}

export default function ComplianceReportingDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([
    {
      name: "CI/CD Security",
      score: 92,
      trend: 8,
      status: "compliant",
    },
    {
      name: "Policy Compliance",
      score: 94,
      trend: 6,
      status: "compliant",
    },
    {
      name: "Vendor Risk Management",
      score: 78,
      trend: -5,
      status: "at-risk",
    },
    {
      name: "ISO 27001",
      score: 96,
      trend: 2,
      status: "compliant",
    },
    {
      name: "SOC 2 Type II",
      score: 89,
      trend: 4,
      status: "compliant",
    },
    {
      name: "GDPR Compliance",
      score: 91,
      trend: 3,
      status: "compliant",
    },
  ]);

  const [reports, setReports] = useState<ComplianceReport[]>([
    {
      id: "report-001",
      month: "March 2026",
      overallScore: 90,
      cicdScore: 92,
      policyScore: 94,
      vendorScore: 78,
      generatedAt: Date.now() - 86400000,
    },
    {
      id: "report-002",
      month: "February 2026",
      overallScore: 87,
      cicdScore: 84,
      policyScore: 88,
      vendorScore: 83,
      generatedAt: Date.now() - 2592000000,
    },
    {
      id: "report-003",
      month: "January 2026",
      overallScore: 85,
      cicdScore: 82,
      policyScore: 86,
      vendorScore: 81,
      generatedAt: Date.now() - 5184000000,
    },
  ]);

  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
  );

  const handleGenerateReport = () => {
    toast.success("Compliance report generated");
  };

  const handleExportPDF = (reportId: string) => {
    toast.success("Report exported as PDF");
  };

  const handleExportPPTX = (reportId: string) => {
    toast.success("Report exported as PowerPoint");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-500/20 text-green-600";
      case "at-risk":
        return "bg-yellow-500/20 text-yellow-600";
      case "non-compliant":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Reporting Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Executive-level compliance aggregation with board presentation exports
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Compliance Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</p>
            <p className="text-xs text-muted-foreground mt-2">↑ 5 points from last month</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-4">Status</p>
            <span className="text-lg font-semibold px-4 py-2 rounded bg-green-500/20 text-green-600">
              Compliant
            </span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">CI/CD Security</p>
          <p className={`text-3xl font-bold ${getScoreColor(92)}`}>92</p>
          <p className="text-xs text-green-600 mt-1">↑ 8 points</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Policy Compliance</p>
          <p className={`text-3xl font-bold ${getScoreColor(94)}`}>94</p>
          <p className="text-xs text-green-600 mt-1">↑ 6 points</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Vendor Risk</p>
          <p className={`text-3xl font-bold ${getScoreColor(78)}`}>78</p>
          <p className="text-xs text-yellow-600 mt-1">↓ 5 points</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance Metrics
        </h2>

        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.name} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{metric.name}</h4>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className={`text-lg font-bold ${getScoreColor(metric.score)}`}>{metric.score}</p>
                  <p className={`text-xs ${metric.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metric.trend >= 0 ? "↑" : "↓"} {Math.abs(metric.trend)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Monthly Reports
          </h2>
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </div>

        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{report.month}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated {new Date(report.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">CI/CD</p>
                  <p className="font-semibold">{report.cicdScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Policies</p>
                  <p className="font-semibold">{report.policyScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendors</p>
                  <p className="font-semibold">{report.vendorScore}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleExportPDF(report.id)} variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
                <Button size="sm" onClick={() => handleExportPPTX(report.id)} variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  PowerPoint
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Compliance Trends
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Q1 2026 Performance</p>
            <p className="text-muted-foreground text-xs mt-1">
              Overall compliance improved from 85 → 87 → 90 (↑5 points)
            </p>
          </div>

          <div>
            <p className="font-semibold">Key Improvements</p>
            <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
              <li>CI/CD security: 84 → 92 (↑8 points)</li>
              <li>Policy compliance: 88 → 94 (↑6 points)</li>
              <li>ISO 27001: 94 → 96 (↑2 points)</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">Areas of Concern</p>
            <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
              <li>Vendor risk: 83 → 78 (↓5 points) - Recall.ai assessment pending</li>
              <li>GDPR compliance: 88 → 91 (↑3 points) - Data retention review needed</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
