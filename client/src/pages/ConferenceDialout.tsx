import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Phone, PhoneOff, Users, Plus, Trash2, Play, Square, RefreshCw,
  CheckCircle2, XCircle, Clock, Loader2, AlertCircle, PhoneCall,
  Upload, ArrowLeft, PhoneForwarded
} from "lucide-react";

type ParticipantInput = { phoneNumber: string; label: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  queued:        { label: "Queued",       color: "bg-slate-500",    icon: <Clock className="w-3 h-3" /> },
  ringing:       { label: "Ringing",      color: "bg-amber-500",    icon: <PhoneForwarded className="w-3 h-3 animate-pulse" /> },
  "in-progress": { label: "Connected",    color: "bg-emerald-500",  icon: <PhoneCall className="w-3 h-3" /> },
  completed:     { label: "Completed",    color: "bg-slate-400",    icon: <CheckCircle2 className="w-3 h-3" /> },
  busy:          { label: "Busy",         color: "bg-orange-500",   icon: <XCircle className="w-3 h-3" /> },
  "no-answer":   { label: "No Answer",    color: "bg-orange-500",   icon: <XCircle className="w-3 h-3" /> },
  failed:        { label: "Failed",       color: "bg-red-600",      icon: <AlertCircle className="w-3 h-3" /> },
  cancelled:     { label: "Cancelled",    color: "bg-slate-400",    icon: <XCircle className="w-3 h-3" /> },
};

