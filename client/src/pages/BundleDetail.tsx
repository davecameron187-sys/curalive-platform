import { useLocation, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight, Zap, TrendingUp, ExternalLink } from "lucide-react";

const BUNDLE_DATA: Record<string, {
  id: string; letter: string; name: string; color: string; borderColor: string;
  price: string; tagline: string; description: string;
  features: { id: string; label: string; roiMultiplier?: string }[];
  industries: string[]; roiSummary: string;
  keyBenefits: string[]; demoPath: string;
}> = {
  "investor-relations": {
    id: "investor-relations", letter: "A", name: "Investor Relations", color: "text-blue-400",
    borderColor: "border-blue-500/30", price: "$299/mo",
    tagline: "Complete AI suite for IR teams managing listed company events",
    description: "Bundle A combines six interconnected AI features purpose-built for investor relations. From pre-event briefing to personalised post-event follow-ups, every stage of the IR event lifecycle is covered.",
    features: [
      { id: "event-brief", label: "Event Brief" },
      { id: "sentiment-analysis", label: "Sentiment Analysis", roiMultiplier: "2.1×" },
      { id: "follow-ups", label: "Investor Follow-Ups", roiMultiplier: "2.6×" },
      { id: "lead-scoring", label: "Lead Scoring", roiMultiplier: "2.8×" },
      { id: "qa-triage", label: "Q&A Auto-Triage" },
      { id: "live-transcription", label: "Live Transcription" },
    ],
    industries: ["JSE-listed companies", "Financial Services", "Pharmaceuticals", "Mining & Resources"],
    roiSummary: "2.1× – 2.8× blended ROI across features",
    keyBenefits: ["Pre-event investor briefing pack in 24 hours", "Real-time sentiment monitoring throughout event", "Hot/Warm/Cold lead classification post-event", "Personalised follow-up emails within 30 minutes", "Q&A moderation workload reduced by 60%"],
    demoPath: "/event/q4-earnings-2026",
  },
  "compliance": {
    id: "compliance", letter: "B", name: "Compliance & Risk", color: "text-red-400",
    borderColor: "border-red-500/30", price: "$299/mo",
    tagline: "Regulatory compliance monitoring for regulated sector events",
    description: "Bundle B provides real-time compliance monitoring aligned with FINRA, JSE, and IFRS frameworks. Protects the organisation from regulatory breach and maintains a complete audit trail.",
    features: [
      { id: "compliance", label: "Compliance Check" },
      { id: "toxicity", label: "Toxicity Filter" },
      { id: "live-transcription", label: "Live Transcription" },
      { id: "sentiment-analysis", label: "Sentiment Analysis", roiMultiplier: "2.1×" },
    ],
    industries: ["JSE/LSE listed", "Healthcare & Pharma", "Banking & Insurance", "Government"],
    roiSummary: "Risk mitigation & audit trail value",
    keyBenefits: ["Real-time FINRA/JSE/IFRS compliance scoring", "Forward-looking statement detection", "Toxicity filter on all Q&A submissions", "Post-event compliance report & audit log", "Material information alerts during broadcast"],
    demoPath: "/compliance/dashboard",
  },
  "operations": {
    id: "operations", letter: "C", name: "Operations & Efficiency", color: "text-green-400",
    borderColor: "border-green-500/30", price: "$299/mo",
    tagline: "Operational efficiency tools for event operators and presenters",
    description: "Bundle C focuses on reducing operator workload and improving presenter performance. Live transcription, smart Q&A triage, pace coaching, and rolling summaries keep every event running smoothly.",
    features: [
      { id: "live-transcription", label: "Live Transcription" },
      { id: "qa-triage", label: "Q&A Auto-Triage" },
      { id: "pace-coach", label: "Pace Coach" },
      { id: "rolling-summary", label: "Rolling Summary" },
    ],
    industries: ["All industries", "Corporate events", "Town halls", "Training sessions"],
    roiSummary: "60% reduction in operator workload",
    keyBenefits: ["<1s live transcription in 12 languages", "Q&A workload reduced by 60%", "Real-time pace coaching for presenters", "Live 60-second rolling summaries for attendees", "Multi-language caption support"],
    demoPath: "/live-video/webcast/ceo-town-hall-q1-2026",
  },
  "content": {
    id: "content", letter: "D", name: "Content Marketing", color: "text-yellow-400",
    borderColor: "border-yellow-500/30", price: "$299/mo",
    tagline: "Turn every event into a multi-channel content library",
    description: "Bundle D automatically transforms live events into social posts, podcast episodes, press releases, and video recaps. One event becomes five distribution channels within 30 minutes of broadcast end.",
    features: [
      { id: "press-release", label: "Press Release" },
      { id: "event-echo", label: "Event Echo" },
      { id: "podcast", label: "Podcast Converter" },
      { id: "video-recap", label: "AI Video Recap" },
      { id: "rolling-summary", label: "Rolling Summary" },
    ],
    industries: ["Technology", "Media & Entertainment", "Financial Services", "All industries"],
    roiSummary: "Content amplification across 5+ channels",
    keyBenefits: ["SENS/RNS press release in 2 minutes post-event", "Social posts for 5 platforms, compliance-checked", "Professional podcast episode with chapter markers", "AI video highlight reel for IR portal", "Real-time rolling summaries for attendees"],
    demoPath: "/podcast-converter",
  },
  "premium": {
    id: "premium", letter: "E", name: "Premium All-Access", color: "text-purple-400",
    borderColor: "border-purple-500/30", price: "$499/mo",
    tagline: "Maximum intelligence — all features from A–D plus enterprise tools",
    description: "Bundle E includes every feature from Bundles A, B, C, and D plus the Intelligent Broadcaster panel and Advanced Analytics. Designed for enterprise accounts running high-stakes investor events.",
    features: [
      { id: "event-brief", label: "Event Brief" },
      { id: "sentiment-analysis", label: "Sentiment Analysis", roiMultiplier: "2.1×" },
      { id: "follow-ups", label: "Investor Follow-Ups", roiMultiplier: "2.6×" },
      { id: "lead-scoring", label: "Lead Scoring", roiMultiplier: "2.8×" },
      { id: "compliance", label: "Compliance Check" },
      { id: "toxicity", label: "Toxicity Filter" },
      { id: "qa-triage", label: "Q&A Auto-Triage" },
      { id: "pace-coach", label: "Pace Coach" },
      { id: "rolling-summary", label: "Rolling Summary" },
      { id: "press-release", label: "Press Release" },
      { id: "event-echo", label: "Event Echo" },
      { id: "podcast", label: "Podcast Converter" },
      { id: "broadcaster", label: "Intelligent Broadcaster" },
    ],
    industries: ["Large-cap listed companies", "Investment banks", "Global enterprise"],
    roiSummary: "Maximum ROI — all multipliers combined",
    keyBenefits: ["Every AI feature from all 4 bundles", "Intelligent Broadcaster unified alert panel", "Advanced interconnection analytics", "Priority support & dedicated onboarding", "White-label configuration included"],
    demoPath: "/ai-shop",
  },
  "social": {
    id: "social", letter: "F", name: "Social Amplification", color: "text-pink-400",
    borderColor: "border-pink-500/30", price: "$199/mo",
    tagline: "Social media amplification add-on for any bundle",
    description: "Bundle F is a standalone add-on that maximises social reach from every event. Event Echo generates platform-optimised posts, the Podcast Converter distributes audio content, and AI Video Recap creates short-form highlight reels.",
    features: [
      { id: "event-echo", label: "Event Echo" },
      { id: "podcast", label: "Podcast Converter" },
      { id: "video-recap", label: "AI Video Recap" },
    ],
    industries: ["Technology", "Media & Entertainment", "All industries"],
    roiSummary: "Social reach & content distribution",
    keyBenefits: ["Social posts for LinkedIn, X, Facebook, Instagram, TikTok", "Compliance pre-check on all social content", "Podcast auto-published to Spotify, Apple, Google", "AI video recap for social stories", "Engagement analytics dashboard"],
    demoPath: "/social",
  },
};

