import { notifyOwner } from "./notification";
import { invokeLLM } from "./llm";

/**
 * AI-AM Notification Service
 * Handles email and SMS notifications for compliance violations
 */

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  notifyOnSeverity: ("low" | "medium" | "high" | "critical")[];
  notifyOnTypes: string[];
  quietHoursStart?: number; // 24-hour format (0-23)
  quietHoursEnd?: number;
  timezone?: string;
}

export interface AlertNotification {
  violationId: number;
  eventId: string;
  violationType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidenceScore: number;
  speakerName?: string;
  transcriptExcerpt: string;
  detectedAt: Date;
}

/**
 * Check if notification should be sent based on preferences
 */
export function shouldNotify(
  alert: AlertNotification,
  preferences: NotificationPreferences
): boolean {
  // Check severity filter
  if (!preferences.notifyOnSeverity.includes(alert.severity)) {
    return false;
  }

  // Check violation type filter
  if (preferences.notifyOnTypes.length > 0 && !preferences.notifyOnTypes.includes(alert.violationType)) {
    return false;
  }

  // Check quiet hours
  if (preferences.quietHoursStart !== undefined && preferences.quietHoursEnd !== undefined) {
    const now = new Date();
    const currentHour = now.getHours();

    if (preferences.quietHoursStart < preferences.quietHoursEnd) {
      // Normal case: 9 AM to 5 PM
      if (currentHour >= preferences.quietHoursStart && currentHour < preferences.quietHoursEnd) {
        return false;
      }
    } else {
      // Overnight case: 10 PM to 6 AM
      if (currentHour >= preferences.quietHoursStart || currentHour < preferences.quietHoursEnd) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generate email notification content
 */
export async function generateEmailContent(
  alert: AlertNotification,
  preferences: NotificationPreferences
): Promise<{ subject: string; body: string }> {
  const severityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "⚡",
    low: "ℹ️",
  };

  // Keep violationType in its raw form (with underscores) so callers can reliably match it.
  const subject = `${severityEmoji[alert.severity]} Compliance Alert: ${alert.violationType}`;

  const body = `
Compliance Violation Detected

Severity: ${alert.severity.toUpperCase()}
Type: ${alert.violationType.replace(/_/g, " ")}
Confidence: ${(alert.confidenceScore * 100).toFixed(0)}%
Detected: ${alert.detectedAt.toLocaleString()}

Speaker: ${alert.speakerName || "Unknown"}

Excerpt:
"${alert.transcriptExcerpt}"

Event ID: ${alert.eventId}
Violation ID: ${alert.violationId}

Please review this violation in the Compliance Alert Dashboard.

---
This is an automated notification from CuraLive AI-AM.
  `.trim();

  return { subject, body };
}

/**
 * Generate SMS notification content
 */
export function generateSmsContent(alert: AlertNotification): string {
  const typeShort = alert.violationType.substring(0, 3).toUpperCase();
  const confidence = (alert.confidenceScore * 100).toFixed(0);

  return `CuraLive Alert: ${alert.severity.toUpperCase()} ${typeShort} (${confidence}% confidence) - "${alert.transcriptExcerpt.substring(0, 50)}..." - Event: ${alert.eventId}`;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  alert: AlertNotification,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.emailEnabled || !preferences.emailAddress) {
    console.log("[AI-AM Notifications] Email disabled or no email address");
    return false;
  }

  try {
    const { subject, body } = await generateEmailContent(alert, preferences);

    // Use Resend API (configured in environment)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "alerts@curalive.com",
        to: preferences.emailAddress,
        subject,
        html: `<pre>${body}</pre>`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    console.log("[AI-AM Notifications] Email sent successfully:", {
      to: preferences.emailAddress,
      subject,
    });

    return true;
  } catch (error) {
    console.error("[AI-AM Notifications] Error sending email:", error);
    return false;
  }
}

/**
 * Send SMS notification
 */
export async function sendSmsNotification(
  alert: AlertNotification,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!preferences.smsEnabled || !preferences.phoneNumber) {
    console.log("[AI-AM Notifications] SMS disabled or no phone number");
    return false;
  }

  try {
    const message = generateSmsContent(alert);

    // Use Twilio API (configured in environment)
    const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_CALLER_ID || "+1234567890",
        To: preferences.phoneNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }

    console.log("[AI-AM Notifications] SMS sent successfully:", {
      to: preferences.phoneNumber,
      messageLength: message.length,
    });

    return true;
  } catch (error) {
    console.error("[AI-AM Notifications] Error sending SMS:", error);
    return false;
  }
}

