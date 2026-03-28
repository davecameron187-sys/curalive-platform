/**
 * Webcast Session Manager Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createWebcastSession,
  getWebcastSession,
  updateWebcastSession,
  deleteWebcastSession,
  getWebcastSessionsByEvent,
  isWebcastSession,
  getSessionType,
  clearWebcastSessions,
  getWebcastSessionCount,
} from "./webcastSessionManager";

describe("Webcast Session Manager", () => {
  beforeEach(() => {
    clearWebcastSessions();
  });

  describe("createWebcastSession", () => {
    it("should create a standard session", () => {
      const session = createWebcastSession("session-1", "event-1", "standard");

      expect(session).toBeDefined();
      expect(session.sessionId).toBe("session-1");
      expect(session.eventId).toBe("event-1");
      expect(session.sessionType).toBe("standard");
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    it("should create a webcast session with URL", () => {
      const session = createWebcastSession(
        "session-2",
        "event-2",
        "webcast",
        "https://youtube.com/live/abc123",
        "youtube"
      );

      expect(session.sessionType).toBe("webcast");
      expect(session.webcastUrl).toBe("https://youtube.com/live/abc123");
      expect(session.webcastPlatform).toBe("youtube");
    });

    it("should create an audio-only session", () => {
      const session = createWebcastSession("session-3", "event-3", "audio-only");

      expect(session.sessionType).toBe("audio-only");
    });
  });

  describe("getWebcastSession", () => {
    it("should retrieve created session", () => {
      createWebcastSession("session-4", "event-4", "webcast");
      const retrieved = getWebcastSession("session-4");

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe("session-4");
    });

    it("should return undefined for non-existent session", () => {
      const retrieved = getWebcastSession("non-existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("updateWebcastSession", () => {
    it("should update session metadata", () => {
      createWebcastSession("session-5", "event-5", "standard");
      const updated = updateWebcastSession("session-5", {
        webcastUrl: "https://facebook.com/live/xyz",
        webcastPlatform: "facebook",
      });

      expect(updated?.webcastUrl).toBe("https://facebook.com/live/xyz");
      expect(updated?.webcastPlatform).toBe("facebook");
      expect(updated?.updatedAt).toBeGreaterThan(updated?.createdAt || 0);
    });

    it("should return undefined for non-existent session", () => {
      const updated = updateWebcastSession("non-existent", {});
      expect(updated).toBeUndefined();
    });
  });

  describe("deleteWebcastSession", () => {
    it("should delete session", () => {
      createWebcastSession("session-6", "event-6", "webcast");
      const deleted = deleteWebcastSession("session-6");

      expect(deleted).toBe(true);
      expect(getWebcastSession("session-6")).toBeUndefined();
    });

    it("should return false for non-existent session", () => {
      const deleted = deleteWebcastSession("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("getWebcastSessionsByEvent", () => {
    it("should retrieve all sessions for an event", () => {
      createWebcastSession("session-7", "event-7", "standard");
      createWebcastSession("session-8", "event-7", "webcast");
      createWebcastSession("session-9", "event-8", "audio-only");

      const event7Sessions = getWebcastSessionsByEvent("event-7");

      expect(event7Sessions).toHaveLength(2);
      expect(event7Sessions.map((s) => s.sessionId)).toContain("session-7");
      expect(event7Sessions.map((s) => s.sessionId)).toContain("session-8");
    });

    it("should return empty array for event with no sessions", () => {
      const sessions = getWebcastSessionsByEvent("non-existent-event");
      expect(sessions).toHaveLength(0);
    });
  });

  describe("isWebcastSession", () => {
    it("should return true for webcast session", () => {
      createWebcastSession("session-10", "event-10", "webcast");
      expect(isWebcastSession("session-10")).toBe(true);
    });

    it("should return true for audio-only session", () => {
      createWebcastSession("session-11", "event-11", "audio-only");
      expect(isWebcastSession("session-11")).toBe(true);
    });

    it("should return false for standard session", () => {
      createWebcastSession("session-12", "event-12", "standard");
      expect(isWebcastSession("session-12")).toBe(false);
    });

    it("should return false for non-existent session", () => {
      expect(isWebcastSession("non-existent")).toBe(false);
    });
  });

  describe("getSessionType", () => {
    it("should return correct session type", () => {
      createWebcastSession("session-13", "event-13", "webcast");
      createWebcastSession("session-14", "event-14", "audio-only");
      createWebcastSession("session-15", "event-15", "standard");

      expect(getSessionType("session-13")).toBe("webcast");
      expect(getSessionType("session-14")).toBe("audio-only");
      expect(getSessionType("session-15")).toBe("standard");
    });

    it("should return undefined for non-existent session", () => {
      expect(getSessionType("non-existent")).toBeUndefined();
    });
  });

  describe("clearWebcastSessions", () => {
    it("should clear all sessions", () => {
      createWebcastSession("session-16", "event-16", "webcast");
      createWebcastSession("session-17", "event-17", "audio-only");

      clearWebcastSessions();

      expect(getWebcastSessionCount()).toBe(0);
      expect(getWebcastSession("session-16")).toBeUndefined();
      expect(getWebcastSession("session-17")).toBeUndefined();
    });
  });

  describe("getWebcastSessionCount", () => {
    it("should return correct session count", () => {
      expect(getWebcastSessionCount()).toBe(0);

      createWebcastSession("session-18", "event-18", "webcast");
      expect(getWebcastSessionCount()).toBe(1);

      createWebcastSession("session-19", "event-19", "audio-only");
      expect(getWebcastSessionCount()).toBe(2);

      deleteWebcastSession("session-18");
      expect(getWebcastSessionCount()).toBe(1);
    });
  });

  describe("Multiple platforms", () => {
    it("should support YouTube webcast", () => {
      const session = createWebcastSession(
        "session-20",
        "event-20",
        "webcast",
        "https://youtube.com/live/abc",
        "youtube"
      );

      expect(session.webcastPlatform).toBe("youtube");
    });

    it("should support Facebook webcast", () => {
      const session = createWebcastSession(
        "session-21",
        "event-21",
        "webcast",
        "https://facebook.com/live/xyz",
        "facebook"
      );

      expect(session.webcastPlatform).toBe("facebook");
    });

    it("should support custom RTMP", () => {
      const session = createWebcastSession(
        "session-22",
        "event-22",
        "webcast",
        "rtmp://custom.server/live/stream",
        "custom-rtmp"
      );

      expect(session.webcastPlatform).toBe("custom-rtmp");
    });
  });
});
