/**
 * QR Scanner Optimizer
 * Optimizes QR code scanning for various screen sizes and orientations
 */

export interface ScannerConfig {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  deviceType: "phone" | "tablet" | "desktop";
}

export interface OptimizedScannerSettings {
  canvasWidth: number;
  canvasHeight: number;
  videoWidth: number;
  videoHeight: number;
  scanFrameSize: number;
  scanFrameOpacity: number;
  focusAreaPadding: number;
  minQRSize: number;
  maxQRSize: number;
}

/**
 * Calculate optimal scanner settings based on device configuration
 */
export function getOptimizedScannerSettings(
  config: ScannerConfig
): OptimizedScannerSettings {
  const { width, height, orientation, deviceType } = config;

  // Base settings
  let canvasWidth = width;
  let canvasHeight = height;
  let videoWidth = 1280;
  let videoHeight = 720;
  let scanFrameSize = Math.min(width, height) * 0.6;
  let scanFrameOpacity = 0.7;
  let focusAreaPadding = 20;
  let minQRSize = 30;
  let maxQRSize = 500;

  // Optimize for tablet devices
  if (deviceType === "tablet") {
    if (orientation === "landscape") {
      videoWidth = 1920;
      videoHeight = 1080;
      scanFrameSize = Math.min(width, height) * 0.5;
      focusAreaPadding = 30;
    } else {
      videoWidth = 1080;
      videoHeight = 1920;
      scanFrameSize = Math.min(width, height) * 0.65;
      focusAreaPadding = 25;
    }
  }

  // Optimize for phone devices
  if (deviceType === "phone") {
    videoWidth = 1280;
    videoHeight = 720;
    scanFrameSize = Math.min(width, height) * 0.7;
    focusAreaPadding = 15;
    minQRSize = 20;
  }

  // Optimize for desktop
  if (deviceType === "desktop") {
    videoWidth = 1920;
    videoHeight = 1080;
    scanFrameSize = Math.min(width, height) * 0.4;
    focusAreaPadding = 40;
    maxQRSize = 800;
  }

  return {
    canvasWidth,
    canvasHeight,
    videoWidth,
    videoHeight,
    scanFrameSize,
    scanFrameOpacity,
    focusAreaPadding,
    minQRSize,
    maxQRSize,
  };
}

/**
 * Calculate camera constraints for optimal QR scanning
 */
