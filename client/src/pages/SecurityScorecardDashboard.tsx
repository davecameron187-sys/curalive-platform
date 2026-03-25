import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface RiskMetric {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
  recommendations: string[];
}

export default function SecurityScorecardDashboard() {
  const [metrics, setMetrics] = useState<RiskMetric[]>([
    {
      name: "Vulnerability Management",
      score: 87,
      trend: "up",
      status: "good",
      recommendations: [
        "Patch 3 critical vulnerabilities",
        "Update antivirus signatures",
      ],
    },
    {
      name: "Access Control",
      score: 92,
      trend: "stable",
      status: "good",
      recommendations: [
        "Review privileged access quarterly",
        "Implement MFA for all admin accounts",
      ],
    },
    {
      name: "Data Protection",
      score: 78,
      trend: "down",
      status: "warning",
      recommendations: [
        "Encrypt 5 unencrypted databases",
        "Review data classification policies",
      ],
    },
    {
      name: "Incident Response",
      score: 84,
      trend: "up",
      status: "good",
      recommendations: [
        "Update incident response playbooks",
        "Conduct tabletop exercises quarterly",
      ],
    },
    {
      name: "Compliance",
      score: 91,
      trend: "stable",
      status: "good",
      recommendations: [
        "Complete SOC 2 audit",
        "Update privacy policy",
      ],
    },
    {
      name: "Threat Detection",
      score: 81,
      trend: "up",
      status: "good",
      recommendations: [
        "Improve SIEM detection rules",
        "Increase threat hunting frequency",
      ],
    },
  ]);

  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500/20 text-green-600";
      case "warning":
        return "bg-yellow-500/20 text-yellow-600";
      case "critical":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Scorecard & Risk Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overall security posture, compliance status, and risk metrics
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Overall Security Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Based on 6 security dimensions
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Risk Level</p>
          <p className="text-2xl font-bold">
            {overallScore >= 85 ? "🟢 Low" : overallScore >= 70 ? "🟡 Medium" : "🔴 High"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {overallScore >= 85
              ? "Strong security posture"
              : overallScore >= 70
              ? "Needs improvement"
              : "Critical attention required"}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Compliance Status</p>
          <p className="text-2xl font-bold">94%</p>
          <p className="text-xs text-muted-foreground mt-2">
            ISO 27001 & SOC 2 aligned
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Security Dimensions
        </h2>

        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{metric.name}</h4>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}
                  </p>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${
                    metric.status === "good"
                      ? "bg-green-600"
                      : metric.status === "warning"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getStatusBg(metric.status)}`}>
                  {metric.status}
                </span>
                {metric.trend === "up" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" /> Improving
                  </span>
                )}
                {metric.trend === "down" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" /> Declining
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Recommendations:</p>
                {metric.recommendations.map((rec, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Risk Areas
          </h2>

          <div className="space-y-3">
            <div className="p-3 border border-red-500/30 bg-red-500/10 rounded">
              <p className="font-semibold text-sm">Data Protection Gap</p>
              <p className="text-xs text-muted-foreground mt-1">
                5 databases lack encryption
              </p>
            </div>

            <div className="p-3 border border-yellow-500/30 bg-yellow-500/10 rounded">
              <p className="font-semibold text-sm">Vulnerability Backlog</p>
              <p className="text-xs text-muted-foreground mt-1">
                3 critical vulnerabilities pending patches
              </p>
            </div>

            <div className="p-3 border border-yellow-500/30 bg-yellow-500/10 rounded">
              <p className="font-semibold text-sm">Compliance Audit</p>
              <p className="text-xs text-muted-foreground mt-1">
                SOC 2 Type II audit scheduled Q2 2026
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h2>

          <div className="space-y-3">
            <div className="p-3 border border-green-500/30 bg-green-500/10 rounded">
              <p className="font-semibold text-sm">Access Control</p>
              <p className="text-xs text-muted-foreground mt-1">
                92/100 - Excellent RBAC implementation
              </p>
            </div>

            <div className="p-3 border border-green-500/30 bg-green-500/10 rounded">
              <p className="font-semibold text-sm">Compliance Alignment</p>
              <p className="text-xs text-muted-foreground mt-1">
                91/100 - Strong ISO 27001 controls
              </p>
            </div>

            <div className="p-3 border border-green-500/30 bg-green-500/10 rounded">
              <p className="font-semibold text-sm">Incident Response</p>
              <p className="text-xs text-muted-foreground mt-1">
                84/100 - Well-documented playbooks
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Executive Summary
        </h2>

        <div className="space-y-3 text-sm">
          <p>
            Your organization maintains a <strong>strong security posture</strong> with an overall score of <strong>{overallScore}/100</strong>. Key strengths include robust access control, compliance alignment, and incident response capabilities.
          </p>

          <p>
            Primary focus areas for improvement include data protection (encrypt 5 databases), vulnerability management (patch 3 critical CVEs), and threat detection enhancement.
          </p>

          <p>
            Recommended actions for next quarter:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Complete data encryption project (Q2 2026)</li>
            <li>Conduct SOC 2 Type II audit (Q2 2026)</li>
            <li>Implement advanced threat detection (Q3 2026)</li>
            <li>Quarterly security awareness training (ongoing)</li>
          </ul>

          <div className="flex gap-2 mt-4">
            <Button>Export Report</Button>
            <Button variant="outline">Schedule Review</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