/**
 * Send in-app notification (via Ably)
 */
export async function sendInAppNotification(
  alert: AlertNotification,
  userId: number
): Promise<boolean> {
  try {
    // Use notification API
    const notified = await notifyOwner({
      title: `${alert.severity.toUpperCase()} Compliance Alert`,
      content: `${alert.violationType.replace(/_/g, " ")} detected: "${alert.transcriptExcerpt.substring(0, 100)}..."`,
    });

    console.log("[AI-AM Notifications] In-app notification sent:", { userId, notified });
    return notified;
  } catch (error) {
    console.error("[AI-AM Notifications] Error sending in-app notification:", error);
    return false;
  }
}

/**
 * Send all notifications for an alert
 */
export async function notifyOperator(
  alert: AlertNotification,
  preferences: NotificationPreferences,
  userId: number
): Promise<{
  email: boolean;
  sms: boolean;
  inApp: boolean;
}> {
  // Check if notification should be sent
  if (!shouldNotify(alert, preferences)) {
    console.log("[AI-AM Notifications] Notification skipped based on preferences");
    return { email: false, sms: false, inApp: false };
  }

  console.log("[AI-AM Notifications] Sending notifications for violation:", {
    violationId: alert.violationId,
    severity: alert.severity,
  });

  // Send notifications in parallel
  const [emailSent, smsSent, inAppSent] = await Promise.all([
    sendEmailNotification(alert, preferences),
    sendSmsNotification(alert, preferences),
    sendInAppNotification(alert, userId),
  ]);

  return { email: emailSent, sms: smsSent, inApp: inAppSent };
}

/**
 * Generate daily compliance report
 */
export async function generateDailyReport(
  eventId: string,
  violations: any[],
  preferences: NotificationPreferences
): Promise<string> {
  const summary = {
    total: violations.length,
    bySeverity: {
      critical: violations.filter((v) => v.severity === "critical").length,
      high: violations.filter((v) => v.severity === "high").length,
      medium: violations.filter((v) => v.severity === "medium").length,
      low: violations.filter((v) => v.severity === "low").length,
    },
    byType: {} as Record<string, number>,
    topSpeakers: {} as Record<string, number>,
  };

  // Count by type
  violations.forEach((v) => {
    summary.byType[v.violationType] = (summary.byType[v.violationType] || 0) + 1;
    summary.topSpeakers[v.speakerName || "Unknown"] = (summary.topSpeakers[v.speakerName || "Unknown"] || 0) + 1;
  });

  const report = `
Compliance Report - ${new Date().toLocaleDateString()}

Event: ${eventId}

Summary:
- Total Violations: ${summary.total}
- Critical: ${summary.bySeverity.critical}
- High: ${summary.bySeverity.high}
- Medium: ${summary.bySeverity.medium}
- Low: ${summary.bySeverity.low}

By Type:
${Object.entries(summary.byType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n")}

Top Speakers:
${Object.entries(summary.topSpeakers)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([speaker, count]) => `- ${speaker}: ${count}`)
  .join("\n")}

---
Generated by CuraLive AI-AM
  `.trim();

  return report;
}

/**
 * Send batch notifications (e.g., daily digest)
 */
export async function sendBatchNotifications(
  alerts: AlertNotification[],
  preferences: NotificationPreferences,
  userId: number
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const alert of alerts) {
    const result = await notifyOperator(alert, preferences, userId);
    if (result.email || result.sms || result.inApp) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log("[AI-AM Notifications] Batch notifications complete:", { sent, failed });
  return { sent, failed };
}
