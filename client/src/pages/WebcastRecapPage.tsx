import { useState } from "react";
import { useLocation } from "wouter";
import { useSmartBack } from "@/lib/useSmartBack";
import {
  ArrowLeft, Play, FileText, Headphones, Share2, Download,
  Clock, Users, MessageSquare, Globe, CheckCircle2, Zap,
  BarChart3, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const RECAP_EVENT = {
  title: "Q4 2025 Earnings Call — CuraLive Inc.",
  date: "March 10, 2026",
  duration: "48 min",
  attendees: "1,247",
  questions: "24",
  sentiment: "74% Positive",
  languages: "12",
};

const OUTPUTS = [
  {
    id: "video",
    icon: Play,
    title: "AI Video Recap",
    description: "3-minute highlight reel with key moments, sentiment peaks, and action items",
    status: "ready",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    action: "Watch Recap",
  },
  {
    id: "podcast",
    icon: Headphones,
    title: "Podcast Episode",
    description: "Full event audio with chapter markers, show notes, and speaker intros",
    status: "ready",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    action: "Listen Now",
  },
  {
    id: "social",
    icon: Share2,
    title: "Social Media Posts",
    description: "5 platform-optimised posts (LinkedIn, X, Facebook, Instagram, TikTok)",
    status: "ready",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    action: "Review & Publish",
  },
  {
    id: "transcript",
    icon: FileText,
    title: "Full Transcript",
    description: "Verbatim record with speaker attribution and timestamp links",
    status: "ready",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    action: "View Transcript",
  },
  {
    id: "summary",
    icon: BarChart3,
    title: "Executive Summary",
    description: "AI-generated briefing: key points, financial highlights, action items",
    status: "ready",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    action: "Read Summary",
  },
];

const KEY_MOMENTS = [
  { time: "04:32", label: "Revenue guidance — Q1 2026 raised by 18%", sentiment: "positive" },
  { time: "12:18", label: "Analyst question on Recall.ai partnership margin impact", sentiment: "neutral" },
  { time: "24:07", label: "CEO announcement: Series B fundraise in progress", sentiment: "positive" },
  { time: "35:44", label: "ESG carbon neutrality target confirmed by 2027", sentiment: "positive" },
  { time: "42:15", label: "Q&A closed — outstanding questions logged for follow-up", sentiment: "neutral" },
];

export default function WebcastRecapPage() {
  const [, navigate] = useLocation();
  const goBack = useSmartBack("/post-event/q4-earnings-2026");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      toast.success("Recap package generated — all outputs ready");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium">Webcast Recap Generator</span>
          </div>
          <button
            onClick={() => navigate("/post-event/q4-earnings-2026")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Full Report
          </button>
        </div>
      </header>

      <div className="container py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Webcast Recap Generator</h1>
          </div>
          <p className="text-muted-foreground text-sm">Automatically generate video recaps, podcast episodes, and social content from completed events.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold mb-1">{RECAP_EVENT.title}</h2>
              <p className="text-sm text-muted-foreground">{RECAP_EVENT.date}</p>
            </div>
            <span className="text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-1 rounded font-semibold">
              Completed
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: Clock, label: "Duration", value: RECAP_EVENT.duration },
              { icon: Users, label: "Attendees", value: RECAP_EVENT.attendees },
              { icon: MessageSquare, label: "Q&A", value: RECAP_EVENT.questions },
              { icon: BarChart3, label: "Sentiment", value: RECAP_EVENT.sentiment },
              { icon: Globe, label: "Languages", value: RECAP_EVENT.languages },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center bg-secondary/30 rounded-lg p-2.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-bold">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {!generated ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mb-6">
            <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Generate Recap Package</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              AI will generate your video recap, podcast episode, social posts, executive summary, and full transcript — all from this event.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Recap Package…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Recap Package
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {OUTPUTS.map(output => {
              const Icon = output.icon;
              return (
                <div key={output.id} className={`bg-card border rounded-xl p-5 ${output.borderColor}`}>
                  <div className={`w-10 h-10 rounded-xl ${output.bgColor} border ${output.borderColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${output.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{output.title}</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{output.description}</p>
                  <button
                    onClick={() => toast.success(`Opening ${output.title}`)}
                    className={`w-full text-xs font-semibold py-2 rounded-lg ${output.bgColor} ${output.color} border ${output.borderColor} hover:opacity-80 transition-opacity`}
                  >
                    {output.action}
                  </button>
                </div>
              );
            })}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <Download className="w-8 h-8 text-muted-foreground mb-2" />
              <h3 className="font-semibold text-sm mb-1">Download All</h3>
              <p className="text-xs text-muted-foreground mb-4">ZIP archive of all outputs</p>
              <button
                onClick={() => toast.success("Download started")}
                className="w-full text-xs font-semibold py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Download ZIP
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Key Moments</h3>
          </div>
          <div className="divide-y divide-border">
            {KEY_MOMENTS.map(moment => (
              <div key={moment.time} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{moment.time}</span>
                <span className="text-sm flex-1">{moment.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  moment.sentiment === "positive"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {moment.sentiment}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
