import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Database,
  Network,
  Key,
  Zap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Control {
  id: string;
  name: string;
  category: string;
  status: "compliant" | "partial" | "non-compliant" | "not-applicable";
  lastAudit: number;
  evidence: string[];
  owner: string;
  dueDate: number;
}

/**
 * ISO27001Dashboard Page
 * 
 * ISO 27001 Information Security Management System (ISMS)
 * with access controls, encryption, data classification, and incident tracking.
 */
export default function ISO27001Dashboard() {
  const [controls, setControls] = useState<Control[]>([
    {
      id: "a.5.1",
      name: "Information Security Policies",
      category: "Organization of Information Security",
      status: "compliant",
      lastAudit: Date.now() - 604800000,
      evidence: ["policy-doc-v2.pdf", "board-approval-2026.pdf"],
      owner: "CISO",
      dueDate: Date.now() + 7776000000,
    },
    {
      id: "a.6.1",
      name: "Internal Organization",
      category: "Organization of Information Security",
      status: "compliant",
      lastAudit: Date.now() - 604800000,
      evidence: ["org-chart.pdf", "role-definitions.pdf"],
      owner: "HR Manager",
      dueDate: Date.now() + 7776000000,
    },
    {
      id: "a.7.1",
      name: "User Access Management",
      category: "Access Control",
      status: "compliant",
      lastAudit: Date.now() - 1209600000,
      evidence: ["access-log-2026.csv", "user-provisioning-policy.pdf"],
      owner: "IT Manager",
      dueDate: Date.now() + 2592000000,
    },
    {
      id: "a.8.1",
      name: "Cryptography",
      category: "Cryptography",
      status: "compliant",
      lastAudit: Date.now() - 1814400000,
      evidence: ["encryption-audit-2026.pdf", "tls-cert-validation.pdf"],
      owner: "Security Engineer",
      dueDate: Date.now() + 5184000000,
    },
    {
      id: "a.9.1",
      name: "Physical and Environmental Security",
      category: "Physical and Environmental Security",
      status: "compliant",
      lastAudit: Date.now() - 2419200000,
      evidence: ["datacenter-audit.pdf", "access-card-log.csv"],
      owner: "Facilities Manager",
      dueDate: Date.now() + 7776000000,
    },
    {
      id: "a.10.1",
      name: "Communications and Operations Management",
      category: "Communications and Operations",
      status: "partial",
      lastAudit: Date.now() - 604800000,
      evidence: ["incident-response-plan.pdf", "backup-verification.pdf"],
      owner: "Operations Manager",
      dueDate: Date.now() + 1209600000,
    },
    {
      id: "a.12.1",
      name: "Information Systems Acquisition, Development and Maintenance",
      category: "Information Systems Acquisition",
      status: "compliant",
      lastAudit: Date.now() - 1209600000,
      evidence: ["sdlc-policy.pdf", "code-review-checklist.pdf"],
      owner: "Development Lead",
      dueDate: Date.now() + 3888000000,
    },
    {
      id: "a.13.1",
      name: "Information Security Incident Management",
      category: "Information Security Incident Management",
      status: "compliant",
      lastAudit: Date.now() - 604800000,
      evidence: ["incident-log-2026.pdf", "response-procedures.pdf"],
      owner: "Security Manager",
      dueDate: Date.now() + 2592000000,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showEvidence, setShowEvidence] = useState<Set<string>>(new Set());

  const categories = [
    "Organization of Information Security",
    "Access Control",
    "Cryptography",
    "Physical and Environmental Security",
    "Communications and Operations",
    "Information Systems Acquisition",
    "Information Security Incident Management",
  ];

  const complianceStats = {
    compliant: controls.filter((c) => c.status === "compliant").length,
    partial: controls.filter((c) => c.status === "partial").length,
    nonCompliant: controls.filter((c) => c.status === "non-compliant").length,
    notApplicable: controls.filter((c) => c.status === "not-applicable").length,
  };

  const complianceScore = Math.round(
    ((complianceStats.compliant + complianceStats.partial * 0.5) /
      controls.length) *
      100
  );

  const filteredControls =
    selectedCategory === "all"
      ? controls
      : controls.filter((c) => c.category === selectedCategory);

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
      statistics: complianceStats,
      certification: {
        status: "In Progress",
        auditDate: new Date(Date.now() + 7776000000).toISOString(),
        auditor: "Big Four Auditing Firm",
      },
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `iso-27001-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("ISO 27001 report generated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">ISO 27001 Information Security</h1>
        <p className="text-muted-foreground mt-1">
          Information Security Management System (ISMS) compliance tracking
        </p>
      </div>

      {/* Compliance Score */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
          <p className="text-3xl font-bold text-green-600">{complianceScore}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant</p>
          <p className="text-3xl font-bold text-green-600">
            {complianceStats.compliant}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Partial</p>
          <p className="text-3xl font-bold text-yellow-600">
            {complianceStats.partial}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Non-Compliant</p>
          <p className="text-3xl font-bold text-red-600">
            {complianceStats.nonCompliant}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Controls</p>
          <p className="text-3xl font-bold">{controls.length}</p>
        </Card>
      </div>

      {/* Controls by Category */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Controls
          </h2>
          <Button onClick={handleGenerateReport} size="sm">
            Generate Report
          </Button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
                    {control.status === "non-compliant" && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {control.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Owner: {control.owner}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      control.status === "compliant"
                        ? "bg-green-500/20 text-green-600"
                        : control.status === "partial"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {control.status}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last audit:{" "}
                    {Math.round((Date.now() - control.lastAudit) / 86400000)}d ago
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleEvidence(control.id)}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  {showEvidence.has(control.id)
                    ? "Hide Evidence"
                    : `Show Evidence (${control.evidence.length})`}
                </Button>
              </div>

              {showEvidence.has(control.id) && (
                <div className="mt-3 p-3 bg-secondary rounded text-xs">
                  <p className="font-semibold mb-2">Evidence:</p>
                  <ul className="space-y-1">
                    {control.evidence.map((file, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Key Security Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Access Control
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Role-Based Access Control (RBAC)</p>
                <p className="text-muted-foreground">
                  Admin, Operator, Moderator, User roles with granular permissions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Multi-Factor Authentication</p>
                <p className="text-muted-foreground">
                  MFA required for all admin and operator accounts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Session Management</p>
                <p className="text-muted-foreground">
                  Automatic logout after 30 minutes of inactivity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Privileged Access Management</p>
                <p className="text-muted-foreground">
                  All admin actions logged and require approval
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Encryption & Cryptography
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">TLS 1.3 Encryption in Transit</p>
                <p className="text-muted-foreground">
                  All data encrypted during transmission
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">AES-256 Encryption at Rest</p>
                <p className="text-muted-foreground">
                  Database and file storage encrypted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Key Management</p>
                <p className="text-muted-foreground">
                  Keys rotated annually, stored in HSM
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">HMAC-SHA256 Signatures</p>
                <p className="text-muted-foreground">
                  Webhook and API requests signed
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Certification Status */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Certification Status
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded">
            <p className="font-semibold mb-2">ISO 27001 Certification</p>
            <p className="text-sm text-muted-foreground mb-3">
              Information Security Management System
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold">In Progress</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Audit scheduled: Q2 2026
            </p>
          </div>

          <div className="p-4 border border-border rounded">
            <p className="font-semibold mb-2">SOC 2 Type II</p>
            <p className="text-sm text-muted-foreground mb-3">
              Security, Availability, Processing Integrity
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold">In Progress</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Audit scheduled: Q3 2026
            </p>
          </div>

          <div className="p-4 border border-border rounded">
            <p className="font-semibold mb-2">GDPR Compliance</p>
            <p className="text-sm text-muted-foreground mb-3">
              Data Protection & Privacy
            </p>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">Compliant</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last audit: Q4 2025
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
