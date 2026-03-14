import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  Zap,
  Target,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface RiskFactor {
  category: string;
  weight: number;
  currentScore: number;
  trend: number;
  factors: string[];
}

interface RiskHeatmap {
  asset: string;
  riskScore: number;
  vulnerabilities: number;
  threats: number;
  complianceGaps: number;
  trend: "increasing" | "stable" | "decreasing";
}

interface RiskForecast {
  month: string;
  predictedScore: number;
  confidence: number;
  riskLevel: "critical" | "high" | "medium" | "low";
}

export default function SecurityRiskScoring() {
  const [riskFactors] = useState<RiskFactor[]>([
    {
      category: "Vulnerabilities",
      weight: 35,
      currentScore: 72,
      trend: -5,
      factors: ["Unpatched systems", "Weak credentials", "Exposed APIs"],
    },
    {
      category: "Threat Intelligence",
      weight: 30,
      currentScore: 58,
      trend: 3,
      factors: ["Active campaigns", "Suspicious activity", "Known exploits"],
    },
    {
      category: "Compliance Gaps",
      weight: 20,
      currentScore: 45,
      trend: -8,
      factors: ["Policy violations", "Audit findings", "Control gaps"],
    },
    {
      category: "Incident History",
      weight: 15,
      currentScore: 38,
      trend: 0,
      factors: ["Past breaches", "Response time", "Recovery success"],
    },
  ]);

  const [heatmap] = useState<RiskHeatmap[]>([
    {
      asset: "Production Database",
      riskScore: 92,
      vulnerabilities: 8,
      threats: 3,
      complianceGaps: 2,
      trend: "increasing",
    },
    {
      asset: "API Gateway",
      riskScore: 78,
      vulnerabilities: 5,
      threats: 2,
      complianceGaps: 1,
      trend: "stable",
    },
    {
      asset: "Employee Workstations",
      riskScore: 65,
      vulnerabilities: 12,
      threats: 1,
      complianceGaps: 3,
      trend: "decreasing",
    },
    {
      asset: "Cloud Storage",
      riskScore: 58,
      vulnerabilities: 3,
      threats: 1,
      complianceGaps: 4,
      trend: "stable",
    },
    {
      asset: "Identity Provider",
      riskScore: 48,
      vulnerabilities: 2,
      threats: 0,
      complianceGaps: 2,
      trend: "decreasing",
    },
  ]);

  const [forecast] = useState<RiskForecast[]>([
    { month: "Apr", predictedScore: 62, confidence: 92, riskLevel: "high" },
    { month: "May", predictedScore: 58, confidence: 88, riskLevel: "high" },
    { month: "Jun", predictedScore: 52, confidence: 85, riskLevel: "medium" },
    { month: "Jul", predictedScore: 48, confidence: 82, riskLevel: "medium" },
  ]);

  const overallRiskScore = Math.round(
    riskFactors.reduce((sum, f) => sum + (f.currentScore * f.weight) / 100, 0)
  );

  const handleGenerateReport = () => {
    toast.success("Risk report generated");
  };

  const handleUpdateScoring = () => {
    toast.success("Risk scoring updated");
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-500/20 text-red-600";
    if (score >= 60) return "bg-orange-500/20 text-orange-600";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-600";
    return "bg-green-500/20 text-green-600";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return "↑";
    if (trend < 0) return "↓";
    return "→";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Risk Scoring Engine</h1>
        <p className="text-muted-foreground mt-1">
          ML-powered risk aggregation and predictive scoring
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-secondary to-secondary/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Risk Score</p>
            <p className="text-5xl font-bold">{overallRiskScore}</p>
            <p className={`text-sm font-semibold mt-2 ${getRiskColor(overallRiskScore)}`}>
              {getRiskLevel(overallRiskScore)} Risk
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-2">Last Updated</p>
            <p className="text-sm font-semibold">2 hours ago</p>
            <Button onClick={handleUpdateScoring} className="mt-3">
              <Zap className="h-3 w-3 mr-1" />
              Recalculate
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Risk Factor Breakdown
          </h2>
          <Button onClick={handleGenerateReport}>
            <Download className="h-3 w-3 mr-1" />
            Export Report
          </Button>
        </div>

        <div className="space-y-4">
          {riskFactors.map((factor) => (
            <div key={factor.category} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{factor.category}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Weight: {factor.weight}% • Trend: {getTrendIcon(factor.trend)}{" "}
                    {Math.abs(factor.trend)}
                  </p>
                </div>
                <div className={`text-right ${getRiskColor(factor.currentScore)}`}>
                  <p className="text-2xl font-bold">{factor.currentScore}</p>
                  <p className="text-xs font-semibold">{getRiskLevel(factor.currentScore)}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      factor.currentScore >= 80
                        ? "bg-red-600"
                        : factor.currentScore >= 60
                          ? "bg-orange-600"
                          : factor.currentScore >= 40
                            ? "bg-yellow-600"
                            : "bg-green-600"
                    }`}
                    style={{ width: `${factor.currentScore}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {factor.factors.map((f) => (
                  <span key={f} className="text-xs bg-secondary px-2 py-1 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Risk Heat Map by Asset
        </h2>

        <div className="space-y-3">
          {heatmap.map((item) => (
            <div
              key={item.asset}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.asset}</h4>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getRiskColor(item.riskScore)}`}>
                    {item.riskScore}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.trend === "increasing" && "↑"}
                    {item.trend === "stable" && "→"}
                    {item.trend === "decreasing" && "↓"}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.riskScore >= 80
                        ? "bg-red-600"
                        : item.riskScore >= 60
                          ? "bg-orange-600"
                          : item.riskScore >= 40
                            ? "bg-yellow-600"
                            : "bg-green-600"
                    }`}
                    style={{ width: `${item.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Vulnerabilities</p>
                  <p className="font-semibold">{item.vulnerabilities}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Threats</p>
                  <p className="font-semibold">{item.threats}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Compliance Gaps</p>
                  <p className="font-semibold">{item.complianceGaps}</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Risk Forecast (Next 4 Months)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Month</th>
                <th className="text-center py-2 px-2">Predicted Score</th>
                <th className="text-center py-2 px-2">Confidence</th>
                <th className="text-center py-2 px-2">Risk Level</th>
                <th className="text-center py-2 px-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((item) => (
                <tr key={item.month} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-2 px-2 font-semibold">{item.month}</td>
                  <td className="text-center py-2 px-2">{item.predictedScore}</td>
                  <td className="text-center py-2 px-2">{item.confidence}%</td>
                  <td className="text-center py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(item.predictedScore)}`}>
                      {getRiskLevel(item.predictedScore)}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className="text-green-600">↓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Risk Mitigation Recommendations
        </h2>

        <div className="space-y-3">
          {[
            {
              priority: "Critical",
              action: "Patch database vulnerabilities",
              impact: "Reduce risk by 15%",
              effort: "2 days",
            },
            {
              priority: "High",
              action: "Enable MFA on all accounts",
              impact: "Reduce risk by 12%",
              effort: "3 days",
            },
            {
              priority: "High",
              action: "Update security policies",
              impact: "Reduce risk by 8%",
              effort: "1 week",
            },
            {
              priority: "Medium",
              action: "Conduct security training",
              impact: "Reduce risk by 5%",
              effort: "2 weeks",
            },
          ].map((rec, idx) => (
            <div key={idx} className="p-3 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{rec.action}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{rec.impact}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    rec.priority === "Critical"
                      ? "bg-red-500/20 text-red-600"
                      : rec.priority === "High"
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-yellow-500/20 text-yellow-600"
                  }`}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Effort: {rec.effort}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
