import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  Play,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  checkInterval: "daily" | "weekly" | "monthly" | "quarterly";
  lastCheck: number;
  nextCheck: number;
  totalRequirements: number;
  compliantRequirements: number;
  nonCompliantRequirements: number;
  pendingRequirements: number;
  complianceScore: number;
  status: "compliant" | "non-compliant" | "partial";
  automatedChecks: number;
  manualChecks: number;
}

interface ComplianceCheck {
  id: string;
  frameworkId: string;
  requirementId: string;
  requirementName: string;
  status: "pass" | "fail" | "pending" | "manual";
  lastChecked: number;
  nextCheck: number;
  evidence: string[];
  remediationTask?: string;
  automationLevel: "full" | "partial" | "manual";
}

interface RemediationTask {
  id: string;
  checkId: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "completed" | "blocked";
  dueDate: number;
  assignee: string;
  estimatedEffort: number;
  automatedRemediationAvailable: boolean;
}

export default function SecurityComplianceAutomation() {
  const [frameworks] = useState<ComplianceFramework[]>([
    {
      id: "SOC2",
      name: "SOC 2 Type II",
      description: "Service Organization Control 2 compliance",
      checkInterval: "daily",
      lastCheck: Date.now() - 3600000,
      nextCheck: Date.now() + 82800000,
      totalRequirements: 42,
      compliantRequirements: 40,
      nonCompliantRequirements: 1,
      pendingRequirements: 1,
      complianceScore: 95,
      status: "compliant",
      automatedChecks: 38,
      manualChecks: 4,
    },
    {
      id: "ISO27001",
      name: "ISO 27001",
      description: "Information Security Management System",
      checkInterval: "weekly",
      lastCheck: Date.now() - 604800000,
      nextCheck: Date.now() + 604800000,
      totalRequirements: 114,
      compliantRequirements: 108,
      nonCompliantRequirements: 4,
      pendingRequirements: 2,
      complianceScore: 93,
      status: "compliant",
      automatedChecks: 85,
      manualChecks: 29,
    },
    {
      id: "HIPAA",
      name: "HIPAA",
      description: "Health Insurance Portability and Accountability Act",
      checkInterval: "daily",
      lastCheck: Date.now() - 7200000,
      nextCheck: Date.now() + 79200000,
      totalRequirements: 18,
      compliantRequirements: 17,
      nonCompliantRequirements: 1,
      pendingRequirements: 0,
      complianceScore: 94,
      status: "compliant",
      automatedChecks: 14,
      manualChecks: 4,
    },
    {
      id: "PCIDSS",
      name: "PCI-DSS",
      description: "Payment Card Industry Data Security Standard",
      checkInterval: "daily",
      lastCheck: Date.now() - 1800000,
      nextCheck: Date.now() + 82800000,
      totalRequirements: 12,
      compliantRequirements: 11,
      nonCompliantRequirements: 1,
      pendingRequirements: 0,
      complianceScore: 92,
      status: "compliant",
      automatedChecks: 10,
      manualChecks: 2,
    },
    {
      id: "GDPR",
      name: "GDPR",
      description: "General Data Protection Regulation",
      checkInterval: "weekly",
      lastCheck: Date.now() - 259200000,
      nextCheck: Date.now() + 345600000,
      totalRequirements: 99,
      compliantRequirements: 92,
      nonCompliantRequirements: 5,
      pendingRequirements: 2,
      complianceScore: 91,
      status: "partial",
      automatedChecks: 72,
      manualChecks: 27,
    },
  ]);

  const [checks] = useState<ComplianceCheck[]>([
    {
      id: "CHK-001",
      frameworkId: "SOC2",
      requirementId: "CC6.1",
      requirementName: "Logical Access Controls",
      status: "pass",
      lastChecked: Date.now() - 3600000,
      nextCheck: Date.now() + 82800000,
      evidence: ["mfa-enabled.log", "access-policy.pdf"],
      automationLevel: "full",
    },
    {
      id: "CHK-002",
      frameworkId: "SOC2",
      requirementId: "CC7.2",
      requirementName: "System Monitoring",
      status: "fail",
      lastChecked: Date.now() - 3600000,
      nextCheck: Date.now() + 82800000,
      evidence: ["monitoring-config.log"],
      remediationTask: "REM-001",
      automationLevel: "partial",
    },
    {
      id: "CHK-003",
      frameworkId: "ISO27001",
      requirementId: "A.12.4.1",
      requirementName: "Event Logging",
      status: "pass",
      lastChecked: Date.now() - 604800000,
      nextCheck: Date.now() + 604800000,
      evidence: ["audit-logs.zip"],
      automationLevel: "full",
    },
    {
      id: "CHK-004",
      frameworkId: "HIPAA",
      requirementId: "164.312(a)(2)(i)",
      requirementName: "Encryption and Decryption",
      status: "pass",
      lastChecked: Date.now() - 7200000,
      nextCheck: Date.now() + 79200000,
      evidence: ["encryption-policy.pdf", "cert-list.log"],
      automationLevel: "full",
    },
  ]);

  const [remediationTasks] = useState<RemediationTask[]>([
    {
      id: "REM-001",
      checkId: "CHK-002",
      title: "Enable Enhanced System Monitoring",
      description: "Enable detailed monitoring for all critical systems",
      priority: "high",
      status: "in-progress",
      dueDate: Date.now() + 604800000,
      assignee: "security-team@company.com",
      estimatedEffort: 8,
      automatedRemediationAvailable: true,
    },
    {
      id: "REM-002",
      checkId: "CHK-005",
      title: "Update Access Control Policies",
      description: "Update access control policies to meet GDPR requirements",
      priority: "high",
      status: "open",
      dueDate: Date.now() + 1209600000,
      assignee: "compliance@company.com",
      estimatedEffort: 16,
      automatedRemediationAvailable: false,
    },
  ]);

  const handleRunCheck = (frameworkId: string) => {
    toast.success(`Running compliance check for ${frameworkId}`);
  };

  const handleAutoRemediate = (taskId: string) => {
    toast.success(`Starting automated remediation for ${taskId}`);
  };

  const handleGenerateReport = (frameworkId: string) => {
    toast.success(`Generating compliance report for ${frameworkId}`);
  };

  const handleDownloadEvidence = (checkId: string) => {
    toast.success(`Downloading evidence for check ${checkId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
      case "compliant":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "fail":
      case "non-compliant":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "partial":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "pending":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const totalCompliance =
    frameworks.reduce((sum, f) => sum + f.complianceScore, 0) / frameworks.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Automation</h1>
        <p className="text-muted-foreground mt-1">
          Automated compliance checking and remediation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Frameworks</p>
          <p className="text-3xl font-bold">{frameworks.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Overall Compliance
          </p>
          <p className="text-3xl font-bold text-green-600">
            {Math.round(totalCompliance)}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Checks</p>
          <p className="text-3xl font-bold">{checks.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Remediation Tasks
          </p>
          <p className="text-3xl font-bold">{remediationTasks.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Compliance Frameworks
        </h2>

        <div className="space-y-3">
          {frameworks.map((framework) => (
            <div
              key={framework.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(framework.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{framework.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(framework.status)}`}
                    >
                      {framework.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-semibold">{framework.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {framework.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {framework.complianceScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Compliance</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{framework.totalRequirements}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Compliant</p>
                  <p className="font-semibold text-green-600">
                    {framework.compliantRequirements}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Non-Compliant</p>
                  <p className="font-semibold text-red-600">
                    {framework.nonCompliantRequirements}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-semibold text-yellow-600">
                    {framework.pendingRequirements}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Automated</p>
                  <p className="font-semibold">
                    {framework.automatedChecks}/{framework.totalRequirements}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last checked:{" "}
                  {new Date(framework.lastCheck).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunCheck(framework.id)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Run Check
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReport(framework.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Recent Compliance Checks
        </h2>

        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{check.id}</span>
                    <span className="text-xs px-2 py-1 rounded font-semibold bg-secondary">
                      {check.frameworkId}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(check.status)}`}
                    >
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-semibold">{check.requirementName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requirement: {check.requirementId}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      check.automationLevel === "full"
                        ? "bg-green-500/20 text-green-600"
                        : check.automationLevel === "partial"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {check.automationLevel}
                  </span>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap gap-1">
                {check.evidence.map((evidence) => (
                  <span
                    key={evidence}
                    className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                  >
                    {evidence}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date(check.lastChecked).toLocaleString()}
                </p>
                {check.status === "fail" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadEvidence(check.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Evidence
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Remediation Tasks
        </h2>

        <div className="space-y-3">
          {remediationTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{task.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        task.priority === "critical"
                          ? "bg-red-500/20 text-red-600"
                          : task.priority === "high"
                            ? "bg-orange-500/20 text-orange-600"
                            : task.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        task.status === "completed"
                          ? "bg-green-500/20 text-green-600"
                          : task.status === "in-progress"
                            ? "bg-blue-500/20 text-blue-600"
                            : task.status === "blocked"
                              ? "bg-red-500/20 text-red-600"
                              : "bg-gray-500/20 text-gray-600"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-semibold">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assignee</p>
                  <p className="font-semibold">{task.assignee}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effort (hours)</p>
                  <p className="font-semibold">{task.estimatedEffort}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Automation</p>
                  <p className="font-semibold">
                    {task.automatedRemediationAvailable ? "Available" : "Manual"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {task.automatedRemediationAvailable &&
                  task.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAutoRemediate(task.id)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Auto Remediate
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
