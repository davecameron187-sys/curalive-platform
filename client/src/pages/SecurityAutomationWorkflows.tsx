import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  status: "active" | "paused" | "disabled";
  executionCount: number;
  successRate: number;
  lastExecuted: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "success" | "failed" | "pending";
  executedAt: number;
  duration: number;
  actionsCompleted: number;
}

export default function SecurityAutomationWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "wf-001",
      name: "Critical Alert Auto-Escalation",
      trigger: "Critical vulnerability detected",
      actions: [
        "Auto-escalate to CTO",
        "Create P1 Jira ticket",
        "Notify Slack #security-alerts",
        "Trigger incident response",
      ],
      status: "active",
      executionCount: 24,
      successRate: 0.96,
      lastExecuted: Date.now() - 3600000,
    },
    {
      id: "wf-002",
      name: "Policy Violation Auto-Remediation",
      trigger: "Policy violation detected",
      actions: [
        "Auto-remediate low-risk violations",
        "Create Jira ticket for review",
        "Notify policy owner",
        "Log audit event",
      ],
      status: "active",
      executionCount: 156,
      successRate: 0.98,
      lastExecuted: Date.now() - 1800000,
    },
    {
      id: "wf-003",
      name: "Vendor Risk Escalation",
      trigger: "Vendor risk score increases",
      actions: [
        "Notify vendor manager",
        "Create assessment task",
        "Send email notification",
        "Update risk dashboard",
      ],
      status: "active",
      executionCount: 8,
      successRate: 0.94,
      lastExecuted: Date.now() - 86400000,
    },
    {
      id: "wf-004",
      name: "Compliance Report Auto-Generation",
      trigger: "Monthly schedule (1st of month)",
      actions: [
        "Generate compliance report",
        "Export to PDF",
        "Email to executives",
        "Archive to S3",
      ],
      status: "active",
      executionCount: 3,
      successRate: 1.0,
      lastExecuted: Date.now() - 2592000000,
    },
  ]);

  const [executions, setExecutions] = useState<WorkflowExecution[]>([
    {
      id: "exec-001",
      workflowId: "wf-001",
      status: "success",
      executedAt: Date.now() - 3600000,
      duration: 2340,
      actionsCompleted: 4,
    },
    {
      id: "exec-002",
      workflowId: "wf-002",
      status: "success",
      executedAt: Date.now() - 1800000,
      duration: 1560,
      actionsCompleted: 4,
    },
    {
      id: "exec-003",
      workflowId: "wf-001",
      status: "failed",
      executedAt: Date.now() - 7200000,
      duration: 890,
      actionsCompleted: 2,
    },
  ]);

  const stats = {
    activeWorkflows: workflows.filter((w) => w.status === "active").length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    avgSuccessRate: (
      workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
    ).toFixed(2),
    timesSaved: Math.round(
      workflows.reduce((sum, w) => sum + w.executionCount, 0) * 0.5
    ),
  };

  const handleToggleWorkflow = (workflowId: string) => {
    toast.success("Workflow status updated");
  };

  const handleExecuteNow = (workflowId: string) => {
    toast.success("Workflow executed immediately");
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    toast.success("Workflow deleted");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600";
      case "disabled":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-600";
      case "failed":
        return "bg-red-500/20 text-red-600";
      case "pending":
        return "bg-yellow-500/20 text-yellow-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Automation Workflows</h1>
        <p className="text-muted-foreground mt-1">
          IFTTT-style automation for hands-free incident response and compliance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Workflows</p>
          <p className="text-3xl font-bold">{stats.activeWorkflows}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
          <p className="text-3xl font-bold">{stats.totalExecutions}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Success Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgSuccessRate}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Hours Saved</p>
          <p className="text-3xl font-bold">{stats.timesSaved}+</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation Workflows
          </h2>
          <Button>
            <Plus className="h-3 w-3 mr-1" />
            Create Workflow
          </Button>
        </div>

        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{workflow.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trigger: {workflow.trigger}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Actions:</p>
                <div className="flex flex-wrap gap-1">
                  {workflow.actions.map((action, idx) => (
                    <span key={idx} className="bg-secondary px-2 py-1 rounded">
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{workflow.executionCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold text-green-600">
                    {(workflow.successRate * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Run</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - workflow.lastExecuted) / (1000 * 60))} min ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">
                    {workflow.status === "active" ? "Running" : "Stopped"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleExecuteNow(workflow.id)}>
                  <Play className="h-3 w-3 mr-1" />
                  Run Now
                </Button>
                <Button size="sm" onClick={() => handleToggleWorkflow(workflow.id)} variant="outline">
                  {workflow.status === "active" ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline">
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Recent Executions
        </h2>

        <div className="space-y-2">
          {executions.map((execution) => {
            const workflow = workflows.find((w) => w.id === execution.workflowId);
            return (
              <div
                key={execution.id}
                className="p-3 border border-border rounded flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{workflow?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(execution.executedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{(execution.duration / 1000).toFixed(1)}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actions</p>
                    <p className="font-semibold">{execution.actionsCompleted}/{workflow?.actions.length}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getExecutionStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Workflow Templates
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: "Critical Alert Escalation", description: "Auto-escalate critical alerts to leadership" },
            { name: "Compliance Report Generation", description: "Monthly automated compliance reporting" },
            { name: "Vulnerability Auto-Remediation", description: "Auto-fix low-risk security issues" },
            { name: "Incident Response", description: "Automated incident detection and response" },
          ].map((template) => (
            <div key={template.name} className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">{template.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              <Button size="sm" className="mt-2">
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
