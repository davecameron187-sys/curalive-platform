/**
 * useKeyboardShortcuts Hook — Operator Keyboard Shortcuts
 * 
 * Provides hotkeys for common operator actions:
 * - M: Mute all participants
 * - A: Approve next pending Q&A
 * - R: Reject next pending Q&A
 * - S: Save notes
 * - E: Export session
 * - H: Handoff session
 * - ?: Show shortcuts help
 */

import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onMuteAll?: () => void;
  onApproveQA?: () => void;
  onRejectQA?: () => void;
  onSaveNotes?: () => void;
  onExport?: () => void;
  onHandoff?: () => void;
  onShowHelp?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isInputElement) {
        return;
      }

      // Check for modifier keys (prevent conflicts with browser shortcuts)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          handlers.onMuteAll?.();
          console.log("[Shortcuts] Mute All triggered");
          break;

        case "a":
          event.preventDefault();
          handlers.onApproveQA?.();
          console.log("[Shortcuts] Approve Q&A triggered");
          break;

        case "r":
          event.preventDefault();
          handlers.onRejectQA?.();
          console.log("[Shortcuts] Reject Q&A triggered");
          break;

        case "s":
          event.preventDefault();
          handlers.onSaveNotes?.();
          console.log("[Shortcuts] Save Notes triggered");
          break;

        case "e":
          event.preventDefault();
          handlers.onExport?.();
          console.log("[Shortcuts] Export triggered");
          break;

        case "h":
          event.preventDefault();
          handlers.onHandoff?.();
          console.log("[Shortcuts] Handoff triggered");
          break;

        case "?":
          event.preventDefault();
          handlers.onShowHelp?.();
          console.log("[Shortcuts] Show Help triggered");
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: "M", action: "Mute all participants" },
  { key: "A", action: "Approve next pending Q&A" },
  { key: "R", action: "Reject next pending Q&A" },
  { key: "S", action: "Save notes" },
  { key: "E", action: "Export session" },
  { key: "H", action: "Handoff session" },
  { key: "?", action: "Show this help dialog" },
];
