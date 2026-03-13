// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { mailingLists, mailingListEntries, attendeeRegistrations, events } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateUniquePin } from "../directAccess";
import { sendEmail, buildMailingListInvitationEmail, buildRegistrationConfirmationEmail } from "../_core/email";
import crypto from "crypto";

function generateConfirmToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

function splitCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(csvText: string): Array<{ firstName: string; lastName: string; email: string; company?: string; jobTitle?: string }> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVRow(lines[0].toLowerCase());

  const emailIdx = headers.findIndex(h => h === "email" || h === "e-mail" || h === "email address");
  const firstNameIdx = headers.findIndex(h => h === "firstname" || h === "first_name" || h === "first name" || h === "name");
  const lastNameIdx = headers.findIndex(h => h === "lastname" || h === "last_name" || h === "last name" || h === "surname");
  const companyIdx = headers.findIndex(h => h === "company" || h === "organisation" || h === "organization" || h === "org");
  const jobTitleIdx = headers.findIndex(h => h === "jobtitle" || h === "job_title" || h === "job title" || h === "title" || h === "role");

  if (emailIdx === -1) throw new Error("CSV must contain an 'email' column");
  if (firstNameIdx === -1) throw new Error("CSV must contain a 'firstName' or 'name' column");

  const results: Array<{ firstName: string; lastName: string; email: string; company?: string; jobTitle?: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = splitCSVRow(line);
    const email = fields[emailIdx]?.trim();
    if (!email || !email.includes("@")) continue;

    let firstName = fields[firstNameIdx]?.trim() || "";
    let lastName = lastNameIdx >= 0 ? (fields[lastNameIdx]?.trim() || "") : "";

    if (!lastName && firstName.includes(" ")) {
      const parts = firstName.split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    }

    if (!firstName) continue;

    results.push({
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      company: companyIdx >= 0 ? fields[companyIdx]?.trim() || undefined : undefined,
      jobTitle: jobTitleIdx >= 0 ? fields[jobTitleIdx]?.trim() || undefined : undefined,
    });
  }

  return results;
}

