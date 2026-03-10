import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Zap, AlertTriangle, Info, CheckCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BroadcasterPanelProps {
  eventId: string;
}

const PRIORITY_CONFIG = {
  critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", badge: "bg-red-500/20 text-red-300" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badge: "bg-amber-500/20 text-amber-300" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", badge: "bg-blue-500/20 text-blue-300" },
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: "Engagement",
  compliance: "Compliance",
  pace: "Pace",
  content: "Content",
  qa: "Q&A",
};

export function IntelligentBroadcasterPanel({ eventId }: BroadcasterPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const adaptMutation = trpc.webcast.adaptContent.useMutation({
    onSuccess: () => setLastUpdated(new Date()),
    onError: () => toast.error("Failed to fetch broadcaster suggestions"),
  });

  useEffect(() => {
    adaptMutation.mutate({ eventId });
    const interval = setInterval(() => adaptMutation.mutate({ eventId }), 20000);
    return () => clearInterval(interval);
  }, [eventId]);

  const suggestions = (adaptMutation.data?.suggestions ?? []).filter(s => !dismissed.has(s.id));
  const engagementScore = adaptMutation.data?.engagementScore ?? 0;
  const recommendedAction = adaptMutation.data?.recommendedAction ?? "";

  const handleAction = (action: string | undefined, id: string) => {
    if (action === "launch_poll") toast.success("Poll suggestion noted — switch to Polls tab to launch");
    else if (action === "flag_qa") toast.success("Q&A flagged for compliance review");
    else if (action === "send_reminder") toast.success("Reminder noted — switch to Reminders tab");
    else if (action === "adjust_pace") toast.success("Pace alert sent to presenter coaching");
    setDismissed(prev => new Set(prev).add(id));
  };

  const EngagementIcon = engagementScore >= 70 ? TrendingUp : engagementScore >= 40 ? Minus : TrendingDown;
  const engagementColor = engagementScore >= 70 ? "text-emerald-400" : engagementScore >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200">Intelligent Broadcaster</span>
        </div>
        <button
          onClick={() => adaptMutation.mutate({ eventId })}
          disabled={adaptMutation.isPending}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${adaptMutation.isPending ? "animate-spin" : ""}`} />
          {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </button>
      </div>

      <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 mb-0.5">Engagement Score</div>
          <div className={`text-2xl font-bold ${engagementColor}`}>{engagementScore}</div>
        </div>
        <EngagementIcon className={`w-8 h-8 ${engagementColor}`} />
        {recommendedAction && (
          <div className="flex-1 ml-3 text-[11px] text-slate-300 leading-tight border-l border-slate-700 pl-3">
            {recommendedAction}
          </div>
        )}
      </div>

      {adaptMutation.isPending && suggestions.length === 0 && (
        <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Analysing event data…
        </div>
      )}

      {!adaptMutation.isPending && suggestions.length === 0 && (
        <div className="text-center py-6 text-xs text-slate-500 flex flex-col items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          No active alerts — event running normally
        </div>
      )}

      <div className="flex flex-col gap-2">
        {suggestions.map(s => {
          const cfg = PRIORITY_CONFIG[s.priority];
          const Icon = cfg.icon;
          return (
            <div key={s.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                  <span className="text-xs font-medium text-slate-200">{s.title}</span>
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{s.message}</p>
              <div className="flex gap-2">
                {s.action && s.action !== "none" && (
                  <button
                    onClick={() => handleAction(s.action, s.id)}
                    className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  >
                    {s.actionLabel ?? "Take Action"}
                  </button>
                )}
                <button
                  onClick={() => setDismissed(prev => new Set(prev).add(s.id))}
                  className="text-[10px] px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
