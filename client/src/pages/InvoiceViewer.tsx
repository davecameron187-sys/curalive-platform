/**
 * InvoiceViewer.tsx — CuraLive Enterprise Invoice Viewer
 *
 * Features:
 *  - Full invoice detail with line items
 *  - Payment recording (EFT, bank transfer, etc.)
 *  - Credit note creation
 *  - Activity log
 *  - Send invoice to client
 *  - Status management
 */
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronRight, Send, Loader2, CheckCircle2, AlertTriangle,
  FileText, DollarSign, CreditCard, Activity, Plus, X,
  Clock, Receipt, Building2, Calendar, Hash,
} from "lucide-react";

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

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  invoiceId, currency, onClose, onSuccess,
}: {
  invoiceId: number; currency: string; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"eft" | "bank_transfer" | "cheque" | "credit_card" | "other">("eft");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const utils = trpc.useUtils();

  const recordPaymentMutation = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      utils.billing.getInvoice.invalidate({ id: invoiceId });
      onSuccess();
    },
  });

  const handleSubmit = async () => {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (amountCents <= 0) { toast.error("Enter a valid payment amount"); return; }
    setSaving(true);
    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId,
        amountCents,
        paymentMethod: method,
        reference: reference || undefined,
        paidAt: new Date(paidAt),
        notes: notes || undefined,
      });
      toast.success("Payment recorded");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">Record Payment</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount ({currency}) *</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-background"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as typeof method)}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
            >
              <option value="eft">EFT</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reference / Proof of Payment</label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. POP-2026-001"
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Date</label>
            <Input
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Credit Note Modal ────────────────────────────────────────────────────────

