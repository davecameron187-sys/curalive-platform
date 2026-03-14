import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Play,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

interface Playbook {
  id: string;
  name: string;
  category: string;
  trigger: string;
  actions: number;
  status: "active" | "draft" | "archived";
  executionCount: number;
  successRate: number;
  lastExecuted: number;
  version: number;
}

interface PlaybookExecution {
  id: string;
  playbookId: string;
  playbookName: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "paused";
  executedActions: number;
  totalActions: number;
  errorMessage?: string;
}

interface PlaybookAction {
  id: string;
  playbookId: string;
  order: number;
  tool: string;
  action: string;
  condition?: string;
  timeout: number;
}

export default function SecurityOrchestrationResponse() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([
    {
      id: "pb-001",
      name: "Critical Vulnerability Response",
      category: "Vulnerability",
      trigger: "CVSS Score > 9.0",
      actions: 8,
      status: "active",
      executionCount: 12,
      successRate: 0.92,
      lastExecuted: Date.now() - 86400000,
      version: 3,
    },
    {
      id: "pb-002",
      name: "Unauthorized Access Alert",
      category: "Access Control",
      trigger: "Failed login attempts > 5",
      actions: 6,
      status: "active",
      executionCount: 28,
      successRate: 0.96,
      lastExecuted: Date.now() - 3600000,
      version: 2,
    },
    {
      id: "pb-003",
      name: "Data Exfiltration Detection",
      category: "Data Protection",
      trigger: "Unusual data access pattern",
      actions: 10,
      status: "active",
      executionCount: 5,
      successRate: 0.8,
      lastExecuted: Date.now() - 172800000,
      version: 1,
    },
    {
      id: "pb-004",
      name: "Malware Detection Response",
      category: "Endpoint Security",
      trigger: "Malware signature detected",
      actions: 12,
      status: "draft",
      executionCount: 0,
      successRate: 0,
      lastExecuted: 0,
      version: 1,
    },
  ]);

  const [executions, setExecutions] = useState<PlaybookExecution[]>([
    {
      id: "exec-001",
      playbookId: "pb-001",
      playbookName: "Critical Vulnerability Response",
      startTime: Date.now() - 86400000,
      endTime: Date.now() - 82800000,
      status: "completed",
      executedActions: 8,
      totalActions: 8,
    },
    {
      id: "exec-002",
      playbookId: "pb-002",
      playbookName: "Unauthorized Access Alert",
      startTime: Date.now() - 3600000,
      endTime: Date.now() - 3540000,
      status: "completed",
      executedActions: 6,
      totalActions: 6,
    },
    {
      id: "exec-003",
      playbookId: "pb-002",
      playbookName: "Unauthorized Access Alert",
      startTime: Date.now() - 1800000,
      status: "running",
      executedActions: 3,
      totalActions: 6,
    },
  ]);

  const [actions] = useState<PlaybookAction[]>([
    {
      id: "action-001",
      playbookId: "pb-001",
      order: 1,
      tool: "SIEM",
      action: "Collect logs from affected systems",
      timeout: 300,
    },
    {
      id: "action-002",
      playbookId: "pb-001",
      order: 2,
      tool: "Jira",
      action: "Create incident ticket",
      timeout: 120,
    },
    {
      id: "action-003",
      playbookId: "pb-001",
      order: 3,
      tool: "Slack",
      action: "Notify security team",
      condition: "severity > high",
      timeout: 60,
    },
  ]);

  const stats = {
    totalPlaybooks: playbooks.length,
    activePlaybooks: playbooks.filter((p) => p.status === "active").length,
    totalExecutions: executions.length,
    avgSuccessRate: (
      playbooks.reduce((sum, p) => sum + p.successRate, 0) / playbooks.length
    ).toFixed(2),
  };

  const handleExecutePlaybook = (playbookId: string) => {
    toast.success("Playbook execution started");
  };

  const handleCreatePlaybook = () => {
    toast.success("New playbook created");
  };

  const handlePauseExecution = (executionId: string) => {
    toast.success("Playbook execution paused");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "draft":
        return "bg-yellow-500/20 text-yellow-600";
      case "archived":
        return "bg-gray-500/20 text-gray-600";
      case "running":
        return "bg-blue-500/20 text-blue-600";
      case "completed":
        return "bg-green-500/20 text-green-600";
      case "failed":
        return "bg-red-500/20 text-red-600";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Orchestration & Response (SOAR)</h1>
        <p className="text-muted-foreground mt-1">
          Playbook automation engine with multi-tool orchestration
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Playbooks</p>
          <p className="text-3xl font-bold">{stats.totalPlaybooks}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.activePlaybooks}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
          <p className="text-3xl font-bold">{stats.totalExecutions}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Success Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgSuccessRate}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Playbooks
          </h2>
          <Button onClick={handleCreatePlaybook}>
            <Plus className="h-3 w-3 mr-1" />
            Create Playbook
          </Button>
        </div>

        <div className="space-y-3">
          {playbooks.map((playbook) => (
            <div
              key={playbook.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{playbook.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {playbook.category} • Trigger: {playbook.trigger}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(playbook.status)}`}>
                    {playbook.status}
                  </span>
                  <span className="text-xs px-2 py-1 rounded font-semibold bg-secondary">
                    v{playbook.version}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Actions</p>
                  <p className="font-semibold">{playbook.actions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{playbook.executionCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{(playbook.successRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Executed</p>
                  <p className="font-semibold">
                    {playbook.lastExecuted
                      ? `${Math.floor((Date.now() - playbook.lastExecuted) / (1000 * 60 * 60))}h ago`
                      : "Never"}
                  </p>
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={() => handleExecutePlaybook(playbook.id)}
                    disabled={playbook.status !== "active"}
                  >
                    <Play className="h-3 w-3 mr-1" />
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
          <Zap className="h-4 w-4" />
          Execution History
        </h2>

        <div className="space-y-3">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{execution.playbookName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Started: {new Date(execution.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <p className="text-muted-foreground">Progress</p>
                  <p className="font-semibold">
                    {execution.executedActions}/{execution.totalActions} actions
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      execution.status === "completed"
                        ? "bg-green-600"
                        : execution.status === "failed"
                          ? "bg-red-600"
                          : "bg-blue-600"
                    }`}
                    style={{
                      width: `${(execution.executedActions / execution.totalActions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {execution.endTime
                      ? `${Math.floor((execution.endTime - execution.startTime) / 1000)}s`
                      : "Running..."}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{execution.status}</p>
                </div>
                <div>
                  {execution.status === "running" && (
                    <Button
                      size="sm"
                      onClick={() => handlePauseExecution(execution.id)}
                      variant="outline"
                    >
                      Pause
                    </Button>
                  )}
                  {execution.status === "completed" && (
                    <Button size="sm" variant="outline" disabled>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Done
                    </Button>
                  )}
                </div>
              </div>

              {execution.errorMessage && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{execution.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Playbook Actions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Order</th>
                <th className="text-left py-2 px-2">Tool</th>
                <th className="text-left py-2 px-2">Action</th>
                <th className="text-left py-2 px-2">Condition</th>
                <th className="text-left py-2 px-2">Timeout</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-2 px-2 font-semibold">{action.order}</td>
                  <td className="py-2 px-2">
                    <span className="bg-secondary px-2 py-1 rounded">{action.tool}</span>
                  </td>
                  <td className="py-2 px-2">{action.action}</td>
                  <td className="py-2 px-2">{action.condition || "—"}</td>
                  <td className="py-2 px-2">{action.timeout}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Performance Metrics</h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Execution Efficiency</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Avg Execution Time</p>
                <p className="font-semibold">2m 34s</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Avg Actions/Execution</p>
                <p className="font-semibold">7.2</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Failed Executions</p>
                <p className="font-semibold">2 (3.2%)</p>
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Tool Integration</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Connected Tools</p>
                <p className="font-semibold">12</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Tool Availability</p>
                <p className="font-semibold text-green-600">99.2%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Failed Actions</p>
                <p className="font-semibold">1 (0.8%)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
