import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Eye,
  Plus,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Playbook {
  id: string;
  name: string;
  threatType: string;
  description: string;
  steps: number;
  estimatedTime: string;
  executionCount: number;
  successRate: number;
  lastExecuted?: number;
  status: "active" | "draft" | "archived";
}

interface PlaybookStep {
  stepNumber: number;
  action: string;
  responsible: string;
  duration: string;
  automatable: boolean;
  prerequisites: string[];
}

interface PlaybookExecution {
  id: string;
  playbookName: string;
  startTime: number;
  endTime?: number;
  status: "in-progress" | "completed" | "failed";
  executedBy: string;
  stepsCompleted: number;
  totalSteps: number;
}

export default function IncidentResponsePlaybooks() {
  const [playbooks] = useState<Playbook[]>([
    {
      id: "pb-001",
      name: "Ransomware Response",
      threatType: "Ransomware",
      description: "Immediate response to ransomware attacks with isolation and recovery",
      steps: 12,
      estimatedTime: "4 hours",
      executionCount: 3,
      successRate: 100,
      lastExecuted: Date.now() - 5184000000,
      status: "active",
    },
    {
      id: "pb-002",
      name: "Data Exfiltration Response",
      threatType: "Data Breach",
      description: "Detect and contain data exfiltration incidents",
      steps: 10,
      estimatedTime: "3 hours",
      executionCount: 2,
      successRate: 95,
      lastExecuted: Date.now() - 7776000000,
      status: "active",
    },
    {
      id: "pb-003",
      name: "Insider Threat Response",
      threatType: "Insider Threat",
      description: "Respond to suspicious insider activity and unauthorized access",
      steps: 8,
      estimatedTime: "2 hours",
      executionCount: 1,
      successRate: 100,
      lastExecuted: Date.now() - 2592000000,
      status: "active",
    },
    {
      id: "pb-004",
      name: "Supply Chain Attack Response",
      threatType: "Supply Chain",
      description: "Coordinate response to compromised third-party software",
      steps: 15,
      estimatedTime: "6 hours",
      executionCount: 0,
      successRate: 0,
      status: "draft",
    },
  ]);

  const [steps] = useState<PlaybookStep[]>([
    {
      stepNumber: 1,
      action: "Declare incident and activate incident commander",
      responsible: "CISO",
      duration: "15 min",
      automatable: false,
      prerequisites: [],
    },
    {
      stepNumber: 2,
      action: "Isolate affected systems from network",
      responsible: "Network Team",
      duration: "10 min",
      automatable: true,
      prerequisites: ["Step 1"],
    },
    {
      stepNumber: 3,
      action: "Preserve evidence and collect logs",
      responsible: "Forensics Team",
      duration: "30 min",
      automatable: true,
      prerequisites: ["Step 2"],
    },
    {
      stepNumber: 4,
      action: "Notify stakeholders and legal team",
      responsible: "Communications",
      duration: "20 min",
      automatable: false,
      prerequisites: ["Step 1"],
    },
  ]);

  const [executions] = useState<PlaybookExecution[]>([
    {
      id: "exec-001",
      playbookName: "Ransomware Response",
      startTime: Date.now() - 604800000,
      endTime: Date.now() - 604800000 + 14400000,
      status: "completed",
      executedBy: "Security Team",
      stepsCompleted: 12,
      totalSteps: 12,
    },
    {
      id: "exec-002",
      playbookName: "Data Exfiltration Response",
      startTime: Date.now() - 1209600000,
      endTime: Date.now() - 1209600000 + 10800000,
      status: "completed",
      executedBy: "Incident Response",
      stepsCompleted: 10,
      totalSteps: 10,
    },
    {
      id: "exec-003",
      playbookName: "Insider Threat Response",
      startTime: Date.now() - 3600000,
      status: "in-progress",
      executedBy: "Security Team",
      stepsCompleted: 3,
      totalSteps: 8,
    },
  ]);

  const handleExecutePlaybook = (playbookId: string) => {
    toast.success("Playbook execution started");
  };

  const handleAutomate = (stepNumber: number) => {
    toast.success(`Step ${stepNumber} automated`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident Response Playbooks</h1>
        <p className="text-muted-foreground mt-1">
          Pre-built playbooks for common attack scenarios with automated execution
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Playbooks</p>
          <p className="text-3xl font-bold">{playbooks.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Playbooks</p>
          <p className="text-3xl font-bold text-green-600">
            {playbooks.filter((p) => p.status === "active").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Success Rate</p>
          <p className="text-3xl font-bold">
            {Math.round(
              playbooks
                .filter((p) => p.executionCount > 0)
                .reduce((sum, p) => sum + p.successRate, 0) /
                playbooks.filter((p) => p.executionCount > 0).length
            )}
            %
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
          <p className="text-3xl font-bold">
            {playbooks.reduce((sum, p) => sum + p.executionCount, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Response Playbooks
          </h2>
          <Button>
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
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{playbook.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{playbook.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    playbook.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : playbook.status === "draft"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {playbook.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold">{playbook.threatType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Steps</p>
                  <p className="font-semibold">{playbook.steps}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Time</p>
                  <p className="font-semibold">{playbook.estimatedTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{playbook.successRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-semibold">{playbook.executionCount}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleExecutePlaybook(playbook.id)}
                  disabled={playbook.status !== "active"}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Execute
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View Steps
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Ransomware Response Playbook - Steps
        </h2>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.stepNumber} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    Step {step.stepNumber}: {step.action}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Responsible: {step.responsible} • Duration: {step.duration}
                  </p>
                </div>
                {step.automatable && (
                  <Button
                    size="sm"
                    onClick={() => handleAutomate(step.stepNumber)}
                    variant="outline"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Automate
                  </Button>
                )}
              </div>

              {step.prerequisites.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Prerequisites: {step.prerequisites.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Playbook Executions
        </h2>

        <div className="space-y-3">
          {executions.map((exec) => (
            <div
              key={exec.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{exec.playbookName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Executed by: {exec.executedBy}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    exec.status === "completed"
                      ? "bg-green-500/20 text-green-600"
                      : exec.status === "in-progress"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {exec.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - exec.startTime) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {exec.endTime
                      ? Math.floor((exec.endTime - exec.startTime) / (1000 * 60))
                      : "In progress"}
                    {exec.endTime ? " min" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Progress</p>
                  <p className="font-semibold">
                    {exec.stepsCompleted}/{exec.totalSteps}
                  </p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${(exec.stepsCompleted / exec.totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Escalation Workflows
        </h2>

        <div className="space-y-3">
          {[
            {
              level: "Level 1",
              timeframe: "0-30 min",
              actions: "Alert security team, isolate systems",
              contacts: "Security Lead",
            },
            {
              level: "Level 2",
              timeframe: "30-60 min",
              actions: "Escalate to CISO, notify legal",
              contacts: "CISO, Legal Team",
            },
            {
              level: "Level 3",
              timeframe: "60-120 min",
              actions: "Executive briefing, customer notification",
              contacts: "CEO, CFO, Communications",
            },
            {
              level: "Level 4",
              timeframe: "120+ min",
              actions: "Board notification, regulatory reporting",
              contacts: "Board, Regulators",
            },
          ].map((level, idx) => (
            <div key={idx} className="p-3 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{level.level}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{level.actions}</p>
                </div>
                <span className="text-xs bg-secondary px-2 py-1 rounded">{level.timeframe}</span>
              </div>
              <p className="text-xs text-muted-foreground">Contacts: {level.contacts}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
