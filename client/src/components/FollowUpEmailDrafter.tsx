import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Loader2, Copy, Send, ChevronDown, ChevronUp, RefreshCw, CheckCircle2 } from "lucide-react";

interface Props {
  meetingDbId: number;
  roadshowId: string;
  investorId: number;
  investorName: string;
  investorEmail?: string | null;
  meetingStatus: string;
}

export function FollowUpEmailDrafter({ meetingDbId, roadshowId, investorId, investorName, investorEmail, meetingStatus }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState<{
    subject: string;
    greeting: string;
    body: string;
    callToAction: string;
    signOff: string;
    investorName: string;
    investorEmail?: string | null;
    institution: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = trpc.roadshowAI.draftFollowUpEmail.useMutation({
    onSuccess: (data) => {
      setDraft(data);
      setIsExpanded(true);
      toast.success("Follow-up email drafted");
    },
    onError: (e) => toast.error(e.message),
  });

  const fullEmail = draft
    ? `${draft.greeting}\n\n${draft.body}\n\n${draft.callToAction}\n\n${draft.signOff}`
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${draft?.subject}\n\n${fullEmail}`);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show for completed meetings or in-progress
  if (!["completed", "in_progress"].includes(meetingStatus)) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Follow-Up Email Drafter</span>
          {draft && (
            <span className="text-[10px] font-semibold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-1.5 py-0.5 rounded">
              Draft Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              generate.mutate({ meetingDbId, roadshowId, investorId });
            }}
            disabled={generate.isPending}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
          >
            {generate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {generate.isPending ? "Drafting…" : draft ? "Redraft" : "Draft Email"}
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {generate.isPending ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span className="text-sm text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                Analysing meeting signals and drafting personalised email…
              </span>
            </div>
          ) : !draft ? (
            <div className="text-center py-8">
              <Mail className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                No draft yet for {investorName}
              </p>
              <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                Click "Draft Email" to generate a personalised follow-up based on commitment signals and briefing notes.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {/* Email metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">To</div>
                  <div className="text-xs text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {draft.investorName}
                    {draft.investorEmail && <span className="text-slate-500 ml-1">&lt;{draft.investorEmail}&gt;</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Institution</div>
                  <div className="text-xs text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>{draft.institution}</div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white">
                  {draft.subject}
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Body</div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 space-y-3">
                  <p className="text-sm text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>{draft.greeting}</p>
                  <div className="border-t border-slate-700" />
                  {draft.body.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{para}</p>
                  ))}
                  <div className="border-t border-slate-700" />
                  <p className="text-sm text-emerald-300 leading-relaxed italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {draft.callToAction}
                  </p>
                  <p className="text-sm text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>{draft.signOff}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                {draft.investorEmail && (
                  <a
                    href={`mailto:${draft.investorEmail}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(fullEmail)}`}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Open in Email Client
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
