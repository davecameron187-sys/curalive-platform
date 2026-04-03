import { pgTable, serial, integer, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 10 }).default("#1a1a2e"),
  accentColor: varchar("accent_color", { length: 10 }).default("#0A2540"),
  fontFamily: varchar("font_family", { length: 100 }),
  model: varchar("model", { length: 30 }).default("revenue_share"),
  revenueSharePct: integer("revenue_share_pct").default(20),
  customDomain: varchar("custom_domain", { length: 255 }),
  customDomainVerified: boolean("custom_domain_verified").default(false),
  sendingDomain: varchar("sending_domain", { length: 255 }),
  sendingName: varchar("sending_name", { length: 255 }),
  sendingEmail: varchar("sending_email", { length: 320 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientTokens = pgTable("client_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  sessionId: integer("session_id").notNull(),
  partnerId: integer("partner_id"),
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientEmail: varchar("recipient_email", { length: 320 }),
  recipientRole: varchar("recipient_role", { length: 100 }),
  accessType: varchar("access_type", { length: 30 }).notNull().default("live"),
  expiresAt: timestamp("expires_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientReportAccess = pgTable("client_report_access", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull(),
  sessionId: integer("session_id").notNull(),
  tabViewed: varchar("tab_viewed", { length: 50 }),
  timeSpentSecs: integer("time_spent_secs").default(0),
  accessedAt: timestamp("accessed_at").defaultNow(),
});

export const partnerEvents = pgTable("partner_events", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull(),
  sessionId: integer("session_id"),
  eventType: varchar("event_type", { length: 50 }),
  detail: json("detail"),
  createdAt: timestamp("created_at").defaultNow(),
});
