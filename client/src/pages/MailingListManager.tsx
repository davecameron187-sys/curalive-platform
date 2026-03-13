import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Upload, Mail, Users, CheckCircle2, Clock, Send, Trash2, Plus,
  FileText, ArrowLeft, RefreshCw, Eye, Download, AlertCircle, MousePointerClick
} from "lucide-react";

type ViewMode = "lists" | "create" | "detail";

export default function MailingListManager() {
  const [view, setView] = useState<ViewMode>("lists");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [eventId, setEventId] = useState("");
  const [listName, setListName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listsQuery = trpc.mailingList.getLists.useQuery({});
  const detailQuery = trpc.mailingList.getList.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );

  const createMutation = trpc.mailingList.create.useMutation();
  const importMutation = trpc.mailingList.importCSV.useMutation();
  const sendMutation = trpc.mailingList.sendInvitations.useMutation();
  const deleteMutation = trpc.mailingList.deleteList.useMutation();
  const deleteEntryMutation = trpc.mailingList.deleteEntry.useMutation();

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
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string);
    };
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

  const handleDeleteList = async (id: number) => {
    if (!confirm("Delete this mailing list and all entries?")) return;
    await deleteMutation.mutateAsync({ id });
    toast.success("Mailing list deleted");
    listsQuery.refetch();
    if (selectedListId === id) {
      setSelectedListId(null);
      setView("lists");
    }
  };

  const handleDeleteEntry = async (id: number) => {
    await deleteEntryMutation.mutateAsync({ id });
    toast.success("Entry removed");
    detailQuery.refetch();
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

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {view !== "lists" && (
              <button onClick={() => { setView("lists"); setSelectedListId(null); }}
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
          </div>
        </div>

        {/* Create View */}
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

        {/* Lists View */}
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

        {/* Detail View */}
        {view === "detail" && list && (
          <div className="space-y-6">
            {/* List Header */}
            <div className="bg-[#111827] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{list.name}</h2>
                    {statusBadge(list.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Event: {list.eventId}</p>
                </div>
                <button onClick={() => detailQuery.refetch()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${detailQuery.isFetching ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Stats */}
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

            {/* Import CSV Section */}
            <div className="bg-[#111827] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" /> Import Contacts
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV file with columns: <code className="text-blue-400">firstName, lastName, email</code> (required), plus optional <code className="text-blue-400">company, jobTitle</code>. PINs are generated automatically.
              </p>

              <div className="flex gap-3 mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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
                  <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    className="w-full h-32 bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Paste CSV here..."
                  />
                  <button onClick={handleImport} disabled={importing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
                    {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import & Generate PINs
                  </button>
                </div>
              )}
            </div>

            {/* Send Invitations */}
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
                  <textarea
                    value={personalMessage}
                    onChange={e => setPersonalMessage(e.target.value)}
                    className="w-full h-20 bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Add a personal note to include in the invitation email..."
                  />
                </div>
                <button onClick={handleSend} disabled={sending}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-bold transition-colors">
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Registration Emails
                </button>
              </div>
            )}

            {/* Entries Table */}
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
                        <th className="text-left px-5 py-3 font-medium">Status</th>
                        <th className="text-right px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {list.entries.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-medium">{entry.firstName} {entry.lastName}</td>
                          <td className="px-5 py-3 text-gray-400">{entry.email}</td>
                          <td className="px-5 py-3 text-gray-500">{entry.company || "—"}</td>
                          <td className="px-5 py-3">
                            {entry.accessPin ? (
                              <code className="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs font-mono">{entry.accessPin}</code>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">{statusBadge(entry.status)}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded transition-colors" title="Remove">
                              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
