/**
 * Cross-Event Analytics
 * Compare sentiment trends, speaker performance, and ROI metrics across multiple events
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, TrendingUp, Users, Target } from "lucide-react";

interface EventMetrics {
  eventId: string;
  eventName: string;
  date: string;
  attendees: number;
  avgSentiment: number;
  approvalRate: number;
  engagementScore: number;
  complianceViolations: number;
  cost: number;
  roi: number;
}

interface SentimentTrend {
  eventName: string;
  timestamp: string;
  sentiment: number;
}

interface SpeakerPerformance {
  speaker: string;
  avgSentiment: number;
  questionsHandled: number;
  engagementScore: number;
  eventCount: number;
}

export default function CrossEventAnalytics() {
  // State
  const [events, setEvents] = useState<EventMetrics[]>([]);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [speakerPerformance, setSpeakerPerformance] = useState<SpeakerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("sentiment");

  // tRPC queries (mock for now - backend endpoint not yet available)
  // const { data: analyticsData } = trpc.analytics.getEventAnalytics.useQuery(
  //   { timeRange },
  //   { enabled: true }
  // );
  const analyticsData = null;

  // Initialize
  useEffect(() => {
    // Mock data for demo
    const mockEvents: EventMetrics[] = [
      {
        eventId: "evt-001",
        eventName: "Q4 2025 Earnings Call",
        date: "2026-01-15",
        attendees: 1200,
        avgSentiment: 0.72,
        approvalRate: 0.85,
        engagementScore: 78,
        complianceViolations: 2,
        cost: 5000,
        roi: 2.4,
      },
      {
        eventId: "evt-002",
        eventName: "Annual Investor Day",
        date: "2026-01-22",
        attendees: 3500,
        avgSentiment: 0.68,
        approvalRate: 0.82,
        engagementScore: 72,
        complianceViolations: 5,
        cost: 15000,
        roi: 1.8,
      },
      {
        eventId: "evt-003",
        eventName: "Board Strategy Briefing",
        date: "2026-02-01",
        attendees: 24,
        avgSentiment: 0.81,
        approvalRate: 0.91,
        engagementScore: 85,
        complianceViolations: 0,
        cost: 2000,
        roi: 3.2,
      },
    ];

    setEvents(mockEvents);

    // Mock sentiment trends
    setSentimentTrends([
      { eventName: "Q4 2025 Earnings", timestamp: "2026-01-15", sentiment: 0.72 },
      { eventName: "Annual Investor Day", timestamp: "2026-01-22", sentiment: 0.68 },
      { eventName: "Board Strategy", timestamp: "2026-02-01", sentiment: 0.81 },
    ]);

    // Mock speaker performance
    setSpeakerPerformance([
      {
        speaker: "CEO",
        avgSentiment: 0.78,
        questionsHandled: 45,
        engagementScore: 82,
        eventCount: 3,
      },
      {
        speaker: "CFO",
        avgSentiment: 0.72,
        questionsHandled: 38,
        engagementScore: 75,
        eventCount: 3,
      },
      {
        speaker: "COO",
        avgSentiment: 0.68,
        questionsHandled: 22,
        engagementScore: 68,
        eventCount: 2,
      },
    ]);

    setIsLoading(false);
  }, [analyticsData, timeRange]);

  const avgSentiment = (events.reduce((sum, e) => sum + e.avgSentiment, 0) / events.length).toFixed(2);
  const avgEngagement = (events.reduce((sum, e) => sum + e.engagementScore, 0) / events.length).toFixed(0);
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees, 0);
  const avgROI = (events.reduce((sum, e) => sum + e.roi, 0) / events.length).toFixed(2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cross-Event Analytics</h1>
            <p className="text-muted-foreground">Compare trends across multiple events</p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time range..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select metric..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sentiment">Sentiment Trends</SelectItem>
              <SelectItem value="engagement">Engagement Score</SelectItem>
              <SelectItem value="roi">ROI Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Avg Sentiment</p>
            <p className="text-2xl font-bold">{avgSentiment}</p>
            <p className="text-xs text-green-400 mt-2">↑ 0.05 from last period</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Avg Engagement</p>
            <p className="text-2xl font-bold">{avgEngagement}%</p>
            <p className="text-xs text-green-400 mt-2">↑ 3% from last period</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Attendees</p>
            <p className="text-2xl font-bold">{totalAttendees.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">Across {events.length} events</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Avg ROI</p>
            <p className="text-2xl font-bold">{avgROI}x</p>
            <p className="text-xs text-green-400 mt-2">↑ 0.3x from last period</p>
          </Card>
        </div>

        {/* Events Comparison Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Events Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Event Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Attendees</th>
                  <th className="text-left py-3 px-4 font-semibold">Sentiment</th>
                  <th className="text-left py-3 px-4 font-semibold">Engagement</th>
                  <th className="text-left py-3 px-4 font-semibold">Approval Rate</th>
                  <th className="text-left py-3 px-4 font-semibold">ROI</th>
                  <th className="text-left py-3 px-4 font-semibold">Violations</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.eventId} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 font-semibold">{event.eventName}</td>
                    <td className="py-3 px-4">{event.date}</td>
                    <td className="py-3 px-4">{event.attendees.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          event.avgSentiment > 0.7
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }
                      >
                        {(event.avgSentiment * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-500/20 text-blue-400">{event.engagementScore}%</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-purple-500/20 text-purple-400">
                        {(event.approvalRate * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold">{event.roi.toFixed(1)}x</td>
                    <td className="py-3 px-4">
                      {event.complianceViolations > 0 ? (
                        <Badge className="bg-red-500/20 text-red-400">{event.complianceViolations}</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">0</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Speaker Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Speaker Performance Across Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {speakerPerformance.map((speaker) => (
              <Card key={speaker.speaker} className="p-4 border border-border">
                <p className="font-semibold mb-3">{speaker.speaker}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Sentiment</span>
                    <span className="font-semibold">{(speaker.avgSentiment * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Questions Handled</span>
                    <span className="font-semibold">{speaker.questionsHandled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Engagement Score</span>
                    <span className="font-semibold">{speaker.engagementScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Events</span>
                    <span className="font-semibold">{speaker.eventCount}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Compliance Trends */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Compliance Trends
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.eventId} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold">{event.eventName}</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{event.complianceViolations}</p>
                    <p className="text-xs text-muted-foreground">violations</p>
                  </div>
                  <Badge
                    className={
                      event.complianceViolations === 0
                        ? "bg-green-500/20 text-green-400"
                        : event.complianceViolations < 3
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {event.complianceViolations === 0 ? "Clean" : "Issues"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
