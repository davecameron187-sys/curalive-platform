import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Eye,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  threatType: string;
  severity: "critical" | "high" | "medium" | "low";
  conditions: string[];
  actions: string[];
  approvalRequired: boolean;
  autoExecute: boolean;
  status: "active" | "inactive" | "testing";
  executionCount: number;
  successRate: number;
  lastExecuted: number;
}

interface ThreatClassification {
  id: string;
  name: string;
  category: string;
  indicators: string[];
  riskScore: number;
  recommendedPlaybook: string;
  businessImpact: "critical" | "high" | "medium" | "low";
}

interface WorkflowExecution {
  id: string;
  ruleId: string;
  threatId: string;
  status: "pending" | "approved" | "executing" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  approvedBy?: string;
  executedActions: string[];
  result: string;
}

export default function ThreatResponseWorkflows() {
  const [workflows] = useState<WorkflowRule[]>([
    {
      id: "WF-001",
      name: "Ransomware Response",
      description: "Automated response for ransomware threats",
      threatType: "ransomware",
      severity: "critical",
      conditions: [
        "Multiple file encryption detected",
        "Unusual process execution",
        "Network scanning activity",
      ],
      actions: [
        "Isolate affected systems",
        "Create Jira ticket",
        "Notify security team",
        "Initiate backup restore",
      ],
      approvalRequired: true,
      autoExecute: false,
      status: "active",
      executionCount: 3,
      successRate: 100,
      lastExecuted: Date.now() - 604800000,
    },
    {
      id: "WF-002",
      name: "Data Exfiltration Response",
      description: "Automated response for data exfiltration attempts",
      threatType: "data_exfiltration",
      severity: "critical",
      conditions: [
        "Unusual data transfer volume",
        "Access to sensitive files",
        "External connection attempts",
      ],
      actions: [
        "Block external connections",
        "Revoke user credentials",
        "Create incident ticket",
        "Notify compliance team",
      ],
      approvalRequired: true,
      autoExecute: false,
      status: "active",
      executionCount: 2,
      successRate: 100,
      lastExecuted: Date.now() - 1209600000,
    },
    {
      id: "WF-003",
      name: "Insider Threat Response",
      description: "Automated response for insider threat detection",
      threatType: "insider_threat",
      severity: "high",
      conditions: [
        "Privileged account abuse",
        "Off-hours access",
        "Mass file download",
      ],
      actions: [
        "Disable account",
        "Preserve evidence",
        "Alert HR",
        "Create investigation ticket",
      ],
      approvalRequired: true,
      autoExecute: false,
      status: "active",
      executionCount: 1,
      successRate: 100,
      lastExecuted: Date.now() - 2592000000,
    },
    {
      id: "WF-004",
      name: "Vulnerability Exploitation Response",
      description: "Automated response for active vulnerability exploitation",
      threatType: "vulnerability_exploit",
      severity: "high",
      conditions: [
        "Known CVE exploitation detected",
        "Successful payload execution",
        "Lateral movement detected",
      ],
      actions: [
        "Apply security patch",
        "Isolate affected system",
        "Scan for lateral movement",
        "Update firewall rules",
      ],
      approvalRequired: false,
      autoExecute: true,
      status: "active",
      executionCount: 8,
      successRate: 87,
      lastExecuted: Date.now() - 86400000,
    },
  ]);

  const [threatClassifications] = useState<ThreatClassification[]>([
    {
      id: "TC-001",
      name: "Emotet Trojan",
      category: "Malware",
      indicators: [
        "Registry modifications",
        "C2 communication",
        "Lateral movement",
      ],
      riskScore: 95,
      recommendedPlaybook: "WF-001",
      businessImpact: "critical",
    },
    {
      id: "TC-002",
      name: "APT28 Campaign",
      category: "APT",
      indicators: [
        "Spear phishing",
        "Credential theft",
        "Data exfiltration",
      ],
      riskScore: 92,
      recommendedPlaybook: "WF-002",
      businessImpact: "critical",
    },
    {
      id: "TC-003",
      name: "Privilege Escalation",
      category: "Exploitation",
      indicators: [
        "Kernel exploit",
        "Privilege elevation",
        "System access",
      ],
      riskScore: 88,
      recommendedPlaybook: "WF-004",
      businessImpact: "high",
    },
  ]);

  const [executions] = useState<WorkflowExecution[]>([
    {
      id: "EXE-001",
      ruleId: "WF-001",
      threatId: "TC-001",
      status: "completed",
      startTime: Date.now() - 86400000,
      endTime: Date.now() - 85800000,
      approvedBy: "security-lead@company.com",
      executedActions: [
        "Isolated 3 systems",
        "Created JIRA-12345",
        "Notified team",
      ],
      result: "Successfully contained threat",
    },
    {
      id: "EXE-002",
      ruleId: "WF-004",
      threatId: "CVE-2024-1234",
      status: "executing",
      startTime: Date.now() - 300000,
      executedActions: ["Applied patch to 12 systems", "Scanning for lateral movement"],
      result: "In progress",
    },
    {
      id: "EXE-003",
      ruleId: "WF-002",
      threatId: "TC-002",
      status: "pending",
      startTime: Date.now() - 600000,
      executedActions: [],
      result: "Awaiting approval",
    },
  ]);

  const handleToggleWorkflow = (workflowId: string) => {
    toast.success(`Toggled workflow ${workflowId}`);
  };

  const handleApproveExecution = (executionId: string) => {
    toast.success(`Approved execution ${executionId}`);
  };

  const handleExecuteWorkflow = (workflowId: string) => {
    toast.success(`Executing workflow ${workflowId}`);
  };

  const handleEditWorkflow = (workflowId: string) => {
    toast.success(`Opening editor for ${workflowId}`);
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
        return "bg-green-500/20 text-green-600 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "inactive":
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
      case "testing":
      case "executing":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Threat Response Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Conditional automation rules for threat response
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Workflows</p>
          <p className="text-3xl font-bold">{workflows.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active</p>
          <p className="text-3xl font-bold">
            {workflows.filter((w) => w.status === "active").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Success Rate</p>
          <p className="text-3xl font-bold">
            {Math.round(
              workflows.reduce((sum, w) => sum + w.successRate, 0) /
                workflows.length
            )}
            %
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
          <p className="text-3xl font-bold">
            {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Workflow Rules
        </h2>

        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(workflow.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{workflow.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(workflow.severity)}`}
                    >
                      {workflow.severity}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(workflow.status)}`}
                    >
                      {workflow.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{workflow.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {workflow.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{workflow.successRate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {workflow.conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Actions</p>
                  <div className="flex flex-wrap gap-1">
                    {workflow.actions.map((action, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{workflow.executionCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approval</p>
                  <p className="font-semibold">
                    {workflow.approvalRequired ? "Required" : "Auto"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto Execute</p>
                  <p className="font-semibold">
                    {workflow.autoExecute ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Run</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - workflow.lastExecuted) / 86400000)}d ago
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditWorkflow(workflow.id)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExecuteWorkflow(workflow.id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Execute
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleWorkflow(workflow.id)}
                >
                  {workflow.status === "active" ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Threat Classifications
        </h2>

        <div className="space-y-3">
          {threatClassifications.map((threat) => (
            <div
              key={threat.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{threat.id}</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">
                      {threat.category}
                    </span>
                  </div>
                  <h4 className="font-semibold">{threat.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{threat.riskScore}</p>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap gap-1">
                {threat.indicators.map((indicator) => (
                  <span
                    key={indicator}
                    className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                  >
                    {indicator}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Recommended Playbook: {threat.recommendedPlaybook}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Executions
        </h2>

        <div className="space-y-3">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(execution.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{execution.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(execution.status)}`}
                    >
                      {execution.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Workflow: {execution.ruleId} | Threat: {execution.threatId}
                  </p>
                </div>
              </div>

              {execution.executedActions.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {execution.executedActions.map((action, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(execution.startTime).toLocaleString()}
                </p>
                {execution.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveExecution(execution.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
