import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Archive,
  Edit,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface Policy {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "active" | "draft" | "archived";
  lastUpdated: number;
  compliance: number;
  violations: number;
  approvals: number;
}

export default function PolicyManagementDashboard() {
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: "policy-001",
      name: "Access Control Policy",
      category: "IAM",
      version: "3.2",
      status: "active",
      lastUpdated: Date.now() - 2592000000,
      compliance: 98,
      violations: 2,
      approvals: 156,
    },
    {
      id: "policy-002",
      name: "Data Classification Policy",
      category: "Data Protection",
      version: "2.1",
      status: "active",
      lastUpdated: Date.now() - 5184000000,
      compliance: 94,
      violations: 6,
      approvals: 142,
    },
    {
      id: "policy-003",
      name: "Incident Response Policy",
      category: "Incident Management",
      version: "1.5",
      status: "active",
      lastUpdated: Date.now() - 7776000000,
      compliance: 96,
      violations: 4,
      approvals: 138,
    },
    {
      id: "policy-004",
      name: "Password Policy",
      category: "Authentication",
      version: "4.0",
      status: "draft",
      lastUpdated: Date.now() - 604800000,
      compliance: 0,
      violations: 0,
      approvals: 0,
    },
  ]);

  const stats = {
    activePolicies: policies.filter((p) => p.status === "active").length,
    draftPolicies: policies.filter((p) => p.status === "draft").length,
    avgCompliance:
      Math.round(
        policies
          .filter((p) => p.status === "active")
          .reduce((sum, p) => sum + p.compliance, 0) /
          policies.filter((p) => p.status === "active").length
      ) || 0,
    totalViolations: policies.reduce((sum, p) => sum + p.violations, 0),
  };

  const handleCreatePolicy = () => {
    toast.success("New policy created");
  };

  const handleApprovePolicy = (policyId: string) => {
    toast.success("Policy approved and published");
  };

  const handleViewPolicy = (policyId: string) => {
    toast.success("Opening policy document");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "draft":
        return "bg-yellow-500/20 text-yellow-600";
      case "archived":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Policy Management</h1>
        <p className="text-muted-foreground mt-1">
          Centralized policy repository with version control and enforcement
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Policies</p>
          <p className="text-3xl font-bold">{stats.activePolicies}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Draft Policies</p>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.draftPolicies}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Avg Compliance
          </p>
          <p className="text-3xl font-bold">{stats.avgCompliance}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Violations</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.totalViolations}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Repository
          </h2>
          <Button onClick={handleCreatePolicy}>Create New Policy</Button>
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
                    {policy.category} • v{policy.version}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(
                    policy.status
                  )}`}
                >
                  {policy.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Compliance</p>
                  <p className="font-semibold">{policy.compliance}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Violations</p>
                  <p className="font-semibold text-red-600">{policy.violations}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approvals</p>
                  <p className="font-semibold">{policy.approvals}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">
                    {Math.floor(
                      (Date.now() - policy.lastUpdated) / (1000 * 60 * 60 * 24)
                    )}
                    d ago
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleViewPolicy(policy.id)}
                  variant="outline"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                {policy.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => handleApprovePolicy(policy.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                )}
                {policy.status === "active" && (
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Policy Violations
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Data Classification</p>
              <p className="text-xs text-muted-foreground mt-1">
                6 violations in last 30 days
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Access Control</p>
              <p className="text-xs text-muted-foreground mt-1">
                2 violations in last 30 days
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Incident Response</p>
              <p className="text-xs text-muted-foreground mt-1">
                4 violations in last 30 days
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Acknowledgments
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Access Control Policy</p>
              <p className="text-muted-foreground text-xs mt-1">
                156 / 158 employees acknowledged (98.7%)
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "98.7%" }}
                />
              </div>
            </div>

            <div>
              <p className="font-semibold">Data Classification Policy</p>
              <p className="text-muted-foreground text-xs mt-1">
                142 / 158 employees acknowledged (89.9%)
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: "89.9%" }}
                />
              </div>
            </div>

            <div>
              <p className="font-semibold">Incident Response Policy</p>
              <p className="text-muted-foreground text-xs mt-1">
                138 / 158 employees acknowledged (87.3%)
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: "87.3%" }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
