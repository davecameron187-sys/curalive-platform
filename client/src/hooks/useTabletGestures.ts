/**
 * useTabletGestures Hook
 * Provides touch gesture handling for tablet devices
 * Supports: tap, long-press, swipe, pinch-to-zoom
 */
import { useEffect, useRef, useState } from "react";

export interface GestureConfig {
  onTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onSwipe?: (direction: "up" | "down" | "left" | "right") => void;
  onPinch?: (scale: number) => void;
  longPressDuration?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

export function useTabletGestures(
  elementRef: React.RefObject<HTMLElement>,
  config: GestureConfig
) {
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    touches: number;
  } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMultiTouch, setIsMultiTouch] = useState(false);

  const {
    onTap,
    onLongPress,
    onSwipe,
    onPinch,
    longPressDuration = 500,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
  } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          touches: 1,
        };
        setIsMultiTouch(false);

        // Set long press timer
        longPressTimerRef.current = setTimeout(() => {
          if (onLongPress && touchStartRef.current) {
            onLongPress(touchStartRef.current.x, touchStartRef.current.y);
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
        }, longPressDuration);
      } else if (e.touches.length === 2) {
        // Multi-touch detected
        setIsMultiTouch(true);
        // Clear long press timer on multi-touch
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      }
    };

    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Handle pinch-to-zoom
      if (e.touches.length === 2 && onPinch) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (touchStartRef.current) {
          const startDistance = Math.hypot(
            (touchStartRef.current as any).x2 - touchStartRef.current.x,
            (touchStartRef.current as any).y2 - touchStartRef.current.y
          );

          if (startDistance > 0) {
            const scale = distance / startDistance;
            if (Math.abs(scale - 1) > pinchThreshold) {
              onPinch(scale);
            }
          }
        }
      }
    };

    // Handle touch end
    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      if (!touchStartRef.current) return;

      const touchEnd = {
        x: e.changedTouches[0]?.clientX || touchStartRef.current.x,
        y: e.changedTouches[0]?.clientY || touchStartRef.current.y,
        time: Date.now(),
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const deltaTime = touchEnd.time - touchStartRef.current.time;

      // Detect tap (short duration, minimal movement)
      if (deltaTime < longPressDuration && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (onTap) {
          onTap(touchStartRef.current.x, touchStartRef.current.y);
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(20);
          }
        }
      }

      // Detect swipe (fast movement, significant distance)
      if (deltaTime < 300 && (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold)) {
        if (onSwipe) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            onSwipe(deltaX > 0 ? "right" : "left");
          } else {
            // Vertical swipe
            onSwipe(deltaY > 0 ? "down" : "up");
          }
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(30);
          }
        }
      }

      touchStartRef.current = null;
      setIsMultiTouch(false);
    };

    // Handle touch cancel
    const handleTouchCancel = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      touchStartRef.current = null;
      setIsMultiTouch(false);
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [elementRef, onTap, onLongPress, onSwipe, onPinch, longPressDuration, swipeThreshold, pinchThreshold]);

  return { isMultiTouch };
}

/**
 * Hook for detecting screen orientation
 */
export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait"
      );
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook for detecting device type
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<"phone" | "tablet" | "desktop">(
    getDeviceType()
  );

  function getDeviceType(): "phone" | "tablet" | "desktop" {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    if (width < 768) {
      return "phone";
    } else if (width < 1024 || (isPortrait && width < 1024)) {
      return "tablet";
    } else {
      return "desktop";
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return deviceType;
}

/**
 * Hook for safe area insets (notch support)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const root = document.documentElement;
      setInsets({
        top: parseInt(
          getComputedStyle(root).getPropertyValue("--safe-area-inset-top") || "0"
        ),
        right: parseInt(
          getComputedStyle(root).getPropertyValue("--safe-area-inset-right") || "0"
        ),
        bottom: parseInt(
          getComputedStyle(root).getPropertyValue("--safe-area-inset-bottom") || "0"
        ),
        left: parseInt(
          getComputedStyle(root).getPropertyValue("--safe-area-inset-left") || "0"
        ),
      });
    };

    updateInsets();
    window.addEventListener("resize", updateInsets);

    return () => {
      window.removeEventListener("resize", updateInsets);
    };
  }, []);

  return insets;
}
