import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  FileText,
  Zap,
  Eye,
  Radar,
} from "lucide-react";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  type: "user_activity" | "data_access" | "api_usage";
  description: string;
  anomalyScore: number;
  severity: "critical" | "high" | "medium" | "low";
  detectedAt: number;
  user: string;
  status: "investigating" | "resolved" | "false_positive";
}

export default function AdvancedThreatDetectionDashboard() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: "anom-001",
      type: "user_activity",
      description: "Unusual login from new location (Singapore)",
      anomalyScore: 87,
      severity: "high",
      detectedAt: Date.now() - 1800000,
      user: "alice@company.com",
      status: "investigating",
    },
    {
      id: "anom-002",
      type: "data_access",
      description: "Bulk download of 50GB from database (unusual for this user)",
      anomalyScore: 92,
      severity: "critical",
      detectedAt: Date.now() - 3600000,
      user: "bob@company.com",
      status: "investigating",
    },
    {
      id: "anom-003",
      type: "api_usage",
      description: "API rate limit exceeded (10x normal usage)",
      anomalyScore: 78,
      severity: "high",
      detectedAt: Date.now() - 7200000,
      user: "service-account-prod",
      status: "resolved",
    },
    {
      id: "anom-004",
      type: "user_activity",
      description: "Access to sensitive files outside business hours",
      anomalyScore: 65,
      severity: "medium",
      detectedAt: Date.now() - 10800000,
      user: "carol@company.com",
      status: "false_positive",
    },
    {
      id: "anom-005",
      type: "data_access",
      description: "Attempt to access compliance logs without authorization",
      anomalyScore: 95,
      severity: "critical",
      detectedAt: Date.now() - 14400000,
      user: "unknown-user",
      status: "investigating",
    },
  ]);

  const stats = {
    critical: anomalies.filter((a) => a.severity === "critical").length,
    high: anomalies.filter((a) => a.severity === "high").length,
    investigating: anomalies.filter((a) => a.status === "investigating").length,
    avgScore: Math.round(
      anomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / anomalies.length
    ),
  };

  const handleInvestigate = (anomalyId: string) => {
    toast.success("Investigation initiated");
  };

  const handleMarkResolved = (anomalyId: string) => {
    toast.success("Anomaly marked as resolved");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user_activity":
        return "👤";
      case "data_access":
        return "📊";
      case "api_usage":
        return "⚙️";
      default:
        return "⚠️";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Threat Detection</h1>
        <p className="text-muted-foreground mt-1">
          Behavioral analytics and anomaly detection with ML-based scoring
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">High</p>
          <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Investigating</p>
          <p className="text-3xl font-bold">{stats.investigating}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Anomaly Score</p>
          <p className="text-3xl font-bold">{stats.avgScore}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Radar className="h-4 w-4" />
          Detected Anomalies
        </h2>

        <div className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getTypeIcon(anomaly.type)}</span>
                    <h4 className="font-semibold text-sm">
                      {anomaly.description}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${getSeverityColor(
                        anomaly.severity
                      )}`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    User: {anomaly.user} | Type: {anomaly.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{anomaly.anomalyScore}</p>
                  <p className="text-xs text-muted-foreground">anomaly score</p>
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    anomaly.status === "investigating"
                      ? "bg-blue-500/20 text-blue-600"
                      : anomaly.status === "resolved"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {anomaly.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round((Date.now() - anomaly.detectedAt) / 60000)}m ago
                </span>
              </div>

              <div className="flex gap-2">
                {anomaly.status === "investigating" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleInvestigate(anomaly.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkResolved(anomaly.id)}
                    >
                      Mark Resolved
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Behavioral Baselines
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Login Patterns</p>
              <p className="text-muted-foreground text-xs mt-1">
                Typical: 9-17 UTC, US-East region
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Data Access</p>
              <p className="text-muted-foreground text-xs mt-1">
                Typical: 100MB/day, business hours only
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">API Usage</p>
              <p className="text-muted-foreground text-xs mt-1">
                Typical: 500 calls/hour, consistent patterns
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            ML Model Performance
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Precision</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: "94%" }} />
              </div>
              <p className="text-muted-foreground text-xs mt-1">94% accuracy</p>
            </div>

            <div>
              <p className="font-semibold">Recall</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: "87%" }} />
              </div>
              <p className="text-muted-foreground text-xs mt-1">87% detection rate</p>
            </div>

            <div>
              <p className="font-semibold">False Positive Rate</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-1">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "8%" }} />
              </div>
              <p className="text-muted-foreground text-xs mt-1">8% FPR</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
