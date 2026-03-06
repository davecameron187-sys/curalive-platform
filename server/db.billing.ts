/**
 * db.billing.ts  Database query helpers for the Enterprise Billing System.
 * All helpers return raw Drizzle rows. Business logic lives in the router.
 */
import { getDb } from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, desc, asc, lt, lte, or, sql } from "drizzle-orm";
import {
  billingClients, billingClientContacts, billingQuotes, billingLineItems,
  billingInvoices, billingPayments, billingCreditNotes, billingFxRates,
  billingActivityLog, billingLineItemTemplates, billingEmailEvents,
  billingRecurringTemplates, billingQuoteVersions,
  type InsertBillingClient, type InsertBillingClientContact,
  type InsertBillingQuote, type InsertBillingLineItem,
  type InsertBillingInvoice, type InsertBillingPayment,
  type InsertBillingCreditNote, type InsertBillingActivityLog,
  type InsertBillingLineItemTemplate, type InsertBillingEmailEvent,
  type InsertBillingRecurringTemplate, type InsertBillingQuoteVersion,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

//  DB helper 

async function requireDb(): Promise<ReturnType<typeof drizzle>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db as ReturnType<typeof drizzle>;
}

//  Helpers 

export function generateAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateQuoteNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `QUO-${year}-${String(seq).padStart(4, "0")}`;
}

export function generateInvoiceNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

export function generateCreditNoteNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `CN-${year}-${String(seq).padStart(4, "0")}`;
}

export function generateTrackingToken(): string {
  return randomBytes(24).toString("hex");
}

async function nextSeq(table: "quote" | "invoice" | "credit_note"): Promise<number> {
  const db = await requireDb();
  if (table === "quote") {
    const [row] = await db.select({ c: sql<number>`COUNT(*)` }).from(billingQuotes);
    return (row?.c ?? 0) + 1;
  }
  if (table === "invoice") {
    const [row] = await db.select({ c: sql<number>`COUNT(*)` }).from(billingInvoices);
    return (row?.c ?? 0) + 1;
  }
  const [row] = await db.select({ c: sql<number>`COUNT(*)` }).from(billingCreditNotes);
  return (row?.c ?? 0) + 1;
}

//  Clients 

export async function getBillingClients() {
  const db = await requireDb();
  return db.select().from(billingClients).orderBy(desc(billingClients.createdAt));
}

export async function getBillingClient(id: number) {
  const db = await requireDb();
  const [client] = await db.select().from(billingClients).where(eq(billingClients.id, id));
  return client ?? null;
}

export async function createBillingClient(data: InsertBillingClient) {
  const db = await requireDb();
  const [result] = await db.insert(billingClients).values(data);
  return (result as any).insertId as number;
}

export async function updateBillingClient(id: number, data: Partial<InsertBillingClient>) {
  const db = await requireDb();
  await db.update(billingClients).set(data).where(eq(billingClients.id, id));
}

//  Client Contacts 

export async function getClientContacts(clientId: number) {
  const db = await requireDb();
  return db.select().from(billingClientContacts)
    .where(eq(billingClientContacts.clientId, clientId))
    .orderBy(desc(billingClientContacts.isPrimary), asc(billingClientContacts.name));
}

export async function createClientContact(data: InsertBillingClientContact) {
  const db = await requireDb();
  const [result] = await db.insert(billingClientContacts).values(data);
  return (result as any).insertId as number;
}

export async function updateClientContact(id: number, data: Partial<InsertBillingClientContact>) {
  const db = await requireDb();
  await db.update(billingClientContacts).set(data).where(eq(billingClientContacts.id, id));
}

export async function deleteClientContact(id: number) {
  const db = await requireDb();
  await db.delete(billingClientContacts).where(eq(billingClientContacts.id, id));
}

//  Quotes 