export function getCameraConstraints(
  deviceType: "phone" | "tablet" | "desktop"
): MediaStreamConstraints {
  const baseConstraints: MediaStreamConstraints = {
    video: {
      facingMode: "environment",
    },
    audio: false,
  };

  if (deviceType === "tablet") {
    return {
      video: {
        ...baseConstraints.video,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        focusMode: "continuous" as any,
      },
      audio: false,
    };
  }

  if (deviceType === "phone") {
    return {
      video: {
        ...baseConstraints.video,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };
  }

  return {
    video: {
      ...baseConstraints.video,
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };
}

/**
 * Calculate scan frame position and size for UI rendering
 */
export function calculateScanFrameGeometry(
  containerWidth: number,
  containerHeight: number,
  frameSize: number,
  padding: number
) {
  const frameX = (containerWidth - frameSize) / 2;
  const frameY = (containerHeight - frameSize) / 2;

  return {
    x: frameX,
    y: frameY,
    width: frameSize,
    height: frameSize,
    cornerSize: frameSize * 0.15,
    padding,
  };
}

/**
 * Detect if QR code is within optimal scan frame
 */
export function isQRInScanFrame(
  qrBounds: { x: number; y: number; width: number; height: number },
  scanFrame: { x: number; y: number; width: number; height: number }
): boolean {
  const qrCenterX = qrBounds.x + qrBounds.width / 2;
  const qrCenterY = qrBounds.y + qrBounds.height / 2;

  const frameCenterX = scanFrame.x + scanFrame.width / 2;
  const frameCenterY = scanFrame.y + scanFrame.height / 2;

  const distanceX = Math.abs(qrCenterX - frameCenterX);
  const distanceY = Math.abs(qrCenterY - frameCenterY);

  const tolerance = scanFrame.width * 0.3;

  return distanceX < tolerance && distanceY < tolerance;
}

/**
 * Calculate QR code size relative to scan frame
 */
export function calculateQRSizeRatio(
  qrWidth: number,
  scanFrameSize: number
): number {
  return (qrWidth / scanFrameSize) * 100;
}

/**
 * Get scanning quality feedback based on QR position and size
 */
export function getScanningQualityFeedback(
  qrBounds: { x: number; y: number; width: number; height: number },
  scanFrame: { x: number; y: number; width: number; height: number },
  minSize: number,
  maxSize: number
): {
  quality: "excellent" | "good" | "fair" | "poor";
  feedback: string;
  confidence: number;
} {
  const qrSize = qrBounds.width;
  const sizeRatio = calculateQRSizeRatio(qrSize, scanFrame.width);
  const isInFrame = isQRInScanFrame(qrBounds, scanFrame);

  let quality: "excellent" | "good" | "fair" | "poor" = "poor";
  let feedback = "";
  let confidence = 0;

  if (!isInFrame) {
    feedback = "Move QR code to center of frame";
    quality = "poor";
    confidence = 0.2;
  } else if (qrSize < minSize) {
    feedback = "Move closer to QR code";
    quality = "fair";
    confidence = 0.4;
  } else if (qrSize > maxSize) {
    feedback = "Move away from QR code";
    quality = "fair";
    confidence = 0.4;
  } else if (sizeRatio < 20) {
    feedback = "QR code too small, move closer";
    quality = "fair";
    confidence = 0.5;
  } else if (sizeRatio > 80) {
    feedback = "QR code too large, move away";
    quality = "fair";
    confidence = 0.5;
  } else if (sizeRatio >= 40 && sizeRatio <= 70) {
    feedback = "Perfect position";
    quality = "excellent";
    confidence = 0.95;
  } else {
    feedback = "Good position";
    quality = "good";
    confidence = 0.8;
  }

  return { quality, feedback, confidence };
}

/**
 * Optimize image data for QR detection
 */
export function optimizeImageDataForQR(
  imageData: ImageData,
  brightness: number = 1,
  contrast: number = 1
): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness
    data[i] = Math.min(255, data[i] * brightness);
    data[i + 1] = Math.min(255, data[i + 1] * brightness);
    data[i + 2] = Math.min(255, data[i + 2] * brightness);

    // Apply contrast
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const delta = avg - 128;

    data[i] = Math.max(0, Math.min(255, 128 + delta * contrast));
    data[i + 1] = Math.max(0, Math.min(255, 128 + delta * contrast));
    data[i + 2] = Math.max(0, Math.min(255, 128 + delta * contrast));
  }

  return imageData;
}

/**
 * Calculate adaptive scan interval based on device performance
 */
export function getAdaptiveScanInterval(
  deviceType: "phone" | "tablet" | "desktop"
): number {
  // Phone: scan every 100ms (10 FPS)
  // Tablet: scan every 50ms (20 FPS)
  // Desktop: scan every 33ms (30 FPS)

  switch (deviceType) {
    case "phone":
      return 100;
    case "tablet":
      return 50;
    case "desktop":
      return 33;
    default:
      return 50;
  }
}

/**
 * Get optimal video element sizing
 */
export function getOptimalVideoSizing(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number
): {
  displayWidth: number;
  displayHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
} {
  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;

  let displayWidth = containerWidth;
  let displayHeight = containerHeight;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > videoAspect) {
    // Container is wider
    displayHeight = containerHeight;
    displayWidth = containerHeight * videoAspect;
    offsetX = (containerWidth - displayWidth) / 2;
  } else {
    // Container is taller
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoAspect;
    offsetY = (containerHeight - displayHeight) / 2;
  }

  scale = displayWidth / videoWidth;

  return {
    displayWidth,
    displayHeight,
    scale,
    offsetX,
    offsetY,
  };
}
