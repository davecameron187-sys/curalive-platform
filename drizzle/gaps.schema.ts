import { pgTable, serial, integer, text, varchar, timestamp, boolean, json, real, date } from "drizzle-orm/pg-core";

export const sessionReadinessChecks = pgTable("session_readiness_checks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  checkName: varchar("check_name", { length: 100 }).notNull(),
  passed: boolean("passed").default(false),
  detail: text("detail"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const sessionMessages = pgTable("session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  fromRole: varchar("from_role", { length: 30 }).notNull(),
  fromName: varchar("from_name", { length: 200 }),
  message: text("message").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const approvedQuestionsQueue = pgTable("approved_questions_queue", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id"),
  questionText: text("question_text").notNull(),
  askerName: varchar("asker_name", { length: 200 }),
  askerFirm: varchar("asker_firm", { length: 200 }),
  aiSuggestedAnswer: text("ai_suggested_answer"),
  status: varchar("status", { length: 30 }).default("queued"),
  queuedAt: timestamp("queued_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
  operatorId: integer("operator_id"),
});

export const clientReportViewLog = pgTable("client_report_view_log", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull(),
  sessionId: integer("session_id"),
  tabViewed: varchar("tab_viewed", { length: 50 }),
  timeSpentSecs: integer("time_spent_secs").default(0),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const scheduledSessions = pgTable("scheduled_sessions", {
  id: serial("id").primaryKey(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  eventType: varchar("event_type", { length: 50 }).default("earnings_call"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  tier: varchar("tier", { length: 20 }).default("essential"),
  partnerId: integer("partner_id"),
  recipients: json("recipients").default([]),
  meetingUrl: text("meeting_url"),
  preBriefSentAt: timestamp("pre_brief_sent_at"),
  sessionCreatedId: integer("session_created_id"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionHandoffs = pgTable("session_handoffs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  fromOperatorId: integer("from_operator_id").notNull(),
  toOperatorId: integer("to_operator_id"),
  reason: text("reason"),
  status: varchar("status", { length: 30 }).default("pending"),
  handoffAt: timestamp("handoff_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

export const sessionOperators = pgTable("session_operators", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  operatorId: integer("operator_id").notNull(),
  role: varchar("role", { length: 30 }).default("secondary"),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const clientReportFeedback = pgTable("client_report_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  token: varchar("token", { length: 128 }),
  rating: integer("rating"),
  comment: text("comment"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const agmResolutions = pgTable("agm_resolutions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  resolutionNumber: varchar("resolution_number", { length: 20 }),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  sentiment: varchar("sentiment", { length: 30 }).default("neutral"),
  sentimentScore: real("sentiment_score"),
  dissentLevel: varchar("dissent_level", { length: 30 }),
  votesFor: integer("votes_for"),
  votesAgainst: integer("votes_against"),
  abstentions: integer("abstentions"),
  status: varchar("status", { length: 30 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agmShareholderSignals = pgTable("agm_shareholder_signals", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  resolutionId: integer("resolution_id"),
  signalType: varchar("signal_type", { length: 50 }).notNull(),
  speaker: varchar("speaker", { length: 200 }),
  segmentText: text("segment_text"),
  confidence: real("confidence"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const historicalCommitments = pgTable("historical_commitments", {
  id: serial("id").primaryKey(),
  company: varchar("company", { length: 255 }).notNull(),
  commitment: text("commitment").notNull(),
  madeAt: timestamp("made_at"),
  deadline: timestamp("deadline"),
  sessionId: integer("session_id"),
  status: varchar("status", { length: 30 }).default("pending"),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const boardMembers = pgTable("board_members", {
  id: serial("id").primaryKey(),
  company: varchar("company", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  committee: varchar("committee", { length: 100 }),
  appointedAt: timestamp("appointed_at"),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complianceDeadlines = pgTable("compliance_deadlines", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  action: text("action").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 30 }),
  deadlineAt: timestamp("deadline_at").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  assignedTo: varchar("assigned_to", { length: 320 }),
  status: varchar("status", { length: 30 }).default("pending"),
  escalatedAt: timestamp("escalated_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const briefingAccuracyScores = pgTable("briefing_accuracy_scores", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  overallScore: real("overall_score"),
  topicsCovered: integer("topics_covered"),
  topicsMissed: integer("topics_missed"),
  sentimentAccuracy: real("sentiment_accuracy"),
  keyMetricsAccuracy: real("key_metrics_accuracy"),
  scoredAt: timestamp("scored_at").defaultNow(),
  detail: json("detail"),
});

export const organisations = pgTable("organisations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("demo").notNull(),
  billingType: varchar("billing_type", { length: 20 }).default("demo").notNull(),
  subscriptionAmount: integer("subscription_amount"),
  perEventPrice: integer("per_event_price"),
  billingContactEmail: varchar("billing_contact_email", { length: 255 }),
  irContactEmail: varchar("ir_contact_email", { length: 255 }),
  pilotEventsTotal: integer("pilot_events_total").default(3),
  pilotEventsUsed: integer("pilot_events_used").default(0),
  pilotNotes: text("pilot_notes"),
  followupDate: date("followup_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessionMarkers = pgTable("session_markers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  segmentText: text("segment_text").notNull(),
  operatorNote: text("operator_note"),
  flagType: varchar("flag_type", { length: 30 }).default("notable"),
  speaker: varchar("speaker", { length: 200 }),
  eventTimestamp: integer("event_timestamp"),
  operatorId: integer("operator_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
