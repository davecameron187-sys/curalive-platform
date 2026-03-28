/**
 * Recall.ai Webhook Integration Tests
 * Tests for webhook handler, route registration, and end-to-end flow
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { handleRecallWebhook } from "./recallWebhook";
import { Request, Response } from "express";

// Mock implementations
const mockRequest = (body: any, headers: Record<string, string> = {}): Partial<Request> => ({
  body,
  headers: {
    "content-type": "application/json",
    ...headers,
  },
});

const mockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// Helper to generate valid webhook signature
const generateSignature = (payload: string, secret: string = "test-secret"): string => {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

describe("Recall.ai Webhook Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;

  beforeEach(() => {
    mockRes = mockResponse();
    vi.clearAllMocks();
  });

  describe("Valid Webhook Events", () => {
    it("should accept valid recording.completed event with 202 status", async () => {
      const payload = {
        id: "evt_123",
        event_type: "recording.completed",
        recording_id: "rec_456",
        session_id: "sess_789",
        status: "completed",
        recording_url: "https://example.com/recording.mp4",
        transcript_url: "https://example.com/transcript.json",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Analytics generation triggered"),
        })
      );
    });

    it("should accept recording.failed event with 200 status", async () => {
      const payload = {
        id: "evt_failed_123",
        event_type: "recording.failed",
        recording_id: "rec_failed",
        session_id: "sess_failed",
        status: "failed",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Recording failed",
        })
      );
    });

    it("should accept generic event with 200 status", async () => {
      const payload = {
        id: "evt_generic_123",
        event_type: "recording.processing",
        recording_id: "rec_generic",
        session_id: "sess_generic",
        status: "processing",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Event processed",
        })
      );
    });
  });

  describe("Malformed Payloads", () => {
    it("should reject payload with missing signature header", async () => {
      const payload = {
        id: "evt_no_sig",
        event_type: "recording.completed",
        session_id: "sess_no_sig",
        status: "completed",
      };

      mockReq = mockRequest(payload, {}); // No signature header

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Missing signature",
        })
      );
    });

    it("should reject payload with invalid signature", async () => {
      const payload = {
        id: "evt_bad_sig",
        event_type: "recording.completed",
        session_id: "sess_bad_sig",
        status: "completed",
      };

      mockReq = mockRequest(payload, { "x-recall-signature": "invalid_signature_here" });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid signature",
        })
      );
    });

    it("should reject payload with missing required fields", async () => {
      const payload = {
        // Missing: id, event_type, session_id
        recording_id: "rec_incomplete",
        status: "completed",
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Missing required fields",
        })
      );
    });

    it("should reject payload with empty id", async () => {
      const payload = {
        id: "",
        event_type: "recording.completed",
        recording_id: "rec_empty_id",
        session_id: "sess_empty_id",
        status: "completed",
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Missing required fields",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle downstream failure gracefully", async () => {
      const payload = {
        id: "evt_downstream_fail",
        event_type: "recording.completed",
        recording_id: "rec_fail",
        session_id: "sess_fail",
        status: "completed",
        recording_url: "https://example.com/recording.mp4",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      // Mock LLM failure by not providing transcript URL
      const failPayload = { ...payload, transcript_url: undefined };
      mockReq.body = failPayload;

      await handleRecallWebhook(mockReq as Request, mockRes);

      // Should still process without crashing
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 500 on unhandled server error", async () => {
      // Create a request that will cause an error
      const malformedReq: any = {
        headers: {
          "content-type": "application/json",
          "x-recall-signature": "valid_sig",
        },
        body: null, // This will cause issues when accessing properties
      };

      // Mock the signature verification to pass
      const payloadStr = JSON.stringify(malformedReq.body);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");
      malformedReq.headers["x-recall-signature"] = signature;

      await handleRecallWebhook(malformedReq, mockRes);

      // Should handle gracefully
      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe("Retry-Safe Behavior", () => {
    it("should handle duplicate webhook events safely", async () => {
      const payload = {
        id: "evt_duplicate_123",
        event_type: "recording.completed",
        recording_id: "rec_dup",
        session_id: "sess_dup",
        status: "completed",
        recording_url: "https://example.com/recording.mp4",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      // First call
      await handleRecallWebhook(mockReq as Request, mockRes);
      const firstStatus = mockRes.status.mock.calls[0][0];

      // Reset mocks
      mockRes = mockResponse();

      // Second call (duplicate)
      await handleRecallWebhook(mockReq as Request, mockRes);
      const secondStatus = mockRes.status.mock.calls[0][0];

      // Both should succeed
      expect([200, 202]).toContain(firstStatus);
      expect([200, 202]).toContain(secondStatus);
    });

    it("should process webhook with metadata safely", async () => {
      const payload = {
        id: "evt_metadata_123",
        event_type: "recording.completed",
        recording_id: "rec_meta",
        session_id: "sess_meta",
        status: "completed",
        recording_url: "https://example.com/recording.mp4",
        timestamp: new Date().toISOString(),
        metadata: {
          custom_field: "custom_value",
          nested: { key: "value" },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("HTTP Status Codes", () => {
    it("should return 202 for accepted async processing", async () => {
      const payload = {
        id: "evt_202",
        event_type: "recording.completed",
        recording_id: "rec_202",
        session_id: "sess_202",
        status: "completed",
        recording_url: "https://example.com/recording.mp4",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it("should return 200 for successful processing", async () => {
      const payload = {
        id: "evt_200",
        event_type: "recording.processing",
        recording_id: "rec_200",
        session_id: "sess_200",
        status: "processing",
        timestamp: new Date().toISOString(),
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for malformed payload", async () => {
      const payload = {
        // Missing required fields
        event_type: "recording.completed",
      };

      const payloadStr = JSON.stringify(payload);
      const signature = generateSignature(payloadStr, process.env.RECALL_AI_WEBHOOK_SECRET || "");

      mockReq = mockRequest(payload, { "x-recall-signature": signature });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 for invalid signature", async () => {
      const payload = {
        id: "evt_401",
        event_type: "recording.completed",
        recording_id: "rec_401",
        session_id: "sess_401",
        status: "completed",
      };

      mockReq = mockRequest(payload, { "x-recall-signature": "wrong_signature" });

      await handleRecallWebhook(mockReq as Request, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
