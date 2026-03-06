/**
 * billingPdf.ts — PDF generation for quotes and invoices
 * Uses Puppeteer with system Chromium to render HTML → PDF
 * Routes:
 *   GET /api/billing/pdf/quote/:token  → quote PDF
 *   GET /api/billing/pdf/invoice/:token → invoice PDF
 */
import { Express } from "express";
import puppeteer from "puppeteer";
import archiver from "archiver";
import { getBillingQuoteByToken, getLineItems, getBillingInvoices } from "./db.billing";
import { getBillingInvoiceByToken, getCreditNotes } from "./db.billing";
import { getBillingClient } from "./db.billing";

// ─── HTML Template ────────────────────────────────────────────────────────────

function formatCurrency(cents: number, currency = "ZAR"): string {
  const amount = cents / 100;
  if (currency === "ZAR") return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function buildQuoteHtml(params: {
  quote: any;
  lineItems: any[];
  client: any;
}): string {
  const { quote, lineItems, client } = params;
  const vatCents = quote.totalCents - (quote.subtotalCents - quote.discountCents);

  const lineItemRows = lineItems.map((li: any) => `
    <tr>
      <td class="desc">${escapeHtml(li.description)}${li.notes ? `<br><span class="notes">${escapeHtml(li.notes)}</span>` : ""}</td>
      <td class="cat">${escapeHtml(li.category)}</td>
      <td class="qty">${li.quantity}</td>
      <td class="price">${formatCurrency(li.unitPriceCents, quote.currency)}</td>
      <td class="total">${formatCurrency(li.totalCents, quote.currency)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quote ${escapeHtml(quote.quoteNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
  .page { padding: 40px 48px; max-width: 800px; margin: 0 auto; }
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon { width: 36px; height: 36px; background: #6366f1; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .brand-icon svg { width: 20px; height: 20px; fill: white; }
  .brand-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .brand-name span { color: #6366f1; }
  .doc-info { text-align: right; }
  .doc-type { font-size: 22px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
  .doc-number { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; font-family: monospace; }
  .doc-status { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  /* Parties */
  .parties { display: flex; gap: 40px; margin-bottom: 28px; }
  .party { flex: 1; }
  .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 6px; }
  .party-name { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
  .party-detail { font-size: 11px; color: #6b7280; line-height: 1.5; }
  /* Title */
  .doc-title { margin-bottom: 24px; }
  .doc-title h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .doc-title p { font-size: 11px; color: #6b7280; }
  /* Meta row */
  .meta-row { display: flex; gap: 24px; margin-bottom: 28px; background: #f9fafb; border-radius: 8px; padding: 12px 16px; }
  .meta-item { flex: 1; }
  .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 3px; }
  .meta-value { font-size: 12px; font-weight: 600; color: #1a1a2e; }
  /* Line items */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #1a1a2e; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  thead th.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td { padding: 9px 10px; vertical-align: top; }
  td.desc { font-weight: 500; }
  td.cat { color: #6b7280; font-size: 10px; }
  td.qty, td.price, td.total { text-align: right; }
  td.total { font-weight: 600; color: #6366f1; }
  .notes { font-size: 10px; color: #9ca3af; font-weight: 400; }
  /* Totals */
  .totals { margin-left: auto; width: 260px; margin-bottom: 28px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
  .totals-row.total { font-size: 14px; font-weight: 700; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 4px; }
  .totals-row.total .amount { color: #6366f1; }
  .totals-row.discount .amount { color: #16a34a; }
  .label { color: #6b7280; }
  /* Notes */
  .notes-section { background: #f9fafb; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px; }
  .notes-section h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
  .notes-section p { font-size: 11px; color: #374151; line-height: 1.6; }
  /* Footer */
  .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 10px; color: #9ca3af; }
  .footer-right { font-size: 10px; color: #9ca3af; text-align: right; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div class="brand-name">Chorus<span>.AI</span></div>
    </div>
    <div class="doc-info">
      <div class="doc-type">Quote</div>
      <div class="doc-number">${escapeHtml(quote.quoteNumber)}</div>
      <div class="doc-status">${escapeHtml(quote.status)}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-name">Chorus.AI</div>
      <div class="party-detail">Intelligent Event Intelligence Platform<br>billing@chorusai.com</div>
    </div>
    <div class="party">
      <div class="party-label">Prepared For</div>
      <div class="party-name">${escapeHtml(client?.companyName ?? "—")}</div>
      <div class="party-detail">
        ${client?.contactName ? escapeHtml(client.contactName) + "<br>" : ""}
        ${client?.contactEmail ? escapeHtml(client.contactEmail) : ""}
      </div>
    </div>
  </div>

  <!-- Title -->
  <div class="doc-title">
    <h1>${escapeHtml(quote.title)}</h1>
    ${quote.description ? `<p>${escapeHtml(quote.description)}</p>` : ""}
  </div>

  <!-- Meta -->
  <div class="meta-row">
    <div class="meta-item">
      <div class="meta-label">Issue Date</div>
      <div class="meta-value">${formatDate(quote.issuedAt ?? quote.createdAt)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Valid Until</div>
      <div class="meta-value">${formatDate(quote.expiresAt)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Payment Terms</div>
      <div class="meta-value">${escapeHtml(quote.paymentTerms ?? "Net 30 days")}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Currency</div>
      <div class="meta-value">${escapeHtml(quote.currency)}</div>
    </div>
  </div>

  <!-- Line Items -->
  <table>
    <thead>
      <tr>
        <th style="width:45%">Description</th>
        <th style="width:15%">Category</th>
        <th class="right" style="width:8%">Qty</th>
        <th class="right" style="width:16%">Unit Price</th>
        <th class="right" style="width:16%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-row">
      <span class="label">Subtotal</span>
      <span class="amount">${formatCurrency(quote.subtotalCents, quote.currency)}</span>
    </div>
    ${quote.discountCents > 0 ? `
    <div class="totals-row discount">
      <span class="label">Discount</span>
      <span class="amount">−${formatCurrency(quote.discountCents, quote.currency)}</span>
    </div>` : ""}
    <div class="totals-row">
      <span class="label">VAT (${quote.taxPercent}%)</span>
      <span class="amount">${formatCurrency(vatCents, quote.currency)}</span>
    </div>
    <div class="totals-row total">
      <span class="label">Total</span>
      <span class="amount">${formatCurrency(quote.totalCents, quote.currency)}</span>
    </div>
  </div>

  ${quote.clientNotes ? `
  <div class="notes-section">
    <h3>Notes</h3>
    <p>${escapeHtml(quote.clientNotes)}</p>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      Chorus.AI · Intelligent Event Intelligence Platform<br>
      billing@chorusai.com
    </div>
    <div class="footer-right">
      This quote is valid until ${formatDate(quote.expiresAt)}<br>
      ${escapeHtml(quote.quoteNumber)}
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildInvoiceHtml(params: {
  invoice: any;
  lineItems: any[];
  client: any;
  creditNotes: any[];
}): string {
  const { invoice, lineItems, client, creditNotes } = params;
  const totalCredits = creditNotes.reduce((s: number, cn: any) => s + cn.totalCents, 0);
  const balanceDue = Math.max(0, invoice.totalCents - invoice.paidCents - totalCredits);

  let bankDetails: Record<string, string> | null = null;
  if (invoice.bankDetails) {
    try { bankDetails = JSON.parse(invoice.bankDetails); } catch { /* ignore */ }
  }

  const lineItemRows = lineItems.map((li: any) => `
    <tr>
      <td class="desc">${escapeHtml(li.description)}${li.notes ? `<br><span class="notes">${escapeHtml(li.notes)}</span>` : ""}</td>
      <td class="cat">${escapeHtml(li.category)}</td>
      <td class="qty">${li.quantity}</td>
      <td class="price">${formatCurrency(li.unitPriceCents, invoice.currency)}</td>
      <td class="total">${formatCurrency(li.totalCents, invoice.currency)}</td>
    </tr>
  `).join("");

  const bankRows = bankDetails
    ? Object.entries(bankDetails).map(([k, v]) => `
      <div class="bank-row">
        <span class="bank-label">${escapeHtml(k.replace(/_/g, " "))}</span>
        <span class="bank-value">${escapeHtml(v)}</span>
      </div>`).join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
  .page { padding: 40px 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon { width: 36px; height: 36px; background: #6366f1; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .brand-icon svg { width: 20px; height: 20px; fill: white; }
  .brand-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .brand-name span { color: #6366f1; }
  .doc-info { text-align: right; }
  .doc-type { font-size: 22px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
  .doc-number { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; font-family: monospace; }
  .doc-status { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .status-paid { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .status-overdue { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .status-default { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .parties { display: flex; gap: 40px; margin-bottom: 28px; }
  .party { flex: 1; }
  .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 6px; }
  .party-name { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
  .party-detail { font-size: 11px; color: #6b7280; line-height: 1.5; }
  .doc-title { margin-bottom: 24px; }
  .doc-title h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .meta-row { display: flex; gap: 24px; margin-bottom: 28px; background: #f9fafb; border-radius: 8px; padding: 12px 16px; }
  .meta-item { flex: 1; }
  .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 3px; }
  .meta-value { font-size: 12px; font-weight: 600; color: #1a1a2e; }
  .meta-value.overdue { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #1a1a2e; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  thead th.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td { padding: 9px 10px; vertical-align: top; }
  td.desc { font-weight: 500; }
  td.cat { color: #6b7280; font-size: 10px; }
  td.qty, td.price, td.total { text-align: right; }
  td.total { font-weight: 600; color: #6366f1; }
  .notes { font-size: 10px; color: #9ca3af; font-weight: 400; }
  .totals { margin-left: auto; width: 260px; margin-bottom: 28px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
  .totals-row.total { font-size: 14px; font-weight: 700; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 4px; }
  .totals-row.total .amount { color: #6366f1; }
  .totals-row.discount .amount { color: #16a34a; }
  .totals-row.balance { font-size: 14px; font-weight: 700; border-top: 2px solid #6366f1; padding-top: 10px; margin-top: 4px; background: #f5f3ff; padding: 10px 8px; border-radius: 6px; }
  .totals-row.balance .amount { color: #6366f1; }
  .label { color: #6b7280; }
  .bank-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
  .bank-section h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 10px; }
  .bank-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  .bank-row:last-child { border-bottom: none; }
  .bank-label { color: #6b7280; text-transform: capitalize; }
  .bank-value { font-weight: 600; font-family: monospace; }
  .ref-highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; margin-top: 8px; display: flex; justify-content: space-between; }
  .ref-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; }
  .ref-value { font-size: 13px; font-weight: 700; font-family: monospace; color: #1d4ed8; }
  .notes-section { background: #f9fafb; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px; }
  .notes-section h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
  .notes-section p { font-size: 11px; color: #374151; line-height: 1.6; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 10px; color: #9ca3af; }
  .footer-right { font-size: 10px; color: #9ca3af; text-align: right; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div class="brand-name">Chorus<span>.AI</span></div>
    </div>
    <div class="doc-info">
      <div class="doc-type">Tax Invoice</div>
      <div class="doc-number">${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="doc-status ${invoice.status === "paid" ? "status-paid" : invoice.status === "overdue" ? "status-overdue" : "status-default"}">${escapeHtml(invoice.status)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-name">Chorus.AI</div>
      <div class="party-detail">Intelligent Event Intelligence Platform<br>billing@chorusai.com</div>
    </div>
    <div class="party">
      <div class="party-label">Billed To</div>
      <div class="party-name">${escapeHtml(client?.companyName ?? "—")}</div>
      <div class="party-detail">
        ${client?.contactName ? escapeHtml(client.contactName) + "<br>" : ""}
        ${client?.contactEmail ? escapeHtml(client.contactEmail) : ""}
      </div>
    </div>
  </div>

  <div class="doc-title"><h1>${escapeHtml(invoice.title)}</h1></div>

  <div class="meta-row">
    <div class="meta-item">
      <div class="meta-label">Issue Date</div>
      <div class="meta-value">${formatDate(invoice.issuedAt ?? invoice.createdAt)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Due Date</div>
      <div class="meta-value ${invoice.status === "overdue" ? "overdue" : ""}">${formatDate(invoice.dueAt)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Payment Terms</div>
      <div class="meta-value">${escapeHtml(invoice.paymentTerms ?? "Net 30 days")}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Currency</div>
      <div class="meta-value">${escapeHtml(invoice.currency)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:45%">Description</th>
        <th style="width:15%">Category</th>
        <th class="right" style="width:8%">Qty</th>
        <th class="right" style="width:16%">Unit Price</th>
        <th class="right" style="width:16%">Total</th>
      </tr>
    </thead>
    <tbody>${lineItemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span class="label">Subtotal</span>
      <span class="amount">${formatCurrency(invoice.subtotalCents, invoice.currency)}</span>
    </div>
    ${invoice.discountCents > 0 ? `
    <div class="totals-row discount">
      <span class="label">Discount</span>
      <span class="amount">−${formatCurrency(invoice.discountCents, invoice.currency)}</span>
    </div>` : ""}
    <div class="totals-row">
      <span class="label">VAT (${invoice.taxPercent}%)</span>
      <span class="amount">${formatCurrency(invoice.taxCents, invoice.currency)}</span>
    </div>
    <div class="totals-row total">
      <span class="label">Invoice Total</span>
      <span class="amount">${formatCurrency(invoice.totalCents, invoice.currency)}</span>
    </div>
    ${totalCredits > 0 ? `
    <div class="totals-row discount">
      <span class="label">Credits Applied</span>
      <span class="amount">−${formatCurrency(totalCredits, invoice.currency)}</span>
    </div>` : ""}
    ${invoice.paidCents > 0 ? `
    <div class="totals-row discount">
      <span class="label">Payments Received</span>
      <span class="amount">−${formatCurrency(invoice.paidCents, invoice.currency)}</span>
    </div>` : ""}
    <div class="totals-row balance">
      <span class="label">Balance Due</span>
      <span class="amount">${formatCurrency(balanceDue, invoice.currency)}</span>
    </div>
  </div>

  ${bankDetails ? `
  <div class="bank-section">
    <h3>Payment Instructions</h3>
    ${bankRows}
    <div class="ref-highlight">
      <span class="ref-label">Payment Reference</span>
      <span class="ref-value">${escapeHtml(invoice.invoiceNumber)}</span>
    </div>
  </div>` : ""}

  ${invoice.clientNotes ? `
  <div class="notes-section">
    <h3>Notes</h3>
    <p>${escapeHtml(invoice.clientNotes)}</p>
  </div>` : ""}

  <div class="footer">
    <div class="footer-left">
      Chorus.AI · Intelligent Event Intelligence Platform<br>
      billing@chorusai.com
    </div>
    <div class="footer-right">
      ${escapeHtml(invoice.invoiceNumber)}<br>
      ${invoice.status === "paid" ? "PAID IN FULL" : `Balance Due: ${formatCurrency(balanceDue, invoice.currency)}`}
    </div>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerBillingPdfRoutes(app: Express) {
  // Quote PDF
  app.get("/api/billing/pdf/quote/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const quote = await getBillingQuoteByToken(token);
      if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
      const lineItems = await getLineItems(quote.id, undefined);
      const client = await getBillingClient(quote.clientId);
      const html = buildQuoteHtml({ quote, lineItems, client });
      const pdf = await htmlToPdf(html);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${quote.quoteNumber}.pdf"`);
      res.send(pdf);
    } catch (err) {
      console.error("[BillingPDF] Quote PDF error:", err);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Bulk Invoice ZIP export — GET /api/billing/pdf/invoices/bulk-zip?status=unpaid&clientId=5
  app.get("/api/billing/pdf/invoices/bulk-zip", async (req, res) => {
    try {
      const { status, clientId } = req.query as Record<string, string>;
      const allInvoices = await getBillingInvoices(
        clientId ? { clientId: parseInt(clientId) } : undefined
      );
      const invoices = status && status !== "all"
        ? allInvoices.filter((inv: any) => inv.status === status)
        : allInvoices;

      if (invoices.length === 0) {
        res.status(404).json({ error: "No invoices found for the given filters" });
        return;
      }

      res.setHeader("Content-Type", "application/zip");
      const label = status && status !== "all" ? status : "all";
      res.setHeader("Content-Disposition", `attachment; filename="invoices-${label}-${Date.now()}.zip"`);

      const zip = archiver("zip", { zlib: { level: 6 } });
      zip.pipe(res);

      for (const invoice of invoices) {
        try {
          const lineItems = await getLineItems(undefined, invoice.id);
          const client = await getBillingClient(invoice.clientId);
          const creditNotes = await getCreditNotes(invoice.id);
          const html = buildInvoiceHtml({ invoice, lineItems, client, creditNotes });
          const pdf = await htmlToPdf(html);
          zip.append(pdf, { name: `${invoice.invoiceNumber}.pdf` });
        } catch (err) {
          console.error(`[BillingPDF] Skipping invoice ${invoice.id}:`, err);
        }
      }

      await zip.finalize();
    } catch (err) {
      console.error("[BillingPDF] Bulk ZIP error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Failed to generate ZIP" });
    }
  });

  // Invoice PDF
  app.get("/api/billing/pdf/invoice/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invoice = await getBillingInvoiceByToken(token);
      if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
      const lineItems = await getLineItems(undefined, invoice.id);
      const client = await getBillingClient(invoice.clientId);
      const creditNotes = await getCreditNotes(invoice.id);
      const html = buildInvoiceHtml({ invoice, lineItems, client, creditNotes });
      const pdf = await htmlToPdf(html);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdf);
    } catch (err) {
      console.error("[BillingPDF] Invoice PDF error:", err);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
}
