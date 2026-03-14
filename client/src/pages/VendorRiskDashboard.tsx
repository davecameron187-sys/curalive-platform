import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  riskScore: number;
  status: "approved" | "under-review" | "at-risk" | "onboarding";
  compliance: string[];
  lastAssessment: number;
  nextAssessment: number;
  issues: number;
}

export default function VendorRiskDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "vendor-001",
      name: "Zoom Video Communications",
      category: "Video Conferencing",
      riskScore: 28,
      status: "approved",
      compliance: ["SOC 2 Type II", "ISO 27001", "GDPR", "HIPAA"],
      lastAssessment: Date.now() - 2592000000,
      nextAssessment: Date.now() + 7776000000,
      issues: 0,
    },
    {
      id: "vendor-002",
      name: "AWS",
      category: "Cloud Infrastructure",
      riskScore: 32,
      status: "approved",
      compliance: ["SOC 2 Type II", "ISO 27001", "FedRAMP", "PCI DSS"],
      lastAssessment: Date.now() - 1296000000,
      nextAssessment: Date.now() + 9072000000,
      issues: 1,
    },
    {
      id: "vendor-003",
      name: "Ably",
      category: "Real-Time Messaging",
      riskScore: 42,
      status: "under-review",
      compliance: ["SOC 2 Type II", "ISO 27001", "GDPR"],
      lastAssessment: Date.now() - 604800000,
      nextAssessment: Date.now() + 5184000000,
      issues: 2,
    },
    {
      id: "vendor-004",
      name: "Recall.ai",
      category: "Recording & Transcription",
      riskScore: 58,
      status: "at-risk",
      compliance: ["ISO 27001"],
      lastAssessment: Date.now() - 7776000000,
      nextAssessment: Date.now() + 2592000000,
      issues: 4,
    },
    {
      id: "vendor-005",
      name: "TwilioVoice",
      category: "Telecommunications",
      riskScore: 35,
      status: "onboarding",
      compliance: ["SOC 2 Type II", "HIPAA"],
      lastAssessment: null,
      nextAssessment: Date.now() + 1209600000,
      issues: 0,
    },
  ]);

  const stats = {
    totalVendors: vendors.length,
    approved: vendors.filter((v) => v.status === "approved").length,
    atRisk: vendors.filter((v) => v.status === "at-risk").length,
    avgRiskScore: Math.round(
      vendors.reduce((sum, v) => sum + v.riskScore, 0) / vendors.length
    ),
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-600";
      case "under-review":
        return "bg-blue-500/20 text-blue-600";
      case "at-risk":
        return "bg-red-500/20 text-red-600";
      case "onboarding":
        return "bg-yellow-500/20 text-yellow-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const handleStartAssessment = (vendorId: string) => {
    toast.success("Assessment questionnaire sent to vendor");
  };

  const handleViewDetails = (vendorId: string) => {
    toast.success("Opening vendor details");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Third-Party Risk Management</h1>
        <p className="text-muted-foreground mt-1">
          Vendor assessment, compliance tracking, and continuous monitoring
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Vendors</p>
          <p className="text-3xl font-bold">{stats.totalVendors}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">At Risk</p>
          <p className="text-3xl font-bold text-red-600">{stats.atRisk}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Risk Score</p>
          <p className={`text-3xl font-bold ${getRiskColor(stats.avgRiskScore)}`}>
            {stats.avgRiskScore}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Vendor Portfolio
          </h2>
          <Button>Add Vendor</Button>
        </div>

        <div className="space-y-3">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{vendor.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vendor.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getRiskColor(vendor.riskScore)}`}>
                      {vendor.riskScore}
                    </p>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(
                      vendor.status
                    )}`}
                  >
                    {vendor.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Compliance</p>
                  <p className="font-semibold">{vendor.compliance.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issues</p>
                  <p className="font-semibold text-red-600">{vendor.issues}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Assessment</p>
                  <p className="font-semibold">
                    {vendor.lastAssessment
                      ? `${Math.floor(
                          (Date.now() - vendor.lastAssessment) / (1000 * 60 * 60 * 24)
                        )}d ago`
                      : "Never"}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold mb-1">Certifications</p>
                <div className="flex flex-wrap gap-1">
                  {vendor.compliance.map((cert) => (
                    <span
                      key={cert}
                      className="text-xs bg-secondary px-2 py-1 rounded"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleViewDetails(vendor.id)}
                  variant="outline"
                >
                  View Details
                </Button>
                {vendor.status === "onboarding" && (
                  <Button
                    size="sm"
                    onClick={() => handleStartAssessment(vendor.id)}
                  >
                    Start Assessment
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
            Risk Mitigation
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Recall.ai - At Risk</p>
              <p className="text-xs text-muted-foreground mt-1">
                Missing SOC 2 Type II certification
              </p>
              <Button size="sm" className="mt-2">
                Send Remediation Notice
              </Button>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">AWS - 1 Issue</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pending FedRAMP renewal
              </p>
              <Button size="sm" className="mt-2">
                Schedule Review
              </Button>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold">Ably - Under Review</p>
              <p className="text-xs text-muted-foreground mt-1">
                Assessment in progress
              </p>
              <Button size="sm" className="mt-2">
                View Questionnaire
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Assessment Schedule
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Next 30 Days</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
                <li>Recall.ai - Risk assessment due</li>
                <li>Ably - Compliance review</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Next 90 Days</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
                <li>AWS - Annual compliance audit</li>
                <li>Twilio - Initial assessment</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Continuous Monitoring</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
                <li>Real-time threat intelligence feeds</li>
                <li>Breach notification monitoring</li>
                <li>Security scorecard tracking</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
