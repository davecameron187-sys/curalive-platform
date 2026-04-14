import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  Trash2,
  Plus,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface SIEMConnector {
  id: string;
  name: string;
  type: "splunk" | "elk" | "arcsight";
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSync: number;
  nextSync: number;
  eventsForwarded: number;
  syncInterval: number;
  healthScore: number;
  errorCount: number;
  endpoint: string;
  apiKey?: string;
  dataTypes: string[];
}

interface EventStream {
  id: string;
  connectorId: string;
  eventType: string;
  count: number;
  lastEvent: number;
  status: "active" | "paused" | "error";
}

interface TransformationRule {
  id: string;
  name: string;
  sourceField: string;
  targetField: string;
  transformationType: "map" | "filter" | "enrich" | "aggregate";
  status: "active" | "inactive";
  appliedCount: number;
}

export default function SIEMIntegration() {
  const [connectors] = useState<SIEMConnector[]>([
    {
      id: "SPLUNK-001",
      name: "Splunk Enterprise",
      type: "splunk",
      status: "connected",
      lastSync: Date.now() - 300000,
      nextSync: Date.now() + 3300000,
      eventsForwarded: 45230,
      syncInterval: 3600,
      healthScore: 99,
      errorCount: 0,
      endpoint: "https://splunk.company.com:8088",
      dataTypes: ["vulnerabilities", "threats", "incidents", "compliance"],
    },
    {
      id: "ELK-001",
      name: "ELK Stack",
      type: "elk",
      status: "connected",
      lastSync: Date.now() - 600000,
      nextSync: Date.now() + 3000000,
      eventsForwarded: 32150,
      syncInterval: 3600,
      healthScore: 98,
      errorCount: 1,
      endpoint: "https://elk.company.com:9200",
      dataTypes: ["alerts", "logs", "metrics"],
    },
    {
      id: "ARCSIGHT-001",
      name: "ArcSight ESM",
      type: "arcsight",
      status: "syncing",
      lastSync: Date.now() - 120000,
      nextSync: Date.now() + 3480000,
      eventsForwarded: 28900,
      syncInterval: 3600,
      healthScore: 96,
      errorCount: 2,
      endpoint: "https://arcsight.company.com:443",
      dataTypes: ["security_events", "compliance_events"],
    },
  ]);

  const [eventStreams] = useState<EventStream[]>([
    {
      id: "STREAM-001",
      connectorId: "SPLUNK-001",
      eventType: "Vulnerability Detected",
      count: 12450,
      lastEvent: Date.now() - 45000,
      status: "active",
    },
    {
      id: "STREAM-002",
      connectorId: "SPLUNK-001",
      eventType: "Threat Alert",
      count: 8230,
      lastEvent: Date.now() - 120000,
      status: "active",
    },
    {
      id: "STREAM-003",
      connectorId: "ELK-001",
      eventType: "Compliance Check",
      count: 15670,
      lastEvent: Date.now() - 30000,
      status: "active",
    },
    {
      id: "STREAM-004",
      connectorId: "ARCSIGHT-001",
      eventType: "Security Event",
      count: 9340,
      lastEvent: Date.now() - 90000,
      status: "active",
    },
  ]);

  const [transformationRules] = useState<TransformationRule[]>([
    {
      id: "RULE-001",
      name: "Map Severity Levels",
      sourceField: "severity",
      targetField: "normalized_severity",
      transformationType: "map",
      status: "active",
      appliedCount: 45230,
    },
    {
      id: "RULE-002",
      name: "Filter Low Priority Events",
      sourceField: "priority",
      targetField: "filtered_events",
      transformationType: "filter",
      status: "active",
      appliedCount: 12450,
    },
    {
      id: "RULE-003",
      name: "Enrich with Threat Intelligence",
      sourceField: "threat_id",
      targetField: "threat_context",
      transformationType: "enrich",
      status: "active",
      appliedCount: 8230,
    },
    {
      id: "RULE-004",
      name: "Aggregate Incidents",
      sourceField: "incident_id",
      targetField: "aggregated_incidents",
      transformationType: "aggregate",
      status: "inactive",
      appliedCount: 0,
    },
  ]);

  const handleTestConnection = (connectorId: string) => {
    toast.success(`Testing connection for ${connectorId}...`);
  };

  const handlePauseSync = (connectorId: string) => {
    toast.success(`Paused sync for ${connectorId}`);
  };

  const handleResumeSync = (connectorId: string) => {
    toast.success(`Resumed sync for ${connectorId}`);
  };

  const handleDeleteConnector = (connectorId: string) => {
    toast.success(`Deleted connector ${connectorId}`);
  };

  const handleToggleRule = (ruleId: string) => {
    toast.success(`Toggled transformation rule ${ruleId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "disconnected":
      case "inactive":
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
      case "syncing":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "error":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "syncing":
        return <Activity className="h-4 w-4 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SIEM Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage external SIEM platforms
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Connector
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
          <p className="text-3xl font-bold">106.3K</p>
          <p className="text-xs text-muted-foreground mt-2">Forwarded</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Connectors</p>
          <p className="text-3xl font-bold">{connectors.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Connected</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Health</p>
          <p className="text-3xl font-bold">97.7%</p>
          <p className="text-xs text-muted-foreground mt-2">Score</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Server className="h-4 w-4" />
          SIEM Connectors
        </h2>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(connector.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{connector.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${getStatusColor(connector.status)}`}
                    >
                      {getStatusIcon(connector.status)}
                      {connector.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{connector.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {connector.endpoint}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{connector.healthScore}%</p>
                  <p className="text-xs text-muted-foreground">Health</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Events</p>
                  <p className="font-semibold">
                    {(connector.eventsForwarded / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interval</p>
                  <p className="font-semibold">{connector.syncInterval / 60}m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - connector.lastSync) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-semibold">{connector.errorCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Types</p>
                  <p className="font-semibold">{connector.dataTypes.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {connector.dataTypes.map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-1 rounded bg-secondary font-mono"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection(connector.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Test
                </Button>
                {connector.status === "connected" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePauseSync(connector.id)}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResumeSync(connector.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteConnector(connector.id)}
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
          <Activity className="h-4 w-4" />
          Event Streams
        </h2>

        <div className="space-y-3">
          {eventStreams.map((stream) => (
            <div
              key={stream.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{stream.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(stream.status)}`}
                    >
                      {stream.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{stream.eventType}</h4>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {(stream.count / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Last event:{" "}
                {Math.floor((Date.now() - stream.lastEvent) / 60000)} minutes ago
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Data Transformation Rules
        </h2>

        <div className="space-y-3">
          {transformationRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg hover:bg-secondary/50 transition-colors ${getStatusColor(rule.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono">{rule.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(rule.status)}`}
                    >
                      {rule.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">
                      {rule.transformationType}
                    </span>
                  </div>
                  <h4 className="font-semibold">{rule.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rule.sourceField} → {rule.targetField}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {(rule.appliedCount / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Applied</p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleRule(rule.id)}
                >
                  {rule.status === "active" ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
