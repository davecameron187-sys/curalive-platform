import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  MessageSquare,
  TrendingDown,
  Volume2,
  Zap,
  Settings,
  Share2,
  Bell,
  BarChart3,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface MobileQuestion {
  id: string;
  participant: string;
  question: string;
  timestamp: number;
  votes: number;
  status: "pending" | "approved" | "rejected";
}

/**
 * MobileOperatorConsole Page
 * 
 * Mobile-optimized operator console for iOS/Android apps.
 * Includes Q&A moderation, sentiment tracking, and poll management.
 */
export default function MobileOperatorConsole() {
  const [activeTab, setActiveTab] = useState<"qa" | "sentiment" | "polls">("qa");
  const [questions, setQuestions] = useState<MobileQuestion[]>([
    {
      id: "1",
      participant: "Sarah Johnson",
      question: "What is your guidance for next quarter?",
      timestamp: Date.now() - 120000,
      votes: 24,
      status: "pending",
    },
    {
      id: "2",
      participant: "Michael Chen",
      question: "How are you addressing supply chain issues?",
      timestamp: Date.now() - 300000,
      votes: 18,
      status: "pending",
    },
    {
      id: "3",
      participant: "Emily Rodriguez",
      question: "What is your R&D budget allocation?",
      timestamp: Date.now() - 600000,
      votes: 12,
      status: "approved",
    },
  ]);

  const [sentimentScore, setSentimentScore] = useState(72);
  const [participantCount, setParticipantCount] = useState(2847);
  const [engagementRate, setEngagementRate] = useState(78);

  const handleApproveQuestion = (id: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, status: "approved" } : q
      )
    );
    toast.success("Question approved");
  };

  const handleRejectQuestion = (id: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, status: "rejected" } : q
      )
    );
    toast.success("Question rejected");
  };

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const approvedQuestions = questions.filter((q) => q.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Operator Console</h1>
            <p className="text-xs text-muted-foreground">Live Event</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-secondary rounded-lg">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Participants</p>
            <p className="text-2xl font-bold">{participantCount.toLocaleString()}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Engagement</p>
            <p className="text-2xl font-bold text-blue-600">{engagementRate}%</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
            <p className="text-2xl font-bold text-green-600">{sentimentScore}%</p>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 flex gap-2 border-b border-border overflow-x-auto">
        {[
          { id: "qa", label: "Q&A", icon: MessageSquare },
          { id: "sentiment", label: "Sentiment", icon: TrendingDown },
          { id: "polls", label: "Polls", icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 whitespace-nowrap ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-3">
        {/* Q&A Tab */}
        {activeTab === "qa" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Pending ({pendingQuestions.length})
              </h2>
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-600 rounded-full font-bold">
                {pendingQuestions.length}
              </span>
            </div>

            {pendingQuestions.length === 0 ? (
              <Card className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending questions
                </p>
              </Card>
            ) : (
              pendingQuestions.map((question) => (
                <Card key={question.id} className="p-3 space-y-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {question.participant}
                    </p>
                    <p className="text-sm text-foreground mt-1">
                      {question.question}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>👍 {question.votes} votes</span>
                    <span>
                      {Math.round(
                        (Date.now() - question.timestamp) / 60000
                      )}
                      m ago
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveQuestion(question.id)}
                      className="flex-1 text-xs h-8"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectQuestion(question.id)}
                      className="flex-1 text-xs h-8"
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}

            {approvedQuestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">
                  Approved ({approvedQuestions.length})
                </h3>
                {approvedQuestions.map((question) => (
                  <Card key={question.id} className="p-3 opacity-60">
                    <p className="font-semibold text-sm">
                      {question.participant}
                    </p>
                    <p className="text-sm text-foreground mt-1">
                      {question.question}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>✓ Approved</span>
                      <span>👍 {question.votes} votes</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === "sentiment" && (
          <div className="space-y-4">
            <Card className="p-6 text-center">
              <div className="mb-4">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {sentimentScore}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Sentiment</p>
              </div>

              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full"
                  style={{ width: `${sentimentScore}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <div>
                  <p className="text-red-600 font-semibold">24%</p>
                  <p className="text-muted-foreground">Negative</p>
                </div>
                <div>
                  <p className="text-yellow-600 font-semibold">4%</p>
                  <p className="text-muted-foreground">Neutral</p>
                </div>
                <div>
                  <p className="text-green-600 font-semibold">72%</p>
                  <p className="text-muted-foreground">Positive</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Top Keywords</h3>
              <div className="space-y-2">
                {[
                  { keyword: "growth", sentiment: "positive", count: 124 },
                  { keyword: "guidance", sentiment: "positive", count: 98 },
                  { keyword: "supply chain", sentiment: "negative", count: 67 },
                  { keyword: "investment", sentiment: "positive", count: 54 },
                ].map((item) => (
                  <div
                    key={item.keyword}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{item.keyword}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.sentiment === "positive"
                          ? "bg-green-500/20 text-green-600"
                          : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Polls Tab */}
        {activeTab === "polls" && (
          <div className="space-y-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Active Poll</h3>
              <p className="text-sm mb-3">
                How satisfied are you with the company's guidance?
              </p>

              <div className="space-y-2">
                {[
                  { option: "Very Satisfied", votes: 1240, percent: 68 },
                  { option: "Satisfied", votes: 450, percent: 25 },
                  { option: "Neutral", votes: 120, percent: 7 },
                ].map((item) => (
                  <div key={item.option}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>{item.option}</span>
                      <span className="font-semibold">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.votes.toLocaleString()} votes
                    </p>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4">End Poll</Button>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Launch New Poll</h3>
              <Button className="w-full" variant="outline">
                + Create Poll
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 space-y-2">
        <div className="flex gap-2">
          <Button className="flex-1 flex items-center gap-2" size="sm">
            <Volume2 className="h-4 w-4" />
            Mute Audio
          </Button>
          <Button className="flex-1 flex items-center gap-2" variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
        <Button className="w-full" variant="destructive" size="sm">
          End Event
        </Button>
      </div>

      {/* Safe Area Padding */}
      <div className="h-32" />
    </div>
  );
}
