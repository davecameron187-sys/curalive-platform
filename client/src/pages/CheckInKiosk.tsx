/**
 * Check-In Kiosk Page — Tablet UI for QR code scanning
 * Displays camera feed, scans QR codes, and shows real-time feedback
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, Camera, RotateCcw } from "lucide-react";
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

export default function CheckInKiosk() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState({
    totalScanned: 0,
    successfulScans: 0,
    failedScans: 0,
    duplicates: 0,
  });

  // Mutations
  const startSessionMutation = trpc.checkin.startCheckInSession.useMutation();
  const scanQrMutation = trpc.checkin.scanAttendeeQr.useMutation();
  const getStatsMutation = trpc.checkin.getCheckInStats.useMutation();

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
          video: { facingMode: "environment" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Check-In Kiosk</h1>
          <p className="text-slate-300">Scan attendee QR codes to check in</p>
        </div>

        {/* Camera Feed */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden mb-6">
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ display: "block" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-green-500 opacity-50" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Camera className="w-16 h-16 text-slate-500" />
                <p className="text-slate-400">Press Start Scanning to begin</p>
              </div>
            )}
          </div>
        </Card>

        {/* Feedback Display */}
        {lastResult && (
          <Card
            className={`mb-6 p-6 border-2 ${
              lastResult.success
                ? "bg-green-900/20 border-green-500"
                : "bg-red-900/20 border-red-500"
            }`}
          >
            <div className="flex items-start gap-4">
              {lastResult.success ? (
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold text-lg ${
                    lastResult.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {lastResult.message}
                </h3>
                {lastResult.attendee && (
                  <div className="mt-2 text-sm text-slate-300">
                    <p>
                      <strong>Name:</strong> {lastResult.attendee.name}
                    </p>
                    <p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600 p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalScanned}</div>
            <div className="text-sm text-slate-400">Total Scanned</div>
          </Card>
          <Card className="bg-green-900/30 border-green-700 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.successfulScans}</div>
            <div className="text-sm text-green-300">Successful</div>
          </Card>
          <Card className="bg-yellow-900/30 border-yellow-700 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.duplicates}</div>
            <div className="text-sm text-yellow-300">Duplicates</div>
          </Card>
          <Card className="bg-red-900/30 border-red-700 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.failedScans}</div>
            <div className="text-sm text-red-300">Failed</div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={toggleScanning}
            size="lg"
            className={`${
              isScanning
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white font-semibold px-8`}
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
          <Button
            onClick={resetSession}
            variant="outline"
            size="lg"
            className="border-slate-500 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200 mb-1">Kiosk Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Start Scanning" to activate the camera</li>
                <li>Position QR codes within the frame to scan</li>
                <li>Results display immediately with attendee details</li>
                <li>Session continues until "Stop Scanning" is pressed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
