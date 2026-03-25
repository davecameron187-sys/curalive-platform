/**
 * RecurringTemplates.tsx — Recurring Invoice Template Management
 *
 * Features:
 *  - List all active recurring templates with schedule info
 *  - Create new templates with line items, frequency, and client
 *  - Toggle active/inactive
 *  - Generate a quote immediately from a template
 *  - Delete (soft-delete) templates
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Loader2, AlertTriangle, RefreshCw, Trash2, X,
  Calendar, Clock, ChevronRight, Play, ToggleLeft, ToggleRight,
  Repeat, Building2, FileText, DollarSign,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number, currency = "ZAR"): string {
  const amount = cents / 100;
  if (currency === "ZAR") return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `€${amount.toLocaleString("en-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function frequencyLabel(f: string): string {
  return f === "monthly" ? "Monthly" : f === "quarterly" ? "Quarterly" : "Annually";
}

function frequencyColor(f: string): string {
  return f === "monthly" ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
    : f === "quarterly" ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

function daysUntil(d: Date | string | null | undefined): number {
  if (!d) return 0;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

// ─── Line Item Row ────────────────────────────────────────────────────────────

interface LineItemDraft {
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxable: boolean;
}

function LineItemRow({
  item, index, onChange, onRemove,
}: {
  item: LineItemDraft; index: number;
  onChange: (i: number, field: keyof LineItemDraft, val: any) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_100px_60px_32px] gap-2 items-center">
      <Input
        value={item.description}
        onChange={e => onChange(index, "description", e.target.value)}
        placeholder="Description"
        className="bg-background text-sm h-8"
      />
      <Input
        type="number"
        min={1}
        value={item.quantity}
        onChange={e => onChange(index, "quantity", parseFloat(e.target.value) || 1)}
        className="bg-background text-sm h-8 text-right"
      />
      <Input
        type="number"
        min={0}
        step={0.01}
        value={(item.unitPriceCents / 100).toFixed(2)}
        onChange={e => onChange(index, "unitPriceCents", Math.round(parseFloat(e.target.value || "0") * 100))}
        className="bg-background text-sm h-8 text-right"
      />
      <button
        type="button"
        onClick={() => onChange(index, "taxable", !item.taxable)}
        className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${item.taxable ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground"}`}
      >
        {item.taxable ? "VAT" : "No"}
      </button>
      <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-red-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Create Template Modal ────────────────────────────────────────────────────

function CreateTemplateModal({
  clients, onClose, onSuccess,
}: {
  clients: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "annually">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(15);
  const [currency, setCurrency] = useState<"ZAR" | "USD" | "EUR">("ZAR");
  const [paymentTerms, setPaymentTerms] = useState("Payment due within 30 days of invoice date.");
  const [autoDraft, setAutoDraft] = useState(true);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: "", quantity: 1, unitPriceCents: 0, taxable: true },
  ]);
  const [saving, setSaving] = useState(false);

  const createMutation = trpc.billing.createRecurringTemplate.useMutation();

  const updateLineItem = (i: number, field: keyof LineItemDraft, val: any) => {
    setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, [field]: val } : li));
  };
  const removeLineItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const addLineItem = () => setLineItems(prev => [...prev, { description: "", quantity: 1, unitPriceCents: 0, taxable: true }]);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPriceCents, 0);
  const discountCents = Math.round(subtotal * (discountPercent / 100));
  const taxableSub = lineItems.filter(li => li.taxable).reduce((s, li) => s + li.quantity * li.unitPriceCents, 0);
  const taxCents = Math.round((taxableSub - Math.round(taxableSub * (discountPercent / 100))) * (taxPercent / 100));
  const total = subtotal - discountCents + taxCents;

  // Default next generation: first occurrence of dayOfMonth >= tomorrow
  const defaultNext = useMemo(() => {
    const d = new Date();
    d.setDate(dayOfMonth);
    if (d <= new Date()) d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }, [dayOfMonth]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Template name is required"); return; }
    if (!clientId) { toast.error("Please select a client"); return; }
    if (!titleTemplate.trim()) { toast.error("Title template is required"); return; }
    if (lineItems.some(li => !li.description.trim())) { toast.error("All line items need a description"); return; }
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        name,
        clientId: clientId as number,
        titleTemplate,
        lineItemsJson: JSON.stringify(lineItems),
        discountPercent,
        taxPercent,
        currency,
        paymentTerms: paymentTerms || undefined,
        frequency,
        dayOfMonth,
        nextGenerationAt: new Date(defaultNext),
        autoDraft,
      });
      toast.success("Recurring template created");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">New Recurring Template</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Template name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Template Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nedbank Monthly Platform License" className="bg-background" />
          </div>

          {/* Client + Currency row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client *</label>
              <select
                value={clientId}
                onChange={e => setClientId(parseInt(e.target.value) || "")}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as "ZAR" | "USD" | "EUR")}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              >
                <option value="ZAR">ZAR (Rand)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          {/* Title template */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Quote Title Template * <span className="text-muted-foreground/60 font-normal">— tokens: {"{month}"}, {"{quarter}"}, {"{year}"}</span>
            </label>
            <Input
              value={titleTemplate}
              onChange={e => setTitleTemplate(e.target.value)}
              placeholder="e.g. Platform License — {month} {year}"
              className="bg-background"
            />
          </div>

          {/* Frequency + Day row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frequency *</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as "monthly" | "quarterly" | "annually")}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Day of Month (1–28)</label>
              <Input
                type="number" min={1} max={28}
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Auto-Draft</label>
              <button
                type="button"
                onClick={() => setAutoDraft(v => !v)}
                className={`flex items-center gap-2 w-full border rounded-md px-3 py-2 text-sm transition-colors ${autoDraft ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-input text-muted-foreground"}`}
              >
                {autoDraft ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {autoDraft ? "Auto-create draft" : "Notify only"}
              </button>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Line Items *</label>
              <div className="grid grid-cols-[1fr_80px_100px_60px_32px] gap-2 text-xs text-muted-foreground/60 pr-0">
                <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit Price</span><span className="text-center">VAT</span><span />
              </div>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <LineItemRow key={i} item={li} index={i} onChange={updateLineItem} onRemove={removeLineItem} />
              ))}
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add line item
            </button>
          </div>

          {/* Discount + Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount %</label>
              <Input
                type="number" min={0} max={100}
                value={discountPercent}
                onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tax (VAT) %</label>
              <Input
                type="number" min={0} max={100}
                value={taxPercent}
                onChange={e => setTaxPercent(parseInt(e.target.value) || 0)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Totals preview */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
            {discountCents > 0 && <div className="flex justify-between text-amber-400"><span>Discount ({discountPercent}%)</span><span>−{formatCurrency(discountCents, currency)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>VAT ({taxPercent}%)</span><span>{formatCurrency(taxCents, currency)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Total</span><span>{formatCurrency(total, currency)}</span></div>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Terms</label>
            <textarea
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              rows={2}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
            Create Template
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecurringTemplates() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: templates, isLoading, refetch } = trpc.billing.getRecurringTemplates.useQuery(
    undefined, { enabled: !!user }
  );
  const { data: clientsData } = trpc.billing.getClients.useQuery(
    undefined, { enabled: !!user }
  );

  const utils = trpc.useUtils();

  const generateMutation = trpc.billing.generateFromRecurringTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Quote ${data.quoteNumber} created`);
      utils.billing.getRecurringTemplates.invalidate();
      refetch();
    },
    onError: (e) => toast.error(e.message ?? "Failed to generate quote"),
  });

  const deleteMutation = trpc.billing.deleteRecurringTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deactivated");
      utils.billing.getRecurringTemplates.invalidate();
      refetch();
    },
    onError: (e) => toast.error(e.message ?? "Failed to delete template"),
  });

  const handleGenerate = async (id: number) => {
    setGeneratingId(id);
    try {
      const result = await generateMutation.mutateAsync({ id, origin: window.location.origin });
      navigate(`/admin/billing/quote/${result.quoteId}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this template? It will no longer generate quotes automatically.")) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync({ id });
    } finally {
      setDeletingId(null);
    }
  };

  const clients = (clientsData ?? []).map((c: any) => ({ ...c, name: c.companyName ?? c.name ?? "" }));

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {showCreate && (
        <CreateTemplateModal
          clients={clients}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); refetch(); }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate("/admin/billing")} className="hover:text-foreground transition-colors">Billing</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Recurring Templates</span>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Template
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Templates", value: templates?.length ?? 0, icon: Repeat, color: "text-primary" },
            {
              label: "Due This Week",
              value: templates?.filter(t => daysUntil(t.nextGenerationAt) <= 7).length ?? 0,
              icon: Clock, color: "text-amber-400",
            },
            {
              label: "Auto-Draft",
              value: templates?.filter(t => t.autoDraft).length ?? 0,
              icon: FileText, color: "text-emerald-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Templates list */}
        {!templates || templates.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No recurring templates yet</p>
            <p className="text-sm mb-6">Create a template to auto-generate quotes on a schedule.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Create First Template
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t: any) => {
              const days = daysUntil(t.nextGenerationAt);
              const isOverdue = days < 0;
              const isDueSoon = days >= 0 && days <= 7;
              const client = clients.find((c: any) => c.id === t.clientId);
              const lineItems: LineItemDraft[] = (() => {
                try { return JSON.parse(t.lineItemsJson); } catch { return []; }
              })();
              const subtotal = lineItems.reduce((s: number, li: LineItemDraft) => s + li.quantity * li.unitPriceCents, 0);
              const discountCents = Math.round(subtotal * (t.discountPercent / 100));
              const taxableSub = lineItems.filter((li: LineItemDraft) => li.taxable).reduce((s: number, li: LineItemDraft) => s + li.quantity * li.unitPriceCents, 0);
              const taxCents = Math.round((taxableSub - Math.round(taxableSub * (t.discountPercent / 100))) * (t.taxPercent / 100));
              const total = subtotal - discountCents + taxCents;

              return (
                <div key={t.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                        <Badge variant="outline" className={`text-[10px] ${frequencyColor(t.frequency)}`}>
                          {frequencyLabel(t.frequency)}
                        </Badge>
                        {t.autoDraft && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Auto-Draft
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 font-mono">{t.titleTemplate}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {client && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {client.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {formatCurrency(total, t.currency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue ? "text-red-400 font-medium" : isDueSoon ? "text-amber-400 font-medium" : ""}>
                            Next: {formatDate(t.nextGenerationAt)}
                            {isOverdue ? ` (${Math.abs(days)}d overdue)` : isDueSoon ? ` (in ${days}d)` : ""}
                          </span>
                        </span>
                        {t.lastGeneratedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last: {formatDate(t.lastGeneratedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate(t.id)}
                        disabled={generatingId === t.id}
                        className="gap-1.5 text-xs"
                        title="Generate quote now"
                      >
                        {generatingId === t.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />}
                        Generate Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        title="Deactivate template"
                      >
                        {deletingId === t.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Line items preview */}
                  {lineItems.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Line items ({lineItems.length})</p>
                      <div className="space-y-1">
                        {lineItems.slice(0, 3).map((li: LineItemDraft, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate max-w-[60%]">{li.description}</span>
                            <span>{li.quantity} × {formatCurrency(li.unitPriceCents, t.currency)}</span>
                          </div>
                        ))}
                        {lineItems.length > 3 && (
                          <p className="text-xs text-muted-foreground/60">+{lineItems.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
