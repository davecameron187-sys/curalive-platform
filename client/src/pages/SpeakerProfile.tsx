import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Mail, Calendar, TrendingUp, Users } from "lucide-react";

/**
 * Speaker Profile Pages
 * Display speaker bios, engagement metrics, and past event history
 */
export default function SpeakerProfile({ speakerId }: { speakerId?: string }) {
  // Mock speaker data
  const mockSpeaker = {
    id: "speaker-1",
    name: "Sarah Chen",
    title: "Chief Financial Officer",
    company: "TechCorp Inc.",
    bio: "Sarah Chen is the CFO of TechCorp Inc., leading financial strategy and investor relations. With 15+ years in finance, she has presented at 50+ investor events.",
    email: "sarah.chen@techcorp.com",
    image: "https://via.placeholder.com/200",
    totalEvents: 47,
    averageSentiment: 0.78,
    engagementRate: 0.82,
  };

  const sentimentTrend = [
    { date: "Jan", sentiment: 0.65, engagement: 0.70 },
    { date: "Feb", sentiment: 0.72, engagement: 0.75 },
    { date: "Mar", sentiment: 0.68, engagement: 0.72 },
    { date: "Apr", sentiment: 0.75, engagement: 0.78 },
    { date: "May", sentiment: 0.80, engagement: 0.82 },
    { date: "Jun", sentiment: 0.78, engagement: 0.80 },
  ];

  const eventHistory = [
    {
      id: "e1",
      title: "Q2 2026 Earnings Call",
      date: "2026-05-15",
      sentiment: 0.82,
      questions: 34,
      attendees: 1200,
    },
    {
      id: "e2",
      title: "Annual Investor Day",
      date: "2026-04-20",
      sentiment: 0.75,
      questions: 52,
      attendees: 3500,
    },
    {
      id: "e3",
      title: "Q1 2026 Earnings Call",
      date: "2026-02-10",
      sentiment: 0.72,
      questions: 28,
      attendees: 950,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-8">
          <div className="flex gap-6 items-start">
            <img
              src={mockSpeaker.image}
              alt={mockSpeaker.name}
              className="w-24 h-24 rounded-lg object-cover"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {mockSpeaker.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {mockSpeaker.title} at {mockSpeaker.company}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                {mockSpeaker.bio}
              </p>

              <div className="flex gap-3 mt-4">
                <Button variant="default" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Speaker
                </Button>
                <Button variant="outline" size="sm">
                  View All Events
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {mockSpeaker.totalEvents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Events
                </p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(mockSpeaker.averageSentiment * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg Sentiment
                </p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(mockSpeaker.engagementRate * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Engagement
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Sentiment Trend */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Sentiment Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Sentiment Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Engagement Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Event History */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Recent Events
              </h2>
              <div className="space-y-4">
                {eventHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {event.title}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees.toLocaleString()} attendees
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {(event.sentiment * 100).toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.questions} questions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground font-medium">
                    {mockSpeaker.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm text-foreground font-medium">
                    {mockSpeaker.company}
                  </p>
                </div>
              </div>
            </Card>

            {/* Performance Summary */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">
                Performance Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Sentiment</span>
                    <span className="font-medium text-foreground">
                      {(mockSpeaker.averageSentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${mockSpeaker.averageSentiment * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-medium text-foreground">
                      {(mockSpeaker.engagementRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${mockSpeaker.engagementRate * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
