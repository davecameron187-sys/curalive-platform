import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Signal,
  Users,
  Clock,
  Activity,
  Settings,
  Send,
  Loader2,
  Download,
  Share2,
  Zap,
  HelpCircle,
} from "lucide-react";
import { WebPhoneCallManager } from "@/components/WebPhoneCallManager";
import ProviderStateIndicator, { ProviderState } from "@/components/ProviderStateIndicator";
import { useAblySessions } from "@/hooks/useAblySessions";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { SessionAutoSave } from "@/services/sessionAutoSave";

export interface LiveSession {
  id: string;
  eventName: string;
  status: "live" | "scheduled" | "ended";
  startedAt: number;
  duration: number;
  attendeeCount: number;
  connectivityProvider: "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
  providerStatus: "active" | "degraded" | "fallback" | "failed";
  fallbackReason?: string;
}

export interface LiveSessionPanelProps {
  session?: LiveSession;
  onClose?: () => void;
  isMinimized?: boolean;
}

export default function LiveSessionPanel({
  session: sessionProp,
  onClose,
  isMinimized = false,
}: LiveSessionPanelProps) {
  const defaultSession: LiveSession = {
    id: "live-session-default",
    eventName: "Live Session",
    status: "live",
    startedAt: Date.now() - 3600000,
    duration: 3600,
    attendeeCount: 0,
    connectivityProvider: "webphone",
    providerStatus: "active",
  };

  const session = sessionProp || defaultSession;

  const [activeTab, setActiveTab] = useState<"webphone" | "qa" | "transcript" | "notes">("webphone");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [handoffTargetId, setHandoffTargetId] = useState("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [recoveryPromptVisible, setRecoveryPromptVisible] = useState(false);
  const [sessionAutoSave, setSessionAutoSave] = useState<SessionAutoSave | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const { isConnected: ablyConnected, qaUpdates, transcriptUpdates, publishUpdate } = useAblySessions(session.id);

  const { data: qaData, isLoading: qaLoading, refetch: refetchQA } = trpc.session.getLiveQA.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id && !ablyConnected, refetchInterval: 3000 }
  );

  const { data: transcriptData, isLoading: transcriptLoading } = trpc.session.getLiveTranscript.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id && !ablyConnected, refetchInterval: 2000 }
  );

  const { data: notesData } = trpc.session.getNotes.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id }
  );

  const { data: analyticsData } = trpc.analytics.getSessionEventAnalytics.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id, refetchInterval: 5000 }
  );

  const approveQuestionMutation = trpc.session.approveQuestion.useMutation({
    onSuccess: () => {
      refetchQA();
      publishUpdate({ action: "qa-approved", data: {} });
    },
  });

  const rejectQuestionMutation = trpc.session.rejectQuestion.useMutation({
    onSuccess: () => {
      refetchQA();
      publishUpdate({ action: "qa-rejected", data: {} });
    },
  });

  const saveNotesMutation = trpc.session.saveNotes.useMutation();

  const exportSessionMutation = trpc.session.exportSession.useMutation({
    onSuccess: (data) => {
      if (data.format === "json") {
        const blob = new Blob([data.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  });

  const handoffSessionMutation = trpc.session.handoffSession.useMutation({
    onSuccess: () => {
      alert("Session handed off successfully");
      onClose?.();
    },
  });

  useEffect(() => {
    const autoSave = new SessionAutoSave(session.id);
    autoSave.start();
    setSessionAutoSave(autoSave);

    if (autoSave.hasRecoveryData()) {
      setRecoveryPromptVisible(true);
    }

    return () => {
      autoSave.destroy();
    };
  }, [session.id]);

  useEffect(() => {
    if (notesData?.notes) {
      setNotes(notesData.notes);
    }
  }, [notesData]);

  useEffect(() => {
    if (sessionAutoSave) {
      sessionAutoSave.update({
        notes,
        activeTab,
      });
    }
  }, [notes, activeTab, sessionAutoSave]);

  useEffect(() => {
    if (analyticsData) {
      setAnalytics(analyticsData);
    }
  }, [analyticsData]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await saveNotesMutation.mutateAsync({
        sessionId: session.id,
        notes,
      });
      if (sessionAutoSave) {
        sessionAutoSave.save();
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleExport = async (format: "json" | "pdf") => {
    setIsExporting(true);
    try {
      await exportSessionMutation.mutateAsync({
        sessionId: session.id,
        format,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export session");
    } finally {
      setIsExporting(false);
    }
  };

  const handleHandoff = async () => {
    if (!handoffTargetId) {
      alert("Please select a target operator");
      return;
    }
    setIsHandingOff(true);
    try {
      await handoffSessionMutation.mutateAsync({
        sessionId: session.id,
        targetOperatorId: handoffTargetId,
        handoffNotes: notes,
      });
    } catch (error) {
      console.error("Handoff failed:", error);
      alert("Failed to handoff session");
    } finally {
      setIsHandingOff(false);
    }
  };

  useKeyboardShortcuts({
    onMuteAll: () => {
      console.log("[Shortcuts] Mute all triggered");
    },
    onApproveQA: () => {
      if (pendingQuestions.length > 0) {
        handleApproveQuestion((pendingQuestions[0] as any).id);
      }
    },
    onRejectQA: () => {
      if (pendingQuestions.length > 0) {
        handleRejectQuestion((pendingQuestions[0] as any).id);
      }
    },
    onSaveNotes: handleSaveNotes,
    onExport: () => handleExport("json"),
    onHandoff: () => {
      if (handoffTargetId) {
        handleHandoff();
      }
    },
    onShowHelp: () => setShowShortcutsHelp(true),
  });

  const qaPending = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "new").length : qaData?.pendingCount || 0;
  const qaApproved = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "approved").length : qaData?.approvedCount || 0;
  const pendingQuestions = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "new").map(u => u.data) : qaData?.pending || [];
  const approvedQuestions = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "approved").map(u => u.data) : qaData?.approved || [];

  const liveTranscript = ablyConnected && transcriptUpdates.length > 0 ? transcriptUpdates.map(u => u.data) : transcriptData || [];

  const providerState: ProviderState = {
    provider: session.connectivityProvider,
    status: session.providerStatus,
    fallbackReason: session.fallbackReason,
    connectionQuality: ablyConnected ? "excellent" : "fair",
    latency: ablyConnected ? 45 : 200,
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handleApproveQuestion = (questionId: string) => {
    approveQuestionMutation.mutate({
      questionId,
      sessionId: session.id,
    });
  };

  const handleRejectQuestion = (questionId: string) => {
    rejectQuestionMutation.mutate({
      questionId,
      sessionId: session.id,
    });
  };

  const handleRecovery = () => {
    if (sessionAutoSave?.hasRecoveryData()) {
      const recovered = sessionAutoSave.getRecoveryData();
      setNotes(recovered.notes);
      setActiveTab(recovered.activeTab as any);
      setRecoveryPromptVisible(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${session.status === "live" ? "bg-red-600 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-sm font-semibold">{session.eventName}</span>
          {ablyConnected && <Badge className="bg-green-600 text-white text-xs">Live</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h2 className="text-lg font-bold">{session.eventName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.duration)}</span>
                <Users className="w-4 h-4" />
                <span>{session.attendeeCount} attendees</span>
              </div>
            </div>
          </div>

          {analytics && (
            <div className="flex items-center gap-4 px-4 border-l border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.engagementScore || 0}</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.qaMetrics?.approvalRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Q&A Approval</div>
              </div>
            </div>
          )}

          <div className="px-4 border-l border-border">
            <ProviderStateIndicator state={providerState} compact />
          </div>

          <div className="px-4 border-l border-border">
            <Badge className={ablyConnected ? "bg-green-600" : "bg-yellow-600"}>
              <Signal className="w-3 h-3 mr-1" />
              {ablyConnected ? "Live" : "Polling"}
            </Badge>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {recoveryPromptVisible && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-900">Session recovery data found. Restore your previous state?</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRecoveryPromptVisible(false)}>
                Discard
              </Button>
              <Button size="sm" onClick={handleRecovery}>
                Restore
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-muted/50 px-4">
              <TabsTrigger value="webphone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WebPhone
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Q&A <Badge variant="outline" className="ml-1">{qaPending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webphone" className="flex-1 overflow-auto p-4">
              <WebPhoneCallManager sessionId={session.id} />
            </TabsContent>

            <TabsContent value="qa" className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Pending Questions ({qaPending})</h3>
                {pendingQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending questions</p>
                ) : (
                  <div className="space-y-2">
                    {pendingQuestions.map((q: any) => (
                      <Card key={q.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.question}</p>
                            <p className="text-xs text-muted-foreground mt-1">From: {q.askerName}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveQuestion(q.id)}
                              disabled={approveQuestionMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectQuestion(q.id)}
                              disabled={rejectQuestionMutation.isPending}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Approved Questions ({qaApproved})</h3>
                {approvedQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved questions</p>
                ) : (
                  <div className="space-y-2">
                    {approvedQuestions.map((q: any) => (
                      <Card key={q.id} className="p-3 bg-green-50">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">From: {q.askerName}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {liveTranscript.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transcript yet</p>
                ) : (
                  liveTranscript.map((entry: any, idx: number) => (
                    <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-1">
                      <span className="font-medium">{entry.speaker}:</span> {entry.text}
                      <span className="text-xs text-muted-foreground ml-2">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-auto p-4 flex flex-col">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add operator notes here..."
                className="flex-1 resize-none"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-2 w-full"
              >
                {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Save Notes
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-card border-t border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Shortcuts (?)
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleHandoff}
              disabled={isHandingOff}
            >
              {isHandingOff ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              Handoff
            </Button>
          </div>
        </div>

        {showShortcutsHelp && (
          <div className="absolute bottom-20 right-4 bg-card border border-border rounded-lg p-4 shadow-lg w-80 z-50">
            <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-mono bg-muted px-2 py-1 rounded">{shortcut.key}</span>
                  <span className="text-muted-foreground">{shortcut.action}</span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setShowShortcutsHelp(false)}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { LiveSessionPanel };
