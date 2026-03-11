import { useLocation } from "wouter";
import {
  GraduationCap, Settings, Calendar, Zap, Brain, Package,
  ExternalLink, ChevronDown, ChevronRight, CheckCircle2,
  HelpCircle, Play, X, ChevronRight as ChevRight,
  Radio, Users, AlertTriangle, BarChart3, FileText,
  Mic, Star, Clock, Loader2, Rocket, MapPin, Circle,
  TrendingUp, ShieldCheck, Database, Activity, Tag,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

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
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Agentic Event Brain", description: "CuraLive's proprietary AI scoring engine. Answer 3 questions to get your optimal bundle, AI-generated action plan, and ROI projection.", path: "/agentic-brain", actionLabel: "Activate Brain" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Autonomous Intervention Engine", description: "6 live rules that fire automatically during events — sentiment drops, Q&A overload, compliance risks, and more. Agents act without human input.", path: "/autonomous-intervention", actionLabel: "View Engine" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Tagged Metrics Dashboard", description: "Your proprietary intelligence database. Every sentiment score, compliance flag, scaling event and engagement signal stored and queryable. The data moat that compounds with every event.", path: "/tagged-metrics", actionLabel: "View Dashboard" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Shadow Mode — Live Intelligence", description: "Plug into any live webcast or meeting. CuraLive runs silently in the background — transcribes, scores sentiment, detects compliance risks, and builds your intelligence database. Clients see nothing.", path: "/shadow-mode", actionLabel: "Launch Shadow Mode" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Archive Upload", description: "Upload any past event transcript and retroactively build your intelligence database. Paste or upload a .txt file — CuraLive scores sentiment, scans compliance, and adds 4 tagged records instantly.", path: "/archive-upload", actionLabel: "Upload Archive" },
      { badge: "NEW", badgeColor: BADGE_COLORS.NEW, title: "Industry Benchmarks", description: "Anonymized aggregate intelligence across all events on the platform. Sentiment distributions, compliance risk profiles, engagement patterns, and coverage by quarter — no client data, no identifiers.", path: "/benchmarks", actionLabel: "View Benchmarks" },
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

type SimStep = {
  id: string;
  phase: "pre" | "live" | "post";
  label: string;
  detail: string;
  icon: React.ElementType;
  color: string;
  path?: string;
  linkLabel?: string;
  delayMs: number;
};

const SIM_STEPS: SimStep[] = [
  { id: "brief", phase: "pre", label: "AI Event Brief generated", detail: "Investor profiles, talking points, and risk alerts compiled for Q4 Earnings Call", icon: FileText, color: "text-blue-400", path: "/features/event-brief", linkLabel: "View Brief", delayMs: 0 },
  { id: "studio", phase: "pre", label: "Virtual Studio configured", detail: "Bundle A selected · Professional avatar · ESG overlay active · EN→FR dubbing ready", icon: Radio, color: "text-pink-400", path: "/virtual-studio", linkLabel: "Open Studio", delayMs: 2800 },
  { id: "esg", phase: "pre", label: "ESG compliance flags set", detail: "Carbon offset certificate linked · TCFD disclosure flag enabled · Sustainability overlay ready", icon: AlertTriangle, color: "text-amber-400", path: "/virtual-studio", linkLabel: "View ESG", delayMs: 5200 },
  { id: "live", phase: "live", label: "Event LIVE — 847 viewers joined", detail: "OCC open · Webcast stream active · Live transcription running at <1s latency", icon: Mic, color: "text-red-400", path: "/occ", linkLabel: "Open OCC", delayMs: 8000 },
  { id: "sentiment", phase: "live", label: "Sentiment: 78% Positive", detail: "Investor mood trending upward on guidance commentary · Engagement peak at 14:12", icon: BarChart3, color: "text-emerald-400", path: "/live-sentiment", linkLabel: "View Sentiment", delayMs: 11000 },
  { id: "qa", phase: "live", label: "Q&A Auto-Triage: 23 questions", detail: "8 IR questions prioritized · 3 compliance-flagged items routed · 2 toxicity blocks", icon: Users, color: "text-cyan-400", path: "/features/qa-triage", linkLabel: "View Q&A", delayMs: 14000 },
  { id: "compliance", phase: "live", label: "Compliance alert: Revenue guidance", detail: "Forward-looking statement detected · FINRA safe harbour language auto-prepended", icon: AlertTriangle, color: "text-orange-400", path: "/features/compliance", linkLabel: "View Alert", delayMs: 17000 },
  { id: "pace", phase: "live", label: "Pace Coach: 148 WPM — optimal", detail: "CEO speaking rate in target zone · Filler words: 3 (low) · Audience retention: 92%", icon: Star, color: "text-yellow-400", path: "/features/pace-coach", linkLabel: "View Coaching", delayMs: 20000 },
  { id: "summary", phase: "live", label: "Rolling Summary updated (14:15)", detail: "\"Q4 revenue guidance raised 12% · Management confident in FY2026 outlook · ESG targets on track\"", icon: FileText, color: "text-indigo-400", path: "/features/rolling-summary", linkLabel: "View Summary", delayMs: 23000 },
  { id: "report", phase: "post", label: "Post-Event Report generated", detail: "Full transcript · Sentiment analysis · Q&A highlights · Lead scores for 124 attendees", icon: FileText, color: "text-blue-400", path: "/post-event/q4-earnings-2026", linkLabel: "View Report", delayMs: 26000 },
  { id: "release", phase: "post", label: "Press release drafted", detail: "SENS/RNS-compliant draft ready in 1m 47s · CFO quote auto-inserted · Regulatory language verified", icon: FileText, color: "text-slate-400", path: "/features/press-release", linkLabel: "View Release", delayMs: 28500 },
  { id: "recap", phase: "post", label: "Webcast Recap + Podcast ready", detail: "3-min video recap generated · Investor podcast episode published to feed · Social clips ready", icon: Zap, color: "text-primary", path: "/webcast-recap", linkLabel: "View Recap", delayMs: 31000 },
  { id: "followups", phase: "post", label: "47 personalized follow-ups sent", detail: "Hot leads: 12 · Warm: 28 · Scheduled IR calls: 7 · Total estimated pipeline: $2.4M", icon: Users, color: "text-violet-400", path: "/features/follow-ups", linkLabel: "View Follow-Ups", delayMs: 33500 },
  { id: "roi", phase: "post", label: "ROI realized: 2.7× across all features", detail: "Bundle A workflow completed · Interconnection analytics updated · Ready for next event", icon: BarChart3, color: "text-emerald-400", path: "/admin/interconnection-analytics", linkLabel: "View ROI", delayMs: 36000 },
];

const PHASE_LABELS = { pre: "Pre-Event", live: "Live Event", post: "Post-Event" };
const PHASE_COLORS = { pre: "text-blue-400", live: "text-red-400", post: "text-emerald-400" };

function SimulationPanel({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const startSimulation = useCallback(() => {
    clearAllTimers();
    setActiveStep(-1);
    setCompletedSteps(new Set());
    setRunning(true);
    toast.success("Demo simulation starting…");

    SIM_STEPS.forEach((step, idx) => {
      const t1 = setTimeout(() => {
        setActiveStep(idx);
        toast.success(step.label, { duration: 3000 });
      }, step.delayMs);
      const t2 = setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, step.id]));
      }, step.delayMs + 2200);
      timersRef.current.push(t1, t2);
    });

    const finalDelay = SIM_STEPS[SIM_STEPS.length - 1].delayMs + 3500;
    const tFinal = setTimeout(() => {
      setRunning(false);
      setActiveStep(-1);
      toast.success("Simulation complete! All 14 steps executed successfully.", { duration: 5000 });
    }, finalDelay);
    timersRef.current.push(tFinal);
  }, [clearAllTimers]);

  const stopSimulation = useCallback(() => {
    clearAllTimers();
    setRunning(false);
    setActiveStep(-1);
  }, [clearAllTimers]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const groupedPhases: Record<string, SimStep[]> = { pre: [], live: [], post: [] };
  SIM_STEPS.forEach(s => groupedPhases[s.phase].push(s));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[90vh] bg-background border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${running ? "bg-red-400 animate-pulse" : "bg-slate-500"}`} />
            <span className="font-bold text-sm">Q4 Earnings Call — Full Event Simulation</span>
            {running && <span className="text-xs text-muted-foreground">(~37 seconds)</span>}
          </div>
          <div className="flex items-center gap-2">
            {!running ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Play className="w-3 h-3" />
                {completedSteps.size > 0 ? "Replay" : "Run Simulation"}
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
              >
                <X className="w-3 h-3" /> Stop
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {!running && completedSteps.size === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Ready to run the full event demo</p>
              <p className="text-xs mt-1 opacity-60">14 steps · Pre-event → Live → Post-event · ~37 seconds</p>
              <p className="text-xs mt-3 opacity-50">Covers all 16 AI features and the complete CuraLive operator workflow</p>
            </div>
          )}

          {(["pre", "live", "post"] as const).map(phase => {
            const steps = groupedPhases[phase];
            const hasAny = steps.some(s => completedSteps.has(s.id) || SIM_STEPS.indexOf(s) === activeStep);
            if (!hasAny && completedSteps.size === 0 && !running) return null;

            return (
              <div key={phase}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${PHASE_COLORS[phase]}`}>
                    {PHASE_LABELS[phase]}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2">
                  {steps.map(step => {
                    const stepIdx = SIM_STEPS.indexOf(step);
                    const isActive = stepIdx === activeStep;
                    const isDone = completedSteps.has(step.id);
                    const isWaiting = !isActive && !isDone;
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 ${
                          isActive ? "border-primary bg-primary/5 shadow-sm" : isDone ? "border-border bg-card" : "border-border/40 opacity-40"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isDone ? "bg-emerald-400/20" : isActive ? "bg-primary/20" : "bg-secondary"}`}>
                          {isDone
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : isActive
                            ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                            : <Icon className={`w-3.5 h-3.5 ${step.color} opacity-60`} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className={`w-3.5 h-3.5 ${step.color} shrink-0`} />
                            <span className={`text-sm font-semibold ${isActive ? "text-primary" : ""}`}>{step.label}</span>
                          </div>
                          {(isDone || isActive) && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic leading-relaxed">{step.detail}</p>
                          )}
                          {isDone && step.path && (
                            <button
                              onClick={() => { onClose(); navigate(step.path! + (step.path!.includes("?") ? "&" : "?") + "from=operator-links"); }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1.5 font-medium"
                            >
                              {step.linkLabel} <ChevRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {isActive && (
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider shrink-0 animate-pulse">Live</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!running && completedSteps.size === SIM_STEPS.length && (
            <div className="text-center py-4 bg-emerald-400/5 border border-emerald-400/20 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-400">Simulation Complete</p>
              <p className="text-xs text-muted-foreground mt-1">All 14 steps executed · ROI: 2.7× · Bundle A workflow complete</p>
            </div>
          )}
        </div>

        {(running || completedSteps.size > 0) && (
          <div className="shrink-0 px-5 py-3 border-t border-border bg-card">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completedSteps.size} / {SIM_STEPS.length} steps</span>
              <span>{Math.round((completedSteps.size / SIM_STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${(completedSteps.size / SIM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Intelligence Roadmap ─────────────────────────────────────────────────────

const ROADMAP_ITEMS = [
  {
    phase: "Built",
    color: "emerald",
    items: [
      { title: "Agentic Event Brain", desc: "Proprietary scoring algorithm (patent pending). 3-question wizard → GPT-4o recommendation → ROI preview. Every analysis logged to database.", path: "/agentic-brain", icon: Brain },
      { title: "Autonomous Intervention Engine", desc: "6 live rules that fire without human input during events. Sentiment drop, Q&A overload, compliance risk, engagement drop, positive spike, high-value event detection.", path: "/autonomous-intervention", icon: Zap },
      { title: "Cross-Event Memory", desc: "Brain now queries all past analyses for your bundle. Surfaces patterns: average confidence score, dominant challenge, peak performance, last run timestamp.", path: "/agentic-brain", icon: Database },
      { title: "Tagged Metrics Dashboard", desc: "Proprietary intelligence database. Every sentiment score, compliance flag, scaling event and engagement signal stored, tagged and queryable. The data moat that compounds with every event.", path: "/tagged-metrics", icon: Tag },
      { title: "Bundle Interconnection Map", desc: "Visual map of how all 6 bundles trigger each other automatically. IR → Compliance → Operations → Content chain reaction.", path: "/feature-map", icon: Activity },
      { title: "Operator Console (OCC)", desc: "Full live event control: CCP, Q&A management, participant states, green room, compliance monitoring, real-time analytics.", path: "/occ", icon: Settings },
      { title: "Virtual Studio", desc: "Bundle-specific broadcast environments with AI overlays, avatar styles, ESG flags, and real-time preview.", path: "/virtual-studio", icon: Star },
    ],
  },
  {
    phase: "Next: Building Now",
    color: "amber",
    items: [
      { title: "Investor Persona Profiles", desc: "Brain learns each investor's behaviour across events. How they engage, when they go cold, what topics spike their sentiment. Builds automatically from live event data.", path: null, icon: Users },
      { title: "Predictive Pre-Event Intelligence", desc: "Before a word is spoken, the Brain scores the call: risk probability, sentiment prediction, recommended setup. Gets sharper with every event run.", path: null, icon: TrendingUp },
    ],
  },
  {
    phase: "Roadmap: Q3 2026",
    color: "slate",
    items: [
      { title: "Market Signal Integration", desc: "Pull Bloomberg/Reuters data into the Brain. Stock down 4% on earnings day? Brain automatically shifts to defensive compliance mode.", path: null, icon: BarChart3 },
      { title: "Multi-Event Orchestration", desc: "For roadshows (20+ meetings in 10 cities), the Brain manages the full sequence. Remembers meeting 1 and adjusts briefing for meeting 2 automatically.", path: null, icon: MapPin },
      { title: "Acquisition Data Dashboard", desc: "Executive view showing cumulative ROI across all events, bundle adoption rates, AI agent intervention frequency, and investor persona coverage — the data room for acquisition due diligence.", path: null, icon: Rocket },
    ],
  },
];

const PHASE_STYLES: Record<string, { border: string; badge: string; dot: string; label: string }> = {
  emerald: { border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400", label: "✓ Live" },
  amber:   { border: "border-amber-500/30",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",     dot: "bg-amber-400",   label: "In Progress" },
  slate:   { border: "border-slate-600/40",   badge: "bg-slate-700/60 text-slate-400 border-slate-600/40",     dot: "bg-slate-500",   label: "Planned" },
};

function IntelligenceRoadmap() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border border-violet-500/20 rounded-2xl overflow-hidden mb-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5 text-violet-400" />
          <span className="font-bold">Intelligence Roadmap</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-violet-500/20 text-violet-300 border-violet-500/30">Acquisition Strategy</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground mb-6 italic">
            Tracks what's been built, what's in progress, and what's coming. Each item strengthens the acquisition case. Live items are clickable.
          </p>
          <div className="space-y-8">
            {ROADMAP_ITEMS.map(phase => {
              const style = PHASE_STYLES[phase.color];
              return (
                <div key={phase.phase}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{phase.phase}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${style.badge}`}>{style.label}</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phase.items.map(item => {
                      const Icon = item.icon;
                      const clickable = item.path != null;
                      return (
                        <div
                          key={item.title}
                          onClick={() => clickable && navigate(item.path! + "?from=operator-links")}
                          className={`p-4 rounded-xl border ${style.border} bg-background/60 transition-all ${clickable ? "cursor-pointer hover:border-violet-400/50 hover:bg-violet-950/20 group" : "opacity-60"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${phase.color === "emerald" ? "bg-emerald-500/15" : phase.color === "amber" ? "bg-amber-500/15" : "bg-slate-700/50"}`}>
                              <Icon className={`w-3.5 h-3.5 ${phase.color === "emerald" ? "text-emerald-400" : phase.color === "amber" ? "text-amber-400" : "text-slate-500"}`} />
                            </div>
                            <span className={`text-xs font-bold ${clickable ? "group-hover:text-violet-300 transition-colors" : "text-slate-400"}`}>{item.title}</span>
                            {clickable && <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-violet-400 ml-auto shrink-0 transition-colors" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-violet-950/40 border border-violet-500/20 text-xs text-violet-300">
            <strong className="text-violet-200">Acquisition readiness:</strong> 6 of 11 intelligence features live. Cross-event memory and autonomous intervention engine operational. Next milestone: Investor Persona Profiles after first 5 live events.
          </div>
        </div>
      )}
    </div>
  );
}

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
                  onClick={() => navigate(card.path + (card.path.includes("?") ? "&" : "?") + "from=operator-links")}
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
  const [simOpen, setSimOpen] = useState(false);

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
          <h1 className="text-3xl font-bold mb-2">CuraLive — Operator Platform Links</h1>
          <p className="text-muted-foreground">Training, Console Access, Event Setup &amp; New AI Features</p>
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
            <strong>Internal Use Only.</strong> All links below are active and connected to the live demo environment. Click <strong>Run Demo Simulation</strong> to walk through a complete Q4 Earnings Call end-to-end.
          </div>
        </div>

        <div className="space-y-5 mb-8">
          {SECTIONS.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* ── Intelligence Roadmap ─────────────────────────────────────────── */}
        <IntelligenceRoadmap />

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

      <button
        onClick={() => setSimOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-2xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        <Play className="w-4 h-4" />
        Run Demo Simulation
      </button>

      {simOpen && <SimulationPanel onClose={() => setSimOpen(false)} />}
    </div>
  );
}
