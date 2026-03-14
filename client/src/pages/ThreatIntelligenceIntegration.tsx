import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Target,
  TrendingUp,
  Shield,
  RefreshCw,
  CheckCircle,
  Zap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface ThreatIntelligence {
  id: string;
  threatName: string;
  attackPattern: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedSystems: string[];
  correlatedAnomalies: number;
  remediationSteps: string[];
  lastUpdated: number;
}

interface AttackPattern {
  id: string;
  mitreId: string;
  technique: string;
  tactics: string[];
  detectionRate: number;
  prevalence: number;
}

interface ThreatFeed {
  id: string;
  name: string;
  source: string;
  lastSync: number;
  threatCount: number;
  updateFrequency: string;
  status: "active" | "inactive" | "error";
}

export default function ThreatIntelligenceIntegration() {
  const [threats, setThreats] = useState<ThreatIntelligence[]>([
    {
      id: "threat-001",
      threatName: "SQL Injection Campaign (CVE-2024-1234)",
      attackPattern: "T1190 - Exploit Public-Facing Application",
      severity: "critical",
      affectedSystems: ["API Gateway", "Database Layer"],
      correlatedAnomalies: 3,
      remediationSteps: [
        "Apply security patch immediately",
        "Increase DAST scanning frequency",
        "Review WAF rules",
        "Monitor for exploitation attempts",
      ],
      lastUpdated: Date.now() - 3600000,
    },
    {
      id: "threat-002",
      threatName: "Credential Stuffing Attack",
      attackPattern: "T1110 - Brute Force",
      severity: "high",
      affectedSystems: ["Authentication", "API"],
      correlatedAnomalies: 2,
      remediationSteps: [
        "Enable MFA enforcement",
        "Implement rate limiting",
        "Review failed login attempts",
        "Update password policies",
      ],
      lastUpdated: Date.now() - 7200000,
    },
    {
      id: "threat-003",
      threatName: "Data Exfiltration via API",
      attackPattern: "T1041 - Exfiltration Over C2 Channel",
      severity: "high",
      affectedSystems: ["API", "Data Storage"],
      correlatedAnomalies: 1,
      remediationSteps: [
        "Audit API access logs",
        "Implement DLP rules",
        "Review data access permissions",
        "Enable encryption in transit",
      ],
      lastUpdated: Date.now() - 86400000,
    },
  ]);

  const [attackPatterns, setAttackPatterns] = useState<AttackPattern[]>([
    {
      id: "ap-001",
      mitreId: "T1190",
      technique: "Exploit Public-Facing Application",
      tactics: ["Initial Access"],
      detectionRate: 0.87,
      prevalence: 0.92,
    },
    {
      id: "ap-002",
      mitreId: "T1110",
      technique: "Brute Force",
      tactics: ["Credential Access"],
      detectionRate: 0.94,
      prevalence: 0.78,
    },
    {
      id: "ap-003",
      mitreId: "T1041",
      technique: "Exfiltration Over C2 Channel",
      tactics: ["Exfiltration"],
      detectionRate: 0.72,
      prevalence: 0.65,
    },
  ]);

  const [threatFeeds, setThreatFeeds] = useState<ThreatFeed[]>([
    {
      id: "feed-001",
      name: "MITRE ATT&CK Framework",
      source: "mitre.org",
      lastSync: Date.now() - 1800000,
      threatCount: 14328,
      updateFrequency: "Weekly",
      status: "active",
    },
    {
      id: "feed-002",
      name: "CVE Database",
      source: "nvd.nist.gov",
      lastSync: Date.now() - 3600000,
      threatCount: 245678,
      updateFrequency: "Daily",
      status: "active",
    },
    {
      id: "feed-003",
      name: "Shodan Threat Intelligence",
      source: "shodan.io",
      lastSync: Date.now() - 7200000,
      threatCount: 89234,
      updateFrequency: "Real-time",
      status: "active",
    },
  ]);

  const stats = {
    activeThreatCount: threats.length,
    criticalThreats: threats.filter((t) => t.severity === "critical").length,
    correlatedAnomalies: threats.reduce((sum, t) => sum + t.correlatedAnomalies, 0),
    threatFeedsActive: threatFeeds.filter((f) => f.status === "active").length,
  };

  const handleSyncFeeds = () => {
    toast.success("Threat feeds synchronized");
  };

  const handleApplyRemediation = (threatId: string) => {
    toast.success("Remediation workflow initiated");
  };

  const handleAddToWatchlist = (threatId: string) => {
    toast.success("Threat added to watchlist");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "inactive":
        return "bg-gray-500/20 text-gray-600";
      case "error":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Threat Intelligence Integration</h1>
        <p className="text-muted-foreground mt-1">
          MITRE ATT&CK framework with threat feeds and attack pattern correlation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Threats</p>
          <p className="text-3xl font-bold">{stats.activeThreatCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.criticalThreats}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Correlated</p>
          <p className="text-3xl font-bold">{stats.correlatedAnomalies}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Feeds Active</p>
          <p className="text-3xl font-bold">{stats.threatFeedsActive}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Detected Threats
          </h2>
          <Button onClick={handleSyncFeeds}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync Feeds
          </Button>
        </div>

        <div className="space-y-3">
          {threats.map((threat) => (
            <div
              key={threat.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{threat.threatName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {threat.attackPattern}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </span>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Affected Systems:</p>
                <div className="flex flex-wrap gap-1">
                  {threat.affectedSystems.map((system) => (
                    <span key={system} className="bg-secondary px-2 py-1 rounded">
                      {system}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Correlated Anomalies</p>
                  <p className="font-semibold">{threat.correlatedAnomalies}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - threat.lastUpdated) / (1000 * 60))} min ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remediation Steps</p>
                  <p className="font-semibold">{threat.remediationSteps.length}</p>
                </div>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Recommended Actions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {threat.remediationSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApplyRemediation(threat.id)}>
                  <Zap className="h-3 w-3 mr-1" />
                  Apply Remediation
                </Button>
                <Button size="sm" onClick={() => handleAddToWatchlist(threat.id)} variant="outline">
                  Add to Watchlist
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          MITRE ATT&CK Techniques
        </h2>

        <div className="space-y-3">
          {attackPatterns.map((pattern) => (
            <div key={pattern.id} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{pattern.technique}</p>
                  <p className="text-xs text-muted-foreground">{pattern.mitreId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tactics</p>
                  <p className="text-xs font-semibold">{pattern.tactics.join(", ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Detection Rate</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${pattern.detectionRate * 100}%` }}
                    />
                  </div>
                  <p className="font-semibold mt-1">{(pattern.detectionRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prevalence</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${pattern.prevalence * 100}%` }}
                    />
                  </div>
                  <p className="font-semibold mt-1">{(pattern.prevalence * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Threat Feeds
        </h2>

        <div className="space-y-3">
          {threatFeeds.map((feed) => (
            <div key={feed.id} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{feed.name}</p>
                  <p className="text-xs text-muted-foreground">{feed.source}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(feed.status)}`}>
                  {feed.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Threats</p>
                  <p className="font-semibold">{(feed.threatCount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Update Freq</p>
                  <p className="font-semibold">{feed.updateFrequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - feed.lastSync) / (1000 * 60))} min ago
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    Sync
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
