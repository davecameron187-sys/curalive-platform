// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { crmApiKeys, mailingLists, mailingListEntries, attendeeRegistrations, events } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateUniquePin } from "../directAccess";
import { sendEmail, buildRegistrationConfirmationEmail } from "../_core/email";
import crypto from "crypto";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { key: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const key = `clv_${raw}`;
  return { key, prefix: key.substring(0, 11) };
}

async function dispatchWebhook(url: string, payload: any) {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[CRM Webhook] POST ${url} → ${resp.status}`);
    return resp.ok;
  } catch (err) {
    console.error(`[CRM Webhook] Failed POST ${url}:`, err);
    return false;
  }
}

export const crmApiRouter = router({
  generateKey: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      eventId: z.string().optional(),
      permissions: z.array(z.enum(["read", "write", "register"])).default(["read", "write", "register"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const { key, prefix } = generateApiKey();
      const keyHash = hashApiKey(key);

      await db.insert(crmApiKeys).values({
        keyHash,
        keyPrefix: prefix,
        name: input.name,
        eventId: input.eventId || null,
        permissions: input.permissions,
      });

      return { success: true, apiKey: key, prefix };
    }),

  listKeys: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select({
        id: crmApiKeys.id,
        keyPrefix: crmApiKeys.keyPrefix,
        name: crmApiKeys.name,
        eventId: crmApiKeys.eventId,
        permissions: crmApiKeys.permissions,
        active: crmApiKeys.active,
        lastUsedAt: crmApiKeys.lastUsedAt,
        createdAt: crmApiKeys.createdAt,
      }).from(crmApiKeys);

      if (input.eventId) {
        return query.where(eq(crmApiKeys.eventId, input.eventId)).orderBy(crmApiKeys.createdAt);
      }
      return query.orderBy(crmApiKeys.createdAt);
    }),

  revokeKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      await db.update(crmApiKeys).set({ active: false }).where(eq(crmApiKeys.id, input.id));
      return { success: true };
    }),

  deleteKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      await db.delete(crmApiKeys).where(eq(crmApiKeys.id, input.id));
      return { success: true };
    }),

  setWebhookUrl: protectedProcedure
    .input(z.object({
      mailingListId: z.number(),
      webhookUrl: z.string().url().max(512).or(z.literal("")),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      await db.update(mailingLists).set({
        webhookUrl: input.webhookUrl || null,
      }).where(eq(mailingLists.id, input.mailingListId));

      return { success: true };
    }),

  createRegistration: publicProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      eventId: z.string().min(1),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      joinMethod: z.enum(["phone", "teams", "zoom", "web"]).optional().default("phone"),
      sendConfirmationEmail: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const keyHash = hashApiKey(input.apiKey);
      const [apiKeyRow] = await db.select().from(crmApiKeys)
        .where(and(eq(crmApiKeys.keyHash, keyHash), eq(crmApiKeys.active, true)))
        .limit(1);

      if (!apiKeyRow) return { success: false, error: "Invalid API key" };

      const perms = apiKeyRow.permissions as string[];
      if (!perms.includes("register") && !perms.includes("write")) {
        return { success: false, error: "Insufficient permissions" };
      }

      if (apiKeyRow.eventId && apiKeyRow.eventId !== input.eventId) {
        return { success: false, error: "API key not authorized for this event" };
      }

      await db.update(crmApiKeys).set({ lastUsedAt: new Date() }).where(eq(crmApiKeys.id, apiKeyRow.id));

      const needsPin = input.joinMethod === "phone";
      let accessPin: string | null = null;
      if (needsPin) {
        accessPin = await generateUniquePin(input.eventId).catch(() => null);
      }

      const [existingReg] = await db.select()
        .from(attendeeRegistrations)
        .where(and(eq(attendeeRegistrations.eventId, input.eventId), eq(attendeeRegistrations.email, input.email.toLowerCase())))
        .limit(1);

      let registrationId: number;
      if (existingReg) {
        registrationId = existingReg.id;
        accessPin = existingReg.accessPin || accessPin;
        const conn = (db as any).session?.client ?? (db as any).$client;
        await conn.execute(
          `UPDATE attendee_registrations SET join_method = ?, dialIn = ?, access_pin = COALESCE(?, access_pin) WHERE id = ?`,
          [input.joinMethod, needsPin ? 1 : 0, accessPin, registrationId]
        );
      } else {
        const [regResult] = await db.insert(attendeeRegistrations).values({
          eventId: input.eventId,
          name: `${input.firstName} ${input.lastName}`.trim(),
          email: input.email.toLowerCase(),
          company: input.company || null,
          jobTitle: input.jobTitle || null,
          language: "English",
          dialIn: needsPin,
          accessGranted: true,
          accessPin,
          joinMethod: input.joinMethod,
        }).$returningId();
        registrationId = regResult?.id;
      }

      if (input.sendConfirmationEmail) {
        const [event] = await db.select().from(events).where(eq(events.eventId, input.eventId)).limit(1);
        await sendEmail({
          to: input.email.toLowerCase(),
          subject: `Registration Confirmed: ${event?.title || input.eventId}`,
          html: buildRegistrationConfirmationEmail({
            firstName: input.firstName,
            lastName: input.lastName,
            eventTitle: event?.title || input.eventId,
            company: event?.company || "CuraLive Inc.",
            eventDate: "See your calendar invite for the date and time",
            accessPin: needsPin ? (accessPin || undefined) : undefined,
            joinMethod: input.joinMethod,
          }),
        }).catch(() => {});
      }

      const [mlRow] = await db.select().from(mailingLists)
        .where(eq(mailingLists.eventId, input.eventId))
        .limit(1);
      if (mlRow?.webhookUrl) {
        dispatchWebhook(mlRow.webhookUrl, {
          event: "registration.created",
          eventId: input.eventId,
          registrationId,
          email: input.email.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          joinMethod: input.joinMethod,
          accessPin: needsPin ? accessPin : null,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        registrationId,
        accessPin,
        joinMethod: input.joinMethod,
      };
    }),

  bulkCreateRegistrations: publicProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      eventId: z.string().min(1),
      joinMethod: z.enum(["phone", "teams", "zoom", "web"]).optional().default("phone"),
      sendConfirmationEmails: z.boolean().optional().default(true),
      contacts: z.array(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
      })).min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable", created: 0, skipped: 0 };

      const keyHash = hashApiKey(input.apiKey);
      const [apiKeyRow] = await db.select().from(crmApiKeys)
        .where(and(eq(crmApiKeys.keyHash, keyHash), eq(crmApiKeys.active, true)))
        .limit(1);

      if (!apiKeyRow) return { success: false, error: "Invalid API key", created: 0, skipped: 0 };

      const perms = apiKeyRow.permissions as string[];
      if (!perms.includes("register") && !perms.includes("write")) {
        return { success: false, error: "Insufficient permissions", created: 0, skipped: 0 };
      }

      if (apiKeyRow.eventId && apiKeyRow.eventId !== input.eventId) {
        return { success: false, error: "API key not authorized for this event", created: 0, skipped: 0 };
      }

      await db.update(crmApiKeys).set({ lastUsedAt: new Date() }).where(eq(crmApiKeys.id, apiKeyRow.id));

      const needsPin = input.joinMethod === "phone";
      let created = 0;
      let skipped = 0;
      const results: Array<{ email: string; registrationId: number; accessPin: string | null }> = [];

      for (const contact of input.contacts) {
        const email = contact.email.toLowerCase();
        const [existing] = await db.select({ id: attendeeRegistrations.id })
          .from(attendeeRegistrations)
          .where(and(eq(attendeeRegistrations.eventId, input.eventId), eq(attendeeRegistrations.email, email)))
          .limit(1);

        if (existing) { skipped++; continue; }

        let pin: string | null = null;
        if (needsPin) { pin = await generateUniquePin(input.eventId).catch(() => null); }

        const [regResult] = await db.insert(attendeeRegistrations).values({
          eventId: input.eventId,
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          email,
          company: contact.company || null,
          jobTitle: contact.jobTitle || null,
          language: "English",
          dialIn: needsPin,
          accessGranted: true,
          accessPin: pin,
          joinMethod: input.joinMethod,
        }).$returningId();

        results.push({ email, registrationId: regResult?.id, accessPin: pin });
        created++;

        if (input.sendConfirmationEmails) {
          const [event] = await db.select().from(events).where(eq(events.eventId, input.eventId)).limit(1);
          sendEmail({
            to: email,
            subject: `Registration Confirmed: ${event?.title || input.eventId}`,
            html: buildRegistrationConfirmationEmail({
              firstName: contact.firstName,
              lastName: contact.lastName,
              eventTitle: event?.title || input.eventId,
              company: event?.company || "CuraLive Inc.",
              eventDate: "See your calendar invite for the date and time",
              accessPin: needsPin ? (pin || undefined) : undefined,
              joinMethod: input.joinMethod,
            }),
          }).catch(() => {});
        }
      }

      const [mlRow] = await db.select().from(mailingLists)
        .where(eq(mailingLists.eventId, input.eventId))
        .limit(1);
      if (mlRow?.webhookUrl) {
        dispatchWebhook(mlRow.webhookUrl, {
          event: "registration.bulk_created",
          eventId: input.eventId,
          created,
          skipped,
          registrations: results,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, created, skipped, registrations: results };
    }),

  getRegistrationStatus: publicProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      eventId: z.string().min(1),
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const keyHash = hashApiKey(input.apiKey);
      const [apiKeyRow] = await db.select().from(crmApiKeys)
        .where(and(eq(crmApiKeys.keyHash, keyHash), eq(crmApiKeys.active, true)))
        .limit(1);

      if (!apiKeyRow) return { success: false, error: "Invalid API key" };

      const perms = apiKeyRow.permissions as string[];
      if (!perms.includes("read")) return { success: false, error: "Insufficient permissions" };

      if (apiKeyRow.eventId && apiKeyRow.eventId !== input.eventId) {
        return { success: false, error: "API key not authorized for this event" };
      }

      await db.update(crmApiKeys).set({ lastUsedAt: new Date() }).where(eq(crmApiKeys.id, apiKeyRow.id));

      const [reg] = await db.select().from(attendeeRegistrations)
        .where(and(eq(attendeeRegistrations.eventId, input.eventId), eq(attendeeRegistrations.email, input.email.toLowerCase())))
        .limit(1);

      if (!reg) return { success: true, registered: false };

      return {
        success: true,
        registered: true,
        registrationId: reg.id,
        name: reg.name,
        email: reg.email,
        company: reg.company,
        jobTitle: reg.jobTitle,
        joinMethod: reg.joinMethod,
        accessPin: reg.accessPin,
        dialIn: reg.dialIn,
        accessGranted: reg.accessGranted,
        joinedAt: reg.joinedAt,
        createdAt: reg.createdAt,
      };
    }),

  listRegistrations: publicProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      eventId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const keyHash = hashApiKey(input.apiKey);
      const [apiKeyRow] = await db.select().from(crmApiKeys)
        .where(and(eq(crmApiKeys.keyHash, keyHash), eq(crmApiKeys.active, true)))
        .limit(1);

      if (!apiKeyRow) return { success: false, error: "Invalid API key" };

      const perms = apiKeyRow.permissions as string[];
      if (!perms.includes("read")) return { success: false, error: "Insufficient permissions" };

      if (apiKeyRow.eventId && apiKeyRow.eventId !== input.eventId) {
        return { success: false, error: "API key not authorized for this event" };
      }

      await db.update(crmApiKeys).set({ lastUsedAt: new Date() }).where(eq(crmApiKeys.id, apiKeyRow.id));

      const regs = await db.select({
        id: attendeeRegistrations.id,
        name: attendeeRegistrations.name,
        email: attendeeRegistrations.email,
        company: attendeeRegistrations.company,
        joinMethod: attendeeRegistrations.joinMethod,
        accessPin: attendeeRegistrations.accessPin,
        dialIn: attendeeRegistrations.dialIn,
        accessGranted: attendeeRegistrations.accessGranted,
        joinedAt: attendeeRegistrations.joinedAt,
        createdAt: attendeeRegistrations.createdAt,
      }).from(attendeeRegistrations)
        .where(eq(attendeeRegistrations.eventId, input.eventId))
        .orderBy(attendeeRegistrations.createdAt);

      return { success: true, registrations: regs, total: regs.length };
    }),

  getEventStats: publicProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      eventId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const keyHash = hashApiKey(input.apiKey);
      const [apiKeyRow] = await db.select().from(crmApiKeys)
        .where(and(eq(crmApiKeys.keyHash, keyHash), eq(crmApiKeys.active, true)))
        .limit(1);

      if (!apiKeyRow) return { success: false, error: "Invalid API key" };

      const perms = apiKeyRow.permissions as string[];
      if (!perms.includes("read")) return { success: false, error: "Insufficient permissions" };

      if (apiKeyRow.eventId && apiKeyRow.eventId !== input.eventId) {
        return { success: false, error: "API key not authorized for this event" };
      }

      await db.update(crmApiKeys).set({ lastUsedAt: new Date() }).where(eq(crmApiKeys.id, apiKeyRow.id));

      const conn = (db as any).session?.client ?? (db as any).$client;
      const [rows] = await conn.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN join_method = 'phone' THEN 1 ELSE 0 END) as phone_count,
          SUM(CASE WHEN join_method = 'teams' THEN 1 ELSE 0 END) as teams_count,
          SUM(CASE WHEN join_method = 'zoom' THEN 1 ELSE 0 END) as zoom_count,
          SUM(CASE WHEN join_method = 'web' THEN 1 ELSE 0 END) as web_count,
          SUM(CASE WHEN joinedAt IS NOT NULL THEN 1 ELSE 0 END) as joined_count
        FROM attendee_registrations WHERE eventId = ?`,
        [input.eventId]
      );

      const stats = rows[0] || {};
      return {
        success: true,
        eventId: input.eventId,
        totalRegistrations: Number(stats.total || 0),
        byJoinMethod: {
          phone: Number(stats.phone_count || 0),
          teams: Number(stats.teams_count || 0),
          zoom: Number(stats.zoom_count || 0),
          web: Number(stats.web_count || 0),
        },
        joined: Number(stats.joined_count || 0),
      };
    }),
});
