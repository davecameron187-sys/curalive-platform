/**
 * Shadow Mode — Archive & Reports
 * 
 * View, search, and manage past sessions
 * Select AI services to run on archived sessions
 * Download reports and transcripts
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function ShadowMode() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionArchive | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "archived" | "processing">("all");
  const [currentPage, setCurrentPage] = useState(1);
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
                onClick={() => setSelectedSession(session)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 p-6">
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

            <div className="space-y-4 mb-6">
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
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 flex items-center gap-2"
                onClick={() => {
                  // Navigate to AI Dashboard for this session
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
                  // Navigate to reports for this session
                  window.location.href = `/analytics/${selectedSession.id}`;
                }}
              >
                <Download className="w-4 h-4" />
                View Reports
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedSession(null)}
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
