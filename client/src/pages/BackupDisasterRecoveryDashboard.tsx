import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  FileText,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface BackupJob {
  id: string;
  name: string;
  dataType: string;
  status: "success" | "in-progress" | "failed";
  lastBackup: number;
  nextBackup: number;
  size: string;
  location: string;
  rto: number;
  rpo: number;
}

export default function BackupDisasterRecoveryDashboard() {
  const [backups, setBackups] = useState<BackupJob[]>([
    {
      id: "bk-001",
      name: "Production Database",
      dataType: "Database",
      status: "success",
      lastBackup: Date.now() - 3600000,
      nextBackup: Date.now() + 82800000,
      size: "245 GB",
      location: "US-East, EU (redundant)",
      rto: 15,
      rpo: 1,
    },
    {
      id: "bk-002",
      name: "Event Recordings",
      dataType: "Media",
      status: "success",
      lastBackup: Date.now() - 7200000,
      nextBackup: Date.now() + 79200000,
      size: "1.2 TB",
      location: "US-East, APAC (redundant)",
      rto: 60,
      rpo: 4,
    },
    {
      id: "bk-003",
      name: "Application Code",
      dataType: "Source Code",
      status: "success",
      lastBackup: Date.now() - 1800000,
      nextBackup: Date.now() + 84600000,
      size: "12 GB",
      location: "US-East, EU, GitHub",
      rto: 5,
      rpo: 0.5,
    },
    {
      id: "bk-004",
      name: "Compliance Logs",
      dataType: "Audit Logs",
      status: "in-progress",
      lastBackup: Date.now() - 10800000,
      nextBackup: Date.now() + 75600000,
      size: "89 GB",
      location: "US-East (immutable)",
      rto: 30,
      rpo: 2,
    },
    {
      id: "bk-005",
      name: "Configuration Files",
      dataType: "Configuration",
      status: "success",
      lastBackup: Date.now() - 5400000,
      nextBackup: Date.now() + 81000000,
      size: "2 GB",
      location: "US-East, EU, APAC",
      rto: 10,
      rpo: 1,
    },
  ]);

  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const stats = {
    successful: backups.filter((b) => b.status === "success").length,
    inProgress: backups.filter((b) => b.status === "in-progress").length,
    failed: backups.filter((b) => b.status === "failed").length,
    avgRTO: Math.round(
      backups.reduce((sum, b) => sum + b.rto, 0) / backups.length
    ),
  };

  const handleTestRecovery = (backupId: string) => {
    toast.success("Disaster recovery test initiated");
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      backups,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `backup-dr-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Backup/DR report exported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Disaster Recovery</h1>
        <p className="text-muted-foreground mt-1">
          Automated backups with geo-redundancy and recovery testing
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Successful</p>
          <p className="text-3xl font-bold text-green-600">{stats.successful}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats.inProgress}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg RTO</p>
          <p className="text-3xl font-bold">{stats.avgRTO}m</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Backup Jobs</h2>
          <Button onClick={handleExportReport} size="sm">
            Export Report
          </Button>
        </div>

        <div className="space-y-3">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() =>
                setSelectedBackup(
                  selectedBackup === backup.id ? null : backup.id
                )
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{backup.name}</h4>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {backup.dataType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Size: {backup.size} | Location: {backup.location}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      backup.status === "success"
                        ? "bg-green-500/20 text-green-600"
                        : backup.status === "in-progress"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {backup.status}
                  </p>
                </div>
              </div>

              {selectedBackup === backup.id && (
                <div className="mt-3 p-3 bg-secondary rounded text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold">Last Backup</p>
                      <p>
                        {Math.round(
                          (Date.now() - backup.lastBackup) / 3600000
                        )}
                        h ago
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Next Backup</p>
                      <p>
                        {Math.round(
                          (backup.nextBackup - Date.now()) / 3600000
                        )}
                        h
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">RTO</p>
                      <p>{backup.rto} minutes</p>
                    </div>
                    <div>
                      <p className="font-semibold">RPO</p>
                      <p>{backup.rpo} hours</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestRecovery(backup.id);
                    }}
                    className="w-full mt-2"
                  >
                    Test Recovery
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Geo-Redundancy
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>US-East Primary (Virginia)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>EU Secondary (Ireland)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>APAC Tertiary (Singapore)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Immutable Archive (US-West)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recovery Objectives
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">RTO (Recovery Time Objective)</p>
              <p className="text-muted-foreground text-xs mt-1">
                Average: 24 minutes across all systems
              </p>
            </div>
            <div>
              <p className="font-semibold">RPO (Recovery Point Objective)</p>
              <p className="text-muted-foreground text-xs mt-1">
                Average: 1.75 hours of data loss tolerance
              </p>
            </div>
            <div>
              <p className="font-semibold">Last DR Test</p>
              <p className="text-muted-foreground text-xs mt-1">
                Completed: 7 days ago (successful)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
