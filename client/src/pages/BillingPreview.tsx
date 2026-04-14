/**
 * BillingPreview.tsx — Live prototype of the CuraLive Enterprise Billing System.
 *
 * Three views accessible via tabs:
 *   1. Admin Dashboard  — pipeline kanban + client list + invoice tracker + FX rates
 *   2. Quote Builder    — line items, discount, tax, currency, terms, live preview
 *   3. Client Quote View — what the client sees at /quote/:token
 *
 * All data is static demo data — no backend calls. For approval before full implementation.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Building2, Users, FileText, Receipt, CreditCard,
  TrendingUp, ChevronRight, Plus, Trash2, Edit3, Send, CheckCircle2,
  Clock, AlertCircle, XCircle, DollarSign, RefreshCw, Eye, Download,
  MoreVertical, Star, Globe, Zap, ChevronDown, Check, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Demo Data ────────────────────────────────────────────────────────────────

const FX_RATES = { ZAR: 1, USD: 0.054, EUR: 0.050 };
const FX_LABELS: Record<string, string> = { ZAR: "R", USD: "$", EUR: "€" };

const DEMO_CLIENTS = [
  { id: 1, company: "Nedbank Group Ltd", contact: "Sarah van der Berg", email: "sarah.vdb@nedbank.co.za", industry: "Financial Services", status: "active", currency: "ZAR", quotes: 4, invoices: 3, outstanding: 285000 },
  { id: 2, company: "Anglo American plc", contact: "James Thornton", email: "j.thornton@angloamerican.com", industry: "Mining", status: "active", currency: "USD", quotes: 2, invoices: 2, outstanding: 0 },
  { id: 3, company: "Shoprite Holdings", contact: "Priya Naidoo", email: "p.naidoo@shoprite.co.za", industry: "Retail", status: "prospect", currency: "ZAR", quotes: 1, invoices: 0, outstanding: 0 },
  { id: 4, company: "Standard Bank Group", contact: "Michael Dlamini", email: "m.dlamini@standardbank.co.za", industry: "Financial Services", status: "active", currency: "ZAR", quotes: 6, invoices: 5, outstanding: 142500 },
];

const DEMO_QUOTES = [
  { id: 1, number: "QUO-2026-0012", client: "Nedbank Group Ltd", title: "Q2 2026 Earnings Call Package", total: 185000, currency: "ZAR", status: "sent", issued: "2026-03-01", expires: "2026-03-31" },
  { id: 2, number: "QUO-2026-0011", client: "Standard Bank Group", title: "Annual Investor Day 2026", total: 320000, currency: "ZAR", status: "accepted", issued: "2026-02-20", expires: "2026-03-20" },
  { id: 3, number: "QUO-2026-0010", client: "Anglo American plc", title: "H1 2026 Results Webcast", total: 12500, currency: "USD", status: "draft", issued: "2026-03-05", expires: "2026-04-04" },
  { id: 4, number: "QUO-2026-0009", client: "Shoprite Holdings", title: "CuraLive Platform Onboarding", total: 95000, currency: "ZAR", status: "viewed", issued: "2026-02-28", expires: "2026-03-28" },
  { id: 5, number: "QUO-2026-0008", client: "Nedbank Group Ltd", title: "Q1 2026 Earnings Call", total: 165000, currency: "ZAR", status: "invoiced", issued: "2026-01-15", expires: "2026-02-14" },
];

const DEMO_INVOICES = [
  { id: 1, number: "INV-2026-0008", client: "Standard Bank Group", title: "Annual Investor Day 2026", total: 368000, currency: "ZAR", status: "unpaid", issued: "2026-02-25", due: "2026-03-27" },
  { id: 2, number: "INV-2026-0007", client: "Nedbank Group Ltd", title: "Q1 2026 Earnings Call", total: 189750, currency: "ZAR", status: "paid", issued: "2026-01-20", due: "2026-02-19" },
  { id: 3, number: "INV-2026-0006", client: "Anglo American plc", title: "FY2025 Results Webcast", total: 9800, currency: "USD", status: "overdue", issued: "2026-01-10", due: "2026-02-09" },
  { id: 4, number: "INV-2026-0005", client: "Nedbank Group Ltd", title: "Q3 2025 Earnings Call", total: 165000, currency: "ZAR", status: "paid", issued: "2025-11-05", due: "2025-12-05" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:    { label: "Draft",    color: "text-slate-400",  bg: "bg-slate-800",   icon: Edit3 },
  sent:     { label: "Sent",     color: "text-blue-400",   bg: "bg-blue-900/40", icon: Send },
  viewed:   { label: "Viewed",   color: "text-violet-400", bg: "bg-violet-900/40", icon: Eye },
  accepted: { label: "Accepted", color: "text-emerald-400",bg: "bg-emerald-900/40", icon: CheckCircle2 },
  declined: { label: "Declined", color: "text-red-400",    bg: "bg-red-900/40",  icon: XCircle },
  invoiced: { label: "Invoiced", color: "text-amber-400",  bg: "bg-amber-900/40", icon: Receipt },
  expired:  { label: "Expired",  color: "text-slate-500",  bg: "bg-slate-800",   icon: Clock },
  unpaid:   { label: "Unpaid",   color: "text-amber-400",  bg: "bg-amber-900/40", icon: Clock },
  paid:     { label: "Paid",     color: "text-emerald-400",bg: "bg-emerald-900/40", icon: CheckCircle2 },
  overdue:  { label: "Overdue",  color: "text-red-400",    bg: "bg-red-900/40",  icon: AlertCircle },
  partial:  { label: "Partial",  color: "text-orange-400", bg: "bg-orange-900/40", icon: DollarSign },
  cancelled:{ label: "Cancelled",color: "text-slate-500",  bg: "bg-slate-800",   icon: XCircle },
  active:   { label: "Active",   color: "text-emerald-400",bg: "bg-emerald-900/40", icon: CheckCircle2 },
  prospect: { label: "Prospect", color: "text-blue-400",   bg: "bg-blue-900/40", icon: Star },
  inactive: { label: "Inactive", color: "text-slate-400",  bg: "bg-slate-800",   icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function fmt(cents: number, currency: string, displayCurrency: string) {
  const rate = FX_RATES[displayCurrency as keyof typeof FX_RATES] / FX_RATES[currency as keyof typeof FX_RATES];
  const converted = (cents / 100) * rate;
  const sym = FX_LABELS[displayCurrency] ?? displayCurrency;
  return `${sym}${converted.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtRaw(amount: number, currency: string, displayCurrency: string) {
  return fmt(amount * 100, currency, displayCurrency);
}

// ─── FX Rate Banner ───────────────────────────────────────────────────────────
function FxBanner({ display, setDisplay }: { display: string; setDisplay: (c: string) => void }) {
  const [rates, setRates] = useState({ USDZAR: 18.52, EURZAR: 19.87, updated: "live" });
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setRates({ USDZAR: 18.52 + (Math.random() - 0.5) * 0.3, EURZAR: 19.87 + (Math.random() - 0.5) * 0.3, updated: new Date().toLocaleTimeString() });
      setLoading(false);
      toast.success("Exchange rates refreshed");
    }, 800);
  };

  return (
    <div className="flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2 text-xs">
      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-slate-400">Live FX:</span>
      <span className="text-slate-200 font-mono">1 USD = R{rates.USDZAR.toFixed(2)}</span>
      <span className="text-slate-600">|</span>
      <span className="text-slate-200 font-mono">1 EUR = R{rates.EURZAR.toFixed(2)}</span>
      <button onClick={refresh} disabled={loading} className="ml-1 text-slate-400 hover:text-slate-200 transition-colors">
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
      <span className="text-slate-600">|</span>
      <span className="text-slate-500">Display in:</span>
      {["ZAR", "USD", "EUR"].map(c => (
        <button key={c} onClick={() => setDisplay(c)}
          className={`px-2 py-0.5 rounded font-semibold transition-colors ${display === c ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}

// ─── View 1: Admin Dashboard ──────────────────────────────────────────────────
function AdminDashboard({ display, setDisplay }: { display: string; setDisplay: (c: string) => void }) {
  const [activeSection, setActiveSection] = useState<"pipeline" | "clients" | "invoices">("pipeline");

  const totalOutstanding = DEMO_INVOICES.filter(i => i.status === "unpaid" || i.status === "overdue" || i.status === "partial")
    .reduce((s, i) => s + i.total, 0);
  const totalPaid = DEMO_INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Clients", value: DEMO_CLIENTS.filter(c => c.status === "active").length.toString(), icon: Building2, color: "text-blue-400", sub: `${DEMO_CLIENTS.filter(c => c.status === "prospect").length} prospects` },
          { label: "Open Quotes", value: DEMO_QUOTES.filter(q => ["draft","sent","viewed"].includes(q.status)).length.toString(), icon: FileText, color: "text-violet-400", sub: "awaiting response" },
          { label: "Outstanding", value: fmtRaw(totalOutstanding, "ZAR", display), icon: AlertCircle, color: "text-amber-400", sub: "across all invoices" },
          { label: "Collected YTD", value: fmtRaw(totalPaid, "ZAR", display), icon: TrendingUp, color: "text-emerald-400", sub: "2026 year-to-date" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-800/40 border border-slate-700 rounded-lg p-1 w-fit">
        {(["pipeline", "clients", "invoices"] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeSection === s ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
            {s === "pipeline" ? "Quote Pipeline" : s === "clients" ? "Clients" : "Invoices"}
          </button>
        ))}
      </div>

      {/* Quote Pipeline Kanban */}
      {activeSection === "pipeline" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { stage: "Draft", statuses: ["draft"], color: "border-slate-600" },
            { stage: "Sent / Viewed", statuses: ["sent", "viewed"], color: "border-blue-600" },
            { stage: "Accepted", statuses: ["accepted"], color: "border-emerald-600" },
            { stage: "Invoiced", statuses: ["invoiced"], color: "border-amber-600" },
          ].map(({ stage, statuses, color }) => {
            const quotes = DEMO_QUOTES.filter(q => statuses.includes(q.status));
            return (
              <div key={stage} className={`border-t-2 ${color} bg-slate-800/40 rounded-xl p-3 space-y-2`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{stage}</span>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{quotes.length}</span>
                </div>
                {quotes.map(q => (
                  <div key={q.id} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-slate-500 transition-colors">
                    <div className="text-xs text-slate-500 mb-1 font-mono">{q.number}</div>
                    <div className="text-sm font-medium text-slate-200 mb-1 leading-tight">{q.title}</div>
                    <div className="text-xs text-slate-400 mb-2">{q.client}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-400">{fmtRaw(q.total, q.currency, display)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
                {quotes.length === 0 && <div className="text-xs text-slate-600 text-center py-4">No quotes</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Clients Table */}
      {activeSection === "clients" && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">All Clients</span>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> New Client
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                {["Company", "Primary Contact", "Industry", "Currency", "Quotes", "Outstanding", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_CLIENTS.map(c => (
                <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{c.company}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300">{c.contact}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.industry}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{c.currency}</td>
                  <td className="px-4 py-3 text-slate-300 text-center">{c.quotes}</td>
                  <td className="px-4 py-3">
                    {c.outstanding > 0
                      ? <span className="text-amber-400 font-semibold">{fmtRaw(c.outstanding, "ZAR", display)}</span>
                      : <span className="text-emerald-400 text-xs">Nil</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-slate-500 hover:text-slate-300"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices Table */}
      {activeSection === "invoices" && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">All Invoices</span>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> New Invoice
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                {["Invoice #", "Client", "Description", "Total", "Due Date", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_INVOICES.map(inv => (
                <tr key={inv.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{inv.number}</td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{inv.client}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{inv.title}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{fmtRaw(inv.total, inv.currency, display)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{inv.due}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition-colors" title="Download PDF"><Download className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── View 2: Quote Builder ────────────────────────────────────────────────────
const DEFAULT_LINE_ITEMS = [
  { id: 1, description: "CuraLive Platform License — Q2 2026 (April–June)", category: "Platform License", qty: 1, unitPrice: 85000 },
  { id: 2, description: "Q2 2026 Earnings Call — Live Event Production", category: "Event Fee", qty: 1, unitPrice: 55000 },
  { id: 3, description: "Recall.ai Bot Integration & Setup", category: "Setup & Onboarding", qty: 1, unitPrice: 15000 },
  { id: 4, description: "Post-Event AI Summary & Transcript Report", category: "Professional Services", qty: 1, unitPrice: 12500 },
];

function QuoteBuilder({ display, setDisplay }: { display: string; setDisplay: (c: string) => void }) {
  const [lineItems, setLineItems] = useState(DEFAULT_LINE_ITEMS);
  const [discount, setDiscount] = useState(10);
  const [taxPct, setTaxPct] = useState(15);
  const [currency, setCurrency] = useState("ZAR");
  const [showPreview, setShowPreview] = useState(false);
  const [client, setClient] = useState("Nedbank Group Ltd");
  const [title, setTitle] = useState("Q2 2026 Earnings Call Package");
  const [terms, setTerms] = useState("Payment due 30 days from invoice date. Late payments subject to 2% per month interest.");

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const discountAmt = Math.round(subtotal * discount / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = Math.round(afterDiscount * taxPct / 100);
  const total = afterDiscount + taxAmt;

  const addLine = () => setLineItems(prev => [...prev, { id: Date.now(), description: "", category: "Event Fee", qty: 1, unitPrice: 0 }]);
  const removeLine = (id: number) => setLineItems(prev => prev.filter(i => i.id !== id));
  const updateLine = (id: number, field: string, value: string | number) =>
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const sym = FX_LABELS[currency] ?? currency;
  const fmtAmt = (n: number) => `${sym}${n.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Left: Builder */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header fields */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-200 mb-3">Quote Details</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Client</label>
              <select value={client} onChange={e => setClient(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                {DEMO_CLIENTS.map(c => <option key={c.id}>{c.company}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                <option>ZAR</option><option>USD</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Quote Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">Line Items</span>
            <Button onClick={addLine} size="sm" variant="outline" className="h-7 text-xs gap-1 border-slate-600 text-slate-300 hover:bg-slate-700">
              <Plus className="w-3 h-3" /> Add Line
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-medium w-[40%]">Description</th>
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-medium">Category</th>
                <th className="text-right px-3 py-2 text-xs text-slate-400 font-medium w-16">Qty</th>
                <th className="text-right px-3 py-2 text-xs text-slate-400 font-medium">Unit Price</th>
                <th className="text-right px-3 py-2 text-xs text-slate-400 font-medium">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <tr key={item.id} className="border-b border-slate-800">
                  <td className="px-3 py-2">
                    <input value={item.description} onChange={e => updateLine(item.id, "description", e.target.value)}
                      className="w-full bg-transparent text-slate-200 text-xs focus:outline-none focus:bg-slate-900 rounded px-1 py-0.5" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={item.category} onChange={e => updateLine(item.id, "category", e.target.value)}
                      className="bg-transparent text-slate-400 text-xs focus:outline-none focus:bg-slate-900 rounded px-1 py-0.5 w-full">
                      {["Platform License","Event Fee","Setup & Onboarding","Professional Services","Support & Maintenance","Custom Development","Travel & Expenses"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={item.qty} onChange={e => updateLine(item.id, "qty", parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-slate-200 text-xs text-right focus:outline-none focus:bg-slate-900 rounded px-1 py-0.5" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={item.unitPrice} onChange={e => updateLine(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-slate-200 text-xs text-right focus:outline-none focus:bg-slate-900 rounded px-1 py-0.5" />
                  </td>
                  <td className="px-3 py-2 text-right text-slate-200 text-xs font-medium">{fmtAmt(item.qty * item.unitPrice)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeLine(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <label className="text-xs text-slate-400 mb-1 block">Payment Terms</label>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none" />
        </div>
      </div>

      {/* Right: Summary + actions */}
      <div className="space-y-4">
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-200 mb-3">Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span><span className="text-slate-200 font-mono">{fmtAmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                Discount
                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-12 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-200 text-center focus:outline-none focus:border-blue-500" />
                <span className="text-xs">%</span>
              </span>
              <span className="text-red-400 font-mono">-{fmtAmt(discountAmt)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                VAT
                <input type="number" value={taxPct} onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                  className="w-12 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-200 text-center focus:outline-none focus:border-blue-500" />
                <span className="text-xs">%</span>
              </span>
              <span className="text-slate-200 font-mono">{fmtAmt(taxAmt)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-base">
              <span className="text-slate-200">Total</span>
              <span className="text-emerald-400 font-mono">{fmtAmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Version history */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Version History</div>
          {[
            { v: "v3 (current)", date: "6 Mar 2026", note: "Added Recall.ai setup fee" },
            { v: "v2", date: "3 Mar 2026", note: "Reduced platform fee by 10%" },
            { v: "v1", date: "1 Mar 2026", note: "Initial draft" },
          ].map(({ v, date, note }) => (
            <div key={v} className="flex items-start gap-2 py-1.5 border-b border-slate-800 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${v.includes("current") ? "bg-blue-500" : "bg-slate-600"}`} />
              <div>
                <div className="text-xs font-medium text-slate-300">{v}</div>
                <div className="text-xs text-slate-500">{date} · {note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={() => { setShowPreview(true); toast.success("Preview ready"); }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Eye className="w-4 h-4" /> Preview Client View
          </Button>
          <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Send className="w-4 h-4" /> Send to Client
          </Button>
          <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <ClientQuoteDoc client={client} title={title} lineItems={lineItems} subtotal={subtotal} discountAmt={discountAmt} taxAmt={taxAmt} total={total} currency={currency} terms={terms} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Quote Document (shared by builder preview + client view) ──────────
function ClientQuoteDoc({ client, title, lineItems, subtotal, discountAmt, taxAmt, total, currency, terms }: any) {
  const sym = FX_LABELS[currency] ?? currency;
  const fmtAmt = (n: number) => `${sym}${n.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="p-8 font-sans text-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-900">Cura<span className="text-red-600">Live</span></span>
          </div>
          <div className="text-xs text-slate-500 mt-1">CuraLive (Pty) Ltd · VAT 4123456789</div>
          <div className="text-xs text-slate-500">Sandton, Johannesburg · hello@curalive.ai</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 mb-1">QUOTE</div>
          <div className="text-sm font-mono text-slate-600">QUO-2026-0013</div>
          <div className="text-xs text-slate-500 mt-1">Issued: 6 March 2026</div>
          <div className="text-xs text-slate-500">Expires: 5 April 2026</div>
        </div>
      </div>

      {/* Billed to */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prepared for</div>
        <div className="font-semibold text-slate-900">{client}</div>
        <div className="text-sm text-slate-600">Attention: Sarah van der Berg, Head of Investor Relations</div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500 mt-1">This quote covers the services detailed below for the period specified.</div>
      </div>

      {/* Line items */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="text-left px-4 py-2.5 rounded-tl-lg font-medium">Description</th>
            <th className="text-left px-4 py-2.5 font-medium">Category</th>
            <th className="text-right px-4 py-2.5 font-medium w-12">Qty</th>
            <th className="text-right px-4 py-2.5 font-medium">Unit Price</th>
            <th className="text-right px-4 py-2.5 rounded-tr-lg font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item: any, i: number) => (
            <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="px-4 py-3 text-slate-800">{item.description}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{item.category}</td>
              <td className="px-4 py-3 text-right text-slate-700">{item.qty}</td>
              <td className="px-4 py-3 text-right text-slate-700 font-mono">{fmtAmt(item.unitPrice)}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono">{fmtAmt(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{fmtAmt(subtotal)}</span></div>
          {discountAmt > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-mono text-red-600">-{fmtAmt(discountAmt)}</span></div>}
          <div className="flex justify-between text-slate-600"><span>VAT (15%)</span><span className="font-mono">{fmtAmt(taxAmt)}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2">
            <span className="text-slate-900">Total Due</span>
            <span className="text-red-600 font-mono">{fmtAmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Terms</div>
        <div className="text-sm text-slate-600">{terms}</div>
        <div className="text-sm text-slate-600 mt-1">Banking details will be provided on the invoice upon acceptance.</div>
      </div>

      {/* Accept button */}
      {!accepted ? (
        <button onClick={() => { setAccepted(true); toast.success("Quote accepted! The CuraLive team has been notified."); }}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Check className="w-5 h-5" /> Accept This Quote
        </button>
      ) : (
        <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Quote Accepted — Thank you!
        </div>
      )}
    </div>
  );
}

// ─── View 3: Client Quote View ────────────────────────────────────────────────
function ClientQuoteView() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-xs text-slate-400">
        <Globe className="w-3.5 h-3.5" />
        <span>This is what your client sees when they open their unique quote link</span>
        <span className="ml-auto font-mono text-slate-500">curalive.ai/quote/abc123xyz</span>
        <button onClick={() => toast.success("Link copied!")} className="text-slate-400 hover:text-slate-200">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <ClientQuoteDoc
          client="Nedbank Group Ltd"
          title="Q2 2026 Earnings Call Package"
          lineItems={DEFAULT_LINE_ITEMS}
          subtotal={167500}
          discountAmt={16750}
          taxAmt={22612}
          total={173362}
          currency="ZAR"
          terms="Payment due 30 days from invoice date. Late payments subject to 2% per month interest."
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BillingPreview() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"dashboard" | "builder" | "client">("dashboard");
  const [display, setDisplay] = useState("ZAR");

  return (
    <div className="min-h-screen bg-[#060d1f] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-[#060d1f]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center gap-4 h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-slate-200">Enterprise Billing — Preview</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">PROTOTYPE</span>
          </div>
          <div className="ml-auto">
            <FxBanner display={display} setDisplay={setDisplay} />
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-5">
        {/* View switcher */}
        <div className="flex items-center gap-2">
          {[
            { key: "dashboard", label: "Admin Dashboard", icon: TrendingUp },
            { key: "builder", label: "Quote Builder", icon: Edit3 },
            { key: "client", label: "Client Quote View", icon: Eye },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === key ? "bg-red-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-500 bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
            💡 This is a static prototype. All data is demo data. No backend calls are made.
          </div>
        </div>

        {/* View content */}
        {view === "dashboard" && <AdminDashboard display={display} setDisplay={setDisplay} />}
        {view === "builder" && <QuoteBuilder display={display} setDisplay={setDisplay} />}
        {view === "client" && <ClientQuoteView />}
      </div>
    </div>
  );
}
