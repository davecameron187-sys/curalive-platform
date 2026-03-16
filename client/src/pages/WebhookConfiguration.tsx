/**
 * Webhook Configuration UI
 * Manage webhook endpoints, API keys, and test deliveries
 */
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Send,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function WebhookConfiguration() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<number | null>(null);

  // Form state for new endpoint
  const [newEndpoint, setNewEndpoint] = useState({
    name: "",
    url: "",
    integrationType: "custom" as const,
    apiKey: "",
    maxRetries: 3,
    backoffMs: 1000,
  });

  // Mock data - in real app would come from tRPC
  const [endpoints, setEndpoints] = useState([
    {
      id: 1,
      name: "PagerDuty Integration",
      url: "https://events.pagerduty.com/v2/enqueue",
      integrationType: "pagerduty",
      apiKey: "****-****-****-****",
      enabled: true,
      lastDelivery: new Date(Date.now() - 3600000),
      successRate: 98.5,
    },
    {
      id: 2,
      name: "Opsgenie Integration",
      url: "https://api.opsgenie.com/v2/alerts",
      integrationType: "opsgenie",
      apiKey: "****-****-****-****",
      enabled: true,
      lastDelivery: new Date(Date.now() - 7200000),
      successRate: 99.2,
    },
  ]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only administrators can access webhook configuration.
          </p>
        </Card>
      </div>
    );
  }

  const handleAddEndpoint = () => {
    const newId = Math.max(...endpoints.map((e) => e.id), 0) + 1;
    setEndpoints([
      ...endpoints,
      {
        id: newId,
        name: newEndpoint.name,
        url: newEndpoint.url,
        integrationType: newEndpoint.integrationType,
        apiKey: "****-****-****-****",
        enabled: true,
        lastDelivery: new Date(),
        successRate: 100,
      },
    ]);
    setNewEndpoint({
      name: "",
      url: "",
      integrationType: "custom",
      apiKey: "",
      maxRetries: 3,
      backoffMs: 1000,
    });
  };

  const handleTestEndpoint = async (id: number) => {
    setTestingEndpoint(id);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestingEndpoint(null);
  };

  const handleDeleteEndpoint = (id: number) => {
    setEndpoints(endpoints.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Webhook Configuration</h1>
          <p className="text-muted-foreground">
            Manage webhook endpoints and integrations
          </p>
        </div>

        {/* Add New Endpoint Dialog */}
        <div className="mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Webhook Endpoint</DialogTitle>
                <DialogDescription>
                  Configure a new webhook endpoint for alert delivery
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Endpoint Name
                  </label>
                  <Input
                    placeholder="e.g., PagerDuty Prod"
                    value={newEndpoint.name}
                    onChange={(e) =>
                      setNewEndpoint({ ...newEndpoint, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Integration Type
                  </label>
                  <Select
                    value={newEndpoint.integrationType}
                    onValueChange={(value: any) =>
                      setNewEndpoint({ ...newEndpoint, integrationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagerduty">PagerDuty</SelectItem>
                      <SelectItem value="opsgenie">Opsgenie</SelectItem>
                      <SelectItem value="custom">Custom Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Webhook URL
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newEndpoint.url}
                    onChange={(e) =>
                      setNewEndpoint({ ...newEndpoint, url: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    API Key (if required)
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newEndpoint.apiKey}
                    onChange={(e) =>
                      setNewEndpoint({ ...newEndpoint, apiKey: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Max Retries
                    </label>
                    <Input
                      type="number"
                      value={newEndpoint.maxRetries}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpoint,
                          maxRetries: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Backoff (ms)
                    </label>
                    <Input
                      type="number"
                      value={newEndpoint.backoffMs}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpoint,
                          backoffMs: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleAddEndpoint} className="w-full">
                  Create Endpoint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Endpoints List */}
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{endpoint.name}</h3>
                    <Badge variant={endpoint.enabled ? "default" : "secondary"}>
                      {endpoint.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Badge variant="outline">
                      {endpoint.integrationType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {endpoint.url}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Success Rate
                      </p>
                      <p className="text-lg font-semibold">
                        {endpoint.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Last Delivery
                      </p>
                      <p className="text-sm">
                        {endpoint.lastDelivery.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        API Key
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {showApiKey[endpoint.id]
                            ? endpoint.apiKey
                            : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowApiKey({
                              ...showApiKey,
                              [endpoint.id]: !showApiKey[endpoint.id],
                            })
                          }
                        >
                          {showApiKey[endpoint.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestEndpoint(endpoint.id)}
                    disabled={testingEndpoint === endpoint.id}
                  >
                    {testingEndpoint === endpoint.id ? (
                      <>
                        <span className="animate-spin mr-2">⌛</span>
                        Testing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Test
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {testingEndpoint === endpoint.id && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">
                    Test successful - webhook responded with 200 OK
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Configuration Tips */}
        <Card className="p-6 mt-8 bg-secondary/50">
          <div className="flex gap-3">
            <Settings className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Configuration Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Test your webhook endpoints before enabling them in
                  production
                </li>
                <li>
                  • Store API keys securely and rotate them regularly
                </li>
                <li>
                  • Monitor success rates and adjust retry policies as needed
                </li>
                <li>
                  • Use different endpoints for development and production
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
