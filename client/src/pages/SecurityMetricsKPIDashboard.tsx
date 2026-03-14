import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Target,
  Download,
  Eye,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface KPI {
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: number;
  status: "on-track" | "at-risk" | "exceeded";
}

interface RiskHeatmap {
  category: string;
  riskLevel: number;
  affectedAssets: number;
  trend: string;
}

interface SecurityROI {
  metric: string;
  investment: number;
  savings: number;
  roi: number;
}

export default function SecurityMetricsKPIDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([
    {
      name: "Mean Time to Detect (MTTD)",
      value: 2.3,
      unit: "hours",
      target: 4,
      trend: -0.5,
      status: "exceeded",
    },
    {
      name: "Mean Time to Respond (MTTR)",
      value: 1.8,
      unit: "hours",
      target: 3,
      trend: -0.3,
      status: "exceeded",
    },
    {
      name: "Vulnerability Remediation Rate",
      value: 94,
      unit: "%",
      target: 90,
      trend: 4,
      status: "exceeded",
    },
    {
      name: "Security Incidents",
      value: 2,
      unit: "this month",
      target: 5,
      trend: -1,
      status: "on-track",
    },
    {
      name: "Policy Compliance Score",
      value: 94,
      unit: "%",
      target: 90,
      trend: 2,
      status: "exceeded",
    },
    {
      name: "Vendor Risk Score",
      value: 78,
      unit: "/100",
      target: 85,
      trend: -3,
      status: "at-risk",
    },
  ]);

  const [heatmap, setHeatmap] = useState<RiskHeatmap[]>([
    {
      category: "Infrastructure",
      riskLevel: 2,
      affectedAssets: 12,
      trend: "↓ Improving",
    },
    {
      category: "Application Security",
      riskLevel: 3,
      affectedAssets: 24,
      trend: "→ Stable",
    },
    {
      category: "Data Protection",
      riskLevel: 2,
      affectedAssets: 8,
      trend: "↓ Improving",
    },
    {
      category: "Third-Party Risk",
      riskLevel: 4,
      affectedAssets: 5,
      trend: "↑ Increasing",
    },
    {
      category: "Compliance",
      riskLevel: 1,
      affectedAssets: 3,
      trend: "↓ Improving",
    },
  ]);

  const [roi, setRoi] = useState<SecurityROI[]>([
    {
      metric: "Breach Prevention",
      investment: 250000,
      savings: 2500000,
      roi: 900,
    },
    {
      metric: "Compliance Automation",
      investment: 150000,
      savings: 450000,
      roi: 200,
    },
    {
      metric: "Threat Detection",
      investment: 200000,
      savings: 1200000,
      roi: 500,
    },
  ]);

  const overallSecurityScore = 87;
  const overallROI = Math.round(
    roi.reduce((sum, r) => sum + r.roi, 0) / roi.length
  );

  const handleExportReport = () => {
    toast.success("Board presentation exported as PDF");
  };

  const handleGenerateForecast = () => {
    toast.success("Compliance forecast generated");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exceeded":
        return "bg-green-500/20 text-green-600";
      case "on-track":
        return "bg-blue-500/20 text-blue-600";
      case "at-risk":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const getRiskColor = (level: number) => {
    if (level <= 2) return "bg-green-500/20 text-green-600";
    if (level <= 3) return "bg-yellow-500/20 text-yellow-600";
    return "bg-red-500/20 text-red-600";
  };

  const getRiskLabel = (level: number) => {
    if (level <= 2) return "Low";
    if (level <= 3) return "Medium";
    return "High";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Metrics & KPI Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Executive-level security posture with ROI metrics and predictive forecasting
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Security Score</p>
            <p className="text-5xl font-bold text-green-600 mb-2">{overallSecurityScore}</p>
            <p className="text-xs text-muted-foreground">↑ 7 points from Q4 2025</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Security ROI</p>
            <p className="text-5xl font-bold text-green-600 mb-2">{overallROI}%</p>
            <p className="text-xs text-muted-foreground">$4.15M in prevented losses</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Performance Indicators
          </h2>
          <Button onClick={handleExportReport}>
            <Download className="h-3 w-3 mr-1" />
            Export Board Report
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{kpi.name}</h4>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(kpi.status)}`}>
                  {kpi.status}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-2xl font-bold">
                  {kpi.value}
                  <span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span>
                </p>
                <p className={`text-xs mt-1 ${kpi.trend < 0 ? "text-green-600" : "text-red-600"}`}>
                  {kpi.trend > 0 ? "↑" : "↓"} {Math.abs(kpi.trend)} from last month
                </p>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: {kpi.target}{kpi.unit}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Risk Heat Map
        </h2>

        <div className="space-y-3">
          {heatmap.map((item) => (
            <div key={item.category} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{item.category}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getRiskColor(item.riskLevel)}`}>
                    {getRiskLabel(item.riskLevel)}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.trend}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">Affected Assets: {item.affectedAssets}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded ${
                        i <= item.riskLevel ? "bg-red-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Security ROI Analysis
        </h2>

        <div className="space-y-3">
          {roi.map((item) => (
            <div key={item.metric} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{item.metric}</h4>
                <span className="text-lg font-bold text-green-600">{item.roi}% ROI</span>
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
                  <p className="text-muted-foreground">Net Benefit</p>
                  <p className="font-semibold text-green-600">
                    ${((item.savings - item.investment) / 1000).toFixed(0)}K
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
            <TrendingUp className="h-4 w-4" />
            Predictive Compliance Forecasting
          </h2>
          <Button onClick={handleGenerateForecast} variant="outline">
            Generate Forecast
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Q2 2026 Projection</p>
            <p className="text-muted-foreground text-xs mt-1">
              Estimated compliance score: 96% (↑ 2 points from Q1)
            </p>
          </div>

          <div>
            <p className="font-semibold">Risk Forecast</p>
            <p className="text-muted-foreground text-xs mt-1">
              Third-party risk expected to increase 5-8% — recommend vendor reassessment
            </p>
          </div>

          <div>
            <p className="font-semibold">Recommended Actions</p>
            <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
              <li>Increase DAST scanning frequency (weekly → daily)</li>
              <li>Schedule Recall.ai compliance audit</li>
              <li>Update incident response playbooks</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
