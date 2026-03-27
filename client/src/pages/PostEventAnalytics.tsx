/**
 * Post-Event Analytics — Sentiment Trends & Engagement Metrics
 * 
 * Task 1.10: Build analytics dashboard
 * - Sentiment trend visualization
 * - Key moments identification
 * - Attendee engagement metrics
 * - Compliance summary
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  Clock,
  Loader2,
  FileText,
} from "lucide-react";

interface SentimentTrend {
  timestamp: string;
  score: number;
  label: string;
}

interface KeyMoment {
  timestamp: string;
  type: "high_sentiment" | "spike_engagement" | "compliance_flag" | "question_surge";
  description: string;
  severity: "low" | "medium" | "high";
}

interface EngagementMetric {
  metric: string;
  value: number;
  change: number;
}

interface EventAnalytics {
  eventId: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAttendees: number;
  totalQuestions: number;
  approvedQuestions: number;
  rejectedQuestions: number;
  averageSentiment: number;
  complianceFlags: number;
  engagementRate: number;
  speakerPerformance: {
    name: string;
    score: number;
    engagement: number;
  }[];
  sentimentTrends: SentimentTrend[];
  keyMoments: KeyMoment[];
  engagementMetrics: EngagementMetric[];
}

export default function PostEventAnalytics() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State management
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedMetric, setSelectedMetric] = useState<"sentiment" | "engagement" | "qa">("sentiment");

  // Mock analytics data for demonstration
  // In production, this would come from tRPC query

  useEffect(() => {
    // Mock analytics data
    const mockAnalytics: EventAnalytics = {
      eventId: "event_123",
      sessionId: sessionId || "",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 3600,
      totalAttendees: 250,
      totalQuestions: 45,
      approvedQuestions: 38,
      rejectedQuestions: 7,
      averageSentiment: 7.8,
      complianceFlags: 2,
      engagementRate: 0.82,
      speakerPerformance: [
        { name: "CEO", score: 8.5, engagement: 0.9 },
        { name: "CFO", score: 7.9, engagement: 0.85 },
      ],
      sentimentTrends: [
        { timestamp: "00:00", score: 7.0, label: "Start" },
        { timestamp: "15:00", score: 7.5, label: "15 min" },
        { timestamp: "30:00", score: 8.2, label: "30 min" },
      ],
      keyMoments: [
        {
          timestamp: "12:34",
          type: "high_sentiment",
          description: "Positive response to earnings announcement",
          severity: "high",
        },
      ],
      engagementMetrics: [
        { metric: "Questions Asked", value: 45, change: 12 },
        { metric: "Attendee Retention", value: 98, change: 5 },
      ],
    };
    setAnalytics(mockAnalytics);
    setIsLoading(false);
  }, [sessionId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 7) return "#22c55e";
    if (score >= 5) return "#eab308";
    return "#ef4444";
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF...");
    // Implementation for PDF export
  };

  const handleExportCSV = () => {
    console.log("Exporting to CSV...");
    // Implementation for CSV export
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const qaData = [
    { name: "Approved", value: analytics.approvedQuestions, fill: "#22c55e" },
    { name: "Rejected", value: analytics.rejectedQuestions, fill: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Event Analytics Report</h1>
              <p className="text-muted-foreground mt-1">
                Session {analytics.sessionId} • {analytics.startTime}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-2xl font-bold">{formatDuration(analytics.duration)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Attendees</p>
              <p className="text-2xl font-bold">{analytics.totalAttendees}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Q&A</p>
              <p className="text-2xl font-bold">{analytics.totalQuestions}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Avg Sentiment</p>
              <p className="text-2xl font-bold" style={{ color: getSentimentColor(analytics.averageSentiment) }}>
                {analytics.averageSentiment.toFixed(1)}/10
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Engagement</p>
              <p className="text-2xl font-bold">{(analytics.engagementRate * 100).toFixed(0)}%</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Sentiment Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sentiment Trend Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.sentimentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Sentiment Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Q&A Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Q&A Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Speaker Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Speaker Performance</h2>
            <div className="space-y-4">
              {analytics.speakerPerformance.map((speaker, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{speaker.name}</p>
                    <Badge variant="outline">{speaker.score.toFixed(1)}/10</Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(speaker.score / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Engagement: {(speaker.engagement * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Key Moments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Key Moments
          </h2>
          <div className="space-y-3">
            {analytics.keyMoments.map((moment, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  moment.severity === "high"
                    ? "border-red-500 bg-red-900/10"
                    : moment.severity === "medium"
                    ? "border-yellow-500 bg-yellow-900/10"
                    : "border-blue-500 bg-blue-900/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {moment.type.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-sm mt-1">{moment.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{moment.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Compliance Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Flags</p>
              <p className="text-3xl font-bold text-red-500">{analytics.complianceFlags}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
              <p className="text-3xl font-bold text-green-500">
                {analytics.totalQuestions > 0
                  ? ((analytics.approvedQuestions / analytics.totalQuestions) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold">2.3s</p>
            </div>
          </div>
        </Card>

        {/* Engagement Metrics */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Engagement Metrics
          </h2>
          <div className="space-y-3">
            {analytics.engagementMetrics.map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <p className="font-semibold">{metric.metric}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">{metric.value}</p>
                  <Badge
                    variant={metric.change >= 0 ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {metric.change >= 0 ? "↑" : "↓"} {Math.abs(metric.change)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Export Options */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Full Report
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download comprehensive analytics report with all metrics and visualizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                PDF Report
              </Button>
              <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                CSV Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