export default function BundleDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const bundleId = params.id || "";
  const bundle = BUNDLE_DATA[bundleId];

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Bundle not found</h2>
          <button onClick={() => navigate("/ai-shop")} className="text-primary hover:underline">
            Browse AI Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={() => navigate("/ai-shop")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">AI Shop</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">Bundle {bundle.letter}: {bundle.name}</span>
        </div>
      </header>

      <div className="container py-10 max-w-4xl mx-auto">
        <div className={`flex items-center gap-4 mb-8 p-6 bg-card border rounded-2xl ${bundle.borderColor}`}>
          <div className={`w-14 h-14 rounded-xl border ${bundle.borderColor} flex items-center justify-center text-2xl font-bold ${bundle.color} bg-card shrink-0`}>
            {bundle.letter}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">Bundle {bundle.letter}: {bundle.name}</h1>
              <span className="text-sm font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">{bundle.price}</span>
            </div>
            <p className="text-muted-foreground text-sm">{bundle.tagline}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
              <p className="text-sm leading-relaxed">{bundle.description}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Included Features ({bundle.features.length})</h2>
              <div className="space-y-2">
                {bundle.features.map(f => (
                  <button
                    key={f.id}
                    onClick={() => navigate(`/features/${f.id}`)}
                    className="w-full flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium">{f.label}</span>
                      {f.roiMultiplier && (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                          {f.roiMultiplier} ROI
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Key Benefits</h2>
              <div className="space-y-2">
                {bundle.keyBenefits.map(b => (
                  <div key={b} className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-sm">ROI Summary</h2>
              </div>
              <p className="text-sm text-emerald-400 font-medium">{bundle.roiSummary}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-3">Target Industries</h2>
              <div className="space-y-1.5">
                {bundle.industries.map(ind => (
                  <div key={ind} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-primary" />
                    {ind}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-2">
              <h2 className="font-semibold text-sm mb-3">Actions</h2>
              <button
                onClick={() => navigate(bundle.demoPath)}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Live Demo
              </button>
              <button
                onClick={() => navigate("/ai-shop")}
                className="w-full bg-secondary text-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-secondary/80 transition-colors"
              >
                Browse All Bundles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
