import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
  Zap,
  Lock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface SOC2Control {
  id: string;
  name: string;
  pillar: "security" | "availability" | "processing_integrity" | "confidentiality" | "privacy";
  status: "compliant" | "partial" | "non-compliant";
  lastTested: number;
  testingFrequency: string;
  evidence: string[];
  owner: string;
}

export default function SOC2Dashboard() {
  const [controls, setControls] = useState<SOC2Control[]>([
    {
      id: "cc-1.1",
      name: "Entity and Leadership",
      pillar: "security",
      status: "compliant",
      lastTested: Date.now() - 604800000,
      testingFrequency: "Quarterly",
      evidence: ["board-charter.pdf", "org-structure.pdf"],
      owner: "CISO",
    },
    {
      id: "cc-6.1",
      name: "Logical and Physical Access Controls",
      pillar: "security",
      status: "compliant",
      lastTested: Date.now() - 604800000,
      testingFrequency: "Monthly",
      evidence: ["access-log-2026.csv", "mfa-audit.pdf"],
      owner: "Security Engineer",
    },
    {
      id: "a-1.1",
      name: "System Availability and Performance",
      pillar: "availability",
      status: "compliant",
      lastTested: Date.now() - 604800000,
      testingFrequency: "Daily",
      evidence: ["uptime-report-2026.pdf", "sla-compliance.pdf"],
      owner: "Infrastructure Manager",
    },
    {
      id: "pi-1.1",
      name: "Data Validation and Error Handling",
      pillar: "processing_integrity",
      status: "compliant",
      lastTested: Date.now() - 604800000,
      testingFrequency: "Monthly",
      evidence: ["validation-rules.pdf", "error-handling-tests.pdf"],
      owner: "QA Lead",
    },
    {
      id: "c-1.1",
      name: "Confidentiality Policies and Procedures",
      pillar: "confidentiality",
      status: "compliant",
      lastTested: Date.now() - 604800000,
      testingFrequency: "Quarterly",
      evidence: ["confidentiality-policy.pdf", "nda-register.pdf"],
      owner: "Legal Manager",
    },
    {
      id: "p-1.1",
      name: "Privacy Policies and Procedures",
      pillar: "privacy",
      status: "partial",
      lastTested: Date.now() - 1209600000,
      testingFrequency: "Quarterly",
      evidence: ["privacy-policy.pdf", "data-retention-policy.pdf"],
      owner: "Privacy Officer",
    },
  ]);

  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [showEvidence, setShowEvidence] = useState<Set<string>>(new Set());

  const stats = {
    compliant: controls.filter((c) => c.status === "compliant").length,
    partial: controls.filter((c) => c.status === "partial").length,
    nonCompliant: controls.filter((c) => c.status === "non-compliant").length,
  };

  const complianceScore = Math.round(
    ((stats.compliant + stats.partial * 0.5) / controls.length) * 100
  );

  const filteredControls =
    selectedPillar === "all"
      ? controls
      : controls.filter((c) => c.pillar === selectedPillar);

  const handleToggleEvidence = (id: string) => {
    const newShowEvidence = new Set(showEvidence);
    if (newShowEvidence.has(id)) {
      newShowEvidence.delete(id);
    } else {
      newShowEvidence.add(id);
    }
    setShowEvidence(newShowEvidence);
  };

  const handleGenerateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      complianceScore,
      controls: filteredControls,
      statistics: stats,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `soc2-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("SOC 2 report generated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SOC 2 Type II Compliance</h1>
        <p className="text-muted-foreground mt-1">
          Service Organization Control (SOC) 2 compliance framework
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
          <p className="text-3xl font-bold text-green-600">{complianceScore}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant</p>
          <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Partial</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.partial}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Controls</p>
          <p className="text-3xl font-bold">{controls.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Controls ({filteredControls.length})
          </h2>
          <Button onClick={handleGenerateReport} size="sm">
            Generate Report
          </Button>
        </div>

        <div className="space-y-3">
          {filteredControls.map((control) => (
            <div
              key={control.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{control.name}</h4>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded font-mono">
                      {control.id}
                    </span>
                    {control.status === "compliant" && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {control.status === "partial" && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Owner: {control.owner}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      control.status === "compliant"
                        ? "bg-green-500/20 text-green-600"
                        : "bg-yellow-500/20 text-yellow-600"
                    }`}
                  >
                    {control.status}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleEvidence(control.id)}
              >
                <FileText className="h-3 w-3 mr-1" />
                {showEvidence.has(control.id)
                  ? "Hide Evidence"
                  : `Show Evidence (${control.evidence.length})`}
              </Button>

              {showEvidence.has(control.id) && (
                <div className="mt-3 p-3 bg-secondary rounded text-xs">
                  <p className="font-semibold mb-2">Evidence:</p>
                  <ul className="space-y-1">
                    {control.evidence.map((file, idx) => (
                      <li key={idx}>{file}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
