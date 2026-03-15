import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Zap,
  Shield,
  Code2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  id: string;
  pipeline: string;
  scanType: "sast" | "dast";
  timestamp: number;
  status: "passed" | "failed" | "blocked";
  vulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  blocked: boolean;
}

export default function CICDSecurityDashboard() {
  const [scans, setScans] = useState<ScanResult[]>([
    {
      id: "scan-001",
      pipeline: "main-build-2026-03-14",
      scanType: "sast",
      timestamp: Date.now() - 3600000,
      status: "passed",
      vulnerabilities: 2,
      critical: 0,
      high: 0,
      medium: 2,
      low: 0,
      blocked: false,
    },
    {
      id: "scan-002",
      pipeline: "feature-auth-2026-03-14",
      scanType: "dast",
      timestamp: Date.now() - 7200000,
      status: "failed",
      vulnerabilities: 8,
      critical: 1,
      high: 3,
      medium: 3,
      low: 1,
      blocked: true,
    },
    {
      id: "scan-003",
      pipeline: "main-build-2026-03-13",
      scanType: "sast",
      timestamp: Date.now() - 86400000,
      status: "passed",
      vulnerabilities: 3,
      critical: 0,
      high: 1,
      medium: 2,
      low: 0,
      blocked: false,
    },
    {
      id: "scan-004",
      pipeline: "api-security-2026-03-13",
      scanType: "dast",
      timestamp: Date.now() - 90000000,
      status: "blocked",
      vulnerabilities: 12,
      critical: 2,
      high: 5,
      medium: 4,
      low: 1,
      blocked: true,
    },
  ]);

  const stats = {
    totalScans: scans.length,
    passed: scans.filter((s) => s.status === "passed").length,
    failed: scans.filter((s) => s.status === "failed").length,
    blocked: scans.filter((s) => s.blocked).length,
    totalVulnerabilities: scans.reduce((sum, s) => sum + s.vulnerabilities, 0),
    criticalVulnerabilities: scans.reduce((sum, s) => sum + s.critical, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-500/20 text-green-600";
      case "failed":
        return "bg-orange-500/20 text-orange-600";
      case "blocked":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const handleRunScan = () => {
    toast.success("Security scan initiated");
  };

  const handleViewDetails = (scanId: string) => {
    toast.success("Opening scan details");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CI/CD Security Scanning</h1>
        <p className="text-muted-foreground mt-1">
          SAST/DAST integration with automated vulnerability detection
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Scans</p>
          <p className="text-3xl font-bold">{stats.totalScans}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Passed</p>
          <p className="text-3xl font-bold text-green-600">{stats.passed}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Failed</p>
          <p className="text-3xl font-bold text-orange-600">{stats.failed}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Blocked</p>
          <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Vulnerabilities</p>
          <p className="text-3xl font-bold">{stats.totalVulnerabilities}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.criticalVulnerabilities}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Recent Scans
          </h2>
          <Button onClick={handleRunScan}>Run Scan Now</Button>
        </div>

        <div className="space-y-3">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{scan.pipeline}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scan.scanType === "sast" ? "SAST Scan" : "DAST Scan"} •{" "}
                    {new Date(scan.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(
                      scan.status
                    )}`}
                  >
                    {scan.status}
                  </span>
                  {scan.blocked && (
                    <span className="text-xs px-2 py-1 rounded font-semibold bg-red-500/20 text-red-600">
                      BLOCKED
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{scan.vulnerabilities}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Critical</p>
                  <p className="font-semibold text-red-600">{scan.critical}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">High</p>
                  <p className="font-semibold text-orange-600">{scan.high}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-semibold text-yellow-600">{scan.medium}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Low</p>
                  <p className="font-semibold text-blue-600">{scan.low}</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleViewDetails(scan.id)}
                variant="outline"
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Scan Configuration
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">SAST Tools</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1">
                <li>SonarQube (enabled)</li>
                <li>Checkmarx (enabled)</li>
                <li>Snyk (enabled)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">DAST Tools</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1">
                <li>Burp Suite (enabled)</li>
                <li>OWASP ZAP (enabled)</li>
                <li>Acunetix (scheduled)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Scan Frequency</p>
              <p className="text-muted-foreground mt-1">
                On every commit to main branch
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Trend Analysis
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Vulnerability Trend</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↓ 40% reduction in vulnerabilities (12 → 8 → 3 → 2)
              </p>
            </div>

            <div>
              <p className="font-semibold">Critical Findings</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↓ 50% reduction (2 → 1 → 0)
              </p>
            </div>

            <div>
              <p className="font-semibold">Scan Pass Rate</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↑ 50% (50% → 75%)
              </p>
            </div>

            <div>
              <p className="font-semibold">Avg Remediation Time</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↓ 3 days (from 7 days)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
