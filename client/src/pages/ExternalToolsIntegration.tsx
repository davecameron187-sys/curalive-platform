import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  tool: string;
  status: "connected" | "disconnected" | "error";
  lastSync: number;
  syncFrequency: string;
  dataPoints: number;
  apiKey: string;
}

interface IntegrationHealth {
  tool: string;
  uptime: number;
  latency: number;
  lastError?: string;
}

export default function ExternalToolsIntegration() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "int-001",
      name: "SonarQube Instance",
      tool: "sonarqube",
      status: "connected",
      lastSync: Date.now() - 1800000,
      syncFrequency: "Every 30 minutes",
      dataPoints: 1247,
      apiKey: "squ_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
    },
    {
      id: "int-002",
      name: "Checkmarx Platform",
      tool: "checkmarx",
      status: "connected",
      lastSync: Date.now() - 3600000,
      syncFrequency: "Every 60 minutes",
      dataPoints: 856,
      apiKey: "cx_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
    },
    {
      id: "int-003",
      name: "Jira Cloud",
      tool: "jira",
      status: "connected",
      lastSync: Date.now() - 900000,
      syncFrequency: "Every 15 minutes",
      dataPoints: 2134,
      apiKey: "jira_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
    },
    {
      id: "int-004",
      name: "SecurityScorecard",
      tool: "securityscorecard",
      status: "error",
      lastSync: Date.now() - 86400000,
      syncFrequency: "Every 24 hours",
      dataPoints: 0,
      apiKey: "ssc_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
    },
  ]);

  const [health, setHealth] = useState<IntegrationHealth[]>([
    {
      tool: "SonarQube",
      uptime: 99.8,
      latency: 245,
    },
    {
      tool: "Checkmarx",
      uptime: 99.5,
      latency: 512,
    },
    {
      tool: "Jira",
      uptime: 99.9,
      latency: 128,
    },
    {
      tool: "SecurityScorecard",
      uptime: 98.2,
      latency: 1024,
      lastError: "Connection timeout - API rate limit exceeded",
    },
  ]);

  const [showApiKeys, setShowApiKeys] = useState<Set<string>>(new Set());

  const handleTestConnection = (integrationId: string) => {
    toast.success("Connection test successful");
  };

  const handleSyncNow = (integrationId: string) => {
    toast.success("Synchronization started");
  };

  const handleReconnect = (integrationId: string) => {
    toast.success("Reconnection initiated");
  };

  const handleDeleteIntegration = (integrationId: string) => {
    toast.success("Integration removed");
  };

  const toggleApiKeyVisibility = (integrationId: string) => {
    const newSet = new Set(showApiKeys);
    if (newSet.has(integrationId)) {
      newSet.delete(integrationId);
    } else {
      newSet.add(integrationId);
    }
    setShowApiKeys(newSet);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/20 text-green-600";
      case "disconnected":
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
        <h1 className="text-3xl font-bold">External Tool Integration</h1>
        <p className="text-muted-foreground mt-1">
          Connect to SonarQube, Checkmarx, Jira, and SecurityScorecard for real-time data sync
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Connected Tools</p>
          <p className="text-3xl font-bold">
            {integrations.filter((i) => i.status === "connected").length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Data Points</p>
          <p className="text-3xl font-bold">
            {(integrations.reduce((sum, i) => sum + i.dataPoints, 0) / 1000).toFixed(1)}K
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Uptime</p>
          <p className="text-3xl font-bold">
            {(health.reduce((sum, h) => sum + h.uptime, 0) / health.length).toFixed(1)}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Errors</p>
          <p className="text-3xl font-bold text-red-600">
            {health.filter((h) => h.lastError).length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integrations
          </h2>
          <Button>
            <Plus className="h-3 w-3 mr-1" />
            Add Integration
          </Button>
        </div>

        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{integration.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {integration.syncFrequency} • {integration.dataPoints} data points
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
              </div>

              <div className="bg-secondary/50 rounded p-2 mb-3 flex items-center justify-between">
                <code className="text-xs font-mono text-muted-foreground">
                  {showApiKeys.has(integration.id) ? integration.apiKey : integration.apiKey.substring(0, 20) + "..."}
                </code>
                <button
                  onClick={() => toggleApiKeyVisibility(integration.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showApiKeys.has(integration.id) ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                Last sync: {Math.floor((Date.now() - integration.lastSync) / (1000 * 60))} min ago
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleTestConnection(integration.id)} variant="outline">
                  Test
                </Button>
                <Button size="sm" onClick={() => handleSyncNow(integration.id)} variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync
                </Button>
                {integration.status === "error" && (
                  <Button size="sm" onClick={() => handleReconnect(integration.id)}>
                    Reconnect
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleDeleteIntegration(integration.id)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Integration Health
        </h2>

        <div className="space-y-3">
          {health.map((item) => (
            <div key={item.tool} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{item.tool}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-green-600">{item.uptime}% uptime</span>
                  {item.lastError && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Latency</p>
                  <p className="font-semibold">{item.latency}ms</p>
                </div>
                {item.lastError && (
                  <div>
                    <p className="text-muted-foreground">Last Error</p>
                    <p className="font-semibold text-red-600">{item.lastError}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Data Synchronization
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Real-Time Sync</p>
            <p className="text-muted-foreground text-xs mt-1">
              Vulnerability data synced every 15-60 minutes depending on tool
            </p>
          </div>

          <div>
            <p className="font-semibold">Data Transformation</p>
            <p className="text-muted-foreground text-xs mt-1">
              All external data normalized to internal schema for unified reporting
            </p>
          </div>

          <div>
            <p className="font-semibold">Conflict Resolution</p>
            <p className="text-muted-foreground text-xs mt-1">
              Latest timestamp wins; manual override available for critical discrepancies
            </p>
          </div>

          <div>
            <p className="font-semibold">Audit Trail</p>
            <p className="text-muted-foreground text-xs mt-1">
              All sync events logged for compliance and troubleshooting
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
