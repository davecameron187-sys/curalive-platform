CREATE TYPE "public"."action" AS ENUM('flagged', 'reviewed', 'approved', 'disclosed', 'certificate_generated', 'exported');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('tool_proposed', 'shadow_test_started', 'shadow_test_passed', 'shadow_test_failed', 'tool_deployed', 'tool_deactivated', 'tool_promoted', 'roadmap_updated');--> statement-breakpoint
CREATE TYPE "public"."algorithm_source" AS ENUM('resolution_sentiment', 'dissent_pattern', 'qa_governance_triage', 'quorum_intelligence', 'regulatory_guardian', 'governance_report');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('approved', 'rejected', 'pending');--> statement-breakpoint
CREATE TYPE "public"."billing_tier" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."bridge_conf_phase" AS ENUM('waiting', 'lobby', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."bridge_conf_type" AS ENUM('green_room', 'main');--> statement-breakpoint
CREATE TYPE "public"."bridge_event_phase" AS ENUM('scheduled', 'pre_call', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."bridge_greeter_status" AS ENUM('waiting', 'admitted', 'rejected', 'timed_out');--> statement-breakpoint
CREATE TYPE "public"."bridge_participant_role" AS ENUM('presenter', 'participant', 'operator', 'observer');--> statement-breakpoint
CREATE TYPE "public"."bridge_participant_status" AS ENUM('invited', 'dialing', 'greeter_queue', 'green_room', 'lobby', 'live', 'muted', 'hold', 'left', 'removed', 'failed', 'no_answer');--> statement-breakpoint
CREATE TYPE "public"."bridge_qa_method" AS ENUM('phone_keypress', 'web_button', 'operator_added');--> statement-breakpoint
CREATE TYPE "public"."bridge_qa_status" AS ENUM('pending', 'approved', 'live', 'answered', 'dismissed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."call_quality" AS ENUM('poor', 'fair', 'good', 'excellent');--> statement-breakpoint
CREATE TYPE "public"."carrier" AS ENUM('twilio', 'telnyx');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('analysis', 'tracking', 'automation', 'reporting', 'integration');--> statement-breakpoint
CREATE TYPE "public"."check_type" AS ENUM('automated', 'manual', 'ai_assessed');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('flagged', 'reviewed', 'approved', 'disclosed');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('firm', 'tentative', 'aspirational');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('text', 'image', 'video', 'link');--> statement-breakpoint
CREATE TYPE "public"."control_type" AS ENUM('soc2', 'iso27001');--> statement-breakpoint
CREATE TYPE "public"."correction_type" AS ENUM('sentiment_override', 'compliance_dismiss', 'compliance_add', 'severity_change', 'threshold_adjust');--> statement-breakpoint
CREATE TYPE "public"."default_join_method" AS ENUM('phone', 'teams', 'zoom', 'web');--> statement-breakpoint
CREATE TYPE "public"."default_platform" AS ENUM('zoom', 'teams', 'webex', 'rtmp', 'pstn');--> statement-breakpoint
CREATE TYPE "public"."deliveryStatus" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('mobile', 'desktop', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."estimated_impact" AS ENUM('low', 'medium', 'high', 'transformative');--> statement-breakpoint
CREATE TYPE "public"."event" AS ENUM('free', 'incoming', 'connected', 'muted', 'unmuted', 'parked', 'unparked', 'speaking', 'speaking_ended', 'disconnected', 'picked', 'request_to_speak', 'request_accepted', 'request_refused', 'moved_to_subconference', 'returned_from_subconference');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('webinar', 'webcast', 'virtual_event', 'hybrid_event', 'on_demand', 'simulive', 'audio_conference', 'capital_markets');--> statement-breakpoint
CREATE TYPE "public"."follow_up_status" AS ENUM('pending', 'contacted', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."framework" AS ENUM('iso27001', 'soc2');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."guidance_type" AS ENUM('revenue', 'earnings', 'margins', 'capex', 'headcount', 'market_share', 'other');--> statement-breakpoint
CREATE TYPE "public"."industry_vertical" AS ENUM('financial_services', 'corporate_communications', 'healthcare', 'technology', 'professional_services', 'government', 'education', 'media_entertainment', 'general');--> statement-breakpoint
CREATE TYPE "public"."join_method" AS ENUM('phone', 'teams', 'zoom', 'web');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction" AS ENUM('south_africa', 'united_kingdom', 'united_states', 'australia', 'other');--> statement-breakpoint
CREATE TYPE "public"."meetingType" AS ENUM('1x1', 'group', 'large_group');--> statement-breakpoint
CREATE TYPE "public"."met_or_missed" AS ENUM('met', 'missed', 'exceeded', 'pending');--> statement-breakpoint
CREATE TYPE "public"."metric_type" AS ENUM('sentiment', 'compliance', 'engagement');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'flagged', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."moment_type" AS ENUM('insight', 'action_item', 'question', 'highlight', 'disclaimer');--> statement-breakpoint
CREATE TYPE "public"."observation_type" AS ENUM('weak_module', 'missing_capability', 'repeated_pattern', 'operator_friction', 'data_gap', 'cross_event_trend');--> statement-breakpoint
CREATE TYPE "public"."outcome" AS ENUM('admitted', 'operator_queue', 'no_conference', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pattern_type" AS ENUM('recurring_dissenter', 'category_dissent', 'threshold_breach', 'institutional_block', 'cross_client_trend', 'emerging_risk');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('eft', 'bank_transfer', 'cheque', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('zoom', 'teams', 'webex', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('draft', 'live', 'closed');--> statement-breakpoint
CREATE TYPE "public"."poll_type" AS ENUM('multiple_choice', 'rating_scale', 'word_cloud', 'yes_no');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('pending', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."qa_session_status" AS ENUM('active', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "public"."qa_status" AS ENUM('pending', 'approved', 'answered', 'dismissed', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."question_category" AS ENUM('financial', 'operational', 'esg', 'governance', 'strategy', 'general');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('pending', 'triaged', 'approved', 'answered', 'rejected', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."recipientType" AS ENUM('all', 'hosts', 'participant');--> statement-breakpoint
CREATE TYPE "public"."recommended_action" AS ENUM('forward', 'route_to_bot', 'legal_review', 'delay_24h');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('full', 'executive', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('dial_in_number', 'rtmp_key', 'mux_stream', 'recall_bot', 'ably_channel');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'operator');--> statement-breakpoint
CREATE TYPE "public"."senderType" AS ENUM('operator', 'participant', 'moderator', 'system');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."serviceType" AS ENUM('capital_raising_1x1', 'research_presentation', 'earnings_call', 'hybrid_conference');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."share_type" AS ENUM('link', 'embed', 'widget');--> statement-breakpoint
CREATE TYPE "public"."signalType" AS ENUM('soft_commit', 'interest', 'objection', 'question', 'pricing_discussion', 'size_discussion');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('forge_ai', 'whisper', 'manual');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('live_session', 'archive_upload', 'transcript_paste');--> statement-breakpoint
CREATE TYPE "public"."state" AS ENUM('free', 'incoming', 'connected', 'muted', 'parked', 'speaking', 'waiting_operator', 'web_participant', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('upcoming', 'live', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tag_type" AS ENUM('sentiment', 'compliance', 'scaling', 'engagement', 'qa', 'intervention');--> statement-breakpoint
CREATE TYPE "public"."threat_type" AS ENUM('fraud', 'access_anomaly', 'data_exfiltration', 'policy_violation', 'regulatory_breach', 'predictive_warning');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('basic', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."timeframe" AS ENUM('30_days', '60_days', '90_days');--> statement-breakpoint
CREATE TYPE "public"."transcription_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transfer_type" AS ENUM('blind', 'warm');--> statement-breakpoint
CREATE TYPE "public"."triggeredBy" AS ENUM('system', 'operator', 'participant', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."waitingRoomStatus" AS ENUM('not_arrived', 'in_waiting_room', 'admitted', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."webcast_status" AS ENUM('draft', 'scheduled', 'live', 'ended', 'on_demand', 'cancelled');--> statement-breakpoint
CREATE TABLE "adaptive_thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"threshold_key" varchar(255) NOT NULL,
	"event_type" varchar(64),
	"sector" varchar(64),
	"metric_type" varchar(64) NOT NULL,
	"default_value" real NOT NULL,
	"learned_value" real NOT NULL,
	"sample_count" integer DEFAULT 0,
	"last_correction_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisory_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_key" varchar(128) NOT NULL,
	"role" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"event_ids" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentic_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(128),
	"q1_role" varchar(64) NOT NULL,
	"q2_challenge" varchar(64) NOT NULL,
	"q3_event_type" varchar(64) NOT NULL,
	"primary_bundle" varchar(64) NOT NULL,
	"bundle_letter" varchar(4) NOT NULL,
	"score" real NOT NULL,
	"ai_action" text,
	"roi_preview" varchar(255),
	"interconnections" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agm_dissent_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"pattern_type" varchar(64) NOT NULL,
	"category" varchar(128),
	"description" text NOT NULL,
	"frequency" integer DEFAULT 1,
	"confidence" real DEFAULT 0.5,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"session_ids" json,
	"evidence_data" json,
	"action_recommendation" text,
	"decayed_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agm_governance_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"algorithm_source" varchar(64) NOT NULL,
	"observation_type" varchar(64) NOT NULL,
	"severity" varchar(64) DEFAULT 'info' NOT NULL,
	"title" varchar(512) NOT NULL,
	"detail" text NOT NULL,
	"confidence" real DEFAULT 0.5,
	"related_resolution_id" integer,
	"raw_data" json,
	"fed_to_evolution" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agm_intelligence_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"shadow_session_id" integer,
	"client_name" varchar(255) NOT NULL,
	"agm_title" varchar(512) NOT NULL,
	"agm_date" varchar(32),
	"jurisdiction" varchar(64) DEFAULT 'south_africa' NOT NULL,
	"total_resolutions" integer DEFAULT 0,
	"resolutions_carried" integer DEFAULT 0,
	"resolutions_defeated" integer DEFAULT 0,
	"quorum_met" boolean DEFAULT false,
	"quorum_percentage" real,
	"attendance_count" integer DEFAULT 0,
	"proxy_count" integer DEFAULT 0,
	"overall_sentiment" real,
	"governance_score" real,
	"dissent_index" real,
	"regulatory_alerts" integer DEFAULT 0,
	"qa_questions_total" integer DEFAULT 0,
	"qa_questions_governance" integer DEFAULT 0,
	"ai_governance_report" json,
	"evolution_observations_generated" integer DEFAULT 0,
	"status" varchar(64) DEFAULT 'setup' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agm_resolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"resolution_number" integer NOT NULL,
	"title" varchar(512) NOT NULL,
	"category" varchar(64) DEFAULT 'ordinary' NOT NULL,
	"proposed_by" varchar(255),
	"sentiment_during_debate" real,
	"predicted_approval_pct" real,
	"actual_approval_pct" real,
	"prediction_accuracy" real,
	"dissenter_count" integer DEFAULT 0,
	"compliance_flags" json,
	"ai_analysis" json,
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_am_audit_log" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"action" varchar(64) NOT NULL,
	"action_by" varchar(128) NOT NULL,
	"action_by_role" varchar(64),
	"target_violation_id" varchar(128),
	"target_speaker" varchar(255),
	"details" text,
	"timestamp" bigint NOT NULL,
	"ip_address" varchar(64),
	"user_agent" varchar(512),
	"hash" varchar(64) NOT NULL,
	"previous_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "ai_evolution_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_type" varchar(64) NOT NULL,
	"source_id" integer,
	"event_type" varchar(64),
	"client_name" varchar(255),
	"observation_type" varchar(64) NOT NULL,
	"module_name" varchar(128),
	"observation" text NOT NULL,
	"confidence" real DEFAULT 0.5,
	"suggested_capability" varchar(255),
	"raw_context" json,
	"cluster_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generated_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"content_type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"edited_content" text,
	"status" varchar(32) DEFAULT 'generated' NOT NULL,
	"recipients" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" integer,
	"approved_at" timestamp,
	"approved_by" integer,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"sent_at" timestamp,
	"sent_to" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tool_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"rationale" text NOT NULL,
	"evidence_count" integer DEFAULT 0,
	"avg_confidence" real DEFAULT 0,
	"observation_ids" json,
	"status" varchar(64) DEFAULT 'emerging' NOT NULL,
	"estimated_impact" varchar(64) DEFAULT 'medium',
	"prompt_template" text,
	"module_spec" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" varchar(128),
	"event_id" varchar(128),
	"violation_id" varchar(128),
	"channel" varchar(32),
	"status" varchar(32),
	"action" varchar(64),
	"actor_id" varchar(128),
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" varchar(128) NOT NULL,
	"event_id" varchar(128),
	"email_notifications_enabled" smallint DEFAULT 1,
	"sms_notifications_enabled" smallint DEFAULT 0,
	"in_app_notifications_enabled" smallint DEFAULT 1,
	"email_address" varchar(320),
	"phone_number" varchar(32),
	"critical_only" smallint DEFAULT 0,
	"quiet_hours_enabled" smallint DEFAULT 0,
	"quiet_hours_start" varchar(8) DEFAULT '22:00',
	"quiet_hours_end" varchar(8) DEFAULT '08:00',
	"timezone" varchar(64) DEFAULT 'UTC',
	"monitored_violation_types" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_preferences_operator_id_unique" UNIQUE("operator_id")
);
--> statement-breakpoint
CREATE TABLE "analyst_consensus_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"metric" varchar(100),
	"consensus_value" real,
	"low_estimate" real,
	"high_estimate" real,
	"num_analysts" integer,
	"revision_trend" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyst_expectation_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"analyst_name" varchar(255),
	"consensus_eps" real,
	"consensus_revenue" real,
	"consensus_growth" real,
	"prior_guidance" text,
	"surprise_risk" varchar(20),
	"key_expectations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archive_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128),
	"client_name" varchar(255) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"event_date" varchar(32),
	"platform" varchar(64),
	"transcript_text" text NOT NULL,
	"word_count" integer DEFAULT 0,
	"segment_count" integer DEFAULT 0,
	"sentiment_avg" real,
	"compliance_flags" integer DEFAULT 0,
	"tagged_metrics_generated" integer DEFAULT 0,
	"status" varchar(64) DEFAULT 'processing' NOT NULL,
	"notes" text,
	"ai_report" json,
	"specialised_analysis" json,
	"specialised_algorithms_run" integer DEFAULT 0,
	"specialised_session_id" integer,
	"specialised_session_type" varchar(32),
	"recording_path" varchar(1000),
	"transcript_fingerprint" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendee_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(255),
	"jobTitle" varchar(255),
	"language" varchar(64) DEFAULT 'English' NOT NULL,
	"dialIn" boolean DEFAULT false NOT NULL,
	"accessGranted" boolean DEFAULT false NOT NULL,
	"joinedAt" timestamp,
	"access_pin" varchar(8),
	"pin_used_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomous_interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128),
	"conference_id" varchar(128),
	"rule_id" varchar(64) NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"trigger_value" real,
	"threshold" real,
	"severity" varchar(64) DEFAULT 'warning' NOT NULL,
	"bundle_triggered" varchar(64),
	"action_taken" text NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"outcome" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bastion_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"client_name" varchar(255) NOT NULL,
	"event_title" varchar(512) NOT NULL,
	"event_type" varchar(64) DEFAULT 'earnings_call' NOT NULL,
	"event_date" varchar(32),
	"event_time" varchar(16),
	"sector" varchar(128),
	"ticker" varchar(32),
	"expected_attendees" integer,
	"meeting_url" varchar(1000),
	"platform" varchar(64) DEFAULT 'zoom' NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"bastion_reference" varchar(128),
	"confirmation_recipients" text,
	"confirmation_sent_at" timestamp,
	"dashboard_token" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'booked' NOT NULL,
	"checklist" json,
	"shadow_session_id" integer,
	"bastion_session_id" integer,
	"notes" text,
	"report_delivered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bastion_guidance_tracker" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"ticker" varchar(32),
	"session_id" integer NOT NULL,
	"guidance_type" varchar(64) NOT NULL,
	"statement" text NOT NULL,
	"confidence_level" varchar(64) DEFAULT 'tentative' NOT NULL,
	"numeric_value" varchar(128),
	"timeframe" varchar(64),
	"prior_guidance_id" integer,
	"prior_value" varchar(128),
	"delta" varchar(64),
	"met_or_missed" varchar(64) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bastion_intelligence_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"shadow_session_id" integer,
	"client_name" varchar(255) NOT NULL,
	"event_title" varchar(512) NOT NULL,
	"event_type" varchar(64) DEFAULT 'earnings_call' NOT NULL,
	"event_date" varchar(32),
	"sector" varchar(128),
	"ticker" varchar(32),
	"overall_sentiment" real,
	"management_tone_score" real,
	"credibility_score" real,
	"market_moving_statements" integer DEFAULT 0,
	"forward_guidance_count" integer DEFAULT 0,
	"analyst_questions_total" integer DEFAULT 0,
	"analyst_questions_hostile" integer DEFAULT 0,
	"investment_brief" json,
	"evolution_observations_generated" integer DEFAULT 0,
	"status" varchar(64) DEFAULT 'setup' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bastion_investor_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"algorithm_source" varchar(64) NOT NULL,
	"observation_type" varchar(64) NOT NULL,
	"severity" varchar(64) DEFAULT 'info' NOT NULL,
	"title" varchar(512) NOT NULL,
	"detail" text NOT NULL,
	"confidence" real DEFAULT 0.5,
	"raw_data" json,
	"fed_to_evolution" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer,
	"invoice_id" integer,
	"client_id" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"metadata" text,
	"actor_user_id" integer,
	"actor_type" varchar(16) DEFAULT 'system' NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_client_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(64),
	"job_title" varchar(255),
	"department" varchar(128),
	"is_primary" boolean DEFAULT false NOT NULL,
	"receives_quotes" boolean DEFAULT true NOT NULL,
	"receives_invoices" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"registration_number" varchar(128),
	"vat_number" varchar(64),
	"industry" varchar(128),
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(320) NOT NULL,
	"contact_phone" varchar(64),
	"contact_job_title" varchar(255),
	"billing_address" text,
	"billing_city" varchar(128),
	"billing_country" varchar(128) DEFAULT 'South Africa',
	"billing_postal_code" varchar(32),
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"notes" text,
	"status" varchar(64) DEFAULT 'prospect' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_credit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_note_number" varchar(32) NOT NULL,
	"invoice_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"tax_percent" integer DEFAULT 15 NOT NULL,
	"tax_cents" bigint DEFAULT 0 NOT NULL,
	"total_cents" bigint NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"access_token" varchar(64),
	"issued_at" timestamp,
	"applied_at" timestamp,
	"internal_notes" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_credit_notes_credit_note_number_unique" UNIQUE("credit_note_number"),
	CONSTRAINT "billing_credit_notes_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "billing_email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tracking_token" varchar(64) NOT NULL,
	"quote_id" integer,
	"invoice_id" integer,
	"credit_note_id" integer,
	"client_id" integer NOT NULL,
	"recipient_email" varchar(320) NOT NULL,
	"email_type" varchar(32) NOT NULL,
	"subject" varchar(512),
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"first_opened_at" timestamp,
	"open_count" integer DEFAULT 0 NOT NULL,
	"last_opened_at" timestamp,
	"last_open_ip" varchar(64),
	"last_open_user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_email_events_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "billing_fx_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_currency" varchar(8) NOT NULL,
	"target_currency" varchar(8) NOT NULL,
	"rate" varchar(32) NOT NULL,
	"source" varchar(64) DEFAULT 'exchangerate-api' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(32) NOT NULL,
	"client_id" integer NOT NULL,
	"quote_id" integer,
	"title" varchar(255) NOT NULL,
	"subtotal_cents" bigint DEFAULT 0 NOT NULL,
	"discount_cents" bigint DEFAULT 0 NOT NULL,
	"tax_percent" integer DEFAULT 15 NOT NULL,
	"tax_cents" bigint DEFAULT 0 NOT NULL,
	"total_cents" bigint DEFAULT 0 NOT NULL,
	"paid_cents" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp,
	"due_at" timestamp,
	"paid_at" timestamp,
	"access_token" varchar(64),
	"payment_terms" text,
	"internal_notes" text,
	"client_notes" text,
	"bank_details" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "billing_invoices_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "billing_line_item_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(128) NOT NULL,
	"default_unit_price_cents" bigint NOT NULL,
	"default_currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"is_package" boolean DEFAULT false NOT NULL,
	"package_items_json" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer,
	"invoice_id" integer,
	"description" varchar(512) NOT NULL,
	"category" varchar(128),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" bigint NOT NULL,
	"total_cents" bigint NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"payment_method" varchar(64) DEFAULT 'eft' NOT NULL,
	"reference" varchar(255),
	"paid_at" timestamp NOT NULL,
	"notes" text,
	"recorded_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_quote_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"subtotal_cents" bigint NOT NULL,
	"discount_cents" bigint DEFAULT 0 NOT NULL,
	"tax_percent" integer DEFAULT 15 NOT NULL,
	"total_cents" bigint NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"line_items_snapshot" text NOT NULL,
	"change_notes" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_number" varchar(32) NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"subtotal_cents" bigint DEFAULT 0 NOT NULL,
	"discount_cents" bigint DEFAULT 0 NOT NULL,
	"tax_percent" integer DEFAULT 15 NOT NULL,
	"total_cents" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp,
	"expires_at" timestamp,
	"accepted_at" timestamp,
	"access_token" varchar(64),
	"payment_terms" text,
	"internal_notes" text,
	"client_notes" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_quotes_quote_number_unique" UNIQUE("quote_number"),
	CONSTRAINT "billing_quotes_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "billing_recurring_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"client_id" integer NOT NULL,
	"title_template" varchar(512) NOT NULL,
	"line_items_json" text NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"tax_percent" integer DEFAULT 15 NOT NULL,
	"currency" varchar(8) DEFAULT 'ZAR' NOT NULL,
	"payment_terms" text,
	"frequency" varchar(64) NOT NULL,
	"day_of_month" integer DEFAULT 1 NOT NULL,
	"next_generation_at" timestamp NOT NULL,
	"last_generated_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"auto_draft" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_intelligence_compass" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_resolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"action_type" varchar(100),
	"description" text NOT NULL,
	"priority" varchar(20),
	"owner" varchar(255),
	"due_date" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_call_recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"twilio_rec_sid" varchar(100),
	"channels" integer DEFAULT 2,
	"duration_sec" integer,
	"file_size_bytes" bigint,
	"storage_url" varchar(500),
	"transcript_url" varchar(500),
	"transcript_text" text,
	"status" varchar(50) DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_conferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"bridge_event_id" integer NOT NULL,
	"twilio_conf_sid" varchar(100),
	"twilio_conf_name" varchar(255),
	"type" varchar(50) DEFAULT 'main' NOT NULL,
	"phase" varchar(50) DEFAULT 'waiting' NOT NULL,
	"is_recording" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"qa_active" boolean DEFAULT false NOT NULL,
	"recording_sid" varchar(100),
	"recording_url" varchar(500),
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128),
	"name" varchar(255) NOT NULL,
	"organiser_name" varchar(255),
	"organiser_email" varchar(255),
	"scheduled_at" timestamp,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"bridge_enabled" boolean DEFAULT true NOT NULL,
	"access_code" varchar(20),
	"dial_in_number" varchar(50),
	"external_sources" text,
	"recall_bot_ids" text,
	"shadow_session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_greeter_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"bridge_event_id" integer NOT NULL,
	"conference_id" integer,
	"twilio_call_sid" varchar(100),
	"phone_number" varchar(50),
	"voice_name_url" varchar(500),
	"voice_org_url" varchar(500),
	"transcribed_name" varchar(255),
	"transcribed_org" varchar(255),
	"status" varchar(50) DEFAULT 'waiting' NOT NULL,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"admitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bridge_operator_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer,
	"operator_id" varchar(255),
	"action" varchar(100) NOT NULL,
	"target_id" integer,
	"category" varchar(50) DEFAULT 'operator',
	"metadata" text,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"bridge_event_id" integer NOT NULL,
	"conference_id" integer,
	"name" varchar(255),
	"organisation" varchar(255),
	"phone_number" varchar(50),
	"role" varchar(50) DEFAULT 'participant' NOT NULL,
	"status" varchar(50) DEFAULT 'invited' NOT NULL,
	"connection_method" varchar(20) DEFAULT 'phone',
	"twilio_call_sid" varchar(100),
	"twilio_participant_sid" varchar(100),
	"voice_capture_url" varchar(500),
	"is_muted" boolean DEFAULT true NOT NULL,
	"is_on_hold" boolean DEFAULT false NOT NULL,
	"hand_raised" boolean DEFAULT false NOT NULL,
	"hand_raised_at" timestamp,
	"qa_position" integer,
	"notes" text,
	"join_time" timestamp,
	"leave_time" timestamp,
	"duration_seconds" integer,
	"greeted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridge_qa_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"participant_id" integer,
	"question_text" text,
	"method" varchar(20) DEFAULT 'phone_keypress',
	"queue_position" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"raised_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"went_live_at" timestamp,
	"answered_at" timestamp,
	"dismissed_at" timestamp,
	"operator_notes" text
);
--> statement-breakpoint
CREATE TABLE "briefing_action_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"action" varchar(255),
	"actor" varchar(255),
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "briefing_provenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"data_point" varchar(255),
	"source" varchar(255),
	"timestamp" timestamp,
	"confidence" real,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"presenter_name" varchar(256),
	"avg_wpm" real DEFAULT 0,
	"optimal_wpm_min" integer DEFAULT 130,
	"optimal_wpm_max" integer DEFAULT 160,
	"pace_alerts" integer DEFAULT 0,
	"filler_word_count" integer DEFAULT 0,
	"key_moments_json" json,
	"recap_json" json,
	"recap_generated_at" timestamp,
	"duration_seconds" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capability_roadmap" (
	"id" serial PRIMARY KEY NOT NULL,
	"timeframe" varchar(64) NOT NULL,
	"capability" varchar(255) NOT NULL,
	"rationale" text,
	"gap_score" real,
	"priority" varchar(64) DEFAULT 'medium' NOT NULL,
	"status" varchar(64) DEFAULT 'predicted' NOT NULL,
	"proposal_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_event_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"custom_title" varchar(255),
	"custom_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_portals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"custom_title" varchar(512),
	"custom_description" text,
	"password_protected" boolean DEFAULT false NOT NULL,
	"access_code" varchar(64),
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"logo_url" text,
	"primary_color" varchar(16) DEFAULT '#6c3fc5' NOT NULL,
	"secondary_color" varchar(16) DEFAULT '#1a1a2e' NOT NULL,
	"custom_domain" varchar(255),
	"contact_email" varchar(320),
	"billing_tier" varchar(64) DEFAULT 'professional' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commitment_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetingDbId" integer NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"investorId" integer,
	"investorName" varchar(255),
	"institution" varchar(255),
	"quote" text NOT NULL,
	"signalType" varchar(64) NOT NULL,
	"confidenceScore" integer DEFAULT 0 NOT NULL,
	"indicatedAmount" varchar(64),
	"detectedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compass_action_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"action" varchar(255),
	"actor" varchar(255),
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compass_provenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"output_type" varchar(100),
	"source" varchar(255),
	"timestamp" timestamp,
	"confidence" real,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"action_type" varchar(100),
	"description" text,
	"priority" varchar(20),
	"owner" varchar(255),
	"due_date" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128),
	"action" varchar(64) NOT NULL,
	"user_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"certificate_id" varchar(64) NOT NULL,
	"pdf_url" text NOT NULL,
	"generated_by" integer,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"signed_by" integer,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_certificates_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_detection_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"total_violations_detected" integer DEFAULT 0 NOT NULL,
	"violations_by_type" text,
	"violations_by_severity" text,
	"avg_confidence_score" real,
	"avg_detection_latency_ms" integer,
	"false_positive_rate" real,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_evidence_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_type" varchar(64) NOT NULL,
	"control_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"mime_type" varchar(100),
	"uploaded_by" integer,
	"uploaded_at" bigint NOT NULL,
	"expires_at" bigint
);
--> statement-breakpoint
CREATE TABLE "compliance_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"statement_text" text NOT NULL,
	"timestamp" varchar(16),
	"speaker_name" varchar(255),
	"risk_level" varchar(64) DEFAULT 'low' NOT NULL,
	"flag_reason" text,
	"compliance_status" varchar(64) DEFAULT 'flagged' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_framework_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework" varchar(64) NOT NULL,
	"control_ref" varchar(20) NOT NULL,
	"control_name" varchar(255) NOT NULL,
	"check_type" varchar(64) DEFAULT 'automated' NOT NULL,
	"status" varchar(64) DEFAULT 'not_assessed' NOT NULL,
	"last_checked_at" timestamp,
	"details" text,
	"evidence" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_hotspots" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"area" varchar(100),
	"description" text,
	"risk_level" varchar(20),
	"regulatory_basis" varchar(255),
	"recommended_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_provenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"flag_id" integer,
	"source" varchar(255),
	"timestamp" timestamp,
	"confidence" real,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_threats" (
	"id" serial PRIMARY KEY NOT NULL,
	"threat_type" varchar(64) NOT NULL,
	"severity" varchar(64) DEFAULT 'medium' NOT NULL,
	"status" varchar(64) DEFAULT 'detected' NOT NULL,
	"event_id" varchar(128),
	"source_system" varchar(64) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"evidence" json,
	"affected_entities" json,
	"ai_confidence" real DEFAULT 0,
	"ai_reasoning" text,
	"remediation_action" varchar(255),
	"remediation_taken_at" timestamp,
	"detected_by" varchar(64) DEFAULT 'compliance_engine' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"violation_id" varchar(128),
	"conference_id" integer,
	"violation_type" varchar(128) NOT NULL,
	"severity" varchar(32) NOT NULL,
	"confidence" real,
	"confidence_score" real,
	"speaker" varchar(255),
	"speaker_name" varchar(255),
	"speaker_role" varchar(128),
	"transcript" text,
	"transcript_excerpt" text,
	"start_time_ms" integer,
	"end_time_ms" integer,
	"acknowledged" smallint DEFAULT 0,
	"acknowledged_at" timestamp,
	"action_taken" varchar(64) DEFAULT 'none',
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_vocabulary" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" varchar(255) NOT NULL,
	"source" varchar(64) DEFAULT 'system' NOT NULL,
	"severity_weight" real DEFAULT 1,
	"times_flagged" integer DEFAULT 0,
	"times_dismissed" integer DEFAULT 0,
	"effective_weight" real DEFAULT 1,
	"sector" varchar(64),
	"added_by" varchar(255) DEFAULT 'system',
	"active" smallint DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conference_dialout_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"dialout_id" integer NOT NULL,
	"phone_number" varchar(32) NOT NULL,
	"label" varchar(255),
	"call_sid" varchar(128),
	"status" varchar(64) DEFAULT 'queued' NOT NULL,
	"duration_secs" integer,
	"answered_at" bigint,
	"ended_at" bigint,
	"error_message" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "conference_dialouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"conference_name" varchar(128) NOT NULL,
	"caller_id" varchar(32) NOT NULL,
	"total_participants" integer DEFAULT 0 NOT NULL,
	"connected_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"created_at" bigint NOT NULL,
	"ended_at" bigint
);
--> statement-breakpoint
CREATE TABLE "content_engagement_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"event_data" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"approval_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"approval_time" integer,
	"approval_score" varchar(16),
	"recipient_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"response_count" integer DEFAULT 0,
	"open_rate" varchar(16) DEFAULT '0',
	"click_through_rate" varchar(16) DEFAULT '0',
	"response_rate" varchar(16) DEFAULT '0',
	"engagement_score" varchar(16) DEFAULT '0',
	"quality_score" varchar(16),
	"relevance_score" varchar(16),
	"professionalism_score" varchar(16),
	"edits_count" integer DEFAULT 0,
	"rejection_reason" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_type_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" varchar(64) NOT NULL,
	"total_generated" integer DEFAULT 0,
	"approval_rate" varchar(16) DEFAULT '0',
	"avg_open_rate" varchar(16) DEFAULT '0',
	"avg_click_through_rate" varchar(16) DEFAULT '0',
	"performance_rank" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"event_id" varchar(128),
	"client_name" varchar(255) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"risk_level" varchar(64) DEFAULT 'low' NOT NULL,
	"risk_score" real DEFAULT 0,
	"predicted_crisis_type" varchar(128),
	"indicators" json,
	"sentiment_trajectory" json,
	"holding_statement" text,
	"regulatory_checklist" json,
	"alert_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_id" varchar(128),
	"permissions" json NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_access_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer,
	"registration_id" integer,
	"entered_pin" varchar(8) NOT NULL,
	"caller_number" varchar(32),
	"outcome" varchar(64) DEFAULT 'failed' NOT NULL,
	"call_sid" varchar(128),
	"dial_in_number" varchar(32),
	"attempted_at" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "director_liability_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"director_name" varchar(255) NOT NULL,
	"liability_area" varchar(100),
	"exposure_level" varchar(20),
	"description" text,
	"mitigation_steps" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disclosure_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"session_id" integer,
	"client_name" varchar(255) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"transcript_hash" varchar(128) NOT NULL,
	"report_hash" varchar(128) NOT NULL,
	"compliance_status" varchar(64) DEFAULT 'clean' NOT NULL,
	"compliance_flags" integer DEFAULT 0,
	"jurisdictions" json,
	"hash_chain" json,
	"previous_cert_hash" varchar(128),
	"certificate_hash" varchar(128) NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disclosure_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"filing_type" varchar(50),
	"trigger_reason" text,
	"status" varchar(20) DEFAULT 'draft',
	"draft_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "esg_studio_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"studio_id" integer NOT NULL,
	"flag_type" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(16) DEFAULT 'medium' NOT NULL,
	"content_snippet" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadshow_id" varchar(100) NOT NULL,
	"client_name" varchar(200) NOT NULL,
	"logo_url" varchar(500),
	"primary_color" varchar(20) DEFAULT '#3b82f6',
	"accent_color" varchar(20) DEFAULT '#10b981',
	"background_color" varchar(20) DEFAULT '#0f172a',
	"text_color" varchar(20) DEFAULT '#f8fafc',
	"font_family" varchar(100) DEFAULT 'Space Grotesk',
	"tagline" varchar(300),
	"footer_text" varchar(500),
	"favicon_url" varchar(500),
	"show_chorus_watermark" boolean DEFAULT true,
	"custom_css" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "event_branding_roadshow_id_unique" UNIQUE("roadshow_id")
);
--> statement-breakpoint
CREATE TABLE "event_brief_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" varchar(128),
	"event_id" integer,
	"brief_type" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"operator_approved" smallint DEFAULT 0,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_customisation" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"client_name" varchar(200) DEFAULT 'CuraLive' NOT NULL,
	"logo_url" varchar(500),
	"primary_color" varchar(20) DEFAULT '#c8a96e',
	"accent_color" varchar(20) DEFAULT '#10b981',
	"font_family" varchar(100) DEFAULT 'Space Grotesk',
	"show_powered_by" boolean DEFAULT true,
	"reg_page_title" varchar(300),
	"reg_page_subtitle" varchar(500),
	"reg_host_name" varchar(200),
	"reg_host_title" varchar(200),
	"reg_host_org" varchar(200),
	"reg_event_date" varchar(100),
	"reg_event_time" varchar(100),
	"reg_event_timezone" varchar(64) DEFAULT 'SAST',
	"reg_description" text,
	"reg_features" text,
	"reg_agenda" text,
	"reg_speakers" text,
	"reg_industry_vertical" varchar(64) DEFAULT 'general',
	"reg_max_attendees" integer DEFAULT 1000,
	"reg_consent_text" text,
	"reg_support_email" varchar(320),
	"reg_field_company" boolean DEFAULT true,
	"reg_field_job_title" boolean DEFAULT true,
	"reg_field_phone" boolean DEFAULT false,
	"reg_field_country" boolean DEFAULT false,
	"reg_field_language" boolean DEFAULT true,
	"reg_field_dial_in" boolean DEFAULT true,
	"book_headline" varchar(300),
	"book_subheadline" varchar(500),
	"book_features" text,
	"book_service_options" text,
	"book_reply_email" varchar(320),
	"book_button_label" varchar(100) DEFAULT 'Submit Booking Request',
	"email_sender_name" varchar(200) DEFAULT 'CuraLive',
	"email_sender_address" varchar(320),
	"email_header_color" varchar(20) DEFAULT '#0f172a',
	"email_button_color" varchar(20) DEFAULT '#3b82f6',
	"email_button_label" varchar(100) DEFAULT 'Join Event',
	"email_footer_text" varchar(500),
	"custom_slug" varchar(128),
	"short_link_enabled" boolean DEFAULT false,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "event_customisation_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "event_performance_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"content_items_generated" integer DEFAULT 0,
	"content_items_approved" integer DEFAULT 0,
	"content_items_rejected" integer DEFAULT 0,
	"overall_approval_rate" varchar(16) DEFAULT '0',
	"avg_time_to_approval" integer,
	"total_content_sent" integer DEFAULT 0,
	"total_engagements" integer DEFAULT 0,
	"avg_engagement_rate" varchar(16) DEFAULT '0',
	"best_performing_type" varchar(50),
	"best_performing_score" varchar(16),
	"worst_performing_type" varchar(50),
	"worst_performing_score" varchar(16),
	"avg_content_quality" varchar(16),
	"operator_satisfaction" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp NOT NULL,
	"timezone" varchar(64) DEFAULT 'Africa/Johannesburg' NOT NULL,
	"recurrence_rule" varchar(512),
	"parent_schedule_id" integer,
	"setup_minutes" integer DEFAULT 30 NOT NULL,
	"teardown_minutes" integer DEFAULT 15 NOT NULL,
	"status" varchar(64) DEFAULT 'tentative' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"created_by" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"default_duration_minutes" integer DEFAULT 60 NOT NULL,
	"default_setup_minutes" integer DEFAULT 30 NOT NULL,
	"default_features" text,
	"default_platform" varchar(64) DEFAULT 'pstn' NOT NULL,
	"dial_in_countries" text,
	"max_attendees" integer DEFAULT 500 NOT NULL,
	"requires_registration" boolean DEFAULT true NOT NULL,
	"compliance_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"platform" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'upcoming' NOT NULL,
	"accessCode" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_eventId_unique" UNIQUE("eventId")
);
--> statement-breakpoint
CREATE TABLE "evolution_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"proposal_id" integer,
	"proposal_title" varchar(255),
	"details" json,
	"blockchain_hash" varchar(128),
	"previous_hash" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followup_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"followup_id" integer NOT NULL,
	"email_body" text,
	"recipient_email" varchar(320),
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_communication_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"clarity" real,
	"consistency" real,
	"completeness" real,
	"timeliness" real,
	"overall_score" real,
	"recommendations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interconnection_activations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128),
	"user_id" integer DEFAULT 0 NOT NULL,
	"feature_id" varchar(64) NOT NULL,
	"connected_feature_id" varchar(64) NOT NULL,
	"activation_source" varchar(32) DEFAULT 'manual' NOT NULL,
	"roi_multiplier" real DEFAULT 1 NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interconnection_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(16) NOT NULL,
	"total_activations" integer DEFAULT 0 NOT NULL,
	"unique_features" integer DEFAULT 0 NOT NULL,
	"avg_connections_per_user" real DEFAULT 0 NOT NULL,
	"top_feature_id" varchar(64),
	"roi_realized" real DEFAULT 0 NOT NULL,
	"workflow_completion_rate" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_briefing_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"investorId" integer NOT NULL,
	"meetingDbId" integer NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"investorProfile" text,
	"recentActivity" text,
	"suggestedTalkingPoints" text,
	"knownConcerns" text,
	"previousInteractions" text,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"investor_name" varchar(255),
	"investor_email" varchar(320),
	"investor_company" varchar(255),
	"question_text" text,
	"commitment_text" text,
	"follow_up_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"crm_contact_id" varchar(128),
	"crm_activity_id" varchar(128),
	"email_template" text,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(255),
	"role" varchar(128),
	"phoneNumber" varchar(32),
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ir_contacts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "iso27001_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" varchar(20) NOT NULL,
	"clause" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(64) DEFAULT 'non_compliant' NOT NULL,
	"owner_name" varchar(100),
	"notes" text,
	"testing_frequency" varchar(50),
	"last_tested_at" timestamp,
	"evidence_urls" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jurisdiction_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20),
	"name" varchar(255),
	"rule_set_version" varchar(50),
	"applicable_rules" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jurisdiction_profiles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "live_meeting_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetingDbId" integer NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"summary" text NOT NULL,
	"keyTopics" text,
	"actionItems" text,
	"sentiment" varchar(64) DEFAULT 'neutral',
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_qa_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer_text" text NOT NULL,
	"is_auto_draft" boolean DEFAULT false,
	"auto_draft_reasoning" text,
	"approved_by_operator" boolean DEFAULT false,
	"answered_at" bigint
);
--> statement-breakpoint
CREATE TABLE "live_qa_compliance_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"jurisdiction" varchar(50) NOT NULL,
	"risk_score" real NOT NULL,
	"risk_type" varchar(100) NOT NULL,
	"risk_description" text,
	"recommended_action" varchar(64) DEFAULT 'forward' NOT NULL,
	"auto_remediation_suggestion" text,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_qa_platform_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"platform" varchar(64) NOT NULL,
	"share_type" varchar(64) DEFAULT 'link' NOT NULL,
	"share_link" varchar(1000) NOT NULL,
	"white_label" boolean DEFAULT false,
	"brand_name" varchar(255),
	"brand_color" varchar(7),
	"click_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_qa_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"submitter_name" varchar(200),
	"submitter_email" varchar(255),
	"submitter_company" varchar(200),
	"question_category" varchar(64) DEFAULT 'general' NOT NULL,
	"question_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"upvotes" integer DEFAULT 0,
	"triage_score" real,
	"triage_classification" varchar(32),
	"triage_reason" text,
	"compliance_risk_score" real,
	"priority_score" real,
	"is_anonymous" boolean DEFAULT false,
	"operator_notes" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint
);
--> statement-breakpoint
CREATE TABLE "live_qa_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_code" varchar(20) NOT NULL,
	"shadow_session_id" integer,
	"event_name" varchar(500) NOT NULL,
	"client_name" varchar(255),
	"qa_session_status" varchar(64) DEFAULT 'active' NOT NULL,
	"total_questions" integer DEFAULT 0,
	"total_approved" integer DEFAULT 0,
	"total_rejected" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "live_qa_sessions_session_code_unique" UNIQUE("session_code")
);
--> statement-breakpoint
CREATE TABLE "live_roadshow_investors" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"meetingId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"institution" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(32),
	"jobTitle" varchar(255),
	"waitingRoomStatus" varchar(64) DEFAULT 'not_arrived' NOT NULL,
	"arrivedAt" timestamp,
	"admittedAt" timestamp,
	"inviteSentAt" timestamp,
	"inviteToken" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_roadshow_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"meetingDate" varchar(32) NOT NULL,
	"startTime" varchar(8) NOT NULL,
	"endTime" varchar(8) NOT NULL,
	"timezone" varchar(64) DEFAULT 'Europe/London' NOT NULL,
	"meetingType" varchar(64) DEFAULT '1x1' NOT NULL,
	"platform" varchar(64) DEFAULT 'zoom' NOT NULL,
	"videoLink" varchar(512),
	"meetingId" varchar(128),
	"passcode" varchar(64),
	"status" varchar(64) DEFAULT 'scheduled' NOT NULL,
	"operatorNotes" text,
	"slideDeckUrl" varchar(1024),
	"slideDeckName" varchar(255),
	"currentSlideIndex" integer DEFAULT 0 NOT NULL,
	"totalSlides" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_roadshows" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadshowId" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"issuer" varchar(255) NOT NULL,
	"bank" varchar(255),
	"serviceType" varchar(64) DEFAULT 'capital_raising_1x1' NOT NULL,
	"platform" varchar(64) DEFAULT 'zoom' NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"startDate" varchar(32),
	"endDate" varchar(32),
	"timezone" varchar(64) DEFAULT 'Europe/London' NOT NULL,
	"brandingEnabled" boolean DEFAULT true NOT NULL,
	"customLogoUrl" varchar(512),
	"notes" text,
	"createdByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "live_roadshows_roadshowId_unique" UNIQUE("roadshowId")
);
--> statement-breakpoint
CREATE TABLE "lumi_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"client_name" varchar(255) NOT NULL,
	"agm_title" varchar(512) NOT NULL,
	"agm_date" varchar(32),
	"agm_time" varchar(16),
	"jurisdiction" varchar(64) DEFAULT 'south_africa' NOT NULL,
	"expected_attendees" integer,
	"meeting_url" varchar(1000),
	"platform" varchar(64) DEFAULT 'zoom' NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"lumi_reference" varchar(128),
	"lumi_recipients" text,
	"confirmation_sent_at" timestamp,
	"dashboard_token" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'booked' NOT NULL,
	"checklist" json,
	"shadow_session_id" integer,
	"agm_session_id" integer,
	"notes" text,
	"resolutions_json" json,
	"report_delivered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_list_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"mailing_list_id" integer NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(255),
	"job_title" varchar(255),
	"access_pin" varchar(8),
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"join_method" varchar(64),
	"registration_id" integer,
	"confirm_token" varchar(64),
	"email_sent_at" timestamp,
	"clicked_at" timestamp,
	"registered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"total_entries" integer DEFAULT 0 NOT NULL,
	"processed_entries" integer DEFAULT 0 NOT NULL,
	"emailed_entries" integer DEFAULT 0 NOT NULL,
	"registered_entries" integer DEFAULT 0 NOT NULL,
	"webhook_url" varchar(512),
	"default_join_method" varchar(64),
	"pre_registered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_month" varchar(7) NOT NULL,
	"client_name" varchar(255),
	"total_events" integer DEFAULT 0,
	"avg_sentiment" real,
	"total_compliance_flags" integer DEFAULT 0,
	"communication_health_score" real,
	"report_data" json,
	"status" varchar(64) DEFAULT 'generating' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mux_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"meeting_id" integer,
	"mux_stream_id" varchar(100) NOT NULL,
	"mux_playback_id" varchar(100),
	"stream_key" varchar(200) NOT NULL,
	"rtmp_url" varchar(300) DEFAULT 'rtmps://global-live.mux.com:443/app',
	"status" varchar(50) DEFAULT 'idle' NOT NULL,
	"label" varchar(200),
	"is_public" boolean DEFAULT true,
	"recording_enabled" boolean DEFAULT true,
	"mux_asset_id" varchar(100),
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"started_at" bigint,
	"ended_at" bigint,
	CONSTRAINT "mux_streams_mux_stream_id_unique" UNIQUE("mux_stream_id")
);
--> statement-breakpoint
CREATE TABLE "occ_access_code_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"callingNumber" varchar(32),
	"calledNumber" varchar(32),
	"accessCodeEntered" varchar(64),
	"isValid" boolean NOT NULL,
	"attemptedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_audio_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer,
	"name" varchar(255) NOT NULL,
	"fileUrl" varchar(512) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"durationSeconds" integer,
	"isPlaying" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"senderType" varchar(64) NOT NULL,
	"senderName" varchar(255) NOT NULL,
	"senderId" integer,
	"recipientType" varchar(64) DEFAULT 'all' NOT NULL,
	"recipientId" integer,
	"message" text NOT NULL,
	"detectedLanguage" varchar(10),
	"translatedMessage" text,
	"translationLanguage" varchar(10),
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_conferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" varchar(128) NOT NULL,
	"callId" varchar(64) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"reseller" varchar(128) DEFAULT 'CuraLive' NOT NULL,
	"product" varchar(128) DEFAULT 'Event Conference' NOT NULL,
	"moderatorCode" varchar(32),
	"participantCode" varchar(32),
	"securityCode" varchar(32),
	"dialInNumber" varchar(32),
	"webAccessCode" varchar(32),
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"isRecording" boolean DEFAULT false NOT NULL,
	"waitingMusicEnabled" boolean DEFAULT true NOT NULL,
	"participantLimitEnabled" boolean DEFAULT false NOT NULL,
	"participantLimit" integer DEFAULT 500,
	"requestsToSpeakEnabled" boolean DEFAULT true NOT NULL,
	"autoAdmitEnabled" boolean DEFAULT false NOT NULL,
	"scheduledStart" timestamp,
	"actualStart" timestamp,
	"endedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "occ_conferences_callId_unique" UNIQUE("callId")
);
--> statement-breakpoint
CREATE TABLE "occ_dial_out_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"operatorId" integer,
	"operatorName" varchar(255),
	"dialEntries" text NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"failCount" integer DEFAULT 0 NOT NULL,
	"totalCount" integer DEFAULT 0 NOT NULL,
	"initiatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_green_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"name" varchar(255) DEFAULT 'Speaker Green Room' NOT NULL,
	"dialInNumber" varchar(32),
	"accessCode" varchar(32),
	"isActive" boolean DEFAULT false NOT NULL,
	"isOpen" boolean DEFAULT false NOT NULL,
	"transferredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "occ_green_rooms_conferenceId_unique" UNIQUE("conferenceId")
);
--> statement-breakpoint
CREATE TABLE "occ_live_rolling_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" varchar(128) NOT NULL,
	"summary" text NOT NULL,
	"segment_count" integer DEFAULT 0 NOT NULL,
	"from_time_ms" integer,
	"to_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_lounge" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"callId" varchar(64) NOT NULL,
	"phoneNumber" varchar(32),
	"name" varchar(255),
	"company" varchar(255),
	"dialInNumber" varchar(32),
	"description" varchar(255),
	"language" varchar(32) DEFAULT 'en',
	"arrivedAt" timestamp DEFAULT now() NOT NULL,
	"pickedAt" timestamp,
	"pickedByOperatorId" integer,
	"status" varchar(64) DEFAULT 'waiting' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_operator_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"participantId" integer NOT NULL,
	"callId" varchar(64) NOT NULL,
	"subject" varchar(255),
	"phoneNumber" varchar(32),
	"dialInNumber" varchar(32),
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"pickedAt" timestamp,
	"pickedByOperatorId" integer,
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_operator_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"operatorName" varchar(255) NOT NULL,
	"state" varchar(64) DEFAULT 'absent' NOT NULL,
	"activeConferenceId" integer,
	"openConferenceIds" text,
	"lastHeartbeat" timestamp DEFAULT now() NOT NULL,
	"loginAt" timestamp,
	"breakAt" timestamp,
	"logoutAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_participant_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"participantId" integer NOT NULL,
	"event" varchar(64) NOT NULL,
	"triggeredBy" varchar(64) DEFAULT 'system' NOT NULL,
	"operatorId" integer,
	"note" varchar(255),
	"occurredAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conferenceId" integer NOT NULL,
	"lineNumber" integer NOT NULL,
	"role" varchar(64) DEFAULT 'participant' NOT NULL,
	"name" varchar(255),
	"company" varchar(255),
	"location" varchar(128),
	"phoneNumber" varchar(32),
	"dialInNumber" varchar(32),
	"voiceServer" varchar(32),
	"state" varchar(64) DEFAULT 'incoming' NOT NULL,
	"isSpeaking" boolean DEFAULT false NOT NULL,
	"isWebParticipant" boolean DEFAULT false NOT NULL,
	"requestToSpeak" boolean DEFAULT false NOT NULL,
	"requestToSpeakPosition" integer,
	"registrationId" integer,
	"subconferenceId" integer,
	"isMonitored" boolean DEFAULT false NOT NULL,
	"monitoringOperatorId" integer,
	"connectedAt" timestamp,
	"disconnectedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occ_transcription_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer NOT NULL,
	"speaker_name" varchar(255),
	"speaker_role" varchar(64),
	"text" text,
	"start_time" integer,
	"end_time" integer,
	"confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"archive_id" integer,
	"action_type" varchar(64) NOT NULL,
	"detail" text,
	"operator_id" integer,
	"operator_name" varchar(255),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"override_date" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_title" varchar(255),
	"metric_id" integer,
	"correction_type" varchar(64) NOT NULL,
	"original_value" real,
	"corrected_value" real,
	"original_label" varchar(255),
	"corrected_label" varchar(255),
	"reason" text,
	"event_type" varchar(64),
	"client_name" varchar(255),
	"operator_id" varchar(255) DEFAULT 'operator',
	"applied_to_model" smallint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_link_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" integer,
	"link_path" varchar(255) NOT NULL,
	"link_title" varchar(255),
	"category" varchar(64),
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"time_spent_seconds" integer,
	"user_agent" text,
	"ip_address" varchar(45),
	"session_id" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "operator_links_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_path" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50),
	"badge_type" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operator_links_metadata_link_path_unique" UNIQUE("link_path")
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_text" varchar(512) NOT NULL,
	"option_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_id" integer,
	"voter_id" integer,
	"voter_session" varchar(128),
	"text_response" text,
	"rating_value" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"created_by" integer NOT NULL,
	"question" text NOT NULL,
	"poll_type" varchar(64) DEFAULT 'multiple_choice' NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"allow_multiple" boolean DEFAULT false NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"scheduled_at" timestamp,
	"opened_at" timestamp,
	"closed_at" timestamp,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_event_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" varchar(128) NOT NULL,
	"conferenceId" integer,
	"aiSummary" text,
	"keyTopics" text,
	"sentimentTrends" text,
	"keyQuotes" text,
	"fullTranscript" text,
	"transcriptFormat" varchar(32) DEFAULT 'txt',
	"recordingUrl" varchar(512),
	"recordingKey" varchar(512),
	"recordingDurationSeconds" integer,
	"complianceScore" integer,
	"flaggedItems" text,
	"totalParticipants" integer,
	"totalDuration" integer,
	"engagementScore" integer,
	"analyticsData" text,
	"deliveryStatus" varchar(64) DEFAULT 'pending' NOT NULL,
	"deliveredAt" timestamp,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_event_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"generated_by" integer NOT NULL,
	"report_type" varchar(64) DEFAULT 'full' NOT NULL,
	"status" varchar(64) DEFAULT 'generating' NOT NULL,
	"ai_summary" text,
	"key_moments" text,
	"sentiment_overview" text,
	"qa_summary" text,
	"engagement_metrics" text,
	"compliance_flags" text,
	"full_transcript_url" text,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_event_intelligence_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"briefing_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predicted_qa_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"topic" varchar(255),
	"predicted_question" text,
	"suggested_answer" text,
	"probability" real,
	"risk_level" varchar(20),
	"source" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"advancedAnalytics" boolean DEFAULT false NOT NULL,
	"complianceReporting" boolean DEFAULT false NOT NULL,
	"whiteLabel" boolean DEFAULT false NOT NULL,
	"multiLanguageTranscription" boolean DEFAULT false NOT NULL,
	"customBranding" boolean DEFAULT false NOT NULL,
	"apiAccess" boolean DEFAULT false NOT NULL,
	"maxEventsPerMonth" integer DEFAULT 5,
	"maxParticipantsPerEvent" integer DEFAULT 500,
	"storageGbPerMonth" integer DEFAULT 10,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "premium_features_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "prior_commitment_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"compass_id" integer NOT NULL,
	"commitment_type" varchar(100) NOT NULL,
	"statement" text NOT NULL,
	"source" varchar(255),
	"event_date" timestamp,
	"speaker" varchar(255),
	"confidence" real,
	"risk_level" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" varchar(128),
	"endpoint" text NOT NULL,
	"p256dh_key" varchar(255) NOT NULL,
	"auth_key" varchar(255) NOT NULL,
	"device_type" varchar(64) DEFAULT 'mobile',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_auto_triage_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"qa_id" integer NOT NULL,
	"conference_id" integer,
	"classification" varchar(32) NOT NULL,
	"confidence" real,
	"reason" text,
	"is_sensitive" smallint DEFAULT 0 NOT NULL,
	"sensitivity_flags" text,
	"triage_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"briefing_id" integer NOT NULL,
	"category" varchar(100),
	"score" real,
	"max_score" real,
	"gaps" text,
	"recommendations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"meeting_id" integer,
	"recall_bot_id" varchar(100) NOT NULL,
	"meeting_url" text NOT NULL,
	"bot_name" varchar(200) DEFAULT 'CuraLive',
	"status" varchar(50) DEFAULT 'created' NOT NULL,
	"ably_channel" varchar(200),
	"transcript_json" text,
	"summary" text,
	"recording_url" text,
	"error_message" text,
	"started_at" bigint NOT NULL,
	"joined_at" bigint,
	"left_at" bigint,
	"created_at" bigint NOT NULL,
	CONSTRAINT "recall_bots_recall_bot_id_unique" UNIQUE("recall_bot_id")
);
--> statement-breakpoint
CREATE TABLE "regulatory_compliance_monitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"monitoring_started" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"flag_type" varchar(100),
	"jurisdiction" varchar(50),
	"rule_set" varchar(100),
	"severity" varchar(20),
	"statement" text,
	"speaker" varchar(255),
	"segment_timestamp" varchar(20),
	"rule_basis" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_key_moments" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"timestamp_seconds" integer NOT NULL,
	"moment_type" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"speaker" varchar(255),
	"severity" varchar(64) DEFAULT 'low',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_identifier" varchar(256) NOT NULL,
	"allocated_at" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentiment_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"overall_score" integer DEFAULT 50 NOT NULL,
	"bullish_count" integer DEFAULT 0 NOT NULL,
	"neutral_count" integer DEFAULT 0 NOT NULL,
	"bearish_count" integer DEFAULT 0 NOT NULL,
	"top_sentiment_drivers" text,
	"per_speaker_sentiment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shadow_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"platform" varchar(64) DEFAULT 'zoom' NOT NULL,
	"meeting_url" varchar(1000) NOT NULL,
	"recall_bot_id" varchar(255),
	"ably_channel" varchar(255),
	"local_transcript_json" text,
	"local_recording_path" varchar(1000),
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"transcript_segments" integer DEFAULT 0,
	"sentiment_avg" real,
	"compliance_flags" integer DEFAULT 0,
	"tagged_metrics_generated" integer DEFAULT 0,
	"notes" text,
	"started_at" bigint,
	"ended_at" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slide_thumbnails" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetingDbId" integer NOT NULL,
	"slideIndex" integer NOT NULL,
	"thumbnailUrl" varchar(1024) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soc2_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(64) DEFAULT 'non_compliant' NOT NULL,
	"owner_name" varchar(100),
	"notes" text,
	"testing_frequency" varchar(50),
	"last_tested_at" timestamp,
	"evidence_urls" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer,
	"action" varchar(64) NOT NULL,
	"platform" varchar(32),
	"details" text,
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" varchar(64) NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_handle" varchar(255),
	"avatar_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"linked_events" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"platform" varchar(64) NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"engagement_rate" real DEFAULT 0 NOT NULL,
	"roi_correlation" real DEFAULT 0 NOT NULL,
	"ai_insight" text,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_post_platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"platform" varchar(64) NOT NULL,
	"external_post_id" varchar(255),
	"publish_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"published_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"created_by" integer NOT NULL,
	"content" text NOT NULL,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"echo_source" varchar(64),
	"content_type" varchar(64) DEFAULT 'text' NOT NULL,
	"platforms" text NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"moderation_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"moderation_notes" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaker_pace_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"event_title" varchar(255) NOT NULL,
	"speaker" varchar(255) NOT NULL,
	"wpm" integer NOT NULL,
	"pace_label" varchar(32) NOT NULL,
	"pause_score" integer NOT NULL,
	"filler_word_count" integer DEFAULT 0 NOT NULL,
	"overall_score" integer NOT NULL,
	"analysed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_pace_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" varchar(128) NOT NULL,
	"segment_id" integer,
	"speaker_name" varchar(255),
	"words_per_minute" real,
	"filler_word_count" integer DEFAULT 0 NOT NULL,
	"pause_count" integer DEFAULT 0 NOT NULL,
	"coaching_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripeCustomerId" varchar(128) NOT NULL,
	"email" varchar(320) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customers_userId_unique" UNIQUE("userId"),
	CONSTRAINT "stripe_customers_stripeCustomerId_unique" UNIQUE("stripeCustomerId")
);
--> statement-breakpoint
CREATE TABLE "stripe_payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripeEventId" varchar(128) NOT NULL,
	"eventType" varchar(128) NOT NULL,
	"userId" integer,
	"data" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_payment_events_stripeEventId_unique" UNIQUE("stripeEventId")
);
--> statement-breakpoint
CREATE TABLE "stripe_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripeSubscriptionId" varchar(128) NOT NULL,
	"stripePriceId" varchar(128) NOT NULL,
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"tier" varchar(64) DEFAULT 'basic' NOT NULL,
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"canceledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_subscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
);
--> statement-breakpoint
CREATE TABLE "studio_interconnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"studio_id" integer NOT NULL,
	"feature_id" varchar(64) NOT NULL,
	"connected_feature_id" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"active_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"active_layout" varchar(64) DEFAULT 'single-presenter',
	"feed_sources" json,
	"lower_thirds" json,
	"active_overlays" json,
	"live_sentiment_overlay" boolean DEFAULT false,
	"participant_count_overlay" boolean DEFAULT false,
	"recording_status" varchar(32) DEFAULT 'idle',
	"stream_key" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sustainability_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"event_title" varchar(512) DEFAULT '',
	"total_attendees" integer DEFAULT 0 NOT NULL,
	"duration_hours" real DEFAULT 1 NOT NULL,
	"is_virtual" boolean DEFAULT true,
	"physical_co2_tonnes" real DEFAULT 0 NOT NULL,
	"virtual_co2_tonnes" real DEFAULT 0 NOT NULL,
	"carbon_saved_tonnes" real DEFAULT 0 NOT NULL,
	"savings_percent" real DEFAULT 0 NOT NULL,
	"total_cost_avoided_usd" real DEFAULT 0 NOT NULL,
	"grade" varchar(4) DEFAULT 'B' NOT NULL,
	"breakdown_json" json,
	"country" varchar(8) DEFAULT 'ZA',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tagged_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_title" varchar(255),
	"tag_type" varchar(64) NOT NULL,
	"metric_value" real NOT NULL,
	"label" varchar(255),
	"detail" text,
	"bundle" varchar(64),
	"severity" varchar(64) DEFAULT 'neutral' NOT NULL,
	"source" varchar(64) DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toxicity_filter_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"content_type" varchar(32) DEFAULT 'qa' NOT NULL,
	"toxicity_score" real DEFAULT 0,
	"categories" text,
	"flagged" smallint DEFAULT 0 NOT NULL,
	"action_taken" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_session_id" integer NOT NULL,
	"training_conference_id" integer NOT NULL,
	"operator_id" integer NOT NULL,
	"participant_name" varchar(255) NOT NULL,
	"call_duration" integer DEFAULT 0 NOT NULL,
	"call_quality" varchar(64) DEFAULT 'good' NOT NULL,
	"operator_performance" text,
	"participant_feedback" text,
	"recording_url" varchar(1024),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_conferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_session_id" integer NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"call_id" varchar(128) NOT NULL,
	"subject" varchar(512) NOT NULL,
	"product" varchar(128),
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_lounge" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_session_id" integer NOT NULL,
	"participant_name" varchar(255) NOT NULL,
	"waiting_since" timestamp DEFAULT now() NOT NULL,
	"status" varchar(64) DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_mode_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" integer NOT NULL,
	"operator_name" varchar(255) NOT NULL,
	"session_name" varchar(255) NOT NULL,
	"scenario" varchar(64) NOT NULL,
	"mentor_id" integer,
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_conference_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"role" varchar(64),
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"phone_number" varchar(32),
	"state" varchar(64) DEFAULT 'incoming' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_session_id" integer NOT NULL,
	"operator_id" integer NOT NULL,
	"total_calls_handled" integer DEFAULT 0 NOT NULL,
	"average_call_duration" integer DEFAULT 0 NOT NULL,
	"call_quality_score" varchar(8) DEFAULT '0' NOT NULL,
	"average_participant_satisfaction" varchar(8) DEFAULT '0' NOT NULL,
	"communication_score" varchar(8) DEFAULT '0' NOT NULL,
	"problem_solving_score" varchar(8) DEFAULT '0' NOT NULL,
	"professionalism" varchar(8) DEFAULT '0' NOT NULL,
	"overall_score" varchar(8) DEFAULT '0' NOT NULL,
	"ready_for_production" boolean DEFAULT false NOT NULL,
	"mentor_notes" text,
	"evaluated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_edit_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer,
	"edit_id" integer NOT NULL,
	"action" varchar(64) NOT NULL,
	"actor_id" integer,
	"actor_name" varchar(255),
	"user_role" varchar(64),
	"details" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_edits" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer,
	"segment_id" integer DEFAULT 0,
	"transcription_segment_id" integer,
	"operator_id" integer,
	"operator_name" varchar(255),
	"original_text" text NOT NULL,
	"corrected_text" text NOT NULL,
	"edit_type" varchar(64) NOT NULL,
	"reason" text,
	"confidence" real,
	"approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"status" varchar(32) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conference_id" integer,
	"version_number" integer NOT NULL,
	"full_transcript" text NOT NULL,
	"edit_count" integer DEFAULT 0,
	"change_description" text,
	"created_by" integer,
	"created_by_name" varchar(255),
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcription_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"source" varchar(64) DEFAULT 'forge_ai' NOT NULL,
	"status" varchar(64) DEFAULT 'queued' NOT NULL,
	"language_detected" varchar(16),
	"languages_requested" text,
	"audio_url" text,
	"duration_seconds" integer,
	"word_count" integer,
	"confidence_score" varchar(8),
	"speaker_count" integer,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"suggestion" text,
	"email" varchar(255),
	"user_id" integer,
	"page_url" varchar(1000),
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(64) DEFAULT 'user' NOT NULL,
	"jobTitle" varchar(255),
	"organisation" varchar(255),
	"bio" text,
	"avatarUrl" text,
	"phone" varchar(64),
	"linkedinUrl" varchar(512),
	"timezone" varchar(64) DEFAULT 'Africa/Johannesburg',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "valuation_impacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"prior_sentiment" real,
	"post_sentiment" real,
	"sentiment_delta" real,
	"predicted_share_impact" varchar(64),
	"fair_value_gap" varchar(64),
	"material_disclosures" json,
	"risk_factors" json,
	"analyst_consensus_impact" varchar(128),
	"market_reaction_prediction" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "virtual_studios" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"bundle_id" varchar(8) NOT NULL,
	"studio_name" varchar(255) DEFAULT 'My Virtual Studio' NOT NULL,
	"avatar_style" varchar(32) DEFAULT 'professional' NOT NULL,
	"primary_language" varchar(8) DEFAULT 'en' NOT NULL,
	"dubbing_languages" text,
	"esg_enabled" boolean DEFAULT false NOT NULL,
	"replay_enabled" boolean DEFAULT true NOT NULL,
	"overlays_config" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webcast_analytics_expanded" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"viewer_engagement" real DEFAULT 0 NOT NULL,
	"roi_uplift" real DEFAULT 0 NOT NULL,
	"carbon_footprint_kg" real DEFAULT 0 NOT NULL,
	"carbon_saved_kg" real DEFAULT 0 NOT NULL,
	"attendees_travel_avoided" integer DEFAULT 0 NOT NULL,
	"ad_revenue" real DEFAULT 0 NOT NULL,
	"podcast_listens" integer DEFAULT 0 NOT NULL,
	"recap_views" integer DEFAULT 0 NOT NULL,
	"sustainability_grade" varchar(4) DEFAULT 'B' NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webcast_enhancements" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"personalization_enabled" boolean DEFAULT true NOT NULL,
	"xr_enabled" boolean DEFAULT false NOT NULL,
	"language_dubbing_enabled" boolean DEFAULT false NOT NULL,
	"dubbing_language" varchar(32) DEFAULT 'en' NOT NULL,
	"sustainability_score" real DEFAULT 0 NOT NULL,
	"ad_integration_enabled" boolean DEFAULT false NOT NULL,
	"ad_pre_roll_enabled" boolean DEFAULT false NOT NULL,
	"ad_mid_roll_enabled" boolean DEFAULT false NOT NULL,
	"noise_enhancement_enabled" boolean DEFAULT true NOT NULL,
	"noise_gate_enabled" boolean DEFAULT true NOT NULL,
	"echo_cancellation_enabled" boolean DEFAULT true NOT NULL,
	"auto_gain_enabled" boolean DEFAULT false NOT NULL,
	"podcast_generated_at" timestamp,
	"podcast_title" varchar(512),
	"podcast_script" text,
	"recap_generated_at" timestamp,
	"recap_brief" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webcast_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"event_type" varchar(64) DEFAULT 'webinar' NOT NULL,
	"industry_vertical" varchar(64) DEFAULT 'general' NOT NULL,
	"webcast_status" varchar(64) DEFAULT 'draft' NOT NULL,
	"start_time" bigint,
	"end_time" bigint,
	"timezone" varchar(64) DEFAULT 'UTC',
	"max_attendees" integer DEFAULT 1000,
	"registration_count" integer DEFAULT 0,
	"peak_attendees" integer DEFAULT 0,
	"stream_url" varchar(500),
	"rtmp_key" varchar(256),
	"recording_url" varchar(500),
	"registration_enabled" boolean DEFAULT true,
	"chat_enabled" boolean DEFAULT true,
	"qa_enabled" boolean DEFAULT true,
	"polls_enabled" boolean DEFAULT true,
	"recording_enabled" boolean DEFAULT true,
	"logo_url" varchar(500),
	"primary_color" varchar(20) DEFAULT '#3b82f6',
	"host_name" varchar(200),
	"host_organization" varchar(200),
	"tags" varchar(500),
	"ai_application_ids" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "webcast_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "webcast_polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"question" varchar(500) NOT NULL,
	"options" text NOT NULL,
	"results" text,
	"poll_status" varchar(64) DEFAULT 'draft' NOT NULL,
	"allow_multiple" boolean DEFAULT false,
	"show_results_to_attendees" boolean DEFAULT true,
	"total_votes" integer DEFAULT 0,
	"created_at" bigint NOT NULL,
	"closed_at" bigint
);
--> statement-breakpoint
CREATE TABLE "webcast_qa" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"attendee_name" varchar(200) NOT NULL,
	"attendee_email" varchar(255),
	"attendee_company" varchar(200),
	"question" text NOT NULL,
	"qa_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"upvotes" integer DEFAULT 0,
	"answer" text,
	"answered_by" varchar(200),
	"answered_at" bigint,
	"category" varchar(100),
	"is_anonymous" boolean DEFAULT false,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webcast_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(200),
	"job_title" varchar(200),
	"phone" varchar(50),
	"country" varchar(100),
	"custom_fields" text,
	"attended" boolean DEFAULT false,
	"joined_at" bigint,
	"left_at" bigint,
	"watch_time_seconds" integer DEFAULT 0,
	"engagement_score" integer DEFAULT 0,
	"registration_source" varchar(100) DEFAULT 'direct',
	"utm_source" varchar(100),
	"attendee_token" varchar(64),
	"registered_at" bigint NOT NULL,
	"reminder_24_sent_at" bigint,
	"reminder_1_sent_at" bigint
);
--> statement-breakpoint
CREATE TABLE "webphone_carrier_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"carrier" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'healthy' NOT NULL,
	"failover_active" boolean DEFAULT false NOT NULL,
	"last_checked_at" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webphone_carrier_status_carrier_unique" UNIQUE("carrier")
);
--> statement-breakpoint
CREATE TABLE "webphone_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"conference_id" integer,
	"carrier" varchar(64) DEFAULT 'twilio' NOT NULL,
	"status" varchar(64) DEFAULT 'initiated' NOT NULL,
	"direction" varchar(64) DEFAULT 'outbound' NOT NULL,
	"remote_number" varchar(32),
	"call_sid" varchar(128),
	"duration_secs" integer,
	"recording_sid" varchar(128),
	"recording_url" varchar(512),
	"recording_status" varchar(64),
	"is_voicemail" boolean DEFAULT false NOT NULL,
	"voicemail_url" varchar(512),
	"voicemail_duration" integer,
	"transcription" text,
	"transcription_language" varchar(16),
	"transcription_status" varchar(64),
	"transferred_to" varchar(128),
	"transfer_type" varchar(64),
	"started_at" bigint NOT NULL,
	"ended_at" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "white_label_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"logo_url" text,
	"primary_color" varchar(7) DEFAULT '#000000',
	"secondary_color" varchar(7) DEFAULT '#ffffff',
	"accent_color" varchar(7) DEFAULT '#007bff',
	"custom_domain" varchar(255),
	"contact_email" varchar(320),
	"contact_name" varchar(255),
	"billing_tier" varchar(64) DEFAULT 'starter' NOT NULL,
	"max_concurrent_events" integer DEFAULT 1,
	"max_monthly_events" integer DEFAULT 5,
	"features_enabled" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "white_label_clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agm_shareholder_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"resolution_id" integer,
	"signal_type" varchar(50) NOT NULL,
	"speaker" varchar(200),
	"segment_text" text,
	"confidence" real,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approved_questions_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"question_id" integer,
	"question_text" text NOT NULL,
	"asker_name" varchar(200),
	"asker_firm" varchar(200),
	"ai_suggested_answer" text,
	"status" varchar(30) DEFAULT 'queued',
	"queued_at" timestamp DEFAULT now(),
	"answered_at" timestamp,
	"operator_id" integer
);
--> statement-breakpoint
CREATE TABLE "board_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(100),
	"committee" varchar(100),
	"appointed_at" timestamp,
	"bio" text,
	"linkedin_url" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "briefing_accuracy_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"overall_score" real,
	"topics_covered" integer,
	"topics_missed" integer,
	"sentiment_accuracy" real,
	"key_metrics_accuracy" real,
	"scored_at" timestamp DEFAULT now(),
	"detail" json
);
--> statement-breakpoint
CREATE TABLE "client_report_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"token" varchar(128),
	"rating" integer,
	"comment" text,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_report_view_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"session_id" integer,
	"tab_viewed" varchar(50),
	"time_spent_secs" integer DEFAULT 0,
	"ip_address" varchar(64),
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_deadlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"action" text NOT NULL,
	"jurisdiction" varchar(30),
	"deadline_at" timestamp NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" varchar(320),
	"status" varchar(30) DEFAULT 'pending',
	"escalated_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "historical_commitments" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"commitment" text NOT NULL,
	"made_at" timestamp,
	"deadline" timestamp,
	"session_id" integer,
	"status" varchar(30) DEFAULT 'pending',
	"verified_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'demo' NOT NULL,
	"billing_type" varchar(20) DEFAULT 'demo' NOT NULL,
	"subscription_amount" integer,
	"per_event_price" integer,
	"billing_contact_email" varchar(255),
	"ir_contact_email" varchar(255),
	"pilot_events_total" integer DEFAULT 3,
	"pilot_events_used" integer DEFAULT 0,
	"pilot_notes" text,
	"followup_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"company" varchar(255),
	"event_type" varchar(50) DEFAULT 'earnings_call',
	"scheduled_at" timestamp NOT NULL,
	"tier" varchar(20) DEFAULT 'essential',
	"partner_id" integer,
	"recipients" json DEFAULT '[]'::json,
	"meeting_url" text,
	"pre_brief_sent_at" timestamp,
	"session_created_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"from_operator_id" integer NOT NULL,
	"to_operator_id" integer,
	"reason" text,
	"status" varchar(30) DEFAULT 'pending',
	"handoff_at" timestamp DEFAULT now(),
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"segment_text" text NOT NULL,
	"operator_note" text,
	"flag_type" varchar(30) DEFAULT 'notable',
	"speaker" varchar(200),
	"event_timestamp" integer,
	"operator_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"from_role" varchar(30) NOT NULL,
	"from_name" varchar(200),
	"message" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_operators" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"operator_id" integer NOT NULL,
	"role" varchar(30) DEFAULT 'secondary',
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session_readiness_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"check_name" varchar(100) NOT NULL,
	"passed" boolean DEFAULT false,
	"detail" text,
	"checked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_report_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"tab_viewed" varchar(50),
	"time_spent_secs" integer DEFAULT 0,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"session_id" integer NOT NULL,
	"partner_id" integer,
	"recipient_name" varchar(255),
	"recipient_email" varchar(320),
	"recipient_role" varchar(100),
	"access_type" varchar(30) DEFAULT 'live' NOT NULL,
	"expires_at" timestamp,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "client_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "partner_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"session_id" integer,
	"event_type" varchar(50),
	"detail" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"logo_url" text,
	"primary_color" varchar(10) DEFAULT '#1a1a2e',
	"accent_color" varchar(10) DEFAULT '#0A2540',
	"font_family" varchar(100),
	"model" varchar(30) DEFAULT 'revenue_share',
	"revenue_share_pct" integer DEFAULT 20,
	"custom_domain" varchar(255),
	"custom_domain_verified" boolean DEFAULT false,
	"sending_domain" varchar(255),
	"sending_name" varchar(255),
	"sending_email" varchar(320),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "partners_slug_unique" UNIQUE("slug")
);
