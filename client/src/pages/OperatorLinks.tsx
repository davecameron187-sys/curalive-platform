import { useLocation } from "wouter";
import {
  GraduationCap, Settings, Calendar, Zap, Brain, Package,
  ExternalLink, ChevronDown, ChevronRight, CheckCircle2,
  Monitor, BarChart3, Radio, HelpCircle, BookOpen, Award,
  MessageSquare, Star
} from "lucide-react";
import { useState } from "react";

type LinkCard = {
  badge: string; badgeColor: string; title: string;
  description: string; path: string; actionLabel: string;
};

type Section = {
  id: string; step?: string; title: string; icon: React.ElementType;
  color: string; description: string; cards: LinkCard[];
};

const BADGE_COLORS: Record<string, string> = {
  TRAINING: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  NEW: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  STUDIO: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ANALYTICS: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  CONSOLE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SETUP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FEATURE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  BUNDLE: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const SECTIONS: Section[] = [
  {
    id: "training", step: "STEP 1", title: "Training (Complete Before Going Live)",
    icon: GraduationCap, color: "text-purple-400",
    description: "All operators must complete the training path below before operating a live event. Recommended order: Operator Hub → Training Guide → Training Mode → Shadow a live event.",
    cards: [
      { badge: "TRAINING", badgeColor: BADGE_COLORS.TRAINING, title: "Operator Hub", description: "Start here. Full learning path, call-type guides, quick reference, and new AI feature tutorials.", path: "/operator-hub", actionLabel: "Access Hub" },
      { badge: "TRAINING", badgeColor: BADGE_COLORS.TRAINING, title: "OCC Training Guide", description: "4-phase interactive guide covering OCC layout, participant management, Q&A, compliance, and pro techniques. Quiz at end of each phase (75% to pass).", path: "/training", actionLabel: "Start Training" },
      { badge: "TRAINING", badgeColor: BADGE_COLORS.TRAINING, title: "Training Mode Console", description: "Isolated sandbox — practice running Earnings Calls, Audio Bridges, Video Webcasts, and Board Meetings. Nothing here affects production.", path: "/training-mode", actionLabel: "Practice Now" },
      { badge: "TRAINING", badgeColor: BADGE_COLORS.TRAINING, title: "Operator Reference Guide", description: "Quick-reference for dial-in numbers, platform integrations, webphone setup, and escalation procedures.", path: "/operator-guide", actionLabel: "View Guide" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Virtual Studio Training", description: "Learn to configure bundle-specific broadcast environments, select avatar styles, manage overlays, and generate replays.", path: "/training/virtual-studio", actionLabel: "Learn Virtual Studio" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "AI Features Training", description: "Master live transcription, sentiment analysis, Q&A auto-triage, compliance checking, and AI-powered insights.", path: "/training/ai-features", actionLabel: "Learn AI Features" },
    ],
  },
  {
    id: "console", step: "STEP 2", title: "The Operator Console (Live Events)",
    icon: Settings, color: "text-amber-400",
    description: "The OCC (Operator Control Centre) is the main workspace during a live event. Open it at least 15 minutes before the event start time.",
    cards: [
      { badge: "CONSOLE", badgeColor: BADGE_COLORS.CONSOLE, title: "Operator Console (OCC)", description: "Main operator workspace. Conference overview, CCP, Q&A management, lounge, webphone, and all live event controls.", path: "/occ", actionLabel: "Open OCC" },
      { badge: "ANALYTICS", badgeColor: BADGE_COLORS.ANALYTICS, title: "Operator Analytics", description: "Personal performance dashboard — calls handled, average handle time, quality scores, and training certifications.", path: "/operator/analytics", actionLabel: "View Analytics" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Virtual Studio Console", description: "Configure bundle-specific broadcast environments, select avatar styles, manage live overlays, and monitor ESG flags.", path: "/virtual-studio", actionLabel: "Open Studio" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Live Sentiment Dashboard", description: "Real-time sentiment analysis, engagement tracking, compliance monitoring, and AI-powered insights during broadcast.", path: "/live-sentiment", actionLabel: "View Sentiment" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Intelligent Broadcaster Panel", description: "AI-powered alerts, recommendations, and real-time guidance for operators during live events.", path: "/intelligent-broadcaster", actionLabel: "Open Panel" },
    ],
  },
  {
    id: "setup", step: "STEP 3", title: "Setting Up Events",
    icon: Calendar, color: "text-emerald-400",
    description: "Use these pages to schedule conferences, create webcasts, and manage the event calendar. Set up events at least 30 minutes before they are due to start.",
    cards: [
      { badge: "SETUP", badgeColor: BADGE_COLORS.SETUP, title: "Schedule an Event", description: "Create Audio Bridge / Earnings Call conferences. Sets up dial-in numbers, conference IDs, and participant lists.", path: "/events/schedule", actionLabel: "Schedule Event" },
      { badge: "SETUP", badgeColor: BADGE_COLORS.SETUP, title: "Event Calendar", description: "View all scheduled, live, and completed events. Quickly open the OCC for any active event.", path: "/events/calendar", actionLabel: "View Calendar" },
      { badge: "SETUP", badgeColor: BADGE_COLORS.SETUP, title: "Webcasting Hub", description: "Create and manage Audio Webcasts and Video Webcasts. Start here when setting up any internet-streamed event.", path: "/live-video/webcasting", actionLabel: "Webcasting Hub" },
      { badge: "SETUP", badgeColor: BADGE_COLORS.SETUP, title: "Create New Webcast", description: "Step-by-step wizard to create a new Audio or Video Webcast including registration page, speaker bridge, and stream settings.", path: "/live-video/webcast/create", actionLabel: "Create Webcast" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Studio Configuration", description: "Pre-event setup for Virtual Studio including bundle selection, avatar style, overlays, and language configuration.", path: "/virtual-studio", actionLabel: "Configure Studio" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "ESG Compliance Setup", description: "Configure ESG flags, sustainability metrics, and compliance requirements before event launch.", path: "/virtual-studio", actionLabel: "Setup ESG" },
    ],
  },
  {
    id: "interconnection", step: undefined, title: "Interconnection Analytics & Workflows",
    icon: Zap, color: "text-primary",
    description: "Discover how CuraLive's AI features work together and activate recommended workflows to maximize ROI.",
    cards: [
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Feature Interconnection Map", description: "Interactive visualization showing how all 16 AI features connect across 6 bundles. See recommended activation sequences and ROI multipliers.", path: "/feature-map", actionLabel: "View Map" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Interconnection Analytics Dashboard", description: "Real-time adoption metrics, ROI tracking, feature distribution, workflow completion rates, and customer segment analytics.", path: "/admin/interconnection-analytics", actionLabel: "View Analytics" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Recommended Workflows", description: "Pre-configured feature activation sequences for each bundle. Maximize ROI by activating features in the recommended order.", path: "/workflows", actionLabel: "View Workflows" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "AI Shop", description: "Browse all 16 AI features with interconnection badges, see related features, and activate new capabilities with one click.", path: "/ai-shop", actionLabel: "Browse Features" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Post-Event Report", description: "AI-generated summaries, full transcripts, sentiment analysis, Q&A highlights, and ROI realization tracking.", path: "/post-event/q4-earnings-2026", actionLabel: "View Reports" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Webcast Recap Generator", description: "Automatically generate video recaps, podcast conversions, and social media content from completed events.", path: "/webcast-recap", actionLabel: "Generate Recap" },
    ],
  },
  {
    id: "ai-features", step: undefined, title: "AI-Powered Features (16 Total)",
    icon: Brain, color: "text-blue-400",
    description: "Master CuraLive's 16 AI features across 6 bundles. Each feature is interconnected to maximize ROI.",
    cards: [
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Live Transcription", description: "Real-time speech-to-text with <1s latency. Supports 12 languages with auto-translation.", path: "/features/live-transcription", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Sentiment Analysis", description: "Monitor live investor mood, engagement, and audience reaction in real-time. 2.1× ROI multiplier.", path: "/features/sentiment-analysis", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Q&A Auto-Triage", description: "Smart question categorization, auto-moderation, and prioritization. Reduces operator workload by 60%.", path: "/features/qa-triage", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Compliance Check", description: "Regulatory risk scoring, FINRA compliance monitoring, and real-time alerts.", path: "/features/compliance", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Lead Scoring", description: "Hot/Warm/Cold investor signals based on engagement and sentiment. 2.8× ROI multiplier.", path: "/features/lead-scoring", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Investor Follow-Ups", description: "Personalized post-event outreach powered by AI. 2.6× ROI multiplier.", path: "/features/follow-ups", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Event Brief", description: "Pre-event AI briefing pack with investor profiles, key talking points, and risk alerts.", path: "/features/event-brief", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Rolling Summary", description: "Live 60-second summaries updated every minute during broadcast.", path: "/features/rolling-summary", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Press Release", description: "AI-generated SENS/RNS-compliant press release draft within 2 minutes of event end.", path: "/features/press-release", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Event Echo", description: "AI-generated social media posts, tweets, and LinkedIn content from event highlights.", path: "/features/event-echo", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Podcast Converter", description: "Automatically convert webcast to investor podcast with professional editing and distribution.", path: "/features/podcast", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Sustainability Tracker", description: "Carbon footprint calculation and ESG certification tracking for events.", path: "/features/sustainability", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "AI Video Recap", description: "Post-event video brief with key moments, sentiment highlights, and action items.", path: "/features/video-recap", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Toxicity Filter", description: "Content safety layer with real-time detection and moderation of inappropriate content.", path: "/features/toxicity", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Pace Coach", description: "Real-time feedback on speaking pace, filler words, and presentation quality.", path: "/features/pace-coach", actionLabel: "Learn More" },
      { badge: "FEATURE", badgeColor: BADGE_COLORS.FEATURE, title: "Intelligent Broadcaster", description: "Unified AI alert panel with real-time recommendations and operator guidance.", path: "/features/broadcaster", actionLabel: "Learn More" },
    ],
  },
  {
    id: "bundles", step: undefined, title: "AI Bundles (6 Configurations)",
    icon: Package, color: "text-violet-400",
    description: "Each bundle combines 2–6 AI features optimized for specific use cases and industries.",
    cards: [
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle A: Investor Relations", description: "Features: Event Brief, Sentiment Analysis, Investor Follow-Ups, Lead Scoring, Q&A Auto-Triage, Live Transcription. ROI: 2.1× – 2.8×", path: "/bundles/investor-relations", actionLabel: "View Bundle" },
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle B: Compliance & Risk", description: "Features: Compliance Check, Toxicity Filter, Live Transcription, Sentiment Analysis. ROI: Risk Mitigation", path: "/bundles/compliance", actionLabel: "View Bundle" },
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle C: Operations", description: "Features: Live Transcription, Q&A Auto-Triage, Pace Coach, Rolling Summary. ROI: 60% efficiency gain", path: "/bundles/operations", actionLabel: "View Bundle" },
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle D: Content Marketing", description: "Features: Press Release, Event Echo, Podcast Converter, AI Video Recap, Rolling Summary. ROI: Content Amplification", path: "/bundles/content", actionLabel: "View Bundle" },
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle E: Premium", description: "All features from A–D + Intelligent Broadcaster, Advanced Analytics. ROI: Maximum", path: "/bundles/premium", actionLabel: "View Bundle" },
      { badge: "BUNDLE", badgeColor: BADGE_COLORS.BUNDLE, title: "Bundle F: Social Amplification", description: "Features: Event Echo, Podcast Converter, AI Video Recap. ROI: Social Reach", path: "/bundles/social", actionLabel: "View Bundle" },
    ],
  },
  {
    id: "quickref", step: undefined, title: "Quick Reference",
    icon: HelpCircle, color: "text-slate-400",
    description: "Support, documentation, certification, and feedback.",
    cards: [
      { badge: "CONSOLE", badgeColor: BADGE_COLORS.CONSOLE, title: "Support & Escalation", description: "Need help? Contact your supervisor or the CuraLive support team.", path: "/support", actionLabel: "Get Support" },
      { badge: "CONSOLE", badgeColor: BADGE_COLORS.CONSOLE, title: "Documentation", description: "Complete documentation for all features, bundles, and workflows.", path: "/docs", actionLabel: "View Docs" },
      { badge: "TRAINING", badgeColor: BADGE_COLORS.TRAINING, title: "Certification", description: "Earn CuraLive operator certification by completing all training modules.", path: "/certification", actionLabel: "Get Certified" },
      { badge: "ANALYTICS", badgeColor: BADGE_COLORS.ANALYTICS, title: "My Dashboard", description: "Track your personal performance metrics and training progress.", path: "/my-dashboard", actionLabel: "View Dashboard" },
      { badge: "CONSOLE", badgeColor: BADGE_COLORS.CONSOLE, title: "Feedback & Suggestions", description: "Help us improve CuraLive by sharing your feedback and suggestions.", path: "/feedback", actionLabel: "Send Feedback" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "What's New", description: "Latest updates, new features, and platform improvements.", path: "/whats-new", actionLabel: "See Updates" },
    ],
  },
];

const CHECKLIST_SECTIONS = [
  { title: "Pre-Launch Training", items: ["Training Guide: Completed all 4 phases and passed each quiz (75% minimum)", "AI Features Training: Completed Virtual Studio and AI Features training modules", "Training Mode: Completed at least one full practice session. Scored 4 or more stars", "Interconnection Workflows: Reviewed recommended activation sequences for your bundle"] },
  { title: "Pre-Event Setup", items: ["Shadow session: Observed an experienced operator running a live event", "Headset and webphone: Tested audio equipment and confirmed webphone registration at least 15 minutes before", "Studio Configuration: Pre-configured Virtual Studio with correct bundle, avatar style, and overlays", "ESG Setup: Configured ESG flags and compliance requirements if applicable"] },
  { title: "During Event", items: ["OCC status: Set your status to Present & Ready in the OCC before the event start time", "Virtual Studio: Monitor avatar, overlays, and live metrics during broadcast", "Sentiment Dashboard: Watch real-time sentiment, engagement, and compliance indicators", "Intelligent Broadcaster: Review AI recommendations and operator alerts throughout event"] },
  { title: "Post-Event", items: ["Post-Event Report: Review AI-generated summary, sentiment analysis, and Q&A highlights", "ROI Tracking: Monitor ROI realization in Interconnection Analytics dashboard", "Webcast Recap: Generate and distribute video recap, podcast, and social content", "Feedback: Provide feedback on AI feature performance and recommendations"] },
];

function SectionCard({ section }: { section: Section }) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {section.step && (
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              {section.step}
            </span>
          )}
          <Icon className={`w-5 h-5 ${section.color}`} />
          <span className="font-bold">{section.title}</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hidden sm:block">
            {section.cards.length} links
          </span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground mb-5 italic">{section.description}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.cards.map(card => (
              <div
                key={card.path + card.title}
                className="bg-background border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{card.description}</p>
                <button
                  onClick={() => navigate(card.path)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  {card.actionLabel} <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OperatorLinks() {
  const [, navigate] = useLocation();
  const [checklistOpen, setChecklistOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">CuraLive</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium">Operator Platform Links</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:block">Internal Use Only · March 10, 2026 · v2.0</span>
            <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded font-semibold">
              Production Ready
            </span>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎯 CuraLive — Operator Platform Links</h1>
          <p className="text-muted-foreground">Training, Console Access, Event Setup & New AI Features</p>
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
            <strong>⚠️ Internal Use Only.</strong> All links below are active and connected to the live demo environment. Use the simulate button in the Webcast Studio to run a demo event end-to-end.
          </div>
        </div>

        <div className="space-y-5 mb-8">
          {SECTIONS.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          <button
            onClick={() => setChecklistOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">Recommended Operator Checklist</span>
            </div>
            {checklistOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {checklistOpen && (
            <div className="px-6 pb-6 grid sm:grid-cols-2 gap-4">
              {CHECKLIST_SECTIONS.map(section => (
                <div key={section.title} className="bg-background border border-border rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-primary mb-3">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground border-t border-border pt-6">
          CuraLive Platform · Internal Operator Documentation · March 2026 · v2.0
          <br />All features tested and approved for production deployment. Ready for pilot customer deployment.
        </div>
      </div>
    </div>
  );
}
