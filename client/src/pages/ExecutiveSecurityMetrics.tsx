import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityMetric {
  name: string;
  value: number;
  unit: string;
  trend: number;
  status: "improving" | "declining" | "stable";
}

interface RiskTrend {
  month: string;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface ComplianceStatus {
  framework: string;
  compliance: number;
  lastAudit: number;
  nextAudit: number;
  status: "compliant" | "non-compliant" | "in-progress";
}

interface SecurityROI {
  category: string;
  investment: number;
  savings: number;
  roi: number;
}

export default function ExecutiveSecurityMetrics() {
  const [metrics] = useState<SecurityMetric[]>([
    {
      name: "Security Score",
      value: 87,
      unit: "/100",
      trend: 5,
      status: "improving",
    },
    {
      name: "Risk Score",
      value: 34,
      unit: "/100",
      trend: -8,
      status: "improving",
    },
    {
      name: "Incident Response Time",
      value: 2.5,
      unit: "hours",
      trend: -0.5,
      status: "improving",
    },
    {
      name: "Vulnerability Remediation",
      value: 92,
      unit: "%",
      trend: 3,
      status: "improving",
    },
  ]);

  const [riskTrends] = useState<RiskTrend[]>([
    { month: "Jan", criticalRisk: 3, highRisk: 8, mediumRisk: 15, lowRisk: 22 },
    { month: "Feb", criticalRisk: 2, highRisk: 6, mediumRisk: 12, lowRisk: 18 },
    { month: "Mar", criticalRisk: 1, highRisk: 5, mediumRisk: 10, lowRisk: 16 },
  ]);

  const [compliance] = useState<ComplianceStatus[]>([
    {
      framework: "SOC 2 Type II",
      compliance: 98,
      lastAudit: Date.now() - 2592000000,
      nextAudit: Date.now() + 7776000000,
      status: "compliant",
    },
    {
      framework: "ISO 27001",
      compliance: 95,
      lastAudit: Date.now() - 5184000000,
      nextAudit: Date.now() + 5184000000,
      status: "compliant",
    },
    {
      framework: "HIPAA",
      compliance: 92,
      lastAudit: Date.now() - 7776000000,
      nextAudit: Date.now() + 2592000000,
      status: "in-progress",
    },
    {
      framework: "PCI-DSS",
      compliance: 88,
      lastAudit: Date.now() - 3888000000,
      nextAudit: Date.now() + 3888000000,
      status: "compliant",
    },
  ]);

  const [roi] = useState<SecurityROI[]>([
    { category: "Incident Prevention", investment: 500000, savings: 2500000, roi: 400 },
    { category: "Compliance Management", investment: 300000, savings: 1200000, roi: 300 },
    { category: "Threat Detection", investment: 400000, savings: 1800000, roi: 350 },
    { category: "Training & Awareness", investment: 150000, savings: 600000, roi: 300 },
  ]);

  const handleExportReport = () => {
    toast.success("Executive report exported");
  };

  const handleGenerateBoardDeck = () => {
    toast.success("Board presentation generated");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-500/20 text-green-600";
      case "non-compliant":
        return "bg-red-500/20 text-red-600";
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-600";
      case "improving":
        return "bg-green-500/20 text-green-600";
      case "declining":
        return "bg-red-500/20 text-red-600";
      case "stable":
        return "bg-blue-500/20 text-blue-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const totalInvestment = roi.reduce((sum, r) => sum + r.investment, 0);
  const totalSavings = roi.reduce((sum, r) => sum + r.savings, 0);
  const avgROI = Math.round(roi.reduce((sum, r) => sum + r.roi, 0) / roi.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Executive Security Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          C-suite KPIs, compliance status, and security ROI metrics
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">
                {metric.value}
                <span className="text-lg text-muted-foreground">{metric.unit}</span>
              </p>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(metric.status)}`}>
                {metric.trend > 0 ? "+" : ""}{metric.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Security ROI Analysis
          </h2>
          <Button onClick={handleExportReport}>
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
            <p className="text-3xl font-bold text-blue-600">
              ${(totalInvestment / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
            <p className="text-3xl font-bold text-green-600">
              ${(totalSavings / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {roi.map((item) => (
            <div key={item.category} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.category}</h4>
                </div>
                <span className="text-sm font-bold text-green-600">{item.roi}% ROI</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Investment</p>
                  <p className="font-semibold">${(item.investment / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Savings</p>
                  <p className="font-semibold">${(item.savings / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${Math.min((item.roi / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-secondary rounded-lg">
          <p className="text-sm font-semibold mb-1">Average ROI Across All Categories</p>
          <p className="text-3xl font-bold text-green-600">{avgROI}%</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Risk Trend Analysis
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Month</th>
                <th className="text-center py-2 px-2">
                  <span className="text-red-600">Critical</span>
                </th>
                <th className="text-center py-2 px-2">
                  <span className="text-orange-600">High</span>
                </th>
                <th className="text-center py-2 px-2">
                  <span className="text-yellow-600">Medium</span>
                </th>
                <th className="text-center py-2 px-2">
                  <span className="text-blue-600">Low</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {riskTrends.map((trend) => (
                <tr key={trend.month} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-2 px-2 font-semibold">{trend.month}</td>
                  <td className="text-center py-2 px-2">{trend.criticalRisk}</td>
                  <td className="text-center py-2 px-2">{trend.highRisk}</td>
                  <td className="text-center py-2 px-2">{trend.mediumRisk}</td>
                  <td className="text-center py-2 px-2">{trend.lowRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance Status
          </h2>
          <Button onClick={handleGenerateBoardDeck}>
            <Download className="h-3 w-3 mr-1" />
            Board Deck
          </Button>
        </div>

        <div className="space-y-3">
          {compliance.map((comp) => (
            <div
              key={comp.framework}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{comp.framework}</h4>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(comp.status)}`}>
                    {comp.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <p className="text-muted-foreground">Compliance Level</p>
                  <p className="font-semibold">{comp.compliance}%</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      comp.compliance >= 95
                        ? "bg-green-600"
                        : comp.compliance >= 85
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                    style={{ width: `${comp.compliance}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Last Audit</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - comp.lastAudit) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Audit</p>
                  <p className="font-semibold">
                    {Math.floor((comp.nextAudit - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Key Performance Indicators
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <p className="font-semibold mb-3 text-sm">Security Posture</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Mean Time to Detect (MTTD)</p>
                <p className="font-semibold">4.2 hours</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Mean Time to Respond (MTTR)</p>
                <p className="font-semibold">2.1 hours</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Patch Compliance</p>
                <p className="font-semibold">94%</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <p className="font-semibold mb-3 text-sm">Risk Management</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Vulnerabilities Remediated</p>
                <p className="font-semibold">87%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Security Training Completion</p>
                <p className="font-semibold">92%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Incident Response Drills</p>
                <p className="font-semibold">Quarterly</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
