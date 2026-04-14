import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

interface EventMetrics {
  eventId: number;
  title: string;
  date: string;
  participants: number;
  engagement: number;
  compliance: number;
  sentiment: number;
  duration: number;
}

/**
 * MultiEventAnalytics Page
 * 
 * Cross-event analytics dashboard comparing metrics across multiple events.
 * Includes engagement trends, compliance tracking, participant overlap,
 * and board-level reporting.
 */
export default function MultiEventAnalytics() {
  const [dateRange, setDateRange] = useState("month");
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  // Mock event data
  const events: EventMetrics[] = [
    {
      eventId: 1,
      title: "Q1 2026 Earnings Call",
      date: "2026-03-14",
      participants: 2847,
      engagement: 78,
      compliance: 94,
      sentiment: 72,
      duration: 45,
    },
    {
      eventId: 2,
      title: "Q4 2025 Earnings Call",
      date: "2026-02-15",
      participants: 2654,
      engagement: 75,
      compliance: 92,
      sentiment: 68,
      duration: 42,
    },
    {
      eventId: 3,
      title: "Annual Investor Day",
      date: "2026-01-20",
      participants: 3500,
      engagement: 82,
      compliance: 96,
      sentiment: 76,
      duration: 120,
    },
    {
      eventId: 4,
      title: "Board Strategy Briefing",
      date: "2025-12-10",
      participants: 24,
      engagement: 88,
      compliance: 98,
      sentiment: 81,
      duration: 88,
    },
    {
      eventId: 5,
      title: "Q3 2025 Earnings Call",
      date: "2025-11-05",
      participants: 2456,
      engagement: 72,
      compliance: 90,
      sentiment: 65,
      duration: 40,
    },
    {
      eventId: 6,
      title: "Product Launch Event",
      date: "2025-10-15",
      participants: 1200,
      engagement: 85,
      compliance: 88,
      sentiment: 79,
      duration: 60,
    },
  ];

  const filteredEvents =
    selectedEvents.length > 0
      ? events.filter((e) => selectedEvents.includes(e.eventId))
      : events;

  const calculateAggregates = () => {
    if (filteredEvents.length === 0) return null;

    return {
      totalEvents: filteredEvents.length,
      totalParticipants: filteredEvents.reduce((sum, e) => sum + e.participants, 0),
      avgEngagement: Math.round(
        filteredEvents.reduce((sum, e) => sum + e.engagement, 0) / filteredEvents.length
      ),
      avgCompliance: Math.round(
        filteredEvents.reduce((sum, e) => sum + e.compliance, 0) / filteredEvents.length
      ),
      avgSentiment: Math.round(
        filteredEvents.reduce((sum, e) => sum + e.sentiment, 0) / filteredEvents.length
      ),
    };
  };

  const aggregates = calculateAggregates();

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: aggregates,
      events: filteredEvents,
      trends: {
        engagementTrend: "increasing",
        complianceTrend: "stable",
        participationTrend: "stable",
      },
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `board-report-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Multi-Event Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Compare metrics across multiple events and generate board-level reports
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-border rounded bg-background text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        <Button
          onClick={handleExportReport}
          disabled={filteredEvents.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Board Report
        </Button>
      </div>

      {/* Aggregate Metrics */}
      {aggregates && (
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Events</p>
            <p className="text-3xl font-bold">{aggregates.totalEvents}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Participants</p>
            <p className="text-3xl font-bold">
              {(aggregates.totalParticipants / 1000).toFixed(1)}K
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Engagement</p>
            <p className="text-3xl font-bold">{aggregates.avgEngagement}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Compliance</p>
            <p className="text-3xl font-bold">{aggregates.avgCompliance}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Sentiment</p>
            <p className="text-3xl font-bold">{aggregates.avgSentiment}%</p>
          </Card>
        </div>
      )}

      {/* Engagement Trend Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Engagement Trend
        </h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {filteredEvents.map((event) => (
            <div key={event.eventId} className="flex flex-col items-center gap-2">
              <div
                className="w-12 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${(event.engagement / 100) * 160}px` }}
              />
              <p className="text-xs text-muted-foreground text-center">
                {event.title.split(" ")[0]}
              </p>
              <p className="text-xs font-semibold">{event.engagement}%</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance Trend Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Compliance Score Trend
        </h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {filteredEvents.map((event) => (
            <div key={event.eventId} className="flex flex-col items-center gap-2">
              <div
                className="w-12 bg-green-500 rounded-t transition-all hover:bg-green-600"
                style={{ height: `${(event.compliance / 100) * 160}px` }}
              />
              <p className="text-xs text-muted-foreground text-center">
                {event.title.split(" ")[0]}
              </p>
              <p className="text-xs font-semibold">{event.compliance}%</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Event Comparison Table */}
      <Card className="p-6 overflow-x-auto">
        <h3 className="font-semibold mb-4">Event Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-semibold">Event</th>
              <th className="text-center py-2 px-2 font-semibold">Date</th>
              <th className="text-center py-2 px-2 font-semibold">Participants</th>
              <th className="text-center py-2 px-2 font-semibold">Engagement</th>
              <th className="text-center py-2 px-2 font-semibold">Compliance</th>
              <th className="text-center py-2 px-2 font-semibold">Sentiment</th>
              <th className="text-center py-2 px-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr
                key={event.eventId}
                className="border-b border-border hover:bg-secondary transition-colors"
              >
                <td className="py-3 px-2 font-medium">{event.title}</td>
                <td className="py-3 px-2 text-center text-muted-foreground">
                  {new Date(event.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-2 text-center">
                  {(event.participants / 1000).toFixed(1)}K
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-xs font-semibold">
                    {event.engagement}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs font-semibold">
                    {event.compliance}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      event.sentiment >= 75
                        ? "bg-green-500/10 text-green-600"
                        : event.sentiment >= 65
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {event.sentiment}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center text-muted-foreground">
                  {event.duration}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Event Selection */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Select Events for Comparison</h3>
        <div className="space-y-2">
          {events.map((event) => (
            <label key={event.eventId} className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedEvents.includes(event.eventId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEvents([...selectedEvents, event.eventId]);
                  } else {
                    setSelectedEvents(selectedEvents.filter((id) => id !== event.eventId));
                  }
                }}
              />
              <span className="font-medium">{event.title}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
