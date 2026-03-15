import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Lock,
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface DataResidencyPolicy {
  id: string;
  dataType: string;
  classification: "public" | "internal" | "confidential" | "restricted";
  allowedRegions: string[];
  complianceFrameworks: string[];
  status: "compliant" | "at-risk" | "non-compliant";
  lastAudited: number;
}

export default function DataResidencyDashboard() {
  const [policies, setPolicies] = useState<DataResidencyPolicy[]>([
    {
      id: "policy-001",
      dataType: "User Personal Data",
      classification: "confidential",
      allowedRegions: ["EU", "US-East"],
      complianceFrameworks: ["GDPR", "CCPA"],
      status: "compliant",
      lastAudited: Date.now() - 604800000,
    },
    {
      id: "policy-002",
      dataType: "Event Recordings",
      classification: "restricted",
      allowedRegions: ["US-East", "EU", "APAC"],
      complianceFrameworks: ["GDPR", "FINRA", "SEC"],
      status: "compliant",
      lastAudited: Date.now() - 1209600000,
    },
    {
      id: "policy-003",
      dataType: "Compliance Reports",
      classification: "confidential",
      allowedRegions: ["US-East"],
      complianceFrameworks: ["SOX", "FINRA"],
      status: "compliant",
      lastAudited: Date.now() - 864000000,
    },
    {
      id: "policy-004",
      dataType: "Audit Logs",
      classification: "restricted",
      allowedRegions: ["US-East", "EU"],
      complianceFrameworks: ["ISO 27001", "SOC 2"],
      status: "at-risk",
      lastAudited: Date.now() - 1814400000,
    },
    {
      id: "policy-005",
      dataType: "Public Event Data",
      classification: "public",
      allowedRegions: ["Global"],
      complianceFrameworks: ["None"],
      status: "compliant",
      lastAudited: Date.now() - 432000000,
    },
  ]);

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const stats = {
    compliant: policies.filter((p) => p.status === "compliant").length,
    atRisk: policies.filter((p) => p.status === "at-risk").length,
    nonCompliant: policies.filter((p) => p.status === "non-compliant").length,
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      policies,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `data-residency-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Data residency report exported");
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "public":
        return "bg-blue-500/20 text-blue-600";
      case "internal":
        return "bg-green-500/20 text-green-600";
      case "confidential":
        return "bg-yellow-500/20 text-yellow-600";
      case "restricted":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Residency & Sovereignty</h1>
        <p className="text-muted-foreground mt-1">
          Geographic data storage controls and compliance enforcement
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant</p>
          <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">At Risk</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.atRisk}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Non-Compliant</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.nonCompliant}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Policies</p>
          <p className="text-3xl font-bold">{policies.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Data Residency Policies</h2>
          <Button onClick={handleExportReport} size="sm">
            Export Report
          </Button>
        </div>

        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() =>
                setSelectedPolicy(
                  selectedPolicy === policy.id ? null : policy.id
                )
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{policy.dataType}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${getClassificationColor(
                        policy.classification
                      )}`}
                    >
                      {policy.classification}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Regions: {policy.allowedRegions.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      policy.status === "compliant"
                        ? "bg-green-500/20 text-green-600"
                        : policy.status === "at-risk"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {policy.status}
                  </p>
                </div>
              </div>

              {selectedPolicy === policy.id && (
                <div className="mt-3 p-3 bg-secondary rounded text-xs space-y-2">
                  <div>
                    <p className="font-semibold mb-1">Compliance Frameworks:</p>
                    <p>{policy.complianceFrameworks.join(", ")}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Last Audited:</p>
                    <p>
                      {Math.round(
                        (Date.now() - policy.lastAudited) / 86400000
                      )}
                      d ago
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Supported Regions
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>US-East (Virginia)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>EU (Ireland)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>APAC (Singapore)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Canada (Toronto)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Mappings
          </h2>

          <div className="space-y-2 text-sm">
            <div>
              <p className="font-semibold">GDPR</p>
              <p className="text-muted-foreground text-xs">
                EU data localization enforced
              </p>
            </div>
            <div>
              <p className="font-semibold">CCPA</p>
              <p className="text-muted-foreground text-xs">
                California data residency tracked
              </p>
            </div>
            <div>
              <p className="font-semibold">FINRA</p>
              <p className="text-muted-foreground text-xs">
                US-only storage for compliance data
              </p>
            </div>
            <div>
              <p className="font-semibold">SOX</p>
              <p className="text-muted-foreground text-xs">
                Audit log retention enforced
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
