import { CheckCircle2, Clock, Zap, Filter, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FeatureStatus = "completed" | "in-progress" | "planned";

interface AIFeature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  progress: number; // 0-100
  category: string;
  estimatedHours?: number;
  completedDate?: string;
  dependencies?: string[];
  features: string[];
  location?: string;
  tests?: string;
  route?: string;
}

const AI_FEATURES: AIFeature[] = [
  // COMPLETED FEATURES
  {
    id: "transcription",
    name: "AI Transcription Service",
    description: "Real-time speech-to-text powered by Recall.ai Whisper API with <1s latency",
    status: "completed",
    progress: 100,
    category: "Core AI",
    completedDate: "Mar 2026",
    features: [
      "Live transcription segments with speaker identification",
      "Confidence scoring for each segment",
      "6 tRPC procedures for transcription management",
      "Full database schema with 54+ tables",
      "284+ vitest tests passing",
    ],
    location: "server/services/TranscriptionService.ts",
    tests: "284+ tests",
  },
  {
    id: "sentiment",
    name: "Sentiment Analysis Engine",
    description: "AI-powered emotion detection using OpenAI API analyzing speaker tone and audience reaction",
    status: "completed",
    progress: 100,
    category: "Core AI",
    completedDate: "Mar 2026",
    features: [
      "Real-time sentiment scoring (0-1 scale)",
      "6 emotion categories: positive, negative, neutral, excited, concerned, confused",
      "Confidence scores for each emotion",
      "Speaker profiling with sentiment trends",
      "Batch sentiment analysis for historical data",
      "7 tRPC procedures for sentiment queries",
    ],
    location: "server/services/SentimentAnalysisService.ts",
    tests: "319+ tests",
  },
  {
    id: "recall-webhook",
    name: "Recall.ai Webhook Integration",
    description: "Real-time transcription updates from Recall.ai bots with automatic segment storage",
    status: "completed",
    progress: 100,
    category: "Integration",
    completedDate: "Mar 2026",
    features: [
      "Webhook endpoint at /api/recall/webhook",
      "Automatic segment storage on transcription events",
      "Error handling and retry logic",
      "Event validation and signature verification",
    ],
    location: "server/webhooks/recall.ts",
  },
  {
    id: "ai-dashboard",
    name: "AI Content Approval Dashboard",
    description: "Operator review & approval system for all AI-generated content before sending",
    status: "completed",
    progress: 100,
    category: "Operator Tools",
    completedDate: "Mar 2026",
    features: [
      "8 tRPC procedures for content CRUD and approval",
      "Content editor modal for inline editing",
      "6 content types: event_summary, press_release, follow_up_email, talking_points, qa_analysis, sentiment_report",
      "Approval workflow: generated → reviewed → edited → approved → sent",
      "Email integration via Resend",
      "Audit trail with timestamps and user tracking",
    ],
    location: "/ai-dashboard route",
  },
  {
    id: "content-triggers",
    name: "AI Content Generation Triggers",
    description: "Automatic AI content generation when events complete with context-aware prompts",
    status: "completed",
    progress: 100,
    category: "Automation",
    completedDate: "Mar 2026",
    features: [
      "ContentGenerationTriggerService with 8 methods",
      "Event completion detection with webhook",
      "Context-aware prompt generation",
      "Automatic content generation for 6 content types",
      "Batch processing for multiple events",
      "Error handling and retry logic",
      "Database table: content_generation_triggers",
    ],
    location: "server/services/ContentGenerationTriggerService.ts",
    tests: "45+ tests",
  },
  {
    id: "analytics",
    name: "Content Performance Analytics",
    description: "Track approval rates, engagement metrics, and content effectiveness across all AI content",
    status: "completed",
    progress: 100,
    category: "Analytics",
    completedDate: "Mar 2026",
    features: [
      "ContentPerformanceAnalyticsService with 10 methods",
      "Real-time approval rate tracking",
      "Engagement metrics (opens, clicks, replies)",
      "Content effectiveness scoring",
      "Trend analysis and forecasting",
      "Database table: content_performance_metrics",
      "8 tRPC procedures for analytics queries",
    ],
    location: "server/services/ContentPerformanceAnalyticsService.ts",
    tests: "39+ tests",
  },
  {
    id: "qa-triage",
    name: "AI Q&A Auto-Triage",
    description: "Automatic classification of Q&A questions (approved/duplicate/off-topic/sensitive)",
    status: "completed",
    progress: 100,
    category: "Moderator Tools",
    completedDate: "Mar 2026",
    features: [
      "LLM-powered question classification (6 categories)",
      "Confidence scoring for each classification",
      "Price-sensitive and confidential content detection",
      "Database table: qa_auto_triage_results",
      "8 tRPC procedures for Q&A management",
    ],
    location: "server/services/QaAutoTriageService.ts",
    tests: "70+ tests",
  },
  {
    id: "toxicity-filter",
    name: "Toxicity & Compliance Filter",
    description: "Automatic detection and flagging of abusive, price-sensitive, or non-compliant questions",
    status: "completed",
    progress: 100,
    category: "Compliance",
    completedDate: "Mar 2026",
    features: [
      "Real-time toxicity detection (0-1 scale)",
      "6 toxicity categories: abusive, harassing, price-sensitive, confidential, spam, legal_risk",
      "Risk level assessment (low, medium, high, critical)",
      "Recommended actions (approve, review, flag, block, redact)",
      "Database table: toxicity_filter_results",
      "9 tRPC procedures for toxicity management",
    ],
    location: "server/services/ToxicityFilterService.ts",
    tests: "70+ tests",
  },
  {
    id: "speaking-pace",
    name: "Speaking-Pace Coach",
    description: "Real-time WPM detector with colour-coded pace indicator and coaching tips",
    status: "completed",
    progress: 100,
    category: "Presenter Tools",
    completedDate: "Mar 2026",
    features: [
      "Real-time WPM calculation (120-150 optimal)",
      "Pause detection (300-800ms optimal)",
      "Filler word tracking (um, uh, like, you know)",
      "Colour-coded pace indicator (green/yellow/red)",
      "Personalized coaching tips",
      "Database table: speaking_pace_analysis",
      "9 tRPC procedures for pace analysis",
    ],
    location: "server/services/SpeakingPaceCoachService.ts",
    tests: "60+ tests",
  },
  {
    id: "sentiment-feed",
    name: "Audience Sentiment Feed",
    description: "Live sentiment score displayed in presenter teleprompter for real-time feedback",
    status: "completed",
    progress: 100,
    category: "Presenter Tools",
    completedDate: "Mar 2026",
    features: [
      "Real-time sentiment score (0-100 scale)",
      "Emotion breakdown (positive, negative, neutral, excited, concerned, confused)",
      "Trend indicators (improving/declining)",
      "Sentiment heatmap by time",
      "Live display in presenter teleprompter",
      "Historical sentiment tracking",
    ],
    location: "client/src/components/SentimentFeed.tsx",
  },
  {
    id: "silence-detector",
    name: "Silence & Anomaly Detector",
    description: "Alert operator when audio gap > 10s detected or other anomalies occur",
    status: "completed",
    progress: 100,
    category: "Operator Tools",
    completedDate: "Mar 2026",
    features: [
      "Real-time silence detection (10s threshold)",
      "Background noise anomaly detection",
      "Audio level anomaly detection",
      "Automatic operator alerts",
      "Database table: silence_anomaly_detector_results",
      "7 tRPC procedures for anomaly management",
    ],
    location: "server/services/SilenceAnomalyDetectorService.ts",
    tests: "50+ tests",
  },
  {
    id: "event-brief",
    name: "AI Event Brief Generator",
    description: "Paste press release → LLM generates event brief + talking points automatically",
    status: "completed",
    progress: 100,
    category: "Automation",
    completedDate: "Mar 2026",
    features: [
      "Press release input modal with title and event ID",
      "LLM-powered brief generation with confidence scoring",
      "Talking points extraction with speaker notes",
      "Key messages with emphasis badges",
      "Financial highlights extraction",
      "Anticipated Q&A with difficulty levels",
      "Operator approval workflow with notes",
      "Brief history and analytics tab",
      "Database table: event_brief_results",
      "9 tRPC procedures for brief management",
    ],
    location: "server/services/EventBriefGeneratorService.ts",
    tests: "50+ tests",
    route: "/operator/brief-generator",
  },
  {
    id: "press-release",
    name: "AI Press Release Draft",
    description: "One-click SENS/RNS-style press release generation from event transcript",
    status: "completed",
    progress: 100,
    category: "Post-Event",
    completedDate: "Mar 2026",
    features: [
      "SENS/RNS compliance formatting",
      "Financial highlights extraction from transcript",
      "Quote integration from speakers with context",
      "Regulatory compliance checking (SENS/RNS flags)",
      "Multi-format export (HTML, PDF, TXT)",
      "Key highlights and metrics extraction",
      "Operator approval workflow",
      "Database table: press_release_draft_results",
      "12 tRPC procedures",
    ],
    location: "server/services/PressReleaseDraftService.ts",
    tests: "55+ tests",
  },
  {
    id: "followup-email",
    name: "Automated Follow-Up Email Draft",
    description: "Personalized follow-up email drafts per IR contact based on event data",
    status: "completed",
    progress: 100,
    category: "Post-Event",
    completedDate: "Mar 2026",
    features: [
      "Per-contact personalization with name, company, role",
      "Event highlights extraction from transcript",
      "Call-to-action generation based on event type",
      "Sentiment-aware tone adjustment (formal/friendly/enthusiastic)",
      "A/B testing variants (control, variant_a, variant_b)",
      "Engagement tracking (open, click, reply)",
      "Database table: followup_email_draft_results",
      "14 tRPC procedures for generation and tracking",
    ],
    location: "server/services/AutomatedFollowupEmailService.ts",
    tests: "60+ tests",
  },
  {
    id: "transcript-editing",
    name: "Transcript Editing & Correction",
    description: "Operator interface for correcting transcription errors with full version history and audit trail",
    status: "completed",
    progress: 100,
    category: "Operator Tools",
    completedDate: "Mar 2026",
    features: [
      "3 database tables: transcript_edits, transcript_versions, transcript_edit_audit_log",
      "TranscriptEditorService with 13 methods (create, approve, version, revert, export, audit, suggestions)",
      "TranscriptEditor React component (500+ lines) with diff view and version timeline",
      "14 tRPC procedures for full CRUD and workflow management",
      "Version history with snapshots and rollback capability",
      "Compliance audit trail with user tracking",
      "AI-powered correction suggestions using LLM",
      "Export to TXT, MD, and JSON formats",
      "Real-time collaboration with Ably WebSocket integration",
      "Redaction workflow for sensitive content masking",
      "Compliance dashboard with analytics and reporting",
    ],
    location: "server/services/TranscriptEditorService.ts",
    tests: "70+ tests",
    route: "/operator/transcript-editor",
    dependencies: ["AI Transcription Service"],
  },

  // MARKET EXPANSION FEATURES (NEW VERTICALS)
  {
    id: "training-engagement",
    name: "Corporate Training Engagement Tracker",
    description: "Eye-gaze tracking and facial expression analysis to detect employee engagement during training events",
    status: "planned",
    progress: 0,
    category: "Training & Learning",
    estimatedHours: 12,
    features: [
      "Eye-gaze tracking via webcam for attention lapses",
      "Facial expression analysis (comprehension/confusion detection)",
      "Automatic pause/review prompts when engagement drops",
      "Instructor dashboard with live engagement heatmap",
      "Post-session engagement report with recommendations",
      "Integration with LMS systems (Moodle, Canvas, Blackboard)",
      "Pricing: +$500/event (premium feature)",
      "Target: Fortune 500 HR/L&D departments",
    ],
    route: "/training/engagement",
  },
  {
    id: "lead-scoring",
    name: "Intelligent Lead Scoring & Qualification",
    description: "Real-time lead scoring for product launches based on engagement, company fit, and buying intent signals",
    status: "planned",
    progress: 0,
    category: "Product Launches & Marketing",
    estimatedHours: 10,
    features: [
      "Real-time lead scoring based on engagement metrics",
      "Company/role fit analysis from LinkedIn profiles",
      "Buying intent signal detection from chat/Q&A",
      "Automatic CRM integration with lead scoring",
      "Sales team pre-qualified leads ranked by conversion probability",
      "Auto-generated follow-up email templates",
      "Pricing: +$2,000/event (product launches)",
      "Target: VP Marketing at Fortune 1000 tech/CPG companies",
    ],
    route: "/marketing/lead-scoring",
  },
  {
    id: "content-repurposing",
    name: "Automated Content Repurposing",
    description: "Auto-extract key moments and generate short-form videos, blog posts, and social media content from events",
    status: "planned",
    progress: 0,
    category: "Content Generation",
    estimatedHours: 14,
    features: [
      "Auto-extract key moments from event recording",
      "Generate short-form videos (TikTok, Instagram Reels format)",
      "Create blog posts from transcripts",
      "Generate LinkedIn posts from Q&A highlights",
      "Produce podcast episodes from keynotes",
      "Create social media carousel posts with key stats",
      "Pricing: +$3,000/event or $500/month subscription",
      "Target: Marketing teams, content agencies, creators",
    ],
    route: "/content/repurposing",
  },
  {
    id: "hipaa-privacy",
    name: "HIPAA-Compliant Privacy Shield",
    description: "End-to-end encryption and de-identification for healthcare events with automatic redaction of sensitive medical information",
    status: "planned",
    progress: 0,
    category: "Healthcare & Compliance",
    estimatedHours: 16,
    features: [
      "End-to-end encryption for all video/audio",
      "De-identification of patient case discussions",
      "Automatic redaction of sensitive medical information",
      "Audit trail for compliance",
      "HIPAA compliance certification",
      "Data residency options (EU, US, etc.)",
      "Pricing: +$2,000/event (healthcare premium)",
      "Target: Medical associations, hospital networks, pharma",
    ],
    route: "/healthcare/privacy",
  },
  {
    id: "cme-automation",
    name: "CME Credit Automation",
    description: "Automatic CME credit calculation and digital certificate generation for medical conferences and continuing education",
    status: "planned",
    progress: 0,
    category: "Healthcare & Compliance",
    estimatedHours: 10,
    features: [
      "Automatic CME credit calculation based on attendance",
      "Verification of speaker credentials/licenses",
      "Digital certificate generation with QR code",
      "Integration with CME tracking systems (ACCME, etc.)",
      "Attendance verification with facial recognition",
      "Continuing education transcript generation",
      "Pricing: +$1,500/event (healthcare)",
      "Target: Medical associations, CME providers",
    ],
    route: "/healthcare/cme",
  },
  {
    id: "insider-trading-detection",
    name: "Insider Trading Detection",
    description: "Real-time monitoring of chat/Q&A for material non-public information (MNPI) with automatic flagging and compliance reporting",
    status: "planned",
    progress: 0,
    category: "Financial Services & Compliance",
    estimatedHours: 14,
    features: [
      "Real-time monitoring of chat/Q&A for MNPI",
      "Automatic flagging of suspicious questions/statements",
      "Attendee compliance verification (accredited investors)",
      "Automatic redaction of MNPI from recordings",
      "Compliance report for SEC/FINRA audits",
      "Integration with compliance systems",
      "Pricing: +$3,000/event (financial services)",
      "Target: Investment banks, hedge funds, compliance teams",
    ],
    route: "/financial/insider-trading",
  },
  {
    id: "engagement-optimizer",
    name: "Real-Time Engagement Optimizer",
    description: "For creators: real-time engagement scoring with predictive alerts and AI suggestions for re-engagement during live streams",
    status: "planned",
    progress: 0,
    category: "Entertainment & Creator Economy",
    estimatedHours: 8,
    features: [
      "Real-time engagement scoring (0-100 scale)",
      "Predictive alerts when engagement is dropping",
      "AI suggestions for re-engagement (ask question, giveaway, etc.)",
      "Optimal timing for ads/sponsorships",
      "Sentiment analysis of chat",
      "Viewer retention heatmap",
      "Pricing: +$500/stream or $50/month per creator",
      "Target: Top 10,000 creators on Twitch/YouTube",
    ],
    route: "/creator/engagement",
  },
  {
    id: "viral-detector",
    name: "Viral Moment Detector",
    description: "For creators: real-time detection of viral moments with automatic clip generation and social media optimization recommendations",
    status: "planned",
    progress: 0,
    category: "Entertainment & Creator Economy",
    estimatedHours: 12,
    features: [
      "Real-time detection of viral moments (high engagement spikes)",
      "Automatic clip generation (30s, 60s, 15s formats)",
      "Optimal social media posting timing",
      "Hashtag recommendations",
      "Cross-platform distribution suggestions",
      "Viral potential scoring (1-100)",
      "Pricing: +$300/stream or $30/month per creator",
      "Target: Content creators, streaming platforms",
    ],
    route: "/creator/viral",
  },

  // PLANNED FEATURES
  {
    id: "closed-captions",
    name: "Live Closed Captions Overlay",
    description: "Real-time captions overlay on Event Room video player with toggle button",
    status: "planned",
    progress: 0,
    category: "Accessibility",
    estimatedHours: 4,
    features: [
      "Real-time caption display",
      "Toggle CC button in video player",
      "Speaker identification in captions",
      "Font size and position customization",
      "Caption export (SRT, VTT formats)",
    ],
    dependencies: ["AI Transcription Service"],
  },
  {
    id: "sentiment-visualization",
    name: "Sentiment Visualization Dashboard",
    description: "Charts showing emotion timeline, speaker sentiment distribution, and engagement heatmaps",
    status: "planned",
    progress: 0,
    category: "Analytics",
    estimatedHours: 6,
    features: [
      "Time-series sentiment chart",
      "Speaker sentiment distribution",
      "Engagement heatmap by time",
      "Emotion breakdown pie chart",
      "Sentiment correlation with Q&A activity",
    ],
    dependencies: ["Sentiment Analysis Engine", "Content Performance Analytics"],
  },
];

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  "in-progress": {
    icon: Clock,
    label: "In Progress",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  planned: {
    icon: Zap,
    label: "Planned",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
};

export default function AIFeaturesStatus() {
  const [filter, setFilter] = React.useState<"all" | FeatureStatus>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const categories = Array.from(new Set(AI_FEATURES.map((f) => f.category)));

  const filteredFeatures = AI_FEATURES.filter((feature) => {
    const matchesStatus = filter === "all" || feature.status === filter;
    const matchesCategory = categoryFilter === "all" || feature.category === categoryFilter;
    const matchesSearch =
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const stats = {
    completed: AI_FEATURES.filter((f) => f.status === "completed").length,
    inProgress: AI_FEATURES.filter((f) => f.status === "in-progress").length,
    planned: AI_FEATURES.filter((f) => f.status === "planned").length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Features Status</h1>
          <p className="text-muted-foreground">
            Track the development progress of all AI-powered features across Chorus.AI
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-green-500/20 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planned</p>
                <p className="text-3xl font-bold text-amber-500">{stats.planned}</p>
              </div>
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All Features
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
            >
              Completed ({stats.completed})
            </Button>
            <Button
              variant={filter === "in-progress" ? "default" : "outline"}
              onClick={() => setFilter("in-progress")}
            >
              In Progress ({stats.inProgress})
            </Button>
            <Button
              variant={filter === "planned" ? "default" : "outline"}
              onClick={() => setFilter("planned")}
            >
              Planned ({stats.planned})
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => {
            const config = STATUS_CONFIG[feature.status];
            const Icon = config.icon;

            return (
              <Card
                key={feature.id}
                className={`p-6 border-2 ${config.borderColor} ${config.bgColor} hover:border-opacity-100 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <span className={`text-xs font-semibold uppercase ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  {feature.completedDate && (
                    <span className="text-xs text-muted-foreground">{feature.completedDate}</span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2">{feature.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold">Progress</span>
                    <span className="text-xs font-bold">{feature.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        feature.status === "completed"
                          ? "bg-green-500"
                          : feature.status === "in-progress"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${feature.progress}%` }}
                    />
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2">Key Features:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {feature.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                    {feature.features.length > 3 && (
                      <li className="text-primary font-semibold">
                        +{feature.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Metadata */}
                <div className="space-y-2 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  {feature.tests && <p>Tests: {feature.tests}</p>}
                  {feature.location && (
                    <p className="truncate">
                      Location: <code className="text-primary">{feature.location}</code>
                    </p>
                  )}
                  {feature.route && (
                    <p className="truncate">
                      Route: <code className="text-primary">{feature.route}</code>
                    </p>
                  )}
                  {feature.estimatedHours && (
                    <p>Estimated: {feature.estimatedHours}h</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No features match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
