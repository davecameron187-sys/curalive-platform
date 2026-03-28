import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, float, json } from "drizzle-orm/mysql-core";

/**
 * CuraLive Schema — Live Q&A Intelligence Engine (Module 31)
 * Clean slate for GROK2 implementation
 * All tables support Phase 1-2: Foundation & Intelligence Layer
 */

// ─────────────────────────────────────────────────────────────────────────────
// CORE AUTHENTICATION & USERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "operator", "moderator", "speaker", "legal"]).default("user").notNull(),
  roleExpiresAt: timestamp("roleExpiresAt"), // null = permanent role, otherwise auto-reverts to 'user' at this timestamp
  // Profile customisation fields
  jobTitle: varchar("jobTitle", { length: 255 }),
  organisation: varchar("organisation", { length: 255 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 64 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS & SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Events table — stores event metadata
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull().unique(), // e.g. "q4-earnings-2026"
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(), // "zoom", "teams", "webex", "rtmp", "pstn"
  status: mysqlEnum("status", ["upcoming", "live", "completed"]).default("upcoming").notNull(),
  accessCode: varchar("accessCode", { length: 64 }), // null = no password required
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Attendee registrations table — persists sign-ups from the Registration page
 */
export const attendeeRegistrations = mysqlTable("attendee_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  language: varchar("language", { length: 64 }).default("English").notNull(),
  dialIn: boolean("dialIn").default(false).notNull(),
  accessGranted: boolean("accessGranted").default(false).notNull(),
  joinedAt: timestamp("joinedAt"),
  accessPin: varchar("access_pin", { length: 8 }),
  pinUsedAt: timestamp("pin_used_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendeeRegistration = typeof attendeeRegistrations.$inferSelect;
export type InsertAttendeeRegistration = typeof attendeeRegistrations.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// GROK2 — LIVE Q&A INTELLIGENCE ENGINE (MODULE 31)
// Phase 1-2: Foundation & Intelligence Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Live Q&A Session Metadata table — stores session-level configuration and metrics
 */
export const liveQaSessionMetadata = mysqlTable("live_qa_session_metadata", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  sessionName: varchar("sessionName", { length: 255 }).notNull(),
  moderatorId: int("moderatorId").notNull(), // references users.id
  operatorId: int("operatorId"), // references users.id
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  totalQuestionsSubmitted: int("totalQuestionsSubmitted").default(0).notNull(),
  totalQuestionsAnswered: int("totalQuestionsAnswered").default(0).notNull(),
  totalAttendees: int("totalAttendees").default(0).notNull(),
  averageTriageScore: float("averageTriageScore"),
  averageComplianceRiskScore: float("averageComplianceRiskScore"),
  complianceFlagsCount: int("complianceFlagsCount").default(0).notNull(),
  privateQuestionsCount: int("privateQuestionsCount").default(0).notNull(),
  blockchainCertificatesGenerated: int("blockchainCertificatesGenerated").default(0).notNull(),
  recordingUrl: text("recordingUrl"), // link to Recall.ai recording
  transcriptUrl: text("transcriptUrl"), // link to transcript
  isLive: boolean("isLive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveQaSessionMetadata = typeof liveQaSessionMetadata.$inferSelect;
export type InsertLiveQaSessionMetadata = typeof liveQaSessionMetadata.$inferInsert;

/**
 * Live Q&A Questions table — stores all questions submitted during events
 * Core table for Module 31 Live Q&A Intelligence Engine
 */
export const liveQaQuestions = mysqlTable("live_qa_questions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  sessionId: varchar("sessionId", { length: 128 }).notNull(), // references live_qa_session_metadata.sessionId
  submittedBy: int("submittedBy"), // references users.id (null for anonymous)
  submitterName: varchar("submitterName", { length: 255 }),
  submitterEmail: varchar("submitterEmail", { length: 320 }),
  submitterCompany: varchar("submitterCompany", { length: 255 }),
  questionText: text("questionText").notNull(),
  questionCategory: varchar("questionCategory", { length: 64 }), // e.g., "financial", "strategy", "esg", "compliance"
  status: mysqlEnum("status", ["submitted", "approved", "rejected", "answered", "archived"]).default("submitted").notNull(),
  triageScore: float("triageScore"), // 0-1 relevance score from AI triage
  complianceRiskScore: float("complianceRiskScore"), // 0-1 compliance risk from firewall
  complianceRiskType: varchar("complianceRiskType", { length: 128 }), // e.g., "selective_disclosure", "inside_info", "none"
  priorityScore: float("priorityScore"), // 0-1 combined priority (triage + compliance + upvotes)
  upvotes: int("upvotes").default(0).notNull(),
  downvotes: int("downvotes").default(0).notNull(),
  isAnswered: boolean("isAnswered").default(false).notNull(),
  isPrivate: boolean("isPrivate").default(false).notNull(), // route to private AI bot
  triageAgentId: varchar("triageAgentId", { length: 128 }), // which agent triaged this
  triageReasoning: text("triageReasoning"), // why the triage score was assigned
  investorContextId: int("investorContextId"), // references investor_context_cards.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveQaQuestion = typeof liveQaQuestions.$inferSelect;
export type InsertLiveQaQuestion = typeof liveQaQuestions.$inferInsert;

/**
 * Live Q&A Answers table — stores answers to questions
 */
export const liveQaAnswers = mysqlTable("live_qa_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  answeredBy: int("answeredBy").notNull(), // references users.id (speaker/presenter)
  answerText: text("answerText").notNull(),
  isAutoDraft: boolean("isAutoDraft").default(false).notNull(), // generated by AGI
  autoDraftReasoning: text("autoDraftReasoning"), // why AGI generated this answer
  isApproved: boolean("isApproved").default(false).notNull(),
  isComplianceApproved: boolean("isComplianceApproved").default(false).notNull(),
  complianceApprovedBy: int("complianceApprovedBy"), // references users.id (legal/compliance)
  complianceApprovedAt: timestamp("complianceApprovedAt"),
  blockchainCertId: varchar("blockchainCertId", { length: 256 }), // Clean Disclosure Certificate ID
  blockchainCertUrl: text("blockchainCertUrl"), // URL to blockchain proof
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveQaAnswer = typeof liveQaAnswers.$inferSelect;
export type InsertLiveQaAnswer = typeof liveQaAnswers.$inferInsert;

/**
 * Triage Events table — logs each triage decision for audit trail
 */
export const triageEvents = mysqlTable("triage_events", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  triageAgentId: varchar("triageAgentId", { length: 128 }).notNull(), // agent identifier
  agentType: varchar("agentType", { length: 64 }).notNull(), // "relevance_classifier", "priority_scorer", "compliance_checker"
  decision: varchar("decision", { length: 128 }).notNull(), // e.g., "approve", "flag_for_review", "route_to_private"
  confidence: float("confidence").notNull(), // 0-1 confidence in decision
  reasoning: text("reasoning").notNull(), // why this decision was made
  metadata: json("metadata"), // additional context (e.g., matched patterns, similar questions)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TriageEvent = typeof triageEvents.$inferSelect;
export type InsertTriageEvent = typeof triageEvents.$inferInsert;

/**
 * Investor Context Cards table — stores auto-generated context for each question
 */
export const investorContextCards = mysqlTable("investor_context_cards", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  contextType: varchar("contextType", { length: 64 }).notNull(), // "historical_context", "market_data", "regulatory_background", "company_disclosure"
  contextTitle: varchar("contextTitle", { length: 255 }).notNull(),
  contextContent: text("contextContent").notNull(),
  relevanceScore: float("relevanceScore").notNull(), // 0-1 how relevant to the question
  sourceUrl: text("sourceUrl"), // where this context came from
  generatedBy: varchar("generatedBy", { length: 128 }).notNull(), // "ai_system" or module name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestorContextCard = typeof investorContextCards.$inferSelect;
export type InsertInvestorContextCard = typeof investorContextCards.$inferInsert;

/**
 * Compliance Flags table — stores compliance risk assessments
 */
export const complianceFlags = mysqlTable("compliance_flags", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 64 }).notNull(), // "jse", "sec", "eu_mar", "popia", etc
  riskScore: float("riskScore").notNull(), // 0-1 compliance risk
  riskType: varchar("riskType", { length: 128 }).notNull(), // "selective_disclosure", "inside_information", "market_abuse", "data_privacy"
  riskDescription: text("riskDescription").notNull(),
  autoRemediationSuggestion: text("autoRemediationSuggestion"), // suggested fix
  requiresLegalReview: boolean("requiresLegalReview").default(false).notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"), // references users.id
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceFlag = typeof complianceFlags.$inferSelect;
export type InsertComplianceFlag = typeof complianceFlags.$inferInsert;

/**
 * Smart Queue Events table — tracks question queue optimization decisions
 */
export const smartQueueEvents = mysqlTable("smart_queue_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  queuePosition: int("queuePosition").notNull(), // position in queue
  relevanceScore: float("relevanceScore").notNull(),
  complianceScore: float("complianceScore").notNull(),
  priorityScore: float("priorityScore").notNull(),
  upvoteCount: int("upvoteCount").notNull(),
  estimatedAnswerTime: int("estimatedAnswerTime"), // seconds
  optimizationReason: text("optimizationReason"), // why this position was chosen
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmartQueueEvent = typeof smartQueueEvents.$inferSelect;
export type InsertSmartQueueEvent = typeof smartQueueEvents.$inferInsert;

/**
 * Private AI Bot Conversations table — stores confidential question routing
 */
export const privateAiBotConversations = mysqlTable("private_ai_bot_conversations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  questionId: int("questionId"), // references live_qa_questions.id (null for anonymous)
  submittedBy: int("submittedBy"), // references users.id
  submitterName: varchar("submitterName", { length: 255 }),
  submitterEmail: varchar("submitterEmail", { length: 320 }),
  confidentialityLevel: mysqlEnum("confidentialityLevel", ["public", "internal", "confidential", "legal_privilege"]).default("confidential").notNull(),
  conversationHistory: json("conversationHistory"), // array of {role, content, timestamp}
  aiResponses: json("aiResponses"), // array of AI-generated responses
  routedToLegal: boolean("routedToLegal").default(false).notNull(),
  routedToLegalAt: timestamp("routedToLegalAt"),
  routedToLegalBy: int("routedToLegalBy"), // references users.id
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrivateAiBotConversation = typeof privateAiBotConversations.$inferSelect;
export type InsertPrivateAiBotConversation = typeof privateAiBotConversations.$inferInsert;

/**
 * Blockchain Certificates table — stores Clean Disclosure Certificates (Module 22)
 */
export const blockchainCertificates = mysqlTable("blockchain_certificates", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: varchar("certificateId", { length: 256 }).notNull().unique(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  questionId: int("questionId").notNull(), // references live_qa_questions.id
  answerId: int("answerId"), // references live_qa_answers.id
  certificationType: varchar("certificationType", { length: 64 }).notNull(), // "clean_disclosure", "compliance_approval", "legal_review"
  certificateData: json("certificateData"), // {question, answer, timestamp, approvers, compliance_checks}
  blockchainHash: varchar("blockchainHash", { length: 256 }).notNull(), // hash on blockchain
  blockchainUrl: text("blockchainUrl"), // URL to blockchain proof
  isVerified: boolean("isVerified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockchainCertificate = typeof blockchainCertificates.$inferSelect;
export type InsertBlockchainCertificate = typeof blockchainCertificates.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// AGI TOOL GENERATOR (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AGI Generated Tools table — stores autonomously generated Q&A tools
 * GROK2 Phase 4: Tool Generator
 */
export const agiGeneratedTools = mysqlTable("agi_generated_tools", {
  id: varchar("id", { length: 128 }).primaryKey(), // tool-{timestamp}-{random}
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 128 }).notNull(),
  description: text("description").notNull(),
  questionPatterns: json("questionPatterns"), // Array<string>
  responseTemplate: text("responseTemplate"),
  validationRules: json("validationRules"), // Array<string>
  riskIndicators: json("riskIndicators"), // Array<string>
  status: mysqlEnum("status", ["draft", "testing", "staging", "production", "deprecated"])
    .default("draft")
    .notNull(),
  accuracy: float("accuracy").default(0), // 0-1
  coverage: float("coverage").default(0), // 0-1
  readinessScore: float("readinessScore").default(0), // 0-1
  performanceMetrics: json("performanceMetrics"), // {questionsProcessed, accuracyScore, userSatisfaction, improvementSuggestions}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  promotedAt: timestamp("promotedAt"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgiGeneratedTool = typeof agiGeneratedTools.$inferSelect;
export type InsertAgiGeneratedTool = typeof agiGeneratedTools.$inferInsert;

/**
 * AGI Compliance Rules table — stores autonomously generated compliance rules
 * GROK2 Phase 5: Corporate Compliance Layer
 */
export const agiComplianceRules = mysqlTable("agi_compliance_rules", {
  id: varchar("id", { length: 128 }).primaryKey(),
  jurisdiction: varchar("jurisdiction", { length: 128 }).notNull(),
  ruleType: varchar("ruleType", { length: 128 }).notNull(), // "anti_bribery", "data_privacy", "market_abuse", etc.
  description: text("description").notNull(),
  detectionPatterns: json("detectionPatterns"), // Array<string>
  remediationSteps: json("remediationSteps"), // Array<string>
  escalationThreshold: float("escalationThreshold").default(0.7),
  status: mysqlEnum("status", ["draft", "testing", "active", "archived"])
    .default("draft")
    .notNull(),
  effectivenessScore: float("effectivenessScore").default(0),
  falsePositiveRate: float("falsePositiveRate").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgiComplianceRule = typeof agiComplianceRules.$inferSelect;
export type InsertAgiComplianceRule = typeof agiComplianceRules.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// OPERATOR CONSOLE — SERVER-AUTHORITATIVE SESSION STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Operator Sessions table — server-authoritative session state machine
 * Single source of truth for session lifecycle: start → pause → resume → end
 */
export const operatorSessions = mysqlTable("operator_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(), // references live_qa_session_metadata.sessionId
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  operatorId: int("operatorId").notNull(), // references users.id
  status: mysqlEnum("status", ["idle", "running", "paused", "ended"]).default("idle").notNull(),
  startedAt: timestamp("startedAt"), // when operator clicked "Start"
  pausedAt: timestamp("pausedAt"), // when operator clicked "Pause" (null if never paused)
  resumedAt: timestamp("resumedAt"), // when operator clicked "Resume" (null if never resumed)
  endedAt: timestamp("endedAt"), // when operator clicked "End Session"
  totalPausedDuration: int("totalPausedDuration").default(0).notNull(), // cumulative pause time in seconds
  handoffStatus: mysqlEnum("handoffStatus", ["pending", "archived", "downloaded"]).default("pending").notNull(),
  handoffCompletedAt: timestamp("handoffCompletedAt"), // when operator downloaded/archived
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OperatorSession = typeof operatorSessions.$inferSelect;
export type InsertOperatorSession = typeof operatorSessions.$inferInsert;

/**
 * Operator Actions table — durable log of all operator actions
 * Every action (approve, reject, note, etc.) is persisted with full context
 */
export const operatorActions = mysqlTable("operator_actions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(), // references operator_sessions.sessionId
  operatorId: int("operatorId").notNull(), // references users.id
  actionType: mysqlEnum("actionType", [
    "note_created",
    "question_approved",
    "question_rejected",
    "question_held",
    "question_sent_to_speaker",
    "compliance_flag_raised",
    "compliance_flag_cleared",
    "key_moment_marked",
    "session_started",
    "session_paused",
    "session_resumed",
    "session_ended",
  ]).notNull(),
  targetId: varchar("targetId", { length: 128 }), // question ID, note ID, etc.
  targetType: varchar("targetType", { length: 64 }), // "question", "note", "session"
  metadata: json("metadata"), // action-specific data (reason for rejection, note text, etc.)
  syncedToViasocket: boolean("syncedToViasocket").default(false).notNull(),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperatorAction = typeof operatorActions.$inferSelect;
export type InsertOperatorAction = typeof operatorActions.$inferInsert;

/**
 * Session State Transitions table — audit trail of state changes
 * Tracks every state machine transition with timestamp and operator
 */
export const sessionStateTransitions = mysqlTable("session_state_transitions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(), // references operator_sessions.sessionId
  operatorId: int("operatorId").notNull(), // references users.id
  fromState: mysqlEnum("fromState", ["idle", "running", "paused", "ended"]).notNull(),
  toState: mysqlEnum("toState", ["idle", "running", "paused", "ended"]).notNull(),
  reason: varchar("reason", { length: 255 }), // why transition happened
  metadata: json("metadata"), // additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionStateTransition = typeof sessionStateTransitions.$inferSelect;
export type InsertSessionStateTransition = typeof sessionStateTransitions.$inferInsert;

/**
 * Session Handoff Package table — stores post-session deliverables
 * Transcript, AI report, recording, action history all linked here
 */
export const sessionHandoffPackages = mysqlTable("session_handoff_packages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(), // references operator_sessions.sessionId
  operatorId: int("operatorId").notNull(), // references users.id
  transcriptUrl: text("transcriptUrl"), // link to full transcript
  aiReportUrl: text("aiReportUrl"), // link to AI-generated report
  recordingUrl: text("recordingUrl"), // link to recording
  actionHistoryJson: json("actionHistoryJson"), // serialized action log
  complianceFlagsJson: json("complianceFlagsJson"), // serialized compliance flags
  questionsAnsweredCount: int("questionsAnsweredCount").default(0).notNull(),
  questionsRejectedCount: int("questionsRejectedCount").default(0).notNull(),
  totalSessionDuration: int("totalSessionDuration").default(0).notNull(), // in seconds
  downloadedAt: timestamp("downloadedAt"),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionHandoffPackage = typeof sessionHandoffPackages.$inferSelect;
export type InsertSessionHandoffPackage = typeof sessionHandoffPackages.$inferInsert;

/**
 * Transcript Segments table — stores real-time transcript from Recall.ai
 * Populated by Recall.ai webhook events during live sessions
 * Used by console to display live transcript feed
 */
export const transcriptSegments = mysqlTable("transcript_segments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(), // references operator_sessions.sessionId
  segmentId: varchar("segmentId", { length: 128 }).notNull().unique(), // Recall.ai segment ID
  speaker: varchar("speaker", { length: 255 }).notNull(), // speaker name or ID
  text: text("text").notNull(), // transcript text
  timestamp: int("timestamp").notNull(), // milliseconds since epoch (stored as int)
  duration: int("duration"), // duration of segment in milliseconds
  confidence: varchar("confidence", { length: 10 }), // 0.00-1.00 confidence score as string
  language: varchar("language", { length: 64 }).default("en").notNull(),
  metadata: json("metadata"), // additional Recall.ai metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
export type InsertTranscriptSegment = typeof transcriptSegments.$inferInsert;

/**
 * Session Recordings table — stores recording metadata and URLs
 * Populated when Recall.ai recording completes
 */
export const sessionRecordings = mysqlTable("session_recordings", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(), // references operator_sessions.sessionId
  recordingId: varchar("recordingId", { length: 128 }).notNull().unique(), // Recall.ai recording ID
  recordingUrl: text("recordingUrl").notNull(), // S3 or Recall.ai URL
  duration: int("duration").notNull(), // duration in seconds
  fileSize: int("fileSize"), // file size in bytes
  quality: varchar("quality", { length: 64 }).default("high").notNull(), // video quality
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  failureReason: text("failureReason"), // if status = failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SessionRecording = typeof sessionRecordings.$inferSelect;
export type InsertSessionRecording = typeof sessionRecordings.$inferInsert;
