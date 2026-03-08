/**
 * AIFeaturesStatus — Live status overview of all AI/ML features in CuraLive.
 * Route: /ai-features
 */
import { useLocation } from "wouter";
import { ArrowLeft, Brain, Mic, Globe, MessageSquare, BarChart2, FileText, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";

type FeatureStatus = "live" | "partial" | "planned";

interface AIFeature {
  name: string;
  description: string;
  provider: string;
  status: FeatureStatus;
  latency?: string;
  icon: any;
}

const features: AIFeature[] = [
  {
    name: "Live Transcription",
    description: "Real-time speech-to-text for all conference audio, displayed to attendees with <1s latency.",
    provider: "Forge AI / OpenAI Whisper",
    status: "live",
    latency: "<1s",
    icon: Mic,
  },
  {
    name: "Sentiment Analysis",
    description: "Real-time sentiment scoring of participant speech — positive, neutral, or negative — updated every 30s.",
    provider: "Forge AI",
    status: "live",
    latency: "~2s",
    icon: BarChart2,
  },
  {
    name: "Smart Q&A (AI Moderation)",
    description: "AI categorises, prioritises, and surfaces the most relevant investor questions during earnings calls.",
    provider: "Forge AI",
    status: "live",
    icon: MessageSquare,
  },
  {
    name: "Chat Translation",
    description: "Real-time translation of operator chat into 12 languages with Ably broadcast to all attendees.",
    provider: "Forge AI",
    status: "live",
    icon: Globe,
  },
  {
    name: "Rolling AI Summaries",
    description: "Automatic conference summaries generated from Recall.ai transcripts, published post-event.",
    provider: "Forge AI + Recall.ai",
    status: "live",
    icon: FileText,
  },
  {
    name: "Speaker Pace Coach",
    description: "Per-speaker words-per-minute analysis helping presenters maintain investor-appropriate pace.",
    provider: "Forge AI",
    status: "live",
    icon: Zap,
  },
  {
    name: "RTMP Audio Transcription",
    description: "ffmpeg extracts audio from Mux HLS streams, segments it, and sends to Whisper for live captions.",
    provider: "OpenAI Whisper",
    status: "partial",
    latency: "~3s",
    icon: Mic,
  },
  {
    name: "AI Post-Event Report",
    description: "JSE/IFRS-compliant investor event report auto-generated from transcript and sentiment data.",
    provider: "Forge AI",
    status: "planned",
    icon: FileText,
  },
];

const statusConfig: Record<FeatureStatus, { label: string; color: string; icon: any }> = {
  live: { label: "Live", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  partial: { label: "Partial", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
  planned: { label: "Planned", color: "bg-slate-600/40 text-slate-400 border-slate-600/30", icon: Clock },
};

export default function AIFeaturesStatus() {
  const [, navigate] = useLocation();

  const liveCount = features.filter(f => f.status === "live").length;
  const partialCount = features.filter(f => f.status === "partial").length;
  const plannedCount = features.filter(f => f.status === "planned").length;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AI Features Status</h1>
          <p className="text-xs text-slate-400">CuraLive intelligence layer — real-time status</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{liveCount}</p>
            <p className="text-xs text-emerald-300 mt-1">Features Live</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{partialCount}</p>
            <p className="text-xs text-amber-300 mt-1">Partial</p>
          </div>
          <div className="bg-slate-700/30 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-slate-400">{plannedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Planned</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const { label, color, icon: StatusIcon } = statusConfig[feature.status];
            const Icon = feature.icon;
            return (
              <div key={feature.name} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-700/60 rounded flex items-center justify-center">
                      <Icon className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{feature.name}</h3>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{feature.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Provider: <span className="text-slate-300">{feature.provider}</span></span>
                  {feature.latency && <span>Latency: <span className="text-emerald-400">{feature.latency}</span></span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Platform Intelligence Stack</h3>
          <div className="grid md:grid-cols-3 gap-3 text-xs text-slate-400">
            <div>
              <p className="text-slate-300 font-medium mb-1">Real-Time Layer</p>
              <p>• Ably pub/sub for instant delivery</p>
              <p>• &lt;100ms edge latency</p>
              <p>• 12 supported languages</p>
            </div>
            <div>
              <p className="text-slate-300 font-medium mb-1">AI Models</p>
              <p>• Forge AI (primary LLM)</p>
              <p>• OpenAI Whisper (transcription)</p>
              <p>• Recall.ai (meeting bots)</p>
            </div>
            <div>
              <p className="text-slate-300 font-medium mb-1">Compliance</p>
              <p>• JSE/IFRS compliant reporting</p>
              <p>• Regulatory flag on Q&A items</p>
              <p>• Audit trail maintained</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
