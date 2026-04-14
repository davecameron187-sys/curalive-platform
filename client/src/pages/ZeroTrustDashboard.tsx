import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
  BarChart3,
  FileText,
  Zap,
  Network,
} from "lucide-react";
import { toast } from "sonner";

interface Device {
  id: string;
  name: string;
  owner: string;
  osType: string;
  trustScore: number;
  lastSeen: number;
  posture: "compliant" | "warning" | "non-compliant";
  policies: string[];
}

interface MicrosegmentPolicy {
  id: string;
  name: string;
  source: string;
  destination: string;
  action: "allow" | "deny";
  status: "active" | "inactive";
  enforced: number;
  violations: number;
}

export default function ZeroTrustDashboard() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "dev-001",
      name: "MacBook Pro - Alice",
      owner: "Alice Johnson",
      osType: "macOS 14.2",
      trustScore: 95,
      lastSeen: Date.now() - 300000,
      posture: "compliant",
      policies: ["MFA Enabled", "Disk Encryption", "Firewall Active"],
    },
    {
      id: "dev-002",
      name: "Windows 11 - Bob",
      owner: "Bob Smith",
      osType: "Windows 11 Pro",
      trustScore: 78,
      lastSeen: Date.now() - 600000,
      posture: "warning",
      policies: ["MFA Enabled", "Disk Encryption", "Antivirus Outdated"],
    },
    {
      id: "dev-003",
      name: "Ubuntu Server - CI/CD",
      owner: "DevOps Team",
      osType: "Ubuntu 22.04",
      trustScore: 88,
      lastSeen: Date.now() - 60000,
      posture: "compliant",
      policies: ["SSH Keys", "Firewall Active", "Intrusion Detection"],
    },
    {
      id: "dev-004",
      name: "iPhone - Carol",
      owner: "Carol Davis",
      osType: "iOS 17.3",
      trustScore: 92,
      lastSeen: Date.now() - 1800000,
      posture: "compliant",
      policies: ["MDM Enrolled", "Passcode Required", "App Restrictions"],
    },
  ]);

  const [policies, setPolicies] = useState<MicrosegmentPolicy[]>([
    {
      id: "pol-001",
      name: "API to Database",
      source: "API Servers",
      destination: "Database Cluster",
      action: "allow",
      status: "active",
      enforced: 1247,
      violations: 3,
    },
    {
      id: "pol-002",
      name: "Employees to Internet",
      source: "Employee Devices",
      destination: "Internet",
      action: "allow",
      status: "active",
      enforced: 2891,
      violations: 12,
    },
    {
      id: "pol-003",
      name: "Block Unauthorized Access",
      source: "Unknown Devices",
      destination: "Internal Services",
      action: "deny",
      status: "active",
      enforced: 5621,
      violations: 0,
    },
    {
      id: "pol-004",
      name: "Admin to Compliance Logs",
      source: "Admin Devices",
      destination: "Audit Logs",
      action: "allow",
      status: "active",
      enforced: 342,
      violations: 0,
    },
  ]);

  const stats = {
    compliant: devices.filter((d) => d.posture === "compliant").length,
    warning: devices.filter((d) => d.posture === "warning").length,
    nonCompliant: devices.filter((d) => d.posture === "non-compliant").length,
    avgTrustScore: Math.round(
      devices.reduce((sum, d) => sum + d.trustScore, 0) / devices.length
    ),
  };

  const handleEnforcePolicy = (policyId: string) => {
    toast.success("Policy enforcement updated");
  };

  const handleRemediateDevice = (deviceId: string) => {
    toast.success("Remediation actions initiated");
  };

  const getTrustColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Zero Trust Architecture</h1>
        <p className="text-muted-foreground mt-1">
          Device posture, continuous authentication, and microsegmentation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliant</p>
          <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Warning</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.warning}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Non-Compliant</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.nonCompliant}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Trust Score</p>
          <p className={`text-3xl font-bold ${getTrustColor(stats.avgTrustScore)}`}>
            {stats.avgTrustScore}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Device Posture
        </h2>

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{device.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Owner: {device.owner} | OS: {device.osType}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getTrustColor(device.trustScore)}`}>
                    {device.trustScore}
                  </p>
                  <p className="text-xs text-muted-foreground">trust score</p>
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                {device.policies.map((policy) => (
                  <span
                    key={policy}
                    className="text-xs px-2 py-0.5 bg-secondary rounded"
                  >
                    {policy}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    device.posture === "compliant"
                      ? "bg-green-500/20 text-green-600"
                      : device.posture === "warning"
                      ? "bg-yellow-500/20 text-yellow-600"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {device.posture}
                </span>
                {device.posture !== "compliant" && (
                  <Button
                    size="sm"
                    onClick={() => handleRemediateDevice(device.id)}
                    variant="outline"
                  >
                    Remediate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Network className="h-4 w-4" />
          Microsegmentation Policies
        </h2>

        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 border border-border rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{policy.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {policy.source} → {policy.destination}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      policy.action === "allow"
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {policy.action}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                <div>
                  <p className="text-muted-foreground">Enforced</p>
                  <p className="font-semibold">{policy.enforced.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Violations</p>
                  <p className={`font-semibold ${policy.violations > 0 ? "text-red-600" : "text-green-600"}`}>
                    {policy.violations}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">{policy.status}</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleEnforcePolicy(policy.id)}
                variant="outline"
              >
                Update Policy
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Continuous Authentication
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Multi-Factor Authentication (MFA) enforced</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Behavioral biometrics monitoring active</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Session risk scoring enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Adaptive authentication policies active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