export async function getBillingQuotes(filters?: { clientId?: number }) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: billingQuotes.id,
      quoteNumber: billingQuotes.quoteNumber,
      clientId: billingQuotes.clientId,
      title: billingQuotes.title,
      description: billingQuotes.description,
      subtotalCents: billingQuotes.subtotalCents,
      discountCents: billingQuotes.discountCents,
      taxPercent: billingQuotes.taxPercent,
      totalCents: billingQuotes.totalCents,
      currency: billingQuotes.currency,
      status: billingQuotes.status,
      issuedAt: billingQuotes.issuedAt,
      expiresAt: billingQuotes.expiresAt,
      acceptedAt: billingQuotes.acceptedAt,
      accessToken: billingQuotes.accessToken,
      paymentTerms: billingQuotes.paymentTerms,
      internalNotes: billingQuotes.internalNotes,
      clientNotes: billingQuotes.clientNotes,
      createdAt: billingQuotes.createdAt,
      updatedAt: billingQuotes.updatedAt,
      clientName: billingClients.companyName,
      contactEmail: billingClients.contactEmail,
    })
    .from(billingQuotes)
    .leftJoin(billingClients, eq(billingQuotes.clientId, billingClients.id))
    .where(filters?.clientId ? eq(billingQuotes.clientId, filters.clientId) : undefined)
    .orderBy(desc(billingQuotes.createdAt));
  return rows;
}

export async function getBillingQuote(id: number) {
  const db = await requireDb();
  const [quote] = await db.select().from(billingQuotes).where(eq(billingQuotes.id, id));
  return quote ?? null;
}

export async function getBillingQuoteByToken(token: string) {
  const db = await requireDb();
  const [quote] = await db.select().from(billingQuotes).where(eq(billingQuotes.accessToken, token));
  return quote ?? null;
}

export async function createBillingQuote(data: Omit<InsertBillingQuote, "quoteNumber" | "accessToken">) {
  const db = await requireDb();
  const seq = await nextSeq("quote");
  const quoteNumber = generateQuoteNumber(seq);
  const accessToken = generateAccessToken();
  const [result] = await db.insert(billingQuotes).values({ ...data, quoteNumber, accessToken });
  return { id: (result as any).insertId as number, quoteNumber, accessToken };
}

export async function updateBillingQuote(id: number, data: Partial<InsertBillingQuote>) {
  const db = await requireDb();
  await db.update(billingQuotes).set(data).where(eq(billingQuotes.id, id));
}

//  Quote Versions 

export async function getQuoteVersions(quoteId: number) {
  const db = await requireDb();
  return db.select().from(billingQuoteVersions)
    .where(eq(billingQuoteVersions.quoteId, quoteId))
    .orderBy(desc(billingQuoteVersions.versionNumber));
}

export async function createQuoteVersion(data: InsertBillingQuoteVersion) {
  const db = await requireDb();
  const [result] = await db.insert(billingQuoteVersions).values(data);
  return (result as any).insertId as number;
}

//  Line Items 

export async function getLineItems(quoteId?: number, invoiceId?: number) {
  const db = await requireDb();
  if (quoteId) {
    return db.select().from(billingLineItems)
      .where(eq(billingLineItems.quoteId, quoteId))
      .orderBy(asc(billingLineItems.sortOrder));
  }
  if (invoiceId) {
    return db.select().from(billingLineItems)
      .where(eq(billingLineItems.invoiceId, invoiceId))
      .orderBy(asc(billingLineItems.sortOrder));
  }
  return [];
}

export async function upsertLineItems(
  items: Array<Omit<InsertBillingLineItem, "id">>,
  quoteId?: number,
  invoiceId?: number
) {
  const db = await requireDb();
  if (quoteId) {
    await db.delete(billingLineItems).where(eq(billingLineItems.quoteId, quoteId));
  } else if (invoiceId) {
    await db.delete(billingLineItems).where(eq(billingLineItems.invoiceId, invoiceId));
  }
  if (items.length === 0) return;
  await db.insert(billingLineItems).values(items.map((item, i) => ({
    ...item,
    quoteId: quoteId ?? null,
    invoiceId: invoiceId ?? null,
    sortOrder: i,
  })));
}

//  Invoices 