function CreditNoteModal({
  invoiceId, currency, onClose, onSuccess,
}: {
  invoiceId: number; currency: string; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const utils = trpc.useUtils();

  const createCreditNoteMutation = trpc.billing.createCreditNote.useMutation({
    onSuccess: () => {
      utils.billing.getInvoice.invalidate({ id: invoiceId });
      onSuccess();
    },
  });

  const handleSubmit = async () => {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (amountCents <= 0) { toast.error("Enter a valid credit amount"); return; }
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSaving(true);
    try {
      const result = await createCreditNoteMutation.mutateAsync({
        invoiceId,
        amountCents,
        reason,
        notes: notes || undefined,
      });
      toast.success(`Credit note ${result.creditNoteNumber} issued`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create credit note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-lg">Issue Credit Note</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Credit Amount ({currency}) *</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-background"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">15% VAT will be applied automatically</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reason *</label>
            <Input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Event cancelled, duplicate charge, etc."
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Internal Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes..."
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            Issue Credit Note
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Invoice Modal ───────────────────────────────────────────────────────

function SendInvoiceModal({
  invoiceId, defaultEmail, defaultName, onClose, onSuccess,
}: {
  invoiceId: number; defaultEmail: string; defaultName: string;
  onClose: () => void; onSuccess: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const utils = trpc.useUtils();

  const sendMutation = trpc.billing.sendInvoice.useMutation({
    onSuccess: () => { utils.billing.getInvoice.invalidate({ id: invoiceId }); onSuccess(); },
  });

  const handleSend = async () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    setSending(true);
    try {
      await sendMutation.mutateAsync({
        id: invoiceId,
        recipientEmail: email,
        recipientName: name,
        message: message || undefined,
        origin: window.location.origin,
      });
      toast.success(`Invoice sent to ${email}`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Send Invoice</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient Email *</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Custom Message (optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal message to the invoice email..."
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSend} disabled={sending} className="flex-1 gap-1.5">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoiceViewer() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const invoiceId = parseInt(params.id);

  const { user, loading: authLoading } = useAuth();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const { data, isLoading, refetch } = trpc.billing.getInvoice.useQuery(
    { id: invoiceId },
    { enabled: !!user && !isNaN(invoiceId) }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-muted-foreground">Invoice not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/billing")}>
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  const { invoice, lineItems, payments, creditNotes, activity } = data;
  const totalPaid = payments.reduce((s: number, p: any) => s + p.amountCents, 0);
  const totalCredits = creditNotes.reduce((s: number, cn: any) => s + cn.totalCents, 0);
  const balance = invoice.totalCents - totalPaid - totalCredits;
  const client = (data as any).client;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Modals */}
      {showPaymentModal && (
        <RecordPaymentModal
          invoiceId={invoiceId}
          currency={invoice.currency}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { setShowPaymentModal(false); refetch(); }}
        />
      )}
      {showCreditModal && (
        <CreditNoteModal
          invoiceId={invoiceId}
          currency={invoice.currency}
          onClose={() => setShowCreditModal(false)}
          onSuccess={() => { setShowCreditModal(false); refetch(); }}
        />
      )}
      {showSendModal && (
        <SendInvoiceModal
          invoiceId={invoiceId}
          defaultEmail={client?.contactEmail ?? ""}
          defaultName={client?.contactName ?? ""}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => { setShowSendModal(false); refetch(); }}
        />
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/billing")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">Invoice</span>
              <span className="text-sm text-muted-foreground font-mono">· {invoice.invoiceNumber}</span>
            </div>
            <Badge className={`text-[10px] border ${statusColor(invoice.status)}`}>
              {invoice.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => window.open(`/invoice/${invoice.accessToken}`, "_blank")}
              className="gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Client View
            </Button>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowSendModal(true)} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
                <Button size="sm" onClick={() => setShowPaymentModal(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <DollarSign className="w-3.5 h-3.5" /> Record Payment
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ── Main Content ── */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Invoice Header */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold mb-1">{invoice.title}</h1>
                  {invoice.internalNotes && (
                    <p className="text-sm text-muted-foreground">{invoice.internalNotes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(invoice.totalCents, invoice.currency)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {invoice.currency} · {invoice.taxPercent}% VAT
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Client</div>
                    <div className="text-sm font-medium">{client?.companyName ?? "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Due Date</div>
                    <div className="text-sm font-medium">
                      {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("en-ZA") : "30 days"}
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
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Line Items</h2>
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {lineItems.map((li: any) => (
                <div key={li.id} className="grid grid-cols-12 gap-2 items-start py-3 border-b border-border last:border-0">
                  <div className="col-span-5">
                    <div className="text-sm font-medium">{li.description}</div>
                    {li.notes && <div className="text-xs text-muted-foreground mt-0.5">{li.notes}</div>}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{li.category}</span>
                  </div>
                  <div className="col-span-1 text-center text-sm">{li.quantity}</div>
                  <div className="col-span-2 text-right text-sm">{formatCurrency(li.unitPriceCents, invoice.currency)}</div>
                  <div className="col-span-2 text-right text-sm font-semibold text-primary">{formatCurrency(li.totalCents, invoice.currency)}</div>
                </div>
              ))}
              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
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
              </div>
            </div>

            {/* Payments */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payments</h2>
                {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                  <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(true)} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Record Payment
                  </Button>
                )}
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{formatCurrency(p.amountCents, p.currency)}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.paymentMethod.replace("_", " ")} · {new Date(p.paidAt).toLocaleDateString("en-ZA")}
                            {p.reference && ` · ${p.reference}`}
                          </div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Credit Notes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Credit Notes</h2>
                {invoice.status !== "cancelled" && (
                  <Button variant="outline" size="sm" onClick={() => setShowCreditModal(true)} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Issue Credit Note
                  </Button>
                )}
              </div>
              {creditNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No credit notes issued.</p>
              ) : (
                <div className="space-y-2">
                  {creditNotes.map((cn: any) => (
                    <div key={cn.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{cn.creditNoteNumber} — {formatCurrency(cn.totalCents, cn.currency)}</div>
                          <div className="text-xs text-muted-foreground">{cn.reason}</div>
                        </div>
                      </div>
                      <Badge className="text-[10px] border bg-amber-500/20 text-amber-400 border-amber-500/30">{cn.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Activity Log</h2>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {activity.map((entry: any) => (
                    <div key={entry.id} className="flex gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <span className="text-foreground">{entry.description}</span>
                        <div className="text-muted-foreground mt-0.5">
                          {entry.userName && <span>{entry.userName} · </span>}
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Balance Summary */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Payment Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-medium">{formatCurrency(invoice.totalCents, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-emerald-400">{formatCurrency(totalPaid, invoice.currency)}</span>
                </div>
                {totalCredits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-medium text-amber-400">{formatCurrency(totalCredits, invoice.currency)}</span>
                  </div>
                )}
                <div className={`flex justify-between border-t border-border pt-2 font-bold ${balance <= 0 ? "text-emerald-400" : balance > 0 && invoice.status === "overdue" ? "text-red-400" : ""}`}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(Math.max(0, balance), invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            {invoice.status === "overdue" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-red-400 mb-0.5">Overdue</div>
                  <div className="text-muted-foreground">
                    This invoice was due on {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("en-ZA") : "—"}.
                  </div>
                </div>
              </div>
            )}
            {invoice.status === "paid" && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-emerald-400 mb-0.5">Paid in Full</div>
                  <div className="text-muted-foreground">All payments received.</div>
                </div>
              </div>
            )}

            {/* Invoice Metadata */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{invoice.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(invoice.createdAt).toLocaleDateString("en-ZA")}</span>
                </div>
                {invoice.issuedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued</span>
                    <span>{new Date(invoice.issuedAt).toLocaleDateString("en-ZA")}</span>
                  </div>
                )}
                {invoice.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-emerald-400">{new Date(invoice.paidAt).toLocaleDateString("en-ZA")}</span>
                  </div>
                )}
                {invoice.quoteId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From Quote</span>
                    <button
                      onClick={() => navigate(`/admin/billing/quotes/${invoice.quoteId}`)}
                      className="text-primary hover:underline font-medium"
                    >
                      View Quote
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Email History */}
            {(data as any).emails && (data as any).emails.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Email History</span>
                </div>
                <div className="space-y-2">
                  {(data as any).emails.map((e: any) => (
                    <div key={e.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{e.emailType.replace("_", " ")}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${e.openedAt ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                          {e.openedAt ? "Opened" : "Sent"}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        {e.recipientEmail} · {new Date(e.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
