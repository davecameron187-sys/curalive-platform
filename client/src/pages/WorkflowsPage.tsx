import { useLocation } from "wouter";
import { ArrowLeft, Zap, ChevronRight, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import WorkflowSteps from "@/components/WorkflowSteps";

const WORKFLOWS = [
  {
    id: "investor-relations",
    bundle: "A",
    name: "Investor Relations Workflow",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    roi: "2.8× ROI",
    description: "Activate features in sequence for maximum IR event impact, from pre-event briefing through to personalised follow-ups.",
    steps: [
      { id: "1", label: "Event Brief", description: "Generate investor profiles & talking points 24h before", icon: "📋" },
      { id: "2", label: "Live Transcription", description: "Real-time speech-to-text, <1s latency", icon: "🎙️" },
      { id: "3", label: "Sentiment Analysis", description: "Monitor investor mood throughout broadcast", icon: "📊" },
      { id: "4", label: "Q&A Auto-Triage", description: "Smart question categorisation & prioritisation", icon: "💬" },
      { id: "5", label: "Lead Scoring", description: "Hot/Warm/Cold classification post-event", icon: "🎯" },
      { id: "6", label: "Investor Follow-Ups", description: "Personalised outreach within 30 minutes", icon: "📧" },
    ],
  },
  {
    id: "compliance",
    bundle: "B",
    name: "Compliance & Risk Workflow",
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    roi: "Risk Mitigation",
    description: "Layer compliance checks on top of live transcription to catch regulatory breaches in real-time.",
    steps: [
      { id: "1", label: "Live Transcription", description: "Full verbatim record with speaker identification", icon: "🎙️" },
      { id: "2", label: "Toxicity Filter", description: "Screen Q&A submissions before they reach the queue", icon: "🛡️" },
      { id: "3", label: "Compliance Check", description: "Real-time FINRA/JSE/IFRS scoring and alerts", icon: "⚖️" },
      { id: "4", label: "Sentiment Analysis", description: "Track audience reaction to sensitive disclosures", icon: "📊" },
    ],
  },
  {
    id: "content",
    bundle: "D",
    name: "Content Marketing Workflow",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    roi: "5+ Channels",
    description: "Turn one 60-minute event into a full content library across social, podcast, video, and press.",
    steps: [
      { id: "1", label: "Live Transcription", description: "Full verbatim record for content extraction", icon: "🎙️" },
      { id: "2", label: "Rolling Summary", description: "60-second snapshots become content building blocks", icon: "⚡" },
      { id: "3", label: "Press Release", description: "SENS/RNS draft ready within 2 minutes of event end", icon: "📰" },
      { id: "4", label: "Event Echo", description: "Platform-optimised social posts, compliance-checked", icon: "📡" },
      { id: "5", label: "Podcast Converter", description: "Professional episode with chapters and show notes", icon: "🎧" },
      { id: "6", label: "AI Video Recap", description: "Short-form highlight reel for IR portal", icon: "🎬" },
    ],
  },
  {
    id: "premium",
    bundle: "E",
    name: "Premium End-to-End Workflow",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    roi: "Maximum ROI",
    description: "The full CuraLive intelligence stack — every feature activated in the optimal sequence for enterprise events.",
    steps: [
      { id: "1", label: "Event Brief", description: "Pre-event intel pack: investor profiles, risk topics", icon: "📋" },
      { id: "2", label: "Live Transcription + Compliance", description: "Real-time record with regulatory monitoring", icon: "🎙️" },
      { id: "3", label: "Sentiment + Toxicity", description: "Audience mood and content safety in parallel", icon: "📊" },
      { id: "4", label: "Q&A Triage + Pace Coach", description: "Smart moderation + presenter coaching", icon: "💬" },
      { id: "5", label: "Intelligent Broadcaster", description: "Unified alert panel aggregating all signals", icon: "📡" },
      { id: "6", label: "Lead Scoring + Follow-Ups", description: "Investor prioritisation and personalised outreach", icon: "🎯" },
      { id: "7", label: "Content Distribution", description: "Press release, social, podcast, video recap", icon: "🚀" },
    ],
  },
];

export default function WorkflowsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={() => navigate("/feature-map")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">Recommended Workflows</span>
        </div>
      </header>

      <div className="container py-10 max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Recommended Workflows</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Pre-configured feature activation sequences for each bundle. Activate features in the recommended order to maximise ROI and ensure each capability enhances the next.
          </p>
        </div>

        <div className="space-y-10">
          {WORKFLOWS.map(workflow => (
            <div key={workflow.id} className={`bg-card border rounded-2xl overflow-hidden ${workflow.borderColor}`}>
              <div className={`px-6 py-5 border-b ${workflow.borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${workflow.bgColor} border ${workflow.borderColor} flex items-center justify-center text-lg font-bold ${workflow.color}`}>
                    {workflow.bundle}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{workflow.name}</h2>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${workflow.bgColor} border ${workflow.borderColor} ${workflow.color}`}>
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
                    {workflow.roi}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-3 items-center">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-lg">
                          {step.icon}
                        </div>
                        <div className="text-xs font-medium mt-1.5 text-center max-w-[80px] leading-tight">{step.label}</div>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0 mb-3" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/30">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{step.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/bundles/${workflow.id}`)}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                  >
                    View Bundle Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-muted-foreground/30">·</span>
                  <button
                    onClick={() => navigate("/ai-shop")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Activate in AI Shop
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-card border border-border rounded-2xl">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ROI Interconnection Principle
          </h3>
          <p className="text-sm text-muted-foreground">
            Each feature in a workflow feeds data into the next. Live Transcription powers Sentiment Analysis, which informs Lead Scoring, which optimises Investor Follow-Ups.
            Activating features in the recommended sequence achieves up to <strong className="text-foreground">2.8× ROI multiplier</strong> compared to standalone feature use.
          </p>
          <button
            onClick={() => navigate("/admin/interconnection-analytics")}
            className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View Interconnection Analytics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
