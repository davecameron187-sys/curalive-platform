/**
 * Post-Event Analytics — Sentiment Trends & Engagement Metrics
 * 
 * Task 1.10: Build analytics dashboard with real tRPC data
 * - Sentiment trend visualization
 * - Key moments identification
 * - Attendee engagement metrics
 * - Compliance summary
 */

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

export default function PostEventAnalytics() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // Fetch analytics data from tRPC queries
  const { data: eventAnalytics, isLoading: analyticsLoading } = trpc.analytics.getEventAnalytics.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: sentimentTrend = [], isLoading: sentimentLoading } = trpc.analytics.getSentimentTrend.useQuery(
    { sessionId: sessionId || "", interval: "5m" },
    { enabled: !!sessionId }
  );

  const { data: keyMoments = [], isLoading: momentsLoading } = trpc.analytics.getKeyMoments.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: speakers = [], isLoading: speakersLoading } = trpc.analytics.getSpeakerPerformance.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: qaStats, isLoading: qaLoading } = trpc.analytics.getQaStatistics.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: compliance, isLoading: complianceLoading } = trpc.analytics.getComplianceSummary.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: engagement = [], isLoading: engagementLoading } = trpc.analytics.getEngagementMetrics.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const isLoading = analyticsLoading || sentimentLoading || momentsLoading || speakersLoading || qaLoading || complianceLoading || engagementLoading;

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

  if (isLoading || !eventAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const qaData = [
    { name: "Approved", value: eventAnalytics.approvedQuestions, fill: "#22c55e" },
    { name: "Rejected", value: eventAnalytics.rejectedQuestions, fill: "#ef4444" },
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
                Session {eventAnalytics.sessionId} • {eventAnalytics.startTime}
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
              <p className="text-2xl font-bold">{formatDuration(eventAnalytics.duration)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Attendees</p>
              <p className="text-2xl font-bold">{eventAnalytics.totalAttendees || 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Q&A</p>
              <p className="text-2xl font-bold">{eventAnalytics.totalQuestions}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Avg Sentiment</p>
              <p className="text-2xl font-bold" style={{ color: getSentimentColor(eventAnalytics.averageSentiment) }}>
                {eventAnalytics.averageSentiment.toFixed(1)}/10
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Engagement</p>
              <p className="text-2xl font-bold">{(eventAnalytics.engagementRate * 100).toFixed(0)}%</p>
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
          {sentimentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentTrend}>
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
          ) : (
            <p className="text-muted-foreground">No sentiment data available</p>
          )}
        </Card>

        {/* Q&A Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Q&A Distribution
            </h2>
            {qaData.some(d => d.value > 0) ? (
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
            ) : (
              <p className="text-muted-foreground">No Q&A data available</p>
            )}
          </Card>

          {/* Speaker Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Speaker Performance</h2>
            {speakers.length > 0 ? (
              <div className="space-y-4">
                {speakers.map((speaker: any, idx: number) => (
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
            ) : (
              <p className="text-muted-foreground">No speaker data available</p>
            )}
          </Card>
        </div>

        {/* Key Moments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Key Moments
          </h2>
          {keyMoments.length > 0 ? (
            <div className="space-y-3">
              {keyMoments.map((moment: any, idx: number) => (
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
                      <p className="font-semibold">{moment.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{moment.timestamp}</p>
                    </div>
                    <Badge
                      variant={
                        moment.severity === "high"
                          ? "destructive"
                          : moment.severity === "medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {moment.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No key moments identified</p>
          )}
        </Card>

        {/* Compliance Summary */}
        {compliance && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Compliance Summary
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Flags</p>
                <p className="text-2xl font-bold">{compliance.totalFlags}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                <p className="text-2xl font-bold" style={{ color: getSentimentColor(10 - compliance.riskScore) }}>
                  {compliance.riskScore.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-2xl font-bold">{compliance.resolvedFlags}/{compliance.totalFlags}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Engagement Metrics */}
        {engagement.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Engagement Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engagement.map((metric: any, idx: number) => (
                <div key={idx} className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">{metric.metric}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <Badge variant={metric.trend === "up" ? "default" : "secondary"}>
                      {metric.trend === "up" ? "+" : ""}{metric.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
