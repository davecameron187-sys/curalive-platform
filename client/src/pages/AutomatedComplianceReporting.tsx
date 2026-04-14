import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Send,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceReport {
  id: string;
  framework: string;
  reportType: "full" | "summary" | "evidence";
  generatedDate: number;
  nextDueDate: number;
  status: "completed" | "in-progress" | "pending" | "failed";
  evidenceItems: number;
  compliance: number;
  findings: number;
}

interface ScheduledReport {
  id: string;
  framework: string;
  frequency: "monthly" | "quarterly" | "annually";
  nextScheduled: number;
  recipients: string[];
  format: "pdf" | "excel" | "html";
  status: "active" | "paused" | "disabled";
}

interface EvidenceItem {
  id: string;
  framework: string;
  control: string;
  evidence: string;
  collectedDate: number;
  expiryDate: number;
  status: "valid" | "expiring" | "expired";
}

export default function AutomatedComplianceReporting() {
  const [reports, setReports] = useState<ComplianceReport[]>([
    {
      id: "report-001",
      framework: "SOC 2 Type II",
      reportType: "full",
      generatedDate: Date.now() - 2592000000,
      nextDueDate: Date.now() + 7776000000,
      status: "completed",
      evidenceItems: 145,
      compliance: 98,
      findings: 2,
    },
    {
      id: "report-002",
      framework: "ISO 27001",
      reportType: "full",
      generatedDate: Date.now() - 5184000000,
      nextDueDate: Date.now() + 5184000000,
      status: "completed",
      evidenceItems: 203,
      compliance: 95,
      findings: 5,
    },
    {
      id: "report-003",
      framework: "HIPAA",
      reportType: "summary",
      generatedDate: Date.now() - 1209600000,
      nextDueDate: Date.now() + 2592000000,
      status: "in-progress",
      evidenceItems: 89,
      compliance: 92,
      findings: 3,
    },
    {
      id: "report-004",
      framework: "PCI-DSS",
      reportType: "full",
      generatedDate: Date.now() - 3888000000,
      nextDueDate: Date.now() + 3888000000,
      status: "completed",
      evidenceItems: 167,
      compliance: 88,
      findings: 8,
    },
    {
      id: "report-005",
      framework: "GDPR",
      reportType: "summary",
      generatedDate: Date.now() - 604800000,
      nextDueDate: Date.now() + 5184000000,
      status: "completed",
      evidenceItems: 112,
      compliance: 96,
      findings: 1,
    },
  ]);

  const [schedules, setSchedules] = useState<ScheduledReport[]>([
    {
      id: "sched-001",
      framework: "SOC 2 Type II",
      frequency: "quarterly",
      nextScheduled: Date.now() + 7776000000,
      recipients: ["ciso@company.com", "audit@company.com"],
      format: "pdf",
      status: "active",
    },
    {
      id: "sched-002",
      framework: "ISO 27001",
      frequency: "annually",
      nextScheduled: Date.now() + 5184000000,
      recipients: ["ciso@company.com", "compliance@company.com"],
      format: "pdf",
      status: "active",
    },
    {
      id: "sched-003",
      framework: "HIPAA",
      frequency: "quarterly",
      nextScheduled: Date.now() + 2592000000,
      recipients: ["hipaa-officer@company.com"],
      format: "excel",
      status: "active",
    },
  ]);

  const [evidence] = useState<EvidenceItem[]>([
    {
      id: "ev-001",
      framework: "SOC 2",
      control: "CC6.1 - Logical Access Controls",
      evidence: "MFA Implementation Report",
      collectedDate: Date.now() - 604800000,
      expiryDate: Date.now() + 5184000000,
      status: "valid",
    },
    {
      id: "ev-002",
      framework: "ISO 27001",
      control: "A.9.2.1 - User Registration",
      evidence: "Access Control Policy v2.3",
      collectedDate: Date.now() - 1209600000,
      expiryDate: Date.now() + 2592000000,
      status: "valid",
    },
    {
      id: "ev-003",
      framework: "HIPAA",
      control: "164.312(a)(2)(i) - Encryption",
      evidence: "Data Encryption Audit",
      collectedDate: Date.now() - 2592000000,
      expiryDate: Date.now() + 1209600000,
      status: "expiring",
    },
  ]);

  const stats = {
    totalReports: reports.length,
    completedReports: reports.filter((r) => r.status === "completed").length,
    avgCompliance: Math.round(reports.reduce((sum, r) => sum + r.compliance, 0) / reports.length),
    totalFindings: reports.reduce((sum, r) => sum + r.findings, 0),
  };

  const handleGenerateReport = () => {
    toast.success("Compliance report generated");
  };

  const handleScheduleReport = () => {
    toast.success("Report scheduled");
  };

  const handleDistributeReport = (reportId: string) => {
    toast.success("Report distributed to stakeholders");
  };

  const handleDownloadReport = (reportId: string) => {
    toast.success("Report downloaded");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-600";
      case "in-progress":
        return "bg-blue-500/20 text-blue-600";
      case "pending":
        return "bg-yellow-500/20 text-yellow-600";
      case "failed":
        return "bg-red-500/20 text-red-600";
      case "valid":
        return "bg-green-500/20 text-green-600";
      case "expiring":
        return "bg-yellow-500/20 text-yellow-600";
      case "expired":
        return "bg-red-500/20 text-red-600";
      case "active":
        return "bg-green-500/20 text-green-600";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600";
      case "disabled":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automated Compliance Reporting</h1>
        <p className="text-muted-foreground mt-1">
          SOC 2, ISO 27001, HIPAA, PCI-DSS, and GDPR compliance reports
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Reports</p>
          <p className="text-3xl font-bold">{stats.totalReports}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completedReports}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Compliance</p>
          <p className="text-3xl font-bold">{stats.avgCompliance}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Findings</p>
          <p className="text-3xl font-bold text-orange-600">{stats.totalFindings}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Compliance Reports
          </h2>
          <Button onClick={handleGenerateReport}>
            <Plus className="h-3 w-3 mr-1" />
            Generate Report
          </Button>
        </div>

        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{report.framework}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {report.reportType} • Generated:{" "}
                    {new Date(report.generatedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Compliance</p>
                  <p className="font-semibold">{report.compliance}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Evidence Items</p>
                  <p className="font-semibold">{report.evidenceItems}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Findings</p>
                  <p className="font-semibold">{report.findings}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Due</p>
                  <p className="font-semibold">
                    {Math.floor((report.nextDueDate - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleDownloadReport(report.id)}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button size="sm" onClick={() => handleDistributeReport(report.id)} variant="outline">
                  <Mail className="h-3 w-3 mr-1" />
                  Distribute
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Reports
          </h2>
          <Button onClick={handleScheduleReport}>
            <Plus className="h-3 w-3 mr-1" />
            Schedule Report
          </Button>
        </div>

        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{schedule.framework}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Frequency: {schedule.frequency} • Format: {schedule.format}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(schedule.status)}`}>
                  {schedule.status}
                </span>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Recipients:</p>
                <div className="flex flex-wrap gap-1">
                  {schedule.recipients.map((recipient) => (
                    <span key={recipient} className="bg-secondary px-2 py-1 rounded text-xs">
                      {recipient}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Next Scheduled</p>
                  <p className="font-semibold">
                    {new Date(schedule.nextScheduled).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Edit
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
          Evidence Collection
        </h2>

        <div className="space-y-3">
          {evidence.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.control}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.framework} • {item.evidence}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Collected</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - item.collectedDate) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-semibold">
                    {Math.floor((item.expiryDate - Date.now()) / (1000 * 60 * 60 * 24))} days
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
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Compliance Calendar
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Upcoming Deadlines</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">HIPAA Audit</p>
                <p className="font-semibold">23 days</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">SOC 2 Report</p>
                <p className="font-semibold">89 days</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">ISO 27001 Review</p>
                <p className="font-semibold">60 days</p>
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Report Distribution</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Reports Sent This Month</p>
                <p className="font-semibold">3</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Pending Distribution</p>
                <p className="font-semibold">1</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Scheduled Next Month</p>
                <p className="font-semibold">2</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
