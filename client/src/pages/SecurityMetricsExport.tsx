import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Plus,
  Eye,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  recipients: string[];
  lastGenerated: number;
  nextScheduled: number;
  status: "active" | "paused" | "failed";
  format: string[];
  stakeholders: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  customizable: boolean;
  lastModified: number;
  usageCount: number;
}

interface ExportHistory {
  id: string;
  reportName: string;
  generatedAt: number;
  format: string;
  recipients: string[];
  status: "success" | "failed" | "pending";
  fileSize: string;
  deliveryStatus: "delivered" | "pending" | "failed";
}

interface StakeholderGroup {
  id: string;
  name: string;
  role: string;
  recipients: number;
  preferences: string[];
  reportFrequency: string;
}

export default function SecurityMetricsExport() {
  const [scheduledReports] = useState<ScheduledReport[]>([
    {
      id: "RPT-001",
      name: "Executive Security Dashboard",
      template: "Executive Summary",
      frequency: "weekly",
      recipients: ["ciso@company.com", "cfo@company.com", "board@company.com"],
      lastGenerated: Date.now() - 86400000,
      nextScheduled: Date.now() + 604800000,
      status: "active",
      format: ["PDF", "PPTX"],
      stakeholders: ["C-Suite", "Board Members"],
    },
    {
      id: "RPT-002",
      name: "Security Team Daily Briefing",
      template: "Operational Summary",
      frequency: "daily",
      recipients: ["security-team@company.com"],
      lastGenerated: Date.now() - 3600000,
      nextScheduled: Date.now() + 82800000,
      status: "active",
      format: ["PDF", "HTML"],
      stakeholders: ["Security Team"],
    },
    {
      id: "RPT-003",
      name: "Compliance Report",
      template: "Compliance Status",
      frequency: "monthly",
      recipients: ["compliance@company.com", "audit@company.com"],
      lastGenerated: Date.now() - 2592000000,
      nextScheduled: Date.now() + 2592000000,
      status: "active",
      format: ["PDF"],
      stakeholders: ["Compliance Team", "Auditors"],
    },
    {
      id: "RPT-004",
      name: "Vendor Risk Assessment",
      template: "Vendor Summary",
      frequency: "quarterly",
      recipients: ["procurement@company.com", "risk@company.com"],
      lastGenerated: Date.now() - 7776000000,
      nextScheduled: Date.now() + 7776000000,
      status: "paused",
      format: ["PDF", "CSV"],
      stakeholders: ["Procurement", "Risk Management"],
    },
  ]);

  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: "TPL-001",
      name: "Executive Summary",
      description: "High-level security metrics for C-suite and board",
      sections: ["KPIs", "Risk Score", "Compliance Status", "Incidents"],
      customizable: true,
      lastModified: Date.now() - 604800000,
      usageCount: 24,
    },
    {
      id: "TPL-002",
      name: "Operational Summary",
      description: "Detailed metrics for security operations team",
      sections: [
        "Alerts",
        "Incidents",
        "Vulnerabilities",
        "Compliance",
        "Threats",
      ],
      customizable: true,
      lastModified: Date.now() - 1209600000,
      usageCount: 31,
    },
    {
      id: "TPL-003",
      name: "Compliance Status",
      description: "Compliance and regulatory metrics",
      sections: ["SOC 2", "ISO 27001", "HIPAA", "PCI-DSS", "GDPR"],
      customizable: false,
      lastModified: Date.now() - 1814400000,
      usageCount: 12,
    },
    {
      id: "TPL-004",
      name: "Vendor Summary",
      description: "Third-party risk and vendor metrics",
      sections: ["Vendor Scores", "Assessments", "Compliance", "Risks"],
      customizable: true,
      lastModified: Date.now() - 2419200000,
      usageCount: 8,
    },
  ]);

  const [exportHistory] = useState<ExportHistory[]>([
    {
      id: "EXP-001",
      reportName: "Executive Security Dashboard",
      generatedAt: Date.now() - 3600000,
      format: "PDF",
      recipients: ["ciso@company.com", "cfo@company.com"],
      status: "success",
      fileSize: "2.4 MB",
      deliveryStatus: "delivered",
    },
    {
      id: "EXP-002",
      reportName: "Security Team Daily Briefing",
      generatedAt: Date.now() - 1800000,
      format: "HTML",
      recipients: ["security-team@company.com"],
      status: "success",
      fileSize: "1.2 MB",
      deliveryStatus: "delivered",
    },
    {
      id: "EXP-003",
      reportName: "Compliance Report",
      generatedAt: Date.now() - 7200000,
      format: "PDF",
      recipients: ["compliance@company.com"],
      status: "success",
      fileSize: "3.8 MB",
      deliveryStatus: "pending",
    },
    {
      id: "EXP-004",
      reportName: "Executive Security Dashboard",
      generatedAt: Date.now() - 86400000,
      format: "PPTX",
      recipients: ["board@company.com"],
      status: "success",
      fileSize: "5.2 MB",
      deliveryStatus: "delivered",
    },
  ]);

  const [stakeholders] = useState<StakeholderGroup[]>([
    {
      id: "SG-001",
      name: "C-Suite",
      role: "Executive Leadership",
      recipients: 5,
      preferences: ["Executive Summary", "KPIs", "Risk Trends"],
      reportFrequency: "Weekly",
    },
    {
      id: "SG-002",
      name: "Security Team",
      role: "Operations",
      recipients: 12,
      preferences: ["Operational Summary", "Alerts", "Incidents"],
      reportFrequency: "Daily",
    },
    {
      id: "SG-003",
      name: "Compliance Team",
      role: "Governance",
      recipients: 4,
      preferences: ["Compliance Status", "Audit Trail", "Certifications"],
      reportFrequency: "Monthly",
    },
    {
      id: "SG-004",
      name: "Board Members",
      role: "Governance",
      recipients: 8,
      preferences: ["Executive Summary", "Risk Score", "Compliance"],
      reportFrequency: "Quarterly",
    },
  ]);

  const handleGenerateReport = (reportId: string) => {
    toast.success(`Report ${reportId} generated successfully`);
  };

  const handleScheduleReport = () => {
    toast.success("New scheduled report created");
  };

  const handleDownloadReport = (reportId: string) => {
    toast.success(`Downloading report ${reportId}`);
  };

  const handleEmailReport = (reportId: string) => {
    toast.success(`Report ${reportId} emailed to recipients`);
  };

  const handlePauseReport = (reportId: string) => {
    toast.info(`Report ${reportId} paused`);
  };

  const activeReports = scheduledReports.filter((r) => r.status === "active").length;
  const totalRecipients = scheduledReports.reduce(
    (sum, r) => sum + r.recipients.length,
    0
  );
  const successfulExports = exportHistory.filter((e) => e.status === "success").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Metrics Export</h1>
        <p className="text-muted-foreground mt-1">
          Scheduled report generation and distribution to stakeholders
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Reports</p>
          <p className="text-3xl font-bold text-blue-600">{activeReports}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Recipients</p>
          <p className="text-3xl font-bold">{totalRecipients}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Successful Exports</p>
          <p className="text-3xl font-bold text-green-600">{successfulExports}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Report Templates</p>
          <p className="text-3xl font-bold">{reportTemplates.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Scheduled Reports
          </h2>
          <Button onClick={handleScheduleReport} size="sm">
            <Plus className="h-3 w-3 mr-1" />
            New Report
          </Button>
        </div>

        <div className="space-y-3">
          {scheduledReports.map((report) => (
            <div
              key={report.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {report.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        report.status === "active"
                          ? "bg-green-500/20 text-green-600"
                          : report.status === "paused"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{report.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Template: {report.template} • Frequency: {report.frequency}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReport(report.id)}
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                  {report.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePauseReport(report.id)}
                    >
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Recipients</p>
                  <p className="font-semibold">{report.recipients.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Formats</p>
                  <p className="font-semibold">{report.format.join(", ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Generated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - report.lastGenerated) / 3600000)}h ago
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {report.recipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {recipient}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Report Templates
        </h2>

        <div className="space-y-3">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">Sections</p>
                  <p className="font-semibold">{template.sections.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usage</p>
                  <p className="font-semibold">{template.usageCount} times</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customizable</p>
                  <p className="font-semibold">
                    {template.customizable ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.sections.map((section, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export History
        </h2>

        <div className="space-y-3">
          {exportHistory.map((export_item) => (
            <div
              key={export_item.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {export_item.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        export_item.status === "success"
                          ? "bg-green-500/20 text-green-600"
                          : export_item.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {export_item.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        export_item.deliveryStatus === "delivered"
                          ? "bg-green-500/20 text-green-600"
                          : export_item.deliveryStatus === "pending"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {export_item.deliveryStatus}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{export_item.reportName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: {export_item.format} • Size: {export_item.fileSize}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadReport(export_item.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEmailReport(export_item.id)}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {export_item.recipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {recipient}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Stakeholder Groups
        </h2>

        <div className="space-y-3">
          {stakeholders.map((group) => (
            <div
              key={group.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{group.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{group.role}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Recipients</p>
                  <p className="font-semibold">{group.recipients}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-semibold">{group.reportFrequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preferences</p>
                  <p className="font-semibold">{group.preferences.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {group.preferences.map((pref, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
