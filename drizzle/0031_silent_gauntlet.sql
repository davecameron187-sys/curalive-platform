CREATE TABLE `client_portals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`is_published` boolean NOT NULL DEFAULT false,
	`custom_title` varchar(512),
	`custom_description` text,
	`password_protected` boolean NOT NULL DEFAULT false,
	`access_code` varchar(64),
	`view_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_portals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`logo_url` text,
	`primary_color` varchar(16) NOT NULL DEFAULT '#6c3fc5',
	`secondary_color` varchar(16) NOT NULL DEFAULT '#1a1a2e',
	`custom_domain` varchar(255),
	`contact_email` varchar(320),
	`billing_tier` enum('starter','professional','enterprise') NOT NULL DEFAULT 'professional',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `event_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`scheduled_start` timestamp NOT NULL,
	`scheduled_end` timestamp NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
	`recurrence_rule` varchar(512),
	`parent_schedule_id` int,
	`setup_minutes` int NOT NULL DEFAULT 30,
	`teardown_minutes` int NOT NULL DEFAULT 15,
	`status` enum('tentative','confirmed','cancelled') NOT NULL DEFAULT 'tentative',
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_name` varchar(255) NOT NULL,
	`created_by` int NOT NULL,
	`event_type` enum('earnings_call','investor_day','roadshow','webcast','audio_bridge','board_briefing') NOT NULL,
	`default_duration_minutes` int NOT NULL DEFAULT 60,
	`default_setup_minutes` int NOT NULL DEFAULT 30,
	`default_features` text,
	`default_platform` enum('zoom','teams','webex','rtmp','pstn') NOT NULL DEFAULT 'pstn',
	`dial_in_countries` text,
	`max_attendees` int NOT NULL DEFAULT 500,
	`requires_registration` boolean NOT NULL DEFAULT true,
	`compliance_enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operator_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operator_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` varchar(8) NOT NULL,
	`end_time` varchar(8) NOT NULL,
	`is_available` boolean NOT NULL DEFAULT true,
	`override_date` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operator_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poll_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poll_id` int NOT NULL,
	`option_text` varchar(512) NOT NULL,
	`option_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poll_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poll_id` int NOT NULL,
	`option_id` int,
	`voter_id` int,
	`voter_session` varchar(128),
	`text_response` text,
	`rating_value` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poll_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`created_by` int NOT NULL,
	`question` text NOT NULL,
	`poll_type` enum('multiple_choice','rating_scale','word_cloud','yes_no') NOT NULL DEFAULT 'multiple_choice',
	`status` enum('draft','active','closed','archived') NOT NULL DEFAULT 'draft',
	`allow_multiple` boolean NOT NULL DEFAULT false,
	`is_anonymous` boolean NOT NULL DEFAULT true,
	`scheduled_at` timestamp,
	`opened_at` timestamp,
	`closed_at` timestamp,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `polls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_event_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`generated_by` int NOT NULL,
	`report_type` enum('full','executive','compliance') NOT NULL DEFAULT 'full',
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`ai_summary` longtext,
	`key_moments` longtext,
	`sentiment_overview` longtext,
	`qa_summary` longtext,
	`engagement_metrics` longtext,
	`compliance_flags` longtext,
	`full_transcript_url` text,
	`pdf_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_event_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`resource_type` enum('dial_in_number','rtmp_key','mux_stream','recall_bot','ably_channel') NOT NULL,
	`resource_identifier` varchar(256) NOT NULL,
	`allocated_at` timestamp NOT NULL DEFAULT (now()),
	`released_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcription_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`source` enum('forge_ai','whisper','manual') NOT NULL DEFAULT 'forge_ai',
	`status` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
	`language_detected` varchar(16),
	`languages_requested` text,
	`audio_url` text,
	`duration_seconds` int,
	`word_count` int,
	`confidence_score` varchar(8),
	`speaker_count` int,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcription_jobs_id` PRIMARY KEY(`id`)
);
