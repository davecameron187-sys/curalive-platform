/**
 * Alert Escalation Service
 * Round 64 Features
 */
import { notifyOwner } from "@/server/_core/notification";
import * as alertDb from "@/server/db.round64";

interface EscalationStep {
  level: number;
  delay: number; // milliseconds
  notificationChannels: ("email" | "sms" | "push" | "webhook")[];
  recipients: {
    email?: string[];
    phone?: string[];
    webhookUrl?: string;
  };
  message: string;
}

interface EscalationContext {
  alertId: number;
  ruleId: number;
  kioskId: string;
  eventId: string;
  severity: string;
  anomalyType: string;
  currentValue: number;
  threshold: number;
}

export class AlertEscalationService {
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Trigger escalation workflow for an alert
   */
  async triggerEscalation(context: EscalationContext) {
    const key = `${context.ruleId}-${context.alertId}`;

    // Cancel any existing escalation for this alert
    if (this.escalationTimers.has(key)) {
      clearTimeout(this.escalationTimers.get(key)!);
    }

    // Start escalation workflow
    await this.executeEscalationSteps(context);
  }

  /**
   * Execute escalation steps with delays
   */
  private async executeEscalationSteps(context: EscalationContext) {
    const rule = await alertDb.triggerEscalation(context.ruleId, context.alertId, 0);

    if (!rule) return;

    const steps: EscalationStep[] = Array.isArray(rule) ? rule : [rule];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const key = `${context.ruleId}-${context.alertId}-${i}`;

      // Schedule next step with delay
      const timer = setTimeout(async () => {
        await this.executeEscalationStep(context, step, i);

        // Schedule next step if available
        if (i + 1 < steps.length) {
          const nextStep = steps[i + 1];
          const nextKey = `${context.ruleId}-${context.alertId}-${i + 1}`;
          const nextTimer = setTimeout(
            () =>
              this.executeEscalationStep(context, nextStep, i + 1),
            nextStep.delay
          );
          this.escalationTimers.set(nextKey, nextTimer);
        }
      }, step.delay);

      this.escalationTimers.set(key, timer);
    }
  }

  /**
   * Execute a single escalation step
   */
  private async executeEscalationStep(
    context: EscalationContext,
    step: EscalationStep,
    stepIndex: number
  ) {
    const notifications: Promise<any>[] = [];

    // Email notifications
    if (
      step.notificationChannels.includes("email") &&
      step.recipients.email?.length
    ) {
      notifications.push(
        this.sendEmailNotification(context, step, stepIndex)
      );
    }

    // SMS notifications
    if (
      step.notificationChannels.includes("sms") &&
      step.recipients.phone?.length
    ) {
      notifications.push(this.sendSmsNotification(context, step, stepIndex));
    }

    // Push notifications
    if (step.notificationChannels.includes("push")) {
      notifications.push(this.sendPushNotification(context, step, stepIndex));
    }

    // Webhook notifications
    if (
      step.notificationChannels.includes("webhook") &&
      step.recipients.webhookUrl
    ) {
      notifications.push(
        this.sendWebhookNotification(context, step, stepIndex)
      );
    }

    // Owner notification
    notifications.push(
      notifyOwner({
        title: `Alert Escalation Level ${stepIndex + 1}: ${context.anomalyType}`,
        content: `Kiosk ${context.kioskId} - ${step.message}`,
      })
    );

    await Promise.all(notifications);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    context: EscalationContext,
    step: EscalationStep,
    stepIndex: number
  ) {
    const recipients = step.recipients.email || [];

    for (const email of recipients) {
      try {
        // Use Resend API (preconfigured in environment)
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "alerts@chorus.ai",
            to: email,
            subject: `Alert Escalation Level ${stepIndex + 1}: ${context.anomalyType}`,
            html: `
              <h2>Alert Escalation</h2>
              <p><strong>Kiosk:</strong> ${context.kioskId}</p>
              <p><strong>Event:</strong> ${context.eventId}</p>
              <p><strong>Severity:</strong> ${context.severity}</p>
              <p><strong>Anomaly:</strong> ${context.anomalyType}</p>
              <p><strong>Current Value:</strong> ${context.currentValue}</p>
              <p><strong>Threshold:</strong> ${context.threshold}</p>
              <p><strong>Message:</strong> ${step.message}</p>
              <p><strong>Escalation Level:</strong> ${stepIndex + 1}</p>
            `,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to send email to ${email}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
      }
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    context: EscalationContext,
    step: EscalationStep,
    stepIndex: number
  ) {
    const recipients = step.recipients.phone || [];

    for (const phone of recipients) {
      try {
        // Use Twilio API (preconfigured in environment)
        const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/{{TWILIO_ACCOUNT_SID}}/Messages.json", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_CALLER_ID || "+1234567890",
            To: phone,
            Body: `Alert Escalation L${stepIndex + 1}: ${context.anomalyType} on ${context.kioskId}. ${step.message}`,
          }).toString(),
        });

        if (!response.ok) {
          console.error(`Failed to send SMS to ${phone}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error sending SMS to ${phone}:`, error);
      }
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    context: EscalationContext,
    step: EscalationStep,
    stepIndex: number
  ) {
    // Implementation would use a push notification service
    console.log(`Push notification - Level ${stepIndex + 1}: ${step.message}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    context: EscalationContext,
    step: EscalationStep,
    stepIndex: number
  ) {
    const webhookUrl = step.recipients.webhookUrl;
    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalationLevel: stepIndex + 1,
          alertId: context.alertId,
          kioskId: context.kioskId,
          eventId: context.eventId,
          severity: context.severity,
          anomalyType: context.anomalyType,
          currentValue: context.currentValue,
          threshold: context.threshold,
          message: step.message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error(`Webhook failed:`, await response.text());
      }
    } catch (error) {
      console.error(`Error sending webhook notification:`, error);
    }
  }

  /**
   * Cancel escalation
   */
  cancelEscalation(ruleId: number, alertId: number) {
    const key = `${ruleId}-${alertId}`;
    if (this.escalationTimers.has(key)) {
      clearTimeout(this.escalationTimers.get(key)!);
      this.escalationTimers.delete(key);
    }
  }
}

export const escalationService = new AlertEscalationService();
