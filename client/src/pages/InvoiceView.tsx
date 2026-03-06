/**
 * InvoiceView.tsx — Client-facing invoice view page
 * Accessed via /invoice/:token (no login required)
 * Shows invoice details with payment instructions
 */
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Loader2, AlertTriangle, CheckCircle2, Building2,
  Calendar, Download, Hash, Zap, CreditCard, Copy,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number, currency = "ZAR"): string {
  const amount = cents / 100;
  if (currency === "ZAR") return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${amount.toFixed(2)}`;
}

function statusColor(status: string) {
  switch (status) {
    case "draft": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    case "sent": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "viewed": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    case "partial": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "paid": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "overdue": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "cancelled": return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoiceView() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, error } = trpc.billing.getInvoiceByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground text-sm">
            This invoice link may have expired or is no longer valid. Please contact your account manager for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { invoice, lineItems, client, creditNotes } = data;
  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";
  const totalCredits = creditNotes.reduce((s: number, cn: any) => s + cn.totalCents, 0);

  // Parse bank details if available
  let bankDetails: Record<string, string> | null = null;
  if (invoice.bankDetails) {
    try { bankDetails = JSON.parse(invoice.bankDetails); } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">CuraLive</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/billing/pdf/invoice/${token}`}
              download={`${invoice.invoiceNumber}.pdf`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
            <span className="text-xs text-muted-foreground">Invoice</span>
            <span className="font-mono text-sm font-semibold">{invoice.invoiceNumber}</span>
            <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${statusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Banners */}
        {isPaid && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-400 mb-0.5">Paid in Full</div>
              <div className="text-sm text-muted-foreground">
                Thank you — payment has been received.
                {invoice.paidAt && ` Paid on ${new Date(invoice.paidAt).toLocaleDateString("en-ZA")}.`}
              </div>
            </div>
          </div>
        )}
        {isOverdue && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-400 mb-0.5">Payment Overdue</div>
              <div className="text-sm text-muted-foreground">
                This invoice was due on {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("en-ZA") : "—"}.
                Please arrange payment immediately or contact your account manager.
              </div>
            </div>
          </div>
        )}

        {/* Invoice Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">{invoice.title}</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCurrency(invoice.totalCents, invoice.currency)}</div>
              <div className="text-xs text-muted-foreground mt-1">{invoice.currency} incl. {invoice.taxPercent}% VAT</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Billed to</div>
                <div className="text-sm font-medium">{client?.companyName ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Due Date</div>
                <div className={`text-sm font-medium ${isOverdue ? "text-red-400" : ""}`}>
                  {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "Net 30 days"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Payment Terms</div>
                <div className="text-sm font-medium">{invoice.paymentTerms ?? "Net 30 days"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Services & Charges</h2>
          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-1 text-right">Total</div>
          </div>
          {lineItems.map((li: any) => (
            <div key={li.id} className="grid grid-cols-12 gap-2 items-start py-3 border-b border-border last:border-0">
              <div className="col-span-6">
                <div className="text-sm font-medium">{li.description}</div>
                {li.notes && <div className="text-xs text-muted-foreground mt-0.5">{li.notes}</div>}
              </div>
              <div className="col-span-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{li.category}</span>
              </div>
              <div className="col-span-1 text-center text-sm">{li.quantity}</div>
              <div className="col-span-2 text-right text-sm">{formatCurrency(li.unitPriceCents, invoice.currency)}</div>
              <div className="col-span-1 text-right text-sm font-semibold">{formatCurrency(li.totalCents, invoice.currency)}</div>
            </div>
          ))}
          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotalCents, invoice.currency)}</span>
            </div>
            {invoice.discountCents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-emerald-400">−{formatCurrency(invoice.discountCents, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({invoice.taxPercent}%)</span>
              <span>{formatCurrency(invoice.taxCents, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(invoice.totalCents, invoice.currency)}</span>
            </div>
            {totalCredits > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credits Applied</span>
                <span className="text-amber-400">−{formatCurrency(totalCredits, invoice.currency)}</span>
              </div>
            )}
            {totalCredits > 0 && (
              <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                <span>Balance Due</span>
                <span className={isOverdue ? "text-red-400" : "text-primary"}>
                  {formatCurrency(Math.max(0, invoice.totalCents - invoice.paidCents - totalCredits), invoice.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Credit Notes */}
        {creditNotes.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Credit Notes</h2>
            {creditNotes.map((cn: any) => (
              <div key={cn.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{cn.creditNoteNumber} — {cn.reason}</div>
                  <div className="text-xs text-muted-foreground">{new Date(cn.issuedAt).toLocaleDateString("en-ZA")}</div>
                </div>
                <div className="text-sm font-semibold text-amber-400">−{formatCurrency(cn.totalCents, cn.currency)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Instructions */}
        {!isPaid && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Payment Instructions</h2>
            </div>
            {bankDetails ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Please make payment via EFT using the banking details below. Use your invoice number as the payment reference.
                </p>
                <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                  {Object.entries(bankDetails).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">{value}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied!"); }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Payment Reference</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-primary">{invoice.invoiceNumber}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(invoice.invoiceNumber); toast.success("Copied!"); }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Banking details will be provided by your account manager. Please use <strong className="text-foreground">{invoice.invoiceNumber}</strong> as your payment reference.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Client Notes */}
        {invoice.clientNotes && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Notes</h2>
            <p className="text-sm text-foreground leading-relaxed">{invoice.clientNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Questions? Contact your account manager at <a href="mailto:billing@curalive.com" className="text-primary hover:underline">billing@curalive.com</a></p>
          <p className="mt-1">CuraLive — Intelligent Event Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
