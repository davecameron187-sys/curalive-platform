import React, { useState, useRef, useEffect } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  Copy,
  Share2,
  Filter,
  ChevronDown,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: string;
  speakerId: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
  isKeyword?: boolean;
}

const KEYWORDS = [
  "earnings",
  "guidance",
  "revenue",
  "risk",
  "growth",
  "margin",
  "acquisition",
  "strategic",
  "outlook",
  "performance",
];

/**
 * LiveTranscriptDisplay Component
 * 
 * Real-time scrolling transcript with speaker identification,
 * timestamps, keyword highlighting, and search functionality.
 */
export function LiveTranscriptDisplay({
  conferenceId,
}: {
  conferenceId: number;
}) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [showKeywordsOnly, setShowKeywordsOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Subscribe to transcript updates
  useAblyChannel(
    `occ:transcript:${conferenceId}`,
    "transcript.updated",
    (message: Types.Message) => {
      const entry = message.data;

      // Check if text contains keywords
      const containsKeyword = KEYWORDS.some((keyword) =>
        entry.text.toLowerCase().includes(keyword.toLowerCase())
      );

      setTranscript((prev) => [
        ...prev,
        {
          id: entry.id,
          timestamp: entry.timestamp,
          speaker: entry.speaker,
          speakerId: entry.speakerId,
          text: entry.text,
          sentiment: entry.sentiment,
          isKeyword: containsKeyword,
        },
      ]);
    },
    [conferenceId]
  );

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const filteredTranscript = transcript.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.speaker.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpeaker =
      selectedSpeaker === null || entry.speakerId === selectedSpeaker;

    const matchesKeywords = !showKeywordsOnly || entry.isKeyword;

    return matchesSearch && matchesSpeaker && matchesKeywords;
  });

  const speakers = Array.from(
    new Set(transcript.map((entry) => entry.speaker))
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const highlightKeywords = (text: string) => {
    let highlightedText = text;
    KEYWORDS.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-300 font-semibold">$1</mark>'
      );
    });
    return highlightedText;
  };

  const handleCopyEntry = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleExportTranscript = () => {
    const text = filteredTranscript
      .map(
        (entry) =>
          `[${formatTime(entry.timestamp)}] ${entry.speaker}: ${entry.text}`
      )
      .join("\n");

    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${conferenceId}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Transcript exported");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Live Transcript
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportTranscript}
          disabled={filteredTranscript.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Speaker Filter & Keywords Toggle */}
        <div className="flex gap-2">
          <select
            value={selectedSpeaker || ""}
            onChange={(e) =>
              setSelectedSpeaker(e.target.value === "" ? null : e.target.value)
            }
            className="flex-1 px-3 py-2 border border-border rounded bg-background text-sm"
          >
            <option value="">All Speakers</option>
            {speakers.map((speaker) => (
              <option key={speaker} value={speaker}>
                {speaker}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant={showKeywordsOnly ? "default" : "outline"}
            onClick={() => setShowKeywordsOnly(!showKeywordsOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Keywords
          </Button>
        </div>
      </div>

      {/* Transcript Container */}
      <Card className="p-4 max-h-96 overflow-y-auto" ref={containerRef}>
        <div className="space-y-4">
          {filteredTranscript.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {transcript.length === 0
                  ? "Waiting for transcript..."
                  : "No matching entries"}
              </p>
            </div>
          ) : (
            filteredTranscript.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded border-l-4 transition-colors ${
                  entry.isKeyword
                    ? "border-yellow-500 bg-yellow-500/5"
                    : entry.sentiment === "positive"
                      ? "border-green-500 bg-green-500/5"
                      : entry.sentiment === "negative"
                        ? "border-red-500 bg-red-500/5"
                        : "border-blue-500 bg-blue-500/5"
                }`}
              >
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{entry.speaker}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(entry.timestamp)}
                    </span>
                    {entry.isKeyword && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full">
                        Keyword
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyEntry(entry.text)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Entry Text */}
                <p
                  className="text-sm text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(entry.text),
                  }}
                />
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-secondary rounded text-center">
          <p className="text-muted-foreground">Total Entries</p>
          <p className="font-semibold">{transcript.length}</p>
        </div>
        <div className="p-2 bg-secondary rounded text-center">
          <p className="text-muted-foreground">Speakers</p>
          <p className="font-semibold">{speakers.length}</p>
        </div>
        <div className="p-2 bg-secondary rounded text-center">
          <p className="text-muted-foreground">Keywords Found</p>
          <p className="font-semibold">
            {transcript.filter((e) => e.isKeyword).length}
          </p>
        </div>
        <div className="p-2 bg-secondary rounded text-center">
          <p className="text-muted-foreground">Duration</p>
          <p className="font-semibold">
            {transcript.length > 0
              ? formatTime(transcript[transcript.length - 1].timestamp)
              : "0:00"}
          </p>
        </div>
      </div>
    </div>
  );
}
