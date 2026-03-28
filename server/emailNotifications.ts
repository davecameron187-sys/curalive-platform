import { Resend } from "resend";

/**
 * Email Notification System
 * Handles event reminders, Q&A alerts, and post-event summaries
 */

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  type:
    | "event_reminder"
    | "qa_alert"
    | "post_event_summary"
    | "question_approved"
    | "question_rejected";
  recipientEmail: string;
  recipientName: string;
  eventId: string;
  eventTitle: string;
  data: Record<string, unknown>;
}

/**
 * Send event reminder email
 */
export async function sendEventReminder(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: Date,
  eventUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: "events@curalive.com",
      to: email,
      subject: `Reminder: ${eventTitle} starts soon`,
      html: `
        <h2>Event Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder that <strong>${eventTitle}</strong> is starting soon.</p>
        <p><strong>Date & Time:</strong> ${eventDate.toLocaleString()}</p>
        <p>
          <a href="${eventUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Join Event
          </a>
        </p>
        <p>See you there!</p>
      `,
    });

    console.log("[Email] Event reminder sent to", email, ":", result);
    return { success: true, messageId: result.data?.id || "" };
  } catch (error) {
    console.error("[Email] Failed to send event reminder:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send Q&A alert email
 */
export async function sendQAAlert(
  email: string,
  name: string,
  eventTitle: string,
  questionText: string,
  questionUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: "events@curalive.com",
      to: email,
      subject: `New Question: ${eventTitle}`,
      html: `
        <h2>New Question During Event</h2>
        <p>Hi ${name},</p>
        <p>A new question has been submitted during <strong>${eventTitle}</strong>:</p>
        <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 16px 0;">
          "${questionText}"
        </blockquote>
        <p>
          <a href="${questionUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Question
          </a>
        </p>
      `,
    });

    console.log("[Email] Q&A alert sent to", email, ":", result);
    return { success: true, messageId: result.data?.id || "" };
  } catch (error) {
    console.error("[Email] Failed to send Q&A alert:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send post-event summary email
 */
export async function sendPostEventSummary(
  email: string,
  name: string,
  eventTitle: string,
  summary: {
    totalAttendees: number;
    totalQuestions: number;
    averageSentiment: number;
    topSpeaker: string;
    transcriptUrl: string;
    replayUrl: string;
  }
) {
  try {
    const result = await resend.emails.send({
      from: "events@curalive.com",
      to: email,
      subject: `Event Summary: ${eventTitle}`,
      html: `
        <h2>Event Summary</h2>
        <p>Hi ${name},</p>
        <p>Thank you for attending <strong>${eventTitle}</strong>. Here's a summary of the event:</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Attendees</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${summary.totalAttendees.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Questions Asked</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${summary.totalQuestions}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Average Sentiment</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${(summary.averageSentiment * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Top Speaker</strong></td>
            <td style="padding: 10px;">${summary.topSpeaker}</td>
          </tr>
        </table>

        <p>
          <a href="${summary.transcriptUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            View Transcript
          </a>
          <a href="${summary.replayUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Watch Replay
          </a>
        </p>
      `,
    });

    console.log("[Email] Post-event summary sent to", email, ":", result);
    return { success: true, messageId: result.data?.id || "" };
  } catch (error) {
    console.error("[Email] Failed to send post-event summary:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send question approved notification
 */
export async function sendQuestionApprovedEmail(
  email: string,
  name: string,
  eventTitle: string,
  questionText: string
) {
  try {
    const result = await resend.emails.send({
      from: "events@curalive.com",
      to: email,
      subject: `Your Question Was Approved - ${eventTitle}`,
      html: `
        <h2>Question Approved</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your question has been approved for <strong>${eventTitle}</strong>:</p>
        <blockquote style="border-left: 4px solid #22c55e; padding-left: 16px; margin: 16px 0;">
          "${questionText}"
        </blockquote>
        <p>Your question will be presented to the speakers during the event.</p>
      `,
    });

    console.log("[Email] Question approved notification sent to", email, ":", result);
    return { success: true, messageId: result.data?.id || "" };
  } catch (error) {
    console.error("[Email] Failed to send question approved email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send question rejected notification
 */
export async function sendQuestionRejectedEmail(
  email: string,
  name: string,
  eventTitle: string,
  questionText: string,
  reason: string
) {
  try {
    const result = await resend.emails.send({
      from: "events@curalive.com",
      to: email,
      subject: `Question Not Approved - ${eventTitle}`,
      html: `
        <h2>Question Not Approved</h2>
        <p>Hi ${name},</p>
        <p>Thank you for submitting a question for <strong>${eventTitle}</strong>. Unfortunately, it was not approved for the following reason:</p>
        <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 16px 0;">
          "${questionText}"
        </blockquote>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Feel free to submit another question if you have one!</p>
      `,
    });

    console.log("[Email] Question rejected notification sent to", email, ":", result);
    return { success: true, messageId: result.data?.id || "" };
  } catch (error) {
    console.error("[Email] Failed to send question rejected email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmails(
  recipients: Array<{ email: string; name: string }>,
  template: EmailTemplate
) {
  const results = [];

  for (const recipient of recipients) {
    let result;

    switch (template.type) {
      case "event_reminder":
        result = await sendEventReminder(
          recipient.email,
          recipient.name,
          template.eventTitle,
          template.data.eventDate as Date,
          template.data.eventUrl as string
        );
        break;

      case "qa_alert":
        result = await sendQAAlert(
          recipient.email,
          recipient.name,
          template.eventTitle,
          template.data.questionText as string,
          template.data.questionUrl as string
        );
        break;

      case "post_event_summary":
        result = await sendPostEventSummary(
          recipient.email,
          recipient.name,
          template.eventTitle,
          template.data.summary as Parameters<typeof sendPostEventSummary>[3]
        );
        break;

      case "question_approved":
        result = await sendQuestionApprovedEmail(
          recipient.email,
          recipient.name,
          template.eventTitle,
          template.data.questionText as string
        );
        break;

      case "question_rejected":
        result = await sendQuestionRejectedEmail(
          recipient.email,
          recipient.name,
          template.eventTitle,
          template.data.questionText as string,
          template.data.reason as string
        );
        break;

      default:
        result = { success: false, error: "Unknown template type" };
    }

    results.push({ email: recipient.email, ...result });
  }

  return results;
}

export default {
  sendEventReminder,
  sendQAAlert,
  sendPostEventSummary,
  sendQuestionApprovedEmail,
  sendQuestionRejectedEmail,
  sendBulkEmails,
};
