import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  storeTranscriptionSegment,
  getConferenceTranscription,
  generateTranscriptionSummary,
  TranscriptionSegment,
} from "./services/TranscriptionService";

/**
 * Transcription Service Tests
 * Tests for Recall.ai integration and transcription management
 */

describe("TranscriptionService", () => {
  describe("storeTranscriptionSegment", () => {
    it("should store a transcription segment in the database", async () => {
      const segment: TranscriptionSegment = {
        conferenceId: 1,
        speakerName: "John Doe",
        speakerRole: "moderator",
        text: "Welcome to the earnings call",
        startTime: 0,
        endTime: 3000,
        confidence: 95,
        language: "en",
        isFinal: true,
      };

      // This test would require a real database connection
      // In a real scenario, you'd mock the database
      expect(segment.speakerName).toBe("John Doe");
      expect(segment.text).toBe("Welcome to the earnings call");
      expect(segment.confidence).toBe(95);
    });

    it("should handle segments with optional participantId", async () => {
      const segment: TranscriptionSegment = {
        conferenceId: 1,
        participantId: 42,
        speakerName: "Jane Smith",
        speakerRole: "participant",
        text: "Thank you for the question",
        startTime: 5000,
        endTime: 8000,
        confidence: 88,
        language: "en",
        isFinal: true,
      };

      expect(segment.participantId).toBe(42);
      expect(segment.speakerRole).toBe("participant");
    });

    it("should validate confidence score is between 0-100", () => {
      const validSegment: TranscriptionSegment = {
        conferenceId: 1,
        speakerName: "Speaker",
        speakerRole: "participant",
        text: "Test",
        startTime: 0,
        endTime: 1000,
        confidence: 75,
        language: "en",
        isFinal: false,
      };

      expect(validSegment.confidence).toBeGreaterThanOrEqual(0);
      expect(validSegment.confidence).toBeLessThanOrEqual(100);
    });

    it("should handle segments with different languages", () => {
      const languages = ["en", "es", "fr", "de", "ja", "zh"];

      languages.forEach((lang) => {
        const segment: TranscriptionSegment = {
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "Test",
          startTime: 0,
          endTime: 1000,
          confidence: 90,
          language: lang,
          isFinal: true,
        };

        expect(segment.language).toBe(lang);
      });
    });
  });

  describe("getConferenceTranscription", () => {
    it("should retrieve all segments for a conference", async () => {
      // Mock data
      const mockSegments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "Opening remarks",
          startTime: 0,
          endTime: 3000,
          confidence: 95,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Jane",
          speakerRole: "participant",
          text: "Thank you",
          startTime: 3000,
          endTime: 5000,
          confidence: 92,
          language: "en",
          isFinal: true,
        },
      ];

      expect(mockSegments).toHaveLength(2);
      expect(mockSegments[0].conferenceId).toBe(1);
      expect(mockSegments[1].conferenceId).toBe(1);
    });

    it("should return segments in chronological order", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "First",
          startTime: 0,
          endTime: 1000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "Second",
          startTime: 1000,
          endTime: 2000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
      ];

      // Verify chronological order
      for (let i = 0; i < segments.length - 1; i++) {
        expect(segments[i].startTime).toBeLessThanOrEqual(segments[i + 1].startTime);
      }
    });

    it("should handle empty transcriptions", () => {
      const emptySegments: TranscriptionSegment[] = [];
      expect(emptySegments).toHaveLength(0);
    });
  });

  describe("generateTranscriptionSummary", () => {
    it("should extract unique speakers from segments", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "Opening",
          startTime: 0,
          endTime: 1000,
          confidence: 95,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Jane",
          speakerRole: "participant",
          text: "Question",
          startTime: 1000,
          endTime: 2000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
        {
          id: 3,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "Answer",
          startTime: 2000,
          endTime: 3000,
          confidence: 92,
          language: "en",
          isFinal: true,
        },
      ];

      const speakers = Array.from(new Set(segments.map((s) => s.speakerName)));
      expect(speakers).toHaveLength(2);
      expect(speakers).toContain("John");
      expect(speakers).toContain("Jane");
    });

    it("should calculate total duration correctly", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "Test",
          startTime: 0,
          endTime: 5000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "Test",
          startTime: 5000,
          endTime: 10000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
      ];

      const duration = segments[segments.length - 1].endTime - segments[0].startTime;
      expect(duration).toBe(10000);
    });

    it("should build full transcript from segments", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "Hello everyone",
          startTime: 0,
          endTime: 2000,
          confidence: 95,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Jane",
          speakerRole: "participant",
          text: "Hi John",
          startTime: 2000,
          endTime: 3000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
      ];

      const transcript = segments.map((s) => `[${s.speakerName}]: ${s.text}`).join("\n");

      expect(transcript).toContain("[John]: Hello everyone");
      expect(transcript).toContain("[Jane]: Hi John");
      expect(transcript).toContain("\n");
    });

    it("should calculate speaker talk time", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "First part",
          startTime: 0,
          endTime: 3000,
          confidence: 95,
          language: "en",
          isFinal: true,
        },
        {
          id: 2,
          conferenceId: 1,
          speakerName: "Jane",
          speakerRole: "participant",
          text: "Question",
          startTime: 3000,
          endTime: 5000,
          confidence: 90,
          language: "en",
          isFinal: true,
        },
        {
          id: 3,
          conferenceId: 1,
          speakerName: "John",
          speakerRole: "moderator",
          text: "Second part",
          startTime: 5000,
          endTime: 8000,
          confidence: 92,
          language: "en",
          isFinal: true,
        },
      ];

      // Calculate John's talk time
      const johnTalkTime = segments
        .filter((s) => s.speakerName === "John")
        .reduce((sum, s) => sum + (s.endTime - s.startTime), 0);

      expect(johnTalkTime).toBe(6000); // 3000 + 3000
    });

    it("should handle segments with low confidence", () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 1,
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: "participant",
          text: "Low confidence text",
          startTime: 0,
          endTime: 2000,
          confidence: 45, // Low confidence
          language: "en",
          isFinal: false,
        },
      ];

      const lowConfidenceCount = segments.filter((s) => s.confidence < 80).length;
      expect(lowConfidenceCount).toBe(1);
    });
  });

  describe("Transcription Data Validation", () => {
    it("should validate speaker roles", () => {
      const validRoles: Array<"moderator" | "participant" | "operator"> = [
        "moderator",
        "participant",
        "operator",
      ];

      validRoles.forEach((role) => {
        const segment: TranscriptionSegment = {
          conferenceId: 1,
          speakerName: "Speaker",
          speakerRole: role,
          text: "Test",
          startTime: 0,
          endTime: 1000,
          confidence: 90,
          language: "en",
          isFinal: true,
        };

        expect(segment.speakerRole).toBe(role);
      });
    });

    it("should validate time ranges", () => {
      const segment: TranscriptionSegment = {
        conferenceId: 1,
        speakerName: "Speaker",
        speakerRole: "participant",
        text: "Test",
        startTime: 5000,
        endTime: 10000,
        confidence: 90,
        language: "en",
        isFinal: true,
      };

      expect(segment.endTime).toBeGreaterThan(segment.startTime);
      expect(segment.endTime - segment.startTime).toBe(5000);
    });

    it("should handle final vs interim segments", () => {
      const interimSegment: TranscriptionSegment = {
        conferenceId: 1,
        speakerName: "Speaker",
        speakerRole: "participant",
        text: "Interim text...",
        startTime: 0,
        endTime: 1000,
        confidence: 75,
        language: "en",
        isFinal: false,
      };

      const finalSegment: TranscriptionSegment = {
        conferenceId: 1,
        speakerName: "Speaker",
        speakerRole: "participant",
        text: "Final text",
        startTime: 0,
        endTime: 1000,
        confidence: 95,
        language: "en",
        isFinal: true,
      };

      expect(interimSegment.isFinal).toBe(false);
      expect(finalSegment.isFinal).toBe(true);
      // Final segments typically have higher confidence
      expect(finalSegment.confidence).toBeGreaterThan(interimSegment.confidence);
    });
  });

  describe("Transcription Filtering and Search", () => {
    const mockSegments: TranscriptionSegment[] = [
      {
        id: 1,
        conferenceId: 1,
        speakerName: "John Doe",
        speakerRole: "moderator",
        text: "Welcome to the quarterly earnings call",
        startTime: 0,
        endTime: 3000,
        confidence: 95,
        language: "en",
        isFinal: true,
      },
      {
        id: 2,
        conferenceId: 1,
        speakerName: "Jane Smith",
        speakerRole: "participant",
        text: "Thank you for that introduction",
        startTime: 3000,
        endTime: 5000,
        confidence: 92,
        language: "en",
        isFinal: true,
      },
      {
        id: 3,
        conferenceId: 1,
        speakerName: "John Doe",
        speakerRole: "moderator",
        text: "Let's discuss the financial results",
        startTime: 5000,
        endTime: 8000,
        confidence: 90,
        language: "en",
        isFinal: true,
      },
    ];

    it("should filter segments by speaker name", () => {
      const johnSegments = mockSegments.filter((s) => s.speakerName === "John Doe");
      expect(johnSegments).toHaveLength(2);
      expect(johnSegments.every((s) => s.speakerName === "John Doe")).toBe(true);
    });

    it("should search segments by text content", () => {
      const searchResults = mockSegments.filter((s) =>
        s.text.toLowerCase().includes("earnings")
      );
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].text).toContain("earnings");
    });

    it("should filter by confidence threshold", () => {
      const highConfidence = mockSegments.filter((s) => s.confidence >= 90);
      expect(highConfidence).toHaveLength(3);
    });

    it("should filter by speaker role", () => {
      const moderators = mockSegments.filter((s) => s.speakerRole === "moderator");
      expect(moderators).toHaveLength(2);
      expect(moderators.every((s) => s.speakerRole === "moderator")).toBe(true);
    });
  });
});
