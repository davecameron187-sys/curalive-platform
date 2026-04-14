import { useLocation, useParams } from "wouter";
import { useSmartBack } from "@/lib/useSmartBack";
import {
  ArrowLeft, Zap, TrendingUp, Users, Shield, Mic, BarChart3,
  MessageSquare, Globe, FileText, Radio, MonitorPlay, Leaf,
  Video, Headphones, Activity, ExternalLink, CheckCircle2,
  ChevronRight, Link2
} from "lucide-react";

const FEATURE_DATA: Record<string, {
  id: string; title: string; icon: React.ElementType; color: string;
  badge: string; tagline: string; description: string;
  roiMultiplier?: string; bundle: string; bundleColor: string;
  capabilities: string[]; useCases: string[];
  connectedFeatures: { id: string; label: string }[];
  demoPath?: string;
}> = {
  "live-transcription": {
    id: "live-transcription", title: "Live Transcription", icon: Mic, color: "text-green-400",
    badge: "Bundle C", tagline: "Real-time speech-to-text with <1s latency",
    description: "CuraLive's live transcription engine converts spoken audio into text in under 1 second, powered by OpenAI Whisper via Recall.ai. Supports 12 languages with auto-translation, Arabic RTL included.",
    bundle: "Operations", bundleColor: "bg-green-500/10 text-green-400 border-green-500/20",
    capabilities: ["<1s transcription latency", "12 languages + Arabic RTL", "Speaker identification", "Auto-scroll transcript view", "Filler-word detection", "Export to PDF/DOCX"],
    useCases: ["Earnings calls with international investors", "Board meetings with multilingual attendees", "Regulatory submissions requiring verbatim records"],
    connectedFeatures: [{ id: "sentiment-analysis", label: "Sentiment Analysis" }, { id: "compliance", label: "Compliance Check" }, { id: "rolling-summary", label: "Rolling Summary" }, { id: "follow-ups", label: "Investor Follow-Ups" }],
    demoPath: "/event/q4-earnings-2026",
  },
  "sentiment-analysis": {
    id: "sentiment-analysis", title: "Sentiment Analysis", icon: BarChart3, color: "text-blue-400",
    badge: "Bundle A", tagline: "Monitor live investor mood in real-time",
    description: "AI continuously analyses tone, pacing, and audience reaction during live events. Tracks positive, neutral, and negative sentiment second-by-second across all participants.",
    roiMultiplier: "2.1×", bundle: "Investor Relations", bundleColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    capabilities: ["Real-time sentiment scoring (0–100)", "Positive / Neutral / Negative breakdown", "Trend line over event duration", "Audience engagement index", "Alerts on sentiment dips", "Post-event sentiment arc export"],
    useCases: ["Detect investor concern before Q&A", "Measure presenter effectiveness", "Board approval tracking"],
    connectedFeatures: [{ id: "live-transcription", label: "Live Transcription" }, { id: "follow-ups", label: "Investor Follow-Ups" }, { id: "lead-scoring", label: "Lead Scoring" }, { id: "broadcaster", label: "Intelligent Broadcaster" }],
    demoPath: "/event/q4-earnings-2026",
  },
  "qa-triage": {
    id: "qa-triage", title: "Q&A Auto-Triage", icon: MessageSquare, color: "text-amber-400",
    badge: "Bundle C", tagline: "Smart question categorisation & prioritisation",
    description: "Automatically categorises incoming Q&A submissions by topic, urgency, and sentiment. Reduces operator workload by 60% and ensures the most relevant questions reach the presenter.",
    bundle: "Operations", bundleColor: "bg-green-500/10 text-green-400 border-green-500/20",
    capabilities: ["Topic auto-categorisation", "Upvoting & priority queue", "Toxicity pre-filter", "Approve / dismiss workflow", "Bulk actions", "Q&A analytics export"],
    useCases: ["Earnings calls with 500+ Q submissions", "Investor days with multi-topic Q&A", "Board meetings with sensitivity requirements"],
    connectedFeatures: [{ id: "toxicity", label: "Toxicity Filter" }, { id: "compliance", label: "Compliance Check" }, { id: "follow-ups", label: "Investor Follow-Ups" }],
    demoPath: "/moderator/q4-earnings-2026",
  },
  "compliance": {
    id: "compliance", title: "Compliance Check", icon: Shield, color: "text-red-400",
    badge: "Bundle B", tagline: "Regulatory risk scoring & real-time alerts",
    description: "Monitors spoken content against FINRA, JSE, and IFRS regulatory frameworks in real-time. Flags potential compliance breaches and generates post-event audit trail.",
    bundle: "Compliance & Risk", bundleColor: "bg-red-500/10 text-red-400 border-red-500/20",
    capabilities: ["Real-time compliance scoring", "FINRA / JSE / IFRS rule sets", "Forward-looking statement detection", "Material information alerts", "Post-event compliance report", "Audit trail export"],
    useCases: ["JSE-listed earnings calls", "IFRS-regulated investor briefings", "Regulated sector webcasts"],
    connectedFeatures: [{ id: "live-transcription", label: "Live Transcription" }, { id: "toxicity", label: "Toxicity Filter" }, { id: "press-release", label: "Press Release" }],
    demoPath: "/compliance/dashboard",
  },
  "lead-scoring": {
    id: "lead-scoring", title: "Lead Scoring", icon: TrendingUp, color: "text-blue-400",
    badge: "Bundle A", tagline: "Hot/Warm/Cold investor signals from engagement data",
    description: "Converts engagement patterns — Q&A submissions, session duration, sentiment reactions — into investor lead scores. Automatically segments attendees by investment interest level.",
    roiMultiplier: "2.8×", bundle: "Investor Relations", bundleColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    capabilities: ["Hot / Warm / Cold classification", "Engagement scoring algorithm", "Q&A submission weighting", "Session duration tracking", "Integration with CRM export", "Post-event lead report"],
    useCases: ["Post-roadshow investor prioritisation", "Capital raise follow-up sequencing", "IR team pipeline management"],
    connectedFeatures: [{ id: "sentiment-analysis", label: "Sentiment Analysis" }, { id: "follow-ups", label: "Investor Follow-Ups" }, { id: "event-brief", label: "Event Brief" }],
    demoPath: "/post-event/q4-earnings-2026",
  },
  "follow-ups": {
    id: "follow-ups", title: "Investor Follow-Ups", icon: Users, color: "text-blue-400",
    badge: "Bundle A", tagline: "Personalised post-event outreach powered by AI",
    description: "Generates personalised follow-up emails for each investor based on their questions asked, sentiment observed, and lead score. Drafts are ready within minutes of event end.",
    roiMultiplier: "2.6×", bundle: "Investor Relations", bundleColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    capabilities: ["Per-investor personalised drafts", "Q&A reference integration", "Sentiment-aware tone adjustment", "Bulk approve & send", "CRM sync", "Open-rate tracking"],
    useCases: ["Earnings call follow-up within 30 minutes", "Roadshow investor nurturing", "AGM shareholder communications"],
    connectedFeatures: [{ id: "lead-scoring", label: "Lead Scoring" }, { id: "sentiment-analysis", label: "Sentiment Analysis" }, { id: "live-transcription", label: "Live Transcription" }],
    demoPath: "/followups",
  },
  "event-brief": {
    id: "event-brief", title: "Event Brief", icon: FileText, color: "text-blue-400",
    badge: "Bundle A", tagline: "Pre-event AI briefing pack for the IR team",
    description: "Generates a comprehensive briefing pack 24 hours before an event. Includes investor profiles, expected questions, key talking points, risk topics, and market context.",
    bundle: "Investor Relations", bundleColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    capabilities: ["Investor profile summaries", "Expected Q&A prediction", "Key talking points", "Market context snapshot", "Risk topic alerts", "PDF export"],
    useCases: ["Earnings call preparation", "Investor day briefings", "Board presentation prep"],
    connectedFeatures: [{ id: "lead-scoring", label: "Lead Scoring" }, { id: "sentiment-analysis", label: "Sentiment Analysis" }, { id: "compliance", label: "Compliance Check" }],
    demoPath: "/",
  },
  "rolling-summary": {
    id: "rolling-summary", title: "Rolling Summary", icon: Activity, color: "text-yellow-400",
    badge: "Bundle D", tagline: "Live 60-second summaries updated every minute",
    description: "AI generates a running summary of the event, updated every 60 seconds. Attendees and operators always have a current snapshot of key points discussed.",
    bundle: "Content Marketing", bundleColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    capabilities: ["60-second update cycle", "Key point extraction", "Speaker attribution", "Multi-language output", "Attendee-facing display", "Archive of all snapshots"],
    useCases: ["Long-duration investor days", "Multi-speaker board meetings", "Conference sessions"],
    connectedFeatures: [{ id: "live-transcription", label: "Live Transcription" }, { id: "press-release", label: "Press Release" }, { id: "event-echo", label: "Event Echo" }],
    demoPath: "/event/q4-earnings-2026",
  },
  "press-release": {
    id: "press-release", title: "Press Release", icon: FileText, color: "text-yellow-400",
    badge: "Bundle D", tagline: "SENS/RNS-compliant press release within 2 minutes",
    description: "Generates a JSE SENS or UK RNS-ready press release draft within 2 minutes of event end. Pulls key statements, financial figures, and forward guidance from the live transcript.",
    bundle: "Content Marketing", bundleColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    capabilities: ["SENS / RNS format compliance", "2-minute post-event delivery", "Key statement extraction", "Financial figure capture", "Edit & approve workflow", "Direct publish integration"],
    useCases: ["JSE-listed quarterly results", "UK AIM regulatory announcements", "M&A or material event disclosures"],
    connectedFeatures: [{ id: "compliance", label: "Compliance Check" }, { id: "rolling-summary", label: "Rolling Summary" }, { id: "live-transcription", label: "Live Transcription" }],
    demoPath: "/post-event/q4-earnings-2026",
  },
  "event-echo": {
    id: "event-echo", title: "Event Echo", icon: Radio, color: "text-pink-400",
    badge: "Bundle F", tagline: "AI social posts from event highlights",
    description: "Automatically generates platform-optimised social media posts from event transcription, key quotes, and sentiment highlights. Supports LinkedIn, Twitter/X, Facebook, Instagram, TikTok.",
    bundle: "Social Amplification", bundleColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    capabilities: ["5 platform support (LinkedIn, X, FB, IG, TikTok)", "Tone-matched per platform", "Compliance pre-check", "Bulk approve & schedule", "Engagement analytics", "Hashtag optimisation"],
    useCases: ["Earnings highlights amplification", "Investor day social coverage", "ESG announcement distribution"],
    connectedFeatures: [{ id: "rolling-summary", label: "Rolling Summary" }, { id: "podcast", label: "Podcast Converter" }, { id: "video-recap", label: "AI Video Recap" }],
    demoPath: "/social",
  },
  "podcast": {
    id: "podcast", title: "Podcast Converter", icon: Headphones, color: "text-yellow-400",
    badge: "Bundle D", tagline: "Convert webcasts to investor podcasts automatically",
    description: "Transforms live webcasts into professional podcast episodes. Adds chapter markers, show notes, and speaker introductions. Ready for distribution to Spotify, Apple Podcasts, and IR portals.",
    bundle: "Content Marketing", bundleColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    capabilities: ["Auto-chapter generation", "Show notes from transcript", "Speaker intro generation", "Audio enhancement", "Multi-platform distribution", "Podcast analytics"],
    useCases: ["Quarterly results as podcast episodes", "Investor day content repurposing", "ESG briefing distribution"],
    connectedFeatures: [{ id: "event-echo", label: "Event Echo" }, { id: "rolling-summary", label: "Rolling Summary" }, { id: "video-recap", label: "AI Video Recap" }],
    demoPath: "/podcast-converter",
  },
  "sustainability": {
    id: "sustainability", title: "Sustainability Tracker", icon: Leaf, color: "text-green-400",
    badge: "Bundle E", tagline: "Carbon footprint tracking and ESG certification",
    description: "Calculates the carbon footprint of each event based on participant locations, connection types, and duration. Generates ESG certification reports and green hosting recommendations.",
    bundle: "Premium", bundleColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    capabilities: ["Per-event carbon calculation", "ESG certificate generation", "Green score benchmark", "Carbon offset recommendations", "Regulatory ESG reporting", "Year-on-year trend tracking"],
    useCases: ["ESG-focused investor reporting", "Sustainability committee briefings", "Carbon neutral event certification"],
    connectedFeatures: [{ id: "compliance", label: "Compliance Check" }, { id: "press-release", label: "Press Release" }],
    demoPath: "/sustainability",
  },
  "video-recap": {
    id: "video-recap", title: "AI Video Recap", icon: Video, color: "text-yellow-400",
    badge: "Bundle D", tagline: "Post-event video brief with key moments",
    description: "Generates a short-form video recap of the event, highlighting key moments, sentiment peaks, and action items. Ready for distribution to investors and IR portals within 30 minutes.",
    bundle: "Content Marketing", bundleColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    capabilities: ["Auto-highlight selection", "Sentiment peak extraction", "Action item callouts", "Branded templates", "IR portal integration", "Social-ready formats"],
    useCases: ["Earnings call highlight reels", "AGM shareholder distributions", "IR portal content"],
    connectedFeatures: [{ id: "event-echo", label: "Event Echo" }, { id: "podcast", label: "Podcast Converter" }, { id: "rolling-summary", label: "Rolling Summary" }],
    demoPath: "/post-event/q4-earnings-2026",
  },
  "toxicity": {
    id: "toxicity", title: "Toxicity Filter", icon: Shield, color: "text-red-400",
    badge: "Bundle B", tagline: "Real-time content safety and moderation",
    description: "Detects and flags inappropriate, harmful, or off-topic content in real-time across Q&A submissions and live chat. Protects the event experience and reduces operator burden.",
    bundle: "Compliance & Risk", bundleColor: "bg-red-500/10 text-red-400 border-red-500/20",
    capabilities: ["Real-time Q&A screening", "Hate speech detection", "Off-topic flagging", "Escalation workflow", "Audit log", "Custom filter rules"],
    useCases: ["Public earnings calls with open Q&A", "AGM shareholder sessions", "Regulated sector events"],
    connectedFeatures: [{ id: "qa-triage", label: "Q&A Auto-Triage" }, { id: "compliance", label: "Compliance Check" }],
    demoPath: "/moderator/q4-earnings-2026",
  },
  "pace-coach": {
    id: "pace-coach", title: "Pace Coach", icon: Activity, color: "text-green-400",
    badge: "Bundle C", tagline: "Real-time speaking pace and filler-word feedback",
    description: "Provides live feedback to presenters on speaking pace, filler words (um, uh, like), and clarity. Visible only to the presenter — invisible to attendees.",
    bundle: "Operations", bundleColor: "bg-green-500/10 text-green-400 border-green-500/20",
    capabilities: ["Words-per-minute tracking", "Filler word counter", "Pace alerts (too fast/slow)", "Presenter-only display", "Session report card", "Historical comparison"],
    useCases: ["Earnings call presenter coaching", "C-suite investor day prep", "Roadshow speaker development"],
    connectedFeatures: [{ id: "live-transcription", label: "Live Transcription" }, { id: "broadcaster", label: "Intelligent Broadcaster" }],
    demoPath: "/presenter/q4-earnings-2026",
  },
  "broadcaster": {
    id: "broadcaster", title: "Intelligent Broadcaster", icon: MonitorPlay, color: "text-purple-400",
    badge: "Bundle E", tagline: "Unified AI alert panel for operators",
    description: "Aggregates all AI signals — sentiment dips, compliance alerts, Q&A spikes, pace issues — into a single operator alert feed. Reduces cognitive load and response time during live events.",
    bundle: "Premium", bundleColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    capabilities: ["Unified alert feed", "Sentiment dip notifications", "Compliance breach alerts", "Q&A surge warnings", "Pace coach escalations", "Action recommendation engine"],
    useCases: ["Complex multi-speaker investor days", "High-stakes regulatory calls", "Premium enterprise accounts"],
    connectedFeatures: [{ id: "sentiment-analysis", label: "Sentiment Analysis" }, { id: "compliance", label: "Compliance Check" }, { id: "qa-triage", label: "Q&A Auto-Triage" }, { id: "pace-coach", label: "Pace Coach" }],
    demoPath: "/intelligent-broadcaster",
  },
};

