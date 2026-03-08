import { useState } from "react";
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
      "ContentGenerationTriggerService with LLM-powered prompts",
      "3 tRPC procedures: triggerEventCompletion, generateContentType, regenerateAllContent",
      "Context-aware content generation using event transcript + sentiment data",
      "Manual trigger UI component for operators",
      "Full integration with AI Dashboard approval workflow",
    ],
    location: "server/services/ContentGenerationTriggerService.ts",
    tests: "359+ tests",
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
      "4 database tables for comprehensive tracking",
      "8 aggregation methods: approval rate, open rate, click-through rate, response rate, engagement score, quality score",
      "7 tRPC procedures for analytics queries",
      "Analytics Dashboard UI at /analytics with performance cards",
      "Automated improvement recommendations",
      "Export capabilities (CSV/PDF ready)",
    ],
    location: "/analytics route",
    tests: "30+ tests",
  },
  {
    id: "registration",
    name: "Attendee Registration System",
    description: "Persistent attendee data with operator visibility in real-time",
    status: "completed",
    progress: 100,
    category: "Data Management",
    completedDate: "Mar 2026",
    features: [
      "Database storage: name, email, company, event, joined_at",
      "WebcastRegistrationForm component with validation",
      "3 tRPC procedures: registerAttendee, getEventAttendees, getAttendeeDetails",
      "Real attendee list visible in Operator Console",
      "Engagement tracking and metrics",
    ],
    location: "client/src/components/WebcastRegistrationForm.tsx",
    tests: "7 tests",
  },
  {
    id: "live-rolling-summary",
    name: "Live Rolling Summary",
    description: "Real-time 2-3 sentence summary updating every 60s during events",
    status: "completed",
    progress: 100,
    category: "Attendee Experience",
    completedDate: "Mar 2026",
    features: [
      "Real-time summary generation from live transcript",
      "60-second update interval with smooth transitions",
      "Display in Event Room for attendees",
      "Sentiment-aware summary generation",
      "Multi-language support",
      "Database table: live_rolling_summaries",
    ],
    location: "server/services/LiveRollingSummaryService.ts",
    tests: "45+ tests",
  },
  {
    id: "qa-auto-triage",
    name: "AI Q&A Auto-Triage",
    description: "Automatic classification of Q&A questions (approved/duplicate/off-topic/sensitive)",
    status: "completed",
    progress: 100,
    category: "Moderator Tools",
    completedDate: "Mar 2026",
    features: [
      "Server-side LLM classification with 6 categories",
      "Confidence scoring for each classification",
      "Price-sensitive and confidential content detection",
      "Moderator override capability",
      "Analytics on question patterns",
      "16 tRPC procedures for full CRUD",
      "70+ vitest tests",
    ],
    location: "server/services/QaAutoTriageService.ts",
    tests: "70+ tests",
    route: "/moderator/qa-console",
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
      "6 toxicity categories: abusive, harassing, price_sensitive, confidential, spam, legal_risk",
      "Risk level assessment: low, medium, high, critical",
      "Recommended actions: approve, review, flag, block, redact",
      "Moderator alert system with audit trail",
      "16 tRPC procedures for content management",
      "70+ vitest tests",
    ],
    location: "server/services/ToxicityFilterService.ts",
    tests: "70+ tests",
    route: "/moderator/toxicity-filter",
  },
  {
    id: "speaking-pace",
    name: "Speaking-Pace Coach",
    description: "Real-time WPM detector with colour-coded pace indicator for presenters",
    status: "completed",
    progress: 100,
    category: "Presenter Tools",
    completedDate: "Mar 2026",
    features: [
      "Words-per-minute calculation from live transcript",
      "Colour-coded indicator: green (120-150 optimal), yellow (fast), red (slow)",
      "Display in Presenter Teleprompter",
      "Pause detection (300-800ms ideal)",
      "Filler word tracking",
      "Historical pace analytics",
      "Personalized coaching tips",
      "24 tRPC procedures for analysis",
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
      "Real-time sentiment score in teleprompter",
      "Emotion breakdown (positive/negative/neutral)",
      "Trend indicator (improving/declining)",
      "Suggested talking points for sentiment recovery",
      "Historical sentiment comparison",
      "Integration with Sentiment Analysis Engine",
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
      "Automatic silence detection (>10s threshold)",
      "Audio anomaly detection (background noise, echo, distortion)",
      "Real-time operator alerts with sound",
      "Participant connection status tracking",
      "Automatic recovery suggestions",
      "Database table: silence_anomaly_detector_results",
      "16 tRPC procedures for alerts and management",
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
    category: "Content Generation",
    completedDate: "Mar 2026",
    features: [
      "Press release input modal with title and event ID",
      "LLM-powered brief generation with confidence scoring",
      "Talking points extraction with speaker notes",
      "Key messages highlighting with emphasis levels",
      "Anticipated Q&A with difficulty levels",
      "Financial highlights extraction",
      "Operator approval workflow with notes",
      "Brief history and analytics tab",
      "9 tRPC procedures for full CRUD",
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

  // IN PROGRESS FEATURES
  {
    id: "transcript-editing",
    name: "Transcript Editing & Correction",
    description: "Operator interface for correcting transcription errors with full version history and audit trail",
    status: "in-progress",
    progress: 60,
    category: "Operator Tools",
    estimatedHours: 8,
    features: [
      "Database tables: occ_transcript_edits, occ_transcript_audit_log",
      "TranscriptEditor React component (created)",
      "5 tRPC procedures defined",
      "Version history panel (in progress)",
      "Batch editing modal (in progress)",
      "Undo/redo functionality (planned)",
      "Search & replace feature (planned)",
    ],
    location: "client/src/components/TranscriptEditor.tsx",
    dependencies: ["AI Transcription Service"],
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
  const [selectedStatus, setSelectedStatus] = useState<FeatureStatus | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = Array.from(new Set(AI_FEATURES.map((f) => f.category)));

  const filteredFeatures = AI_FEATURES.filter((feature) => {
    const statusMatch = selectedStatus === "all" || feature.status === selectedStatus;
    const categoryMatch = selectedCategory === "all" || feature.category === selectedCategory;
    const searchMatch =
      searchTerm === "" ||
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  });

  const stats = {
    completed: AI_FEATURES.filter((f) => f.status === "completed").length,
    inProgress: AI_FEATURES.filter((f) => f.status === "in-progress").length,
    planned: AI_FEATURES.filter((f) => f.status === "planned").length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-3">AI Features Status</h1>
          <p className="text-lg text-muted-foreground">
            Track the development progress of all AI-powered features across Chorus.AI
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-green-500/20 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Planned</p>
                <p className="text-3xl font-bold text-amber-500">{stats.planned}</p>
              </div>
              <Zap className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
              size="sm"
            >
              All Features
            </Button>
            <Button
              variant={selectedStatus === "completed" ? "default" : "outline"}
              onClick={() => setSelectedStatus("completed")}
              size="sm"
              className="border-green-500/20 text-green-500 hover:bg-green-500/10"
            >
              Completed ({stats.completed})
            </Button>
            <Button
              variant={selectedStatus === "in-progress" ? "default" : "outline"}
              onClick={() => setSelectedStatus("in-progress")}
              size="sm"
              className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
            >
              In Progress ({stats.inProgress})
            </Button>
            <Button
              variant={selectedStatus === "planned" ? "default" : "outline"}
              onClick={() => setSelectedStatus("planned")}
              size="sm"
              className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
            >
              Planned ({stats.planned})
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
              >
                {cat}
              </Button>
            ))}
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
                className={`p-6 border ${config.borderColor} ${config.bgColor} hover:border-primary/50 transition-colors`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className={`text-xs font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{feature.name}</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{feature.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
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
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Key Features:</p>
                  <ul className="space-y-1">
                    {feature.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                    {feature.features.length > 3 && (
                      <li className="text-xs text-primary font-semibold">
                        +{feature.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Metadata */}
                <div className="space-y-2 border-t border-border pt-4">
                  {feature.completedDate && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2 font-semibold">{feature.completedDate}</span>
                    </div>
                  )}
                  {feature.tests && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Tests:</span>
                      <span className="ml-2 font-semibold text-green-600">{feature.tests}</span>
                    </div>
                  )}
                  {feature.route && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Route:</span>
                      <span className="ml-2 font-semibold text-blue-600">{feature.route}</span>
                    </div>
                  )}
                  {feature.location && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="ml-2 font-mono text-xs">{feature.location}</span>
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                {feature.dependencies && feature.dependencies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Dependencies:</p>
                    <div className="flex flex-wrap gap-1">
                      {feature.dependencies.map((dep) => (
                        <span key={dep} className="text-xs bg-secondary px-2 py-1 rounded">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