const DIALOUT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: "Ready",      color: "bg-slate-500" },
  dialling:   { label: "Dialling",   color: "bg-amber-500" },
  active:     { label: "Active",     color: "bg-emerald-500" },
  completed:  { label: "Completed",  color: "bg-slate-400" },
  cancelled:  { label: "Cancelled",  color: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-slate-500", icon: <Clock className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-white px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function ConferenceDialout() {
  const [view, setView] = useState<"setup" | "monitor">("setup");
  const [conferenceName, setConferenceName] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([{ phoneNumber: "", label: "" }]);
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [activeDialoutId, setActiveDialoutId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createMutation = trpc.conferenceDialout.create.useMutation();
  const startMutation = trpc.conferenceDialout.start.useMutation();
  const cancelMutation = trpc.conferenceDialout.cancel.useMutation();
  const statusQuery = trpc.conferenceDialout.status.useQuery(
    { dialoutId: activeDialoutId ?? 0 },
    { enabled: !!activeDialoutId, refetchInterval: activeDialoutId ? 3000 : false }
  );
  const historyQuery = trpc.conferenceDialout.list.useQuery({ limit: 10 });

  const addRow = () => setParticipants((prev) => [...prev, { phoneNumber: "", label: "" }]);

  const removeRow = (idx: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: "phoneNumber" | "label", value: string) => {
    setParticipants((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const parseBulk = () => {
    const lines = bulkInput.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: ParticipantInput[] = lines.map((line) => {
      const parts = line.split(/[,\t]/).map((s) => s.trim());
      return {
        phoneNumber: parts[0] ?? "",
        label: parts[1] ?? "",
      };
    });
    if (parsed.length === 0) {
      toast.error("No numbers found in the pasted text");
      return;
    }
    setParticipants(parsed);
    setShowBulk(false);
    toast.success(`Loaded ${parsed.length} numbers`);
  };

  const handleCreate = async () => {
    const validParticipants = participants.filter((p) => p.phoneNumber.trim().length >= 5);
    if (validParticipants.length === 0) {
      toast.error("Add at least one valid phone number");
      return;
    }
    if (!conferenceName.trim()) {
      toast.error("Enter a conference name");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: conferenceName.trim(),
        participants: validParticipants.map((p) => ({
          phoneNumber: p.phoneNumber.trim(),
          label: p.label.trim() || undefined,
        })),
      });
      setActiveDialoutId(result.dialoutId);
      toast.success(`Conference created with ${validParticipants.length} participants`);

      const startResult = await startMutation.mutateAsync({ dialoutId: result.dialoutId });
      toast.success(startResult.message);
      setView("monitor");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create conference");
    }
  };

  const handleCancel = async () => {
    if (!activeDialoutId) return;
    try {
      const result = await cancelMutation.mutateAsync({ dialoutId: activeDialoutId });
      toast.success(`Cancelled ${result.cancelledCalls} active calls`);
      statusQuery.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to cancel");
    }
  };

  const handleViewHistory = (id: number) => {
    setActiveDialoutId(id);
    setView("monitor");
  };

  const handleNewConference = () => {
    setView("setup");
    setActiveDialoutId(null);
    setConferenceName("");
    setParticipants([{ phoneNumber: "", label: "" }]);
    setBulkInput("");
  };

  const data = statusQuery.data;
  const isActive = data && ["dialling", "active"].includes(data.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conference Dial-Out</h1>
            <p className="text-sm text-slate-400">Dial multiple numbers into a single conference call</p>
          </div>
        </div>

        {view === "setup" ? (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                Conference Setup
              </h2>

              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1">Conference Name</label>
                <Input
                  value={conferenceName}
                  onChange={(e) => setConferenceName(e.target.value)}
                  placeholder="e.g. Q4 Earnings Call"
                  className="bg-slate-900 border-slate-600 text-white max-w-md"
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-slate-400">
                  Participants ({participants.filter((p) => p.phoneNumber.trim().length >= 5).length} valid)
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBulk(!showBulk)} className="border-slate-600 text-slate-300">
                    <Upload className="w-4 h-4 mr-1" />
                    {showBulk ? "Manual Entry" : "Bulk Paste"}
                  </Button>
                  {!showBulk && (
                    <Button variant="outline" size="sm" onClick={addRow} className="border-slate-600 text-slate-300">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  )}
                </div>
              </div>

              {showBulk ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Paste numbers, one per line. Optionally add a name after a comma or tab.
                    <br />
                    Examples: <code className="text-slate-400">0821234567, John Smith</code> or <code className="text-slate-400">+27821234567</code>
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={10}
                    placeholder={`0821234567, John Smith\n0839876543, Jane Doe\n+27711112222`}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white font-mono resize-y"
                  />
                  <Button onClick={parseBulk} className="bg-emerald-600 hover:bg-emerald-700">
                    Load Numbers
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={p.phoneNumber}
                        onChange={(e) => updateRow(idx, "phoneNumber", e.target.value)}
                        placeholder="+27821234567 or 0821234567"
                        className="bg-slate-900 border-slate-600 text-white flex-1"
                      />
                      <Input
                        value={p.label}
                        onChange={(e) => updateRow(idx, "label", e.target.value)}
                        placeholder="Name (optional)"
                        className="bg-slate-900 border-slate-600 text-white w-48"
                      />
                      {participants.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-300 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || startMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                size="lg"
              >
                {(createMutation.isPending || startMutation.isPending) ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> Start Dialling</>
                )}
              </Button>
            </div>

            {historyQuery.data && historyQuery.data.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Recent Conferences</h3>
                <div className="space-y-2">
                  {historyQuery.data.map((d: any) => {
                    const cfg = DIALOUT_STATUS_CONFIG[d.status] ?? { label: d.status, color: "bg-slate-500" };
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleViewHistory(d.id)}
                        className="w-full flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/70 transition text-left"
                      >
                        <div>
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {new Date(d.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{d.totalParticipants} participants</span>
                          <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleNewConference} className="text-slate-400">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {data && (
                <div className="flex items-center gap-3 flex-1">
                  <h2 className="text-lg font-semibold">{data.name}</h2>
                  {(() => {
                    const cfg = DIALOUT_STATUS_CONFIG[data.status] ?? { label: data.status, color: "bg-slate-500" };
                    return (
                      <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
              )}
              {isActive && (
                <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Square className="w-4 h-4 mr-1" />}
                  End All Calls
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => statusQuery.refetch()} className="border-slate-600 text-slate-300">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {data && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total" value={data.totalParticipants} icon={<Users className="w-5 h-5 text-slate-400" />} />
                  <StatCard label="Connected" value={data.connectedCount} icon={<PhoneCall className="w-5 h-5 text-emerald-400" />} />
                  <StatCard label="Failed" value={data.failedCount} icon={<XCircle className="w-5 h-5 text-red-400" />} />
                  <StatCard
                    label="Success Rate"
                    value={data.totalParticipants > 0
                      ? `${Math.round(((data.participants?.filter((p: any) => ["in-progress", "completed"].includes(p.status)).length ?? 0) / data.totalParticipants) * 100)}%`
                      : "—"}
                    icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />}
                  />
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400">Participants</span>
                    <span className="text-xs text-slate-500">{data.participants?.length ?? 0} numbers</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-800">
                        <tr className="text-slate-500 text-xs">
                          <th className="text-left px-4 py-2">#</th>
                          <th className="text-left px-4 py-2">Number</th>
                          <th className="text-left px-4 py-2">Name</th>
                          <th className="text-left px-4 py-2">Status</th>
                          <th className="text-right px-4 py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.participants ?? []).map((p: any, idx: number) => (
                          <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                            <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono text-slate-300">{p.phoneNumber}</td>
                            <td className="px-4 py-2 text-slate-400">{p.label || "—"}</td>
                            <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-2 text-right text-slate-400">
                              {p.durationSecs != null ? formatDuration(p.durationSecs) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {statusQuery.isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
