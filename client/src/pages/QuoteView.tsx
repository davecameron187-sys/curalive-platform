/**
 * QuoteView.tsx — Client-facing quote view page
 * Accessed via /quote/:token (no login required)
 * Allows client to view quote details and accept it
 */
import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, AlertTriangle, FileText, Building2,
  Calendar, Download, Hash, X, Zap,
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
    case "accepted": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "declined": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "invoiced": return "bg-primary/20 text-primary border-primary/30";
    case "expired": return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

// ─── Accept Modal ─────────────────────────────────────────────────────────────

function AcceptModal({
  token, quoteNumber, onClose, onSuccess,
}: {
  token: string; quoteNumber: string; onClose: () => void; onSuccess: () => void;
}) {
  const [signerName, setSignerName] = useState("");
  const [accepting, setAccepting] = useState(false);
  const utils = trpc.useUtils();

  const acceptMutation = trpc.billing.acceptQuote.useMutation({
    onSuccess: () => { utils.billing.getQuoteByToken.invalidate({ token }); onSuccess(); },
  });

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptMutation.mutateAsync({ token, signerName: signerName || undefined });
      toast.success("Quote accepted! Our team will be in touch shortly.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to accept quote");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">Accept Quote</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          By accepting quote <strong className="text-foreground">{quoteNumber}</strong>, you confirm your agreement to the services and pricing outlined above.
        </p>
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Name (optional)</label>
          <Input
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
            placeholder="e.g. Jane Smith, CFO"
            className="bg-background"
            autoFocus
          />
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-5 text-xs text-emerald-400">
          Our team will contact you within 1 business day to confirm next steps and arrange invoicing.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAccept} disabled={accepting} className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accept Quote
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteView() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const { data, isLoading, error } = trpc.billing.getQuoteByToken.useQuery(
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
          <h1 className="text-xl font-bold mb-2">Quote Not Found</h1>
          <p className="text-muted-foreground text-sm">
            This quote link may have expired or is no longer valid. Please contact your account manager for assistance.
          </p>
        </div>
      </div>
    );
  }

  const { quote, lineItems, client } = data;
  const isExpired = quote.status === "expired";
  const isAccepted = accepted || quote.status === "accepted" || quote.status === "invoiced";
  const canAccept = !isExpired && !isAccepted && quote.status !== "declined";
  const daysUntilExpiry = quote.expiresAt
    ? Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {showAcceptModal && (
        <AcceptModal
          token={token}
          quoteNumber={quote.quoteNumber}
          onClose={() => setShowAcceptModal(false)}
          onSuccess={() => { setShowAcceptModal(false); setAccepted(true); }}
        />
      )}

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
              href={`/api/billing/pdf/quote/${token}`}
              download={`${quote.quoteNumber}.pdf`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
            <span className="text-xs text-muted-foreground">Quote</span>
            <span className="font-mono text-sm font-semibold">{quote.quoteNumber}</span>
            <Badge className={`text-[10px] border ${statusColor(quote.status)}`}>{quote.status}</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Banners */}
        {isAccepted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-400 mb-0.5">Quote Accepted</div>
              <div className="text-sm text-muted-foreground">
                Thank you! Our team will be in touch within 1 business day to confirm next steps.
                {quote.acceptedAt && ` Accepted on ${new Date(quote.acceptedAt).toLocaleDateString("en-ZA")}.`}
              </div>
            </div>
          </div>
        )}
        {isExpired && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-400 mb-0.5">Quote Expired</div>
              <div className="text-sm text-muted-foreground">
                This quote has expired. Please contact your account manager for an updated quote.
              </div>
            </div>
          </div>
        )}
        {daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7 && !isExpired && !isAccepted && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-400 mb-0.5">Expiring Soon</div>
              <div className="text-sm text-muted-foreground">
                This quote expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. Accept before it expires.
              </div>
            </div>
          </div>
        )}

        {/* Quote Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">{quote.title}</h1>
              {quote.description && (
                <p className="text-muted-foreground">{quote.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCurrency(quote.totalCents, quote.currency)}</div>
              <div className="text-xs text-muted-foreground mt-1">{quote.currency} incl. {quote.taxPercent}% VAT</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Prepared for</div>
                <div className="text-sm font-medium">{client?.companyName ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Valid Until</div>
                <div className="text-sm font-medium">
                  {quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "30 days"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Payment Terms</div>
                <div className="text-sm font-medium">{quote.paymentTerms ?? "Net 30 days"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Services & Pricing</h2>
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
              <div className="col-span-2 text-right text-sm">{formatCurrency(li.unitPriceCents, quote.currency)}</div>
              <div className="col-span-1 text-right text-sm font-semibold">{formatCurrency(li.totalCents, quote.currency)}</div>
            </div>
          ))}
          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quote.subtotalCents, quote.currency)}</span>
            </div>
            {quote.discountCents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-emerald-400">−{formatCurrency(quote.discountCents, quote.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({quote.taxPercent}%)</span>
              <span>{formatCurrency(quote.totalCents - (quote.subtotalCents - quote.discountCents), quote.currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(quote.totalCents, quote.currency)}</span>
            </div>
          </div>
        </div>

        {/* Client Notes */}
        {quote.clientNotes && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Notes</h2>
            <p className="text-sm text-foreground leading-relaxed">{quote.clientNotes}</p>
          </div>
        )}

        {/* Accept CTA */}
        {canAccept && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Ready to proceed?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Accept this quote to confirm your agreement. Our team will follow up within 1 business day.
            </p>
            <Button
              size="lg"
              onClick={() => setShowAcceptModal(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accept Quote
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Questions? Contact your account manager at <a href="mailto:billing@curalive.cc" className="text-primary hover:underline">billing@curalive.cc</a></p>
          <p className="mt-1">CuraLive — Intelligent Event Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
