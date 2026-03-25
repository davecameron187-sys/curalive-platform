import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Zap,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  TrendingUp,
  Play,
  Pause,
  Settings,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface IncidentAlert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: number;
  status: "new" | "correlating" | "assigned" | "responding" | "resolved";
  correlatedAlerts: number;
  suggestedPlaybook: string;
  confidence: number;
}

interface PlaybookExecution {
  id: string;
  name: string;
  incidentId: string;
  status: "pending_approval" | "executing" | "completed" | "failed";
  startTime: number;
  duration: number;
  steps: PlaybookStep[];
  approver?: string;
  approvalTime?: number;
}

interface PlaybookStep {
  id: string;
  name: string;
  action: string;
  status: "pending" | "executing" | "completed" | "failed";
  duration: number;
  output?: string;
}

interface IncidentMetric {
  name: string;
  value: number | string;
  unit: string;
  trend: "improving" | "stable" | "declining";
  change: number;
}

export default function AutomatedIncidentResponse() {
  const [incidents] = useState<IncidentAlert[]>([
    {
      id: "INC-001",
      title: "Critical: Unauthorized API Access Detected",
      severity: "critical",
      source: "Threat Intelligence",
      timestamp: Date.now() - 300000,
      status: "responding",
      correlatedAlerts: 5,
      suggestedPlaybook: "Data Exfiltration Response",
      confidence: 98,
    },
    {
      id: "INC-002",
      title: "High: Suspicious Privilege Escalation",
      severity: "high",
      source: "IAM Monitoring",
      timestamp: Date.now() - 600000,
      status: "assigned",
      correlatedAlerts: 3,
      suggestedPlaybook: "Insider Threat Response",
      confidence: 92,
    },
    {
      id: "INC-003",
      title: "Medium: Multiple Failed Login Attempts",
      severity: "medium",
      source: "Authentication Logs",
      timestamp: Date.now() - 900000,
      status: "correlating",
      correlatedAlerts: 2,
      suggestedPlaybook: "Brute Force Response",
      confidence: 85,
    },
    {
      id: "INC-004",
      title: "Low: Policy Violation Detected",
      severity: "low",
      source: "Policy Management",
      timestamp: Date.now() - 1200000,
      status: "new",
      correlatedAlerts: 1,
      suggestedPlaybook: "Policy Violation Response",
      confidence: 78,
    },
  ]);

  const [playbooks] = useState<PlaybookExecution[]>([
    {
      id: "PB-001",
      name: "Data Exfiltration Response",
      incidentId: "INC-001",
      status: "executing",
      startTime: Date.now() - 180000,
      duration: 180000,
      steps: [
        {
          id: "s-001",
          name: "Isolate Affected Systems",
          action: "network_isolation",
          status: "completed",
          duration: 45000,
          output: "3 systems isolated successfully",
        },
        {
          id: "s-002",
          name: "Collect Forensic Evidence",
          action: "evidence_collection",
          status: "executing",
          duration: 60000,
          output: "Collecting logs and network traffic...",
        },
        {
          id: "s-003",
          name: "Notify Security Team",
          action: "notification",
          status: "pending",
          duration: 15000,
        },
        {
          id: "s-004",
          name: "Create Incident Ticket",
          action: "ticket_creation",
          status: "pending",
          duration: 10000,
        },
      ],
      approver: "John Smith",
      approvalTime: Date.now() - 120000,
    },
    {
      id: "PB-002",
      name: "Insider Threat Response",
      incidentId: "INC-002",
      status: "pending_approval",
      startTime: Date.now() - 60000,
      duration: 0,
      steps: [
        {
          id: "s-005",
          name: "Revoke Access Credentials",
          action: "access_revocation",
          status: "pending",
          duration: 30000,
        },
        {
          id: "s-006",
          name: "Audit User Activity",
          action: "activity_audit",
          status: "pending",
          duration: 120000,
        },
        {
          id: "s-007",
          name: "Notify HR Department",
          action: "hr_notification",
          status: "pending",
          duration: 15000,
        },
      ],
    },
  ]);

  const [metrics] = useState<IncidentMetric[]>([
    {
      name: "Mean Time to Detection",
      value: "2.3",
      unit: "minutes",
      trend: "improving",
      change: -0.5,
    },
    {
      name: "Mean Time to Response",
      value: "8.7",
      unit: "minutes",
      trend: "improving",
      change: -1.2,
    },
    {
      name: "Automated Response Rate",
      value: "87%",
      unit: "percent",
      trend: "improving",
      change: 5,
    },
    {
      name: "False Positive Rate",
      value: "3.2%",
      unit: "percent",
      trend: "improving",
      change: -0.8,
    },
    {
      name: "Playbook Success Rate",
      value: "94%",
      unit: "percent",
      trend: "stable",
      change: 0,
    },
    {
      name: "Incidents This Month",
      value: "24",
      unit: "total",
      trend: "declining",
      change: -3,
    },
  ]);

  const handleApprovePlaybook = (playbookId: string) => {
    toast.success(`Playbook ${playbookId} approved and executing`);
  };

  const handleRejectPlaybook = (playbookId: string) => {
    toast.error(`Playbook ${playbookId} rejected`);
  };

  const handlePausePlaybook = (playbookId: string) => {
    toast.info(`Playbook ${playbookId} paused`);
  };

  const handleViewDetails = (incidentId: string) => {
    toast.success(`Viewing details for ${incidentId}`);
  };

  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const respondingCount = incidents.filter((i) => i.status === "responding").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automated Incident Response</h1>
        <p className="text-muted-foreground mt-1">
          AI-driven incident correlation, severity assignment, and automated playbook execution
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical Incidents</p>
          <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">High Severity</p>
          <p className="text-3xl font-bold text-orange-600">{highCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Responding</p>
          <p className="text-3xl font-bold text-blue-600">{respondingCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Incidents</p>
          <p className="text-3xl font-bold">{incidents.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Active Incidents & Alert Correlation
        </h2>

        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        incident.severity === "critical"
                          ? "bg-red-500/20 text-red-600"
                          : incident.severity === "high"
                            ? "bg-orange-500/20 text-orange-600"
                            : incident.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {incident.id}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{incident.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {incident.source} • Detected{" "}
                    {Math.floor((Date.now() - incident.timestamp) / 60000)}m ago
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      incident.status === "responding"
                        ? "bg-blue-500/20 text-blue-600"
                        : incident.status === "assigned"
                          ? "bg-purple-500/20 text-purple-600"
                          : incident.status === "correlating"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {incident.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(incident.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Correlated Alerts</p>
                  <p className="font-semibold">{incident.correlatedAlerts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-semibold">{incident.confidence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Suggested Playbook</p>
                  <p className="font-semibold">{incident.suggestedPlaybook}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <Button size="sm" variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Play className="h-4 w-4" />
          Playbook Execution & Approval
        </h2>

        <div className="space-y-4">
          {playbooks.map((playbook) => (
            <div
              key={playbook.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {playbook.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        playbook.status === "executing"
                          ? "bg-blue-500/20 text-blue-600"
                          : playbook.status === "pending_approval"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : playbook.status === "completed"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {playbook.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{playbook.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incident: {playbook.incidentId}
                    {playbook.approver && ` • Approved by ${playbook.approver}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {playbook.status === "pending_approval" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprovePlaybook(playbook.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectPlaybook(playbook.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {playbook.status === "executing" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePausePlaybook(playbook.id)}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {playbook.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-3 bg-secondary/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          Step {idx + 1}
                        </span>
                        <p className="font-semibold text-sm">{step.name}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            step.status === "completed"
                              ? "bg-green-500/20 text-green-600"
                              : step.status === "executing"
                                ? "bg-blue-500/20 text-blue-600"
                                : step.status === "failed"
                                  ? "bg-red-500/20 text-red-600"
                                  : "bg-gray-500/20 text-gray-600"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(step.duration / 1000)}s
                      </span>
                    </div>
                    {step.output && (
                      <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded font-mono">
                        {step.output}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Incident Response Metrics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-2">{metric.name}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {metric.value}
                    <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    metric.trend === "improving"
                      ? "text-green-600"
                      : metric.trend === "stable"
                        ? "text-blue-600"
                        : "text-red-600"
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {metric.change > 0 ? "+" : ""}{metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
