import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  Clock,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Eye,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface Policy {
  id: string;
  name: string;
  framework: string;
  status: "active" | "draft" | "archived";
  version: number;
  lastUpdated: number;
  approvals: number;
  totalApprovals: number;
  departments: string[];
  effectiveness: number;
}

interface PolicyApproval {
  id: string;
  policyName: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: number;
  reviewedDate?: number;
  reviewer?: string;
  comments?: string;
}

interface DepartmentCompliance {
  department: string;
  complianceScore: number;
  policiesImplemented: number;
  totalPolicies: number;
  lastAudit: number;
  status: "compliant" | "at-risk" | "non-compliant";
}

interface AuditTrail {
  id: string;
  action: string;
  policyName: string;
  actor: string;
  timestamp: number;
  details: string;
}

export default function SecurityGovernanceDashboard() {
  const [policies] = useState<Policy[]>([
    {
      id: "pol-001",
      name: "Data Classification Policy",
      framework: "ISO 27001",
      status: "active",
      version: 3,
      lastUpdated: Date.now() - 604800000,
      approvals: 4,
      totalApprovals: 5,
      departments: ["IT", "HR", "Finance"],
      effectiveness: 94,
    },
    {
      id: "pol-002",
      name: "Access Control Policy",
      framework: "NIST",
      status: "active",
      version: 2,
      lastUpdated: Date.now() - 1209600000,
      approvals: 5,
      totalApprovals: 5,
      departments: ["IT", "Security", "Operations"],
      effectiveness: 98,
    },
    {
      id: "pol-003",
      name: "Incident Response Policy",
      framework: "ISO 27035",
      status: "draft",
      version: 1,
      lastUpdated: Date.now() - 86400000,
      approvals: 2,
      totalApprovals: 5,
      departments: ["Security", "Legal"],
      effectiveness: 0,
    },
    {
      id: "pol-004",
      name: "Third-Party Risk Management",
      framework: "NIST",
      status: "active",
      version: 1,
      lastUpdated: Date.now() - 2592000000,
      approvals: 3,
      totalApprovals: 5,
      departments: ["Procurement", "Security"],
      effectiveness: 87,
    },
  ]);

  const [approvals] = useState<PolicyApproval[]>([
    {
      id: "apr-001",
      policyName: "Incident Response Policy",
      requestedBy: "Security Team",
      status: "pending",
      submittedDate: Date.now() - 259200000,
      reviewer: "CISO",
    },
    {
      id: "apr-002",
      policyName: "Data Classification Policy v3",
      requestedBy: "Compliance",
      status: "approved",
      submittedDate: Date.now() - 604800000,
      reviewedDate: Date.now() - 518400000,
      reviewer: "CTO",
      comments: "Approved with minor updates",
    },
    {
      id: "apr-003",
      policyName: "Access Control Policy v2",
      requestedBy: "Security Team",
      status: "approved",
      submittedDate: Date.now() - 1209600000,
      reviewedDate: Date.now() - 1123200000,
      reviewer: "CISO",
    },
  ]);

  const [departmentCompliance] = useState<DepartmentCompliance[]>([
    {
      department: "IT",
      complianceScore: 96,
      policiesImplemented: 12,
      totalPolicies: 12,
      lastAudit: Date.now() - 604800000,
      status: "compliant",
    },
    {
      department: "Security",
      complianceScore: 98,
      policiesImplemented: 11,
      totalPolicies: 11,
      lastAudit: Date.now() - 432000000,
      status: "compliant",
    },
    {
      department: "Finance",
      complianceScore: 92,
      policiesImplemented: 10,
      totalPolicies: 11,
      lastAudit: Date.now() - 1209600000,
      status: "at-risk",
    },
    {
      department: "HR",
      complianceScore: 85,
      policiesImplemented: 8,
      totalPolicies: 11,
      lastAudit: Date.now() - 1814400000,
      status: "at-risk",
    },
  ]);

  const [auditTrail] = useState<AuditTrail[]>([
    {
      id: "aud-001",
      action: "Policy Created",
      policyName: "Incident Response Policy",
      actor: "Security Team",
      timestamp: Date.now() - 86400000,
      details: "New policy version 1.0 created",
    },
    {
      id: "aud-002",
      action: "Policy Approved",
      policyName: "Data Classification Policy",
      actor: "CISO",
      timestamp: Date.now() - 518400000,
      details: "Approved for department rollout",
    },
    {
      id: "aud-003",
      action: "Policy Distributed",
      policyName: "Access Control Policy",
      actor: "Compliance",
      timestamp: Date.now() - 1123200000,
      details: "Distributed to IT and Security departments",
    },
  ]);

  const handleCreatePolicy = () => {
    toast.success("New policy created");
  };

  const handleApprovePolicy = () => {
    toast.success("Policy approved");
  };

  const handleDistributePolicy = () => {
    toast.success("Policy distributed to departments");
  };

  const overallCompliance = Math.round(
    departmentCompliance.reduce((sum, d) => sum + d.complianceScore, 0) /
      departmentCompliance.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Governance Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Policy framework management with role-based access and compliance tracking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Overall Compliance</p>
          <p className="text-3xl font-bold text-green-600">{overallCompliance}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Policies</p>
          <p className="text-3xl font-bold">{policies.filter((p) => p.status === "active").length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-orange-600">
            {approvals.filter((a) => a.status === "pending").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant Departments</p>
          <p className="text-3xl font-bold">
            {departmentCompliance.filter((d) => d.status === "compliant").length}/
            {departmentCompliance.length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Framework
          </h2>
          <Button onClick={handleCreatePolicy}>
            <Plus className="h-3 w-3 mr-1" />
            New Policy
          </Button>
        </div>

        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{policy.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Framework: {policy.framework} • Version {policy.version}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    policy.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : policy.status === "draft"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {policy.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Approvals</p>
                  <p className="font-semibold">
                    {policy.approvals}/{policy.totalApprovals}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Departments</p>
                  <p className="font-semibold">{policy.departments.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effectiveness</p>
                  <p className="font-semibold">{policy.effectiveness}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - policy.lastUpdated) / (1000 * 60 * 60 * 24))}d ago
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
          </h2>
          <Button onClick={handleApprovePolicy}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </Button>
        </div>

        <div className="space-y-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{approval.policyName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested by: {approval.requestedBy}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    approval.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-600"
                      : approval.status === "approved"
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {approval.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - approval.submittedDate) / (1000 * 60 * 60 * 24))}d ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reviewer</p>
                  <p className="font-semibold">{approval.reviewer || "Pending"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comments</p>
                  <p className="font-semibold">{approval.comments || "None"}</p>
                </div>
                <div>
                  {approval.status === "pending" && (
                    <Button size="sm">Review</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Department Compliance
          </h2>
          <Button onClick={handleDistributePolicy}>
            <Download className="h-3 w-3 mr-1" />
            Export Report
          </Button>
        </div>

        <div className="space-y-3">
          {departmentCompliance.map((dept) => (
            <div
              key={dept.department}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{dept.department}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dept.policiesImplemented}/{dept.totalPolicies} policies implemented
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    dept.status === "compliant"
                      ? "bg-green-500/20 text-green-600"
                      : dept.status === "at-risk"
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {dept.status}
                </span>
              </div>

              <div className="mb-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      dept.complianceScore >= 95
                        ? "bg-green-600"
                        : dept.complianceScore >= 80
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                    style={{ width: `${dept.complianceScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Compliance Score</p>
                  <p className="font-semibold">{dept.complianceScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Audit</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - dept.lastAudit) / (1000 * 60 * 60 * 24))}d ago
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Audit Trail
        </h2>

        <div className="space-y-3">
          {auditTrail.map((entry) => (
            <div
              key={entry.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{entry.action}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Policy: {entry.policyName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24))}d ago
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Actor</p>
                  <p className="font-semibold">{entry.actor}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-semibold">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Details</p>
                  <p className="font-semibold">{entry.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
