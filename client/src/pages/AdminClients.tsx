import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Globe, Plus, ArrowLeft, Building2, ExternalLink, Loader2, 
  CheckCircle2, XCircle, Settings, Calendar, BarChart3, 
  Trash2, Search, Link as LinkIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminClients() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [form, setForm] = useState({
    slug: "", clientName: "", logoUrl: "", primaryColor: "#6c3fc5",
    secondaryColor: "#1a1a2e", accentColor: "#007bff", contactEmail: "",
    billingTier: "professional" as "starter" | "professional" | "enterprise",
  });

  const { data: clientList, refetch } = trpc.clientPortal.listClients.useQuery();
  const { data: allEvents } = trpc.occ.getConferences.useQuery();

  const createClient = trpc.clientPortal.createClient.useMutation({
    onSuccess: () => { 
      toast.success("Client created"); 
      refetch(); 
      setShowForm(false); 
      setForm({ slug: "", clientName: "", logoUrl: "", primaryColor: "#6c3fc5", secondaryColor: "#1a1a2e", accentColor: "#007bff", contactEmail: "", billingTier: "professional" }); 
    },
    onError: (e) => toast.error(e.message),
  });

  const updateClient = trpc.clientPortal.updateClient.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const assignEvent = trpc.clientPortal.assignEvent.useMutation({
    onSuccess: () => { toast.success("Event assigned"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const unassignEvent = trpc.clientPortal.unassignEvent.useMutation({
    onSuccess: () => { toast.success("Event unassigned"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const clients = clientList ?? [];

  if (selectedClient) {
    const client = clients.find(c => c.id === selectedClient.id) || selectedClient;
    const clientEvents = (client as any).events || [];

    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-200">
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: client.primaryColor }}>
              {client.clientName.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{client.clientName}</h1>
              <p className="text-xs text-slate-400">Portal Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/portal/${client.slug}`} target="_blank" rel="noopener noreferrer" 
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> View Portal
            </a>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800 p-1">
              <TabsTrigger value="config" className="data-[state=active]:bg-slate-800">
                <Settings className="w-4 h-4 mr-2" /> Configuration
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-slate-800">
                <Calendar className="w-4 h-4 mr-2" /> Events
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-slate-800">
                <BarChart3 className="w-4 h-4 mr-2" /> Usage Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Branding & Identity</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Company Name</label>
                      <input 
                        defaultValue={client.clientName}
                        onBlur={(e) => updateClient.mutate({ clientId: client.id, clientName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Primary Colour</label>
                        <div className="flex items-center gap-2">
                          <input type="color" defaultValue={client.primaryColor} 
                            onBlur={(e) => updateClient.mutate({ clientId: client.id, primaryColor: e.target.value })}
                            className="h-9 w-12 bg-slate-900 border border-slate-700 rounded cursor-pointer" />
                          <span className="text-xs text-slate-400">{client.primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Accent Colour</label>
                        <div className="flex items-center gap-2">
                          <input type="color" defaultValue={client.accentColor} 
                            onBlur={(e) => updateClient.mutate({ clientId: client.id, accentColor: e.target.value })}
                            className="h-9 w-12 bg-slate-900 border border-slate-700 rounded cursor-pointer" />
                          <span className="text-xs text-slate-400">{client.accentColor}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Logo URL</label>
                      <input 
                        defaultValue={client.logoUrl}
                        onBlur={(e) => updateClient.mutate({ clientId: client.id, logoUrl: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Portal Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Portal Slug</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-2">
                        <span className="text-slate-500 text-sm">/portal/</span>
                        <span className="text-white text-sm font-medium">{client.slug}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                      <button 
                        onClick={() => updateClient.mutate({ clientId: client.id, isActive: !client.isActive })}
                        className={`w-full py-2 rounded text-sm font-medium transition-colors ${client.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-700 text-slate-300"}`}
                      >
                        {client.isActive ? "Active (Click to Deactivate)" : "Inactive (Click to Activate)"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Assigned Events</h3>
                    <span className="text-xs text-slate-500">{clientEvents.length} assigned</span>
                  </div>
                  <div className="space-y-2">
                    {clientEvents.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        <p className="text-xs text-slate-500">No events assigned yet</p>
                      </div>
                    ) : clientEvents.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-3 group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-sm font-medium text-white">{p.customTitle || p.eventId}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{p.eventId}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => unassignEvent.mutate({ assignmentId: p.id })}
                          className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Available Events</h3>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input placeholder="Search events..." className="bg-slate-900 border border-slate-700 rounded-md pl-8 pr-3 py-1 text-xs text-white focus:outline-none w-48" />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {allEvents?.filter(e => !clientEvents.some((p: any) => p.eventId === e.id)).map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between bg-slate-900/30 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-300">{e.subject}</p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider">{e.eventId}</p>
                        </div>
                        <button 
                          onClick={() => assignEvent.mutate({ clientId: client.id, eventId: e.id, customTitle: e.subject })}
                          className="px-2.5 py-1 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <h3 className="text-lg font-semibold text-white">Usage Analytics</h3>
                <p className="text-sm text-slate-500 mt-1">Analytics for this portal will be available once events are live.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

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

      <div className="p-6 max-w-5xl mx-auto">
        {showForm && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">New White-Label Client</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { label: "Company Name", key: "companyName", placeholder: "e.g. Standard Bank" },
                  { label: "Portal Slug", key: "slug", placeholder: "e.g. standard-bank" },
                  { label: "Contact Email", key: "contactEmail", placeholder: "ir@company.com" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                    <input
                      value={(form as any)[key]}
                      placeholder={placeholder}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Primary Colour</label>
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded p-2">
                    <input type="color" value={form.primaryColor} onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      className="h-10 w-16 bg-slate-900 border border-slate-700 rounded cursor-pointer" />
                    <div>
                      <span className="text-sm font-mono text-slate-300">{form.primaryColor}</span>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Brand Primary</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Billing Tier</label>
                  <select value={form.billingTier} onChange={(e) => setForm(f => ({ ...f, billingTier: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => { if (!form.slug || !form.companyName) { toast.error("Slug and company name required"); return; } createClient.mutate(form); }}
                disabled={createClient.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                {createClient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Client Portal
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-slate-800/20 border border-slate-800 rounded-2xl">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-slate-500">No client portals configured yet</p>
              <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase tracking-widest text-white transition-colors">Add First Client</button>
            </div>
          ) : clients.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setSelectedClient(c)}
              className="group bg-slate-800/40 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ background: c.primaryColor }}>
                  {c.companyName.charAt(0)}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{c.companyName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500">/portal/{c.slug}</p>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <p className="text-xs text-slate-500 capitalize">{c.billingTier}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {(c as any).events?.length || 0} Events
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`/portal/${c.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </a>
                  <div className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
