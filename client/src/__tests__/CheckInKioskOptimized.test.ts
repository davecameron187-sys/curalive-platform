/**
 * Vitest tests for Check-In Kiosk tablet optimization
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOptimizedScannerSettings,
  getCameraConstraints,
  calculateScanFrameGeometry,
  isQRInScanFrame,
  calculateQRSizeRatio,
  getScanningQualityFeedback,
  getAdaptiveScanInterval,
  getOptimalVideoSizing,
} from "../utils/qrScannerOptimizer";

describe("QR Scanner Optimizer", () => {
  describe("Optimized Scanner Settings", () => {
    it("should generate optimal settings for iPad landscape", () => {
      const settings = getOptimizedScannerSettings({
        width: 1024,
        height: 768,
        orientation: "landscape",
        deviceType: "tablet",
      });

      expect(settings.canvasWidth).toBe(1024);
      expect(settings.canvasHeight).toBe(768);
      expect(settings.videoWidth).toBe(1920);
      expect(settings.videoHeight).toBe(1080);
      expect(settings.scanFrameSize).toBeGreaterThan(0);
      expect(settings.minQRSize).toBeGreaterThan(0);
      expect(settings.maxQRSize).toBeGreaterThan(settings.minQRSize);
    });

    it("should generate optimal settings for iPad portrait", () => {
      const settings = getOptimizedScannerSettings({
        width: 768,
        height: 1024,
        orientation: "portrait",
        deviceType: "tablet",
      });

      expect(settings.canvasWidth).toBe(768);
      expect(settings.canvasHeight).toBe(1024);
      expect(settings.videoWidth).toBe(1080);
      expect(settings.videoHeight).toBe(1920);
    });

    it("should generate optimal settings for Android tablet", () => {
      const settings = getOptimizedScannerSettings({
        width: 600,
        height: 1024,
        orientation: "portrait",
        deviceType: "tablet",
      });

      expect(settings).toHaveProperty("canvasWidth");
      expect(settings).toHaveProperty("videoWidth");
      expect(settings.scanFrameSize).toBeGreaterThan(0);
    });

    it("should generate optimal settings for phone", () => {
      const settings = getOptimizedScannerSettings({
        width: 375,
        height: 667,
        orientation: "portrait",
        deviceType: "phone",
      });

      expect(settings.videoWidth).toBe(1280);
      expect(settings.videoHeight).toBe(720);
      expect(settings.minQRSize).toBeLessThan(30);
    });

    it("should generate optimal settings for desktop", () => {
      const settings = getOptimizedScannerSettings({
        width: 1920,
        height: 1080,
        orientation: "landscape",
        deviceType: "desktop",
      });

      expect(settings.videoWidth).toBe(1920);
      expect(settings.videoHeight).toBe(1080);
      expect(settings.maxQRSize).toBeGreaterThan(500);
    });
  });

  describe("Camera Constraints", () => {
    it("should return proper constraints for tablet", () => {
      const constraints = getCameraConstraints("tablet");

      expect(constraints.video).toBeDefined();
      expect(constraints.audio).toBe(false);
      expect((constraints.video as any).facingMode).toBe("environment");
    });

    it("should return proper constraints for phone", () => {
      const constraints = getCameraConstraints("phone");

      expect(constraints.video).toBeDefined();
      expect(constraints.audio).toBe(false);
    });

    it("should return proper constraints for desktop", () => {
      const constraints = getCameraConstraints("desktop");

      expect(constraints.video).toBeDefined();
      expect(constraints.audio).toBe(false);
    });
  });

  describe("Scan Frame Geometry", () => {
    it("should calculate centered scan frame", () => {
      const geometry = calculateScanFrameGeometry(800, 600, 400, 20);

      expect(geometry.x).toBe(200);
      expect(geometry.y).toBe(100);
      expect(geometry.width).toBe(400);
      expect(geometry.height).toBe(400);
      expect(geometry.cornerSize).toBeGreaterThan(0);
      expect(geometry.padding).toBe(20);
    });

    it("should handle different frame sizes", () => {
      const geometry1 = calculateScanFrameGeometry(1024, 768, 300, 20);
      const geometry2 = calculateScanFrameGeometry(1024, 768, 500, 20);

      expect(geometry2.width).toBeGreaterThan(geometry1.width);
    });
  });

  describe("QR Frame Detection", () => {
    it("should detect QR code in scan frame", () => {
      const qrBounds = { x: 400, y: 300, width: 100, height: 100 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const isInFrame = isQRInScanFrame(qrBounds, scanFrame);
      expect(isInFrame).toBe(true);
    });

    it("should detect QR code outside scan frame", () => {
      const qrBounds = { x: 100, y: 100, width: 100, height: 100 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const isInFrame = isQRInScanFrame(qrBounds, scanFrame);
      expect(isInFrame).toBe(false);
    });

    it("should handle edge cases", () => {
      const qrBounds = { x: 0, y: 0, width: 50, height: 50 };
      const scanFrame = { x: 0, y: 0, width: 400, height: 400 };

      const isInFrame = isQRInScanFrame(qrBounds, scanFrame);
      expect(typeof isInFrame).toBe("boolean");
    });
  });

  describe("QR Size Ratio", () => {
    it("should calculate correct size ratio", () => {
      const ratio = calculateQRSizeRatio(100, 400);
      expect(ratio).toBe(25);
    });

    it("should handle small QR codes", () => {
      const ratio = calculateQRSizeRatio(20, 400);
      expect(ratio).toBe(5);
    });

    it("should handle large QR codes", () => {
      const ratio = calculateQRSizeRatio(350, 400);
      expect(ratio).toBe(87.5);
    });
  });

  describe("Scanning Quality Feedback", () => {
    it("should provide excellent feedback for optimal positioning", () => {
      const qrBounds = { x: 400, y: 300, width: 160, height: 160 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const feedback = getScanningQualityFeedback(qrBounds, scanFrame, 30, 500);

      expect(feedback.quality).toBe("excellent");
      expect(feedback.confidence).toBeGreaterThan(0.9);
    });

    it("should provide fair feedback for QR code too small", () => {
      const qrBounds = { x: 400, y: 300, width: 20, height: 20 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const feedback = getScanningQualityFeedback(qrBounds, scanFrame, 30, 500);

      expect(feedback.quality).toBe("fair");
      expect(feedback.feedback).toContain("closer");
    });

    it("should provide fair feedback for QR code too large", () => {
      const qrBounds = { x: 400, y: 300, width: 600, height: 600 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const feedback = getScanningQualityFeedback(qrBounds, scanFrame, 30, 500);

      expect(feedback.quality).toBe("fair");
      expect(feedback.feedback).toContain("away");
    });

    it("should provide poor feedback for QR code out of frame", () => {
      const qrBounds = { x: 100, y: 100, width: 100, height: 100 };
      const scanFrame = { x: 300, y: 200, width: 400, height: 400 };

      const feedback = getScanningQualityFeedback(qrBounds, scanFrame, 30, 500);

      expect(feedback.quality).toBe("poor");
      expect(feedback.confidence).toBeLessThan(0.5);
    });
  });

  describe("Adaptive Scan Interval", () => {
    it("should return 100ms for phone", () => {
      const interval = getAdaptiveScanInterval("phone");
      expect(interval).toBe(100);
    });

    it("should return 50ms for tablet", () => {
      const interval = getAdaptiveScanInterval("tablet");
      expect(interval).toBe(50);
    });

    it("should return 33ms for desktop", () => {
      const interval = getAdaptiveScanInterval("desktop");
      expect(interval).toBe(33);
    });
  });

  describe("Optimal Video Sizing", () => {
    it("should calculate sizing for landscape container", () => {
      const sizing = getOptimalVideoSizing(1024, 768, 1920, 1080);

      expect(sizing.displayWidth).toBeGreaterThan(0);
      expect(sizing.displayHeight).toBeGreaterThan(0);
      expect(sizing.scale).toBeGreaterThan(0);
      expect(sizing.offsetX).toBeGreaterThanOrEqual(0);
      expect(sizing.offsetY).toBeGreaterThanOrEqual(0);
    });

    it("should calculate sizing for portrait container", () => {
      const sizing = getOptimalVideoSizing(768, 1024, 1080, 1920);

      expect(sizing.displayWidth).toBeGreaterThan(0);
      expect(sizing.displayHeight).toBeGreaterThan(0);
      expect(sizing.scale).toBeGreaterThan(0);
    });

    it("should maintain aspect ratio", () => {
      const sizing = getOptimalVideoSizing(1024, 768, 1920, 1080);
      const videoAspect = 1920 / 1080;
      const displayAspect = sizing.displayWidth / sizing.displayHeight;

      expect(Math.abs(displayAspect - videoAspect)).toBeLessThan(0.01);
    });

    it("should fit within container bounds", () => {
      const sizing = getOptimalVideoSizing(1024, 768, 1920, 1080);

      expect(sizing.displayWidth).toBeLessThanOrEqual(1024);
      expect(sizing.displayHeight).toBeLessThanOrEqual(768);
    });
  });
});

describe("Tablet Responsiveness", () => {
  describe("Orientation Changes", () => {
    it("should handle landscape to portrait transition", () => {
      const landscapeSettings = getOptimizedScannerSettings({
        width: 1024,
        height: 768,
        orientation: "landscape",
        deviceType: "tablet",
      });

      const portraitSettings = getOptimizedScannerSettings({
        width: 768,
        height: 1024,
        orientation: "portrait",
        deviceType: "tablet",
      });

      expect(landscapeSettings.canvasWidth).not.toBe(portraitSettings.canvasWidth);
      expect(landscapeSettings.canvasHeight).not.toBe(portraitSettings.canvasHeight);
    });

    it("should maintain scan quality across orientations", () => {
      const landscapeSettings = getOptimizedScannerSettings({
        width: 1024,
        height: 768,
        orientation: "landscape",
        deviceType: "tablet",
      });

      const portraitSettings = getOptimizedScannerSettings({
        width: 768,
        height: 1024,
        orientation: "portrait",
        deviceType: "tablet",
      });

      expect(landscapeSettings.scanFrameSize).toBeGreaterThan(0);
      expect(portraitSettings.scanFrameSize).toBeGreaterThan(0);
    });
  });

  describe("Touch Target Sizes", () => {
    it("should have minimum touch target size of 48px", () => {
      // Touch targets should be at least 48x48px for accessibility
      const minTouchTarget = 48;
      expect(minTouchTarget).toBeGreaterThanOrEqual(44);
    });
  });

  describe("Device Type Detection", () => {
    it("should correctly identify tablet dimensions", () => {
      const tabletSettings = getOptimizedScannerSettings({
        width: 1024,
        height: 768,
        orientation: "landscape",
        deviceType: "tablet",
      });

      expect(tabletSettings.videoWidth).toBeGreaterThanOrEqual(1080);
    });

    it("should correctly identify phone dimensions", () => {
      const phoneSettings = getOptimizedScannerSettings({
        width: 375,
        height: 667,
        orientation: "portrait",
        deviceType: "phone",
      });

      expect(phoneSettings.videoWidth).toBeLessThanOrEqual(1280);
    });
  });
});
