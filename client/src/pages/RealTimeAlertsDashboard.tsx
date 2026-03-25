import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Clock,
  Filter,
  Eye,
  Zap,
  TrendingUp,
  Shield,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityAlert {
  id: string;
  timestamp: number;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  status: "new" | "acknowledged" | "investigating" | "resolved";
  affectedAssets: string[];
  correlatedAlerts: number;
  suggestedPlaybook?: string;
  escalationLevel: number;
}

interface AlertMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  averageResponseTime: number;
  escalatedAlerts: number;
  resolvedAlerts: number;
}

export default function RealTimeAlertsDashboard() {
  const [alerts] = useState<SecurityAlert[]>([
    {
      id: "ALT-001",
      timestamp: Date.now() - 300000,
      severity: "critical",
      title: "Unauthorized Privilege Escalation Detected",
      description:
        "Multiple failed login attempts followed by successful escalation on server prod-db-01",
      source: "IAM System",
      status: "investigating",
      affectedAssets: ["prod-db-01", "prod-app-02"],
      correlatedAlerts: 3,
      suggestedPlaybook: "PB-002",
      escalationLevel: 3,
    },
    {
      id: "ALT-002",
      timestamp: Date.now() - 600000,
      severity: "high",
      title: "Suspicious Data Access Pattern",
      description:
        "User account accessing 500+ files in 10 minutes from unusual location",
      source: "DLP System",
      status: "acknowledged",
      affectedAssets: ["user-john.doe@company.com"],
      correlatedAlerts: 1,
      suggestedPlaybook: "PB-001",
      escalationLevel: 2,
    },
    {
      id: "ALT-003",
      timestamp: Date.now() - 1200000,
      severity: "high",
      title: "Malware Detection - Ransomware Signature",
      description:
        "Known ransomware signature detected on endpoint dev-laptop-15",
      source: "Endpoint Protection",
      status: "investigating",
      affectedAssets: ["dev-laptop-15"],
      correlatedAlerts: 5,
      suggestedPlaybook: "PB-003",
      escalationLevel: 3,
    },
    {
      id: "ALT-004",
      timestamp: Date.now() - 1800000,
      severity: "medium",
      title: "SSL Certificate Expiration Warning",
      description: "SSL certificate for api.internal.company.com expires in 7 days",
      source: "Certificate Management",
      status: "acknowledged",
      affectedAssets: ["api.internal.company.com"],
      correlatedAlerts: 0,
      escalationLevel: 1,
    },
    {
      id: "ALT-005",
      timestamp: Date.now() - 2400000,
      severity: "medium",
      title: "Unusual Network Traffic Pattern",
      description: "Outbound traffic to known C2 server detected",
      source: "Network IDS",
      status: "resolved",
      affectedAssets: ["prod-web-03"],
      correlatedAlerts: 2,
      escalationLevel: 2,
    },
    {
      id: "ALT-006",
      timestamp: Date.now() - 3600000,
      severity: "low",
      title: "Failed Authentication Attempts",
      description: "10 failed login attempts on admin account",
      source: "Authentication Service",
      status: "resolved",
      affectedAssets: ["admin@company.com"],
      correlatedAlerts: 0,
      escalationLevel: 1,
    },
  ]);

  const metrics: AlertMetrics = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    highAlerts: alerts.filter((a) => a.severity === "high").length,
    mediumAlerts: alerts.filter((a) => a.severity === "medium").length,
    lowAlerts: alerts.filter((a) => a.severity === "low").length,
    averageResponseTime: 15,
    escalatedAlerts: alerts.filter((a) => a.escalationLevel >= 2).length,
    resolvedAlerts: alerts.filter((a) => a.status === "resolved").length,
  };

  const handleAcknowledge = (alertId: string) => {
    toast.success(`Alert ${alertId} acknowledged`);
  };

  const handleEscalate = (alertId: string) => {
    toast.success(`Alert ${alertId} escalated to incident commander`);
  };

  const handleResolve = (alertId: string) => {
    toast.success(`Alert ${alertId} marked as resolved`);
  };

  const handleTriggerPlaybook = (alertId: string, playbookId: string) => {
    toast.success(`Triggered playbook ${playbookId} for alert ${alertId}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-600 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-purple-500/20 text-purple-600";
      case "acknowledged":
        return "bg-blue-500/20 text-blue-600";
      case "investigating":
        return "bg-orange-500/20 text-orange-600";
      case "resolved":
        return "bg-green-500/20 text-green-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-Time Security Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Live alert aggregation, deduplication, and escalation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Alerts</p>
          <p className="text-3xl font-bold">{metrics.totalAlerts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">
            {metrics.criticalAlerts}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">High</p>
          <p className="text-3xl font-bold text-orange-600">
            {metrics.highAlerts}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold">{metrics.averageResponseTime}m</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Medium</p>
          <p className="text-3xl font-bold text-yellow-600">
            {metrics.mediumAlerts}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Low</p>
          <p className="text-3xl font-bold text-blue-600">
            {metrics.lowAlerts}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Escalated</p>
          <p className="text-3xl font-bold text-purple-600">
            {metrics.escalatedAlerts}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Resolved</p>
          <p className="text-3xl font-bold text-green-600">
            {metrics.resolvedAlerts}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </h2>
          <Button size="sm" variant="outline">
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-inherit">
                      {alert.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                    {alert.correlatedAlerts > 0 && (
                      <span className="text-xs px-2 py-1 rounded font-semibold bg-purple-500/20 text-purple-600">
                        +{alert.correlatedAlerts} correlated
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm mt-1">{alert.description}</p>
                  <p className="text-xs mt-2">
                    Source: <span className="font-mono">{alert.source}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: alert.escalationLevel }).map(
                    (_, i) => (
                      <Zap key={i} className="h-4 w-4 text-yellow-500" />
                    )
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold mb-1">Affected Assets:</p>
                <div className="flex flex-wrap gap-1">
                  {alert.affectedAssets.map((asset) => (
                    <span
                      key={asset}
                      className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  {alert.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {alert.status !== "resolved" && (
                    <>
                      {alert.suggestedPlaybook && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleTriggerPlaybook(
                              alert.id,
                              alert.suggestedPlaybook!
                            )
                          }
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Execute
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEscalate(alert.id)}
                      >
                        Escalate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id)}
                      >
                        Resolve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