export async function getBillingInvoices(filters?: { clientId?: number }) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: billingInvoices.id,
      invoiceNumber: billingInvoices.invoiceNumber,
      clientId: billingInvoices.clientId,
      quoteId: billingInvoices.quoteId,
      title: billingInvoices.title,
      subtotalCents: billingInvoices.subtotalCents,
      discountCents: billingInvoices.discountCents,
      taxPercent: billingInvoices.taxPercent,
      taxCents: billingInvoices.taxCents,
      totalCents: billingInvoices.totalCents,
      paidCents: billingInvoices.paidCents,
      currency: billingInvoices.currency,
      status: billingInvoices.status,
      issuedAt: billingInvoices.issuedAt,
      dueAt: billingInvoices.dueAt,
      paidAt: billingInvoices.paidAt,
      accessToken: billingInvoices.accessToken,
      bankDetails: billingInvoices.bankDetails,
      internalNotes: billingInvoices.internalNotes,
      clientNotes: billingInvoices.clientNotes,
      createdAt: billingInvoices.createdAt,
      updatedAt: billingInvoices.updatedAt,
      clientName: billingClients.companyName,
    })
    .from(billingInvoices)
    .leftJoin(billingClients, eq(billingInvoices.clientId, billingClients.id))
    .where(filters?.clientId ? eq(billingInvoices.clientId, filters.clientId) : undefined)
    .orderBy(desc(billingInvoices.createdAt));
  return rows;
}

export async function getBillingInvoice(id: number) {
  const db = await requireDb();
  const [inv] = await db.select().from(billingInvoices).where(eq(billingInvoices.id, id));
  return inv ?? null;
}

export async function getBillingInvoiceByToken(token: string) {
  const db = await requireDb();
  const [inv] = await db.select().from(billingInvoices).where(eq(billingInvoices.accessToken, token));
  return inv ?? null;
}

export async function createBillingInvoice(data: Omit<InsertBillingInvoice, "invoiceNumber" | "accessToken">) {
  const db = await requireDb();
  const seq = await nextSeq("invoice");
  const invoiceNumber = generateInvoiceNumber(seq);
  const accessToken = generateAccessToken();
  const [result] = await db.insert(billingInvoices).values({ ...data, invoiceNumber, accessToken });
  return { id: (result as any).insertId as number, invoiceNumber, accessToken };
}

export async function updateBillingInvoice(id: number, data: Partial<InsertBillingInvoice>) {
  const db = await requireDb();
  await db.update(billingInvoices).set(data).where(eq(billingInvoices.id, id));
}

//  Payments 

export async function getPayments(invoiceId: number) {
  const db = await requireDb();
  return db.select().from(billingPayments)
    .where(eq(billingPayments.invoiceId, invoiceId))
    .orderBy(desc(billingPayments.paidAt));
}

export async function recordPayment(data: InsertBillingPayment) {
  const db = await requireDb();
  const [result] = await db.insert(billingPayments).values(data);
  const payments = await getPayments(data.invoiceId);
  const paidCents = payments.reduce((s: number, p: { amountCents: number }) => s + p.amountCents, 0);
  const invoice = await getBillingInvoice(data.invoiceId);
  if (invoice) {
    const newStatus = paidCents >= invoice.totalCents ? "paid" : "partial";
    await updateBillingInvoice(data.invoiceId, {
      paidCents,
      status: newStatus as "paid" | "partial",
      paidAt: newStatus === "paid" ? new Date() : undefined,
    });
  }
  return (result as any).insertId as number;
}

//  Credit Notes 

export async function getCreditNotes(invoiceId: number) {
  const db = await requireDb();
  return db.select().from(billingCreditNotes)
    .where(eq(billingCreditNotes.invoiceId, invoiceId))
    .orderBy(desc(billingCreditNotes.createdAt));
}

export async function createCreditNote(data: Omit<InsertBillingCreditNote, "creditNoteNumber" | "accessToken">) {
  const db = await requireDb();
  const seq = await nextSeq("credit_note");
  const creditNoteNumber = generateCreditNoteNumber(seq);
  const accessToken = generateAccessToken();
  const [result] = await db.insert(billingCreditNotes).values({ ...data, creditNoteNumber, accessToken });
  return { id: (result as any).insertId as number, creditNoteNumber, accessToken };
}

export async function updateCreditNote(id: number, data: Partial<InsertBillingCreditNote>) {
  const db = await requireDb();
  await db.update(billingCreditNotes).set(data).where(eq(billingCreditNotes.id, id));
}

//  Activity Log 

export async function logBillingActivity(data: InsertBillingActivityLog) {
  const db = await requireDb();
  await db.insert(billingActivityLog).values(data);
}

