import { rawSql } from "../db";
import { buildLiveDashboardEmail, buildReportEmail } from "../emails/templates";
import crypto from "crypto";

const APP_URL = () => process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:3000"}`;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function getPartnerBrand(partnerId?: number) {
  if (!partnerId) return undefined;
  try {
    const [rows] = await rawSql(
      `SELECT display_name, logo_url, primary_color, accent_color, font_family FROM partners WHERE id = $1 AND active = true`,
      [partnerId]
    );
    if (rows.length === 0) return undefined;
    const p = rows[0];
    return {
      displayName: p.display_name || undefined,
      logoUrl: p.logo_url || undefined,
      primaryColor: p.primary_color || undefined,
      accentColor: p.accent_color || undefined,
      fontFamily: p.font_family || undefined,
    };
  } catch {
    return undefined;
  }
}

export async function sendLiveDashboardLinks(opts: {
  sessionId: number;
  partnerId?: number;
  eventName: string;
  companyName: string;
  eventDate: string;
  recipients: { name: string; email: string; role?: string }[];
}) {
  const brand = await getPartnerBrand(opts.partnerId);

  for (const recipient of opts.recipients) {
    const token = generateToken();
    await rawSql(
      `INSERT INTO client_tokens (token, session_id, partner_id, recipient_name, recipient_email, recipient_role, access_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'live', NOW() + INTERVAL '7 days')`,
      [token, opts.sessionId, opts.partnerId || null, recipient.name, recipient.email, recipient.role || "viewer"]
    );

    const liveUrl = `${APP_URL()}/live/${token}`;
    const html = buildLiveDashboardEmail({
      recipientName: recipient.name,
      eventName: opts.eventName,
      companyName: opts.companyName,
      eventDate: opts.eventDate,
      liveUrl,
      brand,
    });

    try {
      const { sendEmail } = await import("../_core/email");
      await sendEmail({
        to: recipient.email,
        subject: `Live Intelligence Dashboard — ${opts.eventName}`,
        html,
      });
      console.log(`[ClientDelivery] Live link sent to ${recipient.email}`);
    } catch (err: any) {
      console.warn(`[ClientDelivery] Failed to send live link to ${recipient.email}:`, err?.message);
    }
  }

  console.log(`[ClientDelivery] ${opts.recipients.length} live dashboard links sent for session ${opts.sessionId}`);
}

export async function sendReportLinks(opts: {
  sessionId: number;
  partnerId?: number;
  eventName: string;
  companyName: string;
  eventDate: string;
  reportModules: number;
  complianceFlags: number;
  sessionDuration: string;
  recipients: { name: string; email: string }[];
}) {
  const brand = await getPartnerBrand(opts.partnerId);

  for (const recipient of opts.recipients) {
    const token = generateToken();
    await rawSql(
      `INSERT INTO client_tokens (token, session_id, partner_id, recipient_name, recipient_email, access_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'report', NOW() + INTERVAL '30 days')`,
      [token, opts.sessionId, opts.partnerId || null, recipient.name, recipient.email]
    );

    const reportUrl = `${APP_URL()}/report/${token}`;
    const html = buildReportEmail({
      recipientName: recipient.name,
      eventName: opts.eventName,
      companyName: opts.companyName,
      eventDate: opts.eventDate,
      reportUrl,
      reportModules: opts.reportModules,
      complianceFlags: opts.complianceFlags,
      sessionDuration: opts.sessionDuration,
      brand,
    });

    try {
      const { sendEmail } = await import("../_core/email");
      await sendEmail({
        to: recipient.email,
        subject: `Intelligence Report Ready — ${opts.eventName}`,
        html,
      });
      console.log(`[ClientDelivery] Report link sent to ${recipient.email}`);
    } catch (err: any) {
      console.warn(`[ClientDelivery] Failed to send report link to ${recipient.email}:`, err?.message);
    }
  }

  console.log(`[ClientDelivery] ${opts.recipients.length} report links sent for session ${opts.sessionId}`);
}
