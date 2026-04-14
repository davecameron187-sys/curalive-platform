import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  Globe,
  BarChart3,
  RefreshCw,
  FileText,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface ThreatIntelligence {
  id: string;
  title: string;
  source: "CISA" | "VirusTotal" | "SecurityScorecard";
  severity: "critical" | "high" | "medium" | "low";
  affectedSystems: string[];
  threatScore: number;
  discoveredDate: number;
  status: "active" | "mitigated" | "monitoring";
  indicators: string[];
}

export default function ThreatIntelligenceDashboard() {
  const [threats, setThreats] = useState<ThreatIntelligence[]>([
    {
      id: "ti-001",
      title: "CVE-2024-1234 - Critical RCE in OpenSSL",
      source: "CISA",
      severity: "critical",
      affectedSystems: ["Production API", "Database Server"],
      threatScore: 95,
      discoveredDate: Date.now() - 86400000,
      status: "mitigated",
      indicators: ["openssl-1.1.1", "TLS handshake failures"],
    },
    {
      id: "ti-002",
      title: "Malware Campaign Targeting Financial Services",
      source: "VirusTotal",
      severity: "high",
      affectedSystems: ["Email Gateway", "Workstations"],
      threatScore: 82,
      discoveredDate: Date.now() - 172800000,
      status: "monitoring",
      indicators: ["suspicious-domain.com", "C2 traffic patterns"],
    },
    {
      id: "ti-003",
      title: "Credential Stuffing Attack Wave",
      source: "SecurityScorecard",
      severity: "high",
      affectedSystems: ["Authentication Service"],
      threatScore: 78,
      discoveredDate: Date.now() - 259200000,
      status: "active",
      indicators: ["brute-force attempts", "failed logins spike"],
    },
    {
      id: "ti-004",
      title: "Supply Chain Vulnerability in npm Package",
      source: "CISA",
      severity: "medium",
      affectedSystems: ["Build Pipeline"],
      threatScore: 65,
      discoveredDate: Date.now() - 604800000,
      status: "mitigated",
      indicators: ["malicious-package-v1.2.3", "dependency injection"],
    },
    {
      id: "ti-005",
      title: "Phishing Campaign Targeting Employees",
      source: "SecurityScorecard",
      severity: "medium",
      affectedSystems: ["Email Users"],
      threatScore: 58,
      discoveredDate: Date.now() - 432000000,
      status: "monitoring",
      indicators: ["spoofed-email-domain.com", "credential harvesting"],
    },
  ]);

  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const stats = {
    critical: threats.filter((t) => t.severity === "critical").length,
    high: threats.filter((t) => t.severity === "high").length,
    active: threats.filter((t) => t.status === "active").length,
    avgScore: Math.round(
      threats.reduce((sum, t) => sum + t.threatScore, 0) / threats.length
    ),
  };

  const filteredThreats = threats.filter((t) => {
    const sourceMatch = filterSource === "all" || t.source === filterSource;
    const statusMatch = filterStatus === "all" || t.status === filterStatus;
    return sourceMatch && statusMatch;
  });

  const handleRefreshFeeds = () => {
    toast.success("Threat intelligence feeds updated");
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      threats: filteredThreats,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `threat-intelligence-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Threat intelligence report exported");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-600";
      case "high":
        return "bg-orange-500/20 text-orange-600";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600";
      case "low":
        return "bg-blue-500/20 text-blue-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Threat Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Real-time threat monitoring and intelligence feeds
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">High</p>
          <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Threats</p>
          <p className="text-3xl font-bold">{stats.active}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Threat Score</p>
          <p className="text-3xl font-bold">{stats.avgScore}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Threat Intelligence Feeds</h2>
          <div className="flex gap-2">
            <Button onClick={handleRefreshFeeds} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button onClick={handleExportReport} size="sm">
              Export Report
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-border rounded text-sm bg-background"
          >
            <option value="all">All Sources</option>
            <option value="CISA">CISA</option>
            <option value="VirusTotal">VirusTotal</option>
            <option value="SecurityScorecard">SecurityScorecard</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded text-sm bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="mitigated">Mitigated</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredThreats.map((threat) => (
            <div
              key={threat.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{threat.title}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${getSeverityColor(
                        threat.severity
                      )}`}
                    >
                      {threat.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded font-mono">
                      {threat.source}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Affected: {threat.affectedSystems.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{threat.threatScore}</p>
                  <p
                    className={`text-xs font-semibold px-2 py-1 rounded mt-1 ${
                      threat.status === "active"
                        ? "bg-red-500/20 text-red-600"
                        : threat.status === "monitoring"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {threat.status}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Indicators:</p>
                <ul className="space-y-0.5 ml-4">
                  {threat.indicators.map((indicator, idx) => (
                    <li key={idx}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Integrated Threat Feeds
        </h2>

        <div className="space-y-3 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold">CISA Alerts</p>
            <p className="text-muted-foreground text-xs mt-1">
              US Cybersecurity and Infrastructure Security Agency advisories
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold">VirusTotal Intelligence</p>
            <p className="text-muted-foreground text-xs mt-1">
              Malware and file reputation data
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold">SecurityScorecard</p>
            <p className="text-muted-foreground text-xs mt-1">
              Third-party risk and threat monitoring
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
