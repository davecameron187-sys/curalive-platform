/**
 * EventBriefPanel — AI Event Brief Generator.
 *
 * Operator pastes a press release or event description.
 * LLM returns: executive summary, 5 key talking points, 3 anticipated Q&A pairs,
 * and a compliance reminder.
 *
 * Used in: WebcastStudio AI tab.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface EventBriefPanelProps {
  eventTitle?: string;
}

export default function EventBriefPanel({ eventTitle = "" }: EventBriefPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [pressRelease, setPressRelease] = useState("");
  const [brief, setBrief] = useState<{
    headline: string;
    keyMessages: string[];
    talkingPoints: string[];
    anticipatedQuestions: string[];
    disclaimer: string;
  } | null>(null);

  const generateMutation = trpc.ai.generateEventBrief.useMutation({
    onSuccess: (data) => {
      setBrief(data);
      toast.success("Event brief generated");
    },
    onError: () => {
      toast.error("Failed to generate event brief");
    },
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">AI Event Brief Generator</div>
            <div className="text-xs text-muted-foreground">Paste press release → get talking points & Q&A prep</div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-border">
          <textarea
            value={pressRelease}
            onChange={(e) => setPressRelease(e.target.value)}
            placeholder="Paste the press release, SENS announcement, or event description here…"
            rows={6}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <button
            onClick={() =>
              generateMutation.mutate({
                pressRelease,
                eventTitle,
              })
            }
            disabled={pressRelease.trim().length < 10 || generateMutation.isPending}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {generateMutation.isPending ? "Generating…" : "Generate Brief"}
          </button>

          {brief && (
            <div className="space-y-3 pt-1">
              {/* Headline */}
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Headline</div>
                <p className="text-sm font-semibold leading-relaxed">{brief.headline}</p>
              </div>

              {/* Key Messages */}
              {brief.keyMessages.length > 0 && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Messages</div>
                  <ul className="space-y-1.5">
                    {brief.keyMessages.map((msg, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary font-bold shrink-0">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Talking Points */}
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Talking Points</div>
                <ol className="space-y-1.5">
                  {brief.talkingPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Anticipated Questions */}
              {brief.anticipatedQuestions.length > 0 && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Anticipated Analyst Questions</div>
                  <ul className="space-y-1.5">
                    {brief.anticipatedQuestions.map((q, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-amber-400 font-bold shrink-0">Q{i + 1}.</span>
                        <span className="text-muted-foreground">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              {brief.disclaimer && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Compliance / Disclaimer</div>
                  <p className="text-xs text-amber-200/80">{brief.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
