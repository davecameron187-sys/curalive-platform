import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  Zap,
  Eye,
  Plus,
  Settings,
  BarChart3,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface MonitoringAlert {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  timestamp: number;
  source: string;
  status: "active" | "acknowledged" | "resolved";
  automatedResponse?: string;
}

interface AnomalyDetection {
  id: string;
  anomaly: string;
  confidence: number;
  affectedAssets: number;
  firstDetected: number;
  status: "investigating" | "confirmed" | "false-positive";
  riskScore: number;
}

interface BehavioralAnalytics {
  metric: string;
  baseline: number;
  current: number;
  deviation: number;
  trend: "increasing" | "decreasing" | "stable";
  status: "normal" | "warning" | "critical";
}

interface AutomatedResponse {
  id: string;
  trigger: string;
  action: string;
  executionCount: number;
  successRate: number;
  lastExecuted: number;
  status: "active" | "inactive";
}

export default function ContinuousSecurityMonitoring() {
  const [alerts] = useState<MonitoringAlert[]>([
    {
      id: "alr-001",
      type: "Suspicious Login",
      severity: "high",
      message: "Multiple failed login attempts from unusual location",
      timestamp: Date.now() - 600000,
      source: "Identity Provider",
      status: "active",
      automatedResponse: "Account temporarily locked",
    },
    {
      id: "alr-002",
      type: "Malware Detection",
      severity: "critical",
      message: "Malware signature detected on production server",
      timestamp: Date.now() - 1200000,
      source: "Endpoint Protection",
      status: "acknowledged",
      automatedResponse: "Server isolated from network",
    },
    {
      id: "alr-003",
      type: "Data Exfiltration",
      severity: "high",
      message: "Unusual data transfer to external IP detected",
      timestamp: Date.now() - 3600000,
      source: "Network IDS",
      status: "resolved",
      automatedResponse: "Connection blocked",
    },
    {
      id: "alr-004",
      type: "Configuration Change",
      severity: "medium",
      message: "Unauthorized firewall rule modification detected",
      timestamp: Date.now() - 7200000,
      source: "Configuration Management",
      status: "acknowledged",
    },
  ]);

  const [anomalies] = useState<AnomalyDetection[]>([
    {
      id: "anom-001",
      anomaly: "Unusual CPU Usage Pattern",
      confidence: 94,
      affectedAssets: 3,
      firstDetected: Date.now() - 1800000,
      status: "investigating",
      riskScore: 78,
    },
    {
      id: "anom-002",
      anomaly: "Abnormal Network Traffic",
      confidence: 87,
      affectedAssets: 5,
      firstDetected: Date.now() - 3600000,
      status: "confirmed",
      riskScore: 82,
    },
    {
      id: "anom-003",
      anomaly: "Unexpected Process Execution",
      confidence: 91,
      affectedAssets: 1,
      firstDetected: Date.now() - 5400000,
      status: "false-positive",
      riskScore: 45,
    },
  ]);

  const [behavioral] = useState<BehavioralAnalytics[]>([
    {
      metric: "Login Attempts/Hour",
      baseline: 150,
      current: 342,
      deviation: 128,
      trend: "increasing",
      status: "warning",
    },
    {
      metric: "Data Access Requests",
      baseline: 450,
      current: 1205,
      deviation: 168,
      trend: "increasing",
      status: "critical",
    },
    {
      metric: "Failed Authentication",
      baseline: 5,
      current: 23,
      deviation: 360,
      trend: "increasing",
      status: "critical",
    },
    {
      metric: "Privilege Escalations",
      baseline: 2,
      current: 8,
      deviation: 300,
      trend: "increasing",
      status: "warning",
    },
  ]);

  const [automatedResponses] = useState<AutomatedResponse[]>([
    {
      id: "resp-001",
      trigger: "Failed login attempts > 5",
      action: "Lock account for 30 minutes",
      executionCount: 47,
      successRate: 100,
      lastExecuted: Date.now() - 600000,
      status: "active",
    },
    {
      id: "resp-002",
      trigger: "Malware detected",
      action: "Isolate endpoint from network",
      executionCount: 12,
      successRate: 98,
      lastExecuted: Date.now() - 1200000,
      status: "active",
    },
    {
      id: "resp-003",
      trigger: "Data exfiltration detected",
      action: "Block outbound connection",
      executionCount: 8,
      successRate: 100,
      lastExecuted: Date.now() - 3600000,
      status: "active",
    },
    {
      id: "resp-004",
      trigger: "Privilege escalation attempt",
      action: "Revoke elevated privileges",
      executionCount: 3,
      successRate: 100,
      lastExecuted: Date.now() - 7200000,
      status: "inactive",
    },
  ]);

  const handleAcknowledgeAlert = () => {
    toast.success("Alert acknowledged");
  };

  const handleCreateTrigger = () => {
    toast.success("New monitoring trigger created");
  };

  const handleTestResponse = () => {
    toast.success("Automated response tested successfully");
  };

  const stats = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    activeAnomalies: anomalies.filter((a) => a.status === "investigating").length,
    automatedResponses: automatedResponses.filter((r) => r.status === "active").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Continuous Security Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Real-time monitoring with anomaly detection and automated response
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Alerts</p>
          <p className="text-3xl font-bold">{stats.totalAlerts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical Alerts</p>
          <p className="text-3xl font-bold text-red-600">{stats.criticalAlerts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Anomalies</p>
          <p className="text-3xl font-bold text-orange-600">{stats.activeAnomalies}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Automated Responses</p>
          <p className="text-3xl font-bold text-green-600">{stats.automatedResponses}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Real-Time Alerts
          </h2>
          <Button onClick={handleAcknowledgeAlert}>
            <Eye className="h-3 w-3 mr-1" />
            Acknowledge
          </Button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{alert.type}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    alert.severity === "critical"
                      ? "bg-red-500/20 text-red-600"
                      : alert.severity === "high"
                        ? "bg-orange-500/20 text-orange-600"
                        : alert.severity === "medium"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-blue-500/20 text-blue-600"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-semibold">{alert.source}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{alert.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - alert.timestamp) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Response</p>
                  <p className="font-semibold">{alert.automatedResponse || "Manual"}</p>
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
          <Zap className="h-4 w-4" />
          Anomaly Detection
        </h2>

        <div className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{anomaly.anomaly}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Affects {anomaly.affectedAssets} asset(s)
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    anomaly.status === "investigating"
                      ? "bg-orange-500/20 text-orange-600"
                      : anomaly.status === "confirmed"
                        ? "bg-red-500/20 text-red-600"
                        : "bg-green-500/20 text-green-600"
                  }`}
                >
                  {anomaly.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-semibold">{anomaly.confidence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Risk Score</p>
                  <p className="font-semibold">{anomaly.riskScore}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detected</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - anomaly.firstDetected) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        anomaly.riskScore >= 80
                          ? "bg-red-600"
                          : anomaly.riskScore >= 60
                            ? "bg-orange-600"
                            : "bg-yellow-600"
                      }`}
                      style={{ width: `${anomaly.riskScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Investigate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Behavioral Analytics
        </h2>

        <div className="space-y-3">
          {behavioral.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{metric.metric}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Baseline: {metric.baseline} • Current: {metric.current}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    metric.status === "normal"
                      ? "bg-green-500/20 text-green-600"
                      : metric.status === "warning"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {metric.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Deviation</p>
                  <p className="font-semibold">+{metric.deviation}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trend</p>
                  <p className="font-semibold flex items-center gap-1">
                    {metric.trend === "increasing" && <TrendingDown className="h-3 w-3 text-red-600" />}
                    {metric.trend}
                  </p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.status === "critical"
                          ? "bg-red-600"
                          : metric.status === "warning"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                      }`}
                      style={{ width: `${Math.min((metric.deviation / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Automated Response Triggers
          </h2>
          <Button onClick={handleCreateTrigger}>
            <Plus className="h-3 w-3 mr-1" />
            New Trigger
          </Button>
        </div>

        <div className="space-y-3">
          {automatedResponses.map((response) => (
            <div
              key={response.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{response.trigger}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Action: {response.action}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    response.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {response.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{response.executionCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{response.successRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Executed</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - response.lastExecuted) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <Button size="sm" onClick={handleTestResponse} variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
