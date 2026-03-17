/**
 * Webhook Event Streaming Service
 * Integration with PagerDuty, Opsgenie, and custom webhooks
 */
import axios, { AxiosError } from "axios";

export interface WebhookEvent {
  id: string;
  type: "escalation" | "correlation" | "prediction" | "resolution";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  kioskId?: string;
  eventId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  integrationType: "pagerduty" | "opsgenie" | "custom";
  apiKey?: string;
  enabled: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WebhookDelivery {
  id: string;
  eventId: string;
  endpointId: number;
  status: "pending" | "delivered" | "failed" | "dead_letter";
  attempts: number;
  lastError?: string;
  nextRetryAt?: Date;
  deliveredAt?: Date;
}

export class WebhookEventStreamingService {
  private endpoints: Map<number, WebhookEndpoint> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];
  private deadLetterQueue: WebhookDelivery[] = [];

  /**
   * Register a webhook endpoint
   */
  registerEndpoint(endpoint: WebhookEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
  }

  /**
   * Unregister a webhook endpoint
   */
  unregisterEndpoint(endpointId: number): void {
    this.endpoints.delete(endpointId);
  }

  /**
   * Get all registered endpoints
   */
  getEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Stream event to all registered endpoints
   */
  async streamEvent(event: WebhookEvent): Promise<void> {
    const endpoints = this.getEndpoints().filter((ep) => ep.enabled);

    for (const endpoint of endpoints) {
      const delivery: WebhookDelivery = {
        id: `${event.id}-${endpoint.id}`,
        eventId: event.id,
        endpointId: endpoint.id,
        status: "pending",
        attempts: 0,
      };

      this.deliveryQueue.push(delivery);
      await this.deliverEvent(event, endpoint, delivery);
    }
  }

  /**
   * Deliver event to a specific endpoint
   */
  private async deliverEvent(
    event: WebhookEvent,
    endpoint: WebhookEndpoint,
    delivery: WebhookDelivery
  ): Promise<void> {
    const payload = this.formatPayload(event, endpoint.integrationType);

    try {
      const response = await axios.post(endpoint.url, payload, {
        headers: this.getHeaders(endpoint),
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        delivery.status = "delivered";
        delivery.deliveredAt = new Date();
        this.updateDelivery(delivery);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      delivery.attempts++;
      const axiosError = error as AxiosError;
      delivery.lastError = axiosError.message || "Unknown error";

      if (delivery.attempts >= endpoint.retryPolicy.maxRetries) {
        delivery.status = "dead_letter";
        this.deadLetterQueue.push(delivery);
      } else {
        delivery.status = "pending";
        delivery.nextRetryAt = new Date(
          Date.now() +
            endpoint.retryPolicy.backoffMs * Math.pow(2, delivery.attempts - 1)
        );
        // Schedule retry
        setTimeout(() => {
          this.deliverEvent(event, endpoint, delivery);
        }, endpoint.retryPolicy.backoffMs * Math.pow(2, delivery.attempts - 1));
      }

      this.updateDelivery(delivery);
    }
  }

  /**
   * Format payload based on integration type
   */
  private formatPayload(
    event: WebhookEvent,
    integrationType: string
  ): Record<string, unknown> {
    switch (integrationType) {
      case "pagerduty":
        return this.formatPagerDutyPayload(event);
      case "opsgenie":
        return this.formatOpsgeniePayload(event);
      case "custom":
      default:
        return this.formatCustomPayload(event);
    }
  }

  /**
   * Format PagerDuty incident payload
   */
  private formatPagerDutyPayload(event: WebhookEvent): Record<string, unknown> {
    const severityMap: Record<string, string> = {
      low: "info",
      medium: "warning",
      high: "error",
      critical: "critical",
    };

    return {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: event.type === "resolution" ? "resolve" : "trigger",
      dedup_key: event.id,
      payload: {
        summary: event.title,
        severity: severityMap[event.severity],
        source: "CuraLive",
        component: event.kioskId || "unknown",
        custom_details: {
          description: event.description,
          eventId: event.eventId,
          timestamp: event.timestamp.toISOString(),
          ...event.metadata,
        },
      },
    };
  }

  /**
   * Format Opsgenie alert payload
   */
  private formatOpsgeniePayload(event: WebhookEvent): Record<string, unknown> {
    const priorityMap: Record<string, string> = {
      low: "P5",
      medium: "P3",
      high: "P2",
      critical: "P1",
    };

    return {
      message: event.title,
      description: event.description,
      priority: priorityMap[event.severity],
      source: "CuraLive",
      tags: [event.type, event.eventId, event.kioskId || ""],
      details: {
        type: event.type,
        kioskId: event.kioskId,
        eventId: event.eventId,
        timestamp: event.timestamp.toISOString(),
        ...event.metadata,
      },
      responders: [
        {
          type: "team",
          name: "On-Call Team",
        },
      ],
    };
  }

  /**
   * Format custom webhook payload
   */
  private formatCustomPayload(event: WebhookEvent): Record<string, unknown> {
    return {
      id: event.id,
      type: event.type,
      severity: event.severity,
      title: event.title,
      description: event.description,
      kioskId: event.kioskId,
      eventId: event.eventId,
      timestamp: event.timestamp.toISOString(),
      metadata: event.metadata,
    };
  }

  /**
   * Get headers for webhook request
   */
  private getHeaders(endpoint: WebhookEndpoint): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "CuraLive/1.0",
    };

    if (endpoint.integrationType === "pagerduty") {
      headers["Accept"] = "application/vnd.pagerduty+json;version=2";
    } else if (endpoint.integrationType === "opsgenie") {
      headers["Authorization"] = `GenieKey ${endpoint.apiKey}`;
    } else if (endpoint.apiKey) {
      headers["Authorization"] = `Bearer ${endpoint.apiKey}`;
    }

    return headers;
  }

