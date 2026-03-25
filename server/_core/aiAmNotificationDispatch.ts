// @ts-nocheck
import { Resend } from "resend";
import twilio from "twilio";
import { db } from "@/server/db";
import { alertHistory, alertPreferences } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auditTrail } from "./aiAmAuditTrail";

// Initialize clients
const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export interface NotificationPayload {
  eventId: string;
  operatorId: string;
  violationId: string;
  violationType: string;
  severity: "low" | "medium" | "high" | "critical";
  speaker: string;
  transcript: string;
  timestamp: number;
}

export interface NotificationResult {
  success: boolean;
  channel: "email" | "sms" | "inApp";
  messageId?: string;
  error?: string;
}

class NotificationDispatcher {
  /**
   * Dispatch notification based on operator preferences
   */
  async dispatchNotification(payload: NotificationPayload): Promise<NotificationResult[]> {
    // Get operator preferences
    const preferences = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.operatorId, payload.operatorId))
      .limit(1);

    if (!preferences || preferences.length === 0) {
      return [];
    }

    const prefs = preferences[0];
    const results: NotificationResult[] = [];

    // Check if notification should be sent (quiet hours, critical only, etc.)
    if (!this.shouldSendNotification(prefs, payload)) {
      return [];
    }

    // Check if violation type is monitored
    const monitoredTypes = JSON.parse(prefs.monitoredViolationTypes || "[]");
    if (monitoredTypes.length > 0 && !monitoredTypes.includes(payload.violationType)) {
      return [];
    }

    // Send via email
    if (prefs.emailNotificationsEnabled && prefs.emailAddress) {
      const emailResult = await this.sendEmailNotification(payload, prefs.emailAddress);
      results.push(emailResult);
    }

    // Send via SMS
    if (prefs.smsNotificationsEnabled && prefs.phoneNumber) {
      const smsResult = await this.sendSmsNotification(payload, prefs.phoneNumber);
      results.push(smsResult);
    }

    // Send in-app notification
    if (prefs.inAppNotificationsEnabled) {
      const inAppResult = await this.sendInAppNotification(payload);
      results.push(inAppResult);
    }

    // Log notification dispatch to audit trail
    for (const result of results) {
      if (result.success) {
        await auditTrail.logAlertSent(payload.eventId, payload.operatorId, result.channel, payload.violationId);
      }
    }

    return results;
  }

  /**
   * Check if notification should be sent based on preferences and timing
   */
  private shouldSendNotification(
    prefs: any,
    payload: NotificationPayload
  ): boolean {
    // Check critical only setting
    if (prefs.criticalOnly && payload.severity !== "critical") {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHoursEnabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = prefs.quietHoursStart.split(":").map(Number);
      const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      // Handle overnight quiet hours
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime < endTime) {
          return false;
        }
      } else {
        if (currentTime >= startTime && currentTime < endTime) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Send email notification via Resend
   */
  private async sendEmailNotification(payload: NotificationPayload, email: string): Promise<NotificationResult> {
    try {
      const severityColor = {
        low: "#3b82f6",
        medium: "#f59e0b",
        high: "#ef4444",
        critical: "#7c2d12",
      }[payload.severity];

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Compliance Violation Detected</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Event: ${payload.eventId}</p>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px;">
            <h2 style="margin-top: 0; color: #1f2937;">Violation Details</h2>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${payload.violationType}</p>
              <p style="margin: 0 0 10px 0;"><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${payload.severity.toUpperCase()}</span></p>
              <p style="margin: 0 0 10px 0;"><strong>Speaker:</strong> ${payload.speaker}</p>
              <p style="margin: 0;"><strong>Time:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
            </div>

            <h3 style="color: #1f2937; margin-top: 20px;">Transcript</h3>
            <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${severityColor}; border-radius: 4px; font-family: monospace; font-size: 13px; color: #374151;">
              "${payload.transcript}"
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This is an automated alert from CuraLive's Compliance Monitoring System.
                <br />
                <a href="https://curalive.example.com/alerts/${payload.violationId}" style="color: #3b82f6; text-decoration: none;">View in Dashboard</a>
              </p>
            </div>
          </div>
        </div>
      `;

      const result = await resend.emails.send({
        from: "alerts@curalive.io",
        to: email,
        subject: `[${payload.severity.toUpperCase()}] Compliance Violation: ${payload.violationType}`,
        html,
      });

      if (result.error) {
        return {
          success: false,
          channel: "email",
          error: result.error.message,
        };
      }

      return {
        success: true,
        channel: "email",
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        channel: "email",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send SMS notification via Twilio
   */
  private async sendSmsNotification(payload: NotificationPayload, phoneNumber: string): Promise<NotificationResult> {
    try {
      const message = `CuraLive Alert: ${payload.severity.toUpperCase()} - ${payload.violationType} detected from ${payload.speaker}. View details: https://curalive.io/alerts/${payload.violationId}`;

      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_CALLER_ID,
        to: phoneNumber,
      });

      return {
        success: true,
        channel: "sms",
        messageId: result.sid,
      };
    } catch (error) {
      return {
        success: false,
        channel: "sms",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send in-app notification via Ably
   */
  private async sendInAppNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      // In production, publish to Ably channel for real-time in-app notification
      // const channel = ably.channels.get(`alerts:${payload.operatorId}`);
      // await channel.publish("violation_alert", payload);

      // Log to database for in-app notification system
      await db.insert(alertHistory).values({
        operatorId: payload.operatorId,
        eventId: payload.eventId,
        violationId: payload.violationId,
        channel: "inApp",
        status: "sent",
        sentAt: new Date(),
        details: JSON.stringify(payload),
      });

      return {
        success: true,
        channel: "inApp",
      };
    } catch (error) {
      return {
        success: false,
        channel: "inApp",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send test notification to verify configuration
   */
  async sendTestNotification(operatorId: string, channel: "email" | "sms" | "inApp"): Promise<NotificationResult> {
    const prefs = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.operatorId, operatorId))
      .limit(1);

    if (!prefs || prefs.length === 0) {
      return {
        success: false,
        channel,
        error: "Operator preferences not found",
      };
    }

    const testPayload: NotificationPayload = {
      eventId: "test-event",
      operatorId,
      violationId: "test-violation",
      violationType: "test",
      severity: "high",
      speaker: "Test Speaker",
      transcript: "This is a test notification from CuraLive.",
      timestamp: Date.now(),
    };

    switch (channel) {
      case "email":
        if (!prefs[0].emailAddress) {
          return {
            success: false,
            channel,
            error: "Email address not configured",
          };
        }
        return this.sendEmailNotification(testPayload, prefs[0].emailAddress);

      case "sms":
        if (!prefs[0].phoneNumber) {
          return {
            success: false,
            channel,
            error: "Phone number not configured",
          };
        }
        return this.sendSmsNotification(testPayload, prefs[0].phoneNumber);

      case "inApp":
        return this.sendInAppNotification(testPayload);

      default:
        return {
          success: false,
          channel,
          error: "Unknown channel",
        };
    }
  }

  /**
   * Get notification history for operator
   */
  async getNotificationHistory(operatorId: string, eventId?: string, limit = 50) {
    let query = db
      .select()
      .from(alertHistory)
      .where(eq(alertHistory.operatorId, operatorId));

    if (eventId) {
      query = query.where(and(eq(alertHistory.operatorId, operatorId), eq(alertHistory.eventId, eventId)));
    }

    const results = await query.limit(limit).orderBy((t) => t.sentAt);

    return results.map((r) => ({
      ...r,
      details: JSON.parse(r.details || "{}"),
    }));
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    return db
      .update(alertHistory)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(eq(alertHistory.id, notificationId));
  }

  /**
   * Get unread notification count for operator
   */
  async getUnreadNotificationCount(operatorId: string): Promise<number> {
    const results = await db
      .select()
      .from(alertHistory)
      .where(and(eq(alertHistory.operatorId, operatorId), eq(alertHistory.status, "sent")));

    return results.length;
  }
}

export const notificationDispatcher = new NotificationDispatcher();
