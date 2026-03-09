import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Globe, Plus, ArrowLeft, Building2, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminClients() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: "", companyName: "", logoUrl: "", primaryColor: "#6c3fc5",
    secondaryColor: "#1a1a2e", contactEmail: "",
    billingTier: "professional" as "starter" | "professional" | "enterprise",
  });

  const { data: clientList, refetch } = trpc.clientPortal.listClients.useQuery();
  const createClient = trpc.clientPortal.createClient.useMutation({
    onSuccess: () => { toast.success("Client created"); refetch(); setShowForm(false); setForm({ slug: "", companyName: "", logoUrl: "", primaryColor: "#6c3fc5", secondaryColor: "#1a1a2e", contactEmail: "", billingTier: "professional" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateClient = trpc.clientPortal.updateClient.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const clients = clientList ?? [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/users")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Client Portals</h1>
            <p className="text-xs text-slate-400">White-label portal management</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Client
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {showForm && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 mb-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">New Client</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Company Name", key: "companyName", placeholder: "e.g. Standard Bank" },
                { label: "Portal Slug", key: "slug", placeholder: "e.g. standard-bank" },
                { label: "Contact Email", key: "contactEmail", placeholder: "ir@company.com" },
                { label: "Logo URL", key: "logoUrl", placeholder: "https://..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                  <input
                    value={(form as any)[key]}
                    placeholder={placeholder}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Primary Colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primaryColor} onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="h-9 w-12 bg-slate-800 border border-slate-700 rounded cursor-pointer" />
                  <span className="text-sm text-slate-300">{form.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Billing Tier</label>
                <select value={form.billingTier} onChange={(e) => setForm(f => ({ ...f, billingTier: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (!form.slug || !form.companyName) { toast.error("Slug and company name required"); return; } createClient.mutate(form); }}
                disabled={createClient.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors"
              >
                {createClient.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Client
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs text-slate-500">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
          {clients.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No clients yet</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm underline">Add your first client</button>
            </div>
          ) : clients.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: c.primaryColor }}>
                  {c.companyName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.companyName}</p>
                  <p className="text-xs text-slate-400">/{c.slug} · {c.billingTier}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs ${c.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                  {c.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {c.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => updateClient.mutate({ clientId: c.id, isActive: !c.isActive })}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
                >
                  {c.isActive ? "Deactivate" : "Activate"}
                </button>
                <a href={`/portal/${c.slug}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