export const mailingListRouter = router({
  create: protectedProcedure
    .input(z.object({
      eventId: z.string().min(1),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const [result] = await db.insert(mailingLists).values({
        eventId: input.eventId,
        name: input.name,
      }).$returningId();

      return { success: true, id: result?.id };
    }),

  getLists: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.eventId) {
        return db.select().from(mailingLists).where(eq(mailingLists.eventId, input.eventId)).orderBy(mailingLists.createdAt);
      }
      return db.select().from(mailingLists).orderBy(mailingLists.createdAt);
    }),

  getList: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [list] = await db.select().from(mailingLists).where(eq(mailingLists.id, input.id)).limit(1);
      if (!list) return null;

      const entries = await db.select().from(mailingListEntries)
        .where(eq(mailingListEntries.mailingListId, input.id))
        .orderBy(mailingListEntries.createdAt);

      return { ...list, entries };
    }),

  importCSV: protectedProcedure
    .input(z.object({
      mailingListId: z.number(),
      csvText: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable", imported: 0, duplicates: 0 };

      const [list] = await db.select().from(mailingLists).where(eq(mailingLists.id, input.mailingListId)).limit(1);
      if (!list) return { success: false, error: "Mailing list not found", imported: 0, duplicates: 0 };

      let parsed;
      try {
        parsed = parseCSV(input.csvText);
      } catch (err: any) {
        return { success: false, error: err.message, imported: 0, duplicates: 0 };
      }

      if (parsed.length === 0) {
        return { success: false, error: "No valid entries found in CSV", imported: 0, duplicates: 0 };
      }

      let imported = 0;
      let duplicates = 0;

      for (const entry of parsed) {
        const [existing] = await db.select({ id: mailingListEntries.id })
          .from(mailingListEntries)
          .where(and(
            eq(mailingListEntries.mailingListId, input.mailingListId),
            eq(mailingListEntries.email, entry.email)
          ))
          .limit(1);

        if (existing) {
          duplicates++;
          continue;
        }

        let pin: string | undefined;
        try {
          pin = await generateUniquePin(list.eventId);
        } catch {
          console.warn("[MailingList] PIN generation failed for", entry.email);
        }

        const token = generateConfirmToken();

        await db.insert(mailingListEntries).values({
          mailingListId: input.mailingListId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          email: entry.email,
          company: entry.company || null,
          jobTitle: entry.jobTitle || null,
          accessPin: pin || null,
          status: pin ? "pin_assigned" : "pending",
          confirmToken: token,
        });

        imported++;
      }

      await db.update(mailingLists).set({
        totalEntries: sql`total_entries + ${imported}`,
        processedEntries: sql`processed_entries + ${imported}`,
        status: "ready",
      }).where(eq(mailingLists.id, input.mailingListId));

      return { success: true, imported, duplicates };
    }),

  sendInvitations: protectedProcedure
    .input(z.object({
      mailingListId: z.number(),
      personalMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable", sent: 0, failed: 0 };

      const [list] = await db.select().from(mailingLists).where(eq(mailingLists.id, input.mailingListId)).limit(1);
      if (!list) return { success: false, error: "Mailing list not found", sent: 0, failed: 0 };

      const [event] = await db.select().from(events).where(eq(events.eventId, list.eventId)).limit(1);
      const eventTitle = event?.title || list.eventId;
      const company = event?.company || "CuraLive Inc.";

      const pendingEntries = await db.select().from(mailingListEntries)
        .where(and(
          eq(mailingListEntries.mailingListId, input.mailingListId),
          eq(mailingListEntries.status, "pin_assigned")
        ));

      if (pendingEntries.length === 0) {
        return { success: true, sent: 0, failed: 0, message: "No pending entries to send" };
      }

      await db.update(mailingLists).set({ status: "sending" }).where(eq(mailingLists.id, input.mailingListId));

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://curalive.cc";

      let sent = 0;
      let failed = 0;

      for (const entry of pendingEntries) {
        const confirmUrl = `${baseUrl}/register/confirm/${entry.confirmToken}`;

        const html = buildMailingListInvitationEmail({
          firstName: entry.firstName,
          lastName: entry.lastName,
          eventTitle,
          company,
          eventDate: "See calendar invite for details",
          confirmUrl,
          personalMessage: input.personalMessage,
        });

        const result = await sendEmail({
          to: entry.email,
          subject: `You're Invited: ${eventTitle} — Click to Register`,
          html,
        });

        if (result.success) {
          await db.update(mailingListEntries).set({
            status: "emailed",
            emailSentAt: new Date(),
          }).where(eq(mailingListEntries.id, entry.id));
          sent++;
        } else {
          failed++;
          console.error(`[MailingList] Email failed for ${entry.email}:`, result.error);
        }
      }

      const finalStatus = failed > 0 && sent === 0 ? "ready" : failed > 0 ? "ready" : "sent";

      await db.update(mailingLists).set({
        status: finalStatus,
        emailedEntries: sql`emailed_entries + ${sent}`,
      }).where(eq(mailingLists.id, input.mailingListId));

      return { success: true, sent, failed };
    }),

  confirmRegistration: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const [entry] = await db.select().from(mailingListEntries)
        .where(eq(mailingListEntries.confirmToken, input.token))
        .limit(1);

      if (!entry) return { success: false, error: "Invalid or expired registration link" };

      if (entry.status === "registered") {
        return { success: true, alreadyRegistered: true, firstName: entry.firstName, lastName: entry.lastName };
      }

      const [list] = await db.select().from(mailingLists)
        .where(eq(mailingLists.id, entry.mailingListId))
        .limit(1);
      if (!list) return { success: false, error: "Mailing list not found" };

      const [existingReg] = await db.select()
        .from(attendeeRegistrations)
        .where(and(
          eq(attendeeRegistrations.eventId, list.eventId),
          eq(attendeeRegistrations.email, entry.email)
        ))
        .limit(1);

      let registrationId: number;
      let effectivePin: string | null = null;

      if (existingReg) {
        registrationId = existingReg.id;
        effectivePin = existingReg.accessPin;
      } else {
        effectivePin = entry.accessPin || await generateUniquePin(list.eventId).catch(() => null);

        const [regResult] = await db.insert(attendeeRegistrations).values({
          eventId: list.eventId,
          name: `${entry.firstName} ${entry.lastName}`.trim(),
          email: entry.email,
          company: entry.company || null,
          jobTitle: entry.jobTitle || null,
          language: "English",
          dialIn: true,
          accessGranted: true,
          accessPin: effectivePin,
        }).$returningId();

        registrationId = regResult?.id;
      }

      if (effectivePin !== entry.accessPin) {
        await db.update(mailingListEntries).set({ accessPin: effectivePin }).where(eq(mailingListEntries.id, entry.id));
      }

      await db.update(mailingListEntries).set({
        status: "registered",
        registrationId,
        confirmToken: null,
        clickedAt: entry.clickedAt || new Date(),
        registeredAt: new Date(),
      }).where(eq(mailingListEntries.id, entry.id));

      await db.update(mailingLists).set({
        registeredEntries: sql`registered_entries + 1`,
      }).where(eq(mailingLists.id, entry.mailingListId));

      const [event] = await db.select().from(events).where(eq(events.eventId, list.eventId)).limit(1);

      await sendEmail({
        to: entry.email,
        subject: `Registration Confirmed: ${event?.title || list.eventId}`,
        html: buildRegistrationConfirmationEmail({
          firstName: entry.firstName,
          lastName: entry.lastName,
          eventTitle: event?.title || list.eventId,
          company: event?.company || "CuraLive Inc.",
          eventDate: "See your calendar invite for the date and time",
          accessPin: effectivePin || undefined,
        }),
      }).catch(() => {});

      return {
        success: true,
        alreadyRegistered: false,
        firstName: entry.firstName,
        lastName: entry.lastName,
        accessPin: effectivePin,
        eventTitle: event?.title || list.eventId,
        company: event?.company || "CuraLive Inc.",
      };
    }),

  trackClick: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.update(mailingListEntries).set({
        status: "clicked",
        clickedAt: new Date(),
      }).where(and(
        eq(mailingListEntries.confirmToken, input.token),
        eq(mailingListEntries.status, "emailed")
      ));

      return { success: true };
    }),

  deleteList: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      await db.delete(mailingListEntries).where(eq(mailingListEntries.mailingListId, input.id));
      await db.delete(mailingLists).where(eq(mailingLists.id, input.id));

      return { success: true };
    }),

  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const [entry] = await db.select().from(mailingListEntries).where(eq(mailingListEntries.id, input.id)).limit(1);
      if (entry) {
        await db.delete(mailingListEntries).where(eq(mailingListEntries.id, input.id));
        await db.update(mailingLists).set({
          totalEntries: sql`GREATEST(total_entries - 1, 0)`,
        }).where(eq(mailingLists.id, entry.mailingListId));
      }

      return { success: true };
    }),
});
