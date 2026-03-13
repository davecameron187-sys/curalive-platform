import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Upload, Mail, Users, CheckCircle2, Clock, Send, Trash2, Plus,
  FileText, ArrowLeft, RefreshCw, Eye, Download, AlertCircle, MousePointerClick,
  Phone, Monitor, Video, Globe, Key, Webhook, Zap, Copy, ShieldCheck, X
} from "lucide-react";

type ViewMode = "lists" | "create" | "detail";
type JoinMethod = "phone" | "teams" | "zoom" | "web";

const JOIN_METHOD_LABELS: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  phone: { label: "Phone", icon: Phone, color: "text-violet-400" },
  teams: { label: "Teams", icon: Monitor, color: "text-indigo-400" },
  zoom: { label: "Zoom", icon: Video, color: "text-blue-400" },
  web: { label: "Web", icon: Globe, color: "text-emerald-400" },
};

export default function MailingListManager() {
  const [view, setView] = useState<ViewMode>("lists");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [eventId, setEventId] = useState("");
  const [listName, setListName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preRegistering, setPreRegistering] = useState(false);
  const [preRegMethod, setPreRegMethod] = useState<JoinMethod>("phone");
  const [showPreRegModal, setShowPreRegModal] = useState(false);
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listsQuery = trpc.mailingList.getLists.useQuery({});
  const detailQuery = trpc.mailingList.getList.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );

  const apiKeysQuery = trpc.crmApi.listKeys.useQuery(
    { eventId: detailQuery.data?.eventId },
    { enabled: !!detailQuery.data?.eventId && showApiPanel }
  );

  const createMutation = trpc.mailingList.create.useMutation();
  const importMutation = trpc.mailingList.importCSV.useMutation();
  const sendMutation = trpc.mailingList.sendInvitations.useMutation();
  const deleteMutation = trpc.mailingList.deleteList.useMutation();
  const deleteEntryMutation = trpc.mailingList.deleteEntry.useMutation();
  const preRegisterMutation = trpc.mailingList.preRegisterAll.useMutation();
  const generateKeyMutation = trpc.crmApi.generateKey.useMutation();
  const revokeKeyMutation = trpc.crmApi.revokeKey.useMutation();
  const deleteKeyMutation = trpc.crmApi.deleteKey.useMutation();
  const setWebhookMutation = trpc.crmApi.setWebhookUrl.useMutation();

  const handleCreate = async () => {
    if (!eventId.trim() || !listName.trim()) {
      toast.error("Please fill in event ID and list name");
      return;
    }
    const result = await createMutation.mutateAsync({ eventId: eventId.trim(), name: listName.trim() });
    if (result.success) {
      toast.success("Mailing list created");
      setSelectedListId(result.id!);
      setView("detail");
      listsQuery.refetch();
      setEventId("");
      setListName("");
    } else {
      toast.error(result.error || "Failed to create list");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedListId || !csvText.trim()) {
      toast.error("Please upload or paste a CSV file");
      return;
    }
    setImporting(true);
    try {
      const result = await importMutation.mutateAsync({ mailingListId: selectedListId, csvText });
      if (result.success) {
        toast.success(`Imported ${result.imported} entries (${result.duplicates} duplicates skipped)`);
        setCsvText("");
        detailQuery.refetch();
        listsQuery.refetch();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    }
    setImporting(false);
  };

  const handleSend = async () => {
    if (!selectedListId) return;
    setSending(true);
    try {
      const result = await sendMutation.mutateAsync({
        mailingListId: selectedListId,
        personalMessage: personalMessage.trim() || undefined,
      });
      if (result.success) {
        toast.success(`Sent ${result.sent} invitations (${result.failed} failed)`);
        detailQuery.refetch();
        listsQuery.refetch();
      } else {
        toast.error(result.error || "Failed to send invitations");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    }
    setSending(false);
  };

  const handlePreRegister = async () => {
    if (!selectedListId) return;
    setPreRegistering(true);
    try {
      const result = await preRegisterMutation.mutateAsync({
        mailingListId: selectedListId,
        defaultJoinMethod: preRegMethod,
      });
      if (result.success) {
        toast.success(`Pre-registered ${result.registered} contacts (${result.skipped} already existed)`);
        detailQuery.refetch();
        listsQuery.refetch();
        setShowPreRegModal(false);
      } else {
        toast.error(result.error || "Pre-registration failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Pre-registration failed");
    }
    setPreRegistering(false);
  };

  const handleGenerateApiKey = async () => {
    if (!apiKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    const result = await generateKeyMutation.mutateAsync({
      name: apiKeyName.trim(),
      eventId: detailQuery.data?.eventId,
    });
    if (result.success) {
      setNewApiKey(result.apiKey!);
      setApiKeyName("");
      apiKeysQuery.refetch();
      toast.success("API key generated");
    }
  };

  const handleRevokeKey = async (id: number) => {
    await revokeKeyMutation.mutateAsync({ id });
    toast.success("API key revoked");
    apiKeysQuery.refetch();
  };

  const handleDeleteKey = async (id: number) => {
    await deleteKeyMutation.mutateAsync({ id });
    toast.success("API key deleted");
    apiKeysQuery.refetch();
  };

  const handleSaveWebhook = async () => {
    if (!selectedListId) return;
    const effectiveUrl = webhookUrl !== null ? webhookUrl : ((list as any)?.webhookUrl || "");
    const result = await setWebhookMutation.mutateAsync({
      mailingListId: selectedListId,
      webhookUrl: effectiveUrl.trim(),
    });
    if (result.success) {
      toast.success(effectiveUrl.trim() ? "Webhook URL saved" : "Webhook URL removed");
      detailQuery.refetch();
    }
  };

  const handleDeleteList = async (id: number) => {
    if (!confirm("Delete this mailing list and all entries?")) return;
    await deleteMutation.mutateAsync({ id });
    toast.success("Mailing list deleted");
    listsQuery.refetch();
    if (selectedListId === id) { setSelectedListId(null); setView("lists"); }
  };

  const handleDeleteEntry = async (id: number) => {
    await deleteEntryMutation.mutateAsync({ id });
    toast.success("Entry removed");
    detailQuery.refetch();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-gray-500/15 text-gray-400 border-gray-500/20",
      pin_assigned: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      emailed: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      clicked: "bg-purple-500/15 text-purple-400 border-purple-500/20",
      registered: "bg-green-500/15 text-green-400 border-green-500/20",
      draft: "bg-gray-500/15 text-gray-400 border-gray-500/20",
      processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      sending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      sent: "bg-green-500/15 text-green-400 border-green-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${styles[status] || styles.pending}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const list = detailQuery.data;
  const hasUnregistered = list?.entries?.some((e: any) => e.status !== "registered");

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {view !== "lists" && (
              <button onClick={() => { setView("lists"); setSelectedListId(null); setShowApiPanel(false); setWebhookUrl(null); setNewApiKey(null); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Mailing Lists</h1>
              <p className="text-sm text-gray-500 mt-1">Import contacts, auto-generate PINs, send one-click registration emails</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view === "lists" && (
              <button onClick={() => setView("create")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> New Mailing List
              </button>
            )}
            {view === "detail" && (
              <button onClick={() => setShowApiPanel(!showApiPanel)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${showApiPanel ? "bg-violet-500/20 text-violet-400 border border-violet-500/40" : "bg-white/5 hover:bg-white/10 border border-white/10"}`}>
                <Key className="w-4 h-4" /> CRM API
              </button>
            )}
          </div>
        </div>

        {view === "create" && (
          <div className="bg-[#111827] rounded-xl border border-white/10 p-6 max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Create Mailing List</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Event ID</label>
                <input value={eventId} onChange={e => setEventId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. q4-earnings-2026" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">List Name</label>
                <input value={listName} onChange={e => setListName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Q4 Analyst Distribution List" />
              </div>
              <button onClick={handleCreate} disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
                {createMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create & Continue
              </button>
            </div>
          </div>
        )}

        {view === "lists" && (
          <div className="space-y-3">
            {listsQuery.data?.length === 0 && (
              <div className="text-center py-16 bg-[#111827] rounded-xl border border-white/10">
                <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-lg font-medium">No mailing lists yet</p>
                <p className="text-gray-600 text-sm mt-1">Create a mailing list to import contacts and send one-click registration emails</p>
                <button onClick={() => setView("create")}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">
                  Create First List
                </button>
              </div>
            )}
            {listsQuery.data?.map(ml => (
              <div key={ml.id} className="bg-[#111827] rounded-xl border border-white/10 p-5 flex items-center justify-between hover:border-white/20 transition-colors">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => { setSelectedListId(ml.id); setView("detail"); }}>
                  <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{ml.name}</span>
                      {statusBadge(ml.status)}
                      {ml.preRegistered && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border bg-violet-500/15 text-violet-400 border-violet-500/20">
                          Zero-Click
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Event: {ml.eventId}</span>
                      <span>·</span>
                      <span>{ml.totalEntries} contacts</span>
                      <span>·</span>
                      <span>{ml.emailedEntries} emailed</span>
                      <span>·</span>
                      <span>{ml.registeredEntries} registered</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelectedListId(ml.id); setView("detail"); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View details">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDeleteList(ml.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete list">
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "detail" && list && (
          <div className="space-y-6">
            <div className="bg-[#111827] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{list.name}</h2>
                    {statusBadge(list.status)}
                    {list.preRegistered && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border bg-violet-500/15 text-violet-400 border-violet-500/20">
                        Zero-Click
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Event: {list.eventId}</p>
                </div>
                <button onClick={() => detailQuery.refetch()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${detailQuery.isFetching ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Contacts", value: list.totalEntries, icon: Users, color: "blue" },
                  { label: "PINs Generated", value: list.processedEntries, icon: CheckCircle2, color: "emerald" },
                  { label: "Emails Sent", value: list.emailedEntries, icon: Send, color: "amber" },
                  { label: "Registered", value: list.registeredEntries, icon: CheckCircle2, color: "green" },
                ].map(stat => (
                  <div key={stat.label} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`w-3.5 h-3.5 text-${stat.color}-400`} />
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{stat.label}</span>
                    </div>
                    <span className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {showApiPanel && (
              <div className="bg-[#111827] rounded-xl border border-violet-500/30 p-6 space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-violet-400" /> CRM API Integration
                </h3>

                <div className="bg-[#0a0d14] rounded-lg p-4 border border-white/5">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-blue-400" /> Webhook URL
                  </h4>
                  <div className="flex gap-2">
                    <input
                      value={webhookUrl !== null ? webhookUrl : ((list as any).webhookUrl || "")}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                      placeholder="https://your-crm.com/webhooks/curalive"
                    />
                    <button onClick={handleSaveWebhook}
                      className="px-3 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg text-sm font-semibold transition-colors">
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Receive POST notifications when participants register for this event.</p>
                </div>

                <div className="bg-[#0a0d14] rounded-lg p-4 border border-white/5">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> API Keys
                  </h4>

                  {newApiKey && (
                    <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-xs text-emerald-400 font-semibold mb-2">New API Key — copy now, it won't be shown again:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-[#0a0d14] px-3 py-2 rounded text-xs font-mono text-emerald-300 break-all">{newApiKey}</code>
                        <button onClick={() => copyToClipboard(newApiKey)} className="p-2 hover:bg-white/10 rounded transition-colors">
                          <Copy className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                      <button onClick={() => setNewApiKey(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-300">Dismiss</button>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <input
                      value={apiKeyName}
                      onChange={e => setApiKeyName(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                      placeholder="Key name (e.g. Salesforce Prod)"
                    />
                    <button onClick={handleGenerateApiKey} disabled={generateKeyMutation.isPending}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                      Generate Key
                    </button>
                  </div>

                  {apiKeysQuery.data && apiKeysQuery.data.length > 0 && (
                    <div className="space-y-2">
                      {apiKeysQuery.data.map((k: any) => (
                        <div key={k.id} className={`flex items-center justify-between p-3 rounded-lg border ${k.active ? "border-white/10 bg-white/[0.02]" : "border-red-500/20 bg-red-500/5 opacity-60"}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{k.name}</span>
                              <code className="text-xs text-gray-500 font-mono">{k.keyPrefix}...</code>
                              {!k.active && <span className="text-[10px] text-red-400 font-semibold uppercase">Revoked</span>}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Created {new Date(k.createdAt).toLocaleDateString()}
                              {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {k.active && (
                              <button onClick={() => handleRevokeKey(k.id)}
                                className="px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/20 rounded transition-colors">
                                Revoke
                              </button>
                            )}
                            <button onClick={() => handleDeleteKey(k.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#0a0d14] rounded-lg p-4 border border-white/5">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">API Usage</h4>
                  <p className="text-xs text-gray-500 mb-3">Use these tRPC endpoints from your CRM to push/pull registration data:</p>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-emerald-400">crmApi.createRegistration</span>
                      <span className="text-gray-500"> — Register a single contact</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-emerald-400">crmApi.bulkCreateRegistrations</span>
                      <span className="text-gray-500"> — Bulk register (up to 500)</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-blue-400">crmApi.getRegistrationStatus</span>
                      <span className="text-gray-500"> — Check if email is registered</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-blue-400">crmApi.listRegistrations</span>
                      <span className="text-gray-500"> — List all registrations for event</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-blue-400">crmApi.getEventStats</span>
                      <span className="text-gray-500"> — Registration stats by join method</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#111827] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" /> Import Contacts
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV file with columns: <code className="text-blue-400">firstName, lastName, email</code> (required), plus optional <code className="text-blue-400">company, jobTitle</code>. PINs are generated automatically.
              </p>
              <div className="flex gap-3 mb-4">
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
                  <FileText className="w-4 h-4" /> Choose CSV File
                </button>
                <button onClick={() => setCsvText("firstName,lastName,email,company,jobTitle\nJohn,Smith,john@example.com,Acme Corp,Analyst\nJane,Doe,jane@example.com,Beta Inc,Portfolio Manager")}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Load sample CSV
                </button>
              </div>
              {csvText && (
                <div className="space-y-3">
                  <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                    className="w-full h-32 bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Paste CSV here..." />
                  <button onClick={handleImport} disabled={importing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
                    {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import & Generate PINs
                  </button>
                </div>
              )}
            </div>

            {list.entries && list.entries.some((e: any) => e.status === "pin_assigned") && (
              <div className="bg-[#111827] rounded-xl border border-blue-500/30 p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-400" /> Send Invitations
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Send "Click to Register" emails to {list.entries.filter((e: any) => e.status === "pin_assigned").length} contacts.
                  Each email contains a personalised one-click registration button.
                </p>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1.5">Personal Message (optional)</label>
                  <textarea value={personalMessage} onChange={e => setPersonalMessage(e.target.value)}
                    className="w-full h-20 bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Add a personal note to include in the invitation email..." />
                </div>
                <button onClick={handleSend} disabled={sending}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-bold transition-colors">
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Registration Emails
                </button>
              </div>
            )}

            {hasUnregistered && list.entries && list.entries.length > 0 && (
              <div className="bg-[#111827] rounded-xl border border-violet-500/30 p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" /> Zero-Click Pre-Registration
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Pre-register all contacts instantly. They'll receive a confirmation email with their join details — no click required.
                  Choose a default join method for all contacts.
                </p>
                <button onClick={() => setShowPreRegModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-lg text-sm font-bold transition-colors">
                  <Zap className="w-4 h-4" /> Pre-Register All Contacts
                </button>
              </div>
            )}

            {list.entries && list.entries.length > 0 && (
              <div className="bg-[#111827] rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Contact List ({list.entries.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Name</th>
                        <th className="text-left px-5 py-3 font-medium">Email</th>
                        <th className="text-left px-5 py-3 font-medium">Company</th>
                        <th className="text-left px-5 py-3 font-medium">PIN</th>
                        <th className="text-left px-5 py-3 font-medium">Join Method</th>
                        <th className="text-left px-5 py-3 font-medium">Status</th>
                        <th className="text-right px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {list.entries.map((entry: any) => {
                        const jm = JOIN_METHOD_LABELS[entry.joinMethod];
                        return (
                          <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3 font-medium">{entry.firstName} {entry.lastName}</td>
                            <td className="px-5 py-3 text-gray-400">{entry.email}</td>
                            <td className="px-5 py-3 text-gray-500">{entry.company || "—"}</td>
                            <td className="px-5 py-3">
                              {entry.accessPin ? (
                                <code className="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs font-mono">{entry.accessPin}</code>
                              ) : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              {jm ? (
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <jm.icon className={`w-3 h-3 ${jm.color}`} />
                                  <span className="text-gray-300">{jm.label}</span>
                                </span>
                              ) : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-5 py-3">{statusBadge(entry.status)}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors" title="Remove">
                                <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {showPreRegModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111827] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" /> Zero-Click Pre-Registration
                </h3>
                <button onClick={() => setShowPreRegModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-400">
                  Choose the default join method. All {list?.entries?.filter((e: any) => e.status !== "registered").length || 0} unregistered contacts will be instantly registered and receive a confirmation email.
                </p>
                <div className="space-y-2">
                  {(["phone", "teams", "zoom", "web"] as JoinMethod[]).map(method => {
                    const m = JOIN_METHOD_LABELS[method];
                    const Icon = m.icon;
                    return (
                      <button key={method} onClick={() => setPreRegMethod(method)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          preRegMethod === method ? "border-violet-500/40 bg-violet-500/10" : "border-white/10 hover:border-white/20"
                        }`}>
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        <span className="font-medium text-sm">{m.label}</span>
                        {preRegMethod === method && (
                          <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 border-t border-white/10">
                <button onClick={handlePreRegister} disabled={preRegistering}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-colors">
                  {preRegistering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {preRegistering ? "Pre-Registering..." : `Pre-Register via ${JOIN_METHOD_LABELS[preRegMethod].label}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
