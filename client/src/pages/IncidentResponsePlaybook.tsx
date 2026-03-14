import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  Bell,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface IncidentPlaybook {
  id: string;
  name: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  steps: string[];
  stakeholders: string[];
  estimatedDuration: number;
  templates: string[];
}

interface ActiveIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: number;
  playbook: string;
  currentStep: number;
  assignedTo: string;
}

export default function IncidentResponsePlaybook() {
  const [playbooks, setPlaybooks] = useState<IncidentPlaybook[]>([
    {
      id: "pb-001",
      name: "Data Breach Response",
      category: "Security",
      severity: "critical",
      steps: [
        "Activate incident response team",
        "Isolate affected systems",
        "Notify stakeholders",
        "Begin forensic investigation",
        "Notify affected users",
        "Engage legal counsel",
        "Document findings",
        "Implement remediation",
      ],
      stakeholders: ["CISO", "Legal", "PR", "Engineering"],
      estimatedDuration: 240,
      templates: [
        "stakeholder-notification.html",
        "user-notification.html",
        "incident-report.pdf",
      ],
    },
    {
      id: "pb-002",
      name: "DDoS Attack Response",
      category: "Availability",
      severity: "high",
      steps: [
        "Activate DDoS mitigation",
        "Engage CDN provider",
        "Monitor traffic patterns",
        "Scale infrastructure",
        "Communicate status",
        "Investigate source",
        "Implement WAF rules",
        "Post-incident review",
      ],
      stakeholders: ["Infrastructure", "Security", "Support"],
      estimatedDuration: 120,
      templates: [
        "status-page-update.html",
        "incident-summary.pdf",
      ],
    },
    {
      id: "pb-003",
      name: "Compliance Violation Response",
      category: "Compliance",
      severity: "high",
      steps: [
        "Identify violation type",
        "Assess impact scope",
        "Notify compliance officer",
        "Document evidence",
        "Implement corrective actions",
        "File regulatory notification",
        "Implement preventive measures",
        "Schedule follow-up audit",
      ],
      stakeholders: ["Compliance", "Legal", "Operations"],
      estimatedDuration: 480,
      templates: [
        "violation-report.pdf",
        "corrective-action-plan.docx",
        "regulatory-notification.html",
      ],
    },
  ]);

  const [activeIncidents, setActiveIncidents] = useState<ActiveIncident[]>([
    {
      id: "inc-001",
      title: "Unauthorized API Access Attempt",
      severity: "high",
      status: "in-progress",
      createdAt: Date.now() - 3600000,
      playbook: "pb-001",
      currentStep: 2,
      assignedTo: "Security Team",
    },
    {
      id: "inc-002",
      title: "Database Performance Degradation",
      severity: "medium",
      status: "open",
      createdAt: Date.now() - 1800000,
      playbook: "pb-002",
      currentStep: 0,
      assignedTo: "Infrastructure Team",
    },
  ]);

  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);

  const handleStartIncident = (playbookId: string) => {
    const playbook = playbooks.find((p) => p.id === playbookId);
    if (playbook) {
      const newIncident: ActiveIncident = {
        id: `inc-${Date.now()}`,
        title: `${playbook.name} - ${new Date().toLocaleTimeString()}`,
        severity: playbook.severity,
        status: "open",
        createdAt: Date.now(),
        playbook: playbookId,
        currentStep: 0,
        assignedTo: "Unassigned",
      };
      setActiveIncidents([...activeIncidents, newIncident]);
      toast.success("Incident created and playbook activated");
    }
  };

  const handleAdvanceStep = (incidentId: string) => {
    setActiveIncidents(
      activeIncidents.map((inc) => {
        if (inc.id === incidentId) {
          const playbook = playbooks.find((p) => p.id === inc.playbook);
          if (playbook && inc.currentStep < playbook.steps.length - 1) {
            return { ...inc, currentStep: inc.currentStep + 1 };
          }
        }
        return inc;
      })
    );
    toast.success("Step advanced");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident Response Playbooks</h1>
        <p className="text-muted-foreground mt-1">
          Pre-defined procedures for rapid incident response and recovery
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Incidents ({activeIncidents.length})
          </h2>

          <div className="space-y-3">
            {activeIncidents.map((incident) => {
              const playbook = playbooks.find((p) => p.id === incident.playbook);
              return (
                <Card key={incident.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{incident.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created:{" "}
                        {Math.round(
                          (Date.now() - incident.createdAt) / 60000
                        )}
                        m ago
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                  </div>

                  {playbook && (
                    <div className="text-xs text-muted-foreground mb-3">
                      <p className="font-semibold">
                        Step {incident.currentStep + 1} of {playbook.steps.length}
                      </p>
                      <p className="mt-1">{playbook.steps[incident.currentStep]}</p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleAdvanceStep(incident.id)}
                    className="w-full"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Next Step
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Available Playbooks ({playbooks.length})
          </h2>

          <div className="space-y-3">
            {playbooks.map((playbook) => (
              <Card
                key={playbook.id}
                className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() =>
                  setSelectedPlaybook(
                    selectedPlaybook === playbook.id ? null : playbook.id
                  )
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{playbook.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {playbook.category} • {playbook.steps.length} steps •{" "}
                      {playbook.estimatedDuration}m
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(
                      playbook.severity
                    )}`}
                  >
                    {playbook.severity}
                  </span>
                </div>

                {selectedPlaybook === playbook.id && (
                  <div className="mt-3 p-3 bg-secondary rounded text-xs space-y-2">
                    <div>
                      <p className="font-semibold mb-1">Steps:</p>
                      <ol className="space-y-1 ml-4">
                        {playbook.steps.map((step, idx) => (
                          <li key={idx}>{idx + 1}. {step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Stakeholders:</p>
                      <p>{playbook.stakeholders.join(", ")}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartIncident(playbook.id);
                      }}
                      className="w-full mt-2"
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Start Incident
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Incident Metrics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border border-border rounded">
            <p className="text-xs text-muted-foreground mb-1">Total Incidents</p>
            <p className="text-2xl font-bold">
              {activeIncidents.length + 5}
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="text-xs text-muted-foreground mb-1">Avg Resolution</p>
            <p className="text-2xl font-bold">2.5h</p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="text-xs text-muted-foreground mb-1">
              Playbook Coverage
            </p>
            <p className="text-2xl font-bold">94%</p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="text-xs text-muted-foreground mb-1">
              Stakeholder Alerts
            </p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
