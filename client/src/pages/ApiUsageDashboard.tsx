import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Zap,
  Settings,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  tier: "free" | "pro" | "enterprise";
  rateLimit: number;
  callsUsed: number;
  createdAt: number;
  lastUsed: number;
}

interface UsageMetric {
  timestamp: number;
  calls: number;
  errors: number;
  avgLatency: number;
}

/**
 * ApiUsageDashboard Page
 * 
 * API usage analytics, rate limiting, quota management,
 * and billing integration for partner APIs.
 */
export default function ApiUsageDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production API Key",
      key: "sk_live_abc123def456",
      tier: "enterprise",
      rateLimit: 10000,
      callsUsed: 7234,
      createdAt: Date.now() - 2592000000,
      lastUsed: Date.now() - 3600000,
    },
    {
      id: "2",
      name: "Development API Key",
      key: "sk_test_xyz789uvw012",
      tier: "pro",
      rateLimit: 1000,
      callsUsed: 456,
      createdAt: Date.now() - 1296000000,
      lastUsed: Date.now() - 7200000,
    },
  ]);

  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [selectedTier, setSelectedTier] = useState<"free" | "pro" | "enterprise">(
    "pro"
  );

  const [usageData] = useState<UsageMetric[]>([
    { timestamp: Date.now() - 3600000, calls: 450, errors: 2, avgLatency: 145 },
    { timestamp: Date.now() - 2700000, calls: 520, errors: 1, avgLatency: 152 },
    { timestamp: Date.now() - 1800000, calls: 380, errors: 3, avgLatency: 168 },
    { timestamp: Date.now() - 900000, calls: 610, errors: 0, avgLatency: 138 },
    { timestamp: Date.now(), calls: 520, errors: 2, avgLatency: 155 },
  ]);

  const rateLimits = {
    free: { calls: 100, price: 0 },
    pro: { calls: 1000, price: 99 },
    enterprise: { calls: 10000, price: 999 },
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied");
  };

  const handleToggleKeyVisibility = (id: string) => {
    const newShowKeys = new Set(showKeys);
    if (newShowKeys.has(id)) {
      newShowKeys.delete(id);
    } else {
      newShowKeys.add(id);
    }
    setShowKeys(newShowKeys);
  };

  const handleRegenerateKey = (id: string) => {
    toast.success("API key regenerated");
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast.success("API key deleted");
  };

  const handleCreateKey = () => {
    const newKey: ApiKey = {
      id: String(apiKeys.length + 1),
      name: `API Key ${new Date().toLocaleDateString()}`,
      key: `sk_${selectedTier}_${Math.random().toString(36).substring(7)}`,
      tier: selectedTier,
      rateLimit: rateLimits[selectedTier].calls,
      callsUsed: 0,
      createdAt: Date.now(),
      lastUsed: 0,
    };

    setApiKeys([newKey, ...apiKeys]);
    toast.success("API key created");
  };

  const totalCalls = usageData.reduce((sum, d) => sum + d.calls, 0);
  const totalErrors = usageData.reduce((sum, d) => sum + d.errors, 0);
  const avgLatency = Math.round(
    usageData.reduce((sum, d) => sum + d.avgLatency, 0) / usageData.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Usage & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor API calls, manage rate limits, and track quota usage
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Calls (24h)</p>
          <p className="text-3xl font-bold">{totalCalls.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from yesterday</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Errors (24h)</p>
          <p className="text-3xl font-bold text-red-600">{totalErrors}</p>
          <p className="text-xs text-red-600 mt-1">0.02% error rate</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Latency</p>
          <p className="text-3xl font-bold">{avgLatency}ms</p>
          <p className="text-xs text-green-600 mt-1">↓ 8% improvement</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
          <p className="text-3xl font-bold">99.98%</p>
          <p className="text-xs text-green-600 mt-1">All systems operational</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* API Keys & Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create New Key */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Create New API Key
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Subscription Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["free", "pro", "enterprise"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-3 border rounded text-sm font-medium transition-colors ${
                        selectedTier === tier
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <div className="font-semibold capitalize">{tier}</div>
                      <div className="text-xs opacity-75">
                        {rateLimits[tier].calls.toLocaleString()} calls/mo
                      </div>
                      <div className="text-xs opacity-75">
                        ${rateLimits[tier].price}/mo
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateKey} className="w-full">
                Create API Key
              </Button>
            </div>
          </Card>

          {/* API Keys List */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active API Keys
            </h2>

            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{apiKey.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-secondary rounded font-semibold capitalize">
                      {apiKey.tier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 p-2 bg-secondary rounded">
                    <code className="text-xs font-mono flex-1">
                      {showKeys.has(apiKey.id)
                        ? apiKey.key
                        : apiKey.key.substring(0, 10) + "••••••••••"}
                    </code>
                    <button
                      onClick={() => handleToggleKeyVisibility(apiKey.id)}
                      className="p-1 hover:bg-background rounded"
                    >
                      {showKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Rate Limit</p>
                      <p className="font-semibold">
                        {apiKey.rateLimit.toLocaleString()} calls/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Used</p>
                      <p className="font-semibold">
                        {apiKey.callsUsed.toLocaleString()} (
                        {Math.round(
                          (apiKey.callsUsed / apiKey.rateLimit) * 100
                        )}
                        %)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p className="font-semibold">
                        {apiKey.lastUsed === 0
                          ? "Never"
                          : Math.round(
                              (Date.now() - apiKey.lastUsed) / 3600000
                            ) + "h ago"}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2 mb-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (apiKey.callsUsed / apiKey.rateLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegenerateKey(apiKey.id)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Usage Chart & Quota */}
        <div className="space-y-6">
          {/* Usage Trend */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Usage Trend (24h)</h2>

            <div className="h-40 flex items-end justify-around gap-1">
              {usageData.map((metric, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{
                      height: `${(metric.calls / 700) * 100}%`,
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(metric.timestamp).getHours()}h
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quota Status */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Monthly Quota</h2>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Production Key</p>
                  <p className="text-sm font-semibold">7,234 / 10,000</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "72.34%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Development Key</p>
                  <p className="text-sm font-semibold">456 / 1,000</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "45.6%" }}
                  />
                </div>
              </div>
            </div>

            <Button className="w-full mt-4">Upgrade Plan</Button>
          </Card>

          {/* Alerts */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </h2>

            <div className="space-y-2 text-sm">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="font-medium text-yellow-600">
                  Approaching quota limit
                </p>
                <p className="text-xs text-yellow-600">
                  Production key at 72% usage
                </p>
              </div>

              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                <p className="font-medium text-green-600">All systems normal</p>
                <p className="text-xs text-green-600">Error rate: 0.02%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
