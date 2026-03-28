/**
 * Live Session Panel — Embedded Operator Console
 * 
 * Full-featured live operator workspace for managing webcast/audio sessions
 * Includes: WebPhone controls, Q&A moderation, live transcript, provider state
 */

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Signal,
  Users,
  Mic,
  MicOff,
  X,
  Clock,
  Activity,
  Settings,
  Send,
} from "lucide-react";
import { WebPhoneCallManager } from "@/components/WebPhoneCallManager";
import ProviderStateIndicator, { ProviderState } from "@/components/ProviderStateIndicator";

export interface LiveSession {
  id: string;
  eventName: string;
  status: "live" | "scheduled" | "ended";
  startedAt: Date;
  duration: number;
  attendeeCount: number;
  connectivityProvider: "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
  providerStatus: "active" | "degraded" | "fallback" | "failed";
  fallbackReason?: string;
}

export interface LiveSessionPanelProps {
  session: LiveSession;
  onClose?: () => void;
  isMinimized?: boolean;
}

export default function LiveSessionPanel({
  session,
  onClose,
  isMinimized = false,
}: LiveSessionPanelProps) {
  const [activeTab, setActiveTab] = useState<"webphone" | "qa" | "transcript" | "notes">("webphone");
  const [notes, setNotes] = useState("");
  const [qaPending, setQaPending] = useState(0);
  const [qaApproved, setQaApproved] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([]);

  // Provider state
  const providerState: ProviderState = {
    provider: session.connectivityProvider,
    status: session.providerStatus,
    fallbackReason: session.fallbackReason,
    connectionQuality: "excellent",
    latency: 45,
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get provider color
  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      webphone: "bg-blue-600",
      teams: "bg-purple-600",
      zoom: "bg-cyan-600",
      webex: "bg-green-600",
      rtmp: "bg-orange-600",
      pstn: "bg-gray-600",
    };
    return colors[provider] || "bg-gray-600";
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${session.status === "live" ? "bg-red-600 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-sm font-semibold">{session.eventName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2"
          >
            ✕
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card p-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${session.status === "live" ? "bg-red-600 animate-pulse" : "bg-gray-600"}`} />
              <h2 className="text-2xl font-bold">{session.eventName}</h2>
              <Badge className={session.status === "live" ? "bg-red-600" : "bg-gray-600"}>
                {session.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(session.duration)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {session.attendeeCount} attendees
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {qaPending} pending Q&A
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-lg"
          >
            ✕
          </Button>
        </div>

        {/* Provider Status Bar */}
        <div className="border-b bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getProviderColor(session.connectivityProvider)} text-white`}>
                {session.connectivityProvider.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium">
                {session.providerStatus === "active" ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                ) : session.providerStatus === "fallback" ? (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Signal className="w-4 h-4" />
                    Fallback Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {session.providerStatus}
                  </span>
                )}
              </span>
            </div>
            {session.fallbackReason && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                {session.fallbackReason}
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex gap-4 p-4">
          {/* Left: Tabs Panel */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="webphone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WebPhone
                </TabsTrigger>
                <TabsTrigger value="qa" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Q&A
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* WebPhone Tab */}
              <TabsContent value="webphone" className="flex-1 overflow-auto">
                <div className="p-4 space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <WebPhoneCallManager sessionId={session.id} isLoading={false} />
                  </div>
                </div>
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qa" className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="bg-yellow-50">
                      {qaPending} Pending
                    </Badge>
                    <Badge variant="outline" className="bg-green-50">
                      {qaApproved} Approved
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-3 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Sample Question {i}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Asked by Attendee {i} • 2 upvotes
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => setQaApproved(qaApproved + 1)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setQaPending(Math.max(0, qaPending - 1))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="flex-1 overflow-auto">
                <div className="p-4 space-y-3 bg-muted/20 rounded-lg">
                  {liveTranscript.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Live transcript will appear here as the session progresses</p>
                    </div>
                  ) : (
                    liveTranscript.map((entry, i) => (
                      <div key={i} className="bg-card p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-primary">{entry.speaker}</p>
                            <p className="text-sm mt-1">{entry.text}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Operator Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this session..."
                      className="w-full h-48 p-3 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Save Notes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Quick Actions Sidebar */}
          <div className="w-64 flex flex-col gap-3 border-l pl-4">
            <h3 className="font-semibold text-sm">Quick Actions</h3>

            <Button variant="outline" size="sm" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              Mute All
            </Button>

            <Button variant="outline" size="sm" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>

            <Button variant="outline" size="sm" className="w-full justify-start">
              <Activity className="w-4 h-4 mr-2" />
              View Analytics
            </Button>

            <div className="border-t pt-3 mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Session Stats</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Participants</span>
                  <span className="font-semibold">{session.attendeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-semibold">{formatDuration(session.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Q&A Total</span>
                  <span className="font-semibold">{qaPending + qaApproved}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Provider Info</h4>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${session.providerStatus === "active" ? "bg-green-600" : "bg-orange-600"}`} />
                  <span>{session.connectivityProvider.toUpperCase()}</span>
                </div>
                <div className="text-muted-foreground">
                  {session.providerStatus === "active" ? "Connected" : "Fallback Active"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Session ID: {session.id}
          </div>
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
      </Card>
    </div>
  );
}
