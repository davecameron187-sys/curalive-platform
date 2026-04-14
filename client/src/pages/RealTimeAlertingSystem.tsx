import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  Zap,
  TrendingUp,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: number;
  status: "active" | "acknowledged" | "resolved";
  escalationLevel: number;
  onCallEngineer?: string;
}

interface EscalationPolicy {
  id: string;
  name: string;
  level: number;
  delay: number;
  channels: string[];
  targetTeam: string;
}

interface IncidentCorrelation {
  id: string;
  alerts: string[];
  rootCause: string;
  affectedServices: string[];
  correlationScore: number;
}

export default function RealTimeAlertingSystem() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "alert-001",
      title: "Critical: Vulnerability in Recall.ai Integration",
      severity: "critical",
      source: "CI/CD Security Scanning",
      timestamp: Date.now() - 300000,
      status: "active",
      escalationLevel: 3,
      onCallEngineer: "Sarah Chen",
    },
    {
      id: "alert-002",
      title: "High: Policy Violation - Data Retention",
      severity: "high",
      source: "Policy Compliance",
      timestamp: Date.now() - 1800000,
      status: "acknowledged",
      escalationLevel: 2,
      onCallEngineer: "James Wilson",
    },
    {
      id: "alert-003",
      title: "Medium: Vendor Risk Score Increased",
      severity: "medium",
      source: "Vendor Risk Management",
      timestamp: Date.now() - 3600000,
      status: "acknowledged",
      escalationLevel: 1,
    },
    {
      id: "alert-004",
      title: "Low: Compliance Report Generation Delayed",
      severity: "low",
      source: "Compliance Reporting",
      timestamp: Date.now() - 7200000,
      status: "resolved",
      escalationLevel: 1,
    },
  ]);

  const [escalationPolicies, setEscalationPolicies] = useState<EscalationPolicy[]>([
    {
      id: "policy-001",
      name: "Critical Security Issues",
      level: 1,
      delay: 0,
      channels: ["Slack", "Email"],
      targetTeam: "Security Team",
    },
    {
      id: "policy-002",
      name: "High Priority Escalation",
      level: 2,
      delay: 300,
      channels: ["Slack", "Email", "SMS"],
      targetTeam: "Engineering Lead",
    },
    {
      id: "policy-003",
      name: "Executive Escalation",
      level: 3,
      delay: 600,
      channels: ["Email", "SMS", "PagerDuty"],
      targetTeam: "CTO",
    },
  ]);

  const [correlations, setCorrelations] = useState<IncidentCorrelation[]>([
    {
      id: "corr-001",
      alerts: ["alert-001", "alert-002"],
      rootCause: "Recall.ai API timeout causing cascading failures",
      affectedServices: ["Transcription", "Compliance Monitoring"],
      correlationScore: 0.92,
    },
  ]);

  const stats = {
    activeAlerts: alerts.filter((a) => a.status === "active").length,
    acknowledgedAlerts: alerts.filter((a) => a.status === "acknowledged").length,
    criticalCount: alerts.filter((a) => a.severity === "critical").length,
    correlatedIncidents: correlations.length,
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    toast.success("Alert acknowledged");
  };

  const handleResolveAlert = (alertId: string) => {
    toast.success("Alert resolved");
  };

  const handleEscalateAlert = (alertId: string) => {
    toast.success("Alert escalated to next level");
  };

  const handleSuppressAlert = (alertId: string) => {
    toast.success("Alert suppressed for 1 hour");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500/20 text-red-600";
      case "acknowledged":
        return "bg-yellow-500/20 text-yellow-600";
      case "resolved":
        return "bg-green-500/20 text-green-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-Time Alerting System</h1>
        <p className="text-muted-foreground mt-1">
          WebSocket-based alerts with escalation policies and incident correlation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Alerts</p>
          <p className="text-3xl font-bold text-red-600">{stats.activeAlerts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Acknowledged</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.acknowledgedAlerts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.criticalCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Correlated</p>
          <p className="text-3xl font-bold">{stats.correlatedIncidents}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </h2>
          <Button variant="outline">Clear Resolved</Button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.source} • {Math.floor((Date.now() - alert.timestamp) / (1000 * 60))} min ago
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Escalation Level</p>
                  <p className="font-semibold">{alert.escalationLevel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">On-Call</p>
                  <p className="font-semibold">{alert.onCallEngineer || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Correlation</p>
                  <p className="font-semibold">
                    {correlations.filter((c) => c.alerts.includes(alert.id)).length} incident(s)
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {alert.status === "active" && (
                  <>
                    <Button size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      Acknowledge
                    </Button>
                    <Button size="sm" onClick={() => handleEscalateAlert(alert.id)} variant="outline">
                      Escalate
                    </Button>
                  </>
                )}
                {alert.status === "acknowledged" && (
                  <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>
                    Resolve
                  </Button>
                )}
                <Button size="sm" onClick={() => handleSuppressAlert(alert.id)} variant="outline">
                  Snooze
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Escalation Policies
          </h2>

          <div className="space-y-3">
            {escalationPolicies.map((policy) => (
              <div key={policy.id} className="p-3 border border-border rounded">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{policy.name}</p>
                  <span className="text-xs bg-secondary px-2 py-1 rounded font-semibold">
                    Level {policy.level}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Delay: {policy.delay}s</p>
                  <p>Channels: {policy.channels.join(", ")}</p>
                  <p>Team: {policy.targetTeam}</p>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4">Add Policy</Button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Incident Correlation
          </h2>

          <div className="space-y-3">
            {correlations.map((correlation) => (
              <div key={correlation.id} className="p-3 border border-border rounded">
                <p className="font-semibold text-sm mb-2">{correlation.rootCause}</p>

                <div className="text-xs text-muted-foreground space-y-1 mb-2">
                  <p>Alerts: {correlation.alerts.length}</p>
                  <p>Services: {correlation.affectedServices.join(", ")}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Correlation Score</p>
                  <p className="font-semibold text-green-600">
                    {(correlation.correlationScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notification Channels
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Mail, label: "Email", enabled: true },
            { icon: MessageSquare, label: "Slack", enabled: true },
            { icon: Phone, label: "SMS", enabled: true },
            { icon: Zap, label: "PagerDuty", enabled: true },
          ].map(({ icon: Icon, label, enabled }) => (
            <div key={label} className="p-3 border border-border rounded text-center">
              <Icon className="h-4 w-4 mx-auto mb-2" />
              <p className="text-xs font-semibold">{label}</p>
              <p className={`text-xs mt-1 ${enabled ? "text-green-600" : "text-gray-600"}`}>
                {enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
