import { useState, useEffect } from "react";
import { BarChart2, CheckCircle2, Star, Type, ThumbsUp, ThumbsDown } from "lucide-react";
import { Poll } from "@/contexts/AblyContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  poll: Poll;
  onVote: (pollId: string, optionId: string, value?: any) => void;
  votedOptionId?: string | null;
}

export default function LivePoll({ poll, onVote, votedOptionId }: Props) {
  const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
  const [wordInput, setWordInput] = useState("");

  const renderContent = () => {
    switch (poll.question.toLowerCase().includes("yes") || poll.question.toLowerCase().includes("no") ? "yes_no" : "multiple_choice") {
      case "multiple_choice":
        return (
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isSelected = votedOptionId === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => !votedOptionId && onVote(poll.id, opt.id)}
                  disabled={!!votedOptionId}
                  className={`w-full text-left rounded-lg p-3 relative overflow-hidden transition-all border ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : votedOptionId
                      ? "border-border bg-muted/30 cursor-default"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {votedOptionId && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-700"
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    {votedOptionId && (
                      <span className="text-xs font-semibold text-primary ml-2">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            {poll.options.map((opt) => (
               <button
                  key={opt.id}
                  onClick={() => !votedOptionId && onVote(poll.id, opt.id)}
                  disabled={!!votedOptionId}
                  className="w-full text-left rounded-lg p-3 border border-border bg-card hover:border-primary/50"
               >
                 {opt.label}
               </button>
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-border rounded-xl p-5 shadow-xl max-w-md w-full mx-auto"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Live Poll</h3>
          <p className="text-[10px] text-muted-foreground uppercase">{poll.status === 'live' ? 'Voting Open' : 'Results'}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-6 leading-tight">{poll.question}</h2>

      {renderContent()}

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{totalVotes} total votes</span>
        {votedOptionId && <span className="text-primary font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Vote recorded</span>}
      </div>
    </motion.div>
  );
}
