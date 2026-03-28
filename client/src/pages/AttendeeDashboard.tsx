/**
 * Attendee Dashboard
 * Real-time event experience for registered attendees
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, Clock, Users, ThumbsUp, Send } from "lucide-react";

interface Question {
  id: string;
  text: string;
  askedBy: string;
  timestamp: string;
  upvotes: number;
  status: "submitted" | "approved" | "answered" | "rejected";
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  sentiment: number;
}

export default function AttendeeDashboard() {
  const eventId = new URLSearchParams(window.location.search).get("eventId") || "default-event";
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      text: "What is your guidance for Q1 2026?",
      askedBy: "Jane Smith",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      upvotes: 12,
      status: "answered",
    },
    {
      id: "q2",
      text: "How are margins trending in the core business?",
      askedBy: "John Doe",
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      upvotes: 8,
      status: "approved",
    },
    {
      id: "q3",
      text: "Tell us about the new product launch timeline",
      askedBy: "You",
      timestamp: new Date().toISOString(),
      upvotes: 0,
      status: "submitted",
    },
  ]);

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([
    {
      id: "t1",
      speaker: "CEO",
      text: "Good morning everyone. Thank you for joining us today.",
      timestamp: "00:00",
      sentiment: 0.8,
    },
    {
      id: "t2",
      speaker: "CEO",
      text: "We're pleased to report record quarterly revenue of $2.4 billion.",
      timestamp: "00:15",
      sentiment: 0.9,
    },
    {
      id: "t3",
      speaker: "CFO",
      text: "Operating margins expanded by 150 basis points year-over-year.",
      timestamp: "01:30",
      sentiment: 0.85,
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");
  const [sentiment, setSentiment] = useState(0.75);
  const [attendeeCount, setAttendeeCount] = useState(1247);

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate sentiment changes
      setSentiment((prev) => Math.max(0, Math.min(1, prev + (Math.random() - 0.5) * 0.05)));

      // Simulate attendee count changes
      setAttendeeCount((prev) => prev + Math.floor(Math.random() * 5 - 2));

      // Simulate new transcript segments
      if (Math.random() > 0.7) {
        const speakers = ["CEO", "CFO", "COO"];
        const newSegment: TranscriptSegment = {
          id: `t${Date.now()}`,
          speaker: speakers[Math.floor(Math.random() * speakers.length)],
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          timestamp: new Date().toLocaleTimeString(),
          sentiment: Math.random() * 0.4 + 0.6,
        };
        setTranscript((prev) => [...prev, newSegment]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;

    const question: Question = {
      id: `q${Date.now()}`,
      text: newQuestion,
      askedBy: "You",
      timestamp: new Date().toISOString(),
      upvotes: 0,
      status: "submitted",
    };

    setQuestions((prev) => [question, ...prev]);
    setNewQuestion("");
  };

  const handleUpvote = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.7) return "text-green-600";
    if (score > 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Q4 2025 Earnings Call</h1>
              <p className="text-sm text-muted-foreground">Live Q&A & Real-Time Intelligence</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">LIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{attendeeCount.toLocaleString()} watching</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${getSentimentColor(sentiment)}`} />
                <span>Sentiment: {(sentiment * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transcript">Live Transcript</TabsTrigger>
                <TabsTrigger value="qa">Q&A ({questions.length})</TabsTrigger>
              </TabsList>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="space-y-4">
                <Card className="p-6 max-h-[600px] overflow-y-auto">
                  <div className="space-y-4">
                    {transcript.map((segment) => (
                      <div key={segment.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold">{segment.speaker[0]}</span>
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{segment.speaker}</span>
                            <span className="text-xs text-muted-foreground">{segment.timestamp}</span>
                          </div>
                          <p className="text-sm text-foreground">{segment.text}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getSentimentColor(segment.sentiment).replace("text-", "bg-")}`}
                                style={{ width: `${segment.sentiment * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(segment.sentiment * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qa" className="space-y-4">
                {/* Ask Question Form */}
                <Card className="p-6">
                  <label className="block text-sm font-medium mb-3">Ask a Question</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                      placeholder="Type your question here..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={handleAskQuestion} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Questions List */}
                <Card className="p-6 max-h-[600px] overflow-y-auto">
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="pb-4 border-b border-border last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{question.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Asked by {question.askedBy} • {new Date(question.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(question.status)}`}>
                            {question.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpvote(question.id)}
                            className="text-xs"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {question.upvotes}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Event Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-medium">March 28, 2026 • 2:00 PM ET</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">1 hour 15 minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Speakers</p>
                  <p className="font-medium">CEO, CFO, COO</p>
                </div>
              </div>
            </Card>

            {/* Sentiment Gauge */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Audience Sentiment</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {(sentiment * 100).toFixed(0)}%
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                    style={{ width: `${sentiment * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sentiment > 0.7 ? "Very Positive" : sentiment > 0.5 ? "Neutral" : "Negative"}
                </p>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions Asked</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions Answered</span>
                  <span className="font-medium">
                    {questions.filter((q) => q.status === "answered").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">2m 15s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="font-medium">82%</span>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  📄 Investor Presentation
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  📊 Financial Statements
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  🎥 Event Recording
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
