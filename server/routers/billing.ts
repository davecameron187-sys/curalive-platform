// @ts-nocheck
/**
 * routers/billing.ts — Enterprise Billing System tRPC router.
 * All mutations are admin-only. Queries are admin-only except the public
 * quote/invoice view endpoints which are gated by access token.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  getBillingClients, getBillingClient, createBillingClient, updateBillingClient,
  getClientContacts, createClientContact, updateClientContact, deleteClientContact,
  getBillingQuotes, getBillingQuote, getBillingQuoteByToken,
  createBillingQuote, updateBillingQuote,
  getQuoteVersions, createQuoteVersion,
  getLineItems, upsertLineItems,
  getBillingInvoices, getBillingInvoice, getBillingInvoiceByToken,
  createBillingInvoice, updateBillingInvoice,
  getPayments, recordPayment,
  getCreditNotes, createCreditNote, updateCreditNote,
  logBillingActivity, getActivityLog,
  getLineItemTemplates, createLineItemTemplate, updateLineItemTemplate, incrementTemplateUsage,
  getLatestFxRates, upsertFxRate,
  createEmailEvent, recordEmailOpen, getEmailEvents,
  getRecurringTemplates, createRecurringTemplate, updateRecurringTemplate,
  getAgeingReport, markOverdueInvoices,
  convertQuoteToInvoice,
  generateTrackingToken,
} from "../db.billing";
import { sendEmail } from "../_core/email";

// ─── Admin guard ─────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "operator") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  category: z.string().default("Event Fee"),
  quantity: z.number().int().positive().default(1),
  unitPriceCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  sortOrder: z.number().int().default(0),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const billingRouter = router({

  // ── Clients ────────────────────────────────────────────────────────────────

  getClients: adminProcedure.query(async () => {
    return getBillingClients();
  }),

  getClient: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const client = await getBillingClient(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      const contacts = await getClientContacts(input.id);
      const quotes = await getBillingQuotes({ clientId: input.id });
      const invoices = await getBillingInvoices({ clientId: input.id });
      return { client, contacts, quotes, invoices };
    }),

  createClient: adminProcedure
    .input(z.object({
      companyName: z.string().min(1),
      registrationNumber: z.string().optional(),
      vatNumber: z.string().optional(),
      contactName: z.string().min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      contactJobTitle: z.string().optional(),
      billingAddress: z.string().optional(),
      billingCity: z.string().optional(),
      billingCountry: z.string().default("South Africa"),
      billingPostalCode: z.string().optional(),
      currency: z.enum(["ZAR", "USD", "EUR"]).default("ZAR"),
      paymentTermsDays: z.number().int().default(30),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createBillingClient({
        ...input,
        status: "prospect",
      });
      await logBillingActivity({
        clientId: id,
        eventType: "client.created",
        description: `Client "${input.companyName}" created`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });
      return { id };
    }),

  updateClient: adminProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().optional(),
      registrationNumber: z.string().optional(),
      vatNumber: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      contactJobTitle: z.string().optional(),
      billingAddress: z.string().optional(),
      billingCity: z.string().optional(),
      billingCountry: z.string().optional(),
      billingPostalCode: z.string().optional(),
      currency: z.enum(["ZAR", "USD", "EUR"]).optional(),
      paymentTermsDays: z.number().int().optional(),
      status: z.enum(["prospect", "active", "inactive"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateBillingClient(id, data as any);
      await logBillingActivity({
        clientId: id,
        eventType: "client.updated",
        description: `Client record updated`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });
      return { success: true };
    }),

  // ── Contacts ───────────────────────────────────────────────────────────────

  addContact: adminProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
      isPrimary: z.boolean().default(false),
      receivesQuotes: z.boolean().default(true),
      receivesInvoices: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const id = await createClientContact(input);
      return { id };
    }),

  updateContact: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
      isPrimary: z.boolean().optional(),
      receivesQuotes: z.boolean().optional(),
      receivesInvoices: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClientContact(id, data as any);
      return { success: true };
    }),

  deleteContact: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClientContact(input.id);
      return { success: true };
    }),

  // ── Quotes ─────────────────────────────────────────────────────────────────

  getQuotes: adminProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getBillingQuotes(input ?? {});
    }),

  getQuote: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const quote = await getBillingQuote(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      const lineItems = await getLineItems(input.id, undefined);
      const versions = await getQuoteVersions(input.id);
      const activity = await getActivityLog({ quoteId: input.id });
      const emails = await getEmailEvents({ quoteId: input.id });
      return { quote, lineItems, versions, activity, emails };
    }),

  createQuote: adminProcedure
    .input(z.object({
      clientId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      lineItems: z.array(lineItemSchema),
      discountCents: z.number().int().default(0),
      taxPercent: z.number().int().default(15),
      currency: z.enum(["ZAR", "USD", "EUR"]).default("ZAR"),
      paymentTerms: z.string().optional(),
      internalNotes: z.string().optional(),
      clientNotes: z.string().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const subtotalCents = input.lineItems.reduce((s, i) => s + i.totalCents, 0);
      const discountedCents = subtotalCents - input.discountCents;
      const taxCents = Math.round(discountedCents * input.taxPercent / 100);
      const totalCents = discountedCents + taxCents;

      const { id, quoteNumber, accessToken } = await createBillingQuote({
        clientId: input.clientId,
        title: input.title,
        description: input.description ?? null,
        subtotalCents,
        discountCents: input.discountCents,
        taxPercent: input.taxPercent,
        totalCents,
        currency: input.currency,
        status: "draft",
        paymentTerms: input.paymentTerms ?? null,
        internalNotes: input.internalNotes ?? null,
        clientNotes: input.clientNotes ?? null,
        expiresAt: input.expiresAt ?? null,
        createdByUserId: ctx.user.id,
      });

      await upsertLineItems(input.lineItems, id);

      await logBillingActivity({
        quoteId: id,
        clientId: input.clientId,
        eventType: "quote.created",
        description: `Quote ${quoteNumber} created`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { id, quoteNumber, accessToken };
    }),

  updateQuote: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      lineItems: z.array(lineItemSchema).optional(),
      discountCents: z.number().int().optional(),
      taxPercent: z.number().int().optional(),
      currency: z.enum(["ZAR", "USD", "EUR"]).optional(),
      paymentTerms: z.string().optional(),
      internalNotes: z.string().optional(),
      clientNotes: z.string().optional(),
      expiresAt: z.date().optional(),
      status: z.enum(["draft", "sent", "viewed", "accepted", "declined", "invoiced", "expired"]).optional(),
      createVersion: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getBillingQuote(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Snapshot current version if requested
      if (input.createVersion) {
        const currentItems = await getLineItems(input.id);
        await createQuoteVersion({
          quoteId: input.id,
          versionNumber: (existing as any).versionNumber ?? 1,
          lineItemsSnapshot: JSON.stringify(currentItems),
        subtotalCents: existing.subtotalCents,
        discountCents: existing.discountCents,
        taxPercent: existing.taxPercent,
        totalCents: existing.totalCents,
        currency: existing.currency,
          createdByUserId: ctx.user.id,
        });
      }

      const { id, lineItems, createVersion, ...data } = input;

      if (lineItems) {
        const subtotalCents = lineItems.reduce((s, i) => s + i.totalCents, 0);
        const discountCents = data.discountCents ?? existing.discountCents;
        const taxPercent = data.taxPercent ?? existing.taxPercent;
        const taxCents = Math.round((subtotalCents - discountCents) * taxPercent / 100);
        const totalCents = subtotalCents - discountCents + taxCents;
        await upsertLineItems(lineItems, id);
        await updateBillingQuote(id, {
          ...data as any,
          subtotalCents,
          taxCents,
          totalCents,
          versionNumber: ((existing as any).versionNumber ?? 1) + (createVersion ? 1 : 0),
        });
      } else {
        await updateBillingQuote(id, data as any);
      }

      await logBillingActivity({
        quoteId: id,
        clientId: existing.clientId,
        eventType: "quote.updated",
        description: `Quote ${existing.quoteNumber} updated${input.createVersion ? " (new version created)" : ""}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { success: true };
    }),

  sendQuote: adminProcedure
    .input(z.object({
      id: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      subject: z.string().optional(),
      message: z.string().optional(),
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const quote = await getBillingQuote(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      const trackingToken = generateTrackingToken();
      const quoteUrl = `${input.origin}/quote/${quote.accessToken}`;
      const trackingPixelUrl = `${input.origin}/api/billing/track/${trackingToken}`;

      // Record email event
      await createEmailEvent({
        trackingToken,
        quoteId: quote.id,
        clientId: quote.clientId,
        recipientEmail: input.recipientEmail,
        emailType: "quote_sent",
        subject: input.subject ?? `Quote ${quote.quoteNumber} from CuraLive`,
      });

      // Send email
      await sendEmail({
        to: input.recipientEmail,
        subject: input.subject ?? `Quote ${quote.quoteNumber} from CuraLive`,
        html: buildQuoteEmailHtml({
          recipientName: input.recipientName,
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          totalCents: quote.totalCents,
          currency: quote.currency,
          expiresAt: quote.expiresAt,
          message: input.message,
          quoteUrl,
          trackingPixelUrl,
        }),
      });

      await updateBillingQuote(input.id, { status: "sent" });

      await logBillingActivity({
        quoteId: input.id,
        clientId: quote.clientId,
        eventType: "quote.sent",
        description: `Quote ${quote.quoteNumber} sent to ${input.recipientEmail}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { success: true };
    }),

  // ── Public quote view (client-facing) ─────────────────────────────────────

  getQuoteByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const quote = await getBillingQuoteByToken(input.token);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      const lineItems = await getLineItems(quote.id, undefined);
      const client = await getBillingClient(quote.clientId);

      // Mark as viewed if still in sent status
      if (quote.status === "sent") {
        await updateBillingQuote(quote.id, { status: "viewed" });
        await logBillingActivity({
          quoteId: quote.id,
          clientId: quote.clientId,
          eventType: "quote.viewed",
          description: `Quote ${quote.quoteNumber} viewed by client`,
          actorType: "client",
          ipAddress: (ctx as any).req?.ip ?? null,
        });
      }

      return { quote, lineItems, client };
    }),

  acceptQuote: publicProcedure
    .input(z.object({ token: z.string(), signerName: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await getBillingQuoteByToken(input.token);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.status === "expired") throw new TRPCError({ code: "BAD_REQUEST", message: "This quote has expired." });
      if (quote.status === "invoiced") throw new TRPCError({ code: "BAD_REQUEST", message: "This quote has already been invoiced." });

      await updateBillingQuote(quote.id, {
        status: "accepted",
        acceptedAt: new Date(),
      });

      await logBillingActivity({
        quoteId: quote.id,
        clientId: quote.clientId,
        eventType: "quote.accepted",
        description: `Quote ${quote.quoteNumber} accepted by ${input.signerName ?? "client"}`,
        actorType: "client",
        ipAddress: (ctx as any).req?.ip ?? null,
      });

      return { success: true };
    }),

  // ── Convert quote to invoice ───────────────────────────────────────────────

  convertToInvoice: adminProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await getBillingQuote(input.quoteId);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      const { invoiceId, invoiceNumber, accessToken } = await convertQuoteToInvoice(input.quoteId, ctx.user.id);

      await logBillingActivity({
        quoteId: input.quoteId,
        invoiceId,
        clientId: quote.clientId,
        eventType: "invoice.created",
        description: `Invoice ${invoiceNumber} created from quote ${quote.quoteNumber}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { invoiceId, invoiceNumber, accessToken };
    }),

  // ── Invoices ───────────────────────────────────────────────────────────────

  getInvoices: adminProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getBillingInvoices(input ?? {});
    }),

  getInvoice: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const invoice = await getBillingInvoice(input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      const lineItems = await getLineItems(undefined, input.id);
      const payments = await getPayments(input.id);
      const creditNotes = await getCreditNotes(input.id);
      const activity = await getActivityLog({ invoiceId: input.id });
      const emails = await getEmailEvents({ invoiceId: input.id });
      return { invoice, lineItems, payments, creditNotes, activity, emails };
    }),

  sendInvoice: adminProcedure
    .input(z.object({
      id: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      subject: z.string().optional(),
      message: z.string().optional(),
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await getBillingInvoice(input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const trackingToken = generateTrackingToken();
      const invoiceUrl = `${input.origin}/invoice/${invoice.accessToken}`;
      const trackingPixelUrl = `${input.origin}/api/billing/track/${trackingToken}`;

      await createEmailEvent({
        trackingToken,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        recipientEmail: input.recipientEmail,
        emailType: "invoice_sent",
        subject: input.subject ?? `Invoice ${invoice.invoiceNumber} from CuraLive`,
      });

      await sendEmail({
        to: input.recipientEmail,
        subject: input.subject ?? `Invoice ${invoice.invoiceNumber} from CuraLive`,
        html: buildInvoiceEmailHtml({
          recipientName: input.recipientName,
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          totalCents: invoice.totalCents,
          currency: invoice.currency,
          dueAt: invoice.dueAt,
          message: input.message,
          invoiceUrl,
          trackingPixelUrl,
        }),
      });

      await updateBillingInvoice(input.id, { status: "sent" });

      await logBillingActivity({
        invoiceId: input.id,
        clientId: invoice.clientId,
        eventType: "invoice.sent",
        description: `Invoice ${invoice.invoiceNumber} sent to ${input.recipientEmail}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { success: true };
    }),

  // Public invoice view
  getInvoiceByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const invoice = await getBillingInvoiceByToken(input.token);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      const lineItems = await getLineItems(undefined, invoice.id);
      const client = await getBillingClient(invoice.clientId);
      const creditNotes = await getCreditNotes(invoice.id);

      if (invoice.status === "sent") {
        await updateBillingInvoice(invoice.id, { status: "viewed" });
        await logBillingActivity({
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          eventType: "invoice.viewed",
          description: `Invoice ${invoice.invoiceNumber} viewed by client`,
          actorType: "client",
          ipAddress: (ctx as any).req?.ip ?? null,
        });
      }

      return { invoice, lineItems, client, creditNotes };
    }),

  // ── Payments ───────────────────────────────────────────────────────────────

  recordPayment: adminProcedure
    .input(z.object({
      invoiceId: z.number(),
      amountCents: z.number().int().positive(),
      paymentMethod: z.enum(["eft", "bank_transfer", "cheque", "credit_card", "other"]).default("eft"),
      reference: z.string().optional(),
      paidAt: z.date().default(() => new Date()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await getBillingInvoice(input.invoiceId);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const id = await recordPayment({
        invoiceId: input.invoiceId,
        clientId: invoice.clientId,
        amountCents: input.amountCents,
        currency: invoice.currency,
        paymentMethod: input.paymentMethod,
        reference: input.reference ?? null,
        paidAt: input.paidAt,
        notes: input.notes ?? null,
        recordedByUserId: ctx.user.id,
      });

      const formattedAmount = formatCurrency(input.amountCents, invoice.currency);
      await logBillingActivity({
        invoiceId: input.invoiceId,
        clientId: invoice.clientId,
        eventType: "invoice.payment_recorded",
        description: `Payment of ${formattedAmount} recorded via ${input.paymentMethod}${input.reference ? ` (ref: ${input.reference})` : ""}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { id };
    }),

  // ── Credit Notes ───────────────────────────────────────────────────────────

  createCreditNote: adminProcedure
    .input(z.object({
      invoiceId: z.number(),
      reason: z.string().min(1),
      amountCents: z.number().int().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await getBillingInvoice(input.invoiceId);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const taxCents = Math.round(input.amountCents * 0.15);
      const totalCents = input.amountCents + taxCents;
      const { id, creditNoteNumber } = await createCreditNote({
        invoiceId: input.invoiceId,
        clientId: invoice.clientId,
        reason: input.reason,
        amountCents: input.amountCents,
        taxPercent: 15,
        taxCents,
        totalCents,
        currency: invoice.currency,
        status: "issued",
        issuedAt: new Date(),
        internalNotes: input.notes ?? null,
        createdByUserId: ctx.user.id,
      });

      await logBillingActivity({
        invoiceId: input.invoiceId,
        clientId: invoice.clientId,
        eventType: "credit_note.issued",
        description: `Credit note ${creditNoteNumber} issued for ${formatCurrency(input.amountCents, invoice.currency)}: ${input.reason}`,
        actorUserId: ctx.user.id,
        actorType: "admin",
      });

      return { id, creditNoteNumber };
    }),

  // ── Line Item Templates ────────────────────────────────────────────────────

  getLineItemTemplates: adminProcedure.query(async () => {
    return getLineItemTemplates();
  }),

  createLineItemTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      category: z.string().default("Event Fee"),
      defaultUnitPriceCents: z.number().int().nonnegative(),
      defaultCurrency: z.enum(["ZAR", "USD", "EUR"]).default("ZAR"),
      isPackage: z.boolean().default(false),
      packageItemsJson: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createLineItemTemplate({ ...input, createdByUserId: ctx.user.id });
      return { id };
    }),

  updateLineItemTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      defaultUnitPriceCents: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateLineItemTemplate(id, data as any);
      return { success: true };
    }),

  useTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await incrementTemplateUsage(input.id);
      const templates = await getLineItemTemplates();
      const template = templates.find(t => t.id === input.id);
      return template ?? null;
    }),

  // ── FX Rates ───────────────────────────────────────────────────────────────

  getFxRates: publicProcedure.query(async () => {
    // Try to fetch live rates; fall back to cached DB rates
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/ZAR");
      if (response.ok) {
        const data = await response.json() as { rates: Record<string, number> };
        const pairs = [
          ["ZAR", "USD"], ["ZAR", "EUR"],
          ["USD", "ZAR"], ["EUR", "ZAR"],
          ["USD", "EUR"], ["EUR", "USD"],
        ];
        for (const [base, target] of pairs) {
          let rate: number;
          if (base === "ZAR") {
            rate = data.rates[target] ?? 1;
          } else if (target === "ZAR") {
            rate = 1 / (data.rates[base] ?? 1);
          } else {
            rate = (data.rates[target] ?? 1) / (data.rates[base] ?? 1);
          }
          await upsertFxRate(base, target, rate.toFixed(6));
        }
      }
    } catch {
      // Fall back to DB cache silently
    }
    return getLatestFxRates();
  }),

  // ── Recurring Templates ────────────────────────────────────────────────────

  getRecurringTemplates: adminProcedure.query(async () => {
    return getRecurringTemplates();
  }),

  createRecurringTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      clientId: z.number(),
      titleTemplate: z.string().min(1),
      lineItemsJson: z.string(),
      discountPercent: z.number().int().default(0),
      taxPercent: z.number().int().default(15),
      currency: z.enum(["ZAR", "USD", "EUR"]).default("ZAR"),
      paymentTerms: z.string().optional(),
      frequency: z.enum(["monthly", "quarterly", "annually"]),
      dayOfMonth: z.number().int().min(1).max(28).default(1),
      nextGenerationAt: z.date(),
      autoDraft: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createRecurringTemplate({ ...input, createdByUserId: ctx.user.id });
      return { id };
    }),

  updateRecurringTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      nextGenerationAt: z.date().optional(),
      autoDraft: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRecurringTemplate(id, data as any);
      return { success: true };
    }),

  // ── Ageing Report ──────────────────────────────────────────────────────────

  getAgeingReport: adminProcedure.query(async () => {
    await markOverdueInvoices();
    return getAgeingReport();
  }),

  // ── Activity Log ───────────────────────────────────────────────────────────

  getActivityLog: adminProcedure
    .input(z.object({
      quoteId: z.number().optional(),
      invoiceId: z.number().optional(),
      clientId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return getActivityLog(input);
    }),

  // ── Overdue check ────────────────────────────────────────────────────────────

  markOverdueInvoices: adminProcedure.mutation(async () => {
    const count = await markOverdueInvoices();
    return { count };
  }),

  // ── Dashboard KPIs ─────────────────────────────────────────────────────────

  getDashboardKpis: adminProcedure.query(async () => {
    const [quotes, invoices, clients] = await Promise.all([
      getBillingQuotes(),
      getBillingInvoices(),
      getBillingClients(),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalQuotesValue = quotes.reduce((s, q) => s + q.totalCents, 0);
    const acceptedQuotes = quotes.filter(q => q.status === "accepted" || q.status === "invoiced");
    const conversionRate = quotes.length > 0 ? Math.round((acceptedQuotes.length / quotes.length) * 100) : 0;

    const unpaidInvoices = invoices.filter(i => ["unpaid", "partial", "overdue"].includes(i.status));
    const overdueInvoices = invoices.filter(i => i.status === "overdue");
    const totalOutstanding = unpaidInvoices.reduce((s, i) => s + (i.totalCents - (i.paidCents ?? 0)), 0);
    const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.totalCents - (i.paidCents ?? 0)), 0);

    const paidThisMonth = invoices
      .filter(i => i.paidAt && new Date(i.paidAt) >= startOfMonth)
      .reduce((s, i) => s + (i.paidCents ?? 0), 0);

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === "active").length,
      totalQuotes: quotes.length,
      draftQuotes: quotes.filter(q => q.status === "draft").length,
      sentQuotes: quotes.filter(q => ["sent", "viewed"].includes(q.status)).length,
      acceptedQuotes: acceptedQuotes.length,
      conversionRate,
      totalQuotesValueCents: totalQuotesValue,
      totalInvoices: invoices.length,
      totalOutstandingCents: totalOutstanding,
      totalOverdueCents: totalOverdue,
      overdueCount: overdueInvoices.length,
      paidThisMonthCents: paidThisMonth,
    };
  }),
});

// ─── Email template helpers ───────────────────────────────────────────────────

function formatCurrency(cents: number, currency: string): string {
  const symbols: Record<string, string> = { ZAR: "R", USD: "$", EUR: "€" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

function buildQuoteEmailHtml(opts: {
  recipientName: string;
  quoteNumber: string;
  title: string;
  totalCents: number;
  currency: string;
  expiresAt?: Date | null;
  message?: string;
  quoteUrl: string;
  trackingPixelUrl: string;
}): string {
  const expiryLine = opts.expiresAt
    ? `<p style="color:#6b7280;font-size:14px;">This quote expires on <strong>${new Date(opts.expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>`
    : "";
  return `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f9fafb;margin:0;padding:32px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
  <div style="margin-bottom:32px;"><span style="font-size:22px;font-weight:700;color:#0f172a;">CuraLive</span></div>
  <h2 style="color:#0f172a;margin-bottom:8px;">Quote ${opts.quoteNumber}</h2>
  <p style="color:#374151;margin-bottom:4px;">Dear ${opts.recipientName},</p>
  ${opts.message ? `<p style="color:#374151;">${opts.message}</p>` : `<p style="color:#374151;">Please find your quote attached below.</p>`}
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">Quote</p>
    <p style="margin:0 0 12px;font-weight:600;color:#0f172a;font-size:16px;">${opts.title}</p>
    <p style="margin:0;font-size:28px;font-weight:700;color:#0f172a;">${formatCurrency(opts.totalCents, opts.currency)}</p>
  </div>
  ${expiryLine}
  <a href="${opts.quoteUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-top:8px;">View & Accept Quote</a>
  <p style="color:#9ca3af;font-size:12px;margin-top:32px;">CuraLive · Intelligent Event Intelligence Platform</p>
</div>
<img src="${opts.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
</body></html>`;
}

function buildInvoiceEmailHtml(opts: {
  recipientName: string;
  invoiceNumber: string;
  title: string;
  totalCents: number;
  currency: string;
  dueAt?: Date | null;
  message?: string;
  invoiceUrl: string;
  trackingPixelUrl: string;
}): string {
  const dueDate = opts.dueAt
    ? new Date(opts.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : "30 days from invoice date";
  return `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f9fafb;margin:0;padding:32px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
  <div style="margin-bottom:32px;"><span style="font-size:22px;font-weight:700;color:#0f172a;">CuraLive</span></div>
  <h2 style="color:#0f172a;margin-bottom:8px;">Invoice ${opts.invoiceNumber}</h2>
  <p style="color:#374151;margin-bottom:4px;">Dear ${opts.recipientName},</p>
  ${opts.message ? `<p style="color:#374151;">${opts.message}</p>` : `<p style="color:#374151;">Please find your invoice below. Payment is due within the agreed terms.</p>`}
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">Invoice</p>
    <p style="margin:0 0 12px;font-weight:600;color:#0f172a;font-size:16px;">${opts.title}</p>
    <p style="margin:0;font-size:28px;font-weight:700;color:#0f172a;">${formatCurrency(opts.totalCents, opts.currency)}</p>
    <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Due: <strong style="color:#0f172a;">${dueDate}</strong></p>
  </div>
  <a href="${opts.invoiceUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-top:8px;">View Invoice</a>
  <p style="color:#9ca3af;font-size:12px;margin-top:32px;">CuraLive · Intelligent Event Intelligence Platform</p>
</div>
<img src="${opts.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
</body></html>`;
}
