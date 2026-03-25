import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  BarChart3,
  Plus,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface ThreatHunt {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate?: number;
  status: "active" | "completed" | "paused";
  indicatorsFound: number;
  affectedSystems: number;
  severity: "critical" | "high" | "medium" | "low";
  huntedBy: string;
}

interface IOC {
  id: string;
  type: "ip" | "domain" | "hash" | "email" | "url";
  value: string;
  source: string;
  firstSeen: number;
  lastSeen: number;
  occurrences: number;
  riskScore: number;
  status: "active" | "resolved" | "false-positive";
}

interface YARARule {
  id: string;
  name: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  matches: number;
  lastExecuted: number;
  enabled: boolean;
  author: string;
}

export default function AdvancedThreatHunting() {
  const [hunts, setHunts] = useState<ThreatHunt[]>([
    {
      id: "hunt-001",
      name: "Lateral Movement Detection",
      description: "Hunting for lateral movement indicators in network logs",
      startDate: Date.now() - 604800000,
      status: "active",
      indicatorsFound: 12,
      affectedSystems: 3,
      severity: "high",
      huntedBy: "Security Team",
    },
    {
      id: "hunt-002",
      name: "Credential Harvesting Campaign",
      description: "Investigating phishing and credential theft patterns",
      startDate: Date.now() - 1209600000,
      endDate: Date.now() - 604800000,
      status: "completed",
      indicatorsFound: 28,
      affectedSystems: 15,
      severity: "critical",
      huntedBy: "Threat Intelligence",
    },
    {
      id: "hunt-003",
      name: "Persistence Mechanism Analysis",
      description: "Searching for persistence mechanisms in endpoints",
      startDate: Date.now() - 259200000,
      status: "active",
      indicatorsFound: 5,
      affectedSystems: 2,
      severity: "medium",
      huntedBy: "Incident Response",
    },
  ]);

  const [iocs, setIOCs] = useState<IOC[]>([
    {
      id: "ioc-001",
      type: "ip",
      value: "192.168.1.100",
      source: "External Threat Feed",
      firstSeen: Date.now() - 604800000,
      lastSeen: Date.now() - 3600000,
      occurrences: 45,
      riskScore: 92,
      status: "active",
    },
    {
      id: "ioc-002",
      type: "domain",
      value: "malicious-domain.com",
      source: "MITRE ATT&CK",
      firstSeen: Date.now() - 1209600000,
      lastSeen: Date.now() - 86400000,
      occurrences: 23,
      riskScore: 88,
      status: "active",
    },
    {
      id: "ioc-003",
      type: "hash",
      value: "d41d8cd98f00b204e9800998ecf8427e",
      source: "VirusTotal",
      firstSeen: Date.now() - 1814400000,
      lastSeen: Date.now() - 604800000,
      occurrences: 8,
      riskScore: 75,
      status: "resolved",
    },
  ]);

  const [rules] = useState<YARARule[]>([
    {
      id: "rule-001",
      name: "Emotet_Malware_Detection",
      category: "Malware",
      severity: "critical",
      matches: 3,
      lastExecuted: Date.now() - 3600000,
      enabled: true,
      author: "YARA Community",
    },
    {
      id: "rule-002",
      name: "Cobalt_Strike_Beacon",
      category: "C2",
      severity: "critical",
      matches: 1,
      lastExecuted: Date.now() - 7200000,
      enabled: true,
      author: "Elastic",
    },
    {
      id: "rule-003",
      name: "Suspicious_PowerShell_Execution",
      category: "Execution",
      severity: "high",
      matches: 12,
      lastExecuted: Date.now() - 1800000,
      enabled: true,
      author: "Sigma",
    },
  ]);

  const stats = {
    activeHunts: hunts.filter((h) => h.status === "active").length,
    totalIOCs: iocs.length,
    activeIOCs: iocs.filter((i) => i.status === "active").length,
    yaraRules: rules.length,
  };

  const handleStartHunt = () => {
    toast.success("Threat hunt started");
  };

  const handleCorrelateIOCs = () => {
    toast.success("IOCs correlated");
  };

  const handleExecuteRule = (ruleId: string) => {
    toast.success("YARA rule executed");
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
      case "completed":
        return "bg-blue-500/20 text-blue-600";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600";
      case "resolved":
        return "bg-green-500/20 text-green-600";
      case "false-positive":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Threat Hunting</h1>
        <p className="text-muted-foreground mt-1">
          YARA rules, IOC correlation, and proactive threat detection
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Hunts</p>
          <p className="text-3xl font-bold">{stats.activeHunts}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total IOCs</p>
          <p className="text-3xl font-bold">{stats.totalIOCs}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active IOCs</p>
          <p className="text-3xl font-bold text-red-600">{stats.activeIOCs}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">YARA Rules</p>
          <p className="text-3xl font-bold">{stats.yaraRules}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            Active Threat Hunts
          </h2>
          <Button onClick={handleStartHunt}>
            <Plus className="h-3 w-3 mr-1" />
            New Hunt
          </Button>
        </div>

        <div className="space-y-3">
          {hunts.map((hunt) => (
            <div
              key={hunt.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{hunt.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{hunt.description}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(hunt.severity)}`}>
                    {hunt.severity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(hunt.status)}`}>
                    {hunt.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Indicators Found</p>
                  <p className="font-semibold">{hunt.indicatorsFound}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Affected Systems</p>
                  <p className="font-semibold">{hunt.affectedSystems}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - hunt.startDate) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hunted By</p>
                  <p className="font-semibold">{hunt.huntedBy}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleCorrelateIOCs()}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Correlate
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
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Indicators of Compromise (IOCs)
        </h2>

        <div className="space-y-3">
          {iocs.map((ioc) => (
            <div
              key={ioc.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-mono">{ioc.value}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {ioc.type} • Source: {ioc.source}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    ioc.riskScore > 80
                      ? "bg-red-500/20 text-red-600"
                      : ioc.riskScore > 60
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-yellow-500/20 text-yellow-600"
                  }`}>
                    Risk: {ioc.riskScore}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(ioc.status)}`}>
                    {ioc.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">First Seen</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - ioc.firstSeen) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Seen</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - ioc.lastSeen) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Occurrences</p>
                  <p className="font-semibold">{ioc.occurrences}</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Investigate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          YARA Detection Rules
        </h2>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{rule.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rule.category} • Author: {rule.author}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(rule.severity)}`}>
                    {rule.severity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    rule.enabled ? "bg-green-500/20 text-green-600" : "bg-gray-500/20 text-gray-600"
                  }`}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Matches</p>
                  <p className="font-semibold">{rule.matches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Executed</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - rule.lastExecuted) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={() => handleExecuteRule(rule.id)}
                    disabled={!rule.enabled}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Execute
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
