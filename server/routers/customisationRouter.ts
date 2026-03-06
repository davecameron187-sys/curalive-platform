import { z } from "zod";
import { router, operatorProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eventCustomisation } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const customisationInput = z.object({
  eventId: z.string().min(1),
  // Brand Identity
  clientName: z.string().min(1).max(200).optional(),
  logoUrl: z.string().max(500).optional(),
  primaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  fontFamily: z.string().max(100).optional(),
  showPoweredBy: z.boolean().optional(),
  // Registration Page
  regPageTitle: z.string().max(300).optional(),
  regPageSubtitle: z.string().max(500).optional(),
  regHostName: z.string().max(200).optional(),
  regHostTitle: z.string().max(200).optional(),
  regHostOrg: z.string().max(200).optional(),
  regEventDate: z.string().max(100).optional(),
  regEventTime: z.string().max(100).optional(),
  regEventTimezone: z.string().max(64).optional(),
  regDescription: z.string().optional(),
  regFeatures: z.string().optional(),
  regAgenda: z.string().optional(),
  regSpeakers: z.string().optional(),
  regIndustryVertical: z.string().max(64).optional(),
  regMaxAttendees: z.number().int().min(1).optional(),
  regConsentText: z.string().optional(),
  regSupportEmail: z.string().max(320).optional(),
  regFieldCompany: z.boolean().optional(),
  regFieldJobTitle: z.boolean().optional(),
  regFieldPhone: z.boolean().optional(),
  regFieldCountry: z.boolean().optional(),
  regFieldLanguage: z.boolean().optional(),
  regFieldDialIn: z.boolean().optional(),
  // Booking Form
  bookHeadline: z.string().max(300).optional(),
  bookSubheadline: z.string().max(500).optional(),
  bookFeatures: z.string().optional(),
  bookServiceOptions: z.string().optional(),
  bookReplyEmail: z.string().max(320).optional(),
  bookButtonLabel: z.string().max(100).optional(),
  // Email Branding
  emailSenderName: z.string().max(200).optional(),
  emailSenderAddress: z.string().max(320).optional(),
  emailHeaderColor: z.string().max(20).optional(),
  emailButtonColor: z.string().max(20).optional(),
  emailButtonLabel: z.string().max(100).optional(),
  emailFooterText: z.string().max(500).optional(),
  // Links
  customSlug: z.string().max(128).optional(),
  shortLinkEnabled: z.boolean().optional(),
});

export const customisationRouter = router({

  // ── Get customisation for an event (public — used by attendee-facing pages) ──
  get: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(eventCustomisation)
        .where(eq(eventCustomisation.eventId, input.eventId))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ── Save / upsert customisation (operator only) ──────────────────────────────
  save: operatorProcedure
    .input(customisationInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select({ id: eventCustomisation.id })
        .from(eventCustomisation)
        .where(eq(eventCustomisation.eventId, input.eventId))
        .limit(1);

      const values = {
        eventId: input.eventId,
        clientName: input.clientName ?? "CuraLive",
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor ?? "#c8a96e",
        accentColor: input.accentColor ?? "#10b981",
        fontFamily: input.fontFamily ?? "Space Grotesk",
        showPoweredBy: input.showPoweredBy !== false,
        regPageTitle: input.regPageTitle ?? null,
        regPageSubtitle: input.regPageSubtitle ?? null,
        regHostName: input.regHostName ?? null,
        regHostTitle: input.regHostTitle ?? null,
        regHostOrg: input.regHostOrg ?? null,
        regEventDate: input.regEventDate ?? null,
        regEventTime: input.regEventTime ?? null,
        regEventTimezone: input.regEventTimezone ?? "SAST",
        regDescription: input.regDescription ?? null,
        regFeatures: input.regFeatures ?? null,
        regAgenda: input.regAgenda ?? null,
        regSpeakers: input.regSpeakers ?? null,
        regIndustryVertical: input.regIndustryVertical ?? "general",
        regMaxAttendees: input.regMaxAttendees ?? 1000,
        regConsentText: input.regConsentText ?? null,
        regSupportEmail: input.regSupportEmail ?? null,
        regFieldCompany: input.regFieldCompany !== false,
        regFieldJobTitle: input.regFieldJobTitle !== false,
        regFieldPhone: input.regFieldPhone ?? false,
        regFieldCountry: input.regFieldCountry ?? false,
        regFieldLanguage: input.regFieldLanguage !== false,
        regFieldDialIn: input.regFieldDialIn !== false,
        bookHeadline: input.bookHeadline ?? null,
        bookSubheadline: input.bookSubheadline ?? null,
        bookFeatures: input.bookFeatures ?? null,
        bookServiceOptions: input.bookServiceOptions ?? null,
        bookReplyEmail: input.bookReplyEmail ?? null,
        bookButtonLabel: input.bookButtonLabel ?? "Submit Booking Request",
        emailSenderName: input.emailSenderName ?? "CuraLive",
        emailSenderAddress: input.emailSenderAddress ?? null,
        emailHeaderColor: input.emailHeaderColor ?? "#0f172a",
        emailButtonColor: input.emailButtonColor ?? "#3b82f6",
        emailButtonLabel: input.emailButtonLabel ?? "Join Event",
        emailFooterText: input.emailFooterText ?? null,
        customSlug: input.customSlug ?? null,
        shortLinkEnabled: input.shortLinkEnabled ?? false,
        updatedAt: Date.now(),
      };

      if (existing.length > 0) {
        await db
          .update(eventCustomisation)
          .set(values)
          .where(eq(eventCustomisation.eventId, input.eventId));
      } else {
        await db.insert(eventCustomisation).values({ ...values, createdAt: Date.now() });
      }

      return { success: true };
    }),

  // ── Reset to defaults ────────────────────────────────────────────────────────
  reset: operatorProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(eventCustomisation).where(eq(eventCustomisation.eventId, input.eventId));
      return { success: true };
    }),
});