export async function getActivityLog(
  filters: { quoteId?: number; invoiceId?: number; clientId?: number },
  limit = 50
) {
  const db = await requireDb();
  if (filters.quoteId) {
    return db.select().from(billingActivityLog)
      .where(eq(billingActivityLog.quoteId, filters.quoteId))
      .orderBy(desc(billingActivityLog.createdAt)).limit(limit);
  }
  if (filters.invoiceId) {
    return db.select().from(billingActivityLog)
      .where(eq(billingActivityLog.invoiceId, filters.invoiceId))
      .orderBy(desc(billingActivityLog.createdAt)).limit(limit);
  }
  if (filters.clientId) {
    return db.select().from(billingActivityLog)
      .where(eq(billingActivityLog.clientId, filters.clientId))
      .orderBy(desc(billingActivityLog.createdAt)).limit(limit);
  }
  return db.select().from(billingActivityLog).orderBy(desc(billingActivityLog.createdAt)).limit(limit);
}

//  Line Item Templates 

export async function getLineItemTemplates() {
  const db = await requireDb();
  return db.select().from(billingLineItemTemplates)
    .where(eq(billingLineItemTemplates.isActive, true))
    .orderBy(desc(billingLineItemTemplates.usageCount));
}

export async function createLineItemTemplate(data: InsertBillingLineItemTemplate) {
  const db = await requireDb();
  const [result] = await db.insert(billingLineItemTemplates).values(data);
  return (result as any).insertId as number;
}

export async function updateLineItemTemplate(id: number, data: Partial<InsertBillingLineItemTemplate>) {
  const db = await requireDb();
  await db.update(billingLineItemTemplates).set(data).where(eq(billingLineItemTemplates.id, id));
}

export async function incrementTemplateUsage(id: number) {
  const db = await requireDb();
  await db.update(billingLineItemTemplates)
    .set({ usageCount: sql`usage_count + 1` })
    .where(eq(billingLineItemTemplates.id, id));
}

//  FX Rates 

export async function getLatestFxRates(): Promise<Array<{ id: string; baseCurrency: string; targetCurrency: string; rate: string }>> {
  const db = await requireDb();
  const pairs = [
    { base: "ZAR", target: "USD" },
    { base: "ZAR", target: "EUR" },
    { base: "USD", target: "ZAR" },
    { base: "EUR", target: "ZAR" },
    { base: "USD", target: "EUR" },
    { base: "EUR", target: "USD" },
  ];
  const results: Array<{ id: string; baseCurrency: string; targetCurrency: string; rate: string }> = [];
  for (const pair of pairs) {
    const [row] = await db.select().from(billingFxRates)
      .where(and(
        eq(billingFxRates.baseCurrency, pair.base),
        eq(billingFxRates.targetCurrency, pair.target)
      ))
      .orderBy(desc(billingFxRates.fetchedAt))
      .limit(1);
    if (row) results.push({ id: `${pair.base}_${pair.target}`, baseCurrency: pair.base, targetCurrency: pair.target, rate: row.rate });
  }
  return results;
}

export async function upsertFxRate(base: string, target: string, rate: string) {
  const db = await requireDb();
  await db.insert(billingFxRates).values({ baseCurrency: base, targetCurrency: target, rate, source: "exchangerate-api" });
}

//  Email Events 

export async function createEmailEvent(data: InsertBillingEmailEvent) {
  const db = await requireDb();
  const [result] = await db.insert(billingEmailEvents).values(data);
  return (result as any).insertId as number;
}

export async function recordEmailOpen(trackingToken: string, ip: string, userAgent: string) {
  const db = await requireDb();
  const [event] = await db.select().from(billingEmailEvents)
    .where(eq(billingEmailEvents.trackingToken, trackingToken));
  if (!event) return null;
  const now = new Date();
  await db.update(billingEmailEvents)
    .set({
      openCount: sql`open_count + 1`,
      firstOpenedAt: event.firstOpenedAt ?? now,
      lastOpenedAt: now,
      lastOpenIp: ip,
      lastOpenUserAgent: userAgent,
    })
    .where(eq(billingEmailEvents.trackingToken, trackingToken));
  return event;
}

export async function getEmailEvents(filters: { quoteId?: number; invoiceId?: number }) {
  const db = await requireDb();
  if (filters.quoteId) {
    return db.select().from(billingEmailEvents)
      .where(eq(billingEmailEvents.quoteId, filters.quoteId))
      .orderBy(desc(billingEmailEvents.sentAt));
  }
  if (filters.invoiceId) {
    return db.select().from(billingEmailEvents)
      .where(eq(billingEmailEvents.invoiceId, filters.invoiceId))
      .orderBy(desc(billingEmailEvents.sentAt));
  }
  return [];
}

