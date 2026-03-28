/**
 * Swagger/OpenAPI Documentation
 * API documentation for CuraLive platform
 */

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "CuraLive API",
    description: "Real-time event intelligence platform API",
    version: "1.0.0",
    contact: {
      name: "CuraLive Support",
      email: "support@curalive.com",
    },
  },
  servers: [
    {
      url: "https://api.curalive.com",
      description: "Production server",
    },
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
      },
    },
    schemas: {
      Event: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          status: {
            type: "string",
            enum: ["draft", "scheduled", "live", "ended"],
          },
          createdBy: { type: "string" },
          createdAt: { type: "number" },
        },
      },
      Question: {
        type: "object",
        properties: {
          id: { type: "string" },
          sessionId: { type: "string" },
          text: { type: "string" },
          askerName: { type: "string" },
          askerEmail: { type: "string" },
          status: {
            type: "string",
            enum: ["submitted", "approved", "rejected", "answered"],
          },
          complianceRiskScore: { type: "number" },
          complianceRiskLevel: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          sentimentScore: { type: "number" },
          upvotes: { type: "integer" },
          createdAt: { type: "number" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string" },
          eventId: { type: "string" },
          operatorId: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "running", "paused", "ended"],
          },
          startedAt: { type: "number" },
          pausedAt: { type: "number" },
          resumedAt: { type: "number" },
          endedAt: { type: "number" },
          elapsedMs: { type: "integer" },
          createdAt: { type: "number" },
        },
      },
      Speaker: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          title: { type: "string" },
          company: { type: "string" },
          bio: { type: "string" },
          email: { type: "string" },
          imageUrl: { type: "string" },
          totalEvents: { type: "integer" },
          averageSentiment: { type: "number" },
          engagementRate: { type: "number" },
        },
      },
      Analytics: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          totalAttendees: { type: "integer" },
          totalQuestions: { type: "integer" },
          averageSentiment: { type: "number" },
          peakEngagementTime: { type: "number" },
          topSpeaker: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/trpc/events.list": {
      get: {
        tags: ["Events"],
        summary: "List all events",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "List of events",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Event" },
                },
              },
            },
          },
        },
      },
    },
    "/api/trpc/events.create": {
      post: {
        tags: ["Events"],
        summary: "Create a new event",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  startTime: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Event created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Event" },
              },
            },
          },
        },
      },
    },
    "/api/trpc/questions.list": {
      get: {
        tags: ["Questions"],
        summary: "List questions for a session",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "List of questions",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Question" },
                },
              },
            },
          },
        },
      },
    },
    "/api/trpc/questions.approve": {
      post: {
        tags: ["Questions"],
        summary: "Approve a question",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  questionId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Question approved",
          },
        },
      },
    },
    "/api/trpc/analytics.getEventAnalytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get event analytics",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "eventId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Event analytics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Analytics" },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerDefinition;
