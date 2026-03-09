import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Edit2, History, Loader2, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TranscriptSegment {
  id: number;
  conferenceId: number;
  speakerName: string;
  speakerRole: "moderator" | "participant" | "operator";
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  language: string;
  isFinal: boolean;
  createdAt: Date;
}

interface TranscriptEditorProps {
  conferenceId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TranscriptEditor — UI component for operators to view and correct transcriptions
 * Features: real-time display, segment editing, edit history, audit trail
 */
export function TranscriptEditor({ conferenceId, isOpen, onClose }: TranscriptEditorProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editReason, setEditReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch live transcription
  const { data: liveData, isLoading: isLoadingLive } =
    trpc.transcription.getLiveTranscription.useQuery(
      { conferenceId, lastNSeconds: 300 },
      { enabled: isOpen, refetchInterval: 2000 }
    );

  // Fetch full transcription
  const { data: fullTranscription } = trpc.transcription.getFullTranscription.useQuery(
    { conferenceId },
    { enabled: isOpen && showHistory }
  );

  // Correct segment mutation
  const { mutate: correctSegment, isPending: isCorrectingSegment } =
    trpc.transcription.correctSegment.useMutation({
      onSuccess: () => {
        setEditingSegmentId(null);
        setEditingText("");
        setEditReason("");
        // Refetch segments
        if (liveData) {
          setSegments(liveData.segments);
        }
      },
    });

  // Get edit history
  const { data: editHistory } = trpc.transcription.getEditHistory.useQuery(
    { segmentId: editingSegmentId || 0 },
    { enabled: editingSegmentId !== null }
  );

  // Update segments when data changes
  useEffect(() => {
    if (liveData?.segments) {
      setSegments(liveData.segments);
    }
  }, [liveData]);

  if (!isOpen) return null;

  // Filter segments
  const filteredSegments = segments.filter((segment) => {
    const matchesSearch =
      segment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.speakerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpeaker = !selectedSpeaker || segment.speakerName === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  // Get unique speakers
  const speakers = Array.from(new Set(segments.map((s) => s.speakerName)));

  const handleEditSegment = (segment: TranscriptSegment) => {
    setEditingSegmentId(segment.id);
    setEditingText(segment.text);
    setEditReason("");
  };

  const handleSaveEdit = () => {
    if (editingSegmentId === null || !editingText.trim()) return;

    correctSegment({
      segmentId: editingSegmentId,
      conferenceId,
      correctedText: editingText,
      reason: editReason || undefined,
    });
  };

  const handleCancelEdit = () => {
    setEditingSegmentId(null);
    setEditingText("");
    setEditReason("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Transcript Editor</h2>
            <p className="text-sm text-slate-400">Conference #{conferenceId}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <select
              value={selectedSpeaker || ""}
              onChange={(e) => setSelectedSpeaker(e.target.value || null)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
            >
              <option value="">All Speakers</option>
              {speakers.map((speaker) => (
                <option key={speaker} value={speaker}>
                  {speaker}
                </option>
              ))}
            </select>
            <Button
              variant={showHistory ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredSegments.length}</Badge>
              <span className="text-slate-400">segments</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{speakers.length}</Badge>
              <span className="text-slate-400">speakers</span>
            </div>
          </div>
        </div>

        {/* Transcript Display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingLive ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>No segments found</p>
            </div>
          ) : (
            filteredSegments.map((segment) => (
              <div
                key={segment.id}
                className={`p-3 rounded border transition-colors ${
                  editingSegmentId === segment.id
                    ? "bg-blue-900/30 border-blue-500"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                {editingSegmentId === segment.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{segment.speakerName}</span>
                        <Badge variant="outline" className="text-xs">
                          {segment.speakerRole}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >{`${Math.round(segment.confidence)}%`}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Original
                      </label>
                      <div className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-400 line-through">
                        {segment.text}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Corrected Text
                      </label>
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-20 bg-slate-800 border-slate-700 text-white"
                        placeholder="Enter corrected text..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Reason (optional)
                      </label>
                      <Input
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Why was this corrected?"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isCorrectingSegment}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isCorrectingSegment || !editingText.trim()}
                        className="gap-2"
                      >
                        {isCorrectingSegment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">{segment.speakerName}</span>
                        <Badge variant="outline" className="text-xs">
                          {segment.speakerRole}
                        </Badge>
                        <Badge
                          variant={segment.confidence >= 90 ? "default" : "secondary"}
                          className="text-xs"
                        >{`${Math.round(segment.confidence)}%`}</Badge>
                        {segment.confidence < 80 && (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-200 break-words">{segment.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>
                          {Math.floor(segment.startTime / 1000)}s -{" "}
                          {Math.floor(segment.endTime / 1000)}s
                        </span>
                        {segment.isFinal && <Badge variant="secondary">Final</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSegment(segment)}
                      className="text-slate-400 hover:text-white flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Edit History */}
                {editingSegmentId === segment.id && editHistory && editHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs font-semibold text-slate-300 mb-2">Edit History</p>
                    <div className="space-y-2">
                      {editHistory.map((edit) => (
                        <div key={edit.id} className="text-xs bg-slate-900 p-2 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-400">
                              {edit.editType.charAt(0).toUpperCase() + edit.editType.slice(1)}
                            </span>
                            <span className="text-slate-500">
                              {new Date(edit.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {edit.reason && (
                            <p className="text-slate-400 italic">Reason: {edit.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 text-xs text-slate-400">
          <p>
            {filteredSegments.length > 0
              ? `Showing ${filteredSegments.length} of ${segments.length} segments`
              : "No segments to display"}
          </p>
        </div>
      </Card>
    </div>
  );
}
