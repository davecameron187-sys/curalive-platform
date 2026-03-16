/**
 * Optimized Check-In Kiosk — Tablet-Responsive with Orientation Support
 * Supports iPad, Android tablets, and various screen sizes
 * Responsive layouts for landscape and portrait orientations
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Camera,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import jsQR from "jsqr";

interface CheckInResult {
  success: boolean;
  result: "success" | "duplicate" | "not_found" | "error";
  attendee?: {
    name: string;
    email: string;
    company?: string;
  };
  message?: string;
}

interface TabletStats {
  totalScanned: number;
  successfulScans: number;
  failedScans: number;
  duplicates: number;
}

export default function CheckInKioskOptimized() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State management
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState<TabletStats>({
    totalScanned: 0,
    successfulScans: 0,
    failedScans: 0,
    duplicates: 0,
  });

  // Responsive state
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">(
    getScreenSize()
  );

  // Mutations
  const startSessionMutation = trpc.checkin.startCheckInSession.useMutation();
  const scanQrMutation = trpc.checkin.scanAttendeeQr.useMutation();
  const getStatsMutation = trpc.checkin.getCheckInStats.useMutation();

  // Determine screen size category
  function getScreenSize(): "small" | "medium" | "large" {
    const width = window.innerWidth;
    if (width < 768) return "small";
    if (width < 1024) return "medium";
    return "large";
  }

  // Handle orientation and resize
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setScreenSize(getScreenSize());
    };

    const handleResize = () => {
      setScreenSize(getScreenSize());
      handleOrientationChange();
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    // Set viewport meta tag for proper mobile scaling
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1, viewport-fit=cover"
      );
    }

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await startSessionMutation.mutateAsync({
          eventId: eventId || "",
          kioskId: `kiosk-${Date.now()}`,
        });
        setSessionId(session.id);
      } catch (error) {
        console.error("Failed to start check-in session:", error);
      }
    };

    if (eventId) {
      initSession();
    }
  }, [eventId]);

  // Request camera permission and start scanning
  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        videoRef.current!.srcObject = stream;
        videoRef.current!.play();
        scanQRCode();
      } catch (error) {
        console.error("Camera access denied:", error);
        setLastResult({
          success: false,
          result: "error",
          message: "Camera access denied. Please enable camera permissions.",
        });
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isScanning]);

  // QR code scanning loop
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      handleQRCodeDetected(code.data);
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  // Handle detected QR code
  const handleQRCodeDetected = async (qrData: string) => {
    if (!sessionId) return;

    try {
      const result = await scanQrMutation.mutateAsync({
        sessionId,
        eventId: eventId || "",
        passCode: qrData,
      });

      setLastResult({
        success: result.success,
        result: result.result,
        attendee: result.attendee,
        message:
          result.result === "success"
            ? `Welcome, ${result.attendee?.name}!`
            : result.result === "duplicate"
              ? "Already checked in"
              : "QR code not found",
      });

      // Play sound feedback
      if (isSoundEnabled) {
        playFeedbackSound(result.success);
      }

      // Update stats
      const updatedStats = await getStatsMutation.mutateAsync(sessionId);
      setStats({
        totalScanned: updatedStats.totalScanned,
        successfulScans: updatedStats.successCount,
        failedScans: updatedStats.notFoundCount,
        duplicates: updatedStats.duplicateCount,
      });

      // Resume scanning after 2 seconds
      setTimeout(() => {
        if (isScanning) {
          scanQRCode();
        }
      }, 2000);
    } catch (error) {
      console.error("Check-in failed:", error);
      setLastResult({
        success: false,
        result: "error",
        message: "Check-in failed. Please try again.",
      });
      setTimeout(() => {
        if (isScanning) {
          scanQRCode();
        }
      }, 2000);
    }
  };

  // Play audio feedback
  const playFeedbackSound = (success: boolean) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (success) {
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else {
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      setLastResult(null);
    }
  };

  const resetSession = async () => {
    setIsScanning(false);
    setLastResult(null);
    setStats({ totalScanned: 0, successfulScans: 0, failedScans: 0, duplicates: 0 });

    try {
      const session = await startSessionMutation.mutateAsync({
        eventId: eventId || "",
        kioskId: `kiosk-${Date.now()}`,
      });
      setSessionId(session.id);
    } catch (error) {
      console.error("Failed to reset session:", error);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await containerRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  // Responsive classes
  const containerClasses = isLandscape
    ? "flex flex-row gap-4"
    : "flex flex-col gap-4";

  const cameraContainerClasses = isLandscape
    ? "flex-1 min-h-[400px]"
    : "w-full aspect-video";

  const statsGridClasses = isLandscape
    ? "grid grid-cols-2 gap-2"
    : "grid grid-cols-2 md:grid-cols-4 gap-3";

  const buttonSizeClass =
    screenSize === "small"
      ? "text-sm px-4 py-2"
      : screenSize === "medium"
        ? "text-base px-6 py-3"
        : "text-lg px-8 py-4";

  return (
    <div
      ref={containerRef}
      className={`min-h-screen ${isFullscreen ? "bg-black" : "bg-gradient-to-br from-slate-900 to-slate-800"} p-2 sm:p-4 md:p-6 flex flex-col`}
    >
      {/* Header */}
      <div className={`mb-4 ${isLandscape ? "mb-2" : "mb-6"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-bold text-white ${screenSize === "small" ? "text-2xl" : screenSize === "medium" ? "text-3xl" : "text-4xl"}`}>
              Check-In Kiosk
            </h1>
            <p className={`text-slate-300 ${screenSize === "small" ? "text-xs" : "text-sm"}`}>
              Scan attendee QR codes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              size="sm"
              variant="outline"
              className="border-slate-500 text-slate-300 hover:bg-slate-700 touch-target"
            >
              {isSoundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
            <Button
              onClick={toggleFullscreen}
              size="sm"
              variant="outline"
              className="border-slate-500 text-slate-300 hover:bg-slate-700 touch-target"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${containerClasses}`}>
        {/* Camera Feed Section */}
        <div className={`${cameraContainerClasses} bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden`}>
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ display: "block" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-green-500 opacity-50" />
                {/* QR Frame Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-green-400 rounded-lg opacity-70" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center p-4">
                <Camera className={`text-slate-500 ${screenSize === "small" ? "w-12 h-12" : "w-16 h-16"}`} />
                <p className="text-slate-400 text-sm md:text-base">
                  Press Start Scanning to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Stats and Feedback */}
        <div className={`${isLandscape ? "w-64 flex flex-col gap-3" : "w-full"}`}>
          {/* Feedback Display */}
          {lastResult && (
            <Card
              className={`p-3 md:p-4 border-2 ${
                lastResult.success
                  ? "bg-green-900/20 border-green-500"
                  : "bg-red-900/20 border-red-500"
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold text-sm md:text-base ${
                      lastResult.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {lastResult.message}
                  </h3>
                  {lastResult.attendee && (
                    <div className="mt-2 text-xs md:text-sm text-slate-300 space-y-1">
                      <p>
                        <strong>Name:</strong> {lastResult.attendee.name}
                      </p>
                      <p className="truncate">
                        <strong>Email:</strong> {lastResult.attendee.email}
                      </p>
                      {lastResult.attendee.company && (
                        <p>
                          <strong>Company:</strong> {lastResult.attendee.company}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Statistics */}
          <div className={statsGridClasses}>
            <Card className="bg-slate-700 border-slate-600 p-2 md:p-3 text-center">
              <div className={`font-bold text-white ${screenSize === "small" ? "text-lg" : "text-2xl"}`}>
                {stats.totalScanned}
              </div>
              <div className={`text-slate-400 ${screenSize === "small" ? "text-xs" : "text-sm"}`}>
                Total
              </div>
            </Card>
            <Card className="bg-green-900/30 border-green-700 p-2 md:p-3 text-center">
              <div className={`font-bold text-green-400 ${screenSize === "small" ? "text-lg" : "text-2xl"}`}>
                {stats.successfulScans}
              </div>
              <div className={`text-green-300 ${screenSize === "small" ? "text-xs" : "text-sm"}`}>
                Success
              </div>
            </Card>
            <Card className="bg-yellow-900/30 border-yellow-700 p-2 md:p-3 text-center">
              <div className={`font-bold text-yellow-400 ${screenSize === "small" ? "text-lg" : "text-2xl"}`}>
                {stats.duplicates}
              </div>
              <div className={`text-yellow-300 ${screenSize === "small" ? "text-xs" : "text-sm"}`}>
                Duplicates
              </div>
            </Card>
            <Card className="bg-red-900/30 border-red-700 p-2 md:p-3 text-center">
              <div className={`font-bold text-red-400 ${screenSize === "small" ? "text-lg" : "text-2xl"}`}>
                {stats.failedScans}
              </div>
              <div className={`text-red-300 ${screenSize === "small" ? "text-xs" : "text-sm"}`}>
                Failed
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Controls - Bottom */}
      <div className={`flex gap-2 md:gap-4 justify-center mt-4 ${isLandscape ? "mt-2" : ""}`}>
        <Button
          onClick={toggleScanning}
          className={`${
            isScanning
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          } text-white font-semibold touch-target ${buttonSizeClass}`}
        >
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </Button>
        <Button
          onClick={resetSession}
          variant="outline"
          className="border-slate-500 text-slate-300 hover:bg-slate-700 touch-target font-semibold"
        >
          <RotateCcw className={`${screenSize === "small" ? "w-4 h-4" : "w-5 h-5"} mr-2`} />
          {screenSize !== "small" && "Reset"}
        </Button>
      </div>

      {/* Info Section */}
      {!isLandscape && (
        <div className="mt-4 bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-xs md:text-sm text-slate-300">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200 mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Click "Start Scanning" to activate camera</li>
                <li>Position QR codes within the frame</li>
                <li>Results display immediately</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CSS for touch targets */}
      <style>{`
        .touch-target {
          min-height: 48px;
          min-width: 48px;
        }

        @media (max-width: 640px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }

        @supports (padding: max(0px)) {
          body {
            padding-left: max(12px, env(safe-area-inset-left));
            padding-right: max(12px, env(safe-area-inset-right));
            padding-top: max(12px, env(safe-area-inset-top));
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
