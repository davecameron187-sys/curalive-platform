import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Download,
  Plus,
  Edit2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface BenchmarkMetric {
  name: string;
  yourScore: number;
  industryAvg: number;
  leader: number;
  percentile: number;
  trend: number;
}

interface PeerComparison {
  company: string;
  industry: string;
  size: string;
  overallScore: number;
  cicdScore: number;
  policyScore: number;
  vendorScore: number;
}

interface GapAnalysis {
  area: string;
  yourScore: number;
  targetScore: number;
  gap: number;
  priority: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export default function SecurityPostureBenchmarking() {
  const [metrics, setMetrics] = useState<BenchmarkMetric[]>([
    {
      name: "Mean Time to Detect",
      yourScore: 2.3,
      industryAvg: 4.5,
      leader: 0.8,
      percentile: 85,
      trend: -0.5,
    },
    {
      name: "Vulnerability Remediation Rate",
      yourScore: 94,
      industryAvg: 78,
      leader: 98,
      percentile: 88,
      trend: 4,
    },
    {
      name: "Policy Compliance Score",
      yourScore: 94,
      industryAvg: 82,
      leader: 97,
      percentile: 82,
      trend: 2,
    },
    {
      name: "Security Incidents (Annual)",
      yourScore: 2,
      industryAvg: 8,
      leader: 0,
      percentile: 92,
      trend: -1,
    },
    {
      name: "Security ROI",
      yourScore: 900,
      industryAvg: 450,
      leader: 1200,
      percentile: 78,
      trend: 150,
    },
  ]);

  const [peers, setPeers] = useState<PeerComparison[]>([
    {
      company: "Your Organization",
      industry: "SaaS",
      size: "500-1000 employees",
      overallScore: 87,
      cicdScore: 92,
      policyScore: 94,
      vendorScore: 78,
    },
    {
      company: "Industry Leader (Anonymized)",
      industry: "SaaS",
      size: "500-1000 employees",
      overallScore: 94,
      cicdScore: 96,
      policyScore: 97,
      vendorScore: 89,
    },
    {
      company: "Industry Average",
      industry: "SaaS",
      size: "500-1000 employees",
      overallScore: 78,
      cicdScore: 82,
      policyScore: 85,
      vendorScore: 68,
    },
    {
      company: "Peer Company A",
      industry: "SaaS",
      size: "500-1000 employees",
      overallScore: 81,
      cicdScore: 85,
      policyScore: 88,
      vendorScore: 72,
    },
  ]);

  const [gaps, setGaps] = useState<GapAnalysis[]>([
    {
      area: "Third-Party Risk Management",
      yourScore: 78,
      targetScore: 90,
      gap: 12,
      priority: "high",
      recommendation: "Implement continuous vendor monitoring and risk scoring",
    },
    {
      area: "Threat Intelligence Integration",
      yourScore: 65,
      targetScore: 85,
      gap: 20,
      priority: "high",
      recommendation: "Integrate MITRE ATT&CK and threat feeds for better detection",
    },
    {
      area: "Security Automation",
      yourScore: 72,
      targetScore: 88,
      gap: 16,
      priority: "medium",
      recommendation: "Build IFTTT-style workflows for incident response",
    },
    {
      area: "Incident Response",
      yourScore: 84,
      targetScore: 92,
      gap: 8,
      priority: "medium",
      recommendation: "Update playbooks and conduct tabletop exercises",
    },
  ]);

  const stats = {
    yourOverallScore: 87,
    industryAverage: 78,
    percentile: 85,
    gapsToCritical: gaps.filter((g) => g.priority === "critical").length,
  };

  const handleExportReport = () => {
    toast.success("Benchmark report exported");
  };

  const handleCreateCustomBenchmark = () => {
    toast.success("Custom benchmark created");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-600";
      case "high":
        return "bg-orange-500/20 text-orange-600";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600";
      case "low":
        return "bg-blue-500/20 text-blue-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Posture Benchmarking</h1>
        <p className="text-muted-foreground mt-1">
          Compare your security metrics against industry standards and peers
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Overall Score</p>
            <p className="text-5xl font-bold text-green-600 mb-2">{stats.yourOverallScore}</p>
            <p className="text-xs text-muted-foreground">
              {stats.percentile}th percentile vs industry
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Industry Average</p>
            <p className="text-5xl font-bold text-blue-600 mb-2">{stats.industryAverage}</p>
            <p className="text-xs text-muted-foreground">
              ↑ {stats.yourOverallScore - stats.industryAverage} points ahead
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Key Metrics Comparison
          </h2>
          <Button onClick={handleExportReport}>
            <Download className="h-3 w-3 mr-1" />
            Export Report
          </Button>
        </div>

        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{metric.name}</h4>
                <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded font-semibold">
                  {metric.percentile}th percentile
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Your Score</p>
                  <p className="text-lg font-bold text-green-600">{metric.yourScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Industry Avg</p>
                  <p className="text-lg font-bold text-blue-600">{metric.industryAvg}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leader</p>
                  <p className="text-lg font-bold text-purple-600">{metric.leader}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 h-3"
                    style={{ width: `${(metric.yourScore / metric.leader) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${metric.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                  {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-4 w-4" />
          Peer Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold">Organization</th>
                <th className="text-center py-2 px-2 font-semibold">Overall</th>
                <th className="text-center py-2 px-2 font-semibold">CI/CD</th>
                <th className="text-center py-2 px-2 font-semibold">Policies</th>
                <th className="text-center py-2 px-2 font-semibold">Vendors</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer) => (
                <tr key={peer.company} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-3 px-2">
                    <p className="font-semibold">{peer.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {peer.industry} • {peer.size}
                    </p>
                  </td>
                  <td className="text-center py-3 px-2">
                    <p className="font-bold text-lg">{peer.overallScore}</p>
                  </td>
                  <td className="text-center py-3 px-2">
                    <p className="font-bold">{peer.cicdScore}</p>
                  </td>
                  <td className="text-center py-3 px-2">
                    <p className="font-bold">{peer.policyScore}</p>
                  </td>
                  <td className="text-center py-3 px-2">
                    <p className="font-bold">{peer.vendorScore}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Gap Analysis & Recommendations
        </h2>

        <div className="space-y-3">
          {gaps.map((gap) => (
            <div
              key={gap.area}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{gap.area}</h4>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(gap.priority)}`}>
                  {gap.priority}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Current</p>
                  <p className="font-semibold">{gap.yourScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="font-semibold">{gap.targetScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gap</p>
                  <p className="font-semibold text-orange-600">{gap.gap}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Progress</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(gap.yourScore / gap.targetScore) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-2">{gap.recommendation}</p>

              <Button size="sm">
                <Zap className="h-3 w-3 mr-1" />
                Create Action Plan
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Custom Benchmarks
          </h2>
          <Button onClick={handleCreateCustomBenchmark}>
            <Plus className="h-3 w-3 mr-1" />
            Create Benchmark
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="p-3 border border-border rounded flex items-center justify-between">
            <div>
              <p className="font-semibold">Fortune 500 Companies</p>
              <p className="text-xs text-muted-foreground">Average score: 92</p>
            </div>
            <Button size="sm" variant="outline">
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="p-3 border border-border rounded flex items-center justify-between">
            <div>
              <p className="font-semibold">FinTech Industry</p>
              <p className="text-xs text-muted-foreground">Average score: 88</p>
            </div>
            <Button size="sm" variant="outline">
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="p-3 border border-border rounded flex items-center justify-between">
            <div>
              <p className="font-semibold">SaaS Companies (500-1000 employees)</p>
              <p className="text-xs text-muted-foreground">Average score: 82</p>
            </div>
            <Button size="sm" variant="outline">
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
