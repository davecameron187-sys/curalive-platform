// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TranscriptSegment {
  timestamp: number;
  speaker: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
}

interface QAEntry {
  timestamp: number;
  question: string;
  asker: string;
  approved: boolean;
}

interface SentimentPoint {
  timestamp: number;
  score: number;
}

/**
 * EventReplayPlayer Component
 * 
 * Video player with synchronized transcript, Q&A overlay, and sentiment timeline.
 */
export function EventReplayPlayer({
  videoUrl,
  transcript,
  qaData,
  sentimentData,
  duration,
}: {
  videoUrl: string;
  transcript: TranscriptSegment[];
  qaData: QAEntry[];
  sentimentData: SentimentPoint[];
  duration: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showQA, setShowQA] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  // Update current segment based on video time
  useEffect(() => {
    const index = transcript.findIndex((seg, idx) => {
      const nextSeg = transcript[idx + 1];
      return currentTime >= seg.timestamp && (!nextSeg || currentTime < nextSeg.timestamp);
    });
    if (index >= 0) {
      setCurrentSegmentIndex(index);
    }
  }, [currentTime, transcript]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleTimelineClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQA = qaData.filter((qa) => Math.abs(qa.timestamp - currentTime) < 5);

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card className="overflow-hidden bg-black">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            {/* Timeline with Sentiment Overlay */}
            <div className="mb-4">
              <div className="relative h-12 bg-gray-800 rounded overflow-hidden mb-2">
                {/* Sentiment gradient background */}
                <div className="absolute inset-0 flex">
                  {sentimentData.map((point, idx) => {
                    const width = (1 / sentimentData.length) * 100;
                    const color =
                      point.score > 60
                        ? "bg-green-500"
                        : point.score > 40
                          ? "bg-yellow-500"
                          : "bg-red-500";
                    return (
                      <div
                        key={idx}
                        className={`${color} opacity-30`}
                        style={{ width: `${width}%` }}
                      />
                    );
                  })}
                </div>

                {/* Q&A Markers */}
                {qaData.map((qa, idx) => (
                  <div
                    key={idx}
                    className="absolute top-2 w-2 h-8 bg-blue-500 rounded cursor-pointer hover:bg-blue-400 transition-colors"
                    style={{ left: `${(qa.timestamp / duration) * 100}%` }}
                    onClick={() => handleTimelineClick(qa.timestamp)}
                    title={qa.question}
                  />
                ))}

                {/* Progress Bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-primary"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {/* Seek Handle */}
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleTimelineClick(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <span className="text-sm text-white ml-4">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => handlePlaybackSpeed(parseFloat(e.target.value))}
                  className="text-xs bg-gray-700 text-white px-2 py-1 rounded"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Panels */}
      <div className="grid grid-cols-3 gap-4">
        {/* Transcript Panel */}
        {showTranscript && (
          <Card className="col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Transcript</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTranscript(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transcript.map((segment, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    idx === currentSegmentIndex
                      ? "bg-primary/20 border-l-4 border-primary"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => handleTimelineClick(segment.timestamp)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{segment.speaker}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(segment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{segment.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Q&A Panel */}
        {showQA && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Q&A
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowQA(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {currentQA.length > 0 ? (
                currentQA.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-background rounded border border-border"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{qa.asker}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(qa.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {qa.question}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        qa.approved
                          ? "bg-green-500/20 text-green-600"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {qa.approved ? "✓ Approved" : "⏳ Pending"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No Q&A at this time
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
