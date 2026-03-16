/**
 * Email Templates for CuraLive
 * 
 * Provides HTML email templates for various notifications:
 * - Event reminders
 * - Post-event summaries
 * - Compliance alerts
 * - User role changes
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Event Reminder Email
 */
export function eventReminderEmail(data: {
  recipientName: string;
  eventTitle: string;
  eventTime: string;
  eventLink: string;
  company: string;
}): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Reminder</h1>
            <p>Your event is coming up!</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>This is a reminder that your event <strong>${data.eventTitle}</strong> is scheduled for:</p>
            <p><strong>${data.eventTime}</strong></p>
            <p>Company: ${data.company}</p>
            <p>
              <a href="${data.eventLink}" class="button">Join Event</a>
            </p>
            <p>See you soon!</p>
            <div class="footer">
              <p>© 2026 CuraLive. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Event Reminder

Hi ${data.recipientName},

This is a reminder that your event "${data.eventTitle}" is scheduled for:
${data.eventTime}

Company: ${data.company}

Join Event: ${data.eventLink}

See you soon!

© 2026 CuraLive. All rights reserved.
  `.trim();

  return {
    subject: `Reminder: ${data.eventTitle} is coming up`,
    html,
    text,
  };
}

/**
 * Post-Event Summary Email
 */
export function postEventSummaryEmail(data: {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  participantCount: number;
  engagementScore: number;
  complianceScore: number;
  aiSummary: string;
  reportLink: string;
}): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .metric { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
          .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 12px; color: #666; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Summary</h1>
            <p>${data.eventTitle}</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>Thank you for hosting <strong>${data.eventTitle}</strong> on ${data.eventDate}.</p>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">${data.participantCount}</div>
                <div class="metric-label">Participants</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.engagementScore}%</div>
                <div class="metric-label">Engagement</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.complianceScore}%</div>
                <div class="metric-label">Compliance</div>
              </div>
            </div>

            <h3>AI Summary</h3>
            <p>${data.aiSummary}</p>

            <p>
              <a href="${data.reportLink}" class="button">View Full Report</a>
            </p>

            <div class="footer">
              <p>© 2026 CuraLive. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Event Summary

Hi ${data.recipientName},

Thank you for hosting "${data.eventTitle}" on ${data.eventDate}.

Metrics:
- Participants: ${data.participantCount}
- Engagement: ${data.engagementScore}%
- Compliance: ${data.complianceScore}%

AI Summary:
${data.aiSummary}

View Full Report: ${data.reportLink}

© 2026 CuraLive. All rights reserved.
  `.trim();

  return {
    subject: `Summary: ${data.eventTitle}`,
    html,
    text,
  };
}

/**
 * Compliance Alert Email
 */
export function complianceAlertEmail(data: {
  recipientName: string;
  eventTitle: string;
  alertType: string;
  alertMessage: string;
  actionRequired: boolean;
  actionLink?: string;
}): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #f5576c; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Compliance Alert</h1>
            <p>${data.alertType}</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>A compliance issue has been detected for <strong>${data.eventTitle}</strong>.</p>
            
            <div class="alert-box">
              <p><strong>Alert:</strong> ${data.alertMessage}</p>
            </div>

            ${
              data.actionRequired && data.actionLink
                ? `
            <p><strong>Action Required:</strong> Please review and take appropriate action.</p>
            <p>
              <a href="${data.actionLink}" class="button">Review Details</a>
            </p>
            `
                : ""
            }

            <div class="footer">
              <p>© 2026 CuraLive. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Compliance Alert

Hi ${data.recipientName},

A compliance issue has been detected for "${data.eventTitle}".

Alert: ${data.alertMessage}

${data.actionRequired ? `Action Required: Please review and take appropriate action.\nReview Details: ${data.actionLink}` : ""}

© 2026 CuraLive. All rights reserved.
  `.trim();

  return {
    subject: `⚠️ Compliance Alert: ${data.alertType}`,
    html,
    text,
  };
}

/**
 * User Role Change Email
 */
export function userRoleChangeEmail(data: {
  recipientName: string;
  newRole: string;
  roleDescription: string;
  permissions: string[];
  dashboardLink: string;
}): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .role-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .permissions { list-style: none; padding: 0; }
          .permissions li { padding: 8px 0; padding-left: 24px; position: relative; }
          .permissions li:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Role Update</h1>
            <p>Your account permissions have been updated</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>Your role has been updated to <strong>${data.newRole}</strong>.</p>
            
            <div class="role-box">
              <h3>${data.newRole}</h3>
              <p>${data.roleDescription}</p>
              <h4>Your new permissions:</h4>
              <ul class="permissions">
                ${data.permissions.map((perm) => `<li>${perm}</li>`).join("")}
              </ul>
            </div>

            <p>
              <a href="${data.dashboardLink}" class="button">Access Dashboard</a>
            </p>

            <div class="footer">
              <p>© 2026 CuraLive. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Role Update

Hi ${data.recipientName},

Your role has been updated to ${data.newRole}.

${data.roleDescription}

Your new permissions:
${data.permissions.map((perm) => `- ${perm}`).join("\n")}

Access Dashboard: ${data.dashboardLink}

© 2026 CuraLive. All rights reserved.
  `.trim();

  return {
    subject: `Role Updated: You are now a ${data.newRole}`,
    html,
    text,
  };
}

/**
 * Email Service Helper
 * 
 * In a real implementation, this would integrate with a service like SendGrid, Resend, or AWS SES
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // This is a placeholder - in production, integrate with your email service
    // Example: await resend.emails.send({ from: "noreply@curalive.com", to, ...template })

    console.log(`[Email] Sending to ${to}`);
    console.log(`[Email] Subject: ${template.subject}`);

    // Simulate email sending
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
