/**
 * QuoteBuilder.tsx — CuraLive Enterprise Quote Builder
 *
 * Features:
 *  - Create / edit quotes with line items
 *  - Saved line item templates (one-click add)
 *  - Discount %, VAT %, currency (ZAR/USD/EUR)
 *  - Version history panel
 *  - Activity log panel
 *  - Internal approval workflow
 *  - Send quote to client
 */
import { useState, useMemo, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronRight, Plus, Trash2, Save, Send, Eye, Clock,
  FileText, Loader2, CheckCircle2, AlertTriangle, RefreshCw,
  Package, ChevronDown, ChevronUp, History, Activity,
  DollarSign, Percent, Calendar, Building2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string; // local UUID for React key
  description: string;
  category: string;
  quantity: number;
  unitPriceCents: number;
  notes: string;
}

const CATEGORIES = [
  "Platform License",
  "Event Fee",
  "Setup & Onboarding",
  "Support & Maintenance",
  "Professional Services",
  "Travel & Expenses",
  "Custom",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function displayToCents(val: string): number {
  return Math.round(parseFloat(val || "0") * 100);
}

function formatCurrency(cents: number, currency = "ZAR"): string {
  const amount = cents / 100;
  if (currency === "ZAR") return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${amount.toFixed(2)}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Line Item Row ────────────────────────────────────────────────────────────

function LineItemRow({
  item, onChange, onRemove,
}: {
  item: LineItem;
  onChange: (updated: LineItem) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.quantity * item.unitPriceCents;
  return (
    <div className="grid grid-cols-12 gap-2 items-start py-3 border-b border-border last:border-0">
      {/* Description */}
      <div className="col-span-4">
        <Input
          value={item.description}
          onChange={e => onChange({ ...item, description: e.target.value })}
          placeholder="Description"
          className="bg-background text-sm"
        />
        <Input
          value={item.notes}
          onChange={e => onChange({ ...item, notes: e.target.value })}
          placeholder="Notes (optional)"
          className="bg-background text-xs mt-1 text-muted-foreground"
        />
      </div>
      {/* Category */}
      <div className="col-span-2">
        <select
          value={item.category}
          onChange={e => onChange({ ...item, category: e.target.value })}
          className="w-full bg-background border border-input rounded-md px-2 py-2 text-xs text-foreground"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {/* Qty */}
      <div className="col-span-1">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={e => onChange({ ...item, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="bg-background text-sm text-center"
        />
      </div>
      {/* Unit Price */}
      <div className="col-span-2">
        <Input
          type="number"
          min={0}
          step={0.01}
          value={centsToDisplay(item.unitPriceCents)}
          onChange={e => onChange({ ...item, unitPriceCents: displayToCents(e.target.value) })}
          className="bg-background text-sm text-right"
        />
      </div>
      {/* Line Total */}
      <div className="col-span-2 flex items-center justify-end pt-2">
        <span className="text-sm font-semibold text-primary">{formatCurrency(lineTotal)}</span>
      </div>
      {/* Remove */}
      <div className="col-span-1 flex items-center justify-center pt-1">
        <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (item: LineItem) => void }) {
  const [open, setOpen] = useState(false);
  const { data: templates, isLoading } = trpc.billing.getLineItemTemplates.useQuery(undefined);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-1.5">
        <Package className="w-3.5 h-3.5" />
        Add from Template
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-80 p-2">
          {isLoading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>}
          {!isLoading && (!templates || templates.length === 0) && (
            <div className="p-4 text-center text-sm text-muted-foreground">No templates yet. Save a line item as a template to reuse it.</div>
          )}
          {templates?.map((t: any) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect({
                  id: uid(),
                  description: t.description,
                  category: t.category,
                  quantity: t.defaultQuantity ?? 1,
                  unitPriceCents: t.defaultUnitPriceCents ?? 0,
                  notes: t.notes ?? "",
                });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <div className="font-medium text-sm">{t.description}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground">{t.category}</span>
                <span className="text-xs font-semibold text-primary">{formatCurrency(t.defaultUnitPriceCents ?? 0)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activity Log Panel ───────────────────────────────────────────────────────

function ActivityLogPanel({ quoteId }: { quoteId: number }) {
  const { data: log, isLoading } = trpc.billing.getActivityLog.useQuery(
    { quoteId },
    { refetchInterval: 30_000 }
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Activity Log</span>
      </div>
      {isLoading && <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>}
      {!isLoading && (!log || log.length === 0) && (
        <p className="text-xs text-muted-foreground text-center py-4">No activity yet.</p>
      )}
      <div className="space-y-2">
        {log?.map((entry: any) => (
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
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────────────────────────

function VersionHistoryPanel({ quoteId }: { quoteId: number }) {
  const { data: quoteData, isLoading } = trpc.billing.getQuote.useQuery({ id: quoteId });
  const versions = quoteData?.versions;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Version History</span>
      </div>
      {isLoading && <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>}
      {!isLoading && (!versions || versions.length === 0) && (
        <p className="text-xs text-muted-foreground text-center py-4">No versions saved yet.</p>
      )}
      <div className="space-y-2">
        {versions?.map((v: any) => (
          <div key={v.id} className="flex items-start gap-2.5 text-xs border-b border-border last:border-0 pb-2 last:pb-0">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {v.versionNumber}
            </div>
            <div>
              <div className="font-medium text-foreground">v{v.versionNumber}</div>
              {v.changeNotes && <div className="text-muted-foreground mt-0.5">{v.changeNotes}</div>}
              <div className="text-muted-foreground mt-0.5">{new Date(v.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteBuilder() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const quoteId = params.id ? parseInt(params.id) : undefined;
  const isEdit = !!quoteId;

  const { user, loading: authLoading } = useAuth();

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [currency, setCurrency] = useState<"ZAR" | "USD" | "EUR">("ZAR");
  const [discountCents, setDiscountCents] = useState(0);
  const [taxPercent, setTaxPercent] = useState(15);
  const [paymentTerms, setPaymentTerms] = useState("Net 30 days");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: uid(), description: "", category: "Platform License", quantity: 1, unitPriceCents: 0, notes: "" },
  ]);
  const [changeNotes, setChangeNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // ── Queries ──
  const { data: clients } = trpc.billing.getClients.useQuery(undefined, { enabled: !!user });
  const { data: existingQuote, isLoading: quoteLoading } = trpc.billing.getQuote.useQuery(
    { id: quoteId! },
    { enabled: isEdit && !!user }
  );

  // ── Mutations ──
  const createQuoteMutation = trpc.billing.createQuote.useMutation();
  const updateQuoteMutation = trpc.billing.updateQuote.useMutation();
  const sendQuoteMutation = trpc.billing.sendQuote.useMutation();
  // versions are saved via updateQuote with createVersion: true

  // ── Populate form when editing ──
  useEffect(() => {
    if (existingQuote) {
      const q = existingQuote.quote;
      setTitle(q.title ?? "");
      setDescription(q.description ?? "");
      setClientId(q.clientId ?? null);
      setCurrency((q.currency as "ZAR" | "USD" | "EUR") ?? "ZAR");
      setDiscountCents(q.discountCents ?? 0);
      setTaxPercent(q.taxPercent ?? 15);
      setPaymentTerms(q.paymentTerms ?? "Net 30 days");
      setClientNotes(q.clientNotes ?? "");
      setInternalNotes(q.internalNotes ?? "");
      if (q.expiresAt) {
        setExpiresAt(new Date(q.expiresAt).toISOString().split("T")[0]);
      }
      if (existingQuote.lineItems && Array.isArray(existingQuote.lineItems)) {
        setLineItems(existingQuote.lineItems.map((li: any) => ({
          id: uid(),
          description: li.description ?? "",
          category: li.category ?? "Platform License",
          quantity: li.quantity ?? 1,
          unitPriceCents: li.unitPriceCents ?? 0,
          notes: li.notes ?? "",
        })));
      }
    }
  }, [existingQuote]);

  // ── Totals ──
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPriceCents, 0);
    const afterDiscount = subtotal - discountCents;
    const tax = Math.round(afterDiscount * taxPercent / 100);
    const total = afterDiscount + tax;
    return { subtotal, tax, total };
  }, [lineItems, discountCents, taxPercent]);

  // ── Handlers ──
  const handleAddLine = () => {
    setLineItems(prev => [...prev, { id: uid(), description: "", category: "Platform License", quantity: 1, unitPriceCents: 0, notes: "" }]);
  };

  const handleRemoveLine = (id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id));
  };

  const handleLineChange = (id: string, updated: LineItem) => {
    setLineItems(prev => prev.map(li => li.id === id ? updated : li));
  };

  const handleAddFromTemplate = (item: LineItem) => {
    setLineItems(prev => [...prev, item]);
  };

  const buildPayload = () => ({
    title,
    description,
    clientId: clientId!,
    currency,
    discountCents,
    taxPercent,
    paymentTerms,
    clientNotes,
    internalNotes,
    expiresAt: new Date(expiresAt),
    lineItems: lineItems.map(({ description, category, quantity, unitPriceCents, notes }) => ({
      description, category, quantity, unitPriceCents, notes,
      totalCents: quantity * unitPriceCents,
    })),
  });

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Quote title is required"); return; }
    if (!clientId) { toast.error("Please select a client"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateQuoteMutation.mutateAsync({ id: quoteId!, ...buildPayload() });
        if (changeNotes.trim()) {
          await updateQuoteMutation.mutateAsync({ id: quoteId!, createVersion: true });
          setChangeNotes("");
        }
        toast.success("Quote updated");
      } else {
        const result = await createQuoteMutation.mutateAsync(buildPayload());
        toast.success(`Quote ${result.quoteNumber} created`);
        navigate(`/admin/billing/quote/${result.id}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save quote");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!isEdit || !existingQuote) { toast.error("Save the quote first"); return; }
    const client = clients?.find(c => c.id === clientId);
    if (!client) { toast.error("Client not found"); return; }
    setSending(true);
    try {
      await sendQuoteMutation.mutateAsync({
        id: quoteId!,
        recipientEmail: client.contactEmail,
        recipientName: client.contactName,
        origin: window.location.origin,
      });
      toast.success(`Quote sent to ${client.contactEmail}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send quote");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || (isEdit && quoteLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const quoteStatus = existingQuote?.quote?.status ?? "draft";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/billing")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">{isEdit ? `Edit Quote` : "New Quote"}</span>
              {existingQuote?.quote?.quoteNumber && (
                <span className="text-sm text-muted-foreground font-mono">· {existingQuote.quote.quoteNumber}</span>
              )}
            </div>
            {existingQuote && (
              <Badge className={`text-[10px] border ${
                quoteStatus === "draft" ? "bg-slate-500/20 text-slate-400 border-slate-500/30" :
                quoteStatus === "sent" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                quoteStatus === "accepted" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                "bg-violet-500/20 text-violet-400 border-violet-500/30"
              }`}>
                {quoteStatus}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/quote/${existingQuote?.quote?.accessToken}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
            {isEdit && quoteStatus === "draft" && (
              <Button size="sm" onClick={handleSend} disabled={sending} className="gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send to Client
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ── Main Form ── */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Quote Details */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Quote Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quote Title *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Q2 2026 Earnings Call Package"
                    className="bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of the services quoted..."
                    rows={2}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <Building2 className="w-3 h-3 inline mr-1" />Client *
                  </label>
                  <select
                    value={clientId ?? ""}
                    onChange={e => setClientId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select client...</option>
                    {clients?.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <DollarSign className="w-3 h-3 inline mr-1" />Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as "ZAR" | "USD" | "EUR")}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="ZAR">ZAR — South African Rand</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <Calendar className="w-3 h-3 inline mr-1" />Expires On
                  </label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Terms</label>
                  <Input
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    placeholder="Net 30 days"
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Line Items</h2>
                <div className="flex items-center gap-2">
                  <TemplatePicker onSelect={handleAddFromTemplate} />
                  <Button variant="outline" size="sm" onClick={handleAddLine} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </Button>
                </div>
              </div>
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-0">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {lineItems.map(item => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  onChange={updated => handleLineChange(item.id, updated)}
                  onRemove={() => handleRemoveLine(item.id)}
                />
              ))}
              {lineItems.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No line items yet. Click "Add Line" or use a template.
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Pricing Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <DollarSign className="w-3 h-3 inline mr-1" />Discount (amount)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={centsToDisplay(discountCents)}
                    onChange={e => setDiscountCents(displayToCents(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <Percent className="w-3 h-3 inline mr-1" />VAT (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={taxPercent}
                    onChange={e => setTaxPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-emerald-400">−{formatCurrency(discountCents, currency)}</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT ({taxPercent}%)</span>
                    <span>{formatCurrency(tax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Notes</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client-Facing Notes</label>
                <textarea
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Notes visible to the client on the quote document..."
                  rows={3}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Internal Notes (not visible to client)</label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Internal notes for your team..."
                  rows={2}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            {/* Version change notes (edit mode only) */}
            {isEdit && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Save Version</h2>
                <p className="text-xs text-muted-foreground mb-3">Optionally add a note describing what changed in this version before saving.</p>
                <Input
                  value={changeNotes}
                  onChange={e => setChangeNotes(e.target.value)}
                  placeholder="e.g. Updated event fee after client negotiation"
                  className="bg-background"
                />
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Quote Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Items</span>
                  <span className="font-medium">{lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatCurrency(discountCents, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="font-medium">{taxPercent}%</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Expiry warning */}
            {expiresAt && (() => {
              const days = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
              if (days < 7 && days >= 0) return (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-amber-400 mb-0.5">Expiring Soon</div>
                    <div className="text-muted-foreground">This quote expires in {days} day{days !== 1 ? "s" : ""}.</div>
                  </div>
                </div>
              );
              if (days < 0) return (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-red-400 mb-0.5">Expired</div>
                    <div className="text-muted-foreground">This quote expired {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} ago.</div>
                  </div>
                </div>
              );
              return null;
            })()}

            {/* Status info */}
            {isEdit && existingQuote?.quote?.acceptedAt && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-emerald-400 mb-0.5">Accepted</div>
                  <div className="text-muted-foreground">
                    Accepted on {new Date(existingQuote.quote.acceptedAt!).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Version history */}
            {isEdit && <VersionHistoryPanel quoteId={quoteId!} />}

            {/* Activity log */}
            {isEdit && <ActivityLogPanel quoteId={quoteId!} />}
          </div>
        </div>
      </div>
    </div>
  );
}
