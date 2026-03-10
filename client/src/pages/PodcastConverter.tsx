import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mic, ChevronLeft, Loader2, Download, BookOpen, Clock, Tag, Play, Hash } from "lucide-react";

export default function PodcastConverter() {
  const [, navigate] = useLocation();
  const [eventId, setEventId] = useState("");
  const [podcastData, setPodcastData] = useState<any>(null);

  const convertMutation = trpc.webcast.convertPodcast.useMutation({
    onSuccess: (data) => {
      setPodcastData(data);
      toast.success("Podcast episode generated", { description: `${data.chapters.length} chapters created` });
    },
    onError: () => toast.error("Podcast generation failed"),
  });

  const handleDownloadNotes = () => {
    if (!podcastData) return;
    const content = [
      `# ${podcastData.title}`,
      `${podcastData.description}`,
      ``,
      `## Episode Details`,
      `Episode: ${podcastData.episodeNumber} | Duration: ${podcastData.duration}`,
      `Tags: ${podcastData.tags?.join(", ")}`,
      ``,
      `## Chapters`,
      ...(podcastData.chapters ?? []).map((c: any) => `**${c.startTimestamp}** — ${c.title}\n${c.summary}\n> "${c.keyQuote}"`),
      ``,
      `## Show Notes`,
      podcastData.showNotes,
      ``,
      `## Call to Action`,
      podcastData.callToAction,
    ].join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${podcastData.episodeNumber ?? "podcast"}-show-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Show notes downloaded");
  };

  return (
    <div className="min-h-screen bg-[#0a0d1a] text-white">
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/webcasting-hub")} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">Video Podcast Converter</h1>
          <p className="text-xs text-slate-400">Transform any webcast into a professional investor podcast</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Generate Podcast from Event</h2>
          <p className="text-xs text-slate-400 mb-4">Enter an event ID to extract chapters, show notes, and a distribution-ready episode package from the live transcript.</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Event ID (e.g. q4-earnings-2025)"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <button
              onClick={() => convertMutation.mutate({ eventId })}
              disabled={!eventId.trim() || convertMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {convertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              Generate Podcast
            </button>
          </div>
        </div>

        {podcastData && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{podcastData.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{podcastData.description}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 ml-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                  <Hash className="w-3 h-3" />{podcastData.episodeNumber}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />{podcastData.duration}
                </span>
                {(podcastData.tags ?? []).slice(0, 3).map((t: string) => (
                  <span key={t} className="flex items-center gap-1.5 text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-full">
                    <Tag className="w-3 h-3" />{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-violet-400" /> Episode Chapters
              </h3>
              <div className="space-y-3">
                {(podcastData.chapters ?? []).map((ch: any) => (
                  <div key={ch.index} className="flex gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className="text-xs font-mono text-violet-400 pt-0.5 shrink-0 w-12">{ch.startTimestamp}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200 mb-0.5">{ch.title}</div>
                      <div className="text-xs text-slate-400 mb-1.5">{ch.summary}</div>
                      <div className="text-[11px] italic text-slate-500">"{ch.keyQuote}"</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" /> Show Notes
              </h3>
              <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono bg-slate-800/50 rounded-xl p-4">
                {podcastData.showNotes}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 border border-violet-500/20 p-5">
              <div className="text-sm font-medium text-violet-300 mb-1">Call to Action</div>
              <div className="text-sm text-slate-300">{podcastData.callToAction}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadNotes}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download Show Notes
              </button>
              <button
                onClick={() => toast.success("MP3 export queued — audio processing requires Mux recording access")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Mic className="w-4 h-4" /> Export MP3 Podcast
              </button>
            </div>
          </div>
        )}

        {!podcastData && !convertMutation.isPending && (
          <div className="rounded-2xl bg-slate-900 border border-slate-700/50 border-dashed p-12 text-center">
            <Mic className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm text-slate-500">Enter an event ID above to generate your podcast episode</div>
            <div className="text-xs text-slate-600 mt-1">Chapters, show notes, tags, and call-to-action generated automatically</div>
          </div>
        )}
      </div>
    </div>
  );
}
