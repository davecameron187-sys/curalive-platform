import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Play, BookOpen,
  Monitor, Zap, Shield, BarChart3, Globe, Settings
} from "lucide-react";
import { useSmartBack } from "@/lib/useSmartBack";

const MODULES: Record<string, {
  title: string; subtitle: string; icon: React.ElementType;
  duration: string; color: string;
  sections: { id: string; title: string; description: string; duration: string; completed?: boolean }[];
  prerequisites: string[]; certificationReward: string;
}> = {
  "virtual-studio": {
    title: "Virtual Studio Training",
    subtitle: "Configure bundle-specific broadcast environments for internal demos",
    icon: Monitor,
    duration: "45 minutes",
    color: "text-pink-400",
    prerequisites: ["Complete OCC Training Guide (all 4 phases)", "Shadow at least one live event"],
    certificationReward: "Virtual Studio Operator Certificate",
    sections: [
      { id: "vs-1", title: "Studio Overview & Bundle Selection", description: "Learn how Virtual Studio adapts to each of the 6 bundles. Understand avatar styles, overlay options, and bundle-specific configurations.", duration: "8 min", completed: true },
      { id: "vs-2", title: "Avatar Configuration", description: "Configure Professional, Executive, Animated AI, and Minimal avatar styles. Set up speaker identification and presenter branding.", duration: "7 min", completed: true },
      { id: "vs-3", title: "Language & Dubbing Setup", description: "Enable 12-language dubbing, configure RTL support for Arabic, and set up VTT subtitle output for live and on-demand events.", duration: "10 min" },
      { id: "vs-4", title: "Live Overlays Management", description: "Manage sentiment gauge, engagement bar, interconnection watermarks, and custom overlay placement during live events.", duration: "8 min" },
      { id: "vs-5", title: "ESG Flagging & Compliance", description: "Configure ESG content flags, review AI-detected sustainability concerns, and resolve flags before and during broadcast.", duration: "7 min" },
      { id: "vs-6", title: "Replay & On-Demand Setup", description: "Enable replay recording, configure quality settings, and set up on-demand distribution for post-event access.", duration: "5 min" },
    ],
  },
  "ai-features": {
    title: "AI Features Training",
    subtitle: "Master all 16 AI features across 6 bundles for live event operations",
    icon: Zap,
    duration: "60 minutes",
    color: "text-blue-400",
    prerequisites: ["Complete OCC Training Guide (Phases 1–2)", "Complete Operator Reference Guide review"],
    certificationReward: "CuraLive AI Operator Certificate",
    sections: [
      { id: "ai-1", title: "Live Transcription & Languages", description: "Configure real-time transcription, manage 12 languages, handle speaker identification, and troubleshoot common audio issues.", duration: "8 min", completed: true },
      { id: "ai-2", title: "Sentiment Analysis & Monitoring", description: "Interpret live sentiment scores, respond to sentiment dips, and use the trend line to guide presenter decisions.", duration: "7 min", completed: true },
      { id: "ai-3", title: "Q&A Auto-Triage & Moderation", description: "Master the Q&A queue: approve/dismiss, bulk actions, priority sorting, and integrating with the toxicity filter.", duration: "10 min", completed: true },
      { id: "ai-4", title: "Compliance Monitoring", description: "Understand FINRA/JSE/IFRS rule sets, interpret compliance scores, respond to breach alerts, and manage the post-event audit log.", duration: "10 min" },
      { id: "ai-5", title: "Intelligent Broadcaster Panel", description: "Use the unified alert feed, respond to multi-source signals, and manage operator workflow during high-pressure events.", duration: "8 min" },
      { id: "ai-6", title: "Content Generation (Bundles D & F)", description: "Trigger press release, social posts, podcast conversion, and video recap generation after event completion.", duration: "10 min" },
      { id: "ai-7", title: "Lead Scoring & Follow-Ups", description: "Interpret Hot/Warm/Cold investor classifications, review and approve personalised follow-up emails, and track engagement.", duration: "7 min" },
    ],
  },
};

export default function TrainingSubPage() {
  const [, navigate] = useLocation();
  const goBack = useSmartBack("/training");
  const params = useParams<{ module: string }>();
  const module = MODULES[params.module || ""] || MODULES["ai-features"];

  const Icon = module.icon;
  const completedCount = module.sections.filter(s => s.completed).length;
  const progress = Math.round((completedCount / module.sections.length) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">{module.title}</span>
        </div>
      </header>

      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-start gap-5 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0">
            <Icon className={`w-7 h-7 ${module.color}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{module.title}</h1>
            <p className="text-muted-foreground text-sm mb-3">{module.subtitle}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {module.sections.length} sections</span>
              <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {module.duration} total</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {completedCount}/{module.sections.length} completed</span>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Module complete — {module.certificationReward} earned
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-3">
            {module.sections.map((section, index) => (
              <div
                key={section.id}
                className={`bg-card border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors ${section.completed ? "border-emerald-500/30" : "border-border"}`}
                onClick={() => {}}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    section.completed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {section.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{section.duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{section.description}</p>
                    {!section.completed && (
                      <button className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                        <Play className="w-3 h-3" />
                        {index === completedCount ? "Start Section" : "Continue"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Prerequisites</h3>
              <div className="space-y-2">
                {module.prerequisites.map(p => (
                  <div key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-2">Certification</h3>
              <div className="flex items-start gap-2 text-sm">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-xs">{module.certificationReward}</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Related</h3>
              <div className="space-y-2">
                {[
                  { label: "OCC Training Guide", path: "/training" },
                  { label: "Training Mode Console", path: "/training-mode" },
                  { label: "Operator Guide", path: "/operator-guide" },
                  { label: "Feature Map", path: "/feature-map" },
                ].map(r => (
                  <button
                    key={r.label}
                    onClick={() => navigate(r.path)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-secondary"
                  >
                    {r.label}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
