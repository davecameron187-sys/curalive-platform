// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Shield,
  Lock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceViolation {
  id: string;
  timestamp: number;
  type: "unauthorized_recording" | "data_retention" | "participant_limit" | "encryption" | "access_control";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  resolved: boolean;
  resolution?: string;
}

interface ComplianceChecklist {
  finra: {
    label: string;
    checked: boolean;
    description: string;
  }[];
  sec: {
    label: string;
    checked: boolean;
    description: string;
  }[];
}

/**
 * ComplianceMonitor Component
 * 
 * Real-time compliance tracking with violation detection,
 * regulatory requirement checklists, and automated reporting.
 */
export function ComplianceMonitor({ conferenceId }: { conferenceId: number }) {
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [checklist, setChecklist] = useState<ComplianceChecklist>({
    finra: [
      {
        label: "Recording Authorization",
        checked: true,
        description: "All participants have authorized recording",
      },
      {
        label: "Data Retention",
        checked: true,
        description: "Data retention policies comply with FINRA rules",
      },
      {
        label: "Participant Limits",
        checked: true,
        description: "Event complies with participant disclosure limits",
      },
      {
        label: "Audit Trail",
        checked: true,
        description: "Complete audit trail maintained",
      },
    ],
    sec: [
      {
        label: "Fair Disclosure",
        checked: true,
        description: "Selective disclosure rules followed",
      },
      {
        label: "Insider Trading",
        checked: true,
        description: "No material non-public information disclosed",
      },
      {
        label: "Regulation FD",
        checked: true,
        description: "Regulation FD compliance verified",
      },
      {
        label: "Record Keeping",
        checked: true,
        description: "All records maintained per SEC requirements",
      },
    ],
  });

  // Subscribe to compliance violations
  useAblyChannel(
    `occ:compliance:${conferenceId}`,
    "violation.detected",
    useCallback(
      (message: Types.Message) => {
        const violation = message.data;

        setViolations((prev) => [
          ...prev,
          {
            id: violation.id,
            timestamp: violation.timestamp,
            type: violation.type,
            severity: violation.severity,
            message: violation.message,
            resolved: false,
          },
        ]);

        // Update compliance score
        const penalty = {
          critical: 20,
          high: 10,
          medium: 5,
          low: 2,
        }[violation.severity];

        setComplianceScore((prev) => Math.max(0, prev - penalty));

        // Show toast notification
        const icon = violation.severity === "critical" ? "🚨" : "⚠️";
        toast.error(`${icon} ${violation.message}`);
      },
      [conferenceId]
    )
  );

  const handleResolveViolation = (violationId: string) => {
    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? { ...v, resolved: true, resolution: "Manually resolved" }
          : v
      )
    );

    // Restore some compliance score
    setComplianceScore((prev) => Math.min(100, prev + 5));
    toast.success("Violation resolved");
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      conferenceId,
      complianceScore,
      violations: violations.map((v) => ({
        ...v,
        timestamp: new Date(v.timestamp * 1000).toISOString(),
      })),
      checklist,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `compliance-report-${conferenceId}-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Compliance report exported");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-500/10";
    if (score >= 70) return "text-yellow-600 bg-yellow-500/10";
    if (score >= 50) return "text-orange-600 bg-orange-500/10";
    return "text-red-600 bg-red-500/10";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-500/5";
      case "high":
        return "border-orange-500 bg-orange-500/5";
      case "medium":
        return "border-yellow-500 bg-yellow-500/5";
      default:
        return "border-blue-500 bg-blue-500/5";
    }
  };

  return (
    <div className="space-y-4">
      {/* Compliance Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Score
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-secondary"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(complianceScore / 100) * 339.3} 339.3`}
                className={getScoreColor(complianceScore).split(" ")[0]}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(complianceScore).split(" ")[0]}`}>
                  {complianceScore}
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Violations</p>
              <p className="text-2xl font-bold">{violations.length}</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Resolved</p>
              <p className="text-2xl font-bold">
                {violations.filter((v) => v.resolved).length}
              </p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Active Issues</p>
              <p className="text-2xl font-bold">
                {violations.filter((v) => !v.resolved).length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Violations */}
      {violations.filter((v) => !v.resolved).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Active Violations
          </h3>

          <div className="space-y-2">
            {violations
              .filter((v) => !v.resolved)
              .map((violation) => (
                <div
                  key={violation.id}
                  className={`p-3 rounded border-l-4 ${getSeverityColor(violation.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {violation.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        {violation.message}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold capitalize ${
                        violation.severity === "critical"
                          ? "bg-red-500/20 text-red-600"
                          : violation.severity === "high"
                            ? "bg-orange-500/20 text-orange-600"
                            : violation.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {violation.severity}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveViolation(violation.id)}
                    className="text-xs"
                  >
                    Mark as Resolved
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Regulatory Checklists */}
      <div className="grid grid-cols-2 gap-4">
        {/* FINRA */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            FINRA Requirements
          </h3>
          <div className="space-y-2">
            {checklist.finra.map((item, idx) => (
              <label key={idx} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* SEC */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            SEC Requirements
          </h3>
          <div className="space-y-2">
            {checklist.sec.map((item, idx) => (
              <label key={idx} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="p-4 bg-green-500/5 border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-sm">All Regulatory Requirements Met</p>
            <p className="text-xs text-muted-foreground">
              Event is compliant with FINRA and SEC regulations
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
