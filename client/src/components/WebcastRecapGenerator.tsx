import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Film, Loader2, Download, TrendingUp, TrendingDown, Minus, Quote, Star, MessageSquare } from "lucide-react";

interface WebcastRecapGeneratorProps {
  eventId: string;
}

const SENTIMENT_COLORS = {
  positive: "text-emerald-400 bg-emerald-500/10",
  neutral: "text-slate-400 bg-slate-500/10",
  negative: "text-red-400 bg-red-500/10",
};

const MOMENT_ICONS: Record<string, any> = {
  highlight: Star,
  quote: Quote,
  qa: MessageSquare,
  sentiment_shift: TrendingUp,
};

export function WebcastRecapGenerator({ eventId }: WebcastRecapGeneratorProps) {
  const [recap, setRecap] = useState<any>(null);

  const recapMutation = trpc.webcast.generateRecap.useMutation({
    onSuccess: (data) => {
      setRecap(data);
      toast.success("AI Recap generated", { description: `${data.topMoments.length} key moments identified` });
    },
    onError: () => toast.error("Recap generation failed"),
  });

  const handleDownload = () => {
    if (!recap) return;
    const content = [
      `# AI Video Recap Brief — ${recap.eventTitle}`,
      `Generated: ${new Date(recap.generatedAt).toLocaleString()}`,
      ``,
      `## Executive Summary`,
      recap.executiveSummary,
      ``,
      `## Shareable Hook`,
      `> ${recap.shareableHook}`,
      ``,
      `## Top Moments`,
      ...(recap.topMoments ?? []).map((m: any) => `**[${m.timestamp}] ${m.title}** (${m.type})\n${m.content}`),
      ``,
      `## Key Quotes`,
      ...(recap.keyQuotes ?? []).map((q: string) => `- "${q}"`),
      ``,
      `## Video Script Outline`,
      recap.videoScriptOutline,
      ``,
      `## Calls to Action`,
      ...(recap.ctaSuggestions ?? []).map((c: string) => `- ${c}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recap-brief-${eventId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recap brief downloaded");
  };

  const arc = recap?.sentimentArc;
  const ArcIcon = arc?.trend === "improving" ? TrendingUp : arc?.trend === "declining" ? TrendingDown : Minus;
  const arcColor = arc?.trend === "improving" ? "text-emerald-400" : arc?.trend === "declining" ? "text-red-400" : "text-slate-400";

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Video Recap Generator</h3>
        </div>
        {!recap && (
          <button
            onClick={() => recapMutation.mutate({ eventId })}
            disabled={recapMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {recapMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
            Generate Recap
          </button>
        )}
        {recap && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download Brief
          </button>
        )}
      </div>

      {recapMutation.isPending && (
        <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          Analysing transcript, sentiment, and Q&A…
        </div>
      )}

      {recap && (
        <div className="space-y-4">
          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
            <div className="text-xs font-medium text-violet-300 mb-1">Shareable Hook</div>
            <div className="text-sm text-slate-200 italic">"{recap.shareableHook}"</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Executive Summary</div>
            <p className="text-sm text-slate-300 leading-relaxed">{recap.executiveSummary}</p>
          </div>

          {arc && (
            <div className="rounded-xl bg-slate-800/50 p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sentiment Arc</div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-200">{arc.opening}</div>
                  <div className="text-[10px] text-slate-500">Opening</div>
                </div>
                <div className="flex-1 h-1 bg-slate-700 rounded-full relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500 via-violet-400 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, Math.max(10, arc.midpoint))}%` }} />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-200">{arc.midpoint}</div>
                  <div className="text-[10px] text-slate-500">Mid</div>
                </div>
                <div className="flex-1 h-1 bg-slate-700 rounded-full" />
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-200">{arc.closing}</div>
                  <div className="text-[10px] text-slate-500">Close</div>
                </div>
                <ArcIcon className={`w-5 h-5 ${arcColor}`} />
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Top Moments</div>
            <div className="space-y-2">
              {(recap.topMoments ?? []).map((m: any, i: number) => {
                const Icon = MOMENT_ICONS[m.type] ?? Star;
                const sentColor = SENTIMENT_COLORS[m.sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className="text-xs font-mono text-violet-400 pt-0.5 shrink-0 w-12">{m.timestamp}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-200">{m.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sentColor}`}>{m.sentiment}</span>
                      </div>
                      <div className="text-xs text-slate-400">{m.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Video Script Outline</div>
            <div className="text-xs text-slate-400 bg-slate-800/50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
              {recap.videoScriptOutline}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Calls to Action</div>
            <div className="flex flex-wrap gap-2">
              {(recap.ctaSuggestions ?? []).map((c: string, i: number) => (
                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!recap && !recapMutation.isPending && (
        <div className="text-center py-6 text-xs text-slate-500">
          Generate an AI recap brief with top moments, sentiment arc, key quotes, and a video script outline
        </div>
      )}
    </div>
  );
}
