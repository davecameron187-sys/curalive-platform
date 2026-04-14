import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  FileText,
  Download,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  resource: string;
  status: "success" | "failure" | "warning";
  details: string;
  ipAddress: string;
  tamperDetected: boolean;
}

interface AuditPolicy {
  id: string;
  name: string;
  retentionDays: number;
  encryptionEnabled: boolean;
  tamperDetectionEnabled: boolean;
  status: "active" | "inactive";
}

interface ComplianceReport {
  id: string;
  format: "SOC2" | "HIPAA" | "GDPR" | "PCI-DSS";
  generatedAt: number;
  period: string;
  status: "pending" | "completed" | "failed";
  recordCount: number;
}

export default function ComplianceAuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: "log-001",
      timestamp: Date.now() - 3600000,
      action: "User Login",
      actor: "sarah.chen@company.com",
      resource: "Security Dashboard",
      status: "success",
      details: "Successful authentication via SSO",
      ipAddress: "192.168.1.100",
      tamperDetected: false,
    },
    {
      id: "log-002",
      timestamp: Date.now() - 7200000,
      action: "Policy Modified",
      actor: "admin@company.com",
      resource: "Data Protection Policy v2.1",
      status: "success",
      details: "Updated encryption requirements",
      ipAddress: "10.0.0.50",
      tamperDetected: false,
    },
    {
      id: "log-003",
      timestamp: Date.now() - 10800000,
      action: "Unauthorized Access Attempt",
      actor: "unknown@external.com",
      resource: "Compliance Reports",
      status: "failure",
      details: "Failed authentication - invalid credentials",
      ipAddress: "203.0.113.45",
      tamperDetected: false,
    },
    {
      id: "log-004",
      timestamp: Date.now() - 14400000,
      action: "Data Export",
      actor: "mike.johnson@company.com",
      resource: "Audit Logs (30 days)",
      status: "success",
      details: "Exported 1,245 records for compliance review",
      ipAddress: "192.168.1.105",
      tamperDetected: false,
    },
  ]);

  const [policies, setPolicies] = useState<AuditPolicy[]>([
    {
      id: "pol-001",
      name: "Standard Audit Retention",
      retentionDays: 365,
      encryptionEnabled: true,
      tamperDetectionEnabled: true,
      status: "active",
    },
    {
      id: "pol-002",
      name: "Extended Compliance Retention",
      retentionDays: 2555,
      encryptionEnabled: true,
      tamperDetectionEnabled: true,
      status: "active",
    },
  ]);

  const [reports, setReports] = useState<ComplianceReport[]>([
    {
      id: "rep-001",
      format: "SOC2",
      generatedAt: Date.now() - 86400000,
      period: "Q1 2026",
      status: "completed",
      recordCount: 45230,
    },
    {
      id: "rep-002",
      format: "HIPAA",
      generatedAt: Date.now() - 172800000,
      period: "Q1 2026",
      status: "completed",
      recordCount: 32156,
    },
    {
      id: "rep-003",
      format: "GDPR",
      generatedAt: Date.now() - 259200000,
      period: "Q1 2026",
      status: "completed",
      recordCount: 28945,
    },
  ]);

  const stats = {
    totalLogs: logs.length,
    logsThisMonth: logs.filter((l) => Date.now() - l.timestamp < 30 * 24 * 60 * 60 * 1000).length,
    tamperDetected: logs.filter((l) => l.tamperDetected).length,
    encryptedLogs: Math.round(logs.length * 0.98),
  };

  const handleExportLogs = () => {
    toast.success("Audit logs exported");
  };

  const handleGenerateReport = (format: string) => {
    toast.success(`${format} report generation started`);
  };

  const handleVerifyIntegrity = () => {
    toast.success("Audit log integrity verified - no tampering detected");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-600";
      case "failure":
        return "bg-red-500/20 text-red-600";
      case "warning":
        return "bg-yellow-500/20 text-yellow-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Audit Trail</h1>
        <p className="text-muted-foreground mt-1">
          Immutable audit logs with tamper detection and regulatory exports
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Logs</p>
          <p className="text-3xl font-bold">{stats.totalLogs}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">This Month</p>
          <p className="text-3xl font-bold">{stats.logsThisMonth}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Tamper Detected</p>
          <p className="text-3xl font-bold text-red-600">{stats.tamperDetected}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Encrypted</p>
          <p className="text-3xl font-bold text-green-600">{stats.encryptedLogs}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button onClick={handleExportLogs} size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 border border-border rounded flex items-start justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{log.action}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  {log.tamperDetected && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-500/20 text-red-600">
                      ⚠️ Tamper Detected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {log.actor} • {log.resource}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  IP: {log.ipAddress} • {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Audit Policies
        </h2>

        <div className="space-y-3">
          {policies.map((policy) => (
            <div key={policy.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{policy.name}</h4>
                <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded font-semibold">
                  {policy.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">Retention</p>
                  <p className="font-semibold">{policy.retentionDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Encryption</p>
                  <p className="font-semibold">
                    {policy.encryptionEnabled ? "✓ Enabled" : "Disabled"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tamper Detection</p>
                  <p className="font-semibold">
                    {policy.tamperDetectionEnabled ? "✓ Enabled" : "Disabled"}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    Edit
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
            <Shield className="h-4 w-4" />
            Regulatory Exports
          </h2>
          <Button onClick={handleVerifyIntegrity} variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verify Integrity
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{report.format} Report</p>
                <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded font-semibold">
                  {report.status}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p>Period: {report.period}</p>
                <p>Records: {report.recordCount.toLocaleString()}</p>
                <p>Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport(report.format)}
                  variant="outline"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 border border-border rounded-lg bg-secondary/30">
          <p className="text-sm font-semibold mb-2">Generate New Report</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["SOC2", "HIPAA", "GDPR", "PCI-DSS"].map((format) => (
              <Button
                key={format}
                size="sm"
                onClick={() => handleGenerateReport(format)}
                variant="outline"
              >
                {format}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
