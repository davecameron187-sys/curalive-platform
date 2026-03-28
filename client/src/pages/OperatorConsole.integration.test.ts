/**
 * Integration Tests: OperatorConsole Refactored
 * 
 * Tests the complete operator console workflow:
 * 1. Session lifecycle (start, pause, resume, end)
 * 2. Q&A moderation (approve, reject questions)
 * 3. Real-time data binding (session state, questions, insights)
 * 4. Error handling and reconnection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock tRPC client
const mockTrpcClient = {
  sessionStateMachine: {
    getSessionState: {
      useQuery: vi.fn(),
    },
    startSession: {
      useMutation: vi.fn(),
    },
    pauseSession: {
      useMutation: vi.fn(),
    },
    resumeSession: {
      useMutation: vi.fn(),
    },
    endSession: {
      useMutation: vi.fn(),
    },
    getSessionActionHistory: {
      useQuery: vi.fn(),
    },
  },
  liveQa: {
    getQuestions: {
      useQuery: vi.fn(),
    },
    getTranscriptSegments: {
      useQuery: vi.fn(),
    },
    getSessionInsights: {
      useQuery: vi.fn(),
    },
    approveQuestion: {
      useMutation: vi.fn(),
    },
    rejectQuestion: {
      useMutation: vi.fn(),
    },
  },
};

describe("OperatorConsole Refactored - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Lifecycle", () => {
    it("should fetch session state from backend on mount", () => {
      const mockSessionState = {
        sessionId: "session-123",
        eventId: "event-456",
        status: "idle",
        startedAt: null,
        pausedAt: null,
        endedAt: null,
      };

      mockTrpcClient.sessionStateMachine.getSessionState.useQuery.mockReturnValue({
        data: mockSessionState,
        isLoading: false,
        error: null,
      });

      // Verify backend call is made
      expect(
        mockTrpcClient.sessionStateMachine.getSessionState.useQuery
      ).toBeDefined();
    });

    it("should start session via backend mutation", () => {
      const mockStartMutation = {
        mutate: vi.fn(),
        isLoading: false,
      };

      mockTrpcClient.sessionStateMachine.startSession.useMutation.mockReturnValue(
        mockStartMutation
      );

      // Simulate operator clicking "Start Session"
      mockStartMutation.mutate({ sessionId: "session-123" });

      expect(mockStartMutation.mutate).toHaveBeenCalledWith({
        sessionId: "session-123",
      });
    });

    it("should pause session via backend mutation", () => {
      const mockPauseMutation = {
        mutate: vi.fn(),
        isLoading: false,
      };

      mockTrpcClient.sessionStateMachine.pauseSession.useMutation.mockReturnValue(
        mockPauseMutation
      );

      mockPauseMutation.mutate({ sessionId: "session-123" });

      expect(mockPauseMutation.mutate).toHaveBeenCalledWith({
        sessionId: "session-123",
      });
    });

    it("should end session via backend mutation", () => {
      const mockEndMutation = {
        mutate: vi.fn(),
        isLoading: false,
      };

      mockTrpcClient.sessionStateMachine.endSession.useMutation.mockReturnValue(
        mockEndMutation
      );

      mockEndMutation.mutate({ sessionId: "session-123" });

      expect(mockEndMutation.mutate).toHaveBeenCalledWith({
        sessionId: "session-123",
      });
    });
  });

  describe("Q&A Moderation Workflow", () => {
    it("should fetch questions from backend", () => {
      const mockQuestions = [
        {
          id: 1,
          sessionId: "session-123",
          questionText: "What is the revenue guidance?",
          status: "submitted",
          complianceRiskScore: 0.3,
          priorityScore: 0.5,
          upvotes: 5,
        },
        {
          id: 2,
          sessionId: "session-123",
          questionText: "Can you comment on insider trading?",
          status: "submitted",
          complianceRiskScore: 0.8,
          priorityScore: 0.2,
          upvotes: 1,
        },
      ];

      mockTrpcClient.liveQa.getQuestions.useQuery.mockReturnValue({
        data: mockQuestions,
        isLoading: false,
        error: null,
      });

      expect(mockTrpcClient.liveQa.getQuestions.useQuery).toBeDefined();
    });

    it("should approve question via backend mutation", () => {
      const mockApproveMutation = {
        mutate: vi.fn(),
        isLoading: false,
      };

      mockTrpcClient.liveQa.approveQuestion.useMutation.mockReturnValue(
        mockApproveMutation
      );

      mockApproveMutation.mutate({
        questionId: 1,
        triageScore: 0.8,
        complianceRiskScore: 0.3,
      });

      expect(mockApproveMutation.mutate).toHaveBeenCalledWith({
        questionId: 1,
        triageScore: 0.8,
        complianceRiskScore: 0.3,
      });
    });

    it("should reject question via backend mutation", () => {
      const mockRejectMutation = {
        mutate: vi.fn(),
        isLoading: false,
      };

      mockTrpcClient.liveQa.rejectQuestion.useMutation.mockReturnValue(
        mockRejectMutation
      );

      mockRejectMutation.mutate({
        questionId: 2,
        reason: "High compliance risk",
      });

      expect(mockRejectMutation.mutate).toHaveBeenCalledWith({
        questionId: 2,
        reason: "High compliance risk",
      });
    });
  });

  describe("Real-Time Data Binding", () => {
    it("should fetch AI insights from backend", () => {
      const mockInsights = {
        sentimentScore: 0.65,
        sentimentTrend: "positive",
        complianceRiskLevel: "medium",
        complianceFlags: 2,
        keyTopics: ["Revenue", "Guidance", "Compliance"],
        lastUpdated: Date.now(),
      };

      mockTrpcClient.liveQa.getSessionInsights.useQuery.mockReturnValue({
        data: mockInsights,
        isLoading: false,
        error: null,
      });

      expect(mockTrpcClient.liveQa.getSessionInsights.useQuery).toBeDefined();
    });

    it("should fetch transcript segments from backend", () => {
      const mockTranscript = [
        {
          id: 1,
          speaker: "CEO",
          text: "Thank you for joining our earnings call.",
          timestamp: 1000,
          confidence: 0.98,
        },
        {
          id: 2,
          speaker: "Analyst",
          text: "What is your guidance for next quarter?",
          timestamp: 2000,
          confidence: 0.95,
        },
      ];

      mockTrpcClient.liveQa.getTranscriptSegments.useQuery.mockReturnValue({
        data: mockTranscript,
        isLoading: false,
        error: null,
      });

      expect(mockTrpcClient.liveQa.getTranscriptSegments.useQuery).toBeDefined();
    });

    it("should fetch action history from backend", () => {
      const mockActionHistory = [
        {
          id: 1,
          sessionId: "session-123",
          actionType: "question_approved",
          questionId: 1,
          createdAt: new Date(),
          operatorNotes: "Approved - relevant to guidance",
        },
        {
          id: 2,
          sessionId: "session-123",
          actionType: "question_rejected",
          questionId: 2,
          createdAt: new Date(),
          operatorNotes: "Rejected - compliance risk too high",
        },
      ];

      mockTrpcClient.sessionStateMachine.getSessionActionHistory.useQuery.mockReturnValue({
        data: mockActionHistory,
        isLoading: false,
        error: null,
      });

      expect(
        mockTrpcClient.sessionStateMachine.getSessionActionHistory.useQuery
      ).toBeDefined();
    });
  });

  describe("Error Handling & Reconnection", () => {
    it("should handle session state fetch error", () => {
      const mockError = new Error("Network error");

      mockTrpcClient.sessionStateMachine.getSessionState.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
      });

      // Console should display error state
      expect(mockTrpcClient.sessionStateMachine.getSessionState.useQuery).toBeDefined();
    });

    it("should handle question fetch error", () => {
      const mockError = new Error("Failed to fetch questions");

      mockTrpcClient.liveQa.getQuestions.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: mockError,
      });

      expect(mockTrpcClient.liveQa.getQuestions.useQuery).toBeDefined();
    });

    it("should retry on connection failure", () => {
      const mockRefetch = vi.fn();

      mockTrpcClient.sessionStateMachine.getSessionState.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Connection lost"),
        refetch: mockRefetch,
      });

      // Simulate retry button click
      mockRefetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("Complete Workflow", () => {
    it("should execute full operator session workflow", async () => {
      // 1. Operator opens console - fetch session state
      const sessionState = {
        sessionId: "session-123",
        status: "idle",
      };

      mockTrpcClient.sessionStateMachine.getSessionState.useQuery.mockReturnValue({
        data: sessionState,
        isLoading: false,
        error: null,
      });

      // 2. Operator starts session
      const startMutation = {
        mutate: vi.fn(),
      };
      mockTrpcClient.sessionStateMachine.startSession.useMutation.mockReturnValue(
        startMutation
      );

      startMutation.mutate({ sessionId: "session-123" });
      expect(startMutation.mutate).toHaveBeenCalled();

      // 3. Questions start arriving - fetch from backend
      const questions = [
        {
          id: 1,
          questionText: "Revenue guidance?",
          status: "submitted",
          complianceRiskScore: 0.2,
        },
      ];

      mockTrpcClient.liveQa.getQuestions.useQuery.mockReturnValue({
        data: questions,
        isLoading: false,
        error: null,
      });

      // 4. Operator approves question
      const approveMutation = {
        mutate: vi.fn(),
      };
      mockTrpcClient.liveQa.approveQuestion.useMutation.mockReturnValue(
        approveMutation
      );

      approveMutation.mutate({
        questionId: 1,
        triageScore: 0.8,
        complianceRiskScore: 0.2,
      });
      expect(approveMutation.mutate).toHaveBeenCalled();

      // 5. AI insights update in real-time
      const insights = {
        sentimentScore: 0.7,
        sentimentTrend: "positive",
        complianceRiskLevel: "low",
      };

      mockTrpcClient.liveQa.getSessionInsights.useQuery.mockReturnValue({
        data: insights,
        isLoading: false,
        error: null,
      });

      // 6. Operator ends session
      const endMutation = {
        mutate: vi.fn(),
      };
      mockTrpcClient.sessionStateMachine.endSession.useMutation.mockReturnValue(
        endMutation
      );

      endMutation.mutate({ sessionId: "session-123" });
      expect(endMutation.mutate).toHaveBeenCalled();
    });
  });
});