//  Recurring Templates 

export async function getRecurringTemplates() {
  const db = await requireDb();
  return db.select().from(billingRecurringTemplates)
    .where(eq(billingRecurringTemplates.isActive, true))
    .orderBy(asc(billingRecurringTemplates.nextGenerationAt));
}

export async function createRecurringTemplate(data: InsertBillingRecurringTemplate) {
  const db = await requireDb();
  const [result] = await db.insert(billingRecurringTemplates).values(data);
  return (result as any).insertId as number;
}

export async function updateRecurringTemplate(id: number, data: Partial<InsertBillingRecurringTemplate>) {
  const db = await requireDb();
  await db.update(billingRecurringTemplates).set(data).where(eq(billingRecurringTemplates.id, id));
}

export async function getDueRecurringTemplates() {
  const db = await requireDb();
  const now = new Date();
  return db.select().from(billingRecurringTemplates)
    .where(and(
      eq(billingRecurringTemplates.isActive, true),
      lte(billingRecurringTemplates.nextGenerationAt, now)
    ));
}

//  Ageing Report 

export async function getAgeingReport() {
  const db = await requireDb();
  const now = new Date();
  const invoices = await db.select().from(billingInvoices)
    .where(or(
      eq(billingInvoices.status, "unpaid"),
      eq(billingInvoices.status, "partial"),
      eq(billingInvoices.status, "overdue")
    ));

  return (invoices as any[]).map((inv: any) => {
    const dueAt = inv.dueAt ? new Date(inv.dueAt) : null;
    const daysOverdue = dueAt ? Math.floor((now.getTime() - dueAt.getTime()) / 86400000) : 0;
    const outstanding = inv.totalCents - (inv.paidCents ?? 0);
    let bucket: "current" | "1_30" | "31_60" | "61_90" | "over_90";
    if (!dueAt || daysOverdue <= 0) bucket = "current";
    else if (daysOverdue <= 30) bucket = "1_30";
    else if (daysOverdue <= 60) bucket = "31_60";
    else if (daysOverdue <= 90) bucket = "61_90";
    else bucket = "over_90";
    return { ...inv, daysOverdue, outstanding, bucket };
  });
}

//  Overdue Detection 

export async function markOverdueInvoices(): Promise<number> {
  const db = await requireDb();
  const now = new Date();
  // Find overdue invoices first to get count
  const overdue = await db.select({ id: billingInvoices.id })
    .from(billingInvoices)
    .where(and(
      eq(billingInvoices.status, "unpaid"),
      lt(billingInvoices.dueAt, now)
    ));
  if (overdue.length > 0) {
    await db.update(billingInvoices)
      .set({ status: "overdue" })
      .where(and(
        eq(billingInvoices.status, "unpaid"),
        lt(billingInvoices.dueAt, now)
      ));
  }
  return overdue.length;
}

//  Convert Quote to Invoice 

export async function convertQuoteToInvoice(quoteId: number, createdByUserId: number) {
  const quote = await getBillingQuote(quoteId);
  if (!quote) throw new Error("Quote not found");
  const lineItems = await getLineItems(quoteId);

  const client = await getBillingClient(quote.clientId);
  const termsDays = client?.paymentTermsDays ?? 30;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + termsDays);

  const { id: invoiceId, invoiceNumber, accessToken } = await createBillingInvoice({
    clientId: quote.clientId,
    quoteId: quote.id,
    title: quote.title,
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    taxPercent: quote.taxPercent,
    taxCents: Math.round((quote.subtotalCents - quote.discountCents) * quote.taxPercent / 100),
    totalCents: quote.totalCents,
    paidCents: 0,
    currency: quote.currency,
    status: "draft",
    issuedAt: new Date(),
    dueAt,
    paymentTerms: quote.paymentTerms ?? `Payment due ${termsDays} days from invoice date`,
    clientNotes: quote.clientNotes ?? undefined,
    createdByUserId,
  });

  await upsertLineItems(
    (lineItems as any[]).map((item: any) => ({
      description: item.description,
      category: item.category ?? "Event Fee",
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
      sortOrder: item.sortOrder ?? 0,
    })),
    undefined,
    invoiceId
  );

  await updateBillingQuote(quoteId, { status: "invoiced" });

  return { invoiceId, invoiceNumber, accessToken };
}