export default function FeatureDetail() {
  const [, navigate] = useLocation();
  const goBack = useSmartBack("/feature-map");
  const params = useParams<{ id: string }>();
  const featureId = params.id || "";
  const feature = FEATURE_DATA[featureId];

  if (!feature) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Feature not found</h2>
          <p className="text-muted-foreground mb-4">Feature ID: {featureId}</p>
          <button onClick={() => navigate("/feature-map")} className="text-primary hover:underline">
            View Feature Map
          </button>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">{feature.title}</span>
        </div>
      </header>

      <div className="container py-10 max-w-4xl mx-auto">
        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0">
            <Icon className={`w-8 h-8 ${feature.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${feature.bundleColor}`}>
                {feature.badge}
              </span>
              {feature.roiMultiplier && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {feature.roiMultiplier} ROI Multiplier
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-1">{feature.title}</h1>
            <p className="text-muted-foreground">{feature.tagline}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
              <p className="text-sm leading-relaxed">{feature.description}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Capabilities</h2>
              <div className="grid grid-cols-2 gap-2">
                {feature.capabilities.map(c => (
                  <div key={c} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Use Cases</h2>
              <div className="space-y-2">
                {feature.useCases.map(u => (
                  <div key={u} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {feature.demoPath && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-sm mb-3">Live Demo</h2>
                <button
                  onClick={() => navigate(feature.demoPath!)}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Demo
                </button>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Connected Features
              </h2>
              <div className="space-y-2">
                {feature.connectedFeatures.map(cf => (
                  <button
                    key={cf.id}
                    onClick={() => navigate(`/features/${cf.id}`)}
                    className="w-full flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <span>{cf.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-3">Bundle</h2>
              <div className={`text-sm font-medium px-3 py-2 rounded-lg border ${feature.bundleColor}`}>
                {feature.bundle}
              </div>
              <button
                onClick={() => navigate("/ai-shop")}
                className="mt-3 w-full text-xs text-primary hover:underline"
              >
                View in AI Shop →
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={goBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => navigate("/ai-shop")} className="text-sm text-primary hover:underline">
            Browse AI Shop
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => navigate("/workflows")} className="text-sm text-primary hover:underline">
            View Workflows
          </button>
        </div>
      </div>
    </div>
  );
}
