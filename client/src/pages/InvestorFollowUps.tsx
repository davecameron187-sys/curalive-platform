import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail, ArrowLeft, Loader2, RefreshCw, Send, CheckCircle2,
  Clock, XCircle, Building2, User, MessageSquare, Edit3, ExternalLink
} from "lucide-react";

const STATUS_STYLES: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: Clock, label: "Pending" },
  contacted: { color: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: Send, label: "Contacted" },
  resolved: { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2, label: "Resolved" },
  dismissed: { color: "bg-slate-600/30 text-slate-400 border-slate-600/30", icon: XCircle, label: "Dismissed" },
};

export default function InvestorFollowUps() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [extracting, setExtracting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTemplate, setEditedTemplate] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);

  const { data: followups, refetch } = trpc.followups.getFollowupsByEvent.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId }
  );

  const extractFollowups = trpc.followups.extractFollowups.useMutation({
    onMutate: () => setExtracting(true),
    onSuccess: (data) => {
      toast.success(`${data.extracted} follow-ups extracted`);
      refetch();
      setExtracting(false);
    },
    onError: (e) => { toast.error(e.message); setExtracting(false); },
  });

  const updateStatus = trpc.followups.updateFollowupStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const saveTemplate = trpc.followups.updateEmailTemplate.useMutation({
    onSuccess: () => { toast.success("Template saved"); refetch(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });

  const sendEmail = trpc.followups.sendFollowupEmail.useMutation({
    onMutate: (vars) => setSendingId(vars.followupId),
    onSuccess: () => { toast.success("Follow-up sent"); refetch(); setSendingId(null); },
    onError: (e) => { toast.error(e.message); setSendingId(null); },
  });

  const syncCRM = trpc.followups.syncToCRM.useMutation({
    onSuccess: (data) => toast.success(data.note ?? "Synced to CRM"),
    onError: (e) => toast.error(e.message),
  });

  const list = followups ?? [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/post-event/${eventId}`)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Investor Follow-Ups</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <button
          onClick={() => extractFollowups.mutate({ eventId: eventId ?? "" })}
          disabled={extracting}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-700/60 hover:bg-violet-700 border border-violet-600/40 rounded text-xs font-medium text-violet-200 transition-colors"
        >
          {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {extracting ? "Extracting..." : "Extract from Transcript"}
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(["pending", "contacted", "resolved", "dismissed"] as const).map(status => {
            const { color, icon: Icon, label } = STATUS_STYLES[status];
            const count = list.filter(f => f.followUpStatus === status).length;
            return (
              <div key={status} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-10 text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-30" />
            <h2 className="text-sm font-semibold text-white mb-2">No follow-ups yet</h2>
            <p className="text-xs text-slate-400 mb-4">Click "Extract from Transcript" to use AI to identify investor follow-up commitments from this event's Q&A and transcript.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((f) => {
              const { color, icon: StatusIcon, label } = STATUS_STYLES[f.followUpStatus] ?? STATUS_STYLES.pending;
              const isEditing = editingId === f.id;
              const isSending = sendingId === f.id;
              return (
                <div key={f.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-white">{f.investorName ?? "Unknown Investor"}</span>
                        {f.investorCompany && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Building2 className="w-3 h-3" /> {f.investorCompany}
                          </span>
                        )}
                      </div>
                      {f.investorEmail && (
                        <p className="text-xs text-violet-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {f.investorEmail}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
                      <StatusIcon className="w-3 h-3" /> {label}
                    </span>
                  </div>

                  {f.questionText && (
                    <div className="bg-slate-900/50 rounded p-3 border-l-2 border-violet-500/30">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Question
                      </p>
                      <p className="text-sm text-slate-300">{f.questionText}</p>
                    </div>
                  )}

                  {f.commitmentText && (
                    <div className="bg-emerald-500/5 rounded p-3 border-l-2 border-emerald-500/30">
                      <p className="text-xs text-slate-500 mb-1">Company Commitment</p>
                      <p className="text-sm text-slate-300">{f.commitmentText}</p>
                    </div>
                  )}

                  {f.emailTemplate && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs text-slate-500">Email Template</p>
                        <button onClick={() => { setEditingId(isEditing ? null : f.id); setEditedTemplate(f.emailTemplate ?? ""); }}
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                          <Edit3 className="w-3 h-3" /> {isEditing ? "Cancel" : "Edit"}
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedTemplate}
                            onChange={(e) => setEditedTemplate(e.target.value)}
                            rows={6}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                          />
                          <button onClick={() => saveTemplate.mutate({ followupId: f.id, template: editedTemplate })}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded text-xs text-white font-medium transition-colors">
                            Save Template
                          </button>
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-400 bg-slate-900/40 rounded p-3 whitespace-pre-wrap font-mono">{f.emailTemplate}</pre>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {f.followUpStatus === "pending" && f.investorEmail && (
                      <button
                        onClick={() => sendEmail.mutate({ followupId: f.id, emailBody: f.emailTemplate ?? "", recipientEmail: f.investorEmail! })}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-700/50 hover:bg-violet-700 border border-violet-600/30 rounded text-xs text-violet-200 transition-colors"
                      >
                        {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Email
                      </button>
                    )}
                    {f.followUpStatus !== "resolved" && (
                      <button onClick={() => updateStatus.mutate({ followupId: f.id, status: "resolved" })}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/30 rounded text-xs text-emerald-300 transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                    {!f.crmContactId && (
                      <button onClick={() => syncCRM.mutate({ followupId: f.id })}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Sync to CRM
                      </button>
                    )}
                    {f.crmContactId && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> CRM synced
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
