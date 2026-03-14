import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Captions,
  Eye,
} from "lucide-react";

interface Caption {
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * AccessibleVideoPlayer Component
 * 
 * Fully accessible video player with:
 * - Closed captions support
 * - Keyboard navigation
 * - ARIA labels and screen reader support
 * - High-contrast theme option
 * - Focus management
 */
export function AccessibleVideoPlayer({
  videoUrl,
  captions,
  title,
  highContrast = false,
}: {
  videoUrl: string;
  captions: Caption[];
  title: string;
  highContrast?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  // Update current caption
  useEffect(() => {
    const caption = captions.find(
      (cap) => currentTime >= cap.startTime && currentTime <= cap.endTime
    );
    setCurrentCaption(caption || null);
  }, [currentTime, captions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.currentTime + 5,
              duration
            );
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(
              videoRef.current.currentTime - 5,
              0
            );
          }
          break;
        case "m":
          e.preventDefault();
          handleMute();
          break;
        case "c":
          e.preventDefault();
          setShowCaptions(!showCaptions);
          break;
        case "f":
          e.preventDefault();
          handleFullscreen();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration, volume, showCaptions]);

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

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCaptionFontSize = () => {
    switch (fontSize) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  return (
    <Card
      ref={containerRef}
      className={`overflow-hidden ${highContrast ? "bg-black text-white" : ""}`}
      role="region"
      aria-label={`Video player: ${title}`}
    >
      <div className="relative aspect-video bg-black">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={(e) => setCurrentTime(e.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          aria-label={title}
        />

        {/* Captions Overlay */}
        {showCaptions && currentCaption && (
          <div
            className={`absolute bottom-20 left-0 right-0 text-center px-4 py-2 ${
              highContrast
                ? "bg-black/90 text-white border-2 border-white"
                : "bg-black/70 text-white"
            }`}
            role="status"
            aria-live="polite"
            aria-label="Video captions"
          >
            <p className={`${getCaptionFontSize()} font-semibold`}>
              {currentCaption.text}
            </p>
          </div>
        )}

        {/* Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 ${
            highContrast ? "border-t-2 border-white" : ""
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className={`w-full h-2 rounded cursor-pointer ${
                highContrast ? "accent-white" : "accent-primary"
              }`}
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(currentTime)}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
                aria-label={isPlaying ? "Pause video" : "Play video"}
                aria-pressed={isPlaying}
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
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  aria-pressed={isMuted}
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
                  className={`w-20 h-1 rounded cursor-pointer ${
                    highContrast ? "accent-white" : "accent-primary"
                  }`}
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(volume * 100)}
                />
              </div>

              {/* Time Display */}
              <span
                className="text-sm text-white ml-4"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Captions Toggle */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCaptions(!showCaptions)}
                className="text-white hover:bg-white/20"
                aria-label={showCaptions ? "Hide captions" : "Show captions"}
                aria-pressed={showCaptions}
                title="Press 'C' to toggle captions"
              >
                <Captions className="h-4 w-4" />
              </Button>

              {/* Settings Menu */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:bg-white/20"
                  aria-label="Settings"
                  aria-expanded={showSettings}
                  aria-haspopup="menu"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                {showSettings && (
                  <div
                    className={`absolute bottom-full right-0 mb-2 p-4 rounded shadow-lg ${
                      highContrast
                        ? "bg-black border-2 border-white text-white"
                        : "bg-gray-900 text-white"
                    }`}
                    role="menu"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold block mb-2">
                          Caption Size
                        </label>
                        <div className="flex gap-2">
                          {(["small", "medium", "large"] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => setFontSize(size)}
                              className={`px-2 py-1 rounded text-xs ${
                                fontSize === size
                                  ? "bg-primary text-white"
                                  : "bg-gray-700"
                              }`}
                              role="menuitemradio"
                              aria-checked={fontSize === size}
                            >
                              {size.charAt(0).toUpperCase() + size.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
                        <p className="font-semibold mb-1">Keyboard Shortcuts:</p>
                        <ul className="space-y-1">
                          <li>Space: Play/Pause</li>
                          <li>→/←: Skip 5s</li>
                          <li>↑/↓: Volume</li>
                          <li>M: Mute</li>
                          <li>C: Captions</li>
                          <li>F: Fullscreen</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
                aria-label="Fullscreen"
                title="Press 'F' for fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Skip Links for Screen Readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-primary focus:text-white focus:p-2 focus:z-50"
        >
          Skip to main content
        </a>
      </div>

      {/* Accessibility Info */}
      <div className={`p-4 ${highContrast ? "bg-black border-t-2 border-white" : "bg-secondary"}`}>
        <div className="flex items-start gap-2">
          <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Accessibility Features:</p>
            <ul className="mt-1 space-y-1 text-xs opacity-75">
              <li>✓ Closed captions with adjustable font size</li>
              <li>✓ Full keyboard navigation support</li>
              <li>✓ Screen reader compatible with ARIA labels</li>
              <li>✓ High-contrast mode available</li>
              <li>✓ Focus indicators for keyboard users</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
