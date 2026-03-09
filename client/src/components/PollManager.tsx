import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BarChart2, Plus, Play, Square, Trash2, Loader2, ChevronDown, CheckCircle2, Clock } from "lucide-react";

interface Props {
  eventId: string;
  className?: string;
}

const POLL_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "rating_scale", label: "Rating Scale" },
  { value: "word_cloud", label: "Word Cloud" },
];

export default function PollManager({ eventId, className = "" }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<"multiple_choice" | "rating_scale" | "word_cloud" | "yes_no">("multiple_choice");
  const [options, setOptions] = useState(["", ""]);

  const { data: polls, refetch } = trpc.polls.listForEvent.useQuery({ eventId });
  const { data: results } = trpc.polls.getResults.useQuery(
    { pollId: polls?.find(p => p.status === "closed" || p.status === "active")?.id ?? 0 },
    { enabled: !!(polls?.some(p => p.status === "closed" || p.status === "active")) }
  );

  const create = trpc.polls.create.useMutation({
    onSuccess: () => { toast.success("Poll created"); refetch(); setShowCreate(false); setQuestion(""); setOptions(["", ""]); },
    onError: (e) => toast.error(e.message),
  });

  const launch = trpc.polls.launch.useMutation({
    onSuccess: () => { toast.success("Poll launched"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const close = trpc.polls.close.useMutation({
    onSuccess: () => { toast.success("Poll closed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deletePoll = trpc.polls.delete.useMutation({
    onSuccess: () => { toast.success("Poll removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    draft: "bg-slate-600/50 text-slate-300",
    active: "bg-emerald-500/20 text-emerald-300",
    closed: "bg-blue-500/20 text-blue-300",
    archived: "bg-slate-700/50 text-slate-500",
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Polls ({polls?.length ?? 0})</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Poll
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Poll Type</label>
            <select
              value={pollType}
              onChange={(e) => setPollType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {POLL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          {pollType === "multiple_choice" && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Options</label>
              {options.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              ))}
              {options.length < 6 && (
                <button onClick={() => setOptions([...options, ""])} className="text-xs text-teal-400 hover:text-teal-300">
                  + Add option
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!question.trim()) { toast.error("Enter a question"); return; }
                const filteredOpts = pollType === "multiple_choice" ? options.filter(o => o.trim()) : undefined;
                if (pollType === "multiple_choice" && (filteredOpts?.length ?? 0) < 2) { toast.error("Add at least 2 options"); return; }
                create.mutate({ eventId, question, pollType, options: filteredOpts });
              }}
              disabled={create.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded text-xs font-medium text-white transition-colors"
            >
              {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(!polls || polls.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No polls created yet</p>
        )}
        {polls?.map((poll) => (
          <div key={poll.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-white leading-snug flex-1">{poll.question}</p>
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusColor[poll.status] ?? statusColor.draft}`}>
                {poll.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-2">{POLL_TYPES.find(t => t.value === poll.pollType)?.label}</p>
            <div className="flex gap-1.5">
              {poll.status === "draft" && (
                <button
                  onClick={() => launch.mutate({ pollId: poll.id })}
                  disabled={launch.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700/40 hover:bg-emerald-700/70 border border-emerald-600/30 rounded text-xs text-emerald-300 transition-colors"
                >
                  <Play className="w-3 h-3" /> Launch
                </button>
              )}
              {poll.status === "active" && (
                <button
                  onClick={() => close.mutate({ pollId: poll.id })}
                  disabled={close.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/40 hover:bg-amber-700/70 border border-amber-600/30 rounded text-xs text-amber-300 transition-colors"
                >
                  <Square className="w-3 h-3" /> Close
                </button>
              )}
              {(poll.status === "draft" || poll.status === "closed") && (
                <button
                  onClick={() => deletePoll.mutate({ pollId: poll.id })}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-700/20 hover:bg-red-700/40 border border-red-600/20 rounded text-xs text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
