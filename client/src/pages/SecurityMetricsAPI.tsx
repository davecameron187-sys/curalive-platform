import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Webhook,
  Key,
  Activity,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  Plus,
  Settings,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  rateLimit: string;
  authentication: string;
  responseTime: number;
}

interface WebhookEvent {
  id: string;
  event: string;
  description: string;
  payload: string;
  retryPolicy: string;
  status: "active" | "inactive";
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdDate: number;
  lastUsed: number;
  status: "active" | "revoked";
  permissions: string[];
}

interface WebhookDelivery {
  id: string;
  event: string;
  endpoint: string;
  timestamp: number;
  status: "success" | "failed" | "pending";
  statusCode: number;
  duration: number;
}

export default function SecurityMetricsAPI() {
  const [endpoints] = useState<APIEndpoint[]>([
    {
      path: "/api/v1/metrics/security-score",
      method: "GET",
      description: "Get current security score",
      rateLimit: "1000 req/hour",
      authentication: "Bearer Token",
      responseTime: 145,
    },
    {
      path: "/api/v1/metrics/vulnerabilities",
      method: "GET",
      description: "Get vulnerability metrics",
      rateLimit: "500 req/hour",
      authentication: "Bearer Token",
      responseTime: 234,
    },
    {
      path: "/api/v1/metrics/compliance",
      method: "GET",
      description: "Get compliance status",
      rateLimit: "500 req/hour",
      authentication: "Bearer Token",
      responseTime: 189,
    },
    {
      path: "/api/v1/metrics/incidents",
      method: "GET",
      description: "Get incident metrics",
      rateLimit: "1000 req/hour",
      authentication: "Bearer Token",
      responseTime: 156,
    },
  ]);

  const [webhooks] = useState<WebhookEvent[]>([
    {
      id: "wh-001",
      event: "security.score.updated",
      description: "Triggered when security score changes",
      payload: "{ score, trend, timestamp }",
      retryPolicy: "Exponential backoff, max 5 retries",
      status: "active",
    },
    {
      id: "wh-002",
      event: "vulnerability.detected",
      description: "Triggered when new vulnerability is found",
      payload: "{ vulnerability, severity, cvss_score }",
      retryPolicy: "Exponential backoff, max 5 retries",
      status: "active",
    },
    {
      id: "wh-003",
      event: "incident.created",
      description: "Triggered when new incident is created",
      payload: "{ incident_id, severity, timestamp }",
      retryPolicy: "Exponential backoff, max 5 retries",
      status: "active",
    },
    {
      id: "wh-004",
      event: "compliance.violation",
      description: "Triggered when compliance violation occurs",
      payload: "{ framework, control, violation_type }",
      retryPolicy: "Exponential backoff, max 5 retries",
      status: "inactive",
    },
  ]);

  const [apiKeys] = useState<APIKey[]>([
    {
      id: "key-001",
      name: "SIEM Integration",
      key: "sk_live_51234567890abcdef",
      createdDate: Date.now() - 2592000000,
      lastUsed: Date.now() - 3600000,
      status: "active",
      permissions: ["read:metrics", "read:incidents", "read:vulnerabilities"],
    },
    {
      id: "key-002",
      name: "Analytics Dashboard",
      key: "sk_live_98765432100fedcba",
      createdDate: Date.now() - 5184000000,
      lastUsed: Date.now() - 86400000,
      status: "active",
      permissions: ["read:metrics", "read:compliance"],
    },
    {
      id: "key-003",
      name: "Third-party Tool",
      key: "sk_live_abcdef1234567890",
      createdDate: Date.now() - 7776000000,
      lastUsed: Date.now() - 2592000000,
      status: "revoked",
      permissions: ["read:metrics"],
    },
  ]);

  const [deliveries] = useState<WebhookDelivery[]>([
    {
      id: "del-001",
      event: "security.score.updated",
      endpoint: "https://siem.company.com/webhook",
      timestamp: Date.now() - 3600000,
      status: "success",
      statusCode: 200,
      duration: 234,
    },
    {
      id: "del-002",
      event: "vulnerability.detected",
      endpoint: "https://analytics.company.com/webhook",
      timestamp: Date.now() - 7200000,
      status: "success",
      statusCode: 200,
      duration: 156,
    },
    {
      id: "del-003",
      event: "incident.created",
      endpoint: "https://ticketing.company.com/webhook",
      timestamp: Date.now() - 10800000,
      status: "failed",
      statusCode: 503,
      duration: 5000,
    },
    {
      id: "del-004",
      event: "compliance.violation",
      endpoint: "https://audit.company.com/webhook",
      timestamp: Date.now() - 14400000,
      status: "success",
      statusCode: 200,
      duration: 189,
    },
  ]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const handleGenerateKey = () => {
    toast.success("New API key generated");
  };

  const handleTestEndpoint = () => {
    toast.success("Endpoint test successful");
  };

  const handleSubscribeWebhook = () => {
    toast.success("Webhook subscription created");
  };

  const stats = {
    totalRequests: 45230,
    successRate: 99.8,
    avgResponseTime: 181,
    activeWebhooks: webhooks.filter((w) => w.status === "active").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Metrics API & Webhooks</h1>
        <p className="text-muted-foreground mt-1">
          REST API and webhook integration for external tools and dashboards
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Requests</p>
          <p className="text-3xl font-bold">{(stats.totalRequests / 1000).toFixed(1)}K</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold">{stats.avgResponseTime}ms</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Webhooks</p>
          <p className="text-3xl font-bold">{stats.activeWebhooks}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            API Endpoints
          </h2>
          <Button onClick={handleTestEndpoint}>
            <Activity className="h-3 w-3 mr-1" />
            Test Endpoint
          </Button>
        </div>

        <div className="space-y-3">
          {endpoints.map((endpoint, idx) => (
            <div key={idx} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold bg-blue-500/20 text-blue-600 px-2 py-1 rounded">
                      {endpoint.method}
                    </span>
                    <code className="text-xs font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{endpoint.responseTime}ms</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Rate Limit</p>
                  <p className="font-semibold">{endpoint.rateLimit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auth</p>
                  <p className="font-semibold">{endpoint.authentication}</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Docs
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
            <Key className="h-4 w-4" />
            API Keys
          </h2>
          <Button onClick={handleGenerateKey}>
            <Plus className="h-3 w-3 mr-1" />
            Generate Key
          </Button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{key.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created:{" "}
                    {Math.floor((Date.now() - key.createdDate) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    key.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {key.status}
                </span>
              </div>

              <div className="mb-3 p-2 bg-secondary rounded font-mono text-xs flex items-center justify-between">
                <span>{key.key}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyKey(key.key)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {key.permissions.map((perm) => (
                    <span key={perm} className="text-xs bg-secondary px-2 py-1 rounded">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last used:{" "}
                {Math.floor((Date.now() - key.lastUsed) / (1000 * 60 * 60))} hours ago
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook Events
          </h2>
          <Button onClick={handleSubscribeWebhook}>
            <Plus className="h-3 w-3 mr-1" />
            Subscribe
          </Button>
        </div>

        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-mono">{webhook.event}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{webhook.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    webhook.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {webhook.status}
                </span>
              </div>

              <div className="mb-3 p-2 bg-secondary rounded font-mono text-xs">
                <p className="text-muted-foreground mb-1">Payload:</p>
                <p>{webhook.payload}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Retry Policy: {webhook.retryPolicy}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Webhook Deliveries
        </h2>

        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{delivery.event}</h4>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {delivery.endpoint}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    delivery.status === "success"
                      ? "bg-green-500/20 text-green-600"
                      : delivery.status === "pending"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {delivery.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - delivery.timestamp) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status Code</p>
                  <p className="font-semibold">{delivery.statusCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{delivery.duration}ms</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Integration Guide
        </h2>

        <div className="space-y-3 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-1">SIEM Integration</p>
            <p className="text-xs text-muted-foreground">
              Use the /api/v1/metrics/incidents endpoint to pull incident data into your SIEM
              platform. Authenticate with API key and configure webhook for real-time updates.
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-1">Third-Party Analytics</p>
            <p className="text-xs text-muted-foreground">
              Subscribe to security.score.updated webhook to receive real-time security score
              changes for your analytics dashboard.
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-1">Ticketing System</p>
            <p className="text-xs text-muted-foreground">
              Configure incident.created webhook to automatically create tickets in your ticketing
              system when new security incidents are detected.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
