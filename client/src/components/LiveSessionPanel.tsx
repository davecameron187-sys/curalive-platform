import React, { useState } from "react";
import { X, AlertCircle, Users, Clock, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebPhoneCallManager } from "./WebPhoneCallManager";
import { ProviderStateIndicator } from "./ProviderStateIndicator";

interface LiveSessionPanelProps {
  session?: {
    id: string;
    eventName: string;
    status: "live" | "scheduled" | "ended";
    startedAt: Date;
    duration: number;
    attendeeCount: number;
    connectivityProvider: "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
    providerStatus: "active" | "degraded" | "fallback" | "failed";
    fallbackReason?: string;
  };
  onClose?: () => void;
}

export function LiveSessionPanel({ session, onClose }: LiveSessionPanelProps) {
  const [activeTab, setActiveTab] = useState<"webphone" | "qa" | "transcript" | "notes">("webphone");
  const [notes, setNotes] = useState("");
  const [qaPending, setQaPending] = useState(5);
  const [qaApproved, setQaApproved] = useState(12);

  const mockSession = session || {
    id: "live-q4-earnings-2026",
    eventName: "Q4 2025 Earnings Call",
    status: "live" as const,
    startedAt: new Date(Date.now() - 1847000),
    duration: 1847,
    attendeeCount: 1247,
    connectivityProvider: "webphone" as const,
    providerStatus: "active" as const,
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const mockQAQuestions = [
    { id: "q1", text: "What was the revenue growth in Q4?", asker: "Investor_123", upvotes: 45 },
    { id: "q2", text: "Can you break down the regional performance?", asker: "Analyst_456", upvotes: 32 },
    { id: "q3", text: "What's your guidance for Q1 2026?", asker: "Investor_789", upvotes: 28 },
    { id: "q4", text: "How did margins compare to last year?", asker: "Analyst_321", upvotes: 22 },
    { id: "q5", text: "What about the new product launch?", asker: "Investor_654", upvotes: 18 },
  ];

  const mockTranscript = [
    { speaker: "John Smith (CFO)", text: "Thank you for joining our Q4 earnings call...", time: "00:00:15" },
    { speaker: "Jane Doe (CEO)", text: "We're pleased to report strong results across all segments...", time: "00:01:32" },
    { speaker: "Investor Q&A", text: "First question comes from Michael Chen at Goldman Sachs...", time: "00:15:47" },
    { speaker: "John Smith (CFO)", text: "Great question. Let me break that down for you...", time: "00:16:20" },
  ];

  const handleApproveQuestion = (id: string) => {
    setQaPending(prev => Math.max(0, prev - 1));
    setQaApproved(prev => prev + 1);
  };

  const handleRejectQuestion = (id: string) => {
    setQaPending(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-background border border-border rounded-lg w-[95%] h-[95%] max-w-6xl flex flex-col">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold uppercase text-red-500 tracking-wider">LIVE</span>
            </div>
            <h2 className="text-xl font-bold">{mockSession.eventName}</h2>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(mockSession.duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{mockSession.attendeeCount.toLocaleString()} attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{qaPending} pending</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ProviderStateIndicator provider={mockSession.connectivityProvider} status={mockSession.providerStatus} fallbackReason={mockSession.fallbackReason} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-border">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b border-border justify-start px-4">
                <TabsTrigger value="webphone">WebPhone</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="webphone" className="flex-1 overflow-auto p-4">
                <WebPhoneCallManager sessionId={mockSession.id} />
              </TabsContent>

              <TabsContent value="qa" className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">{qaPending} Pending</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">{qaApproved} Approved</span>
                  </div>
                  <div className="space-y-2">
                    {mockQAQuestions.map((q) => (
                      <div key={q.id} className="border border-border rounded-lg p-3 bg-card/50">
                        <p className="text-sm font-medium mb-2">{q.text}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{q.asker} • {q.upvotes} upvotes</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-6 px-2 text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => handleApproveQuestion(q.id)}>
                              ✓ Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleRejectQuestion(q.id)}>
                              ✕ Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="flex-1 overflow-auto p-4">
                <div className="space-y-3">
                  {mockTranscript.map((entry, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-semibold text-primary">{entry.speaker}</p>
                      <p className="text-muted-foreground mt-1">{entry.text}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">{entry.time}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 overflow-auto p-4">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this session..." className="w-full h-48 p-3 bg-card border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
                <Button className="mt-3 w-full">Save Notes</Button>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-64 border-l border-border p-4 flex flex-col gap-6 overflow-auto bg-card/30">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Quick Actions</h3>
              <Button variant="outline" className="w-full justify-start" size="sm">
                🔇 Mute All
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                💬 Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                📊 View Analytics
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Session Stats</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants:</span>
                  <span className="font-medium">{mockSession.attendeeCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formatDuration(mockSession.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Q&A Total:</span>
                  <span className="font-medium">{qaPending + qaApproved}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Provider Info</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium uppercase">{mockSession.connectivityProvider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${mockSession.providerStatus === "active" ? "text-green-500" : "text-amber-500"}`}>
                    {mockSession.providerStatus === "active" ? "✓ Connected" : "⚠ " + mockSession.providerStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 flex items-center justify-between bg-card/50">
          <span className="text-xs text-muted-foreground">Session ID: {mockSession.id}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button variant="outline" size="sm">
              Handoff
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Console
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
