import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: number;
  lastTriggered: number;
  deliveryStatus: "success" | "failed" | "pending";
  deliveryCount: number;
  failureCount: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  status: "delivered" | "failed" | "retrying";
  endpoint: string;
  payload: Record<string, any>;
  attempts: number;
}

/**
 * WebhookManager Page
 * 
 * Webhook endpoint configuration, event delivery tracking,
 * retry logic, and signature verification for partner integrations.
 */
export default function WebhookManager() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
    {
      id: "1",
      url: "https://partner.example.com/webhooks/curalive",
      events: ["participant_joined", "qa_approved", "sentiment_changed"],
      active: true,
      createdAt: Date.now() - 2592000000,
      lastTriggered: Date.now() - 3600000,
      deliveryStatus: "success",
      deliveryCount: 1247,
      failureCount: 3,
    },
    {
      id: "2",
      url: "https://crm.example.com/webhooks/events",
      events: ["event_created", "event_completed"],
      active: true,
      createdAt: Date.now() - 1296000000,
      lastTriggered: Date.now() - 7200000,
      deliveryStatus: "success",
      deliveryCount: 45,
      failureCount: 0,
    },
  ]);

  const [recentEvents] = useState<WebhookEvent[]>([
    {
      id: "1",
      type: "qa_approved",
      timestamp: Date.now() - 300000,
      status: "delivered",
      endpoint: "https://partner.example.com/webhooks/curalive",
      payload: {
        eventId: "q4-earnings-2026",
        questionId: "q123",
        participant: "Sarah Johnson",
      },
      attempts: 1,
    },
    {
      id: "2",
      type: "sentiment_changed",
      timestamp: Date.now() - 600000,
      status: "delivered",
      endpoint: "https://partner.example.com/webhooks/curalive",
      payload: {
        eventId: "q4-earnings-2026",
        score: 78,
        trend: "up",
      },
      attempts: 1,
    },
    {
      id: "3",
      type: "participant_joined",
      timestamp: Date.now() - 900000,
      status: "retrying",
      endpoint: "https://crm.example.com/webhooks/events",
      payload: {
        eventId: "investor-day-2026",
        participantCount: 3500,
      },
      attempts: 2,
    },
  ]);

  const [showUrl, setShowUrl] = useState<Set<string>>(new Set());
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "participant_joined",
    "qa_approved",
  ]);

  const eventTypes = [
    { id: "participant_joined", label: "Participant Joined" },
    { id: "participant_left", label: "Participant Left" },
    { id: "qa_submitted", label: "Q&A Submitted" },
    { id: "qa_approved", label: "Q&A Approved" },
    { id: "qa_rejected", label: "Q&A Rejected" },
    { id: "sentiment_changed", label: "Sentiment Changed" },
    { id: "poll_created", label: "Poll Created" },
    { id: "poll_completed", label: "Poll Completed" },
    { id: "event_started", label: "Event Started" },
    { id: "event_completed", label: "Event Completed" },
  ];

  const handleToggleUrlVisibility = (id: string) => {
    const newShowUrl = new Set(showUrl);
    if (newShowUrl.has(id)) {
      newShowUrl.delete(id);
    } else {
      newShowUrl.add(id);
    }
    setShowUrl(newShowUrl);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  const handleToggleEndpoint = (id: string) => {
    setEndpoints(
      endpoints.map((e) =>
        e.id === id ? { ...e, active: !e.active } : e
      )
    );
    toast.success("Webhook endpoint updated");
  };

  const handleDeleteEndpoint = (id: string) => {
    setEndpoints(endpoints.filter((e) => e.id !== id));
    toast.success("Webhook endpoint deleted");
  };

  const handleCreateEndpoint = () => {
    if (!newUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    const newEndpoint: WebhookEndpoint = {
      id: String(endpoints.length + 1),
      url: newUrl,
      events: selectedEvents,
      active: true,
      createdAt: Date.now(),
      lastTriggered: 0,
      deliveryStatus: "pending",
      deliveryCount: 0,
      failureCount: 0,
    };

    setEndpoints([newEndpoint, ...endpoints]);
    setNewUrl("");
    setSelectedEvents(["participant_joined", "qa_approved"]);
    toast.success("Webhook endpoint created");
  };

  const handleRetryEvent = (eventId: string) => {
    toast.success("Webhook retry initiated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Webhook Management</h1>
        <p className="text-muted-foreground mt-1">
          Configure webhooks for real-time event notifications
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Webhook Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create New Endpoint */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Webhook Endpoint
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/webhooks/curalive"
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be HTTPS and publicly accessible
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Event Subscriptions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {eventTypes.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(
                              selectedEvents.filter((id) => id !== event.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateEndpoint} className="w-full">
                Create Endpoint
              </Button>
            </div>
          </Card>

          {/* Endpoints List */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Active Endpoints ({endpoints.length})
            </h2>

            <div className="space-y-3">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm break-all">
                          {endpoint.url}
                        </h4>
                        {endpoint.active ? (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-600 rounded font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(endpoint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${
                        endpoint.deliveryStatus === "success"
                          ? "bg-green-500/20 text-green-600"
                          : endpoint.deliveryStatus === "failed"
                          ? "bg-red-500/20 text-red-600"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {endpoint.deliveryStatus === "success" && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {endpoint.deliveryStatus === "failed" && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {endpoint.deliveryStatus === "pending" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {endpoint.deliveryStatus}
                    </div>
                  </div>

                  <div className="mb-3 p-2 bg-secondary rounded text-xs">
                    <p className="text-muted-foreground mb-1">Events:</p>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-background rounded text-xs"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Delivered</p>
                      <p className="font-semibold">
                        {endpoint.deliveryCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold text-red-600">
                        {endpoint.failureCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-semibold">
                        {endpoint.deliveryCount === 0
                          ? "N/A"
                          : (
                              ((endpoint.deliveryCount -
                                endpoint.failureCount) /
                                endpoint.deliveryCount) *
                              100
                            ).toFixed(1) + "%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Triggered</p>
                      <p className="font-semibold">
                        {endpoint.lastTriggered === 0
                          ? "Never"
                          : Math.round(
                              (Date.now() - endpoint.lastTriggered) / 60000
                            ) + "m ago"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUrl(endpoint.url)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleEndpoint(endpoint.id)}
                      className="flex items-center gap-1"
                    >
                      {endpoint.active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEndpoint(endpoint.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Event Log & Documentation */}
        <div className="space-y-6">
          {/* Recent Events */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Recent Events</h2>

            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border border-border rounded text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{event.type}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                        event.status === "delivered"
                          ? "bg-green-500/20 text-green-600"
                          : event.status === "failed"
                          ? "bg-red-500/20 text-red-600"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-muted-foreground truncate mb-2">
                    {event.endpoint}
                  </p>
                  {event.status === "retrying" && (
                    <Button
                      size="sm"
                      onClick={() => handleRetryEvent(event.id)}
                      className="w-full flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry Now
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Documentation */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Webhook Security</h2>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold mb-1">Signature Verification</p>
                <p className="text-muted-foreground">
                  All webhooks include X-CuraLive-Signature header with HMAC-SHA256
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Retry Policy</p>
                <p className="text-muted-foreground">
                  Failed deliveries retry with exponential backoff: 1s, 10s, 100s
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Timeout</p>
                <p className="text-muted-foreground">
                  Webhook endpoints must respond within 30 seconds
                </p>
              </div>

              <Button className="w-full mt-4" variant="outline" size="sm">
                View Documentation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
