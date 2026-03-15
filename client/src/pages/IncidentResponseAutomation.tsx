import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Workflow,
  Settings,
  History,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface AutomatedPlaybook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: PlaybookAction[];
  enabled: boolean;
  executionCount: number;
  successRate: number;
  lastExecuted: number;
  averageDuration: number;
  status: "active" | "paused" | "error";
}

interface PlaybookAction {
  id: string;
  type: "jira" | "notification" | "script" | "webhook" | "email";
  description: string;
  config: Record<string, string>;
  order: number;
  retryable: boolean;
}

interface ExecutionHistory {
  id: string;
  playbookId: string;
  playbookName: string;
  triggeredAt: number;
  completedAt?: number;
  status: "running" | "success" | "failed" | "rolled-back";
  duration: number;
  executedActions: number;
  failedActions: number;
  errorMessage?: string;
}

interface JiraIntegration {
  enabled: boolean;
  projectKey: string;
  issueType: string;
  customFields: Record<string, string>;
  assignee: string;
}

interface NotificationConfig {
  channels: ("email" | "slack" | "teams" | "pagerduty")[];
  recipients: string[];
  escalationPolicy: string;
  urgency: "low" | "medium" | "high" | "critical";
}

export default function IncidentResponseAutomation() {
  const [playbooks] = useState<AutomatedPlaybook[]>([
    {
      id: "PB-001",
      name: "Critical Vulnerability Response",
      description: "Automatic response to critical vulnerabilities",
      trigger: "vulnerability.severity >= critical",
      actions: [
        {
          id: "ACT-001",
          type: "jira",
          description: "Create critical security ticket",
          config: { projectKey: "SEC", issueType: "Security Issue" },
          order: 1,
          retryable: true,
        },
        {
          id: "ACT-002",
          type: "notification",
          description: "Alert security team",
          config: { channels: "slack,email", urgency: "critical" },
          order: 2,
          retryable: true,
        },
        {
          id: "ACT-003",
          type: "script",
          description: "Isolate affected systems",
          config: { scriptId: "isolation-script-v2" },
          order: 3,
          retryable: false,
        },
      ],
      enabled: true,
      executionCount: 12,
      successRate: 92,
      lastExecuted: Date.now() - 86400000,
      averageDuration: 45,
      status: "active",
    },
    {
      id: "PB-002",
      name: "Data Exfiltration Detection",
      description: "Automated response to data exfiltration attempts",
      trigger: "alert.type == data_exfiltration",
      actions: [
        {
          id: "ACT-004",
          type: "webhook",
          description: "Block user accounts",
          config: { endpoint: "https://api.idp.com/block" },
          order: 1,
          retryable: true,
        },
        {
          id: "ACT-005",
          type: "email",
          description: "Notify incident response team",
          config: { template: "data-exfil-alert" },
          order: 2,
          retryable: true,
        },
      ],
      enabled: true,
      executionCount: 8,
      successRate: 88,
      lastExecuted: Date.now() - 259200000,
      averageDuration: 32,
      status: "active",
    },
    {
      id: "PB-003",
      name: "Ransomware Attack Response",
      description: "Coordinated response to ransomware detection",
      trigger: "malware.type == ransomware",
      actions: [
        {
          id: "ACT-006",
          type: "script",
          description: "Isolate network segments",
          config: { scriptId: "network-isolation" },
          order: 1,
          retryable: false,
        },
        {
          id: "ACT-007",
          type: "jira",
          description: "Create incident ticket",
          config: { projectKey: "INC", issueType: "Incident" },
          order: 2,
          retryable: true,
        },
        {
          id: "ACT-008",
          type: "notification",
          description: "Page on-call incident commander",
          config: { channels: "pagerduty", urgency: "critical" },
          order: 3,
          retryable: true,
        },
      ],
      enabled: true,
      executionCount: 3,
      successRate: 100,
      lastExecuted: Date.now() - 604800000,
      averageDuration: 58,
      status: "active",
    },
  ]);

  const [executionHistory] = useState<ExecutionHistory[]>([
    {
      id: "EXE-001",
      playbookId: "PB-001",
      playbookName: "Critical Vulnerability Response",
      triggeredAt: Date.now() - 86400000,
      completedAt: Date.now() - 86399915,
      status: "success",
      duration: 85,
      executedActions: 3,
      failedActions: 0,
    },
    {
      id: "EXE-002",
      playbookId: "PB-002",
      playbookName: "Data Exfiltration Detection",
      triggeredAt: Date.now() - 259200000,
      completedAt: Date.now() - 259199968,
      status: "success",
      duration: 32,
      executedActions: 2,
      failedActions: 0,
    },
    {
      id: "EXE-003",
      playbookId: "PB-001",
      playbookName: "Critical Vulnerability Response",
      triggeredAt: Date.now() - 172800000,
      completedAt: Date.now() - 172799875,
      status: "success",
      duration: 125,
      executedActions: 3,
      failedActions: 0,
    },
  ]);

  const handleExecutePlaybook = (playbookId: string) => {
    toast.success(`Executing playbook ${playbookId}`);
  };

  const handleEditPlaybook = (playbookId: string) => {
    toast.success(`Editing playbook ${playbookId}`);
  };

  const handleDeletePlaybook = (playbookId: string) => {
    toast.success(`Deleted playbook ${playbookId}`);
  };

  const handleRollback = (executionId: string) => {
    toast.success(`Rolling back execution ${executionId}`);
  };

  const totalExecutions = executionHistory.length;
  const successfulExecutions = executionHistory.filter(
    (e) => e.status === "success"
  ).length;
  const averageSuccessRate =
    Math.round(
      playbooks.reduce((sum, p) => sum + p.successRate, 0) / playbooks.length
    ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident Response Automation</h1>
        <p className="text-muted-foreground mt-1">
          Automated playbooks for coordinated incident response
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Playbooks</p>
          <p className="text-3xl font-bold text-blue-600">{playbooks.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
          <p className="text-3xl font-bold">{totalExecutions}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {averageSuccessRate}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Successful</p>
          <p className="text-3xl font-bold text-green-600">
            {successfulExecutions}/{totalExecutions}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Automated Playbooks
          </h2>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            New Playbook
          </Button>
        </div>

        <div className="space-y-3">
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
                        playbook.status === "active"
                          ? "bg-green-500/20 text-green-600"
                          : playbook.status === "paused"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {playbook.status}
                    </span>
                    {playbook.enabled && (
                      <span className="text-xs px-2 py-1 rounded font-semibold bg-blue-500/20 text-blue-600">
                        Enabled
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold">{playbook.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {playbook.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Trigger: {playbook.trigger}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExecutePlaybook(playbook.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPlaybook(playbook.id)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Actions ({playbook.actions.length}):
                </p>
                {playbook.actions.map((action) => (
                  <div
                    key={action.id}
                    className="text-xs p-2 bg-secondary rounded flex items-center gap-2"
                  >
                    <span className="font-mono text-muted-foreground">
                      {action.order}.
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        action.type === "jira"
                          ? "bg-blue-500/20 text-blue-600"
                          : action.type === "notification"
                            ? "bg-purple-500/20 text-purple-600"
                            : action.type === "script"
                              ? "bg-green-500/20 text-green-600"
                              : action.type === "webhook"
                                ? "bg-orange-500/20 text-orange-600"
                                : "bg-pink-500/20 text-pink-600"
                      }`}
                    >
                      {action.type}
                    </span>
                    <span className="flex-1">{action.description}</span>
                    {action.retryable && (
                      <span className="text-xs text-muted-foreground">
                        (retryable)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{playbook.executionCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold text-green-600">
                    {playbook.successRate}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-semibold">{playbook.averageDuration}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Executed</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - playbook.lastExecuted) / 86400000)}d ago
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <History className="h-4 w-4" />
          Execution History
        </h2>

        <div className="space-y-3">
          {executionHistory.map((execution) => (
            <div
              key={execution.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {execution.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        execution.status === "success"
                          ? "bg-green-500/20 text-green-600"
                          : execution.status === "running"
                            ? "bg-blue-500/20 text-blue-600"
                            : execution.status === "failed"
                              ? "bg-red-500/20 text-red-600"
                              : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {execution.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{execution.playbookName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Triggered:{" "}
                    {new Date(execution.triggeredAt).toLocaleString()}
                  </p>
                </div>
                {execution.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRollback(execution.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{execution.duration}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actions Executed</p>
                  <p className="font-semibold">{execution.executedActions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p
                    className={`font-semibold ${
                      execution.failedActions > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {execution.failedActions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold">
                    {execution.completedAt
                      ? new Date(execution.completedAt).toLocaleTimeString()
                      : "Running"}
                  </p>
                </div>
              </div>

              {execution.errorMessage && (
                <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-600">
                  {execution.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
