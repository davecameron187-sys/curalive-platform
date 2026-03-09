import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart2, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  eventId: string;
  className?: string;
}

export default function PollWidget({ eventId, className = "" }: Props) {
  const [voterSession] = useState(() => Math.random().toString(36).slice(2));
  const [voted, setVoted] = useState<number | null>(null);

  const { data: activePoll, refetch: refetchPoll } = trpc.polls.getActive.useQuery(
    { eventId },
    { refetchInterval: 5000 }
  );

  const { data: results, refetch: refetchResults } = trpc.polls.getResults.useQuery(
    { pollId: activePoll?.poll.id ?? 0 },
    { enabled: !!activePoll?.poll.id, refetchInterval: 3000 }
  );

  const voteMutation = trpc.polls.vote.useMutation({
    onSuccess: (data) => {
      if (data.voted) refetchResults();
    },
  });

  if (!activePoll) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-slate-500 ${className}`}>
        <BarChart2 className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">No active poll</p>
      </div>
    );
  }

  const { poll, options } = activePoll;
  const totalVotes = results?.totalVotes ?? 0;
  const hasVoted = voted !== null;

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-semibold text-teal-400 uppercase tracking-wide">Live Poll</span>
      </div>

      <p className="text-sm font-medium text-white mb-4">{poll.question}</p>

      <div className="space-y-2">
        {options.map((opt) => {
          const optVotes = results?.options.find(o => o.id === opt.id)?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
          const isSelected = voted === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => {
                if (hasVoted) return;
                setVoted(opt.id);
                voteMutation.mutate({ pollId: poll.id, optionId: opt.id, voterSession });
              }}
              disabled={hasVoted || voteMutation.isPending}
              className={`w-full text-left rounded-lg p-3 relative overflow-hidden transition-all border ${
                isSelected
                  ? "border-teal-500 bg-teal-500/10"
                  : hasVoted
                  ? "border-slate-600 bg-slate-700/30 cursor-default"
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700"
              }`}
            >
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-teal-500/15 transition-all duration-700 rounded-lg"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />}
                  <span className="text-sm text-white">{opt.optionText}</span>
                </div>
                {hasVoted && (
                  <span className="text-xs font-medium text-teal-400 ml-2 flex-shrink-0">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        {hasVoted && <span className="text-teal-500">Response submitted</span>}
        {!hasVoted && poll.isAnonymous && <span>Anonymous</span>}
      </div>
    </div>
  );
}
