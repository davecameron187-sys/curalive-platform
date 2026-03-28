/**
 * Shadow Mode — Archive & Reports
 * 
 * View, search, and manage past sessions
 * Select AI services to run on archived sessions
 * Download reports and transcripts
 * Manage notes, Q&A, action log, and handoff
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Download,
  Settings,
  Loader2,
  Calendar,
  Users,
  Clock,
  FileText,
  ChevronRight,
  Filter,
  MessageSquare,
  CheckCircle,
  Activity,
  HandshakeIcon,
  Plus,
  Trash2,
} from "lucide-react";

interface SessionArchive {
  id: string;
  eventName: string;
  startedAt: Date;
  endedAt: Date;
  duration: number;
  attendeeCount: number;
  status: "completed";
  transcriptReady: boolean;
  analysisReady: boolean;
}

interface SessionNote {
  id: string;
  text: string;
  createdAt: Date;
  createdBy: string;
}

interface QAItem {
  id: string;
  question: string;
  submitter: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

interface ActionLogEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: Date;
  details?: string;
}

interface Handoff {
  id: string;
  recipient: string;
  notes: string;
  completedAt?: Date;
  status: "pending" | "completed";
}

type DetailTab = "overview" | "notes" | "qa" | "actions" | "handoff";

export default function ShadowMode() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionArchive | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "archived" | "processing">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [newNote, setNewNote] = useState("");
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [sessionQA, setSessionQA] = useState<QAItem[]>([]);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [handoffRecipient, setHandoffRecipient] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");

  const itemsPerPage = 10;

  // Fetch archived sessions
  const { data: sessions = [], isLoading, error } = trpc.archive.getArchivedSessions.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
  });

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter((session: SessionArchive) => {
    const matchesSearch = session.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || session.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: "completed" | "archived" | "processing") => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "archived":
        return <Badge className="bg-blue-600">Archived</Badge>;
      case "processing":
        return <Badge className="bg-yellow-600">Processing</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedSession) return;
    
    const note: SessionNote = {
      id: Date.now().toString(),
      text: newNote,
      createdAt: new Date(),
      createdBy: "Current User",
    };
    
    setSessionNotes([...sessionNotes, note]);
    setNewNote("");
  };

  const handleDeleteNote = (noteId: string) => {
    setSessionNotes(sessionNotes.filter(n => n.id !== noteId));
  };

  const handleApproveQA = (qaId: string) => {
    setSessionQA(sessionQA.map(q => 
      q.id === qaId ? { ...q, status: "approved" } : q
    ));
  };

  const handleRejectQA = (qaId: string) => {
    setSessionQA(sessionQA.map(q => 
      q.id === qaId ? { ...q, status: "rejected" } : q
    ));
  };

  const handleCreateHandoff = () => {
    if (!handoffRecipient.trim() || !selectedSession) return;
    
    const handoff: Handoff = {
      id: Date.now().toString(),
      recipient: handoffRecipient,
      notes: handoffNotes,
      status: "pending",
    };
    
    setHandoffs([...handoffs, handoff]);
    setHandoffRecipient("");
    setHandoffNotes("");
  };

  const handleCompleteHandoff = (handoffId: string) => {
    setHandoffs(handoffs.map(h => 
      h.id === handoffId ? { ...h, status: "completed", completedAt: new Date() } : h
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Archive & Reports</h1>
          <p className="text-muted-foreground">
            Review past sessions, run AI analysis, and download reports
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="border-b bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search sessions by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(["all", "completed", "archived", "processing"] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-900/10 border-red-500">
            <p className="text-red-500">Error loading sessions: {error.message}</p>
          </Card>
        ) : filteredSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sessions found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session: SessionArchive) => (
              <Card
                key={session.id}
                className="p-6 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedSession(session);
                  setDetailTab("overview");
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{session.eventName}</h3>
                      {getStatusBadge(session.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.startedAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDuration(session.duration)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {session.attendeeCount} attendees
                      </div>
                      <div>
                        {session.transcriptReady && session.analysisReady ? (
                          <Badge className="bg-green-600">Ready</Badge>
                        ) : session.transcriptReady ? (
                          <Badge className="bg-yellow-600">Partial</Badge>
                        ) : (
                          <Badge className="bg-gray-600">Processing</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession(session);
                      setDetailTab("overview");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredSessions.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={filteredSessions.length < itemsPerPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Selected Session Detail Panel */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedSession.eventName}</h2>
                <p className="text-muted-foreground">{formatDate(selectedSession.startedAt)}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSession(null)}
              >
                ✕
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b">
              <Button
                variant={detailTab === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDetailTab("overview")}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Overview
              </Button>
              <Button
                variant={detailTab === "notes" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDetailTab("notes")}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Notes ({sessionNotes.length})
              </Button>
              <Button
                variant={detailTab === "qa" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDetailTab("qa")}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Q&A ({sessionQA.length})
              </Button>
              <Button
                variant={detailTab === "actions" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDetailTab("actions")}
                className="flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Action Log
              </Button>
              <Button
                variant={detailTab === "handoff" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDetailTab("handoff")}
                className="flex items-center gap-2"
              >
                <HandshakeIcon className="w-4 h-4" />
                Handoff
              </Button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {detailTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-lg font-semibold">{formatDuration(selectedSession.duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendees</p>
                      <p className="text-lg font-semibold">{selectedSession.attendeeCount}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 flex items-center gap-2"
                      onClick={() => {
                        window.location.href = `/ai-dashboard/${selectedSession.id}`;
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Run AI Services
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                      onClick={() => {
                        window.location.href = `/analytics/${selectedSession.id}`;
                      }}
                    >
                      <Download className="w-4 h-4" />
                      View Reports
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {detailTab === "notes" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Add Note</label>
                    <Textarea
                      placeholder="Add a note about this session..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-24"
                    />
                    <Button
                      onClick={handleAddNote}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Note
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Session Notes</h4>
                    {sessionNotes.length === 0 ? (
                      <p className="text-muted-foreground">No notes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {sessionNotes.map((note) => (
                          <Card key={note.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{note.createdBy}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm">{note.text}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Q&A Tab */}
              {detailTab === "qa" && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Q&A Moderation</h4>
                  {sessionQA.length === 0 ? (
                    <p className="text-muted-foreground">No Q&A items</p>
                  ) : (
                    <div className="space-y-2">
                      {sessionQA.map((qa) => (
                        <Card key={qa.id} className="p-4">
                          <div className="mb-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{qa.submitter}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(qa.createdAt)}</p>
                              </div>
                              <Badge variant={qa.status === "approved" ? "default" : qa.status === "rejected" ? "destructive" : "secondary"}>
                                {qa.status}
                              </Badge>
                            </div>
                            <p className="text-sm mb-3">{qa.question}</p>
                          </div>
                          {qa.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveQA(qa.id)}
                                className="flex-1"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectQA(qa.id)}
                                className="flex-1"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Log Tab */}
              {detailTab === "actions" && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Action Log</h4>
                  {actionLog.length === 0 ? (
                    <p className="text-muted-foreground">No actions logged</p>
                  ) : (
                    <div className="space-y-2">
                      {actionLog.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{entry.action}</p>
                              <p className="text-sm text-muted-foreground">{entry.actor} • {formatDate(entry.timestamp)}</p>
                              {entry.details && <p className="text-sm mt-2">{entry.details}</p>}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Handoff Tab */}
              {detailTab === "handoff" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Create Handoff</label>
                    <Input
                      placeholder="Recipient name or email..."
                      value={handoffRecipient}
                      onChange={(e) => setHandoffRecipient(e.target.value)}
                    />
                    <Textarea
                      placeholder="Handoff notes..."
                      value={handoffNotes}
                      onChange={(e) => setHandoffNotes(e.target.value)}
                      className="min-h-20"
                    />
                    <Button
                      onClick={handleCreateHandoff}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Handoff
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Handoffs</h4>
                    {handoffs.length === 0 ? (
                      <p className="text-muted-foreground">No handoffs</p>
                    ) : (
                      <div className="space-y-2">
                        {handoffs.map((handoff) => (
                          <Card key={handoff.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{handoff.recipient}</p>
                                <p className="text-sm text-muted-foreground">{handoff.notes}</p>
                              </div>
                              <Badge variant={handoff.status === "completed" ? "default" : "secondary"}>
                                {handoff.status}
                              </Badge>
                            </div>
                            {handoff.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteHandoff(handoff.id)}
                              >
                                Mark Complete
                              </Button>
                            )}
                            {handoff.completedAt && (
                              <p className="text-xs text-muted-foreground">Completed {formatDate(handoff.completedAt)}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedSession(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