  /**
   * Update delivery status
   */
  private updateDelivery(delivery: WebhookDelivery): void {
    const index = this.deliveryQueue.findIndex((d) => d.id === delivery.id);
    if (index !== -1) {
      this.deliveryQueue[index] = delivery;
    }
  }

  /**
   * Get delivery status
   */
  getDeliveryStatus(deliveryId: string): WebhookDelivery | undefined {
    return (
      this.deliveryQueue.find((d) => d.id === deliveryId) ||
      this.deadLetterQueue.find((d) => d.id === deliveryId)
    );
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): WebhookDelivery[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry dead letter message
   */
  async retryDeadLetter(deliveryId: string): Promise<void> {
    const index = this.deadLetterQueue.findIndex((d) => d.id === deliveryId);
    if (index === -1) return;

    const delivery = this.deadLetterQueue[index];
    const endpoint = this.endpoints.get(delivery.endpointId);

    if (!endpoint) return;

    // Reset delivery
    delivery.status = "pending";
    delivery.attempts = 0;
    delivery.lastError = undefined;
    delivery.nextRetryAt = undefined;

    this.deadLetterQueue.splice(index, 1);
    this.deliveryQueue.push(delivery);

    // Note: Would need to retrieve the original event to retry
    // This is a simplified implementation
  }

  /**
   * Get delivery statistics
   */
  getStatistics(): {
    totalDeliveries: number;
    delivered: number;
    failed: number;
    pending: number;
    deadLetterCount: number;
  } {
    return {
      totalDeliveries: this.deliveryQueue.length + this.deadLetterQueue.length,
      delivered: this.deliveryQueue.filter((d) => d.status === "delivered")
        .length,
      failed: this.deliveryQueue.filter((d) => d.status === "failed").length,
      pending: this.deliveryQueue.filter((d) => d.status === "pending").length,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }
}

// Singleton instance
let instance: WebhookEventStreamingService | null = null;

export function getWebhookService(): WebhookEventStreamingService {
  if (!instance) {
    instance = new WebhookEventStreamingService();
  }
  return instance;
}
